import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/stats', authorize('Super Admin', 'Admin'), getDashboardStats);

export default router;
