import { Router } from 'express';
import { createInvoice, getInvoices, getPatientBillableRecords, getPatientInvoices } from '../controllers/billingController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);
router.get('/patient-records', authorize('Receptionist', 'Super Admin', 'Admin', 'Staff', 'HR'), getPatientBillableRecords);
router.get('/patient-invoices/:patientId', protect, getPatientInvoices);
router.post('/', authorize('Receptionist', 'Super Admin', 'Admin', 'Staff', 'HR'), createInvoice);
router.get('/', authorize('Receptionist', 'Super Admin', 'Admin', 'Staff', 'HR'), getInvoices);

export default router;
