import { Router } from 'express';
import { login, getMe, register, listUsers, updateUser, changePassword } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/me/password', authenticate, changePassword);
router.post('/register', authenticate, authorize('ADMIN'), register);
router.get('/users', authenticate, authorize('ADMIN'), listUsers);
router.put('/users/:id', authenticate, authorize('ADMIN'), updateUser);

export default router;
