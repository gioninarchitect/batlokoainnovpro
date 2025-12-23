import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAudit } from '../services/audit.service.js';

const router = Router();

// Get all purchase orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, supplierId, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          supplier: { select: { id: true, name: true, code: true } },
          items: true,
          _count: { select: { receivings: true } },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({
      purchaseOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Get single purchase order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        items: true,
        receivings: {
          include: { items: true },
          orderBy: { receivedDate: 'desc' },
        },
      },
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

// Create purchase order
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const {
      supplierId,
      items,
      expectedDate,
      notes,
      internalNotes,
    } = req.body;

    if (!supplierId) {
      return res.status(400).json({ error: 'Supplier is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Generate PO number
    const lastPO = await prisma.purchaseOrder.findFirst({
      orderBy: { poNumber: 'desc' },
      select: { poNumber: true },
    });

    let nextNum = 1;
    if (lastPO?.poNumber) {
      const match = lastPO.poNumber.match(/PO-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    const poNumber = `PO-${String(nextNum).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const poItems = items.map((item) => {
      const itemTotal = Number(item.unitPrice) * Number(item.quantity);
      subtotal += itemTotal;
      return {
        productId: item.productId || null,
        description: item.description,
        sku: item.sku || null,
        quantity: parseInt(item.quantity),
        unitPrice: item.unitPrice,
        total: itemTotal,
        notes: item.notes || null,
      };
    });

    const vatAmount = subtotal * 0.15;
    const total = subtotal + vatAmount;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        subtotal,
        vatAmount,
        total,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        internalNotes,
        createdById: req.user?.id,
        items: {
          create: poItems,
        },
      },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        items: true,
      },
    });

    logAudit({
      userId: req.user?.id,
      action: 'PO_CREATED',
      entityType: 'purchaseOrder',
      entityId: purchaseOrder.id,
      description: `Created PO ${purchaseOrder.poNumber} for R${total.toFixed(2)}`,
      metadata: { poNumber: purchaseOrder.poNumber, supplierId, total },
      ipAddress: req.ip,
    });

    res.status(201).json(purchaseOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Update purchase order
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { items, expectedDate, notes, internalNotes } = req.body;

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    if (!['DRAFT'].includes(existing.status)) {
      return res.status(400).json({ error: 'Cannot edit a sent or confirmed PO' });
    }

    // If items are provided, recalculate totals
    let updateData = {
      expectedDate: expectedDate ? new Date(expectedDate) : undefined,
      notes,
      internalNotes,
    };

    if (items && items.length > 0) {
      // Delete existing items
      await prisma.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: req.params.id },
      });

      // Calculate new totals
      let subtotal = 0;
      const poItems = items.map((item) => {
        const itemTotal = Number(item.unitPrice) * Number(item.quantity);
        subtotal += itemTotal;
        return {
          purchaseOrderId: req.params.id,
          productId: item.productId || null,
          description: item.description,
          sku: item.sku || null,
          quantity: parseInt(item.quantity),
          unitPrice: item.unitPrice,
          total: itemTotal,
          notes: item.notes || null,
        };
      });

      const vatAmount = subtotal * 0.15;
      const total = subtotal + vatAmount;

      // Create new items
      await prisma.purchaseOrderItem.createMany({ data: poItems });

      updateData.subtotal = subtotal;
      updateData.vatAmount = vatAmount;
      updateData.total = total;
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        items: true,
      },
    });

    logAudit({
      userId: req.user?.id,
      action: 'PO_UPDATED',
      entityType: 'purchaseOrder',
      entityId: purchaseOrder.id,
      description: `Updated PO ${purchaseOrder.poNumber}`,
      ipAddress: req.ip,
    });

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

// Update PO status
router.patch('/:id/status', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIAL', 'RECEIVED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const updateData = { status };

    if (status === 'SENT' && !existing.sentAt) {
      updateData.sentAt = new Date();
    }
    if (status === 'CONFIRMED' && !existing.confirmedAt) {
      updateData.confirmedAt = new Date();
    }
    if (status === 'RECEIVED' && !existing.receivedDate) {
      updateData.receivedDate = new Date();
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        items: true,
      },
    });

    // Update supplier stats if received
    if (status === 'RECEIVED') {
      await prisma.supplier.update({
        where: { id: purchaseOrder.supplierId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: purchaseOrder.total },
          lastOrderDate: new Date(),
        },
      });
    }

    logAudit({
      userId: req.user?.id,
      action: 'PO_STATUS_CHANGED',
      entityType: 'purchaseOrder',
      entityId: purchaseOrder.id,
      description: `Changed PO ${purchaseOrder.poNumber} status to ${status}`,
      metadata: { fromStatus: existing.status, toStatus: status },
      ipAddress: req.ip,
    });

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error updating PO status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Receive stock against PO
router.post('/:id/receive', authenticate, authorize('ADMIN', 'MANAGER', 'STAFF'), async (req, res) => {
  try {
    const { items, notes } = req.body;

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    if (!['SENT', 'CONFIRMED', 'PARTIAL'].includes(purchaseOrder.status)) {
      return res.status(400).json({ error: 'Cannot receive stock for this PO status' });
    }

    // Create receiving record
    const receiving = await prisma.stockReceiving.create({
      data: {
        purchaseOrderId: req.params.id,
        receivedById: req.user?.id,
        notes,
        items: {
          create: items.map((item) => ({
            productId: item.productId || null,
            description: item.description,
            quantityReceived: parseInt(item.quantityReceived),
            quantityAccepted: parseInt(item.quantityAccepted),
            quantityRejected: parseInt(item.quantityRejected) || 0,
            rejectionReason: item.rejectionReason || null,
          })),
        },
      },
      include: { items: true },
    });

    // Update PO item received quantities
    for (const item of items) {
      if (item.poItemId) {
        await prisma.purchaseOrderItem.update({
          where: { id: item.poItemId },
          data: {
            quantityReceived: {
              increment: parseInt(item.quantityReceived),
            },
          },
        });
      }

      // Update product stock if productId provided
      if (item.productId && item.quantityAccepted > 0) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQty: { increment: parseInt(item.quantityAccepted) },
          },
        });
      }
    }

    // Check if fully received
    const updatedPO = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    const allReceived = updatedPO.items.every(
      (item) => item.quantityReceived >= item.quantity
    );

    await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: {
        status: allReceived ? 'RECEIVED' : 'PARTIAL',
        receivedDate: allReceived ? new Date() : null,
      },
    });

    // Update supplier stats if fully received
    if (allReceived) {
      await prisma.supplier.update({
        where: { id: purchaseOrder.supplierId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: purchaseOrder.total },
          lastOrderDate: new Date(),
        },
      });
    }

    logAudit({
      userId: req.user?.id,
      action: 'STOCK_RECEIVED',
      entityType: 'purchaseOrder',
      entityId: purchaseOrder.id,
      description: `Received stock for PO ${purchaseOrder.poNumber}`,
      metadata: { receivingId: receiving.id, itemCount: items.length },
      ipAddress: req.ip,
    });

    res.status(201).json(receiving);
  } catch (error) {
    console.error('Error receiving stock:', error);
    res.status(500).json({ error: 'Failed to receive stock' });
  }
});

// Delete purchase order (draft only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    if (purchaseOrder.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only delete draft purchase orders' });
    }

    await prisma.purchaseOrder.delete({ where: { id: req.params.id } });

    logAudit({
      userId: req.user?.id,
      action: 'PO_DELETED',
      entityType: 'purchaseOrder',
      entityId: req.params.id,
      description: `Deleted PO ${purchaseOrder.poNumber}`,
      ipAddress: req.ip,
    });

    res.json({ message: 'Purchase order deleted' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

export default router;
