import { Request, Response } from 'express';
import { Queue } from 'bullmq';
import { SubmissionModel } from '../models/mongodb/submission.model.js';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import { EvaluationReportModel } from '../models/mongodb/evaluation-report.model.js';
import {
  SubmissionRequestSchema,
  CustomRunRequestSchema,
  createSuccessResponse,
  createErrorResponse,
  LANGUAGE_CONFIGS,
  SupportedLanguage
} from '@aica/shared';
import { SandboxRunnerService } from '../services/sandbox-runner.service.js';
import { redisClient } from '../config/db.js';

// BullMQ Queue Producer
export const submissionQueue = new Queue('submission-queue', {
  connection: redisClient
});

submissionQueue.on('error', (err) => {
  console.warn('[SubmissionQueue] Redis queue warning:', err.message);
});

export const aiAnalysisQueue = new Queue('ai-analysis-queue', {
  connection: redisClient
});

aiAnalysisQueue.on('error', (err) => {
  console.warn('[AiAnalysisQueue] Redis queue warning:', err.message);
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

export async function retryAiAnalysis(req: Request, res: Response): Promise<void> {
  const { submissionId } = req.params;

  // 1. Authentication check
  if (!req.user) {
    res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication token required'));
    return;
  }

  try {
    const submission = await SubmissionModel.findById(submissionId);
    if (!submission) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Submission not found'));
      return;
    }

    // 2. Ownership & Authorization check: Only submission owner or ADMIN can retry
    const isOwner = req.user.id === submission.userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      res.status(403).json(
        createErrorResponse('FORBIDDEN', 'You are not authorized to retry AI analysis for this submission')
      );
      return;
    }

    // 3. State validation: deterministic verdict must exist and not be CE
    if (submission.verdict === 'PENDING') {
      res.status(400).json(
        createErrorResponse(
          'INVALID_STATE',
          'Deterministic evaluation is still pending. AI analysis cannot be initiated yet.'
        )
      );
      return;
    }

    if (submission.verdict === 'COMPILATION_ERROR') {
      res.status(400).json(
        createErrorResponse(
          'INVALID_STATE',
          'AI analysis is bypassed for compilation errors.'
        )
      );
      return;
    }

    // 4. Deduplication & Conflict check: Reject if already pending or processing
    if (submission.aiStatus === 'PENDING') {
      res.status(409).json(
        createErrorResponse(
          'CONFLICT',
          'AI analysis is already pending or in progress for this submission'
        )
      );
      return;
    }

    const jobId = `ai-analysis-${submissionId}`;

    // Check BullMQ for active/waiting duplicate job and clean up retained completed/failed job
    try {
      const existingJob = await aiAnalysisQueue.getJob(jobId);
      if (existingJob) {
        const state = await existingJob.getState();
        if (state === 'active' || state === 'waiting' || state === 'delayed') {
          res.status(409).json(
            createErrorResponse('CONFLICT', 'AI analysis job is currently active or queued')
          );
          return;
        }
        // Remove retained job so BullMQ accepts adding the job with the same deterministic jobId
        await existingJob.remove();
      }
    } catch (qErr: any) {
      console.warn('[SubmissionController] BullMQ job lookup warning:', qErr.message);
    }

    // Mark AI status as PENDING
    await SubmissionModel.findByIdAndUpdate(submissionId, {
      aiStatus: 'PENDING',
      aiError: ''
    });

    await EvaluationReportModel.findOneAndUpdate(
      { submissionId },
      { $set: { 'aiAnalysis.status': 'PENDING' } }
    );

    // Enqueue to aiAnalysisQueue with deterministic jobId
    await aiAnalysisQueue.add(
      'analyze-submission-ai',
      {
        submissionId: submission._id.toString(),
        problemId: submission.problemId,
        userId: submission.userId,
        username: submission.username,
        language: submission.language,
        code: submission.code,
        verdict: submission.verdict,
        executionTimeMs: submission.executionTimeMs,
        memoryUsedKb: submission.memoryUsedKb,
        passedCount: submission.testCasesPassed,
        totalCount: submission.testCasesTotal,
        compileOutput: submission.compileOutput,
        isTestRun: submission.isTestRun
      },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    );

    res.status(202).json(
      createSuccessResponse(
        {
          submissionId: submission._id.toString(),
          verdict: submission.verdict,
          aiStatus: 'PENDING'
        },
        'AI analysis queued for asynchronous retry'
      )
    );
  } catch (err: any) {
    console.error('[SubmissionController] retryAiAnalysis error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to schedule AI analysis retry'));
  }
}

