import axios from 'axios';
import { DEFAULT_RESOURCE_LIMITS } from '@aica/shared';

export interface Judge0SubmissionInput {
  testCaseId: string;
  index: number;
  isPublic: boolean;
  sourceCode: string;
  languageId: number;
  stdin: string;
  expectedOutput: string;
  cpuTimeLimit?: number;
  memoryLimit?: number;
}

export interface Judge0BatchResultItem {
  token: string;
  status_id: number;
  status: { id: number; description: string };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | number | null;
  memory?: number | null;
}

export class Judge0Service {
  private apiUrl: string;
  private apiKey?: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = (apiUrl || process.env.JUDGE0_API_URL || 'http://localhost:2358').replace(/\/+$/, '');
    this.apiKey = apiKey || process.env.JUDGE0_API_KEY;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers['X-RapidAPI-Key'] = this.apiKey;
    }
    return headers;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiUrl}/system_info`, {
        headers: this.getHeaders(),
        timeout: 4000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  public async submitBatch(
    submissions: Judge0SubmissionInput[]
  ): Promise<Array<{ token: string; testCaseId: string; index: number; isPublic: boolean }>> {
    if (!submissions || submissions.length === 0) {
      return [];
    }

    const payload = {
      submissions: submissions.map((sub) => ({
        source_code: Buffer.from(sub.sourceCode).toString('base64'),
        language_id: sub.languageId,
        stdin: Buffer.from(sub.stdin).toString('base64'),
        expected_output: Buffer.from(sub.expectedOutput).toString('base64'),
        cpu_time_limit: (sub.cpuTimeLimit || DEFAULT_RESOURCE_LIMITS.TIME_LIMIT_MS) / 1000,
        cpu_extra_time: 0.5,
        wall_time_limit: DEFAULT_RESOURCE_LIMITS.WALL_TIME_LIMIT_MS / 1000,
        memory_limit: sub.memoryLimit || DEFAULT_RESOURCE_LIMITS.MEMORY_LIMIT_KB,
        stack_limit: DEFAULT_RESOURCE_LIMITS.STACK_LIMIT_KB,
        max_processes_and_or_threads: DEFAULT_RESOURCE_LIMITS.MAX_PROCESSES,
        enable_network: false
      }))
    };

    try {
      const response = await axios.post(
        `${this.apiUrl}/submissions/batch?base64_encoded=true`,
        payload,
        { headers: this.getHeaders(), timeout: 12000 }
      );

      const returnedTokens: Array<{ token: string }> = response.data;
      if (!Array.isArray(returnedTokens) || returnedTokens.length === 0) {
        throw new Error('Judge0 returned invalid batch response format');
      }

      return returnedTokens.map((item, idx) => ({
        token: item.token,
        testCaseId: submissions[idx].testCaseId,
        index: submissions[idx].index,
        isPublic: submissions[idx].isPublic
      }));
    } catch (err: any) {
      console.error('[Judge0Service] Batch submission failed:', err.message);
      throw new Error(`SANDBOX_UNAVAILABLE: Failed to submit code execution batch to Judge0 (${err.message})`);
    }
  }

  public async pollBatchResults(
    tokens: string[],
    maxWaitMs = 25000
  ): Promise<Map<string, Judge0BatchResultItem>> {
    if (!tokens || tokens.length === 0) {
      return new Map();
    }

    const resultMap = new Map<string, Judge0BatchResultItem>();
    const startTime = Date.now();
    let delay = 400;

    const tokenList = tokens.join(',');

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay + 200, 1500);

      try {
        const response = await axios.get(
          `${this.apiUrl}/submissions/batch?tokens=${tokenList}&base64_encoded=true&fields=token,status_id,status,stdout,stderr,compile_output,time,memory`,
          { headers: this.getHeaders(), timeout: 6000 }
        );

        const items: Judge0BatchResultItem[] = response.data.submissions || [];
        let allCompleted = true;

        for (const item of items) {
          resultMap.set(item.token, item);
          if (item.status_id < 3) {
            allCompleted = false; // Status 1 (In Queue) or 2 (Processing)
          }
        }

        if (allCompleted && items.length === tokens.length) {
          return resultMap;
        }
      } catch (err: any) {
        console.warn(`[Judge0Service] Polling retry error (${err.message}). Retrying...`);
      }
    }

    if (resultMap.size > 0) {
      return resultMap;
    }

    throw new Error('SANDBOX_TIMEOUT: Timed out waiting for Judge0 sandbox results');
  }
}
