import { Router } from 'express';
import { markAttendance, getAttendance } from '../controllers/attendanceController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);
router.post('/mark', authorize('HR', 'Super Admin'), markAttendance);
router.get('/', authorize('HR', 'Super Admin'), getAttendance);

export default router;
