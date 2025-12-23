import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productsRoutes from './products.routes.js';
import categoriesRoutes from './categories.routes.js';
import customersRoutes from './customers.routes.js';
import ordersRoutes from './orders.routes.js';
import quotesRoutes from './quotes.routes.js';
import invoicesRoutes from './invoices.routes.js';
import searchRoutes from './search.routes.js';
import reportsRoutes from './reports.routes.js';
import auditRoutes from './audit.routes.js';
import settingsRoutes from './settings.routes.js';
import portalRoutes from './portal.routes.js';
import suppliersRoutes from './suppliers.routes.js';
import purchaseOrdersRoutes from './purchaseOrders.routes.js';
import aiRoutes from './ai.routes.js';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/customers', customersRoutes);
router.use('/orders', ordersRoutes);
router.use('/quotes', quotesRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/search', searchRoutes);
router.use('/reports', reportsRoutes);
router.use('/audit', auditRoutes);
router.use('/settings', settingsRoutes);
router.use('/portal', portalRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/purchase-orders', purchaseOrdersRoutes);
router.use('/ai', aiRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
