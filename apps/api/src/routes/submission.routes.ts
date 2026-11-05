import { Router } from 'express';
import {
  createSubmission,
  getSubmissionById,
  getEvaluationReport
} from '../controllers/submission.controller.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';
import { submissionRateLimiter } from '../middleware/rate-limiter.middleware.js';
import { handleSubmissionStatusSSE } from '../middleware/sse.middleware.js';

const router = Router();

router.post('/', optionalAuth, submissionRateLimiter, createSubmission);
router.get('/:id', optionalAuth, getSubmissionById);
router.get('/:id/status-stream', optionalAuth, handleSubmissionStatusSSE);
router.get('/:submissionId/report', optionalAuth, getEvaluationReport);

export default router;
