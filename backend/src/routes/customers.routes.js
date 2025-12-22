import { Router } from 'express';
import { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, searchCustomers, addNote, addFollowUp } from '../controllers/customers.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/search', searchCustomers);
router.get('/', listCustomers);
router.get('/:id', getCustomer);
router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), createCustomer);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), updateCustomer);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteCustomer);
router.post('/:id/notes', addNote);
router.post('/:id/follow-ups', addFollowUp);

export default router;
