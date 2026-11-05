import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  ProblemProposalCreateSchema,
  ProblemProposalClarifySchema,
  AdminProposalApproveSchema,
  AdminProposalRejectSchema
} from '../packages/shared/src/schemas/problem.schema.js';
import {
  ClarificationResponseSchema,
  ProblemGenerationResponseSchema
} from '../packages/ai-engine/src/parsers/ai-response.parser.js';

describe('AI Problem Creator & Validator Suite', () => {
  describe('Proposal Schemas Validation', () => {
    it('should accept valid prompt >= 10 characters', () => {
      const result = ProblemProposalCreateSchema.safeParse({
        prompt: 'Given an array of integers, find the maximum contiguous subarray sum.'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prompt).toContain('maximum contiguous subarray');
      }
    });

    it('should reject prompt with fewer than 10 characters', () => {
      const result = ProblemProposalCreateSchema.safeParse({
        prompt: 'Too short'
      });
      expect(result.success).toBe(false);
    });

    it('should validate clarification response schema with structured answers', () => {
      const result = ProblemProposalClarifySchema.safeParse({
        answers: {
          q1: 'Yes, return 0 if all elements are negative',
          q2: 'Array size up to 10^5'
        }
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data.answers)).toHaveLength(2);
      }
    });

    it('should validate admin approve schema and reject schema', () => {
      const approveResult = AdminProposalApproveSchema.safeParse({
        decisionNotes: 'Concordance verified at 100%. Approved for student catalog.'
      });
      expect(approveResult.success).toBe(true);

      const rejectResult = AdminProposalRejectSchema.safeParse({
        reason: 'Problem statement lacks necessary boundary conditions.'
      });
      expect(rejectResult.success).toBe(true);

      const invalidReject = AdminProposalRejectSchema.safeParse({
        reason: 'Bad' // too short (< 5 chars)
      });
      expect(invalidReject.success).toBe(false);
    });
  });

  describe('AI Engine Response Schemas', () => {
    it('should validate AI clarification parser format', () => {
      const mockAiClarification = {
        isClearAndComplete: false,
        missingInformationSummary: 'The problem does not specify if the array can be empty or have duplicate elements.',
        clarifications: [
          {
            id: 'c1',
            question: 'Can the input array contain duplicate values?',
            options: ['Yes, duplicates allowed', 'No, strictly distinct values']
          }
        ]
      };

      const parsed = ClarificationResponseSchema.parse(mockAiClarification);
      expect(parsed.isClearAndComplete).toBe(false);
      expect(parsed.clarifications).toHaveLength(1);
      expect(parsed.clarifications[0].id).toBe('c1');
    });

    it('should validate AI Problem Generation materials schema', () => {
      const mockGeneratedContent = {
        title: 'Maximum Subarray Sum',
        slug: 'maximum-subarray-sum',
        difficulty: 'MEDIUM',
        tags: ['Arrays', 'Dynamic Programming'],
        description: 'Find the contiguous subarray which has the largest sum and return its sum.',
        constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
        examples: [
          {
            input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
            output: '6',
            explanation: '[4,-1,2,1] has the largest sum = 6.'
          }
        ],
        starterCode: {
          python: 'def maxSubArray(nums: list[int]) -> int:\n    pass',
          javascript: 'function maxSubArray(nums) {\n}',
          cpp: 'int maxSubArray(vector<int>& nums) {\n}',
          java: 'class Solution {\n    public int maxSubArray(int[] nums) {\n    }\n}'
        },
        referenceSolutions: {
          canonicalPython: 'def maxSubArray(nums):\n    cur = mx = nums[0]\n    for x in nums[1:]:\n        cur = max(x, cur + x)\n        mx = max(mx, cur)\n    return mx',
          secondaryOracle: 'def maxSubArray(nums):\n    best = -float("inf")\n    for i in range(len(nums)):\n        s = 0\n        for j in range(i, len(nums)):\n            s += nums[j]\n            best = max(best, s)\n    return best'
        },
        testCases: [
          {
            id: 'tc_1',
            input: '[-2,1,-3,4,-1,2,1,-5,4]',
            expectedOutput: '6',
            isPublic: true,
            isEdgeCase: false,
            weight: 20
          },
          {
            id: 'tc_2',
            input: '[1]',
            expectedOutput: '1',
            isPublic: true,
            isEdgeCase: true,
            weight: 20
          }
        ]
      };

      const parsed = ProblemGenerationResponseSchema.parse(mockGeneratedContent);
      expect(parsed.slug).toBe('maximum-subarray-sum');
      expect(parsed.referenceSolutions.canonicalPython).toBeDefined();
      expect(parsed.referenceSolutions.secondaryOracle).toBeDefined();
      expect(parsed.testCases).toHaveLength(2);
    });
  });

  describe('Deterministic Proposal Idempotency', () => {
    it('should generate consistent SHA-256 idempotency key for identical user and prompt', () => {
      const userId = 'user_student_123';
      const prompt1 = 'Find the second largest number in an array.';
      const prompt2 = '   Find the second largest number in an array.   '; // extra whitespace

      const hash1 = crypto
        .createHash('sha256')
        .update(`${userId}:${prompt1.trim().toLowerCase()}`)
        .digest('hex');

      const hash2 = crypto
        .createHash('sha256')
        .update(`${userId}:${prompt2.trim().toLowerCase()}`)
        .digest('hex');

      expect(hash1).toBe(hash2);
    });
  });

  describe('Differential Concordance & Contradiction Detection', () => {
    it('should detect contradictory test cases (identical input, conflicting expected output)', () => {
      const testCases = [
        { id: '1', input: '5\n1 2 3 4 5', expectedOutput: '15' },
        { id: '2', input: '3\n1 2 3', expectedOutput: '6' },
        { id: '3', input: '5\n1 2 3 4 5', expectedOutput: '10' } // Contradiction with id: 1
      ];

      const inputMap = new Map<string, string>();
      let contradictionDetected = false;

      for (const tc of testCases) {
        const normalizedIn = tc.input.trim();
        const normalizedOut = tc.expectedOutput.trim();
        if (inputMap.has(normalizedIn)) {
          if (inputMap.get(normalizedIn) !== normalizedOut) {
            contradictionDetected = true;
            break;
          }
        } else {
          inputMap.set(normalizedIn, normalizedOut);
        }
      }

      expect(contradictionDetected).toBe(true);
    });

    it('should correctly calculate 100% concordance between matching canonical and oracle runs', () => {
      const canonicalRuns = ['6', '1', '23', '0'];
      const oracleRuns = ['6', '1', '23', '0'];

      let matchingCount = 0;
      for (let i = 0; i < canonicalRuns.length; i++) {
        if (canonicalRuns[i].trim() === oracleRuns[i].trim()) {
          matchingCount++;
        }
      }

      const concordancePercent = Math.round((matchingCount / canonicalRuns.length) * 100);
      expect(concordancePercent).toBe(100);
    });

    it('should catch discrepancy when canonical and oracle produce divergent results', () => {
      const canonicalRuns = ['6', '1', '23', '0'];
      const oracleRuns = ['6', '1', '25', '0']; // Index 2 differs: 23 vs 25

      let matchingCount = 0;
      for (let i = 0; i < canonicalRuns.length; i++) {
        if (canonicalRuns[i].trim() === oracleRuns[i].trim()) {
          matchingCount++;
        }
      }

      const concordancePercent = Math.round((matchingCount / canonicalRuns.length) * 100);
      expect(concordancePercent).toBe(75);
      expect(concordancePercent).toBeLessThan(100);
    });
  });
});
