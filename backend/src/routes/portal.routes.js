import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import config from '../config/index.js';
import { sendEmail, emailTemplates } from '../services/email.service.js';
import { generateInvoicePDF } from '../services/pdf.service.js';

const router = Router();

// Customer authentication middleware
const authenticateCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    if (decoded.type !== 'customer') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
    });

    if (!customer) {
      return res.status(401).json({ error: 'Customer not found' });
    }

    req.customer = customer;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// =====================
// AUTH ROUTES
// =====================

// Customer login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer || !customer.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, customer.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { customerId: customer.id, email: customer.email, type: 'customer' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        company: customer.company,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Customer registration
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, company } = req.body;

    // Check if customer already exists
    const existing = await prisma.customer.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.password) {
        return res.status(400).json({ error: 'Account already exists' });
      }
      // Customer exists but no password - update with password
      const hashedPassword = await bcrypt.hash(password, 12);
      const updated = await prisma.customer.update({
        where: { email },
        data: { password: hashedPassword },
      });

      const token = jwt.sign(
        { customerId: updated.id, email: updated.email, type: 'customer' },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return res.json({
        token,
        customer: {
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          company: updated.company,
          phone: updated.phone,
        },
      });
    }

    // Create new customer
    const hashedPassword = await bcrypt.hash(password, 12);
    const customer = await prisma.customer.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        company,
      },
    });

    const token = jwt.sign(
      { customerId: customer.id, email: customer.email, type: 'customer' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        company: customer.company,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current customer
router.get('/auth/me', authenticateCustomer, async (req, res) => {
  res.json({
    id: req.customer.id,
    email: req.customer.email,
    firstName: req.customer.firstName,
    lastName: req.customer.lastName,
    company: req.customer.company,
    phone: req.customer.phone,
    addressLine1: req.customer.addressLine1,
    addressLine2: req.customer.addressLine2,
    city: req.customer.city,
    province: req.customer.province,
    postalCode: req.customer.postalCode,
  });
});

// =====================
// DASHBOARD
// =====================

router.get('/dashboard', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;

    // Get counts and recent data
    const [
      ordersCount,
      quotesCount,
      pendingOrders,
      recentOrders,
      recentQuotes,
      unpaidInvoices,
    ] = await Promise.all([
      prisma.order.count({ where: { customerId } }),
      prisma.quote.count({ where: { customerId } }),
      prisma.order.count({
        where: {
          customerId,
          status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DISPATCH'] },
        },
      }),
      prisma.order.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),
      prisma.quote.findMany({
        where: { customerId, status: { in: ['PENDING', 'SENT'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          quoteNumber: true,
          status: true,
          total: true,
          validUntil: true,
          createdAt: true,
        },
      }),
      prisma.invoice.findMany({
        where: { customerId, status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } },
        orderBy: { dueDate: 'asc' },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          balance: true,
          dueDate: true,
        },
      }),
    ]);

    res.json({
      stats: {
        totalOrders: ordersCount,
        totalQuotes: quotesCount,
        pendingOrders,
        unpaidInvoices: unpaidInvoices.length,
      },
      recentOrders,
      recentQuotes,
      unpaidInvoices,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// =====================
// ORDERS
// =====================

// List customer orders
router.get('/orders', authenticateCustomer, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { customerId: req.customer.id };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          items: {
            include: { product: { select: { name: true, images: true } } },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Orders list error:', error);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

// Get single order
router.get('/orders/:id', authenticateCustomer, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        customerId: req.customer.id,
      },
      include: {
        items: {
          include: { product: { select: { name: true, sku: true, images: true } } },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            balance: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Order detail error:', error);
    res.status(500).json({ error: 'Failed to load order' });
  }
});

// Upload POP for order
router.post('/orders/:id/pop', authenticateCustomer, async (req, res) => {
  try {
    const { popFile, popFileName } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        customerId: req.customer.id,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        popFile,
        popFileName,
        popUploadedAt: new Date(),
        popVerified: false,
        popRejectionReason: null,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('POP upload error:', error);
    res.status(500).json({ error: 'Failed to upload proof of payment' });
  }
});

// =====================
// QUOTES
// =====================

// List customer quotes
router.get('/quotes', authenticateCustomer, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { customerId: req.customer.id };
    if (status) {
      where.status = status;
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          items: {
            include: { product: { select: { name: true, images: true } } },
          },
        },
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      quotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Quotes list error:', error);
    res.status(500).json({ error: 'Failed to load quotes' });
  }
});

// Get single quote
router.get('/quotes/:id', authenticateCustomer, async (req, res) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: {
        id: req.params.id,
        customerId: req.customer.id,
      },
      include: {
        items: {
          include: { product: { select: { name: true, sku: true, images: true } } },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Mark as viewed if first view
    if (!quote.viewedAt) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: { viewedAt: new Date(), status: 'VIEWED' },
      });
    }

    res.json(quote);
  } catch (error) {
    console.error('Quote detail error:', error);
    res.status(500).json({ error: 'Failed to load quote' });
  }
});