export async function getMySubmissions(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
  const skip = (page - 1) * limit;

  try {
    const query: Record<string, any> = { userId, isTestRun: false };
    if (req.query.problemId) {
      query.problemId = req.query.problemId;
    }
    const [submissions, total] = await Promise.all([
      SubmissionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SubmissionModel.countDocuments(query)
    ]);

    // Fetch problem titles for display
    const problemIds = [...new Set(submissions.map((s: any) => s.problemId))];
    const problems = await ProblemModel.find({ _id: { $in: problemIds } }, { title: 1 }).lean();
    const problemMap = new Map(problems.map((p: any) => [p._id.toString(), p.title]));

    const formatted = submissions.map((s: any) => ({
      id: s._id.toString(),
      problemId: s.problemId,
      problemTitle: problemMap.get(s.problemId) || 'Algorithm Problem',
      language: s.language,
      verdict: s.verdict,
      executionTimeMs: s.executionTimeMs,
      memoryUsedKb: s.memoryUsedKb,
      compositeScore: s.compositeScore,
      createdAt: s.createdAt
    }));

    res.status(200).json(
      createSuccessResponse({
        submissions: formatted,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      })
    );
  } catch (err: any) {
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve submissions'));
  }
}

export async function getActivityHeatmap(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
    return;
  }

  try {
    const submissions = await SubmissionModel.find(
      { userId, isTestRun: false },
      { createdAt: 1, verdict: 1, problemId: 1 }
    )
      .sort({ createdAt: 1 })
      .lean();

    const activityByDate: Record<string, number> = {};
    const solvedProblemIds = new Set<string>();

    for (const sub of submissions) {
      const dateStr = new Date(sub.createdAt).toISOString().split('T')[0];
      activityByDate[dateStr] = (activityByDate[dateStr] || 0) + 1;
      if (sub.verdict === 'ACCEPTED') {
        solvedProblemIds.add(sub.problemId);
      }
    }

    // Calculate active streaks from unique dates
    const uniqueDates = Object.keys(activityByDate).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Check if streak is active today or yesterday
    if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }

    res.status(200).json(
      createSuccessResponse({
        activityByDate,
        totalSubmissions: submissions.length,
        problemsSolved: solvedProblemIds.size,
        currentStreak,
        longestStreak
      })
    );
  } catch (err: any) {
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve activity heatmap'));
  }
}

export async function runCustomCode(req: Request, res: Response): Promise<void> {
  // 1. Authentication check
  if (!req.user) {
    res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication token required'));
    return;
  }

  // 2. Schema validation (enforces non-empty code, max 64KB code, max 64KB stdin, supported language)
  const parseResult = CustomRunRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.errors.map((e) => ({
      field: e.path.join('.'),
      issue: e.message
    }));
    res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        parseResult.error.errors[0]?.message || 'Invalid custom execution payload',
        issues
      )
    );
    return;
  }

  const { language, code, stdin } = parseResult.data;

  // 3. Supported language check
  const langConfig = LANGUAGE_CONFIGS[language as SupportedLanguage];
  if (!langConfig) {
    res.status(400).json(createErrorResponse('UNSUPPORTED_LANGUAGE', 'Selected language is not supported'));
    return;
  }

  try {
    // 4. Execute purely in Judge0 sandbox (Ephemeral - NO DB records, NO queue, NO AI, NO leaderboard)
    const sandboxRunner = new SandboxRunnerService();
    const result = await sandboxRunner.executeEphemeral({
      language: language as SupportedLanguage,
      code,
      stdin: stdin || ''
    });

    res.status(200).json(
      createSuccessResponse(result, 'Custom code executed successfully in isolated sandbox')
    );
  } catch (err: any) {
    console.error('[SubmissionController] runCustomCode error:', err.message);
    if (
      err.name === 'TimeoutError' ||
      err.message?.toLowerCase().includes('timed out') ||
      err.message?.toLowerCase().includes('timeout')
    ) {
      res.status(504).json(
        createErrorResponse('SANDBOX_TIMEOUT', 'Code execution sandbox timed out after 15000ms')
      );
      return;
    }
    res.status(503).json(
      createErrorResponse('SANDBOX_UNAVAILABLE', `Code execution sandbox is unavailable: ${err.message}`)
    );
  }
}
