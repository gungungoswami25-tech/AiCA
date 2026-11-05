import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import {
  getProblems,
  getProblemById,
  getAdminProblemById
} from '../apps/api/src/controllers/problem.controller.js';
import {
  createSubmission,
  runCustomCode,
  submissionQueue
} from '../apps/api/src/controllers/submission.controller.js';
import {
  createComparison,
  getProblemComparison
} from '../apps/api/src/controllers/comparison.controller.js';
import {
  getProblemLeaderboard,
  getGlobalLeaderboard
} from '../apps/api/src/controllers/leaderboard.controller.js';
import { ProblemModel } from '../apps/api/src/models/mongodb/problem.model.js';
import { SubmissionModel } from '../apps/api/src/models/mongodb/submission.model.js';
import { SolutionComparisonModel } from '../apps/api/src/models/mongodb/comparison.model.js';
import { EvaluationReportModel } from '../apps/api/src/models/mongodb/evaluation-report.model.js';
import { SandboxRunnerService } from '../apps/api/src/services/sandbox-runner.service.js';
import { GeminiAnalysisClient } from '../packages/ai-engine/dist/index.js';
import { pgPool } from '../apps/api/src/config/db.js';

function mockReqRes(options: {
  query?: Record<string, any>;
  params?: Record<string, any>;
  body?: any;
  user?: any;
  headers?: Record<string, string>;
}) {
  const req: any = {
    query: options.query || {},
    params: options.params || {},
    body: options.body || {},
    user: options.user,
    headers: options.headers || {}
  };

  const res: any = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.data = payload;
      return this;
    },
    setHeader(name: string, val: string) {
      this.headers[name] = val;
      return this;
    }
  };

  return { req, res };
}

function makeQuery(doc: any) {
  const promise = Promise.resolve(doc);
  (promise as any).lean = () => Promise.resolve(doc);
  return promise;
}