// Accept quote
router.post('/quotes/:id/accept', authenticateCustomer, async (req, res) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: {
        id: req.params.id,
        customerId: req.customer.id,
        status: { in: ['PENDING', 'SENT', 'VIEWED'] },
      },
      include: { items: true },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found or already processed' });
    }

    // Check if expired
    if (new Date() > new Date(quote.validUntil)) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Quote has expired' });
    }

    // Create order from quote
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: req.customer.id,
        deliveryAddress: quote.deliveryAddress || '',
        deliveryCity: quote.deliveryCity || '',
        subtotal: quote.subtotal,
        vatAmount: quote.vatAmount,
        discount: quote.discount,
        total: quote.total,
        status: 'PENDING',
        source: 'WEBSITE',
        quoteId: quote.id,
        items: {
          create: quote.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: { items: true },
    });

    // Update quote
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'CONVERTED',
        convertedAt: new Date(),
        orderId: order.id,
      },
    });

    res.json({ message: 'Quote accepted', order });
  } catch (error) {
    console.error('Quote accept error:', error);
    res.status(500).json({ error: 'Failed to accept quote' });
  }
});

// Reject quote
router.post('/quotes/:id/reject', authenticateCustomer, async (req, res) => {
  try {
    const { reason } = req.body;

    const quote = await prisma.quote.findFirst({
      where: {
        id: req.params.id,
        customerId: req.customer.id,
        status: { in: ['PENDING', 'SENT', 'VIEWED'] },
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found or already processed' });
    }

    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'REJECTED',
        internalNotes: reason ? `Customer rejection reason: ${reason}` : null,
      },
    });

    res.json({ message: 'Quote rejected', quote: updated });
  } catch (error) {
    console.error('Quote reject error:', error);
    res.status(500).json({ error: 'Failed to reject quote' });
  }
});

// =====================
// INVOICES
// =====================

// List customer invoices
router.get('/invoices', authenticateCustomer, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { customerId: req.customer.id };
    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          order: {
            select: { orderNumber: true },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Invoices list error:', error);
    res.status(500).json({ error: 'Failed to load invoices' });
  }
});

// Get single invoice
router.get('/invoices/:id', authenticateCustomer, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        customerId: req.customer.id,
      },
      include: {
        order: {
          include: {
            items: {
              include: { product: { select: { name: true, sku: true } } },
            },
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Invoice detail error:', error);
    res.status(500).json({ error: 'Failed to load invoice' });
  }
});

// Download invoice PDF
router.get('/invoices/:id/pdf', authenticateCustomer, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        customerId: req.customer.id,
      },
      include: {
        customer: true,
        order: {
          include: {
            items: {
              include: { product: { select: { name: true, sku: true } } },
            },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Invoice PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// =====================
// PROFILE
// =====================

// Get profile
router.get('/profile', authenticateCustomer, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.customer.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        province: true,
        postalCode: true,
        country: true,
      },
    });

    res.json(customer);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/profile', authenticateCustomer, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      company,
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
    } = req.body;

    const updated = await prisma.customer.update({
      where: { id: req.customer.id },
      data: {
        firstName,
        lastName,
        phone,
        company,
        addressLine1,
        addressLine2,
        city,
        province,
        postalCode,
      },
    });

    res.json({
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      company: updated.company,
      phone: updated.phone,
      addressLine1: updated.addressLine1,
      addressLine2: updated.addressLine2,
      city: updated.city,
      province: updated.province,
      postalCode: updated.postalCode,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/profile/password', authenticateCustomer, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.customer.password) {
      return res.status(400).json({ error: 'No password set' });
    }

    const isValid = await bcrypt.compare(currentPassword, req.customer.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.customer.update({
      where: { id: req.customer.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Request quote (from customer portal)
router.post('/request-quote', authenticateCustomer, async (req, res) => {
  try {
    const { items, deliveryAddress, deliveryCity, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Calculate totals
    let subtotal = 0;
    const quoteItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      quoteItems.push({
        productId: product.id,
        description: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        total: itemTotal,
      });
    }

    const vatAmount = subtotal * 0.15;
    const total = subtotal + vatAmount;

    const quoteNumber = `QUO-${Date.now().toString().slice(-8)}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId: req.customer.id,
        customerName: `${req.customer.firstName} ${req.customer.lastName}`,
        customerEmail: req.customer.email,
        customerPhone: req.customer.phone,
        customerCompany: req.customer.company,
        deliveryAddress,
        deliveryCity,
        notes,
        subtotal,
        vatAmount,
        total,
        validUntil,
        status: 'PENDING',
        items: {
          create: quoteItems,
        },
      },
      include: { items: true },
    });

    res.status(201).json(quote);
  } catch (error) {
    console.error('Quote request error:', error);
    res.status(500).json({ error: 'Failed to create quote request' });
  }
});

export default router;
