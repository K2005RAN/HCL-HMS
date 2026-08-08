import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import {
    createOrUpdateFormO,
    getFormOByEmployeeId,
    createOrUpdateForm32,
    getForm32ByEmployeeId,
    createOrUpdateForm21,
    getForm21Register,
    autoFillLabData
} from '../controllers/ohsController';

const router = express.Router();

// Form O Routes
router.post('/form-o', protect, authorize('admin', 'doctor'), createOrUpdateFormO);
router.get('/form-o/employee/:employeeId', protect, getFormOByEmployeeId);

// Form 32 Routes
router.post('/form-32', protect, authorize('admin', 'doctor'), createOrUpdateForm32);
router.get('/form-32/employee/:employeeId', protect, getForm32ByEmployeeId);

// Form 21 Routes
router.post('/form-21', protect, authorize('admin', 'doctor'), createOrUpdateForm21);
router.get('/form-21/register', protect, authorize('admin', 'doctor', 'staff'), getForm21Register);

// Auto-fill Lab Bridge
router.get('/auto-fill-lab/:employeeId', protect, autoFillLabData);

export default router;
