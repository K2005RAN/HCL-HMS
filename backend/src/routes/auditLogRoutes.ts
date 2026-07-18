import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);
router.get('/', authorize('Super Admin'), getAuditLogs);

export default router;
