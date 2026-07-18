import { Router } from 'express';
import { getDoctorDashboard, getAppointmentDetails, completeConsultation, getDoctorHistory, getMedicalRecordDetails } from '../controllers/doctorController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/dashboard', authorize('Doctor', 'Super Admin', 'Admin'), getDoctorDashboard);
router.get('/appointment/:id', authorize('Doctor', 'Super Admin', 'Admin'), getAppointmentDetails);
router.post('/consultation/:id', authorize('Doctor', 'Super Admin', 'Admin'), completeConsultation);
router.get('/history', authorize('Doctor', 'Super Admin', 'Admin'), getDoctorHistory);
router.get('/history/:id', authorize('Doctor', 'Super Admin', 'Admin'), getMedicalRecordDetails);

export default router;
