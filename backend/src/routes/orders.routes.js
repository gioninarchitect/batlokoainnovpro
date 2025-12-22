import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  listOrders, getOrder, createOrder, updateOrder, updateOrderStatus, getOrderStats,
  uploadPOP, approvePOP, rejectPOP, dispatchOrder
} from '../controllers/orders.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for POP uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/pop'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `pop-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only JPG, PNG, and PDF files are allowed'));
  }
});

const router = Router();

router.use(authenticate);

// Stats
router.get('/stats', authorize('ADMIN', 'MANAGER'), getOrderStats);

// CRUD
router.get('/', listOrders);
router.get('/:id', getOrder);
router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), createOrder);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), updateOrder);
router.put('/:id/status', authorize('ADMIN', 'MANAGER', 'STAFF'), updateOrderStatus);

// POP (Proof of Payment)
router.post('/:id/pop', upload.single('popFile'), uploadPOP);
router.post('/:id/pop/approve', authorize('ADMIN', 'MANAGER'), approvePOP);
router.post('/:id/pop/reject', authorize('ADMIN', 'MANAGER'), rejectPOP);

// Dispatch
router.post('/:id/dispatch', authorize('ADMIN', 'MANAGER', 'STAFF'), dispatchOrder);

export default router;
