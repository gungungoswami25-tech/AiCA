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
});
