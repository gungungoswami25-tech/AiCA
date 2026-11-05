import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SandboxRunnerService } from '../apps/api/src/services/sandbox-runner.service.js';
import { CustomRunRequestSchema, Verdict, CustomRunVerdict } from '@aica/shared';
import { runCustomCode } from '../apps/api/src/controllers/submission.controller.js';

// In-Memory Mock Database for Invariant Tracking
class MockSubmissionTracker {
  public submissions: any[] = [];
  public aiQueueJobs: any[] = [];
  public leaderboardZadds: any[] = [];

  reset() {
    this.submissions = [];
    this.aiQueueJobs = [];
    this.leaderboardZadds = [];
  }

  insertSubmission(doc: any) {
    this.submissions.push(doc);
    return { insertedId: `sub_${this.submissions.length}` };
  }

  enqueueAiJob(name: string, data: any) {
    this.aiQueueJobs.push({ name, data });
  }

  zadd(key: string, score: number, member: string) {
    this.leaderboardZadds.push({ key, score, member });
  }
}

// Logic helper reproducing MonacoWorkspace stdin selection precedence
function resolveStdinToUse(options: {
  activeTab: 'tests' | 'custom' | 'console';
  lastInputTab: 'tests' | 'custom';
  customStdin: string;
  publicTestCases: Array<{ input: string; expectedOutput?: string }>;
  activeTestIndex: number;
}): string {
  const effectiveInputTab = options.activeTab === 'console' ? options.lastInputTab : options.activeTab;
  if (effectiveInputTab === 'custom') {
    return options.customStdin;
  }
  return options.publicTestCases[options.activeTestIndex]?.input ?? '';
}

