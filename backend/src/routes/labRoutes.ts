import { Router } from 'express';
import { getLabTests, updateTestStatus, orderLabTest, getPatientLabTests } from '../controllers/labController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.post('/order', authorize('doctor', 'admin'), orderLabTest);
router.get('/tests', authorize('lab', 'staff', 'admin', 'doctor'), getLabTests);
router.get('/patient/:patientId', authorize('doctor', 'lab', 'staff', 'admin', 'patient', 'employee'), getPatientLabTests);
router.put('/tests/:id/status', authorize('lab', 'staff', 'admin'), updateTestStatus);

export default router;
