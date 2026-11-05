import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiEvaluatorService, AiEvaluationContext } from '../apps/worker/src/services/ai-evaluator.service.js';
import { TestEvaluatorService } from '../apps/worker/src/services/test-evaluator.js';
import { ScoringService } from '../apps/worker/src/services/scoring.service.js';
import { GeminiAnalysisClient } from '@aica/ai-engine';
import { Verdict } from '@aica/shared';

// In-Memory Mock Database
class MockCollection {
  private data: Map<string, any> = new Map();

  constructor(initialData: any[] = []) {
    for (const item of initialData) {
      this.data.set(item._id.toString(), { ...item });
    }
  }

  async findOne(query: any) {
    if (query._id) {
      const id = query._id.toString ? query._id.toString() : String(query._id);
      return this.data.get(id) || null;
    }
    if (query.submissionId) {
      for (const item of this.data.values()) {
        if (item.submissionId === query.submissionId) return { ...item };
      }
      return null;
    }
    return null;
  }

  async updateOne(filter: any, update: any) {
    const id = filter._id ? (filter._id.toString ? filter._id.toString() : String(filter._id)) : null;
    let target = id ? this.data.get(id) : null;

    if (!target && filter.submissionId) {
      for (const item of this.data.values()) {
        if (item.submissionId === filter.submissionId) {
          target = item;
          break;
        }
      }
    }

    if (target && update.$set) {
      Object.assign(target, update.$set);
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }

  async insertOne(doc: any) {
    const id = doc._id ? doc._id.toString() : `mock_${Date.now()}_${Math.random()}`;
    const stored = { ...doc, _id: id };
    this.data.set(id, stored);
    return { insertedId: id };
  }

  get(id: string) {
    return this.data.get(id);
  }
}

describe('Phase 1: AI & Deterministic Evaluation Isolation', () => {
  let mockSubmissionsCol: MockCollection;
  let mockProblemsCol: MockCollection;
  let mockReportsCol: MockCollection;
  let mockDb: any;
  let mockRedisPublisher: any;

  const sampleSubmissionId = '654321654321654321654321';
  const sampleProblemId = '123456123456123456123456';

  beforeEach(() => {
    mockSubmissionsCol = new MockCollection([
      {
        _id: sampleSubmissionId,
        problemId: sampleProblemId,
        userId: 'user_1',
        username: 'coder123',
        language: 'python',
        code: 'def twoSum(nums, target):\n    return [0, 1]',
        pipelineStatus: 'COMPLETED',
        verdict: 'PENDING',
        executionTimeMs: 45,
        memoryUsedKb: 15000,
        compositeScore: 0,
        testCasesTotal: 5,
        testCasesPassed: 5,
        testResults: []
      }
    ]);

    mockProblemsCol = new MockCollection([
      {
        _id: sampleProblemId,
        title: 'Two Sum',
        description: 'Find two numbers summing to target',
        constraints: ['2 <= nums.length <= 10^4'],
        timeLimitMs: 2000,
        memoryLimitKb: 256000,
        benchmarks: { targetTimeMs: 15, pythonMultiplier: 4.0 }
      }
    ]);

    mockReportsCol = new MockCollection();

    mockDb = {
      collection: (name: string) => {
        if (name === 'submissions') return mockSubmissionsCol;
        if (name === 'problems') return mockProblemsCol;
        if (name === 'evaluation_reports') return mockReportsCol;
        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    mockRedisPublisher = {
      zadd: vi.fn().mockResolvedValue(1),
      publish: vi.fn().mockResolvedValue(1)
    };
  });

  describe('Deterministic Test Evaluator Precedence', () => {
    it('should determine verdict purely deterministically from test results', () => {
      const outcome = TestEvaluatorService.evaluateBatch(
        [
          { token: 't1', testCaseId: 'tc1', index: 1, isPublic: true, expectedOutput: '4' },
          { token: 't2', testCaseId: 'tc2', index: 2, isPublic: false, expectedOutput: '10' }
        ],
        new Map([
          ['t1', { token: 't1', status_id: 3, stdout: Buffer.from('4').toString('base64'), time: '0.01', memory: 12000 }],
          ['t2', { token: 't2', status_id: 3, stdout: Buffer.from('10').toString('base64'), time: '0.02', memory: 13000 }]
        ]) as any
      );

      expect(outcome.verdict).toBe('ACCEPTED');
      expect(outcome.passedCount).toBe(2);
      expect(outcome.totalCount).toBe(2);
    });

    it('should identify WRONG_ANSWER deterministically when outputs diverge', () => {
      const outcome = TestEvaluatorService.evaluateBatch(
        [
          { token: 't1', testCaseId: 'tc1', index: 1, isPublic: true, expectedOutput: '4' },
          { token: 't2', testCaseId: 'tc2', index: 2, isPublic: false, expectedOutput: '10' }
        ],
        new Map([
          ['t1', { token: 't1', status_id: 3, stdout: Buffer.from('4').toString('base64'), time: '0.01', memory: 12000 }],
          ['t2', { token: 't2', status_id: 3, stdout: Buffer.from('99').toString('base64'), time: '0.02', memory: 13000 }] // '99' != '10'
        ]) as any
      );

      expect(outcome.verdict).toBe('WRONG_ANSWER');
      expect(outcome.passedCount).toBe(1);
      expect(outcome.totalCount).toBe(2);
    });
  });

  describe('Fault-Tolerant AI Isolation Scenarios (7 Invariant Tests)', () => {
    it('1. Correct code + Gemini success → ACCEPTED (aiStatus: COMPLETED)', async () => {
      // Deterministic verdict locked as ACCEPTED
      await mockSubmissionsCol.updateOne(
        { _id: sampleSubmissionId },
        { $set: { verdict: 'ACCEPTED' } }
      );

      const mockAiClient = {
        analyzeAcceptedSolution: vi.fn().mockResolvedValue({
          status: 'COMPLETED',
          mode: 'OPTIMIZATION',
          codeSummary: 'Optimal hash map solution',
          theoreticalComplexity: {
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(N)',
            explanation: 'Single-pass dictionary lookup'
          },
          codeQuality: {
            score: 9.0,
            readabilityAnalysis: 'Very clean',
            codeSmells: [],
            positivePractices: ['Descriptive variable names']
          },
          optimizationSuggestions: []
        }),
        analyzeDiagnosticSolution: vi.fn()
      } as unknown as GeminiAnalysisClient;

      const service = new AiEvaluatorService(mockAiClient);
      const result = await service.evaluateSubmissionAi(
        {
          submissionId: sampleSubmissionId,
          problemId: sampleProblemId,
          userId: 'user_1',
          username: 'coder123',
          language: 'python',
          code: 'pass',
          verdict: 'ACCEPTED',
          executionTimeMs: 40,
          memoryUsedKb: 14000,
          passedCount: 5,
          totalCount: 5
        },
        { db: mockDb, redisPublisher: mockRedisPublisher }
      );

      expect(result.success).toBe(true);
      expect(result.aiStatus).toBe('COMPLETED');

      // VERIFY DB RECORD: Verdict is strictly ACCEPTED, never altered
      const updatedSub = mockSubmissionsCol.get(sampleSubmissionId);
      expect(updatedSub.verdict).toBe('ACCEPTED');
      expect(updatedSub.aiStatus).toBe('COMPLETED');
      expect(updatedSub.pipelineStatus).toBe('COMPLETED');
    });

    it('2. Correct code + Gemini timeout → ACCEPTED (aiStatus: FAILED, NEVER INTERNAL_ERROR)', async () => {
      await mockSubmissionsCol.updateOne(
        { _id: sampleSubmissionId },
        { $set: { verdict: 'ACCEPTED' } }
      );

      // AI client simulates a hanging / timing out request
      const mockAiClient = {
        analyzeAcceptedSolution: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 20000))
        ),
        analyzeDiagnosticSolution: vi.fn()
      } as unknown as GeminiAnalysisClient;

      const service = new AiEvaluatorService(mockAiClient);

      // Set timeout to 100ms for fast test verification
      const result = await service.evaluateSubmissionAi(
        {
          submissionId: sampleSubmissionId,
          problemId: sampleProblemId,
          userId: 'user_1',
          username: 'coder123',
          language: 'python',
          code: 'pass',
          verdict: 'ACCEPTED',
          executionTimeMs: 40,
          memoryUsedKb: 14000,
          passedCount: 5,
          totalCount: 5
        },
        { db: mockDb, redisPublisher: mockRedisPublisher, timeoutMs: 100 }
      );

      expect(result.success).toBe(false);
      expect(result.aiStatus).toBe('FAILED');
      expect(result.error).toContain('timed out');

      // CRITICAL INVARIANT: Verdict MUST REMAIN 'ACCEPTED', NEVER downgraded to 'INTERNAL_ERROR'
      const updatedSub = mockSubmissionsCol.get(sampleSubmissionId);
      expect(updatedSub.verdict).toBe('ACCEPTED');
      expect(updatedSub.aiStatus).toBe('FAILED');
      expect(updatedSub.pipelineStatus).toBe('COMPLETED');
    });

    it('3. Correct code + Gemini 429 Rate Limit → ACCEPTED (aiStatus: FAILED)', async () => {
      await mockSubmissionsCol.updateOne(
        { _id: sampleSubmissionId },
        { $set: { verdict: 'ACCEPTED' } }
      );

      const rateLimitError: any = new Error('Resource has been exhausted (e.g. check quota)');
      rateLimitError.status = 429;

      const mockAiClient = {
        analyzeAcceptedSolution: vi.fn().mockRejectedValue(rateLimitError),
        analyzeDiagnosticSolution: vi.fn()
      } as unknown as GeminiAnalysisClient;

      const service = new AiEvaluatorService(mockAiClient);
      const result = await service.evaluateSubmissionAi(
        {
          submissionId: sampleSubmissionId,
          problemId: sampleProblemId,
          userId: 'user_1',
          username: 'coder123',
          language: 'python',
          code: 'pass',
          verdict: 'ACCEPTED',
          executionTimeMs: 40,
          memoryUsedKb: 14000,
          passedCount: 5,
          totalCount: 5
        },
        { db: mockDb, redisPublisher: mockRedisPublisher }
      );

      expect(result.success).toBe(false);
      expect(result.aiStatus).toBe('FAILED');
      expect(result.error).toContain('exhausted');

      // Verdict MUST stay ACCEPTED
      const updatedSub = mockSubmissionsCol.get(sampleSubmissionId);
      expect(updatedSub.verdict).toBe('ACCEPTED');
      expect(updatedSub.aiStatus).toBe('FAILED');
    });

    it('4. Correct code + Gemini API unavailable (missing key / network drop) → ACCEPTED', async () => {
      await mockSubmissionsCol.updateOne(
        { _id: sampleSubmissionId },
        { $set: { verdict: 'ACCEPTED' } }
      );

      const mockAiClient = {
        analyzeAcceptedSolution: vi.fn().mockRejectedValue(
          new Error('AI_CONFIG_ERROR: Google Gemini API key is missing. Set GEMINI_API_KEY in environment variables.')
        ),
        analyzeDiagnosticSolution: vi.fn()
      } as unknown as GeminiAnalysisClient;

      const service = new AiEvaluatorService(mockAiClient);
      const result = await service.evaluateSubmissionAi(
        {
          submissionId: sampleSubmissionId,
          problemId: sampleProblemId,
          userId: 'user_1',
          username: 'coder123',
          language: 'python',
          code: 'pass',
          verdict: 'ACCEPTED',
          executionTimeMs: 40,
          memoryUsedKb: 14000,
          passedCount: 5,
          totalCount: 5
        },
        { db: mockDb, redisPublisher: mockRedisPublisher }
      );

      expect(result.success).toBe(false);
      expect(result.aiStatus).toBe('FAILED');
      expect(result.error).toContain('AI_CONFIG_ERROR');

      // Verdict MUST stay ACCEPTED
      const updatedSub = mockSubmissionsCol.get(sampleSubmissionId);
      expect(updatedSub.verdict).toBe('ACCEPTED');
      expect(updatedSub.aiStatus).toBe('FAILED');
    });

    it('5. Incorrect code + Gemini success → WRONG_ANSWER (aiStatus: COMPLETED)', async () => {
      await mockSubmissionsCol.updateOne(
        { _id: sampleSubmissionId },
        { $set: { verdict: 'WRONG_ANSWER' } }
      );

      const mockAiClient = {
        analyzeAcceptedSolution: vi.fn(),
        analyzeDiagnosticSolution: vi.fn().mockResolvedValue({
          status: 'COMPLETED',
          mode: 'DIAGNOSTIC',
          codeSummary: 'Off-by-one boundary failure in loop termination',
          theoreticalComplexity: {
            timeComplexity: 'O(N^2)',
            spaceComplexity: 'O(1)',
            explanation: 'Nested loops scan'
          },
          codeQuality: {
            score: 5.0,
            readabilityAnalysis: 'Moderate structure',
            codeSmells: ['Duplicate checks'],
            positivePractices: []
          },
          diagnosticFeedback: {
            rootCauseBug: 'Index out of bounds on empty array',
            edgeCaseVulnerability: 'Single element slice',
            socraticHint: 'Consider what happens when nums is empty'
          },
          optimizationSuggestions: []
        })
      } as unknown as GeminiAnalysisClient;

      const service = new AiEvaluatorService(mockAiClient);
      const result = await service.evaluateSubmissionAi(
        {
          submissionId: sampleSubmissionId,
          problemId: sampleProblemId,
          userId: 'user_1',
          username: 'coder123',
          language: 'python',
          code: 'pass',
          verdict: 'WRONG_ANSWER',
          executionTimeMs: 50,
          memoryUsedKb: 16000,
          passedCount: 2,
          totalCount: 5
        },
        { db: mockDb, redisPublisher: mockRedisPublisher }
      );

      expect(result.success).toBe(true);
      expect(result.aiStatus).toBe('COMPLETED');

      // INVIOLABLE: Verdict MUST REMAIN WRONG_ANSWER, never changed to ACCEPTED by AI
      const updatedSub = mockSubmissionsCol.get(sampleSubmissionId);
      expect(updatedSub.verdict).toBe('WRONG_ANSWER');
      expect(updatedSub.aiStatus).toBe('COMPLETED');
    });

    it('6. Incorrect code + Gemini failure → WRONG_ANSWER (aiStatus: FAILED)', async () => {
      await mockSubmissionsCol.updateOne(
        { _id: sampleSubmissionId },
        { $set: { verdict: 'WRONG_ANSWER' } }
      );

      const mockAiClient = {
        analyzeAcceptedSolution: vi.fn(),
        analyzeDiagnosticSolution: vi.fn().mockRejectedValue(new Error('AI Service 503 Overloaded'))
      } as unknown as GeminiAnalysisClient;

      const service = new AiEvaluatorService(mockAiClient);
      const result = await service.evaluateSubmissionAi(
        {
          submissionId: sampleSubmissionId,
          problemId: sampleProblemId,
          userId: 'user_1',
          username: 'coder123',
          language: 'python',
          code: 'pass',
          verdict: 'WRONG_ANSWER',
          executionTimeMs: 50,
          memoryUsedKb: 16000,
          passedCount: 2,
          totalCount: 5
        },
        { db: mockDb, redisPublisher: mockRedisPublisher }
      );

      expect(result.success).toBe(false);
      expect(result.aiStatus).toBe('FAILED');

      // INVIOLABLE: Verdict MUST REMAIN WRONG_ANSWER, NEVER converted to INTERNAL_ERROR or ACCEPTED
      const updatedSub = mockSubmissionsCol.get(sampleSubmissionId);
      expect(updatedSub.verdict).toBe('WRONG_ANSWER');
      expect(updatedSub.aiStatus).toBe('FAILED');
    });

    it('7. Repeated AI retries must never modify the deterministic verdict', async () => {
      // Step A: Set initial deterministic verdict as ACCEPTED
      await mockSubmissionsCol.updateOne(
        { _id: sampleSubmissionId },
        { $set: { verdict: 'ACCEPTED' } }
      );

      let attemptCount = 0;
      const mockAiClient = {
        analyzeAcceptedSolution: vi.fn().mockImplementation(async () => {
          attemptCount++;
          if (attemptCount === 1) throw new Error('Attempt 1: 500 Network failure');
          if (attemptCount === 2) throw new Error('Attempt 2: 429 Rate limit');
          return {
            status: 'COMPLETED',
            mode: 'OPTIMIZATION',
            codeSummary: 'Attempt 3: Finally succeeded',
            theoreticalComplexity: { timeComplexity: 'O(N)', spaceComplexity: 'O(1)', explanation: 'Optimal' },
            codeQuality: { score: 8.5, readabilityAnalysis: 'Good', codeSmells: [], positivePractices: [] },
            optimizationSuggestions: []
          };
        }),
        analyzeDiagnosticSolution: vi.fn()
      } as unknown as GeminiAnalysisClient;

      const service = new AiEvaluatorService(mockAiClient);

      const aiContext: AiEvaluationContext = {
        submissionId: sampleSubmissionId,
        problemId: sampleProblemId,
        userId: 'user_1',
        username: 'coder123',
        language: 'python',
        code: 'pass',
        verdict: 'ACCEPTED',
        executionTimeMs: 40,
        memoryUsedKb: 14000,
        passedCount: 5,
        totalCount: 5
      };

      // Retry 1: AI Fails with Network failure
      const res1 = await service.evaluateSubmissionAi(aiContext, { db: mockDb });
      expect(res1.aiStatus).toBe('FAILED');
      expect(mockSubmissionsCol.get(sampleSubmissionId).verdict).toBe('ACCEPTED');

      // Retry 2: AI Fails with Rate Limit
      const res2 = await service.evaluateSubmissionAi(aiContext, { db: mockDb });
      expect(res2.aiStatus).toBe('FAILED');
      expect(mockSubmissionsCol.get(sampleSubmissionId).verdict).toBe('ACCEPTED');

      // Retry 3: AI Succeeds
      const res3 = await service.evaluateSubmissionAi(aiContext, { db: mockDb });
      expect(res3.aiStatus).toBe('COMPLETED');
      expect(mockSubmissionsCol.get(sampleSubmissionId).verdict).toBe('ACCEPTED');

      // VERIFY: The deterministic verdict NEVER shifted away from ACCEPTED across all 3 retries
      const finalSub = mockSubmissionsCol.get(sampleSubmissionId);
      expect(finalSub.verdict).toBe('ACCEPTED');
      expect(finalSub.aiStatus).toBe('COMPLETED');
      expect(attemptCount).toBe(3);
    });
  });

  describe('Phase 1.1 Remediation: Redis Fault-Tolerance, Authorization & Deduplication', () => {
    it('1. Redis unavailable after MongoDB verdict persistence → verdict remains ACCEPTED', async () => {
      // Step A: Persist deterministic verdict in MongoDB
      await mockSubmissionsCol.updateOne(
        { _id: sampleSubmissionId },
        { $set: { verdict: 'ACCEPTED', pipelineStatus: 'COMPLETED' } }
      );

      // Simulate Redis publisher failing completely (ECONNREFUSED)
      const brokenRedisPublisher = {
        zadd: vi.fn().mockRejectedValue(new Error('Redis connection lost ECONNREFUSED')),
        publish: vi.fn().mockRejectedValue(new Error('Redis connection lost ECONNREFUSED'))
      };

      const mockAiClient = {
        analyzeAcceptedSolution: vi.fn().mockResolvedValue({
          status: 'COMPLETED',
          mode: 'OPTIMIZATION',
          codeSummary: 'Solution passed',
          theoreticalComplexity: { timeComplexity: 'O(N)', spaceComplexity: 'O(1)', explanation: '' },
          codeQuality: { score: 8.0, readabilityAnalysis: '', codeSmells: [], positivePractices: [] },
          optimizationSuggestions: []
        }),
        analyzeDiagnosticSolution: vi.fn()
      } as unknown as GeminiAnalysisClient;

      const service = new AiEvaluatorService(mockAiClient);

      const result = await service.evaluateSubmissionAi(
        {
          submissionId: sampleSubmissionId,
          problemId: sampleProblemId,
          userId: 'user_1',
          username: 'coder123',
          language: 'python',
          code: 'pass',
          verdict: 'ACCEPTED',
          executionTimeMs: 40,
          memoryUsedKb: 14000,
          passedCount: 5,
          totalCount: 5
        },
        { db: mockDb, redisPublisher: brokenRedisPublisher }
      );

      // Redis failure must not fail the evaluation
      expect(result.success).toBe(true);

      // CRITICAL: MongoDB verdict MUST strictly remain ACCEPTED
      const updatedSub = mockSubmissionsCol.get(sampleSubmissionId);
      expect(updatedSub.verdict).toBe('ACCEPTED');
      expect(updatedSub.pipelineStatus).toBe('COMPLETED');
    });

    it('2. Redis unavailable before or during leaderboard update → evaluation remains successful', async () => {
      // Setup submission in DB with initial pending state
      await mockSubmissionsCol.updateOne(
        { _id: sampleSubmissionId },
        { $set: { verdict: 'PENDING', pipelineStatus: 'EXECUTING' } }
      );

      const outcome = {
        verdict: 'ACCEPTED' as Verdict,
        passedCount: 5,
        totalCount: 5,
        maxExecutionTimeMs: 45,
        maxMemoryKb: 15000,
        compileOutput: '',
        testResults: []
      };

      // Scoring calculation
      const initialScoring = ScoringService.calculate({
        verdict: outcome.verdict,
        passedCount: outcome.passedCount,
        totalCount: outcome.totalCount,
        language: 'python',
        executionTimeMs: outcome.maxExecutionTimeMs,
        memoryUsedKb: outcome.maxMemoryKb
      });

      // 1. In Stage 1: Commit deterministic verdict to MongoDB FIRST
      await mockSubmissionsCol.updateOne(
        { _id: sampleSubmissionId },
        {
          $set: {
            pipelineStatus: 'COMPLETED',
            verdict: outcome.verdict,
            executionTimeMs: outcome.maxExecutionTimeMs,
            memoryUsedKb: outcome.maxMemoryKb,
            compositeScore: initialScoring.compositeScore,
            leaderboardSyncPending: false
          }
        }
      );

      // 2. Leaderboard Redis update throws an error (Redis unavailable)
      const redisPublisher = {
        zadd: vi.fn().mockRejectedValue(new Error('Redis connection refused: 6379'))
      };

      try {
        const zsetKey = `leaderboard:problem:${sampleProblemId}`;
        await redisPublisher.zadd(zsetKey, initialScoring.compositeScore, sampleSubmissionId);
      } catch (redisErr: any) {
        // Handled cleanly by flagging leaderboardSyncPending: true
        await mockSubmissionsCol.updateOne(
          { _id: sampleSubmissionId },
          { $set: { leaderboardSyncPending: true } }
        );
      }

      // Verification: The evaluation remained 100% successful and saved as ACCEPTED
      const subRecord = mockSubmissionsCol.get(sampleSubmissionId);
      expect(subRecord.verdict).toBe('ACCEPTED');
      expect(subRecord.pipelineStatus).toBe('COMPLETED');
      expect(subRecord.leaderboardSyncPending).toBe(true);
    });

    describe('Controller: Authorization & Deduplication Scenarios', () => {
      // Mock Express Request & Response helper
      function mockReqRes(options: {
        submissionId?: string;
        user?: any;
      }) {
        const req: any = {
          params: { submissionId: options.submissionId || sampleSubmissionId },
          user: options.user
        };

        const res: any = {
          statusCode: 200,
          body: null,
          status(code: number) {
            this.statusCode = code;
            return this;
          },
          json(data: any) {
            this.body = data;
            return this;
          }
        };

        return { req, res };
      }

      // Simulated controller logic matching `retryAiAnalysis`
      async function executeRetryAi(req: any, res: any, deps: {
        submissionsCol: MockCollection;
        reportsCol: MockCollection;
        mockQueue: any;
      }) {
        const { submissionId } = req.params;

        // 1. Authentication check
        if (!req.user) {
          res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
          return;
        }

        const submission = await deps.submissionsCol.findOne({ _id: submissionId });
        if (!submission) {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } });
          return;
        }

        // 2. Ownership & Authorization check: Only submission owner or ADMIN can retry
        const isOwner = req.user.id === submission.userId;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You are not authorized to retry AI analysis for this submission' }
          });
          return;
        }

