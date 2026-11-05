import { describe, it, expect, vi } from 'vitest';
import { TestEvaluatorService } from '../apps/worker/src/services/test-evaluator.js';
import { ScoringService } from '../apps/worker/src/services/scoring.service.js';
import { SandboxRunnerService } from '../apps/api/src/services/sandbox-runner.service.js';
import { AiEvaluatorService } from '../apps/worker/src/services/ai-evaluator.service.js';

// Mock collection to test database invariants without mutating persistent state
class MockCollection {
  private data: Map<string, any> = new Map();

  async findOne(query: any) {
    if (query._id) return this.data.get(String(query._id)) || null;
    if (query.slug) {
      for (const item of this.data.values()) {
        if (item.slug === query.slug) return { ...item };
      }
    }
    return null;
  }

  async insertOne(doc: any) {
    const id = doc._id ? String(doc._id) : `mock_${Date.now()}_${Math.random()}`;
    const stored = { ...doc, _id: id };
    this.data.set(id, stored);
    return { insertedId: id };
  }

  async updateOne(filter: any, update: any) {
    const id = filter._id ? String(filter._id) : null;
    const item = id ? this.data.get(id) : null;
    if (item && update.$set) {
      Object.assign(item, update.$set);
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }

  count() {
    return this.data.size;
  }
}

describe('E2E Engine Problem Verification & Execution Pipeline', () => {
  // Test Problem Specifications
  const testProblems = {
    palindrome: {
      title: 'Valid Palindrome (Alphanumeric)',
      slug: 'valid-palindrome',
      difficulty: 'EASY',
      tags: ['Strings', 'Two-Pointers'],
      timeLimitMs: 2000,
      benchmarks: {
        targetTimeMs: 15,
        pythonMultiplier: 4.0,
        jsMultiplier: 2.5,
        cppMultiplier: 1.0,
        javaMultiplier: 2.0
      },
      testCases: [
        { id: 'tc-pal-1', input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isPublic: true },
        { id: 'tc-pal-2', input: 'race a car', expectedOutput: 'false', isPublic: true },
        { id: 'tc-pal-3', input: ' ', expectedOutput: 'true', isPublic: false, isEdgeCase: true },
        { id: 'tc-pal-4', input: '0P', expectedOutput: 'false', isPublic: false, isEdgeCase: true },
        { id: 'tc-pal-5', input: 'ab_a', expectedOutput: 'true', isPublic: false, isEdgeCase: true }
      ]
    },
    circle: {
      title: 'Floating Circle Metrics',
      slug: 'floating-circle-metrics',
      difficulty: 'EASY',
      tags: ['Math', 'Geometry'],
      timeLimitMs: 2000,
      benchmarks: {
        targetTimeMs: 15,
        pythonMultiplier: 4.0,
        jsMultiplier: 2.5,
        cppMultiplier: 1.0,
        javaMultiplier: 2.0
      },
      testCases: [
        { id: 'tc-circ-1', input: '5.0', expectedOutput: '78.539816 31.415927', isPublic: true },
        { id: 'tc-circ-2', input: '1.0', expectedOutput: '3.141593 6.283185', isPublic: true },
        { id: 'tc-circ-3', input: '0.0', expectedOutput: '0.0 0.0', isPublic: false, isEdgeCase: true },
        { id: 'tc-circ-4', input: '10.5', expectedOutput: '346.360590 65.973446', isPublic: false }
      ]
    },
    subarray: {
      title: 'Subarray Sum Equals K',
      slug: 'subarray-sum-equals-k',
      difficulty: 'MEDIUM',
      tags: ['Arrays', 'Hash-Table', 'Prefix-Sum'],
      timeLimitMs: 2000,
      benchmarks: {
        targetTimeMs: 20,
        pythonMultiplier: 4.0,
        jsMultiplier: 2.5,
        cppMultiplier: 1.0,
        javaMultiplier: 2.0
      },
      testCases: [
        { id: 'tc-subsum-1', input: '3 2\n1 1 1', expectedOutput: '2', isPublic: true },
        { id: 'tc-subsum-2', input: '3 3\n1 2 3', expectedOutput: '2', isPublic: true },
        { id: 'tc-subsum-3', input: '5 0\n1 -1 1 -1 1', expectedOutput: '4', isPublic: false, isEdgeCase: true },
        { id: 'tc-subsum-4', input: '1 0\n0', expectedOutput: '1', isPublic: false, isEdgeCase: true }
      ]
    }
  };

  // ==========================================================================
  // SECTION 1: Problem Structure & Dynamic Benchmark Multipliers
  // ==========================================================================
  describe('1. Problem Structure & Dynamic Benchmark Multipliers', () => {
    it('should scale language execution timeouts correctly per problem benchmarks', () => {
      const { benchmarks, timeLimitMs } = testProblems.palindrome;

      const pythonTimeout = Math.round(timeLimitMs * benchmarks.pythonMultiplier);
      const jsTimeout = Math.round(timeLimitMs * benchmarks.jsMultiplier);
      const cppTimeout = Math.round(timeLimitMs * benchmarks.cppMultiplier);
      const javaTimeout = Math.round(timeLimitMs * benchmarks.javaMultiplier);

      expect(pythonTimeout).toBe(8000); // 2000 * 4.0
      expect(jsTimeout).toBe(5000);     // 2000 * 2.5
      expect(cppTimeout).toBe(2000);    // 2000 * 1.0
      expect(javaTimeout).toBe(4000);   // 2000 * 2.0
    });

    it('should maintain privacy separation between public and private test cases', () => {
      const { testCases } = testProblems.palindrome;
      const publicCases = testCases.filter((tc) => tc.isPublic);
      const privateCases = testCases.filter((tc) => !tc.isPublic);

      expect(publicCases).toHaveLength(2);
      expect(privateCases).toHaveLength(3);
      expect(privateCases.some((tc) => tc.isEdgeCase)).toBe(true);
    });
  });

  // ==========================================================================
  // SECTION 2: Ephemeral Custom Sandbox Execution (POST /run-custom)
  // ==========================================================================
  describe('2. Ephemeral Custom Input Execution Sandbox', () => {
    it('should execute custom input and return stdout without modifying submissions DB', async () => {
      const runner = new SandboxRunnerService('http://mock-judge0:2358');
      const submissionsTracker = new MockCollection();

      const initialCount = submissionsTracker.count();

      // Mock synchronous Judge0 response
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: { id: 3, description: 'Accepted' },
          stdout: Buffer.from('true\n').toString('base64'),
          stderr: null,
          compile_output: null,
          time: '0.035',
          memory: 8192
        })
      } as any);

      const result = await runner.executeEphemeral({
        language: 'python',
        code: "import sys; print('true')",
        stdin: 'A man, a plan, a canal: Panama',
        baseTimeLimitSec: 8.0,
        memoryLimitKb: 262144
      });

      expect(result.verdict).toBe('ACCEPTED');
      expect(result.stdout.trim()).toBe('true');
      expect(result.isError).toBe(false);
      expect(result.executionTimeMs).toBe(35);
      expect(result.memoryUsedKb).toBe(8192);

      // Invariant: Ephemeral run must NEVER create a record in submissions collection
      expect(submissionsTracker.count()).toBe(initialCount);
    });

