import { Router } from 'express';
import { register, login, getCurrentUser, googleAuth } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
