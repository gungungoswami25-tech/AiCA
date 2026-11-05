import { PipelineStatus, Verdict } from './submission.js';

export type AIAnalysisStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
export type AIAnalysisMode = 'OPTIMIZATION' | 'DIAGNOSTIC';

export interface TheoreticalComplexity {
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
}

export interface CodeQualityMetrics {
  score: number; // 1 - 10
  readabilityAnalysis: string;
  codeSmells: string[];
  positivePractices: string[];
}

export interface OptimizationSuggestion {
  title: string;
  rationale: string;
  expectedTimeImpact: string;
  refactoredSnippet: string;
}

export interface DiagnosticFeedback {
  rootCauseBug: string;
  edgeCaseVulnerability: string;
  socraticHint: string;
}

export interface AIAnalysisReport {
  status: AIAnalysisStatus;
  mode: AIAnalysisMode;
  codeSummary: string;
  theoreticalComplexity: TheoreticalComplexity;
  codeQuality: CodeQualityMetrics;
  diagnosticFeedback?: DiagnosticFeedback;
  optimizationSuggestions: OptimizationSuggestion[];
  generatedAt?: string;
}

export interface EvaluationReportMetrics {
  rawTimeMs: number;
  normalizedTimeMs: number;
  rawMemoryKb: number;
  normalizedMemoryKb: number;
  compositeScore: number;
  percentileTime: number;
  percentileMemory: number;
}

export interface EvaluationReport {
  id: string; // MongoDB ObjectId
  submissionId: string;
  userId: string;
  username: string;
  problemId: string;
  verdict: Verdict;
  pipelineStatus: PipelineStatus;
  summary: string;
  aiAnalysis: AIAnalysisReport;
  metrics: EvaluationReportMetrics;
  createdAt: string;
}
