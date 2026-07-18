import { Router } from 'express';
import { createInvoice, getInvoices } from '../controllers/billingController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);
router.post('/', authorize('Receptionist', 'Super Admin'), createInvoice);
router.get('/', authorize('Receptionist', 'Super Admin'), getInvoices);

export default router;
