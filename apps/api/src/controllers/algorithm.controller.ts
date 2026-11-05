
import { Request, Response } from 'express';
import Algorithm from '../models/mongodb/algorithm.model.js';

// Get all algorithms
export const getAlgorithms = async (
  req: Request,
  res: Response
) => {
  try {
    const algorithms = await Algorithm.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: algorithms.length,
      data: algorithms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch algorithms',
    });
  }
};

// Get one algorithm by slug
export const getAlgorithmBySlug = async (
  req: Request,
  res: Response
) => {
  try {
    const algorithm = await Algorithm.findOne({
      slug: req.params.slug,
    });

    if (!algorithm) {
      res.status(404).json({
        success: false,
        message: 'Algorithm not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: algorithm,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch algorithm',
    });
  }
};
