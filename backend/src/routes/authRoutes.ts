import { Router } from 'express';
import { login, register, adminCreateUser } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/admin-create-user', adminCreateUser);

export default router;
