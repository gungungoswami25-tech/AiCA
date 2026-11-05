import { Request, Response } from 'express';
import { Queue } from 'bullmq';
import { SubmissionModel } from '../models/mongodb/submission.model.js';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import { EvaluationReportModel } from '../models/mongodb/evaluation-report.model.js';
import {
  SubmissionRequestSchema,
  createSuccessResponse,
  createErrorResponse,
  LANGUAGE_CONFIGS,
  SupportedLanguage
} from '@aica/shared';
import { redisClient } from '../config/db.js';

// BullMQ Queue Producer
export const submissionQueue = new Queue('submission-queue', {
  connection: redisClient
});

export async function createSubmission(req: Request, res: Response): Promise<void> {
  const parseResult = SubmissionRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json(
      createErrorResponse('VALIDATION_ERROR', 'Invalid submission payload', [
        { field: 'form', issue: parseResult.error.errors.map((e) => e.message).join(', ') }
      ])
    );
    return;
  }

  const { problemId, language, code, isTestRun } = parseResult.data;
  const userId = req.user?.id || 'guest_user';
  const username = req.user?.username || 'Guest';

  try {
    // 1. Verify problem exists
    const problem = await ProblemModel.findById(problemId);
    if (!problem) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Target problem not found'));
      return;
    }

    const langConfig = LANGUAGE_CONFIGS[language as SupportedLanguage];
    if (!langConfig) {
      res.status(400).json(createErrorResponse('UNSUPPORTED_LANGUAGE', 'Selected language is not supported'));
      return;
    }

    // 2. Persist initial Submission document in MongoDB
    const submission = await SubmissionModel.create({
      userId,
      username,
      problemId: problem._id.toString(),
      language,
      languageId: langConfig.id,
      code,
      codeLength: code.length,
      isTestRun: Boolean(isTestRun),
      pipelineStatus: 'QUEUED',
      verdict: 'PENDING',
      executionTimeMs: 0,
      memoryUsedKb: 0,
      normalizedTimeMs: 0,
      compositeScore: 0,
      testCasesTotal: problem.testCases?.length || 0,
      testCasesPassed: 0,
      testResults: []
    });

    const submissionId = submission._id.toString();

    // 3. Dispatch Job to BullMQ with priority weighting
    await submissionQueue.add(
      'evaluate-submission',
      {
        submissionId,
        problemId: problem._id.toString(),
        userId,
        username,
        language,
        languageId: langConfig.id,
        code,
        isTestRun: Boolean(isTestRun)
      },
      {
        priority: isTestRun ? 1 : 2, // Test runs get higher priority
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    );

    res.status(202).json(
      createSuccessResponse(
        {
          submissionId,
          pipelineStatus: 'QUEUED',
          verdict: 'PENDING',
          isTestRun: Boolean(isTestRun)
        },
        'Submission queued for evaluation'
      )
    );
  } catch (err: any) {
    console.error('[SubmissionController] createSubmission error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to ingest submission'));
  }
}

export async function getSubmissionById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const submission: any = await SubmissionModel.findById(id).lean();
    if (!submission) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Submission not found'));
      return;
    }

    // Sanitize test results: hide input/output for hidden test cases
    const sanitizedResults = (submission.testResults || []).map((tr: any) => ({
      testCaseId: tr.testCaseId,
      index: tr.index,
      passed: tr.passed,
      isPublic: tr.isPublic,
      executionTimeMs: tr.executionTimeMs,
      memoryKb: tr.memoryKb,
      ...(tr.isPublic
        ? { actualOutput: tr.actualOutput, expectedOutput: tr.expectedOutput }
        : { actualOutput: '[HIDDEN]', expectedOutput: '[HIDDEN]' }),
      errorMessage: tr.errorMessage
    }));

    const result = {
      ...submission,
      id: submission._id.toString(),
      testResults: sanitizedResults
    };
    delete result._id;
    delete result.__v;

    res.status(200).json(createSuccessResponse(result));
  } catch (err: any) {
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve submission'));
  }
}

export async function getEvaluationReport(req: Request, res: Response): Promise<void> {
  const { submissionId } = req.params;

  try {
    const report: any = await EvaluationReportModel.findOne({ submissionId }).lean();
    if (!report) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Evaluation report not yet generated'));
      return;
    }

    const result = {
      ...report,
      id: report._id.toString()
    };
    delete result._id;
    delete result.__v;

    res.status(200).json(createSuccessResponse(result));
  } catch (err: any) {
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve report'));
  }
}
