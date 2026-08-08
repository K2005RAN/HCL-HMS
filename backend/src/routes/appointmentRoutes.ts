import { Router } from 'express';
import { getAppointments, createAppointment, updateAppointmentStatus, updateAppointmentVitals, getDoctors, getPatients, searchPatient, updatePatientMeta } from '../controllers/appointmentController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect); // All appointment routes require auth

router.get('/meta/doctors', getDoctors);
router.get('/meta/patients', getPatients);
router.get('/meta/search-patient', searchPatient);
router.put('/meta/patient/:id', updatePatientMeta);

router.route('/')
    .get(getAppointments)
    .post(authorize('Receptionist', 'Super Admin', 'Doctor', 'Admin', 'Staff'), createAppointment);

router.put('/:id/status', authorize('Receptionist', 'Doctor', 'Super Admin', 'Admin', 'Staff'), updateAppointmentStatus);
router.put('/:id/vitals', authorize('Receptionist', 'Doctor', 'Super Admin', 'Admin', 'Staff'), updateAppointmentVitals);

export default router;
