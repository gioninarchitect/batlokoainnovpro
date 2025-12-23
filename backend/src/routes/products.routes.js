import { Router } from 'express';
import multer from 'multer';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, getLowStock, updateStock, exportProducts, bulkImportProducts, sendLowStockAlert } from '../controllers/products.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Configure multer for CSV upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

router.get('/', listProducts);
router.get('/low-stock', authenticate, getLowStock);
router.get('/export', authenticate, authorize('ADMIN', 'MANAGER'), exportProducts);
router.post('/bulk-import', authenticate, authorize('ADMIN', 'MANAGER'), upload.single('file'), bulkImportProducts);
router.post('/low-stock-alert', authenticate, authorize('ADMIN', 'MANAGER'), sendLowStockAlert);
router.get('/:id', getProduct);
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), createProduct);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateProduct);
router.put('/:id/stock', authenticate, authorize('ADMIN', 'MANAGER', 'STAFF'), updateStock);
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), deleteProduct);

export default router;
