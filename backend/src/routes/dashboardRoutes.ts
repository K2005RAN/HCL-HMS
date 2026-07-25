import { Router } from 'express';
import { getDashboardStats, updateAvailableBeds } from '../controllers/dashboardController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/stats', authorize('Super Admin', 'Admin'), getDashboardStats);
router.put('/beds', authorize('Super Admin', 'Admin'), updateAvailableBeds);

export default router;
