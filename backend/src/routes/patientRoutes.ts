import { Router } from 'express';
import { getPatientDashboard, getPatientMedicalRecord } from '../controllers/patientController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/dashboard', authorize('Patient'), getPatientDashboard);
router.get('/history/:id', authorize('Patient'), getPatientMedicalRecord);

export default router;
