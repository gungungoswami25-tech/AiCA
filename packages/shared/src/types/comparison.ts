import { SupportedLanguage } from '../constants/languages.js';

export interface SubmissionComparisonSnapshot {
  submissionId: string;
  userId: string;
  username: string;
  language: SupportedLanguage;
  code: string;
  executionTimeMs: number;
  memoryUsedKb: number;
  timeComplexity: string;
  spaceComplexity: string;
  qualityScore: number;
  compositeScore: number;
  createdAt: string;
}

export interface ComparisonDeltaMetrics {
  executionTimeDiffMs: number;
  memoryDiffKb: number;
  qualityScoreDiff: number;
  timeComplexityComparison: string;
  spaceComplexityComparison: string;
  tradeOffSummary: string; // AI generated
}

export interface SolutionComparison {
  id: string;
  problemId: string;
  submissionA: SubmissionComparisonSnapshot;
  submissionB: SubmissionComparisonSnapshot;
  deltaAnalysis: ComparisonDeltaMetrics;
  createdAt: string;
}
