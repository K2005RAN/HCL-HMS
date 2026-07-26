import { Router } from 'express';
import { login, register, adminCreateUser, resetDatabase, getMe, updateProfile, changePassword } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/admin-create-user', adminCreateUser);
router.post('/reset-database', resetDatabase);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
