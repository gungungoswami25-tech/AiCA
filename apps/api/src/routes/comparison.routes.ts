import { Router } from 'express';
import {
  createComparison,
  getComparisonById,
  getProblemComparison
} from '../controllers/comparison.controller.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Dedicated problem comparison endpoint (must precede /:id)
router.get('/problem/:problemId', optionalAuth, getProblemComparison);

// Individual comparison retrieval
router.get('/:id', getComparisonById);

// Create comparison
router.post('/', authenticateToken, createComparison);

export default router;
