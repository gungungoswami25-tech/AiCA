import { describe, it, expect } from 'vitest';
import { TestEvaluatorService } from '../apps/worker/src/services/test-evaluator.js';

describe('Deterministic Test Diff Engine', () => {
  it('should match identical single-line and multi-line strings', () => {
    const actual = 'hello world\n';
    const expected = 'hello world';
    expect(TestEvaluatorService.compareOutputs(actual, expected)).toBe(true);
  });

  it('should normalize Windows CRLF to UNIX LF and trim trailing whitespace', () => {
    const actual = 'line1   \r\nline2   \r\n\r\n';
    const expected = 'line1\nline2';
    expect(TestEvaluatorService.compareOutputs(actual, expected)).toBe(true);
  });

  it('should match floating point values within epsilon of 1e-6', () => {
    const actual = '3.14159265';
    const expected = '3.14159270';
    expect(TestEvaluatorService.compareOutputs(actual, expected)).toBe(true);
  });

  it('should reject mismatched strings', () => {
    const actual = '[0, 2]';
    const expected = '[0, 1]';
    expect(TestEvaluatorService.compareOutputs(actual, expected)).toBe(false);
  });

  it('should safely decode base64 strings', () => {
    const encoded = Buffer.from('42\nAnswer').toString('base64');
    expect(TestEvaluatorService.decodeBase64(encoded)).toBe('42\nAnswer');
  });
});
