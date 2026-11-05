import { Request, Response } from 'express';
import { SubmissionModel } from '../models/mongodb/submission.model.js';
import { SolutionComparisonModel } from '../models/mongodb/comparison.model.js';
import { EvaluationReportModel } from '../models/mongodb/evaluation-report.model.js';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import { GeminiAnalysisClient } from '@aica/ai-engine';
import { createSuccessResponse, createErrorResponse, ComparisonCreateSchema } from '@aica/shared';

const geminiClient = new GeminiAnalysisClient();

export async function createComparison(req: Request, res: Response): Promise<void> {
  const parseResult = ComparisonCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json(
      createErrorResponse('VALIDATION_ERROR', 'Invalid comparison request', [
        { field: 'form', issue: parseResult.error.errors.map((e) => e.message).join(', ') }
      ])
    );
    return;
  }

  const { submissionIdA, submissionIdB } = parseResult.data;

  try {
    const [subA, subB] = await Promise.all([
      SubmissionModel.findById(submissionIdA).lean(),
      SubmissionModel.findById(submissionIdB).lean()
    ]);

    if (!subA || !subB) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'One or both submissions were not found'));
      return;
    }

    // Ownership check: Student can compare their own submissions
    const userId = req.user?.id;
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'INSTRUCTOR';
    if (userId && !isStaff && subA.userId !== userId && subB.userId !== userId) {
      res.status(403).json(createErrorResponse('FORBIDDEN', 'You are only authorized to compare your own submissions'));
      return;
    }

    if (subA.problemId !== subB.problemId) {
      res.status(400).json(createErrorResponse('PROBLEM_MISMATCH', 'Cannot compare submissions for different problems'));
      return;
    }

    const problem = await ProblemModel.findById(subA.problemId).lean();
    const problemTitle = problem?.title || 'Coding Problem';

    const [reportA, reportB] = await Promise.all([
      EvaluationReportModel.findOne({ submissionId: submissionIdA }).lean(),
      EvaluationReportModel.findOne({ submissionId: submissionIdB }).lean()
    ]);

    const qualityA = reportA?.aiAnalysis?.codeQuality?.score || 7;
    const qualityB = reportB?.aiAnalysis?.codeQuality?.score || 8;
    const timeCompA = reportA?.aiAnalysis?.theoreticalComplexity?.timeComplexity || 'O(N)';
    const spaceCompA = reportA?.aiAnalysis?.theoreticalComplexity?.spaceComplexity || 'O(N)';
    const timeCompB = reportB?.aiAnalysis?.theoreticalComplexity?.timeComplexity || 'O(N)';
    const spaceCompB = reportB?.aiAnalysis?.theoreticalComplexity?.spaceComplexity || 'O(1)';

    // Deterministic baseline in case AI generation is deferred or times out
    let aiComparison = {
      timeComplexityComparison: `${timeCompA} vs ${timeCompB}`,
      spaceComplexityComparison: `${spaceCompA} vs ${spaceCompB}`,
      tradeOffSummary: subB.executionTimeMs < subA.executionTimeMs
        ? `Approach B exhibits faster empirical execution runtime (${subB.executionTimeMs}ms vs ${subA.executionTimeMs}ms), optimizing computational efficiency.`
        : `Approach A and Approach B demonstrate comparable execution profiles (${subA.executionTimeMs}ms vs ${subB.executionTimeMs}ms).`
    };

    try {
      // Request AI evolutionary narrative from Gemini
      const geminiResult = await geminiClient.analyzeComparison({
        problemTitle,
        languageA: subA.language,
        codeA: subA.code,
        timeA: subA.executionTimeMs,
        memA: subA.memoryUsedKb,
        languageB: subB.language,
        codeB: subB.code,
        timeB: subB.executionTimeMs,
        memB: subB.memoryUsedKb
      });
      if (geminiResult && geminiResult.tradeOffSummary) {
        aiComparison = geminiResult;
      }
    } catch (aiErr: any) {
      console.warn('[ComparisonController] AI comparison generation deferred, using deterministic delta baseline:', aiErr.message);
    }

    const comparisonDoc = await SolutionComparisonModel.create({
      problemId: subA.problemId,
      submissionA: {
        submissionId: submissionIdA,
        userId: subA.userId,
        username: subA.username || 'Student A',
        language: subA.language,
        code: subA.code,
        executionTimeMs: subA.executionTimeMs,
        memoryUsedKb: subA.memoryUsedKb,
        timeComplexity: timeCompA,
        spaceComplexity: spaceCompA,
        qualityScore: qualityA,
        compositeScore: subA.compositeScore,
        createdAt: subA.createdAt ? new Date(subA.createdAt).toISOString() : new Date().toISOString()
      },
      submissionB: {
        submissionId: submissionIdB,
        userId: subB.userId,
        username: subB.username || 'Student B',
        language: subB.language,
        code: subB.code,
        executionTimeMs: subB.executionTimeMs,
        memoryUsedKb: subB.memoryUsedKb,
        timeComplexity: timeCompB,
        spaceComplexity: spaceCompB,
        qualityScore: qualityB,
        compositeScore: subB.compositeScore,
        createdAt: subB.createdAt ? new Date(subB.createdAt).toISOString() : new Date().toISOString()
      },
      deltaAnalysis: {
        executionTimeDiffMs: subB.executionTimeMs - subA.executionTimeMs,
        memoryDiffKb: subB.memoryUsedKb - subA.memoryUsedKb,
        qualityScoreDiff: qualityB - qualityA,
        timeComplexityComparison: aiComparison.timeComplexityComparison,
        spaceComplexityComparison: aiComparison.spaceComplexityComparison,
        tradeOffSummary: aiComparison.tradeOffSummary
      }
    });

    res.status(201).json(createSuccessResponse(comparisonDoc, 'Comparison generated successfully'));
  } catch (err: any) {
    console.error('[ComparisonController] createComparison error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to generate comparison'));
  }
}

export async function getProblemComparison(req: Request, res: Response): Promise<void> {
  const { problemId } = req.params;

  try {
    const userId = req.user?.id;
    let query: Record<string, any> = { problemId };

    if (userId) {
      query = {
        problemId,
        $or: [{ 'submissionA.userId': userId }, { 'submissionB.userId': userId }]
      };
    }

    let comparison = await SolutionComparisonModel.findOne(query).sort({ createdAt: -1 }).lean();

    // Fallback: If no personal comparison exists, look for any recent comparison for this problem
    if (!comparison && userId) {
      comparison = await SolutionComparisonModel.findOne({ problemId }).sort({ createdAt: -1 }).lean();
    }

    if (!comparison) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'No comparison found for this problem'));
      return;
    }

    res.status(200).json(createSuccessResponse(comparison));
  } catch (err: any) {
    console.error('[ComparisonController] getProblemComparison error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve comparison'));
  }
}

export async function getComparisonById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const comparison = await SolutionComparisonModel.findById(id).lean();
    if (!comparison) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Comparison not found'));
      return;
    }

    res.status(200).json(createSuccessResponse(comparison));
  } catch (err: any) {
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve comparison'));
  }
}
