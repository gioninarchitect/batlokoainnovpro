import prisma from '../config/database.js';
import { sendAdminAlert } from '../services/whatsapp.service.js';

const generateOrderNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const last = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
  });
  const num = last ? parseInt(last.orderNumber.split('-').pop()) + 1 : 1;
  return `${prefix}${String(num).padStart(5, '0')}`;
};

export const listOrders = async (req, res, next) => {
  try {
    const { status, customerId, search, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { company: { contains: search, mode: 'insensitive' } } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, company: true, email: true, phone: true } },
          items: { include: { product: { select: { name: true, sku: true } } } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        customer: true,
        items: { include: { product: true } },
        invoices: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const {
      customerId, items,
      deliveryAddress, deliveryCity, deliveryProvince, deliveryPostalCode, deliveryNotes,
      paymentMethod, notes, internalNotes, priority, source,
    } = req.body;

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = item.productId ? await prisma.product.findUnique({ where: { id: item.productId } }) : null;
      const unitPrice = item.unitPrice || product?.price || 0;
      const total = unitPrice * item.quantity;
      subtotal += total;

      orderItems.push({
        productId: item.productId,
        description: item.description || product?.name || 'Custom Item',
        sku: item.sku || product?.sku,
        quantity: item.quantity,
        unitPrice,
        total,
        notes: item.notes,
      });
    }

    const vatAmount = subtotal * 0.15;
    const total = subtotal + vatAmount;

    const orderNumber = await generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          deliveryAddress,
          deliveryCity,
          deliveryProvince,
          deliveryPostalCode,
          deliveryNotes,
          subtotal,
          vatAmount,
          total,
          paymentMethod: paymentMethod || 'EFT',
          notes,
          internalNotes,
          priority: priority || 'NORMAL',
          source: source || 'WEBSITE',
          createdById: req.user?.id,
          items: { create: orderItems },
        },
        include: { customer: true, items: true },
      });

      // Record status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          toStatus: 'PENDING',
          notes: 'Order created',
          changedBy: req.user?.id,
        },
      });

      // Update customer stats
      await tx.customer.update({
        where: { id: customerId },
        data: { totalOrders: { increment: 1 }, lastOrderDate: new Date() },
      });

      return newOrder;
    });

    // Send admin alert
    sendAdminAlert({
      type: 'new_order',
      orderNumber: order.orderNumber,
      orderId: order.id,
      customerName: order.customer.company || `${order.customer.firstName} ${order.customer.lastName}`,
      customerId: order.customerId,
      total: Number(order.total),
      itemCount: order.items.length,
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
        include: { customer: true, items: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: status,
          notes,
          changedBy: req.user?.id,
        },
      });

      // Deduct stock when confirmed
      if (status === 'CONFIRMED' && order.status === 'PENDING') {
        for (const item of updatedOrder.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: { decrement: item.quantity } },
            });
          }
        }
      }

      return updatedOrder;
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deliveryAddress, deliveryCity, deliveryNotes, notes, internalNotes, priority } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { deliveryAddress, deliveryCity, deliveryNotes, notes, internalNotes, priority },
      include: { customer: true, items: true },
    });

    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totals, byStatus, todayOrders, recentOrders, pendingPOP] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
        _sum: { total: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { company: true, firstName: true, lastName: true } } },
      }),
      // Count orders with POP uploaded but not verified
      prisma.order.count({
        where: {
          popFile: { not: null },
          popVerified: false,
          paymentStatus: 'UNPAID',
        },
      }),
    ]);

    res.json({
      totalOrders: totals._count,
      totalRevenue: totals._sum.total || 0,
      todayOrders,
      pendingPOP,
      byStatus: byStatus.reduce((acc, s) => {
        acc[s.status] = { count: s._count, total: s._sum.total };
        return acc;
      }, {}),
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

// Upload Proof of Payment
export const uploadPOP = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updated = await prisma.order.update({
      where: { id },
      data: {
        popFile: `/uploads/pop/${req.file.filename}`,
        popFileName: req.file.originalname,
        popUploadedAt: new Date(),
        popVerified: false,
        status: 'AWAITING_PAYMENT',
      },
    });

    // Send admin alert about POP upload
    sendAdminAlert({
      type: 'pop_uploaded',
      orderNumber: order.orderNumber,
      orderId: order.id,
      message: `Proof of payment uploaded for order ${order.orderNumber}`,
    });

    res.json({ success: true, message: 'Proof of payment uploaded', order: updated });
  } catch (error) {
    next(error);
  }
};

// Admin: Approve POP
export const approvePOP = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          popVerified: true,
          popVerifiedBy: req.user.id,
          popVerifiedAt: new Date(),
          paymentStatus: 'PAID',
          paidAt: new Date(),
          status: 'PAYMENT_RECEIVED',
        },
        include: { customer: true },
      });

      // Record status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: 'PAYMENT_RECEIVED',
          notes: notes || 'Payment approved - POP verified',
          changedBy: req.user.id,
        },
      });

      return updatedOrder;
    });

    res.json({ success: true, message: 'Payment approved', order: updated });
  } catch (error) {
    next(error);
  }
};

// Admin: Reject POP
export const rejectPOP = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          popVerified: false,
          popRejectionReason: reason,
          status: 'PENDING',
        },
        include: { customer: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: 'PENDING',
          notes: `POP rejected: ${reason}`,
          changedBy: req.user.id,
        },
      });

      return updatedOrder;
    });

    res.json({ success: true, message: 'Payment rejected', order: updated });
  } catch (error) {
    next(error);
  }
};

// Admin: Dispatch order
export const dispatchOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trackingNumber, courier, notes } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'DISPATCHED',
          dispatchedAt: new Date(),
          internalNotes: order.internalNotes
            ? `${order.internalNotes}\n\nDispatched: ${courier || 'N/A'} - ${trackingNumber || 'N/A'}`
            : `Dispatched: ${courier || 'N/A'} - ${trackingNumber || 'N/A'}`,
        },
        include: { customer: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: 'DISPATCHED',
          notes: notes || `Dispatched via ${courier || 'courier'}. Tracking: ${trackingNumber || 'N/A'}`,
          changedBy: req.user.id,
        },
      });

      return updatedOrder;
    });

    res.json({ success: true, message: 'Order dispatched', order: updated });
  } catch (error) {
    next(error);
  }
};
