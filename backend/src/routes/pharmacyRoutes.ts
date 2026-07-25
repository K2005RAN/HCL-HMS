import express from 'express';
import { getMedicines, issueMedicine, addMedicine, getPrescriptions, dispenseAndBill } from '../controllers/pharmacyController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/medicines')
    .get(authorize('pharmacy', 'staff', 'admin', 'doctor'), getMedicines)
    .post(authorize('pharmacy', 'staff', 'admin'), addMedicine);

router.post('/medicines/issue', authorize('pharmacy', 'staff', 'admin'), issueMedicine);
router.get('/prescriptions', authorize('pharmacy', 'staff', 'admin', 'doctor'), getPrescriptions);
router.post('/dispense-and-bill', authorize('pharmacy', 'staff', 'admin'), dispenseAndBill);

export default router;
