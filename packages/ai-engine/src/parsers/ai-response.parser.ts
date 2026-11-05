import { z } from 'zod';
import {
  AIAnalysisReport,
  TheoreticalComplexity,
  CodeQualityMetrics,
  OptimizationSuggestion,
  DiagnosticFeedback
} from '@aica/shared';

export const OptimizationResponseSchema = z.object({
  codeSummary: z.string(),
  timeComplexity: z.string(),
  timeComplexityExplanation: z.string(),
  spaceComplexity: z.string(),
  spaceComplexityExplanation: z.string(),
  readabilityScore: z.number().min(1).max(10),
  codeSmells: z.array(z.string()).default([]),
  positivePractices: z.array(z.string()).default([]),
  optimizationSuggestions: z
    .array(
      z.object({
        title: z.string(),
        rationale: z.string(),
        expectedTimeImpact: z.string(),
        refactoredSnippet: z.string()
      })
    )
    .default([])
});

export const DiagnosticResponseSchema = z.object({
  codeSummary: z.string(),
  attemptedComplexity: z.object({
    timeComplexity: z.string(),
    spaceComplexity: z.string(),
    explanation: z.string()
  }),
  diagnosticFeedback: z.object({
    rootCauseBug: z.string(),
    edgeCaseVulnerability: z.string(),
    socraticHint: z.string()
  }),
  readabilityScore: z.number().min(1).max(10).default(5),
  codeSmells: z.array(z.string()).default([])
});

export const ComparisonResponseSchema = z.object({
  timeComplexityComparison: z.string(),
  spaceComplexityComparison: z.string(),
  tradeOffSummary: z.string(),
  architecturalEvolution: z.string()
});
