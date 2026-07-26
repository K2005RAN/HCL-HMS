import { Router } from 'express';
import { 
    searchStaff, 
    giveAttendance, 
    signOff, 
    getAdminAttendanceLogs, 
    addStaffManual, 
    bulkUploadStaff,
    deleteStaff
} from '../controllers/attendanceController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

// Staff Attendance Give & Sign Off endpoints (Accessible by all logged in staff & admin)
router.get('/search-staff', searchStaff);
router.post('/give-attendance', giveAttendance);
router.post('/sign-off', signOff);

// Admin Attendance Logs & Staff Management Endpoints (Accessible by Admin / HR / Staff)
router.get('/admin-logs', authorize('admin', 'super admin', 'hr', 'staff'), getAdminAttendanceLogs);
router.post('/add-staff', authorize('admin', 'super admin', 'hr'), addStaffManual);
router.post('/bulk-staff', authorize('admin', 'super admin', 'hr'), bulkUploadStaff);
router.post('/delete-staff', authorize('admin', 'super admin', 'hr'), deleteStaff);

export default router;