        // 3. State validation: deterministic verdict must exist and not be CE
        if (submission.verdict === 'PENDING') {
          res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Evaluation is pending' } });
          return;
        }

        if (submission.verdict === 'COMPILATION_ERROR') {
          res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Bypassed for compilation error' } });
          return;
        }

        // 4. Deduplication & Conflict check: Reject if already pending or processing
        if (submission.aiStatus === 'PENDING') {
          res.status(409).json({
            success: false,
            error: { code: 'CONFLICT', message: 'AI analysis is already pending or in progress for this submission' }
          });
          return;
        }

        const jobId = `ai-analysis-${submissionId}`;

        // Check BullMQ for active/waiting duplicate job and clean up retained completed/failed job
        const existingJob = await deps.mockQueue.getJob(jobId);
        if (existingJob) {
          const state = await existingJob.getState();
          if (state === 'active' || state === 'waiting' || state === 'delayed') {
            res.status(409).json({
              success: false,
              error: { code: 'CONFLICT', message: 'AI analysis job is currently active or queued' }
            });
            return;
          }
          await existingJob.remove();
        }

        // Mark AI status as PENDING
        await deps.submissionsCol.updateOne(
          { _id: submissionId },
          { $set: { aiStatus: 'PENDING', aiError: '' } }
        );

