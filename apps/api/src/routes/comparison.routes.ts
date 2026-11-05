import { Router } from 'express';
import {
  createComparison,
  createMultiComparison,
  getComparisonById,
  getProblemComparison,
  getProblemMultiComparison
} from '../controllers/comparison.controller.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Multi-solution evolution comparison endpoints (must precede /:id)
router.get('/problem/:problemId/multi', optionalAuth, getProblemMultiComparison);
router.post('/multi', authenticateToken, createMultiComparison);

// Dedicated problem comparison endpoint (must precede /:id)
router.get('/problem/:problemId', optionalAuth, getProblemComparison);

// Individual comparison retrieval
router.get('/:id', getComparisonById);

// Create comparison
router.post('/', authenticateToken, createComparison);

export default router;
