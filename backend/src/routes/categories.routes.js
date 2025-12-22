import { Router } from 'express';
import { listCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/categories.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', listCategories);
router.get('/:id', getCategory);
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), createCategory);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

export default router;
