import { Router } from 'express';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, getLowStock, updateStock } from '../controllers/products.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', listProducts);
router.get('/low-stock', authenticate, getLowStock);
router.get('/:id', getProduct);
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), createProduct);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateProduct);
router.put('/:id/stock', authenticate, authorize('ADMIN', 'MANAGER', 'STAFF'), updateStock);
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), deleteProduct);

export default router;
