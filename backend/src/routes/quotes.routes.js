import { Router } from 'express';
import { listQuotes, getQuote, createQuote, updateQuote, sendQuote, convertToOrder, deleteQuote, submitQuoteRequest } from '../controllers/quotes.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public route - no auth required
router.post('/request', submitQuoteRequest);

// Protected routes
router.use(authenticate);

router.get('/', listQuotes);
router.get('/:id', getQuote);
router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), createQuote);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), updateQuote);
router.post('/:id/send', authorize('ADMIN', 'MANAGER', 'STAFF'), sendQuote);
router.post('/:id/convert', authorize('ADMIN', 'MANAGER', 'STAFF'), convertToOrder);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteQuote);

export default router;
