import prisma from '../config/database.js';

const generateQuoteNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `QUO-${year}-`;
  const last = await prisma.quote.findFirst({
    where: { quoteNumber: { startsWith: prefix } },
    orderBy: { quoteNumber: 'desc' },
  });
  const num = last ? parseInt(last.quoteNumber.split('-').pop()) + 1 : 1;
  return `${prefix}${String(num).padStart(5, '0')}`;
};

export const listQuotes = async (req, res, next) => {
  try {
    const { status, customerId, search, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerCompany: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, company: true } },
          items: true,
          createdBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({ quotes, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getQuote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findFirst({
      where: { OR: [{ id }, { quoteNumber: id }] },
      include: {
        customer: true,
        items: { include: { product: true } },
        createdBy: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json(quote);
  } catch (error) {
    next(error);
  }
};

export const createQuote = async (req, res, next) => {
  try {
    const {
      customerId, customerName, customerEmail, customerPhone, customerCompany,
      items, validDays, deliveryAddress, deliveryCity, deliveryNotes, notes, internalNotes,
    } = req.body;

    // Get customer if ID provided
    let customer = null;
    if (customerId) {
      customer = await prisma.customer.findUnique({ where: { id: customerId } });
    }

    // Calculate totals
    let subtotal = 0;
    const quoteItems = [];

    for (const item of items) {
      const product = item.productId ? await prisma.product.findUnique({ where: { id: item.productId } }) : null;
      const unitPrice = item.unitPrice || product?.price || 0;
      const total = unitPrice * item.quantity;
      subtotal += total;

      quoteItems.push({
        productId: item.productId,
        description: item.description || product?.name || 'Custom Item',
        quantity: item.quantity,
        unitPrice,
        total,
        notes: item.notes,
      });
    }

    const vatAmount = subtotal * 0.15;
    const total = subtotal + vatAmount;

    const quoteNumber = await generateQuoteNumber();
    const validUntil = new Date(Date.now() + (validDays || 30) * 24 * 60 * 60 * 1000);

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId,
        customerName: customerName || (customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown'),
        customerEmail: customerEmail || customer?.email || '',
        customerPhone: customerPhone || customer?.phone || '',
        customerCompany: customerCompany || customer?.company,
        deliveryAddress,
        deliveryCity,
        deliveryNotes,
        subtotal,
        vatAmount,
        total,
        validUntil,
        notes,
        internalNotes,
        createdById: req.user?.id,
        items: { create: quoteItems },
      },
      include: { customer: true, items: true },
    });

    res.status(201).json(quote);
  } catch (error) {
    next(error);
  }
};

export const updateQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes, internalNotes, validUntil, discount } = req.body;

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    let updateData = { notes, internalNotes };
    if (validUntil) updateData.validUntil = new Date(validUntil);

    if (discount !== undefined) {
      const newTotal = Number(quote.subtotal) - discount + Number(quote.vatAmount);
      updateData.discount = discount;
      updateData.total = newTotal;
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: { customer: true, items: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const sendQuote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
      include: { customer: true, items: true },
    });

    // TODO: Send email with quote PDF

    res.json(quote);
  } catch (error) {
    next(error);
  }
};

export const convertToOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (quote.status === 'CONVERTED') return res.status(400).json({ error: 'Quote already converted' });

    // Generate order number
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    const last = await prisma.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
    });
    const num = last ? parseInt(last.orderNumber.split('-').pop()) + 1 : 1;
    const orderNumber = `${prefix}${String(num).padStart(5, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      let customerId = quote.customerId;

      // If no customer linked, create one from quote info
      if (!customerId) {
        // Parse name into first/last
        const nameParts = (quote.customerName || 'Unknown Customer').split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'Customer';

        // Check if customer with same email exists
        let existingCustomer = null;
        if (quote.customerEmail) {
          existingCustomer = await tx.customer.findUnique({
            where: { email: quote.customerEmail },
          });
        }

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const newCustomer = await tx.customer.create({
            data: {
              firstName,
              lastName,
              email: quote.customerEmail || `customer-${Date.now()}@temp.local`,
              phone: quote.customerPhone || '',
              company: quote.customerCompany,
              addressLine1: quote.deliveryAddress,
              city: quote.deliveryCity,
              tags: ['Quote-Converted'],
              source: 'QUOTE',
            },
          });
          customerId = newCustomer.id;
        }

        // Link customer to quote
        await tx.quote.update({
          where: { id },
          data: { customerId },
        });
      }

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          deliveryAddress: quote.deliveryAddress || '',
          deliveryCity: quote.deliveryCity || '',
          deliveryNotes: quote.deliveryNotes,
          subtotal: quote.subtotal,
          vatAmount: quote.vatAmount,
          discount: quote.discount,
          total: quote.total,
          notes: quote.notes,
          quoteId: quote.id,
          createdById: req.user?.id,
          items: {
            create: quote.items.map(item => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
        include: { customer: true, items: true },
      });

      // Update quote status
      await tx.quote.update({
        where: { id },
        data: { status: 'CONVERTED', convertedAt: new Date(), orderId: order.id },
      });

      // Update customer stats
      await tx.customer.update({
        where: { id: customerId },
        data: { totalOrders: { increment: 1 }, lastOrderDate: new Date() },
      });

      return order;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteQuote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (quote?.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only delete pending quotes' });
    }

    await prisma.quote.delete({ where: { id } });
    res.json({ message: 'Quote deleted' });
  } catch (error) {
    next(error);
  }
};

// Public: Submit quote request from website (no auth required)
export const submitQuoteRequest = async (req, res, next) => {
  try {
    const {
      customerName, customerEmail, customerPhone, customerCompany,
      deliveryAddress, deliveryCity, notes, items
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({ error: 'Name, email and phone are required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Calculate totals (prices are 0 for quote requests - admin will set them)
    const quoteItems = items.map(item => ({
      description: item.title || item.description || 'Product',
      quantity: item.quantity || 1,
      unitPrice: 0,
      total: 0,
      notes: item.notes || null,
    }));

    const quoteNumber = await generateQuoteNumber();
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerName,
        customerEmail,
        customerPhone,
        customerCompany: customerCompany || null,
        deliveryAddress: deliveryAddress || null,
        deliveryCity: deliveryCity || null,
        deliveryNotes: notes || null,
        subtotal: 0,
        vatAmount: 0,
        total: 0,
        validUntil,
        notes: notes || null,
        status: 'PENDING',
        items: { create: quoteItems },
      },
      include: { items: true },
    });

    res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully',
      quoteNumber: quote.quoteNumber,
      quoteId: quote.id,
    });
  } catch (error) {
    next(error);
  }
};
