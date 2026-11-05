import mongoose from 'mongoose';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pgPool } from '../config/db.js';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import { SubmissionModel } from '../models/mongodb/submission.model.js';
import { EvaluationReportModel } from '../models/mongodb/evaluation-report.model.js';
import { SolutionComparisonModel } from '../models/mongodb/comparison.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

export async function runSeed(disconnectMongoose = true) {
  console.log('[Seed] Starting database seeding for PostgreSQL & MongoDB...');

  // Fallback UUIDs in case PostgreSQL is unavailable
  let studentId = '00000000-0000-0000-0000-000000000001';
  let adminId = '00000000-0000-0000-0000-000000000002';
  let adaId = '00000000-0000-0000-0000-000000000003';
  let alanId = '00000000-0000-0000-0000-000000000004';
  let graceId = '00000000-0000-0000-0000-000000000005';

  // 1. Seed PostgreSQL Users
  try {
    const client = await pgPool.connect();
    
    // Ensure schema is applied
    const schemaPath = path.resolve(__dirname, '../models/postgres/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('[Seed] Applied schema.sql successfully.');
    }

    console.log('[Seed] Seeding PostgreSQL users...');

    const defaultPass = await argon2.hash('DemoUser123!');
    const adminPass = await argon2.hash('AdminSecret123!');

    // Upsert Student
    const studentRes = await client.query(
      `INSERT INTO users (email, username, password_hash, role, status)
       VALUES ('student@aica.lab', 'algo_student', $1, 'STUDENT', 'ACTIVE')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [defaultPass]
    );
    studentId = studentRes.rows[0].id;

    await client.query(
      `INSERT INTO user_profiles (user_id, full_name, bio, avatar_url, total_submissions, problems_solved, current_streak)
       VALUES ($1, 'Algorithmic Learner', 'Passionate about algorithms, Big-O, and code evolution.', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', 14, 5, 5)
       ON CONFLICT (user_id) DO UPDATE SET 
         full_name = EXCLUDED.full_name,
         avatar_url = EXCLUDED.avatar_url,
         current_streak = EXCLUDED.current_streak`,
      [studentId]
    );

    // Upsert Admin
    const adminRes = await client.query(
      `INSERT INTO users (email, username, password_hash, role, status)
       VALUES ('admin@aica.lab', 'lab_admin', $1, 'ADMIN', 'ACTIVE')
       ON CONFLICT (email) DO UPDATE SET role = 'ADMIN'
       RETURNING id`,
      [adminPass]
    );
    adminId = adminRes.rows[0].id;

    await client.query(
      `INSERT INTO user_profiles (user_id, full_name, bio, avatar_url, total_submissions, problems_solved, current_streak)
       VALUES ($1, 'Platform Admin', 'Overseeing problem curricula and evaluation engine integrity.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 42, 10, 14)
       ON CONFLICT (user_id) DO UPDATE SET 
         full_name = EXCLUDED.full_name,
         avatar_url = EXCLUDED.avatar_url,
         current_streak = EXCLUDED.current_streak`,
      [adminId]
    );

    // Upsert Leaderboard Persona: Ada Lovelace
    const adaRes = await client.query(
      `INSERT INTO users (email, username, password_hash, role, status)
       VALUES ('ada@aica.lab', 'ada_lovelace', $1, 'STUDENT', 'ACTIVE')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [defaultPass]
    );
    adaId = adaRes.rows[0].id;

    await client.query(
      `INSERT INTO user_profiles (user_id, full_name, bio, avatar_url, total_submissions, problems_solved, current_streak)
       VALUES ($1, 'Ada Lovelace', 'Mathematician & Pioneer of Computer Programming.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 28, 5, 12)
       ON CONFLICT (user_id) DO UPDATE SET 
         full_name = EXCLUDED.full_name,
         avatar_url = EXCLUDED.avatar_url,
         current_streak = EXCLUDED.current_streak`,
      [adaId]
    );

    // Upsert Leaderboard Persona: Alan Turing
    const alanRes = await client.query(
      `INSERT INTO users (email, username, password_hash, role, status)
       VALUES ('alan@aica.lab', 'alan_turing', $1, 'STUDENT', 'ACTIVE')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [defaultPass]
    );
    alanId = alanRes.rows[0].id;

    await client.query(
      `INSERT INTO user_profiles (user_id, full_name, bio, avatar_url, total_submissions, problems_solved, current_streak)
       VALUES ($1, 'Alan Turing', 'Cryptanalyst & Father of Theoretical Computer Science.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 22, 4, 8)
       ON CONFLICT (user_id) DO UPDATE SET 
         full_name = EXCLUDED.full_name,
         avatar_url = EXCLUDED.avatar_url,
         current_streak = EXCLUDED.current_streak`,
      [alanId]
    );

    // Upsert Leaderboard Persona: Grace Hopper
    const graceRes = await client.query(
      `INSERT INTO users (email, username, password_hash, role, status)
       VALUES ('grace@aica.lab', 'grace_hopper', $1, 'STUDENT', 'ACTIVE')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [defaultPass]
    );
    graceId = graceRes.rows[0].id;

    await client.query(
      `INSERT INTO user_profiles (user_id, full_name, bio, avatar_url, total_submissions, problems_solved, current_streak)
       VALUES ($1, 'Grace Hopper', 'Compiler Pioneer & Computer Scientist.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 19, 3, 15)
       ON CONFLICT (user_id) DO UPDATE SET 
         full_name = EXCLUDED.full_name,
         avatar_url = EXCLUDED.avatar_url,
         current_streak = EXCLUDED.current_streak`,
      [graceId]
    );

    client.release();
    console.log('[Seed] PostgreSQL users seeded successfully.');
  } catch (err: any) {
    console.warn('[Seed] PostgreSQL seed deferred/offline:', err.message);
  }

  // 2. Seed MongoDB Problems
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aica_lab';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Seeding MongoDB problem catalog (5 Classic Curriculum Problems)...');

    const problemsData = [
      {
        title: 'Two Sum Optimal',
        slug: 'two-sum-optimal',
        status: 'PUBLISHED',
        version: 1,
        difficulty: 'EASY',
        tags: ['Arrays', 'Hash-Table'],
        description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the same element twice.

You can return the answer in any order.`,
        constraints: [
          '2 <= nums.length <= 10^4',
          '-10^9 <= nums[i] <= 10^9',
          '-10^9 <= target <= 10^9',
          'Only one valid answer exists.'
        ],
        examples: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
          },
          {
            input: 'nums = [3,2,4], target = 6',
            output: '[1,2]'
          }
        ],
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
        benchmarks: {
          targetTimeMs: 15,
          pythonMultiplier: 4.0,
          jsMultiplier: 2.5,
          cppMultiplier: 1.0,
          javaMultiplier: 2.0
        },
        starterCode: {
          python: `def twoSum(nums: list[int], target: int) -> list[int]:\n    # Implement O(N) hash map solution here\n    pass\n`,
          javascript: `function twoSum(nums, target) {\n    // Implement O(N) hash map solution here\n    return [];\n}\n`,
          cpp: `#include <vector>\n#include <unordered_map>\n\nstd::vector<int> twoSum(std::vector<int>& nums, int target) {\n    // Implement O(N) hash map solution here\n    return {};\n}\n`,
          java: `import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Implement O(N) hash map solution here\n        return new int[]{};\n    }\n}\n`
        },
        testCases: [
          {
            id: 'tc-1',
            input: '4\n2 7 11 15\n9',
            expectedOutput: '0 1',
            isPublic: true,
            isEdgeCase: false,
            explanation: 'Standard positive array case'
          },
          {
            id: 'tc-2',
            input: '3\n3 2 4\n6',
            expectedOutput: '1 2',
            isPublic: true,
            isEdgeCase: false,
            explanation: 'Unsorted elements'
          },
          {
            id: 'tc-3',
            input: '2\n3 3\n6',
            expectedOutput: '0 1',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Identical duplicate numbers'
          },
          {
            id: 'tc-4',
            input: '5\n-3 4 3 90 2\n0',
            expectedOutput: '0 2',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Negative numbers and zero target'
          },
          {
            id: 'tc-5',
            input: '6\n1 5 10 20 50 100\n150',
            expectedOutput: '4 5',
            isPublic: false,
            isEdgeCase: false,
            explanation: 'Boundary elements'
          }
        ],
        totalSubmissions: 52,
        acceptedSubmissions: 41,
        createdBy: adminId
      },
      {
        title: 'Longest Substring Without Repeating Characters',
        slug: 'longest-substring-without-repeating',
        status: 'PUBLISHED',
        version: 1,
        difficulty: 'MEDIUM',
        tags: ['Strings', 'Sliding-Window', 'Hash-Table'],
        description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
        constraints: [
          '0 <= s.length <= 5 * 10^4',
          's consists of English letters, digits, symbols and spaces.'
        ],
        examples: [
          {
            input: 's = "abcabcbb"',
            output: '3',
            explanation: 'The answer is "abc", with the length of 3.'
          },
          {
            input: 's = "bbbbb"',
            output: '1',
            explanation: 'The answer is "b", with the length of 1.'
          }
        ],
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
        benchmarks: {
          targetTimeMs: 25,
          pythonMultiplier: 4.0,
          jsMultiplier: 2.5,
          cppMultiplier: 1.0,
          javaMultiplier: 2.0
        },
        starterCode: {
          python: `def lengthOfLongestSubstring(s: str) -> int:\n    # Implement sliding window here\n    return 0\n`,
          javascript: `function lengthOfLongestSubstring(s) {\n    // Implement sliding window here\n    return 0;\n}\n`,
          cpp: `#include <string>\n#include <unordered_set>\n\nint lengthOfLongestSubstring(std::string s) {\n    return 0;\n}\n`,
          java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}\n`
        },
        testCases: [
          {
            id: 'tc-sub-1',
            input: 'abcabcbb',
            expectedOutput: '3',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-sub-2',
            input: 'pwwkew',
            expectedOutput: '3',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-sub-3',
            input: 'a',
            expectedOutput: '1',
            isPublic: false,
            isEdgeCase: true
          },
          {
            id: 'tc-sub-4',
            input: 'dvdf',
            expectedOutput: '3',
            isPublic: false,
            isEdgeCase: true
          }
        ],
        totalSubmissions: 35,
        acceptedSubmissions: 20,
        createdBy: adminId
      },
      {
        title: 'Container With Most Water',
        slug: 'container-with-most-water',
        status: 'PUBLISHED',
        version: 1,
        difficulty: 'MEDIUM',
        tags: ['Arrays', 'Two-Pointers', 'Greedy'],
        description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return *the maximum amount of water a container can store*.`,
        constraints: [
          'n == height.length',
          '2 <= n <= 10^5',
          '0 <= height[i] <= 10^4'
        ],
        examples: [
          {
            input: 'height = [1,8,6,2,5,4,8,3,7]',
            output: '49',
            explanation: 'The max area is between index 1 and 8.'
          }
        ],
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
        benchmarks: {
          targetTimeMs: 20,
          pythonMultiplier: 4.0,
          jsMultiplier: 2.5,
          cppMultiplier: 1.0,
          javaMultiplier: 2.0
        },
        starterCode: {
          python: `def maxArea(height: list[int]) -> int:\n    # Implement O(N) two pointers\n    return 0\n`,
          javascript: `function maxArea(height) {\n    return 0;\n}\n`,
          cpp: `#include <vector>\n\nint maxArea(std::vector<int>& height) {\n    return 0;\n}\n`,
          java: `class Solution {\n    public int maxArea(int[] height) {\n        return 0;\n    }\n}\n`
        },
        testCases: [
          {
            id: 'tc-wm-1',
            input: '9\n1 8 6 2 5 4 8 3 7',
            expectedOutput: '49',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-wm-2',
            input: '2\n1 1',
            expectedOutput: '1',
            isPublic: true,
            isEdgeCase: true
          }
        ],
        totalSubmissions: 28,
        acceptedSubmissions: 17,
        createdBy: adminId
      },
      {
        title: 'Valid Parentheses',
        slug: 'valid-parentheses',
        status: 'PUBLISHED',
        version: 1,
        difficulty: 'EASY',
        tags: ['Stack', 'Strings'],
        description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
        constraints: [
          '1 <= s.length <= 10^4',
          's consists of parentheses only: ()[]{}'
        ],
        examples: [
          {
            input: 's = "()[]{}"',
            output: 'true',
            explanation: 'All brackets are matched correctly in sequence.'
          },
          {
            input: 's = "(]"',
            output: 'false',
            explanation: 'Opening parenthesis is closed by mismatched bracket.'
          }
        ],
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
        benchmarks: {
          targetTimeMs: 15,
          pythonMultiplier: 4.0,
          jsMultiplier: 2.5,
          cppMultiplier: 1.0,
          javaMultiplier: 2.0
        },
        starterCode: {
          python: `def isValid(s: str) -> bool:\n    # Implement stack solution here\n    pass\n`,
          javascript: `function isValid(s) {\n    // Implement stack solution here\n    return false;\n}\n`,
          cpp: `#include <string>\n#include <stack>\n\nbool isValid(std::string s) {\n    return false;\n}\n`,
          java: `import java.util.*;\n\nclass Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}\n`
        },
        testCases: [
          {
            id: 'tc-vp-1',
            input: '()[]{}',
            expectedOutput: 'true',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-vp-2',
            input: '(]',
            expectedOutput: 'false',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-vp-3',
            input: '((((',
            expectedOutput: 'false',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Unclosed open brackets'
          },
          {
            id: 'tc-vp-4',
            input: '([)]',
            expectedOutput: 'false',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Interleaved mismatched order'
          },
          {
            id: 'tc-vp-5',
            input: '{[]}',
            expectedOutput: 'true',
            isPublic: false,
            isEdgeCase: false
          }
        ],
        totalSubmissions: 45,
        acceptedSubmissions: 38,
        createdBy: adminId
      },
      {
        title: 'Binary Search Optimal',
        slug: 'binary-search-optimal',
        status: 'PUBLISHED',
        version: 1,
        difficulty: 'EASY',
        tags: ['Binary-Search', 'Arrays', 'Divide-and-Conquer'],
        description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
        constraints: [
          '1 <= nums.length <= 10^4',
          '-10^4 < nums[i], target < 10^4',
          'All the integers in nums are unique.',
          'nums is sorted in ascending order.'
        ],
        examples: [
          {
            input: 'nums = [-1,0,3,5,9,12], target = 9',
            output: '4',
            explanation: '9 exists in nums and its index is 4'
          },
          {
            input: 'nums = [-1,0,3,5,9,12], target = 2',
            output: '-1',
            explanation: '2 does not exist in nums so return -1'
          }
        ],
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
        benchmarks: {
          targetTimeMs: 15,
          pythonMultiplier: 4.0,
          jsMultiplier: 2.5,
          cppMultiplier: 1.0,
          javaMultiplier: 2.0
        },
        starterCode: {
          python: `def search(nums: list[int], target: int) -> int:\n    # Implement O(log N) binary search\n    pass\n`,
          javascript: `function search(nums, target) {\n    // Implement O(log N) binary search\n    return -1;\n}\n`,
          cpp: `#include <vector>\n\nint search(std::vector<int>& nums, int target) {\n    return -1;\n}\n`,
          java: `class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}\n`
        },
        testCases: [
          {
            id: 'tc-bs-1',
            input: '6\n-1 0 3 5 9 12\n9',
            expectedOutput: '4',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-bs-2',
            input: '6\n-1 0 3 5 9 12\n2',
            expectedOutput: '-1',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-bs-3',
            input: '1\n5\n5',
            expectedOutput: '0',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Single element match'
          },
          {
            id: 'tc-bs-4',
            input: '1\n5\n-5',
            expectedOutput: '-1',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Single element mismatch'
          },
          {
            id: 'tc-bs-5',
            input: '5\n2 5 8 12 19\n19',
            expectedOutput: '4',
            isPublic: false,
            isEdgeCase: false,
            explanation: 'Upper boundary match'
          }
        ],
        totalSubmissions: 39,
        acceptedSubmissions: 32,
        createdBy: adminId
      }
    ];

    const problemMap: Record<string, any> = {};
    for (const p of problemsData) {
      const saved = await ProblemModel.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
      problemMap[p.slug] = saved;
    }

    console.log('[Seed] MongoDB problem catalog seeded successfully with 5 published curriculum problems.');

    // 3. Seed Realistic Historical Submissions & AI Reports
    console.log('[Seed] Seeding realistic submission histories & AI evaluations...');

    const twoSumProblem = problemMap['two-sum-optimal'];
    const longestSubProblem = problemMap['longest-substring-without-repeating'];
    const containerProblem = problemMap['container-with-most-water'];
    const validParenProblem = problemMap['valid-parentheses'];
    const binarySearchProblem = problemMap['binary-search-optimal'];

    // 3A. Student's Submissions on Two Sum (The Evolutionary Journey)
    // Submission 1: Brute Force O(N^2) (ACCEPTED, high runtime)
    const bruteCode = `def twoSum(nums: list[int], target: int) -> list[int]:
    n = len(nums)
    for i in range(n):
        for j in range(i + 1, n):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`;

    const sub1 = await SubmissionModel.findOneAndUpdate(
      { userId: studentId, problemId: twoSumProblem._id.toString(), executionTimeMs: 82 },
      {
        userId: studentId,
        username: 'algo_student',
        problemId: twoSumProblem._id.toString(),
        language: 'python',
        languageId: 71,
        code: bruteCode,
        codeLength: bruteCode.length,
        isTestRun: false,
        pipelineStatus: 'COMPLETED',
        verdict: 'ACCEPTED',
        executionTimeMs: 82,
        memoryUsedKb: 14200,
        normalizedTimeMs: 82,
        compositeScore: 68.4,
        testCasesTotal: 5,
        testCasesPassed: 5,
        aiStatus: 'COMPLETED',
        leaderboardSyncPending: false
      },
      { upsert: true, new: true }
    );

    // AI Report for Sub 1 (Mode A: Optimization)
    await EvaluationReportModel.findOneAndUpdate(
      { submissionId: sub1._id.toString() },
      {
        submissionId: sub1._id.toString(),
        userId: studentId,
        username: 'algo_student',
        problemId: twoSumProblem._id.toString(),
        verdict: 'ACCEPTED',
        pipelineStatus: 'COMPLETED',
        summary: 'Brute-force approach passes all tests but exhibits quadratic asymptotic runtime.',
        aiAnalysis: {
          status: 'COMPLETED',
          mode: 'OPTIMIZATION',
          codeSummary: 'Nested dual loop checking all element pairs.',
          theoreticalComplexity: {
            timeComplexity: 'O(N^2)',
            spaceComplexity: 'O(1)',
            explanation: 'The outer loop runs N times and the inner loop runs N - i times, leading to N*(N-1)/2 operations.'
          },
          codeQuality: {
            score: 6.5,
            readabilityAnalysis: 'Clean variable naming and clear logic, but lacks algorithmic maturity.',
            codeSmells: ['Quadratic time complexity in nested loop'],
            positivePractices: ['Proper bounds check', 'Clean function signature']
          },
          optimizationSuggestions: [
            {
              title: 'Use Single-Pass Hash Map Lookup',
              rationale: 'Store previously visited elements in a hash map to trade O(N) auxiliary space for O(1) complement lookup.',
              expectedTimeImpact: 'Reduces runtime from 82ms to ~14ms (80%+ improvement)',
              refactoredSnippet: 'seen = {}\nfor i, n in enumerate(nums):\n    diff = target - n\n    if diff in seen:\n        return [seen[diff], i]\n    seen[n] = i'
            }
          ],
          generatedAt: new Date().toISOString()
        },
        metrics: {
          rawTimeMs: 82,
          normalizedTimeMs: 82,
          rawMemoryKb: 14200,
          normalizedMemoryKb: 2200,
          compositeScore: 68.4
        }
      },
      { upsert: true }
    );

    // Submission 2: Buggy Solution (WRONG_ANSWER on duplicate numbers)
    const buggyCode = `def twoSum(nums: list[int], target: int) -> list[int]:
    # Buggy comprehension: duplicate values overwrite indices
    lookup = {num: i for i, num in enumerate(nums)}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in lookup and lookup[diff] != i:
            return [i, lookup[diff]]
    return []`;

    const sub2 = await SubmissionModel.findOneAndUpdate(
      { userId: studentId, problemId: twoSumProblem._id.toString(), verdict: 'WRONG_ANSWER' },
      {
        userId: studentId,
        username: 'algo_student',
        problemId: twoSumProblem._id.toString(),
        language: 'python',
        languageId: 71,
        code: buggyCode,
        codeLength: buggyCode.length,
        isTestRun: false,
        pipelineStatus: 'COMPLETED',
        verdict: 'WRONG_ANSWER',
        executionTimeMs: 24,
        memoryUsedKb: 14100,
        normalizedTimeMs: 24,
        compositeScore: 0.0,
        testCasesTotal: 5,
        testCasesPassed: 2,
        aiStatus: 'COMPLETED',
        leaderboardSyncPending: false
      },
      { upsert: true, new: true }
    );

    // AI Report for Sub 2 (Mode B: Diagnostic)
    await EvaluationReportModel.findOneAndUpdate(
      { submissionId: sub2._id.toString() },
      {
        submissionId: sub2._id.toString(),
        userId: studentId,
        username: 'algo_student',
        problemId: twoSumProblem._id.toString(),
        verdict: 'WRONG_ANSWER',
        pipelineStatus: 'COMPLETED',
        summary: 'Solution fails on inputs containing identical duplicate numbers that sum to target.',
        aiAnalysis: {
          status: 'COMPLETED',
          mode: 'DIAGNOSTIC',
          codeSummary: 'Pre-constructs a dictionary before checking complements.',
          theoreticalComplexity: {
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(N)',
            explanation: 'Two separate linear passes over the array.'
          },
          codeQuality: {
            score: 5.0,
            readabilityAnalysis: 'Concise syntax but contains a critical algorithmic edge-case trap.',
            codeSmells: ['Premature dictionary comprehension loses duplicate key positions'],
            positivePractices: ['Correct complement arithmetic']
          },
          diagnosticFeedback: {
            rootCauseBug: 'Dictionary comprehension overwrites duplicate values in array with the last seen index.',
            edgeCaseVulnerability: 'Fails when nums contains identical elements (e.g., [3, 3] with target 6).',
            socraticHint: 'How could you build the hash map incrementally so each element only checks against already processed indices?'
          },
          generatedAt: new Date().toISOString()
        },
        metrics: {
          rawTimeMs: 24,
          normalizedTimeMs: 24,
          rawMemoryKb: 14100,
          normalizedMemoryKb: 2100,
          compositeScore: 0.0
        }
      },
      { upsert: true }
    );

    // Submission 3: Optimal O(N) Hash Map (ACCEPTED, 14ms)
    const optimalCode = `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`;

    const sub3 = await SubmissionModel.findOneAndUpdate(
      { userId: studentId, problemId: twoSumProblem._id.toString(), executionTimeMs: 14 },
      {
        userId: studentId,
        username: 'algo_student',
        problemId: twoSumProblem._id.toString(),
        language: 'python',
        languageId: 71,
        code: optimalCode,
        codeLength: optimalCode.length,
        isTestRun: false,
        pipelineStatus: 'COMPLETED',
        verdict: 'ACCEPTED',
        executionTimeMs: 14,
        memoryUsedKb: 14050,
        normalizedTimeMs: 14,
        compositeScore: 98.2,
        testCasesTotal: 5,
        testCasesPassed: 5,
        aiStatus: 'COMPLETED',
        leaderboardSyncPending: false
      },
      { upsert: true, new: true }
    );

    // AI Report for Sub 3 (Mode A: Optimization)
    await EvaluationReportModel.findOneAndUpdate(
      { submissionId: sub3._id.toString() },
      {
        submissionId: sub3._id.toString(),
        userId: studentId,
        username: 'algo_student',
        problemId: twoSumProblem._id.toString(),
        verdict: 'ACCEPTED',
        pipelineStatus: 'COMPLETED',
        summary: 'Optimal single-pass hash map solution with linear time complexity.',
        aiAnalysis: {
          status: 'COMPLETED',
          mode: 'OPTIMIZATION',
          codeSummary: 'Single pass hash table lookup with immediate return.',
          theoreticalComplexity: {
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(N)',
            explanation: 'Single traversal through the array with average O(1) dictionary hash table operations.'
          },
          codeQuality: {
            score: 9.5,
            readabilityAnalysis: 'Idiomatic, clean, modular Python solution with optimal algorithmic efficiency.',
            codeSmells: [],
            positivePractices: ['Optimal single-pass traversal', 'Safe dictionary lookups', 'Minimal auxiliary allocation']
          },
          optimizationSuggestions: [],
          generatedAt: new Date().toISOString()
        },
        metrics: {
          rawTimeMs: 14,
          normalizedTimeMs: 14,
          rawMemoryKb: 14050,
          normalizedMemoryKb: 2050,
          compositeScore: 98.2
        }
      },
      { upsert: true }
    );

    // 3B. Pre-computed Solution Comparison (Sub 1 Brute-Force vs Sub 3 Optimal)
    await SolutionComparisonModel.findOneAndUpdate(
      { problemId: twoSumProblem._id.toString() },
      {
        problemId: twoSumProblem._id.toString(),
        submissionA: {
          submissionId: sub1._id.toString(),
          userId: studentId,
          username: 'algo_student',
          language: 'python',
          code: bruteCode,
          executionTimeMs: 82,
          memoryUsedKb: 14200,
          timeComplexity: 'O(N^2)',
          spaceComplexity: 'O(1)',
          qualityScore: 6.5,
          compositeScore: 68.4,
          createdAt: sub1.createdAt ? new Date(sub1.createdAt).toISOString() : new Date().toISOString()
        },
        submissionB: {
          submissionId: sub3._id.toString(),
          userId: studentId,
          username: 'algo_student',
          language: 'python',
          code: optimalCode,
          executionTimeMs: 14,
          memoryUsedKb: 14050,
          timeComplexity: 'O(N)',
          spaceComplexity: 'O(N)',
          qualityScore: 9.5,
          compositeScore: 98.2,
          createdAt: sub3.createdAt ? new Date(sub3.createdAt).toISOString() : new Date().toISOString()
        },
        deltaAnalysis: {
          executionTimeDiffMs: -68,
          memoryDiffKb: -150,
          qualityScoreDiff: 3.0,
          timeComplexityComparison: 'Significant asymptotic improvement from O(N^2) quadratic time to O(N) linear time.',
          spaceComplexityComparison: 'Trade-off: Auxiliary space increased from O(1) constant to O(N) linear memory.',
          tradeOffSummary: 'Approach B achieves an 82.9% execution time reduction by trading O(N) auxiliary space for O(1) hash map lookups. This represents the gold standard evolutionary leap for two-sum problems.'
        }
      },
      { upsert: true }
    );

    // 3C. Seed Competitive Personas Submissions for Global Leaderboard Realism
    // Ada Lovelace (Rank 1: 5 problems solved, ~494 total score)
    const competitiveConfigs = [
      {
        userId: adaId,
        username: 'ada_lovelace',
        submissions: [
          { problem: twoSumProblem, score: 99.2, time: 11, code: optimalCode },
          { problem: longestSubProblem, score: 98.5, time: 21, code: 'def lengthOfLongestSubstring(s):\n    c = {}\n    m = l = 0\n    for r, v in enumerate(s):\n        if v in c and c[v] >= l:\n            l = c[v] + 1\n        c[v] = r\n        m = max(m, r - l + 1)\n    return m' },
          { problem: containerProblem, score: 98.0, time: 16, code: 'def maxArea(h):\n    l, r, m = 0, len(h) - 1, 0\n    while l < r:\n        m = max(m, min(h[l], h[r]) * (r - l))\n        if h[l] < h[r]: l += 1\n        else: r -= 1\n    return m' },
          { problem: validParenProblem, score: 99.5, time: 8, code: 'def isValid(s):\n    st = []\n    mp = {")": "(", "}": "{", "]": "["}\n    for ch in s:\n        if ch in mp:\n            if not st or st.pop() != mp[ch]: return False\n        else: st.append(ch)\n    return not st' },
          { problem: binarySearchProblem, score: 99.8, time: 7, code: 'def search(nums, target):\n    l, r = 0, len(nums) - 1\n    while l <= r:\n        m = (l + r) // 2\n        if nums[m] == target: return m\n        elif nums[m] < target: l = m + 1\n        else: r = m - 1\n    return -1' }
        ]
      },
      // Alan Turing (Rank 2: 4 problems solved, ~390 total score)
      {
        userId: alanId,
        username: 'alan_turing',
        submissions: [
          { problem: twoSumProblem, score: 97.5, time: 15, code: optimalCode },
          { problem: longestSubProblem, score: 96.8, time: 24, code: 'def lengthOfLongestSubstring(s):\n    st = set()\n    l = r = ans = 0\n    while r < len(s):\n        while s[r] in st:\n            st.remove(s[l])\n            l += 1\n        st.add(s[r])\n        ans = max(ans, r - l + 1)\n        r += 1\n    return ans' },
          { problem: validParenProblem, score: 98.2, time: 11, code: 'def isValid(s):\n    st = []\n    for c in s:\n        if c in "({[": st.append(c)\n        elif not st: return False\n        elif c == ")" and st.pop() != "(": return False\n        elif c == "}" and st.pop() != "{": return False\n        elif c == "]" and st.pop() != "[": return False\n    return not st' },
          { problem: binarySearchProblem, score: 98.7, time: 10, code: 'def search(nums, target):\n    import bisect\n    idx = bisect.bisect_left(nums, target)\n    return idx if idx < len(nums) and nums[idx] == target else -1' }
        ]
      },
      // Grace Hopper (Rank 3: 3 problems solved, ~292 total score)
      {
        userId: graceId,
        username: 'grace_hopper',
        submissions: [
          { problem: twoSumProblem, score: 96.4, time: 18, code: optimalCode },
          { problem: containerProblem, score: 97.2, time: 19, code: 'def maxArea(height):\n    l, r = 0, len(height) - 1\n    area = 0\n    while l < r:\n        area = max(area, min(height[l], height[r]) * (r - l))\n        if height[l] < height[r]: l += 1\n        else: r -= 1\n    return area' },
          { problem: validParenProblem, score: 98.5, time: 10, code: 'def isValid(s):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for char in s:\n        if char in pairs.values():\n            stack.append(char)\n        elif char in pairs:\n            if not stack or stack.pop() != pairs[char]:\n                return False\n    return len(stack) == 0' }
        ]
      }
    ];

    for (const persona of competitiveConfigs) {
      for (const item of persona.submissions) {
        await SubmissionModel.findOneAndUpdate(
          { userId: persona.userId, problemId: item.problem._id.toString() },
          {
            userId: persona.userId,
            username: persona.username,
            problemId: item.problem._id.toString(),
            language: 'python',
            languageId: 71,
            code: item.code,
            codeLength: item.code.length,
            isTestRun: false,
            pipelineStatus: 'COMPLETED',
            verdict: 'ACCEPTED',
            executionTimeMs: item.time,
            memoryUsedKb: 13900,
            normalizedTimeMs: item.time,
            compositeScore: item.score,
            testCasesTotal: item.problem.testCases?.length || 5,
            testCasesPassed: item.problem.testCases?.length || 5,
            aiStatus: 'COMPLETED',
            leaderboardSyncPending: false
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log('[Seed] Realistic submissions, AI reports, comparisons and competitive leaderboard profiles seeded successfully.');

    if (disconnectMongoose) {
      await mongoose.disconnect();
    }
  } catch (err: any) {
    console.warn('[Seed] MongoDB seed deferred/offline:', err.message);
  }

  console.log('[Seed] Database seeding completed successfully.');
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed().then(() => process.exit(0)).catch((err) => {
    console.error('[Seed] Fatal error:', err);
    process.exit(1);
  });
}
