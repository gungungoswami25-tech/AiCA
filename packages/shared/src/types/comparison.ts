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

export interface MultiSolutionItem {
  submissionId: string;
  userId: string;
  username: string;
  versionLabel: string; // e.g. "Version 1", "Student A", "Bubble Sort"
  algorithmName: string; // e.g. "Bubble Sort", "Merge Sort", "Quick Sort"
  language: SupportedLanguage;
  code: string;
  verdict: string;
  executionTimeMs: number;
  memoryUsedKb: number;
  timeComplexity: string;
  spaceComplexity: string;
  qualityScore: number;
  compositeScore: number;
  keyStrengths?: string[];
  weaknessesOrBottlenecks?: string[];
  optimizationNotes?: string;
  createdAt: string;
}

export interface MultiSolutionComparison {
  id: string;
  problemId: string;
  problemTitle: string;
  solutions: MultiSolutionItem[];
  matrixComparison: {
    theoreticalRankings: Array<{
      algorithmName: string;
      timeComplexity: string;
      spaceComplexity: string;
      rank: number;
      rationale: string;
    }>;
    empiricalAnalysis: {
      fastestSubmissionId: string;
      lowestMemorySubmissionId: string;
      runtimeRangeMs: string;
      memoryRangeKb: string;
    };
    evolutionarySynthesis: string; // Comprehensive AI narrative explaining the scaling transition
    pedagogicalTakeaway: string; // Actionable takeaway for students
  };
  createdAt: string;
}
