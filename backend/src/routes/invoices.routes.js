import { Router } from 'express';
import { listInvoices, getInvoice, createInvoice, sendInvoice, recordPayment, generatePDF, getInvoiceStats, getOverdueInvoices } from '../controllers/invoices.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/stats', authorize('ADMIN', 'MANAGER'), getInvoiceStats);
router.get('/overdue', authorize('ADMIN', 'MANAGER', 'STAFF'), getOverdueInvoices);
router.get('/', listInvoices);
router.get('/:id', getInvoice);
router.get('/:id/pdf', generatePDF);
router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), createInvoice);
router.post('/:id/send', authorize('ADMIN', 'MANAGER', 'STAFF'), sendInvoice);
router.post('/:id/payment', authorize('ADMIN', 'MANAGER'), recordPayment);

export default router;
