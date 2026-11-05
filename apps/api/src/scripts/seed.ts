import mongoose from 'mongoose';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pgPool } from '../config/db.js';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import { LANGUAGE_CONFIGS } from '@aica/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

export async function runSeed() {
  console.log('[Seed] Starting database seeding for PostgreSQL & MongoDB...');

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

    const studentPass = await argon2.hash('DemoUser123!');
    const adminPass = await argon2.hash('AdminSecret123!');

    // Upsert Student
    const studentRes = await client.query(
      `INSERT INTO users (email, username, password_hash, role, status)
       VALUES ('student@aica.lab', 'algo_student', $1, 'STUDENT', 'ACTIVE')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [studentPass]
    );

    const studentId = studentRes.rows[0].id;
    await client.query(
      `INSERT INTO user_profiles (user_id, full_name, bio, total_submissions, problems_solved)
       VALUES ($1, 'Algorithmic Learner', 'Passionate about data structures and optimization.', 14, 5)
       ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name`,
      [studentId]
    );

    // Upsert Admin
    await client.query(
      `INSERT INTO users (email, username, password_hash, role, status)
       VALUES ('admin@aica.lab', 'lab_admin', $1, 'ADMIN', 'ACTIVE')
       ON CONFLICT (email) DO UPDATE SET role = 'ADMIN'`,
      [adminPass]
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
    console.log('[Seed] Seeding MongoDB problem catalog...');

    const problemsData = [
      {
        title: 'Two Sum Optimal',
        slug: 'two-sum-optimal',
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
          // Public Tests
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
          // Hidden Tests
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
        totalSubmissions: 48,
        acceptedSubmissions: 36,
        createdBy: 'system_admin'
      },
      {
        title: 'Longest Substring Without Repeating Characters',
        slug: 'longest-substring-without-repeating',
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
        totalSubmissions: 32,
        acceptedSubmissions: 18,
        createdBy: 'system_admin'
      },
      {
        title: 'Container With Most Water',
        slug: 'container-with-most-water',
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
        totalSubmissions: 24,
        acceptedSubmissions: 15,
        createdBy: 'system_admin'
      }
    ];

    for (const p of problemsData) {
      await ProblemModel.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
    }

    console.log('[Seed] MongoDB problem catalog seeded successfully with 3 comprehensive problems.');
    await mongoose.disconnect();
  } catch (err: any) {
    console.warn('[Seed] MongoDB seed deferred/offline:', err.message);
  }

  console.log('[Seed] Database seeding completed.');
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed().then(() => process.exit(0)).catch(() => process.exit(1));
}
