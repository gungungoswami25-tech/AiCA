
import { Router } from 'express';

import {
  getAlgorithms,
  getAlgorithmBySlug,
  generateAlgorithm,
} from '../controllers/algorithm.controller.js';

const router = Router();

router.get('/', getAlgorithms);
router.post('/generate', generateAlgorithm);

router.get('/:slug', getAlgorithmBySlug);

export default router;
