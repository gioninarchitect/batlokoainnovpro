import prisma from '../config/database.js';
import { generateInvoicePDF } from '../services/pdf.service.js';
import { sendEmail, emailTemplates } from '../services/email.service.js';

const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
  });
  const num = last ? parseInt(last.invoiceNumber.split('-').pop()) + 1 : 1;
  return `${prefix}${String(num).padStart(5, '0')}`;
};

export const listInvoices = async (req, res, next) => {
  try {
    const { status, customerId, overdue, search, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (overdue === 'true') {
      where.status = { in: ['SENT', 'PARTIAL'] };
      where.dueDate = { lt: new Date() };
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { company: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, company: true, email: true } },
          order: { select: { orderNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ invoices, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
      include: {
        customer: true,
        order: { include: { items: { include: { product: true } } } },
        payments: { orderBy: { receivedAt: 'desc' } },
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const { orderId, dueDate, notes } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { invoices: true },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.invoices.length > 0) {
      return res.status(400).json({ error: 'Invoice already exists for this order' });
    }

    const invoiceNumber = await generateInvoiceNumber();
    const due = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        customerId: order.customerId,
        subtotal: order.subtotal,
        vatAmount: order.vatAmount,
        total: order.total,
        balance: order.total,
        dueDate: due,
        notes,
      },
      include: { customer: true, order: true },
    });

    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
};

export const sendInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get full invoice with order items for PDF
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        order: { include: { items: { include: { product: true } } } },
        payments: true,
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Prepare email template data
    const emailData = {
      invoiceNumber: invoice.invoiceNumber,
      customer: {
        companyName: invoice.customer?.company ||
          `${invoice.customer?.firstName || ''} ${invoice.customer?.lastName || ''}`.trim() ||
          'Customer'
      },
      amountDue: invoice.balance || invoice.total,
      dueDate: invoice.dueDate,
    };

    // Send email with PDF attachment
    const template = emailTemplates.invoiceSent(emailData);
    await sendEmail({
      to: invoice.customer.email,
      subject: template.subject,
      html: template.html,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
      include: { customer: true, order: true },
    });

    res.json({ ...updatedInvoice, emailSent: true });
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, method, reference, notes, receivedAt } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (amount > Number(invoice.balance)) {
      return res.status(400).json({ error: 'Payment exceeds balance' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          invoiceId: id,
          amount,
          method: method || 'EFT',
          reference,
          notes,
          receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
        },
      });

      // Update invoice
      const newAmountPaid = Number(invoice.amountPaid) + amount;
      const newBalance = Number(invoice.total) - newAmountPaid;
      const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date() : undefined,
        },
        include: { customer: true, payments: true },
      });

      // Update customer stats
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: { totalSpent: { increment: amount } },
      });

      // Update order payment status
      await tx.order.update({
        where: { id: invoice.orderId },
        data: { paymentStatus: newStatus === 'PAID' ? 'PAID' : 'PARTIAL' },
      });

      return { invoice: updatedInvoice, payment };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const generatePDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        order: { include: { items: { include: { product: true } } } },
        payments: true,
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const getInvoiceStats = async (req, res, next) => {
  try {
    const [totals, byStatus, overdue] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { total: true, amountPaid: true, balance: true },
        _count: true,
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        _count: true,
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          status: { in: ['SENT', 'PARTIAL'] },
          dueDate: { lt: new Date() },
        },
        _sum: { balance: true },
        _count: true,
      }),
    ]);

    res.json({
      totalInvoices: totals._count,
      totalBilled: totals._sum.total || 0,
      totalCollected: totals._sum.amountPaid || 0,
      totalOutstanding: totals._sum.balance || 0,
      overdueCount: overdue._count,
      overdueAmount: overdue._sum.balance || 0,
      byStatus: byStatus.reduce((acc, s) => {
        acc[s.status] = { count: s._count, total: s._sum.total };
        return acc;
      }, {}),
    });
  } catch (error) {
    next(error);
  }
};

export const getOverdueInvoices = async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'PARTIAL'] },
        dueDate: { lt: new Date() },
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, company: true, email: true, phone: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const enriched = invoices.map(inv => ({
      ...inv,
      daysOverdue: Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24)),
    }));

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};