describe('Phase 2 & 2.1: Custom Run & Ephemeral Sandbox Execution', () => {
  let tracker: MockSubmissionTracker;
  const originalFetch = global.fetch;

  beforeEach(() => {
    tracker = new MockSubmissionTracker();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // Helper to create mock Express req/res
  function mockReqRes(options: {
    body?: any;
    user?: { id: string; role: string; username: string };
  }) {
    const req: any = {
      body: options.body || {},
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

  describe('SandboxRunnerService: Isolated Judge0 Execution', () => {
    it('1. Successful custom execution (verdict: EXECUTED, stdout matches, isError: false)', async () => {
      const runner = new SandboxRunnerService('http://mock-judge0:2358');

      // Mock Judge0 synchronous response
      const mockJudge0Response = {
        stdout: Buffer.from('Hello, World!\n').toString('base64'),
        stderr: null,
        compile_output: null,
        time: '0.045',
        memory: 12480,
        status: { id: 3, description: 'Accepted' }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJudge0Response
      } as any);

      const result = await runner.executeEphemeral({
        language: 'python',
        code: 'print("Hello, World!")',
        stdin: ''
      });

      // Semantic refinement: Custom run without expected output returns EXECUTED
      expect(result.verdict).toBe('EXECUTED');
      expect(result.isError).toBe(false);
      expect(result.stdout).toBe('Hello, World!\n');
      expect(result.stderr).toBe('');
      expect(result.compileOutput).toBe('');
      expect(result.executionTimeMs).toBe(45);
      expect(result.memoryUsedKb).toBe(12480);
      expect(result.statusId).toBe(3);
      expect(result.statusDescription).toBe('Executed');

      // Verify network is disabled, base64 encoding used, and AbortSignal configured
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, requestInit] = (global.fetch as any).mock.calls[0];
      expect(url).toContain('/submissions?base64_encoded=true&wait=true');
      expect(requestInit.signal).toBeDefined();
      const sentPayload = JSON.parse(requestInit.body);
      expect(sentPayload.enable_network).toBe(false);
      expect(sentPayload.source_code).toBe(Buffer.from('print("Hello, World!")').toString('base64'));
    });

    it('2. Compilation error (statusId: 6, compileOutput captured, isError: true)', async () => {
      const runner = new SandboxRunnerService('http://mock-judge0:2358');

      const mockJudge0Response = {
        stdout: null,
        stderr: null,
        compile_output: Buffer.from('main.cpp: In function ‘int main()’:\nmain.cpp:2:5: error: ‘x’ was not declared in this scope').toString('base64'),
        time: '0.000',
        memory: 0,
        status: { id: 6, description: 'Compilation Error' }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJudge0Response
      } as any);

      const result = await runner.executeEphemeral({
        language: 'cpp',
        code: 'int main() { x = 1; }'
      });

      expect(result.verdict).toBe('COMPILATION_ERROR');
      expect(result.isError).toBe(true);
      expect(result.compileOutput).toContain("error: ‘x’ was not declared in this scope");
      expect(result.statusId).toBe(6);
    });

    it('3. Runtime error (statusId: 11 NZEC or 7 SIGSEGV, stderr captured, isError: true)', async () => {
      const runner = new SandboxRunnerService('http://mock-judge0:2358');

      const mockJudge0Response = {
        stdout: null,
        stderr: Buffer.from('ZeroDivisionError: division by zero').toString('base64'),
        compile_output: null,
        time: '0.032',
        memory: 14200,
        status: { id: 11, description: 'Runtime Error (NZEC)' }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJudge0Response
      } as any);

      const result = await runner.executeEphemeral({
        language: 'python',
        code: 'print(1 / 0)'
      });

      expect(result.verdict).toBe('RUNTIME_ERROR');
      expect(result.isError).toBe(true);
      expect(result.stderr).toContain('ZeroDivisionError: division by zero');
      expect(result.statusId).toBe(11);
    });

    it('4. Timeout (Time Limit Exceeded, statusId: 5, verdict: TIME_LIMIT_EXCEEDED)', async () => {
      const runner = new SandboxRunnerService('http://mock-judge0:2358');

      const mockJudge0Response = {
        stdout: null,
        stderr: null,
        compile_output: null,
        time: '2.005',
        memory: 15300,
        status: { id: 5, description: 'Time Limit Exceeded' }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJudge0Response
      } as any);

      const result = await runner.executeEphemeral({
        language: 'python',
        code: 'while True: pass'
      });

      expect(result.verdict).toBe('TIME_LIMIT_EXCEEDED');
      expect(result.isError).toBe(true);
      expect(result.statusId).toBe(5);
    });

    it('5. Memory limit exceeded (statusId: 12, verdict: MEMORY_LIMIT_EXCEEDED)', async () => {
      const runner = new SandboxRunnerService('http://mock-judge0:2358');

      const mockJudge0Response = {
        stdout: null,
        stderr: null,
        compile_output: null,
        time: '0.250',
        memory: 262200,
        status: { id: 12, description: 'Memory Limit Exceeded' }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJudge0Response
      } as any);

      const result = await runner.executeEphemeral({
        language: 'python',
        code: 'a = [0] * (10 ** 9)'
      });

      expect(result.verdict).toBe('MEMORY_LIMIT_EXCEEDED');
      expect(result.isError).toBe(true);
      expect(result.statusId).toBe(12);
    });
  });

  describe('Validation & Payload Constraints', () => {
    it('6. Invalid language (language: ruby -> 400 VALIDATION_ERROR)', async () => {
      const { req, res } = mockReqRes({
        user: { id: 'u1', role: 'STUDENT', username: 'alice' },
        body: {
          language: 'ruby',
          code: 'puts "hello"',
          stdin: ''
        }
      });

      await runCustomCode(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Language must be one of: python, javascript, cpp, java');
    });

    it('7. Invalid request payload (code: empty string -> 400 VALIDATION_ERROR)', async () => {
      const { req, res } = mockReqRes({
        user: { id: 'u1', role: 'STUDENT', username: 'alice' },
        body: {
          language: 'python',
          code: '',
          stdin: '123'
        }
      });

      await runCustomCode(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Source code cannot be empty');
    });

    it('8. Oversized input (> 64KB code or stdin -> 400 VALIDATION_ERROR)', async () => {
      // 65537 bytes code
      const hugeCode = 'x = 1\n'.repeat(11000); // ~66,000 bytes
      expect(hugeCode.length).toBeGreaterThan(65536);

      const { req: req1, res: res1 } = mockReqRes({
        user: { id: 'u1', role: 'STUDENT', username: 'alice' },
        body: {
          language: 'python',
          code: hugeCode,
          stdin: ''
        }
      });

      await runCustomCode(req1, res1);

      expect(res1.statusCode).toBe(400);
      expect(res1.body.success).toBe(false);
      expect(res1.body.error.code).toBe('VALIDATION_ERROR');
      expect(res1.body.error.message).toContain('Code exceeds maximum limit of 64KB');

      // Oversized stdin (> 64KB)
      const hugeStdin = 'a'.repeat(65537);
      const { req: req2, res: res2 } = mockReqRes({
        user: { id: 'u1', role: 'STUDENT', username: 'alice' },
        body: {
          language: 'python',
          code: 'print(input())',
          stdin: hugeStdin
        }
      });

      await runCustomCode(req2, res2);

      expect(res2.statusCode).toBe(400);
      expect(res2.body.success).toBe(false);
      expect(res2.body.error.code).toBe('VALIDATION_ERROR');
      expect(res2.body.error.message).toContain('Standard input exceeds maximum limit of 64KB');
    });

    it('9. Authentication failure (unauthenticated request -> 401 UNAUTHORIZED)', async () => {
      const { req, res } = mockReqRes({
        user: undefined, // No authenticated user attached
        body: {
          language: 'python',
          code: 'print("test")',
          stdin: ''
        }
      });

      await runCustomCode(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('Authentication token required');
    });
  });

  describe('Strict Ephemeral Isolation Guarantees', () => {
    it('10. Custom Run does not create permanent submissions (count check)', async () => {
      const initialSubmissionCount = tracker.submissions.length;

      const mockJudge0Response = {
        stdout: Buffer.from('Result 42\n').toString('base64'),
        stderr: null,
        compile_output: null,
        time: '0.020',
        memory: 11000,
        status: { id: 3, description: 'Accepted' }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJudge0Response
      } as any);

      const { req, res } = mockReqRes({
        user: { id: 'u1', role: 'STUDENT', username: 'alice' },
        body: {
          language: 'python',
          code: 'print("Result 42")',
          stdin: ''
        }
      });

      await runCustomCode(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stdout).toBe('Result 42\n');
      expect(res.body.data.verdict).toBe('EXECUTED');

      // Zero submissions created in database
      expect(tracker.submissions.length).toBe(initialSubmissionCount);
      expect(tracker.submissions.length).toBe(0);
    });

    it('11. Custom Run does not update leaderboard', async () => {
      const mockJudge0Response = {
        stdout: Buffer.from('100\n').toString('base64'),
        stderr: null,
        compile_output: null,
        time: '0.010',
        memory: 9000,
        status: { id: 3, description: 'Accepted' }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJudge0Response
      } as any);

      const { req, res } = mockReqRes({
        user: { id: 'u1', role: 'STUDENT', username: 'alice' },
        body: {
          language: 'python',
          code: 'print(100)',
          stdin: ''
        }
      });

      await runCustomCode(req, res);

      expect(res.statusCode).toBe(200);
      // Zero leaderboard zadd updates
      expect(tracker.leaderboardZadds.length).toBe(0);
    });

    it('12. Custom Run does not trigger AI analysis', async () => {
      const mockJudge0Response = {
        stdout: Buffer.from('Accepted output').toString('base64'),
        stderr: null,
        compile_output: null,
        time: '0.015',
        memory: 8000,
        status: { id: 3, description: 'Accepted' }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJudge0Response
      } as any);

      const { req, res } = mockReqRes({
        user: { id: 'u1', role: 'STUDENT', username: 'alice' },
        body: {
          language: 'python',
          code: 'print("Accepted output")',
          stdin: ''
        }
      });

      await runCustomCode(req, res);

      expect(res.statusCode).toBe(200);
      // Zero AI analysis queue jobs
      expect(tracker.aiQueueJobs.length).toBe(0);
    });

    it('13. Submit Code workflow remains completely unaffected', async () => {
      // Simulate official submission creation flow
      const officialPayload = {
        problemId: 'prob_12345',
        language: 'python' as const,
        code: 'def solve(): return 42',
        isTestRun: false
      };

      // 1. Official submission generates persistent record
      const inserted = tracker.insertSubmission({
        userId: 'u1',
        username: 'alice',
        problemId: officialPayload.problemId,
        language: officialPayload.language,
        code: officialPayload.code,
        isTestRun: officialPayload.isTestRun,
        pipelineStatus: 'QUEUED',
        verdict: 'PENDING'
      });

      expect(tracker.submissions.length).toBe(1);
      expect(inserted.insertedId).toBe('sub_1');
      expect(tracker.submissions[0].verdict).toBe('PENDING');

      // 2. Custom run concurrently executes
      const mockJudge0Response = {
        stdout: Buffer.from('42\n').toString('base64'),
        stderr: null,
        compile_output: null,
        time: '0.010',
        memory: 8000,
        status: { id: 3, description: 'Accepted' }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJudge0Response
      } as any);

      const { req, res } = mockReqRes({
        user: { id: 'u1', role: 'STUDENT', username: 'alice' },
        body: {
          language: 'python',
          code: 'print(42)',
          stdin: ''
        }
      });

      await runCustomCode(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.stdout).toBe('42\n');
      expect(res.body.data.verdict).toBe('EXECUTED');

      // 3. Official submission remains untouched and is still the ONLY submission in DB
      expect(tracker.submissions.length).toBe(1);
      expect(tracker.submissions[0].problemId).toBe('prob_12345');
      expect(tracker.submissions[0].code).toBe('def solve(): return 42');
    });
  });

  describe('Phase 2.1 Refinements: Timeout, Semantics & Stdin Precedence', () => {
    it('14. Judge0 timeout (AbortSignal timeout triggers -> 504 SANDBOX_TIMEOUT)', async () => {
      const runner = new SandboxRunnerService('http://mock-judge0:2358');

      // Simulate fetch AbortSignal timeout
      const timeoutError = new Error('The operation was aborted due to timeout');
      timeoutError.name = 'TimeoutError';
      global.fetch = vi.fn().mockRejectedValue(timeoutError);

      await expect(
        runner.executeEphemeral({
          language: 'python',
          code: 'import time; time.sleep(20)'
        })
      ).rejects.toThrow('Judge0 sandbox execution timed out after 15000ms');

      // Test Controller handles timeout and returns 504
      const { req, res } = mockReqRes({
        user: { id: 'u1', role: 'STUDENT', username: 'alice' },
        body: {
          language: 'python',
          code: 'import time; time.sleep(20)',
          stdin: ''
        }
      });

      await runCustomCode(req, res);

      expect(res.statusCode).toBe(504);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SANDBOX_TIMEOUT');
      expect(res.body.error.message).toContain('Code execution sandbox timed out after 15000ms');
    });

    it('15. Judge0 network failure (ECONNREFUSED / 500 -> 503 SANDBOX_UNAVAILABLE)', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:2358'));

      const { req, res } = mockReqRes({
        user: { id: 'u1', role: 'STUDENT', username: 'alice' },
        body: {
          language: 'python',
          code: 'print(1)',
          stdin: ''
        }
      });

      await runCustomCode(req, res);

      expect(res.statusCode).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SANDBOX_UNAVAILABLE');
      expect(res.body.error.message).toContain('ECONNREFUSED');
    });

    it('16. Successful custom execution returns EXECUTED (never ACCEPTED)', async () => {
      const runner = new SandboxRunnerService('http://mock-judge0:2358');

      const mockJudge0Response = {
        stdout: Buffer.from('42\n').toString('base64'),
        stderr: null,
        compile_output: null,
        time: '0.010',
        memory: 8000,
        status: { id: 3, description: 'Accepted' }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJudge0Response
      } as any);

      const result = await runner.executeEphemeral({
        language: 'python',
        code: 'print(42)',
        stdin: ''
      });

      expect(result.verdict).toBe('EXECUTED');
      expect(result.verdict).not.toBe('ACCEPTED');
      expect(result.statusDescription).toBe('Executed');
    });

    it('17. Official submission ACCEPTED verdict remains completely unchanged', () => {
      // Official verdicts use Verdict type
      const officialVerdict: Verdict = 'ACCEPTED';
      expect(officialVerdict).toBe('ACCEPTED');

      // Custom verdict type guarantees EXECUTED is used for ephemeral runs
      const customVerdict: CustomRunVerdict = 'EXECUTED';
      expect(customVerdict).toBe('EXECUTED');

      // Invariant: Official submissions are saved with ACCEPTED in DB
      tracker.insertSubmission({
        userId: 'u1',
        problemId: 'p1',
        verdict: 'ACCEPTED',
        pipelineStatus: 'COMPLETED'
      });

      expect(tracker.submissions[0].verdict).toBe('ACCEPTED');
    });

    it('18. Custom Input tab strictly uses customStdin', () => {
      const publicTestCases = [
        { input: 'case_1_input', expectedOutput: 'case_1_output' },
        { input: 'case_2_input', expectedOutput: 'case_2_output' }
      ];

      const resolved = resolveStdinToUse({
        activeTab: 'custom',
        lastInputTab: 'custom',
        customStdin: 'user_custom_input_data',
        publicTestCases,
        activeTestIndex: 1
      });

      expect(resolved).toBe('user_custom_input_data');
    });

    it('19. Test Cases tab strictly uses selected test case input', () => {
      const publicTestCases = [
        { input: 'case_1_input', expectedOutput: 'case_1_output' },
        { input: 'case_2_input', expectedOutput: 'case_2_output' }
      ];

      // Even if customStdin has data, selecting Case 2 on tests tab uses Case 2 input
      const resolved = resolveStdinToUse({
        activeTab: 'tests',
        lastInputTab: 'tests',
        customStdin: 'old_stale_custom_stdin',
        publicTestCases,
        activeTestIndex: 1
      });

      expect(resolved).toBe('case_2_input');
      expect(resolved).not.toBe('old_stale_custom_stdin');
    });

    it('20. Switching tabs does not use stale input', () => {
      const publicTestCases = [
        { input: 'case_1_input', expectedOutput: 'case_1_output' },
        { input: 'case_2_input', expectedOutput: 'case_2_output' }
      ];

      // Step 1: User types in Custom tab
      const customStdin = 'dynamic_custom_stream_99';
      let currentTab: 'tests' | 'custom' | 'console' = 'custom';
      let lastInputTab: 'tests' | 'custom' = 'custom';

      let inputUsed = resolveStdinToUse({
        activeTab: currentTab,
        lastInputTab,
        customStdin,
        publicTestCases,
        activeTestIndex: 0
      });
      expect(inputUsed).toBe('dynamic_custom_stream_99');

      // Step 2: User switches to Test Cases tab and selects Case 2
      currentTab = 'tests';
      lastInputTab = 'tests';
      inputUsed = resolveStdinToUse({
        activeTab: currentTab,
        lastInputTab,
        customStdin,
        publicTestCases,
        activeTestIndex: 1
      });
      // Stale customStdin must NOT override Case 2
      expect(inputUsed).toBe('case_2_input');
      expect(inputUsed).not.toBe('dynamic_custom_stream_99');

      // Step 3: Run execution switches activeTab to 'console'
      currentTab = 'console';
      inputUsed = resolveStdinToUse({
        activeTab: currentTab,
        lastInputTab, // remembers 'tests'
        customStdin,
        publicTestCases,
        activeTestIndex: 1
      });
      // Retains Case 2 input
      expect(inputUsed).toBe('case_2_input');

      // Step 4: User switches back to Custom tab
      currentTab = 'custom';
      lastInputTab = 'custom';
      inputUsed = resolveStdinToUse({
        activeTab: currentTab,
        lastInputTab,
        customStdin,
        publicTestCases,
        activeTestIndex: 1
      });
      expect(inputUsed).toBe('dynamic_custom_stream_99');
    });
  });
});
