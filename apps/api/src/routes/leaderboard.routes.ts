import { Router } from 'express';
import { getProblemLeaderboard } from '../controllers/leaderboard.controller.js';

const router = Router();

router.get('/problem/:problemId', getProblemLeaderboard);

export default router;
