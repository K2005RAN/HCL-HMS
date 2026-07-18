import { Router } from 'express';
import { getMedicines, issueMedicine, addMedicine } from '../controllers/pharmacyController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.route('/medicines')
    .get(authorize('Pharmacist', 'Super Admin', 'Doctor', 'Admin', 'Staff'), getMedicines)
    .post(authorize('Pharmacist', 'Super Admin', 'Admin', 'Staff'), addMedicine);

router.post('/medicines/issue', authorize('Pharmacist', 'Super Admin', 'Admin', 'Staff'), issueMedicine);

export default router;
