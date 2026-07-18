import { Router } from 'express';
import { getEmployees, createEmployee, bulkUploadEmployees } from '../controllers/employeeController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect); // All employee routes require authentication

router.route('/')
    .get(getEmployees)
    .post(authorize('Super Admin', 'HR', 'Admin', 'Staff'), createEmployee);

router.post('/bulk-upload', authorize('Super Admin', 'HR', 'Admin', 'Staff'), bulkUploadEmployees);

export default router;
