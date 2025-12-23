import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Global search across orders, customers, products, quotes, invoices
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ orders: [], customers: [], products: [], quotes: [], invoices: [] });
    }

    const searchTerm = q.trim();
    const limit = 5; // Max results per category

    // Search in parallel
    const [orders, customers, products, quotes, invoices] = await Promise.all([
      // Orders - search by order number or customer name
      prisma.order.findMany({
        where: {
          OR: [
            { orderNumber: { contains: searchTerm, mode: 'insensitive' } },
            { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { customer: { email: { contains: searchTerm, mode: 'insensitive' } } },
          ]
        },
        include: { customer: { select: { name: true, email: true } } },
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),

      // Customers - search by name, email, company, phone
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { companyName: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),

      // Products - search by name, sku, description
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { sku: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        select: { id: true, name: true, sku: true, price: true, stockQty: true },
        take: limit,
        orderBy: { name: 'asc' }
      }),

      // Quotes - search by quote number or customer name
      prisma.quote.findMany({
        where: {
          OR: [
            { quoteNumber: { contains: searchTerm, mode: 'insensitive' } },
            { customerName: { contains: searchTerm, mode: 'insensitive' } },
            { customerEmail: { contains: searchTerm, mode: 'insensitive' } },
            { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
          ]
        },
        include: { customer: { select: { name: true } } },
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),

      // Invoices - search by invoice number or customer name
      prisma.invoice.findMany({
        where: {
          OR: [
            { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } },
            { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { customer: { email: { contains: searchTerm, mode: 'insensitive' } } },
          ]
        },
        include: { customer: { select: { name: true } } },
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
    ]);

    res.json({ orders, customers, products, quotes, invoices });
  } catch (error) {
    next(error);
  }
});

export default router;
