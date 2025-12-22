import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productsRoutes from './products.routes.js';
import categoriesRoutes from './categories.routes.js';
import customersRoutes from './customers.routes.js';
import ordersRoutes from './orders.routes.js';
import quotesRoutes from './quotes.routes.js';
import invoicesRoutes from './invoices.routes.js';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/customers', customersRoutes);
router.use('/orders', ordersRoutes);
router.use('/quotes', quotesRoutes);
router.use('/invoices', invoicesRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
