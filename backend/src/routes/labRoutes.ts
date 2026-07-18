import { Router } from 'express';
import { getLabTests, updateTestStatus } from '../controllers/labController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/tests', authorize('Laboratory Technician', 'Super Admin', 'Doctor'), getLabTests);
router.put('/tests/:id/status', authorize('Laboratory Technician', 'Super Admin'), updateTestStatus);

export default router;
