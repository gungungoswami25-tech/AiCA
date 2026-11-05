import { describe, it, expect } from 'vitest';
import { ScoringService } from '../apps/worker/src/services/scoring.service.js';

describe('Scoring & Ranking Engine', () => {
  it('should enforce the correctness gate (score is 0 if not 100% accepted)', () => {
    const wrongAnswer = ScoringService.calculate({
      verdict: 'WRONG_ANSWER',
      passedCount: 4,
      totalCount: 5,
      language: 'python',
      executionTimeMs: 25,
      memoryUsedKb: 14000
    });
    expect(wrongAnswer.isEligible).toBe(false);
    expect(wrongAnswer.compositeScore).toBe(0.0);

    const tle = ScoringService.calculate({
      verdict: 'TIME_LIMIT_EXCEEDED',
      passedCount: 0,
      totalCount: 5,
      language: 'cpp',
      executionTimeMs: 2000,
      memoryUsedKb: 5000
    });
    expect(tle.isEligible).toBe(false);
    expect(tle.compositeScore).toBe(0.0);
  });

  it('should calculate normalized time using language multipliers', () => {
    // Python has multiplier = 4.0
    const pythonResult = ScoringService.calculate({
      verdict: 'ACCEPTED',
      passedCount: 5,
      totalCount: 5,
      language: 'python',
      executionTimeMs: 60,
      memoryUsedKb: 20000,
      targetTimeMs: 15,
      aiQualityScore: 8.0
    });

    // 60ms / 4.0 = 15.0ms (optimal target)
    expect(pythonResult.normalizedTimeMs).toBe(15.0);
    expect(pythonResult.timeScore).toBe(100);
    expect(pythonResult.isEligible).toBe(true);
    expect(pythonResult.compositeScore).toBeGreaterThan(80);
  });

  it('should compute weighted composite score accurately', () => {
    const result = ScoringService.calculate({
      verdict: 'ACCEPTED',
      passedCount: 10,
      totalCount: 10,
      language: 'javascript',
      executionTimeMs: 50,
      memoryUsedKb: 25000,
      aiQualityScore: 9.0
    });

    expect(result.compositeScore).toBeGreaterThan(0);
    expect(result.compositeScore).toBeLessThanOrEqual(100);
    expect(result.qualityScore).toBe(90);
  });
});
