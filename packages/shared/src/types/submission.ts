import { SupportedLanguage } from '../constants/languages.js';
import { AIAnalysisStatus } from './evaluation.js';

export type PipelineStatus =
  | 'QUEUED'
  | 'COMPILING'
  | 'EXECUTING'
  | 'ANALYZING_AI'
  | 'COMPLETED'
  | 'FAILED';

export type Verdict =
  | 'PENDING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'INTERNAL_ERROR';

export interface TestResultItem {
  testCaseId: string;
  index: number;
  passed: boolean;
  isPublic: boolean;
  actualOutput?: string;
  expectedOutput?: string;
  executionTimeMs: number;
  memoryKb: number;
  errorMessage?: string;
}

export interface Submission {
  id: string; // MongoDB ObjectId
  userId: string; // PostgreSQL UUID
  username: string; // Denormalized
  problemId: string;
  language: SupportedLanguage;
  languageId: number;
  code: string;
  codeLength: number;
  isTestRun: boolean;
  pipelineStatus: PipelineStatus;
  verdict: Verdict;
  executionTimeMs: number;
  memoryUsedKb: number;
  normalizedTimeMs: number;
  compositeScore: number;
  compileOutput?: string;
  testCasesTotal: number;
  testCasesPassed: number;
  testResults: TestResultItem[];
  evaluationReportId?: string;
  aiStatus?: AIAnalysisStatus;
  aiError?: string;
  leaderboardSyncPending?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionRequestPayload {
  problemId: string;
  language: SupportedLanguage;
  code: string;
  isTestRun?: boolean;
}

export interface SubmissionStatusStreamEvent {
  submissionId: string;
  pipelineStatus: PipelineStatus;
  verdict: Verdict;
  step: number;
  totalSteps: number;
  message?: string;
  reportId?: string;
  aiStatus?: AIAnalysisStatus;
  compositeScore?: number;
}

export type CustomRunVerdict =
  | 'EXECUTED'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'INTERNAL_ERROR';

export interface CustomRunResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  executionTimeMs: number;
  memoryUsedKb: number;
  statusId: number;
  statusDescription: string;
  isError: boolean;
  verdict: CustomRunVerdict;
}
