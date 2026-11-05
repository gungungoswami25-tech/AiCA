
import { Router } from 'express';

import {
  getAlgorithms,
  getAlgorithmBySlug,
} from '../controllers/algorithm.controller.js';

const router = Router();

router.get('/', getAlgorithms);

router.get('/:slug', getAlgorithmBySlug);

export default router;
