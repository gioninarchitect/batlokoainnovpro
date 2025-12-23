import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Get reports data
router.get('/', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get summary stats
    const [ordersTotal, ordersInPeriod, customersInPeriod] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { total: true },
        _count: { id: true }
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: { total: true, status: true }
      }),
      prisma.customer.count({
        where: { createdAt: { gte: startDate } }
      })
    ]);

    const revenue = ordersTotal._sum.total || 0;
    const orderCount = ordersTotal._count.id || 0;
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    // Revenue by month (last 6 months or period)
    const revenueByMonth = await prisma.$queryRaw`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
        SUM(total) as revenue
      FROM orders
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt")
    `;

    // Top products
    const topProducts = await prisma.$queryRaw`
      SELECT
        p.id,
        p.name,
        SUM(oi.quantity) as "totalSold",
        SUM(oi.total) as revenue
      FROM "orderItems" oi
      JOIN products p ON oi."productId" = p.id
      JOIN orders o ON oi."orderId" = o.id
      WHERE o."createdAt" >= ${startDate}
      GROUP BY p.id, p.name
      ORDER BY "totalSold" DESC
      LIMIT 5
    `;

    // Top customers
    const topCustomers = await prisma.$queryRaw`
      SELECT
        c.id,
        COALESCE(c."firstName" || ' ' || c."lastName", c.company) as name,
        c.company as "companyName",
        SUM(o.total) as "totalSpent",
        COUNT(o.id) as "orderCount"
      FROM customers c
      JOIN orders o ON o."customerId" = c.id
      WHERE o."createdAt" >= ${startDate}
      GROUP BY c.id, c."firstName", c."lastName", c.company
      ORDER BY "totalSpent" DESC
      LIMIT 5
    `;

    // Orders by status
    const ordersByStatus = await prisma.$queryRaw`
      SELECT
        status,
        COUNT(*) as count
      FROM orders
      WHERE "createdAt" >= ${startDate}
      GROUP BY status
      ORDER BY count DESC
    `;

    res.json({
      summary: {
        revenue: parseFloat(revenue) || 0,
        orders: orderCount,
        customers: customersInPeriod,
        avgOrderValue: parseFloat(avgOrderValue) || 0
      },
      revenueByMonth: revenueByMonth.map(r => ({
        month: r.month,
        revenue: parseFloat(r.revenue) || 0
      })),
      topProducts: topProducts.map(p => ({
        id: p.id,
        name: p.name,
        totalSold: parseInt(p.totalSold) || 0,
        revenue: parseFloat(p.revenue) || 0
      })),
      topCustomers: topCustomers.map(c => ({
        id: c.id,
        name: c.name,
        companyName: c.companyName,
        totalSpent: parseFloat(c.totalSpent) || 0,
        orderCount: parseInt(c.orderCount) || 0
      })),
      ordersByStatus: ordersByStatus.map(s => ({
        status: s.status,
        count: parseInt(s.count) || 0
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;
