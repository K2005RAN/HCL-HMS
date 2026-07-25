import { Router } from 'express';
import { login, register, adminCreateUser, getMe } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/admin-create-user', adminCreateUser);
router.get('/me', protect, getMe);

export default router;
