import { describe, it, expect } from 'vitest';
import {
  OptimizationResponseSchema,
  DiagnosticResponseSchema
} from '../packages/ai-engine/src/parsers/ai-response.parser.js';

describe('AI Response Parser & Zod Schemas', () => {
  it('should validate valid Optimization JSON schema (Mode A)', () => {
    const validData = {
      codeSummary: 'Two sum using hash map',
      timeComplexity: 'O(N)',
      timeComplexityExplanation: 'Single pass lookup in hash table',
      spaceComplexity: 'O(N)',
      spaceComplexityExplanation: 'Auxiliary hash table storage',
      readabilityScore: 9,
      codeSmells: [],
      positivePractices: ['Clear variable names'],
      optimizationSuggestions: [
        {
          title: 'Pre-allocate dictionary',
          rationale: 'Avoid resizing',
          expectedTimeImpact: '5% faster',
          refactoredSnippet: 'dict.fromkeys(...)'
        }
      ]
    };

    const parsed = OptimizationResponseSchema.parse(validData);
    expect(parsed.readabilityScore).toBe(9);
    expect(parsed.timeComplexity).toBe('O(N)');
  });

  it('should validate valid Diagnostic JSON schema (Mode B)', () => {
    const diagnosticData = {
      codeSummary: 'Brute force approach with nested loops',
      attemptedComplexity: {
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(1)',
        explanation: 'Double loop scans entire array for each element'
      },
      diagnosticFeedback: {
        rootCauseBug: 'Time limit exceeded due to quadratic iteration',
        edgeCaseVulnerability: 'Fails on arrays with N > 10^4 elements',
        socraticHint: 'Could you trade space for time by caching seen elements?'
      },
      readabilityScore: 6,
      codeSmells: ['Nested loop with quadratic complexity']
    };

    const parsed = DiagnosticResponseSchema.parse(diagnosticData);
    expect(parsed.diagnosticFeedback.rootCauseBug).toContain('Time limit exceeded');
    expect(parsed.attemptedComplexity.timeComplexity).toBe('O(N^2)');
  });

  it('should reject malformed AI outputs', () => {
    const invalidData = {
      codeSummary: 'Missing required fields'
    };
    expect(() => OptimizationResponseSchema.parse(invalidData)).toThrow();
  });
});
