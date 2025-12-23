import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getAuditLogs, getActivitySummary } from '../services/audit.service.js';

const router = Router();

// Get audit logs (admin only)
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const result = await getAuditLogs(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get activity summary
router.get('/summary', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const result = await getActivitySummary(parseInt(days));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
