import { Router } from 'express';
import { getProblemLeaderboard, getGlobalLeaderboard } from '../controllers/leaderboard.controller.js';

const router = Router();

// Global platform rankings across all problems
router.get('/global', getGlobalLeaderboard);

// Problem-specific leaderboard
router.get('/problem/:problemId', getProblemLeaderboard);

export default router;
