
import { Request, Response } from 'express';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import {
  createSuccessResponse,
  createErrorResponse,
  ProblemCreateSchema,
  ProblemListItem
} from '@aica/shared';


export async function getProblems(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(
      1,
      parseInt(req.query.page as string, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string, 10) || 20)
    );

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (req.query.difficulty) {
      filter.difficulty = (req.query.difficulty as string).toUpperCase();
    }

    const conditions: Record<string, any>[] = [];

    if (req.query.tag) {
      conditions.push({
        tags: req.query.tag
      });
    }

    if (req.query.algorithm) {
      const algorithm = (req.query.algorithm as string).trim();

      const normalizedAlgorithm = algorithm.replace(/-/g, ' ');

      conditions.push({
        tags: {
          $in: [algorithm, normalizedAlgorithm]
        }
      });
    }

    if (conditions.length > 0) {
      filter.$and = conditions;
    }

    if (req.query.search) {
      const search = (req.query.search as string).trim();

      filter.title = {
        $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i'
      };
    }

    const [problems, total] = await Promise.all([
      ProblemModel.find(filter)
        .select(
          'title slug difficulty tags totalSubmissions acceptedSubmissions'
        )
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),

      ProblemModel.countDocuments(filter)
    ]);

    const formattedList: ProblemListItem[] = problems.map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      tags: p.tags || [],
      totalSubmissions: p.totalSubmissions || 0,

      acceptanceRate:
        p.totalSubmissions > 0
          ? Math.round(
              (p.acceptedSubmissions / p.totalSubmissions) * 1000
            ) / 10
          : 0
    }));

    res.status(200).json(
      createSuccessResponse({
        problems: formattedList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    );

  } catch (err: any) {
    console.error(
      '[ProblemController] getProblems error:',
      err.message
    );

    res.status(500).json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to retrieve problems'
      )
    );
  }
}


export async function getProblemById(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;

  try {
    const problem: any = await ProblemModel.findById(id).lean();

    if (!problem) {
      res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Problem not found')
      );
      return;
    }

    const publicTestCases = (problem.testCases || [])
      .filter((tc: any) => tc.isPublic === true)
      .map((tc: any) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        explanation: tc.explanation,
        isPublic: true
      }));

    const sanitizedProblem: any = {
      ...problem,
      id: problem._id.toString(),
      testCases: publicTestCases,

      acceptanceRate:
        problem.totalSubmissions > 0
          ? Math.round(
              (problem.acceptedSubmissions / problem.totalSubmissions) * 1000
            ) / 10
          : 0
    };

    delete sanitizedProblem._id;
    delete sanitizedProblem.__v;

    res.status(200).json(
      createSuccessResponse(sanitizedProblem)
    );

  } catch (err: any) {
    console.error(
      '[ProblemController] getProblemById error:',
      err.message
    );

    res.status(500).json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to retrieve problem'
      )
    );
  }
}



export async function createProblem(
  req: Request,
  res: Response
): Promise<void> {

  const parseResult = ProblemCreateSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(422).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid problem schema',
        [
          {
            field: 'form',
            issue: parseResult.error.errors
              .map((e) => e.message)
              .join(', ')
          }
        ]
      )
    );

    return;
  }

  try {
    const data = parseResult.data;

    const userId = req.user?.id || 'admin';

    const newProblem = await ProblemModel.create({
      ...data,
      createdBy: userId
    });

    res.status(201).json(
      createSuccessResponse(
        newProblem,
        'Problem created successfully'
      )
    );

  } catch (err: any) {
    console.error(
      '[ProblemController] createProblem error:',
      err.message
    );

    res.status(500).json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to create problem'
      )
    );
  }
}