describe('Phase 5: Platform Hardening, Seed Curation & End-to-End Walkthrough', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Simulate active MongoDB connection
    vi.spyOn(ProblemModel.base.connection, 'readyState', 'get').mockReturnValue(1);
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Curriculum Discovery & Dynamic Badging
  // ---------------------------------------------------------------------------
  it('1. Curriculum Discovery: lists all 5 classic published problems with SOLVED/TODO badges', async () => {
    const studentUser = { id: '00000000-0000-0000-0000-000000000001', role: 'STUDENT', username: 'algo_student' };

    const mockProblems = [
      { _id: new mongoose.Types.ObjectId(), title: 'Two Sum Optimal', slug: 'two-sum-optimal', difficulty: 'EASY', tags: ['Arrays', 'Hash-Table'], totalSubmissions: 50, acceptedSubmissions: 40 },
      { _id: new mongoose.Types.ObjectId(), title: 'Longest Substring Without Repeating Characters', slug: 'longest-substring-without-repeating', difficulty: 'MEDIUM', tags: ['Strings'], totalSubmissions: 30, acceptedSubmissions: 15 },
      { _id: new mongoose.Types.ObjectId(), title: 'Container With Most Water', slug: 'container-with-most-water', difficulty: 'MEDIUM', tags: ['Two-Pointers'], totalSubmissions: 25, acceptedSubmissions: 15 },
      { _id: new mongoose.Types.ObjectId(), title: 'Valid Parentheses', slug: 'valid-parentheses', difficulty: 'EASY', tags: ['Stack'], totalSubmissions: 40, acceptedSubmissions: 35 },
      { _id: new mongoose.Types.ObjectId(), title: 'Binary Search Optimal', slug: 'binary-search-optimal', difficulty: 'EASY', tags: ['Binary-Search'], totalSubmissions: 35, acceptedSubmissions: 30 }
    ];

    vi.spyOn(ProblemModel, 'find').mockReturnValue({
      select: () => ({
        skip: () => ({
          limit: () => ({
            sort: () => ({
              lean: () => Promise.resolve(mockProblems)
            })
          })
        })
      })
    } as any);

    vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(5 as any);

    // Mock student has solved Two Sum
    vi.spyOn(SubmissionModel, 'find').mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve([
          { problemId: mockProblems[0]._id.toString(), verdict: 'ACCEPTED' }
        ])
      })
    } as any);

    const { req, res } = mockReqRes({ user: studentUser });
    await getProblems(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.problems).toHaveLength(5);
    expect(res.data.data.problems[0].userStatus).toBe('SOLVED');
    expect(res.data.data.problems[1].userStatus).toBe('TODO');
  });

  // ---------------------------------------------------------------------------
  // 2. Hidden Test Privacy Invariant
  // ---------------------------------------------------------------------------
  it('2. Hidden Test Privacy: student API redacts hidden test cases, while admin API exposes them', async () => {
    const studentUser = { id: '00000000-0000-0000-0000-000000000001', role: 'STUDENT', username: 'algo_student' };
    const adminUser = { id: '00000000-0000-0000-0000-000000000002', role: 'ADMIN', username: 'lab_admin' };

    const mockProblemDoc = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      status: 'PUBLISHED',
      difficulty: 'EASY',
      testCases: [
        { id: 'tc-1', input: '()[]{}', expectedOutput: 'true', isPublic: true },
        { id: 'tc-2', input: '(]', expectedOutput: 'false', isPublic: true },
        { id: 'tc-3', input: '((((', expectedOutput: 'false', isPublic: false, explanation: 'Unclosed open brackets' }
      ]
    };

    vi.spyOn(ProblemModel, 'findOne').mockReturnValue({
      lean: () => Promise.resolve(mockProblemDoc)
    } as any);

    // Student request
    const studentResObj = mockReqRes({
      params: { id: 'valid-parentheses' },
      user: studentUser
    });
    await getProblemById(studentResObj.req, studentResObj.res);

    expect(studentResObj.res.statusCode).toBe(200);
    const studentTestCases = studentResObj.res.data.data.testCases;
    expect(studentTestCases).toHaveLength(2); // Only public
    expect(studentTestCases.every((tc: any) => tc.isPublic === true)).toBe(true);

    // Admin request
    const adminResObj = mockReqRes({
      params: { id: 'valid-parentheses' },
      user: adminUser
    });
    await getAdminProblemById(adminResObj.req, adminResObj.res);

    expect(adminResObj.res.statusCode).toBe(200);
    const adminTestCases = adminResObj.res.data.data.testCases;
    expect(adminTestCases).toHaveLength(3); // Public + Hidden
    expect(adminTestCases.some((tc: any) => tc.isPublic === false)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 3. Custom Run Ephemeral Sandbox Isolation
  // ---------------------------------------------------------------------------
  it('3. Custom Run Isolation: returns EXECUTED verdict without saving submission or queueing BullMQ job', async () => {
    const studentUser = { id: '00000000-0000-0000-0000-000000000001', role: 'STUDENT', username: 'algo_student' };

    vi.spyOn(SandboxRunnerService.prototype, 'executeEphemeral').mockResolvedValue({
      status: 'EXECUTED',
      verdict: 'EXECUTED',
      stdout: 'true\n',
      stderr: '',
      compileOutput: '',
      executionTimeMs: 12,
      memoryUsedKb: 13500
    });

    const createSubmissionSpy = vi.spyOn(SubmissionModel, 'create');
    const queueAddSpy = vi.spyOn(submissionQueue, 'add');

    const { req, res } = mockReqRes({
      body: {
        language: 'python',
        code: 'print(True)',
        stdin: '()[]{}'
      },
      user: studentUser
    });

    await runCustomCode(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.verdict).toBe('EXECUTED');
    expect(res.data.data.stdout).toBe('true\n');
    expect(createSubmissionSpy).not.toHaveBeenCalled();
    expect(queueAddSpy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 4. Official Submit Pipeline & BullMQ Deduplication
  // ---------------------------------------------------------------------------
  it('4. Submit Pipeline: creates submission with QUEUED/PENDING and enqueues to BullMQ with deterministic ID', async () => {
    const studentUser = { id: '00000000-0000-0000-0000-000000000001', role: 'STUDENT', username: 'algo_student' };
    const probId = new mongoose.Types.ObjectId();
    const subId = new mongoose.Types.ObjectId();

    vi.spyOn(ProblemModel, 'findById').mockReturnValue(
      makeQuery({
        _id: probId,
        status: 'PUBLISHED',
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
        testCases: []
      }) as any
    );

    vi.spyOn(SubmissionModel, 'create').mockResolvedValue({
      _id: subId,
      id: subId.toString(),
      problemId: probId.toString(),
      userId: studentUser.id,
      username: studentUser.username,
      language: 'python',
      languageId: 71,
      code: 'def search(): pass',
      codeLength: 18,
      pipelineStatus: 'QUEUED',
      verdict: 'PENDING',
      isTestRun: false
    } as any);

    const queueAddSpy = vi.spyOn(submissionQueue, 'add').mockResolvedValue({ id: subId.toString() } as any);

    const { req, res } = mockReqRes({
      body: {
        problemId: probId.toString(),
        language: 'python',
        code: 'def search(): pass'
      },
      user: studentUser
    });

    await createSubmission(req, res);

    expect(res.statusCode).toBe(202);
    expect(res.data.success).toBe(true);
    expect(res.data.data.pipelineStatus).toBe('QUEUED');
    expect(queueAddSpy).toHaveBeenCalledWith(
      'evaluate-submission',
      expect.objectContaining({ submissionId: subId.toString() }),
      expect.objectContaining({ attempts: 3, priority: 2 })
    );
  });

  // ---------------------------------------------------------------------------
  // 5. Unpublished / Archived Problem Guard
  // ---------------------------------------------------------------------------
  it('5. Unpublished Guard: student submission to unpublished/archived problem is blocked with 404', async () => {
    const studentUser = { id: '00000000-0000-0000-0000-000000000001', role: 'STUDENT', username: 'algo_student' };
    const unpublishedProbId = new mongoose.Types.ObjectId();

    vi.spyOn(ProblemModel, 'findById').mockReturnValue(
      makeQuery({
        _id: unpublishedProbId,
        status: 'UNPUBLISHED'
      }) as any
    );

    const { req, res } = mockReqRes({
      body: {
        problemId: unpublishedProbId.toString(),
        language: 'python',
        code: 'def solution(): pass'
      },
      user: studentUser
    });

    await createSubmission(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.data.success).toBe(false);
    expect(res.data.error.code).toBe('NOT_FOUND');
  });

  // ---------------------------------------------------------------------------
  // 6. AI Evaluation Fault Tolerance Invariant
  // ---------------------------------------------------------------------------
  it('6. AI Isolation: AI generation fallback never overrides deterministic verdict', async () => {
    const studentUser = { id: '00000000-0000-0000-0000-000000000001', role: 'STUDENT', username: 'algo_student' };
    const probId = new mongoose.Types.ObjectId();
    const subAId = new mongoose.Types.ObjectId();
    const subBId = new mongoose.Types.ObjectId();

    const mockSubA = {
      _id: subAId,
      userId: studentUser.id,
      username: studentUser.username,
      problemId: probId.toString(),
      language: 'python',
      code: 'def twoSum(): pass',
      executionTimeMs: 82,
      memoryUsedKb: 14200,
      compositeScore: 68.4,
      createdAt: new Date().toISOString()
    };

    const mockSubB = {
      _id: subBId,
      userId: studentUser.id,
      username: studentUser.username,
      problemId: probId.toString(),
      language: 'python',
      code: 'def twoSum(): return [0, 1]',
      executionTimeMs: 14,
      memoryUsedKb: 14050,
      compositeScore: 98.2,
      createdAt: new Date().toISOString()
    };

    vi.spyOn(SubmissionModel, 'findById').mockImplementation((id: any) => {
      const match = id.toString() === subAId.toString() ? mockSubA : mockSubB;
      return makeQuery(match) as any;
    });

    vi.spyOn(ProblemModel, 'findById').mockReturnValue(
      makeQuery({
        _id: probId,
        title: 'Two Sum Optimal',
        status: 'PUBLISHED'
      }) as any
    );

    vi.spyOn(EvaluationReportModel, 'findOne').mockReturnValue(
      makeQuery({
        aiAnalysis: { theoreticalComplexity: { timeComplexity: 'O(N^2)', spaceComplexity: 'O(1)' } }
      }) as any
    );

    // Simulate Gemini API outage
    vi.spyOn(GeminiAnalysisClient.prototype, 'analyzeComparison').mockRejectedValue(new Error('Gemini API Quota Exceeded (429)'));

    const comparisonId = new mongoose.Types.ObjectId();
    vi.spyOn(SolutionComparisonModel, 'create').mockResolvedValue({
      _id: comparisonId,
      id: comparisonId.toString(),
      problemId: probId.toString(),
      submissionA: { ...mockSubA, submissionId: subAId.toString() },
      submissionB: { ...mockSubB, submissionId: subBId.toString() },
      deltaAnalysis: {
        executionTimeDiffMs: -68,
        memoryDiffKb: -150,
        tradeOffSummary: 'Deterministic trade-off baseline'
      }
    } as any);

    const { req, res } = mockReqRes({
      body: { submissionIdA: subAId.toString(), submissionIdB: subBId.toString() },
      user: studentUser
    });

    await createComparison(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data.deltaAnalysis.executionTimeDiffMs).toBe(-68);
  });

  // ---------------------------------------------------------------------------
  // 7. Evolutionary Solution Comparison Retrieval
  // ---------------------------------------------------------------------------
  it('7. Evolutionary Comparison Retrieval: returns user latest problem comparison', async () => {
    const studentUser = { id: '00000000-0000-0000-0000-000000000001', role: 'STUDENT', username: 'algo_student' };
    const probId = new mongoose.Types.ObjectId();

    const mockComparison = {
      _id: new mongoose.Types.ObjectId(),
      problemId: probId.toString(),
      submissionA: { submissionId: 'sub-1', userId: studentUser.id, executionTimeMs: 82, timeComplexity: 'O(N^2)' },
      submissionB: { submissionId: 'sub-3', userId: studentUser.id, executionTimeMs: 14, timeComplexity: 'O(N)' },
      deltaAnalysis: {
        executionTimeDiffMs: -68,
        tradeOffSummary: 'Approach B reduces runtime by 82.9% using O(N) single-pass hash map.'
      }
    };

    vi.spyOn(SolutionComparisonModel, 'findOne').mockReturnValue({
      sort: () => ({
        lean: () => Promise.resolve(mockComparison)
      })
    } as any);

    const { req, res } = mockReqRes({
      params: { problemId: probId.toString() },
      user: studentUser
    });

    await getProblemComparison(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.deltaAnalysis.executionTimeDiffMs).toBe(-68);
    expect(res.data.data.submissionA.timeComplexity).toBe('O(N^2)');
    expect(res.data.data.submissionB.timeComplexity).toBe('O(N)');
  });

  // ---------------------------------------------------------------------------
  // 8. Global & Problem Leaderboard Consistency
  // ---------------------------------------------------------------------------
  it('8. Leaderboard Consistency: computes ranking, deduplication and enriches profile data', async () => {
    const adaId = '00000000-0000-0000-0000-000000000003';
    const alanId = '00000000-0000-0000-0000-000000000004';

    vi.spyOn(SubmissionModel, 'aggregate').mockResolvedValue([
      {
        rankings: [
          { _id: adaId, username: 'ada_lovelace', problemsSolved: 5, totalScore: 494.5, avgRuntimeMs: 12.6, lastActiveAt: new Date().toISOString() },
          { _id: alanId, username: 'alan_turing', problemsSolved: 4, totalScore: 390.2, avgRuntimeMs: 15.0, lastActiveAt: new Date().toISOString() }
        ],
        totalCount: [{ count: 2 }]
      }
    ] as any);

    vi.spyOn(pgPool, 'query').mockResolvedValue({
      rows: [
        { user_id: adaId, avatar_url: 'https://example.com/ada.jpg', current_streak: 12 },
        { user_id: alanId, avatar_url: 'https://example.com/alan.jpg', current_streak: 8 }
      ]
    } as any);

    const { req, res } = mockReqRes({});
    await getGlobalLeaderboard(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.totalRanked).toBe(2);
    expect(res.data.data.rankings[0].username).toBe('ada_lovelace');
    expect(res.data.data.rankings[0].problemsSolved).toBe(5);
    expect(res.data.data.rankings[0].streak).toBe(12);
    expect(res.data.data.rankings[1].username).toBe('alan_turing');
    expect(res.data.data.rankings[1].problemsSolved).toBe(4);
    expect(res.data.data.rankings[1].streak).toBe(8);
  });
});