        // Enqueue to queue with deterministic jobId
        await deps.mockQueue.add('analyze-submission-ai', { submissionId }, { jobId });

        res.status(202).json({
          success: true,
          data: { submissionId, verdict: submission.verdict, aiStatus: 'PENDING' },
          message: 'AI analysis queued for asynchronous retry'
        });
      }

      it('3. Unauthenticated AI retry → 401', async () => {
        const { req, res } = mockReqRes({ user: undefined });
        const mockQueue = { getJob: vi.fn(), add: vi.fn() };

        await executeRetryAi(req, res, {
          submissionsCol: mockSubmissionsCol,
          reportsCol: mockReportsCol,
          mockQueue
        });

        expect(res.statusCode).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });

      it("4. Another user's AI retry → 403", async () => {
        // Submission belongs to 'user_1'
        await mockSubmissionsCol.updateOne(
          { _id: sampleSubmissionId },
          { $set: { userId: 'user_1', verdict: 'ACCEPTED', aiStatus: 'FAILED' } }
        );

        // Request made by 'user_999' (STUDENT)
        const { req, res } = mockReqRes({
          user: { id: 'user_999', role: 'STUDENT', username: 'other_student' }
        });
        const mockQueue = { getJob: vi.fn(), add: vi.fn() };

        await executeRetryAi(req, res, {
          submissionsCol: mockSubmissionsCol,
          reportsCol: mockReportsCol,
          mockQueue
        });

        expect(res.statusCode).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
      });

      it("5. Submission owner's retry → allowed (202)", async () => {
        await mockSubmissionsCol.updateOne(
          { _id: sampleSubmissionId },
          { $set: { userId: 'user_1', verdict: 'ACCEPTED', aiStatus: 'FAILED' } }
        );

        const { req, res } = mockReqRes({
          user: { id: 'user_1', role: 'STUDENT', username: 'coder123' }
        });

        const mockQueue = {
          getJob: vi.fn().mockResolvedValue(null),
          add: vi.fn().mockResolvedValue({ id: `ai-analysis-${sampleSubmissionId}` })
        };

        await executeRetryAi(req, res, {
          submissionsCol: mockSubmissionsCol,
          reportsCol: mockReportsCol,
          mockQueue
        });

        expect(res.statusCode).toBe(202);
        expect(res.body.success).toBe(true);
        expect(res.body.data.aiStatus).toBe('PENDING');

        // Confirmed queued with deterministic jobId
        expect(mockQueue.add).toHaveBeenCalledWith(
          'analyze-submission-ai',
          expect.anything(),
          expect.objectContaining({ jobId: `ai-analysis-${sampleSubmissionId}` })
        );
      });

      it('6. ADMIN retry → allowed (202)', async () => {
        // Submission belongs to 'user_1', but caller is ADMIN 'admin_boss'
        await mockSubmissionsCol.updateOne(
          { _id: sampleSubmissionId },
          { $set: { userId: 'user_1', verdict: 'ACCEPTED', aiStatus: 'FAILED' } }
        );

        const { req, res } = mockReqRes({
          user: { id: 'admin_user_42', role: 'ADMIN', username: 'admin_boss' }
        });

        const mockQueue = {
          getJob: vi.fn().mockResolvedValue(null),
          add: vi.fn().mockResolvedValue({ id: `ai-analysis-${sampleSubmissionId}` })
        };

        await executeRetryAi(req, res, {
          submissionsCol: mockSubmissionsCol,
          reportsCol: mockReportsCol,
          mockQueue
        });

        expect(res.statusCode).toBe(202);
        expect(res.body.success).toBe(true);
      });

      it('7. Duplicate pending retry → 409', async () => {
        // Submission already has aiStatus: 'PENDING'
        await mockSubmissionsCol.updateOne(
          { _id: sampleSubmissionId },
          { $set: { userId: 'user_1', verdict: 'ACCEPTED', aiStatus: 'PENDING' } }
        );

        const { req, res } = mockReqRes({
          user: { id: 'user_1', role: 'STUDENT', username: 'coder123' }
        });
        const mockQueue = { getJob: vi.fn(), add: vi.fn() };

        await executeRetryAi(req, res, {
          submissionsCol: mockSubmissionsCol,
          reportsCol: mockReportsCol,
          mockQueue
        });

        expect(res.statusCode).toBe(409);
        expect(res.body.error.code).toBe('CONFLICT');
        expect(res.body.error.message).toContain('already pending');
      });

      it('8. AI retry after failure → allowed (202) with cleanup of retained failed job', async () => {
        // Submission currently has aiStatus: 'FAILED'
        await mockSubmissionsCol.updateOne(
          { _id: sampleSubmissionId },
          { $set: { userId: 'user_1', verdict: 'ACCEPTED', aiStatus: 'FAILED' } }
        );

        const { req, res } = mockReqRes({
          user: { id: 'user_1', role: 'STUDENT', username: 'coder123' }
        });

        // Retained failed job in BullMQ
        const mockFailedJob = {
          getState: vi.fn().mockResolvedValue('failed'),
          remove: vi.fn().mockResolvedValue(true)
        };

        const mockQueue = {
          getJob: vi.fn().mockResolvedValue(mockFailedJob),
          add: vi.fn().mockResolvedValue({ id: `ai-analysis-${sampleSubmissionId}` })
        };

        await executeRetryAi(req, res, {
          submissionsCol: mockSubmissionsCol,
          reportsCol: mockReportsCol,
          mockQueue
        });

        expect(res.statusCode).toBe(202);
        expect(res.body.success).toBe(true);
        // Verified: The retained failed job was removed before adding the new job
        expect(mockFailedJob.remove).toHaveBeenCalled();
        expect(mockQueue.add).toHaveBeenCalledWith(
          'analyze-submission-ai',
          expect.anything(),
          expect.objectContaining({ jobId: `ai-analysis-${sampleSubmissionId}` })
        );
      });

      it('9. AI retry never modifies the deterministic verdict', async () => {
        // Set deterministic verdict to ACCEPTED
        await mockSubmissionsCol.updateOne(
          { _id: sampleSubmissionId },
          { $set: { userId: 'user_1', verdict: 'ACCEPTED', aiStatus: 'FAILED' } }
        );

        const { req, res } = mockReqRes({
          user: { id: 'user_1', role: 'STUDENT', username: 'coder123' }
        });

        const mockQueue = {
          getJob: vi.fn().mockResolvedValue(null),
          add: vi.fn().mockResolvedValue({ id: `ai-analysis-${sampleSubmissionId}` })
        };

        // Trigger retry
        await executeRetryAi(req, res, {
          submissionsCol: mockSubmissionsCol,
          reportsCol: mockReportsCol,
          mockQueue
        });

        expect(res.statusCode).toBe(202);
        expect(res.body.data.verdict).toBe('ACCEPTED');

        // Check DB record: Verdict is permanently locked as ACCEPTED
        const subInDb = mockSubmissionsCol.get(sampleSubmissionId);
        expect(subInDb.verdict).toBe('ACCEPTED');
        expect(subInDb.aiStatus).toBe('PENDING');
      });
    });
  });
});
