import { Request, Response } from 'express';
import { SubmissionModel } from '../models/mongodb/submission.model.js';
import { SolutionComparisonModel } from '../models/mongodb/comparison.model.js';
import { EvaluationReportModel } from '../models/mongodb/evaluation-report.model.js';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import { GeminiAnalysisClient } from '@aica/ai-engine';
import { createSuccessResponse, createErrorResponse } from '@aica/shared';

const geminiClient = new GeminiAnalysisClient();

export async function createComparison(req: Request, res: Response): Promise<void> {
  const { submissionIdA, submissionIdB } = req.body;

  if (!submissionIdA || !submissionIdB) {
    res.status(400).json(createErrorResponse('INVALID_INPUT', 'Both submissionIdA and submissionIdB are required'));
    return;
  }

  try {
    const [subA, subB] = await Promise.all([
      SubmissionModel.findById(submissionIdA).lean(),
      SubmissionModel.findById(submissionIdB).lean()
    ]);

    if (!subA || !subB) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'One or both submissions were not found'));
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

    // Request AI evolutionary narrative
    const aiComparison = await geminiClient.analyzeComparison({
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
