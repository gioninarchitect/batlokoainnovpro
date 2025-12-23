import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAudit, AuditActions } from '../services/audit.service.js';

const router = Router();

// Get all suppliers
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit),
        include: {
          _count: { select: { purchaseOrders: true } },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    res.json({
      suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Get single supplier
router.get('/:id', authenticate, async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            poNumber: true,
            status: true,
            total: true,
            orderDate: true,
          },
        },
        _count: { select: { purchaseOrders: true } },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

// Create supplier
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      email,
      phone,
      website,
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      country,
      bankName,
      bankAccount,
      bankBranch,
      paymentTerms,
      leadTime,
      categories,
      notes,
    } = req.body;

    // Generate supplier code
    const lastSupplier = await prisma.supplier.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    let nextNum = 1;
    if (lastSupplier?.code) {
      const match = lastSupplier.code.match(/SUP-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    const code = `SUP-${String(nextNum).padStart(4, '0')}`;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        code,
        contactPerson,
        email,
        phone,
        website,
        addressLine1,
        addressLine2,
        city,
        province,
        postalCode,
        country,
        bankName,
        bankAccount,
        bankBranch,
        paymentTerms: paymentTerms ? parseInt(paymentTerms) : 30,
        leadTime: leadTime ? parseInt(leadTime) : 7,
        categories: categories || [],
        notes,
      },
    });

    logAudit({
      userId: req.user?.id,
      action: 'SUPPLIER_CREATED',
      entityType: 'supplier',
      entityId: supplier.id,
      description: `Created supplier ${supplier.code} - ${supplier.name}`,
      ipAddress: req.ip,
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      email,
      phone,
      website,
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      country,
      bankName,
      bankAccount,
      bankBranch,
      paymentTerms,
      leadTime,
      categories,
      isActive,
      rating,
      notes,
    } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        name,
        contactPerson,
        email,
        phone,
        website,
        addressLine1,
        addressLine2,
        city,
        province,
        postalCode,
        country,
        bankName,
        bankAccount,
        bankBranch,
        paymentTerms: paymentTerms !== undefined ? parseInt(paymentTerms) : undefined,
        leadTime: leadTime !== undefined ? parseInt(leadTime) : undefined,
        categories,
        isActive,
        rating: rating !== undefined ? parseInt(rating) : undefined,
        notes,
      },
    });

    logAudit({
      userId: req.user?.id,
      action: 'SUPPLIER_UPDATED',
      entityType: 'supplier',
      entityId: supplier.id,
      description: `Updated supplier ${supplier.code} - ${supplier.name}`,
      ipAddress: req.ip,
    });

    res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { purchaseOrders: true } } },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    if (supplier._count.purchaseOrders > 0) {
      return res.status(400).json({
        error: 'Cannot delete supplier with existing purchase orders. Deactivate instead.',
      });
    }

    await prisma.supplier.delete({ where: { id: req.params.id } });

    logAudit({
      userId: req.user?.id,
      action: 'SUPPLIER_DELETED',
      entityType: 'supplier',
      entityId: req.params.id,
      description: `Deleted supplier ${supplier.code} - ${supplier.name}`,
      ipAddress: req.ip,
    });

    res.json({ message: 'Supplier deleted' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;