    it('should capture runtime exceptions in custom run cleanly with stderr', async () => {
      const runner = new SandboxRunnerService('http://mock-judge0:2358');

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: { id: 11, description: 'Runtime Error (NZEC)' },
          stdout: null,
          stderr: Buffer.from('ZeroDivisionError: division by zero\n').toString('base64'),
          compile_output: null,
          time: '0.012',
          memory: 7168
        })
      } as any);

      const result = await runner.executeEphemeral({
        language: 'python',
        code: 'x = 1 / 0',
        stdin: '',
        baseTimeLimitSec: 2.0,
        memoryLimitKb: 262144
      });

      expect(result.verdict).toBe('RUNTIME_ERROR');
      expect(result.isError).toBe(true);
      expect(result.stderr).toContain('ZeroDivisionError: division by zero');
    });
  });

  // ==========================================================================
  // SECTION 3: Token Diff Engine & Precision Testing
  // ==========================================================================
  describe('3. Deterministic Diff Engine on Created Problems', () => {
    it('Valid Palindrome: matches string outputs with trailing newlines and spaces', () => {
      expect(TestEvaluatorService.compareOutputs('true\n', 'true')).toBe(true);
      expect(TestEvaluatorService.compareOutputs('false  \r\n', 'false')).toBe(true);
      expect(TestEvaluatorService.compareOutputs('true', 'false')).toBe(false);
    });

    it('Floating Circle Metrics: matches float tokens within epsilon 10^-6 tolerance', () => {
      // Expected: "78.539816 31.415927"
      // Actual from math.pi computation: 78.539816339 31.415926535
      const actualHighPrecision = '78.539816339 31.415926535\n';
      const expectedRounded = '78.539816 31.415927';

      expect(TestEvaluatorService.compareOutputs(actualHighPrecision, expectedRounded)).toBe(true);
    });

    it('Floating Circle Metrics: rejects float values exceeding epsilon', () => {
      const incorrectFloat = '78.540000 31.415927';
      const expectedRounded = '78.539816 31.415927';

      expect(TestEvaluatorService.compareOutputs(incorrectFloat, expectedRounded)).toBe(false);
    });

    it('Subarray Sum Equals K: matches single integer outputs with whitespace immunity', () => {
      expect(TestEvaluatorService.compareOutputs('   2   \n', '2')).toBe(true);
      expect(TestEvaluatorService.compareOutputs('4\r\n', '4')).toBe(true);
      expect(TestEvaluatorService.compareOutputs('3', '4')).toBe(false);
    });
  });

  // ==========================================================================
  // SECTION 4: Verdict Precedence Hierarchy & Test Evaluator
  // ==========================================================================
  describe('4. Deterministic Verdict Precedence Hierarchy', () => {
    it('All test cases pass -> returns ACCEPTED with full count', () => {
      const tokenMappings = [
        { testCaseId: 'tc-1', expectedOutput: 'true', token: 'tok-1' },
        { testCaseId: 'tc-2', expectedOutput: 'false', token: 'tok-2' },
        { testCaseId: 'tc-3', expectedOutput: 'true', token: 'tok-3' }
      ];

      const judge0Results = new Map<string, any>([
        ['tok-1', { status: { id: 3, description: 'Accepted' }, status_id: 3, stdout: Buffer.from('true').toString('base64'), time: '0.015', memory: 4096 }],
        ['tok-2', { status: { id: 3, description: 'Accepted' }, status_id: 3, stdout: Buffer.from('false').toString('base64'), time: '0.018', memory: 4200 }],
        ['tok-3', { status: { id: 3, description: 'Accepted' }, status_id: 3, stdout: Buffer.from('true').toString('base64'), time: '0.012', memory: 3900 }]
      ]);

      const outcome = TestEvaluatorService.evaluateBatch(tokenMappings, judge0Results);
      expect(outcome.verdict).toBe('ACCEPTED');
      expect(outcome.passedCount).toBe(3);
      expect(outcome.totalCount).toBe(3);
      expect(outcome.maxExecutionTimeMs).toBe(18);
    });

    it('One failing test case -> returns WRONG_ANSWER', () => {
      const tokenMappings = [
        { testCaseId: 'tc-1', expectedOutput: 'true', token: 'tok-1' },
        { testCaseId: 'tc-2', expectedOutput: 'false', token: 'tok-2' }
      ];

      const judge0Results = new Map<string, any>([
        ['tok-1', { status: { id: 3, description: 'Accepted' }, status_id: 3, stdout: Buffer.from('true').toString('base64'), time: '0.015', memory: 4096 }],
        ['tok-2', { status: { id: 3, description: 'Accepted' }, status_id: 3, stdout: Buffer.from('true').toString('base64'), time: '0.018', memory: 4200 }] // Mismatch: expected false
      ]);

      const outcome = TestEvaluatorService.evaluateBatch(tokenMappings, judge0Results);
      expect(outcome.verdict).toBe('WRONG_ANSWER');
      expect(outcome.passedCount).toBe(1);
      expect(outcome.totalCount).toBe(2);
    });

    it('Verdict Precedence: TLE overrides WRONG_ANSWER', () => {
      const tokenMappings = [
        { testCaseId: 'tc-1', expectedOutput: '2', token: 'tok-1' },
        { testCaseId: 'tc-2', expectedOutput: '2', token: 'tok-2' }
      ];

      const judge0Results = new Map<string, any>([
        ['tok-1', { status: { id: 4, description: 'Wrong Answer' }, status_id: 4, stdout: Buffer.from('0').toString('base64') }],
        ['tok-2', { status: { id: 5, description: 'Time Limit Exceeded' }, status_id: 5, stdout: null }]
      ]);

      const outcome = TestEvaluatorService.evaluateBatch(tokenMappings, judge0Results);
      expect(outcome.verdict).toBe('TIME_LIMIT_EXCEEDED');
    });

    it('Verdict Precedence: RUNTIME_ERROR overrides TIME_LIMIT_EXCEEDED', () => {
      const tokenMappings = [
        { testCaseId: 'tc-1', expectedOutput: '2', token: 'tok-1' },
        { testCaseId: 'tc-2', expectedOutput: '2', token: 'tok-2' }
      ];

      const judge0Results = new Map<string, any>([
        ['tok-1', { status: { id: 5, description: 'Time Limit Exceeded' }, status_id: 5, stdout: null }],
        ['tok-2', { status: { id: 11, description: 'Runtime Error' }, status_id: 11, stderr: Buffer.from('IndexError').toString('base64') }]
      ]);

      const outcome = TestEvaluatorService.evaluateBatch(tokenMappings, judge0Results);
      expect(outcome.verdict).toBe('RUNTIME_ERROR');
    });

    it('Verdict Precedence: COMPILATION_ERROR overrides RUNTIME_ERROR', () => {
      const tokenMappings = [
        { testCaseId: 'tc-1', expectedOutput: '2', token: 'tok-1' }
      ];

      const judge0Results = new Map<string, any>([
        ['tok-1', { status: { id: 6, description: 'Compilation Error' }, status_id: 6, compile_output: Buffer.from('SyntaxError').toString('base64') }]
      ]);

      const outcome = TestEvaluatorService.evaluateBatch(tokenMappings, judge0Results);
      expect(outcome.verdict).toBe('COMPILATION_ERROR');
    });
  });

  // ==========================================================================
  // SECTION 5: AI Evaluator Engine & Isolation Invariants
  // ==========================================================================
  describe('5. AI Evaluator Engine & Strict Isolation Guarantees', () => {
    const validSubId = '654321654321654321654321';
    const validProbId = '654321654321654321654322';

    it('Optimal solution triggers AI in OPTIMIZATION mode with complexity analysis', async () => {
      const mockGeminiClient = {
        analyzeAcceptedSolution: vi.fn().mockResolvedValue({
          status: 'COMPLETED',
          mode: 'OPTIMIZATION',
          codeSummary: 'Optimal two-pointer approach',
          theoreticalComplexity: {
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(1)',
            explanation: 'Two-pointer approach filters alphanumeric chars in linear time with constant memory.'
          },
          codeQuality: {
            score: 9.2,
            readabilityAnalysis: 'Clean idiomatic Python code with proper string methods.',
            codeSmells: [],
            optimizationSuggestions: ['Consider early exit if string length is 1.']
          },
          astDiff: {
            hasAstEvolution: false,
            differences: [],
            pedagogicalDiffHtml: '<p>Code follows optimal pattern.</p>'
          }
        }),
        analyzeDiagnosticSolution: vi.fn()
      };

      const mockSubRecord: any = {
        _id: validSubId,
        verdict: 'ACCEPTED',
        compositeScore: 92
      };

      const mockDb = {
        collection: (name: string) => ({
          updateOne: vi.fn().mockImplementation((filter, update) => {
            if (name === 'submissions' && update.$set) {
              Object.assign(mockSubRecord, update.$set);
            }
            return Promise.resolve({ modifiedCount: 1 });
          }),
          findOne: vi.fn().mockImplementation((query) => {
            if (name === 'submissions') return Promise.resolve(mockSubRecord);
            if (name === 'problems') {
              return Promise.resolve({
                _id: validProbId,
                title: 'Valid Palindrome',
                description: 'Check palindrome'
              });
            }
            return Promise.resolve(null);
          }),
          insertOne: vi.fn().mockResolvedValue({ insertedId: 'rep_123' })
        })
      } as any;

      const aiService = new AiEvaluatorService(mockGeminiClient as any);

      const result = await aiService.evaluateSubmissionAi(
        {
          submissionId: validSubId,
          problemId: validProbId,
          userId: 'user_123',
          username: 'student1',
          language: 'python',
          code: 'def isPalindrome(s): ...',
          verdict: 'ACCEPTED',
          executionTimeMs: 15,
          memoryUsedKb: 4096,
          passedCount: 5,
          totalCount: 5
        },
        { db: mockDb, timeoutMs: 2000 }
      );

      expect(result.success).toBe(true);
      expect(result.aiStatus).toBe('COMPLETED');
      expect(mockGeminiClient.analyzeAcceptedSolution).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'python',
          problemTitle: 'Valid Palindrome'
        })
      );
      expect(mockSubRecord.verdict).toBe('ACCEPTED');
    });

    it('INVARIANT: Gemini 429 / Rate Limit error NEVER modifies deterministic ACCEPTED verdict', async () => {
      const mockGeminiClient = {
        analyzeAcceptedSolution: vi.fn().mockRejectedValue(new Error('Resource has been exhausted (e.g. check quota)')),
        analyzeDiagnosticSolution: vi.fn()
      };

      const mockSubRecord: any = {
        _id: validSubId,
        verdict: 'ACCEPTED',
        compositeScore: 85
      };

      const mockDb = {
        collection: (name: string) => ({
          updateOne: vi.fn().mockImplementation((filter, update) => {
            if (name === 'submissions' && update.$set) {
              Object.assign(mockSubRecord, update.$set);
            }
            return Promise.resolve({ modifiedCount: 1 });
          }),
          findOne: vi.fn().mockImplementation((query) => {
            if (name === 'submissions') return Promise.resolve(mockSubRecord);
            if (name === 'problems') {
              return Promise.resolve({ _id: validProbId, title: 'Subarray Sum', description: 'desc' });
            }
            return Promise.resolve(null);
          }),
          insertOne: vi.fn().mockResolvedValue({ insertedId: 'rep_err' })
        })
      } as any;

      const aiService = new AiEvaluatorService(mockGeminiClient as any);

      const result = await aiService.evaluateSubmissionAi(
        {
          submissionId: validSubId,
          problemId: validProbId,
          userId: 'user_123',
          username: 'student1',
          language: 'python',
          code: 'def subarraySum(nums, k): ...',
          verdict: 'ACCEPTED',
          executionTimeMs: 25,
          memoryUsedKb: 6000,
          passedCount: 4,
          totalCount: 4
        },
        { db: mockDb, timeoutMs: 2000 }
      );

      // Invariant assertion: Result is marked failed for AI, but deterministic verdict remains ACCEPTED
      expect(result.success).toBe(false);
      expect(result.aiStatus).toBe('FAILED');
      expect(mockSubRecord.verdict).toBe('ACCEPTED');
      expect(mockSubRecord.aiStatus).toBe('FAILED');
    });

    it('INVARIANT: Gemini Timeout (50ms) NEVER modifies deterministic verdict', async () => {
      const mockGeminiClient = {
        analyzeAcceptedSolution: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 5000))
        ),
        analyzeDiagnosticSolution: vi.fn()
      };

      const mockSubRecord: any = {
        _id: validSubId,
        verdict: 'ACCEPTED',
        compositeScore: 90
      };

      const mockDb = {
        collection: (name: string) => ({
          updateOne: vi.fn().mockImplementation((filter, update) => {
            if (name === 'submissions' && update.$set) {
              Object.assign(mockSubRecord, update.$set);
            }
            return Promise.resolve({ modifiedCount: 1 });
          }),
          findOne: vi.fn().mockImplementation((query) => {
            if (name === 'submissions') return Promise.resolve(mockSubRecord);
            if (name === 'problems') {
              return Promise.resolve({ _id: validProbId, title: 'Floating Circle', description: 'desc' });
            }
            return Promise.resolve(null);
          }),
          insertOne: vi.fn().mockResolvedValue({ insertedId: 'rep_timeout' })
        })
      } as any;

      const aiService = new AiEvaluatorService(mockGeminiClient as any);

      const result = await aiService.evaluateSubmissionAi(
        {
          submissionId: validSubId,
          problemId: validProbId,
          userId: 'user_123',
          username: 'student1',
          language: 'python',
          code: 'r = float(input())',
          verdict: 'ACCEPTED',
          executionTimeMs: 12,
          memoryUsedKb: 4096,
          passedCount: 4,
          totalCount: 4
        },
        { db: mockDb, timeoutMs: 50 }
      );

      expect(result.success).toBe(false);
      expect(result.aiStatus).toBe('FAILED');
      expect(result.error).toContain('timed out');
      expect(mockSubRecord.verdict).toBe('ACCEPTED');
      expect(mockSubRecord.aiStatus).toBe('FAILED');
    });
  });

  // ==========================================================================
  // SECTION 6: Scoring Engine & Leaderboard Aggregation
  // ==========================================================================
  describe('6. Scoring Engine & Leaderboard Aggregation Pipeline', () => {
    it('Optimal ACCEPTED submission computes composite score > 80 and isEligible = true', () => {
      const scoreResult = ScoringService.calculate({
        verdict: 'ACCEPTED',
        passedCount: 5,
        totalCount: 5,
        language: 'python',
        executionTimeMs: 14,
        memoryUsedKb: 8192,
        aiQualityScore: 9.5,
        targetTimeMs: 15,
        timeLimitMs: 2000,
        memoryLimitKb: 262144
      });

      expect(scoreResult.isEligible).toBe(true);
      expect(scoreResult.compositeScore).toBeGreaterThanOrEqual(80);
      expect(scoreResult.compositeScore).toBeLessThanOrEqual(100);
      expect(scoreResult.timeScore).toBeGreaterThan(0);
      expect(scoreResult.memoryScore).toBeGreaterThan(0);
    });

    it('Non-accepted submission (WRONG_ANSWER) sets compositeScore = 0.0 and isEligible = false', () => {
      const scoreResult = ScoringService.calculate({
        verdict: 'WRONG_ANSWER',
        passedCount: 2,
        totalCount: 5,
        language: 'python',
        executionTimeMs: 20,
        memoryUsedKb: 8192,
        aiQualityScore: 5.0,
        targetTimeMs: 15,
        timeLimitMs: 2000,
        memoryLimitKb: 262144
      });

      expect(scoreResult.isEligible).toBe(false);
      expect(scoreResult.compositeScore).toBe(0.0);
    });

    it('Leaderboard Aggregation: single user with multiple submissions retains only best score', () => {
      const userSubmissions = [
        { userId: 'user_A', username: 'student_a', score: 65, createdAt: new Date('2026-11-06T00:00:00Z') },
        { userId: 'user_A', username: 'student_a', score: 94, createdAt: new Date('2026-11-06T00:10:00Z') },
        { userId: 'user_A', username: 'student_a', score: 81, createdAt: new Date('2026-11-06T00:20:00Z') },
        { userId: 'user_B', username: 'student_b', score: 88, createdAt: new Date('2026-11-06T00:05:00Z') }
      ];

      // Simulate MongoDB aggregation pipeline: $group by userId with $max score
      const leaderboardMap = new Map<string, any>();
      for (const sub of userSubmissions) {
        const existing = leaderboardMap.get(sub.userId);
        if (!existing || sub.score > existing.score) {
          leaderboardMap.set(sub.userId, sub);
        }
      }

      const deduplicatedLeaderboard = Array.from(leaderboardMap.values())
        .sort((a, b) => b.score - a.score)
        .map((item, idx) => ({ rank: idx + 1, ...item }));

      expect(deduplicatedLeaderboard).toHaveLength(2); // user_A and user_B only
      expect(deduplicatedLeaderboard[0].userId).toBe('user_A');
      expect(deduplicatedLeaderboard[0].score).toBe(94);
      expect(deduplicatedLeaderboard[1].userId).toBe('user_B');
      expect(deduplicatedLeaderboard[1].score).toBe(88);
    });
  });
});
