import { Router } from 'express';
import { register, login, getCurrentUser, googleAuth, updateProfile } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', authenticateToken, getCurrentUser);
router.patch('/profile', authenticateToken, updateProfile);

export default router;
