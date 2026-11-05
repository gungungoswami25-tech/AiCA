import { Verdict, TestResultItem } from '@aica/shared';
import { Judge0BatchResultItem } from './judge0.service.js';

export interface EvaluatedTestOutcome {
  verdict: Verdict;
  passedCount: number;
  totalCount: number;
  maxExecutionTimeMs: number;
  maxMemoryKb: number;
  compileOutput?: string;
  testResults: TestResultItem[];
}

export class TestEvaluatorService {
  public static decodeBase64(str?: string | null): string {
    if (!str) return '';
    try {
      return Buffer.from(str, 'base64').toString('utf8');
    } catch {
      return str;
    }
  }

  public static normalizeOutput(output: string): string {
    return output
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim();
  }

  public static compareOutputs(actualRaw: string, expectedRaw: string): boolean {
    const actual = this.normalizeOutput(actualRaw);
    const expected = this.normalizeOutput(expectedRaw);

    if (actual === expected) {
      return true;
    }

    // Attempt floating point comparison with epsilon = 1e-6
    const numActual = parseFloat(actual);
    const numExpected = parseFloat(expected);
    if (!isNaN(numActual) && !isNaN(numExpected)) {
      return Math.abs(numActual - numExpected) <= 1e-6;
    }

    return false;
  }

  public static evaluateBatch(
    tokenMappings: Array<{ token: string; testCaseId: string; index: number; isPublic: boolean; expectedOutput: string }>,
    judge0Results: Map<string, Judge0BatchResultItem>
  ): EvaluatedTestOutcome {
    let passedCount = 0;
    let maxTime = 0;
    let maxMem = 0;
    let aggregateVerdict: Verdict = 'ACCEPTED';
    let compileOutput = '';

    const testResults: TestResultItem[] = [];

    for (const mapping of tokenMappings) {
      const result = judge0Results.get(mapping.token);
      const statusId = result?.status_id || 13; // default internal error if missing

      const stdout = this.decodeBase64(result?.stdout);
      const stderr = this.decodeBase64(result?.stderr);
      const compileErr = this.decodeBase64(result?.compile_output);

      if (compileErr) {
        compileOutput = compileErr;
      }

      const execTimeMs = result?.time ? Math.round(parseFloat(String(result.time)) * 1000) : 0;
      const memKb = result?.memory || 0;

      if (execTimeMs > maxTime) maxTime = execTimeMs;
      if (memKb > maxMem) maxMem = memKb;

      let passed = false;
      let errorMsg: string | undefined;

      if (statusId === 6 || statusId === 14) {
        // Compilation Error
        aggregateVerdict = 'COMPILATION_ERROR';
        errorMsg = compileOutput || stderr || 'Compilation failed';
      } else if (statusId === 5) {
        // Time Limit Exceeded
        if (aggregateVerdict === 'ACCEPTED') aggregateVerdict = 'TIME_LIMIT_EXCEEDED';
        errorMsg = 'Time Limit Exceeded';
      } else if (statusId >= 7 && statusId <= 12) {
        // Runtime Error
        if (aggregateVerdict === 'ACCEPTED') aggregateVerdict = 'RUNTIME_ERROR';
        errorMsg = stderr || 'Runtime error encountered';
      } else if (statusId === 3) {
        // Exit code 0 -> Check output equality
        const isMatch = this.compareOutputs(stdout, mapping.expectedOutput);
        if (isMatch) {
          passed = true;
          passedCount++;
        } else {
          if (aggregateVerdict === 'ACCEPTED') aggregateVerdict = 'WRONG_ANSWER';
          errorMsg = 'Output mismatch';
        }
      } else if (statusId === 4) {
        if (aggregateVerdict === 'ACCEPTED') aggregateVerdict = 'WRONG_ANSWER';
        errorMsg = 'Output mismatch';
      } else {
        if (aggregateVerdict === 'ACCEPTED') aggregateVerdict = 'INTERNAL_ERROR';
        errorMsg = 'Execution engine error';
      }

      testResults.push({
        testCaseId: mapping.testCaseId,
        index: mapping.index,
        passed,
        isPublic: mapping.isPublic,
        actualOutput: stdout,
        expectedOutput: mapping.expectedOutput,
        executionTimeMs: execTimeMs,
        memoryKb: memKb,
        errorMessage: errorMsg
      });
    }

    return {
      verdict: aggregateVerdict,
      passedCount,
      totalCount: tokenMappings.length,
      maxExecutionTimeMs: maxTime,
      maxMemoryKb: maxMem,
      compileOutput,
      testResults
    };
  }
}
