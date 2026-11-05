import { Router } from 'express';
import { getProblems, getProblemById, createProblem } from '../controllers/problem.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getProblems);
router.get('/:id', getProblemById);
router.post('/', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), createProblem);

export default router;
