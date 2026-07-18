import { Router } from 'express';
import { getAppointments, createAppointment, updateAppointmentStatus, getDoctors, getPatients, searchPatient } from '../controllers/appointmentController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect); // All appointment routes require auth

router.get('/meta/doctors', getDoctors);
router.get('/meta/patients', getPatients);
router.get('/meta/search-patient', searchPatient);

router.route('/')
    .get(getAppointments)
    .post(authorize('Receptionist', 'Super Admin', 'Doctor', 'Admin', 'Staff'), createAppointment);

router.put('/:id/status', authorize('Receptionist', 'Doctor', 'Super Admin', 'Admin', 'Staff'), updateAppointmentStatus);

export default router;
