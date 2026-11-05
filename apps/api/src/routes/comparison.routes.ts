import { Router } from 'express';
import { createComparison, getComparisonById } from '../controllers/comparison.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', optionalAuth, createComparison);
router.get('/:id', getComparisonById);

export default router;
