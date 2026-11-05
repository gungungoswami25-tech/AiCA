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
import { MultiSolutionComparisonModel } from '../models/mongodb/multi-comparison.model.js';

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
          python: `import sys\n\ndef twoSum(nums: list[int], target: int) -> list[int]:\n    # Implement O(N) hash map solution here\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if len(lines) >= 3:\n        n = int(lines[0])\n        nums = [int(x) for x in lines[1:n+1]]\n        target = int(lines[n+1])\n        res = twoSum(nums, target)\n        if res and len(res) >= 2:\n            print(f"{res[0]} {res[1]}")\n`,
          javascript: `const fs = require('fs');\n\nfunction twoSum(nums, target) {\n    // Implement O(N) hash map solution here\n    return [];\n}\n\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nif (input.length >= 3) {\n    const n = parseInt(input[0], 10);\n    const nums = input.slice(1, n + 1).map(Number);\n    const target = parseInt(input[n + 1], 10);\n    const res = twoSum(nums, target);\n    if (res && res.length >= 2) console.log(res.join(' '));\n}\n`,
          cpp: `#include <iostream>\n#include <vector>\n#include <unordered_map>\n\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Implement O(N) hash map solution here\n    return {};\n}\n\nint main() {\n    int n;\n    if (cin >> n) {\n        vector<int> nums(n);\n        for (int i = 0; i < n; i++) cin >> nums[i];\n        int target;\n        cin >> target;\n        vector<int> res = twoSum(nums, target);\n        if (res.size() >= 2) cout << res[0] << " " << res[1] << endl;\n    }\n    return 0;\n}\n`,
          java: `import java.util.*;\n\npublic class Solution {\n    public static int[] twoSum(int[] nums, int target) {\n        // Implement O(N) hash map solution here\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int[] nums = new int[n];\n            for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n            int target = sc.nextInt();\n            int[] res = twoSum(nums, target);\n            if (res != null && res.length >= 2) System.out.println(res[0] + " " + res[1]);\n        }\n    }\n}\n`
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
          python: `import sys\n\ndef lengthOfLongestSubstring(s: str) -> int:\n    # Implement sliding window here\n    return 0\n\nif __name__ == '__main__':\n    s = sys.stdin.read().rstrip('\\r\\n')\n    print(lengthOfLongestSubstring(s))\n`,
          javascript: `const fs = require('fs');\n\nfunction lengthOfLongestSubstring(s) {\n    // Implement sliding window here\n    return 0;\n}\n\nconst s = fs.readFileSync(0, 'utf-8').replace(/[\\r\\n]+$/, '');\nconsole.log(lengthOfLongestSubstring(s));\n`,
          cpp: `#include <iostream>\n#include <string>\n#include <unordered_set>\n\nusing namespace std;\n\nint lengthOfLongestSubstring(string s) {\n    // Implement sliding window here\n    return 0;\n}\n\nint main() {\n    string s;\n    if (getline(cin, s)) {\n        cout << lengthOfLongestSubstring(s) << endl;\n    }\n    return 0;\n}\n`,
          java: `import java.util.*;\n\npublic class Solution {\n    public static int lengthOfLongestSubstring(String s) {\n        // Implement sliding window here\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.hasNextLine() ? sc.nextLine() : "";\n        System.out.println(lengthOfLongestSubstring(s));\n    }\n}\n`
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
          python: `import sys\n\ndef maxArea(height: list[int]) -> int:\n    # Implement O(N) two pointers\n    return 0\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if len(lines) >= 2:\n        n = int(lines[0])\n        h = [int(x) for x in lines[1:n+1]]\n        print(maxArea(h))\n`,
          javascript: `const fs = require('fs');\n\nfunction maxArea(height) {\n    return 0;\n}\n\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    const n = parseInt(input[0], 10);\n    const nums = input.slice(1, n + 1).map(Number);\n    console.log(maxArea(nums));\n}\n`,
          cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint maxArea(vector<int>& height) {\n    return 0;\n}\n\nint main() {\n    int n;\n    if (cin >> n) {\n        vector<int> h(n);\n        for (int i = 0; i < n; i++) cin >> h[i];\n        cout << maxArea(h) << endl;\n    }\n    return 0;\n}\n`,
          java: `import java.util.*;\n\npublic class Solution {\n    public static int maxArea(int[] height) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int[] h = new int[n];\n            for (int i = 0; i < n; i++) h[i] = sc.nextInt();\n            System.out.println(maxArea(h));\n        }\n    }\n}\n`
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
          python: `import sys\n\ndef isValid(s: str) -> bool:\n    # Implement stack solution here\n    pass\n\nif __name__ == '__main__':\n    s = sys.stdin.read().strip()\n    print('true' if isValid(s) else 'false')\n`,
          javascript: `const fs = require('fs');\n\nfunction isValid(s) {\n    return false;\n}\n\nconst s = fs.readFileSync(0, 'utf-8').trim();\nconsole.log(isValid(s) ? 'true' : 'false');\n`,
          cpp: `#include <iostream>\n#include <string>\n#include <stack>\n\nusing namespace std;\n\nbool isValid(string s) {\n    return false;\n}\n\nint main() {\n    string s;\n    if (cin >> s) {\n        cout << (isValid(s) ? "true" : "false") << endl;\n    }\n    return 0;\n}\n`,
          java: `import java.util.*;\n\npublic class Solution {\n    public static boolean isValid(String s) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.hasNext() ? sc.next() : "";\n        System.out.println(isValid(s) ? "true" : "false");\n    }\n}\n`
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
          python: `import sys\n\ndef search(nums: list[int], target: int) -> int:\n    # Implement O(log N) binary search\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if len(lines) >= 3:\n        n = int(lines[0])\n        nums = [int(x) for x in lines[1:n+1]]\n        target = int(lines[n+1])\n        print(search(nums, target))\n`,
          javascript: `const fs = require('fs');\n\nfunction search(nums, target) {\n    return -1;\n}\n\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nif (input.length >= 3) {\n    const n = parseInt(input[0], 10);\n    const nums = input.slice(1, n + 1).map(Number);\n    const target = parseInt(input[n + 1], 10);\n    console.log(search(nums, target));\n}\n`,
          cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint search(vector<int>& nums, int target) {\n    return -1;\n}\n\nint main() {\n    int n;\n    if (cin >> n) {\n        vector<int> nums(n);\n        for (int i = 0; i < n; i++) cin >> nums[i];\n        int target;\n        cin >> target;\n        cout << search(nums, target) << endl;\n    }\n    return 0;\n}\n`,
          java: `import java.util.*;\n\npublic class Solution {\n    public static int search(int[] nums, int target) {\n        return -1;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int[] nums = new int[n];\n            for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n            int target = sc.nextInt();\n            System.out.println(search(nums, target));\n        }\n    }\n}\n`
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
      },
      {
        title: 'Valid Palindrome (Alphanumeric)',
        slug: 'valid-palindrome',
        status: 'PUBLISHED',
        difficulty: 'EASY',
        tags: ['Strings', 'Two-Pointers'],
        description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.`,
        constraints: [
          '1 <= s.length <= 2 * 10^5',
          's consists only of printable ASCII characters.'
        ],
        examples: [
          {
            input: 's = "A man, a plan, a canal: Panama"',
            output: 'true',
            explanation: '"amanaplanacanalpanama" is a palindrome.'
          },
          {
            input: 's = "race a car"',
            output: 'false',
            explanation: '"raceacar" is not a palindrome.'
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
          python: `import sys\n\ndef isPalindrome(s: str) -> bool:\n    # Implement two-pointer check\n    return True\n\nif __name__ == '__main__':\n    line = sys.stdin.read().strip()\n    print('true' if isPalindrome(line) else 'false')\n`,
          javascript: `const fs = require('fs');\n\nfunction isPalindrome(s) {\n    return true;\n}\n\nconst input = fs.readFileSync(0, 'utf-8').trim();\nconsole.log(isPalindrome(input) ? 'true' : 'false');\n`,
          cpp: `#include <iostream>\n#include <string>\n#include <cctype>\n\nbool isPalindrome(std::string s) {\n    return true;\n}\n\nint main() {\n    std::string s;\n    std::getline(std::cin, s);\n    std::cout << (isPalindrome(s) ? "true" : "false") << std::endl;\n    return 0;\n}\n`,
          java: `import java.util.Scanner;\n\npublic class Solution {\n    public static boolean isPalindrome(String s) {\n        return true;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.hasNextLine() ? sc.nextLine() : "";\n        System.out.println(isPalindrome(s) ? "true" : "false");\n    }\n}\n`
        },
        testCases: [
          {
            id: 'tc-pal-1',
            input: 'A man, a plan, a canal: Panama',
            expectedOutput: 'true',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-pal-2',
            input: 'race a car',
            expectedOutput: 'false',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-pal-3',
            input: ' ',
            expectedOutput: 'true',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Empty alphanumeric string is palindrome'
          },
          {
            id: 'tc-pal-4',
            input: '0P',
            expectedOutput: 'false',
            isPublic: false,
            isEdgeCase: true
          },
          {
            id: 'tc-pal-5',
            input: 'ab_a',
            expectedOutput: 'true',
            isPublic: false,
            isEdgeCase: true
          }
        ],
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        createdBy: 'system_admin'
      },
      {
        title: 'Floating Circle Metrics',
        slug: 'floating-circle-metrics',
        status: 'PUBLISHED',
        difficulty: 'EASY',
        tags: ['Math', 'Geometry'],
        description: `Given the radius \`r\` of a circle as a floating-point number, calculate its **area** and **circumference**.

Output two space-separated floating-point values rounded or within $\\epsilon = 10^{-6}$ error:
\`area circumference\`

Use $\\pi \\approx 3.141592653589793$.`,
        constraints: [
          '0.0 <= r <= 10^4'
        ],
        examples: [
          {
            input: 'r = 5.0',
            output: '78.539816 31.415927',
            explanation: 'Area = pi * 5^2, Circumference = 2 * pi * 5'
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
          python: `import sys\nimport math\n\ndef circleMetrics(r: float) -> tuple[float, float]:\n    area = math.pi * r * r\n    circ = 2 * math.pi * r\n    return area, circ\n\nif __name__ == '__main__':\n    line = sys.stdin.read().strip()\n    if line:\n        r = float(line)\n        a, c = circleMetrics(r)\n        print(f"{a:.6f} {c:.6f}")\n`,
          javascript: `const fs = require('fs');\nconst line = fs.readFileSync(0, 'utf-8').trim();\nif (line) {\n    const r = parseFloat(line);\n    const a = Math.PI * r * r;\n    const c = 2 * Math.PI * r;\n    console.log(a.toFixed(6) + ' ' + c.toFixed(6));\n}\n`,
          cpp: `#include <iostream>\n#include <cmath>\n#include <iomanip>\n\nint main() {\n    double r;\n    if (std::cin >> r) {\n        double pi = std::acos(-1.0);\n        double a = pi * r * r;\n        double c = 2.0 * pi * r;\n        std::cout << std::fixed << std::setprecision(6) << a << " " << c << std::endl;\n    }\n    return 0;\n}\n`,
          java: `import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextDouble()) {\n            double r = sc.nextDouble();\n            double a = Math.PI * r * r;\n            double c = 2.0 * Math.PI * r;\n            System.out.printf(java.util.Locale.US, "%.6f %.6f\\n", a, c);\n        }\n    }\n}\n`
        },
        testCases: [
          {
            id: 'tc-circ-1',
            input: '5.0',
            expectedOutput: '78.539816 31.415927',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-circ-2',
            input: '1.0',
            expectedOutput: '3.141593 6.283185',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-circ-3',
            input: '0.0',
            expectedOutput: '0.0 0.0',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Zero radius edge case'
          },
          {
            id: 'tc-circ-4',
            input: '10.5',
            expectedOutput: '346.360590 65.973446',
            isPublic: false,
            isEdgeCase: false
          }
        ],
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        createdBy: 'system_admin'
      },
      {
        title: 'Subarray Sum Equals K',
        slug: 'subarray-sum-equals-k',
        status: 'PUBLISHED',
        difficulty: 'MEDIUM',
        tags: ['Arrays', 'Hash-Table', 'Prefix-Sum'],
        description: `Given an array of integers \`nums\` and an integer \`k\`, return *the total number of subarrays whose sum equals to \`k\`*.

A subarray is a contiguous non-empty sequence of elements within an array.

Input format:
First line: \`n\` and \`k\` space-separated.
Second line: \`n\` integers space-separated.`,
        constraints: [
          '1 <= nums.length <= 2 * 10^4',
          '-1000 <= nums[i] <= 1000',
          '-10^7 <= k <= 10^7'
        ],
        examples: [
          {
            input: '3 2\n1 1 1',
            output: '2',
            explanation: 'Subarrays [1, 1] at indices (0, 1) and (1, 2) sum to 2.'
          },
          {
            input: '3 3\n1 2 3',
            output: '2',
            explanation: 'Subarrays [1, 2] and [3] sum to 3.'
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
          python: `import sys\n\ndef subarraySum(nums: list[int], k: int) -> int:\n    # Implement O(N) hash map prefix sums\n    count = 0\n    curr_sum = 0\n    prefix = {0: 1}\n    for x in nums:\n        curr_sum += x\n        if curr_sum - k in prefix:\n            count += prefix[curr_sum - k]\n        prefix[curr_sum] = prefix.get(curr_sum, 0) + 1\n    return count\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().strip().split('\\n')\n    if len(lines) >= 2:\n        n, k = map(int, lines[0].split())\n        nums = list(map(int, lines[1].split()))\n        print(subarraySum(nums, k))\n`,
          javascript: `const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nif (lines.length >= 2) {\n    const [n, k] = lines[0].trim().split(/\\s+/).map(Number);\n    const nums = lines[1].trim().split(/\\s+/).map(Number);\n    const map = new Map([[0, 1]]);\n    let sum = 0, count = 0;\n    for (const x of nums) {\n        sum += x;\n        if (map.has(sum - k)) count += map.get(sum - k);\n        map.set(sum, (map.get(sum) || 0) + 1);\n    }\n    console.log(count);\n}\n`,
          cpp: `#include <iostream>\n#include <vector>\n#include <unordered_map>\n\nint main() {\n    int n, k;\n    if (std::cin >> n >> k) {\n        std::vector<int> nums(n);\n        for (int i = 0; i < n; ++i) std::cin >> nums[i];\n        std::unordered_map<int, int> prefix{{0, 1}};\n        int sum = 0, count = 0;\n        for (int x : nums) {\n            sum += x;\n            if (prefix.count(sum - k)) count += prefix[sum - k];\n            prefix[sum]++;\n        }\n        std::cout << count << std::endl;\n    }\n    return 0;\n}\n`,
          java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int k = sc.nextInt();\n            Map<Integer, Integer> map = new HashMap<>();\n            map.put(0, 1);\n            int sum = 0, count = 0;\n            for (int i = 0; i < n; i++) {\n                sum += sc.nextInt();\n                if (map.containsKey(sum - k)) count += map.get(sum - k);\n                map.put(sum, map.getOrDefault(sum, 0) + 1);\n            }\n            System.out.println(count);\n        }\n    }\n}\n`
        },
        testCases: [
          {
            id: 'tc-subsum-1',
            input: '3 2\n1 1 1',
            expectedOutput: '2',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-subsum-2',
            input: '3 3\n1 2 3',
            expectedOutput: '2',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-subsum-3',
            input: '5 0\n1 -1 1 -1 1',
            expectedOutput: '6',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Subarrays summing to zero'
          },
          {
            id: 'tc-subsum-4',
            input: '1 0\n0',
            expectedOutput: '1',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Single element zero'
          }
        ],
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        createdBy: 'system_admin'
      },
      {
        title: 'Sort 10,000 Numbers (Sorting Challenge)',
        slug: 'sort-10000-numbers',
        status: 'PUBLISHED',
        difficulty: 'MEDIUM',
        tags: ['Algorithms', 'Sorting', 'Divide-and-Conquer', 'Benchmark'],
        description: `Given a list of numbers (up to 10,000 integers), sort the list in ascending numerical order.

Input Format:
First line contains integer n (1 <= n <= 10,000).
Second line contains n space-separated integers.

Output Format:
Print the sorted integers separated by a single space.

Notice for Algorithm Engineers:
In the AI Code Evolution Lab, this challenge benchmarks how different algorithmic paradigms scale:
- Student A: Bubble Sort (Version 1) - O(N^2)
- Student B: Merge Sort (Version 2) - O(N log N)
- Student C: Quick Sort (Version 3) - Average O(N log N)

Note: Asymptotic Big-O complexity is theoretical. Actual execution time is empirically measured in the controlled sandbox environment.`,
        constraints: [
          '1 <= nums.length <= 10^4',
          '-10^5 <= nums[i] <= 10^5'
        ],
        examples: [
          {
            input: '4\n5 2 3 1',
            output: '1 2 3 5',
            explanation: 'The sorted array in non-decreasing order is [1, 2, 3, 5].'
          },
          {
            input: '6\n5 1 1 2 0 0',
            output: '0 0 1 1 2 5',
            explanation: 'Sorted array with duplicates.'
          }
        ],
        timeLimitMs: 3000,
        memoryLimitKb: 262144,
        benchmarks: {
          targetTimeMs: 25,
          pythonMultiplier: 4.0,
          jsMultiplier: 2.5,
          cppMultiplier: 1.0,
          javaMultiplier: 2.0
        },
        starterCode: {
          python: `import sys\n\ndef sort_array(nums: list[int]) -> list[int]:\n    # Implement an efficient sorting algorithm (e.g. Merge Sort, Quick Sort, or Bubble Sort)\n    return sorted(nums)\n\nif __name__ == '__main__':\n    data = sys.stdin.read().split()\n    if data:\n        n = int(data[0])\n        nums = [int(x) for x in data[1:n+1]]\n        sorted_nums = sort_array(nums)\n        print(' '.join(map(str, sorted_nums)))\n`,
          javascript: `const fs = require('fs');\nconst data = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nif (data.length > 1) {\n    const n = parseInt(data[0], 10);\n    const nums = data.slice(1, n + 1).map(Number);\n    nums.sort((a, b) => a - b);\n    console.log(nums.join(' '));\n}\n`,
          cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> nums(n);\n        for (int i = 0; i < n; ++i) std::cin >> nums[i];\n        std::sort(nums.begin(), nums.end());\n        for (int i = 0; i < n; ++i) std::cout << nums[i] << (i == n - 1 ? "" : " ");\n        std::cout << std::endl;\n    }\n    return 0;\n}\n`,
          java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int[] nums = new int[n];\n            for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n            Arrays.sort(nums);\n            StringBuilder sb = new StringBuilder();\n            for (int i = 0; i < n; i++) {\n                sb.append(nums[i]);\n                if (i < n - 1) sb.append(" ");\n            }\n            System.out.println(sb.toString());\n        }\n    }\n}\n`
        },
        testCases: [
          {
            id: 'tc-sort-1',
            input: '4\n5 2 3 1',
            expectedOutput: '1 2 3 5',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-sort-2',
            input: '6\n5 1 1 2 0 0',
            expectedOutput: '0 0 1 1 2 5',
            isPublic: true,
            isEdgeCase: false
          },
          {
            id: 'tc-sort-3',
            input: '10\n1 2 3 4 5 6 7 8 9 10',
            expectedOutput: '1 2 3 4 5 6 7 8 9 10',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Already sorted array'
          },
          {
            id: 'tc-sort-4',
            input: '8\n80 70 60 50 40 30 20 10',
            expectedOutput: '10 20 30 40 50 60 70 80',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Reverse sorted array'
          },
          {
            id: 'tc-sort-5',
            input: '7\n-3 10 -5 0 10 -3 2',
            expectedOutput: '-5 -3 -3 0 2 10 10',
            isPublic: false,
            isEdgeCase: true,
            explanation: 'Negative numbers with duplicates'
          }
        ],
        totalSubmissions: 3,
        acceptedSubmissions: 3,
        createdBy: 'system_admin'
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

    // 3B. Sorting Challenge Collaborative Multi-Solution Evolution Showcase
    const sortProblem = problemMap['sort-10000-numbers'];
    if (sortProblem) {
      console.log('[Seed] Seeding Sorting Problem 3-Student Collaborative Submissions & Multi-Solution Matrix...');

      const bubbleSortCode = `import sys

def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

if __name__ == '__main__':
    data = sys.stdin.read().split()
    if data:
        n = int(data[0])
        nums = [int(x) for x in data[1:n+1]]
        sorted_nums = bubble_sort(nums)
        print(' '.join(map(str, sorted_nums)))`;

      const sortSubA = await SubmissionModel.findOneAndUpdate(
        { userId: studentId, problemId: sortProblem._id.toString() },
        {
          userId: studentId,
          username: 'algo_student',
          problemId: sortProblem._id.toString(),
          language: 'python',
          languageId: 71,
          code: bubbleSortCode,
          codeLength: bubbleSortCode.length,
          isTestRun: false,
          pipelineStatus: 'COMPLETED',
          verdict: 'ACCEPTED',
          executionTimeMs: 420,
          memoryUsedKb: 14200,
          normalizedTimeMs: 420,
          compositeScore: 68.5,
          testCasesTotal: 5,
          testCasesPassed: 5,
          aiStatus: 'COMPLETED',
          leaderboardSyncPending: false
        },
        { upsert: true, new: true }
      );

      await EvaluationReportModel.findOneAndUpdate(
        { submissionId: sortSubA._id.toString() },
        {
          submissionId: sortSubA._id.toString(),
          userId: studentId,
          username: 'algo_student',
          problemId: sortProblem._id.toString(),
          verdict: 'ACCEPTED',
          pipelineStatus: 'COMPLETED',
          summary: 'Student A (Version 1) - Bubble Sort evaluated. 5/5 test cases passed.',
          aiAnalysis: {
            status: 'COMPLETED',
            mode: 'OPTIMIZATION',
            codeSummary: 'Nested loop bubble sort comparing adjacent elements. Simple in-place approach, but suffers from O(N^2) quadratic comparisons on larger lists.',
            theoreticalComplexity: {
              timeComplexity: 'O(N^2)',
              spaceComplexity: 'O(1)',
              explanation: 'Exhibits nested loops iterating over n elements, executing n*(n-1)/2 comparisons. Constant auxiliary memory O(1).'
            },
            codeQuality: {
              score: 6.5,
              readabilityAnalysis: 'Straightforward procedural code, but lacks modular decomposition and early swap termination.',
              codeSmells: ['Quadratic time complexity causes severe CPU throttling on 10,000 numbers (~50M comparisons)', 'Missing swapped flag'],
              positivePractices: ['Minimal auxiliary memory O(1)', 'In-place sorting']
            },
            optimizationSuggestions: [
              {
                title: 'Add Early Termination Flag',
                rationale: 'Stop passes when no swaps occur, reducing best-case to O(N).',
                expectedTimeImpact: 'Improves best-case to O(N)',
                refactoredSnippet: 'swapped = False\nfor j in range(0, n - i - 1):\n    if arr[j] > arr[j+1]: arr[j], arr[j+1] = arr[j+1], arr[j]; swapped = True\nif not swapped: break'
              }
            ],
            generatedAt: new Date().toISOString()
          },
          metrics: {
            rawTimeMs: 420,
            normalizedTimeMs: 420,
            rawMemoryKb: 14200,
            normalizedMemoryKb: 14200,
            compositeScore: 68.5,
            percentileTime: 35,
            percentileMemory: 95
          }
        },
        { upsert: true, new: true }
      );

      const mergeSortCode = `import sys

def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

if __name__ == '__main__':
    data = sys.stdin.read().split()
    if data:
        n = int(data[0])
        nums = [int(x) for x in data[1:n+1]]
        sorted_nums = merge_sort(nums)
        print(' '.join(map(str, sorted_nums)))`;

      const sortSubB = await SubmissionModel.findOneAndUpdate(
        { userId: alanId, problemId: sortProblem._id.toString() },
        {
          userId: alanId,
          username: 'alan_turing',
          problemId: sortProblem._id.toString(),
          language: 'python',
          languageId: 71,
          code: mergeSortCode,
          codeLength: mergeSortCode.length,
          isTestRun: false,
          pipelineStatus: 'COMPLETED',
          verdict: 'ACCEPTED',
          executionTimeMs: 28,
          memoryUsedKb: 18900,
          normalizedTimeMs: 28,
          compositeScore: 92.0,
          testCasesTotal: 5,
          testCasesPassed: 5,
          aiStatus: 'COMPLETED',
          leaderboardSyncPending: false
        },
        { upsert: true, new: true }
      );

      await EvaluationReportModel.findOneAndUpdate(
        { submissionId: sortSubB._id.toString() },
        {
          submissionId: sortSubB._id.toString(),
          userId: alanId,
          username: 'alan_turing',
          problemId: sortProblem._id.toString(),
          verdict: 'ACCEPTED',
          pipelineStatus: 'COMPLETED',
          summary: 'Student B (Version 2) - Merge Sort evaluated. 5/5 test cases passed.',
          aiAnalysis: {
            status: 'COMPLETED',
            mode: 'OPTIMIZATION',
            codeSummary: 'Divide-and-conquer recursive halving and linear merging. Guarantees O(N log N) time complexity across all input distributions.',
            theoreticalComplexity: {
              timeComplexity: 'O(N log N)',
              spaceComplexity: 'O(N)',
              explanation: 'Array is recursively halved log2(n) times, requiring O(n) work per level. Auxiliary space O(N) due to slice allocations.'
            },
            codeQuality: {
              score: 9.0,
              readabilityAnalysis: 'Clean functional decomposition with idiomatic slice syntax and clear two-pointer merge logic.',
              codeSmells: ['Slice operations arr[:mid] and arr[mid:] allocate new memory buffers at every recursive frame'],
              positivePractices: ['Guaranteed O(N log N) worst-case time', 'Stable sort preserving duplicate order']
            },
            optimizationSuggestions: [
              {
                title: 'Pass Index Pointers Instead of Slicing',
                rationale: 'Reduce memory allocation pressure by working over indices low, mid, high with single auxiliary buffer.',
                expectedTimeImpact: 'Cuts memory overhead by ~40%',
                refactoredSnippet: 'def merge(arr, aux, low, mid, high): ...'
              }
            ],
            generatedAt: new Date().toISOString()
          },
          metrics: {
            rawTimeMs: 28,
            normalizedTimeMs: 28,
            rawMemoryKb: 18900,
            normalizedMemoryKb: 18900,
            compositeScore: 92.0,
            percentileTime: 92,
            percentileMemory: 70
          }
        },
        { upsert: true, new: true }
      );

      const quickSortCode = `import sys

def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

if __name__ == '__main__':
    data = sys.stdin.read().split()
    if data:
        n = int(data[0])
        nums = [int(x) for x in data[1:n+1]]
        quick_sort(nums, 0, n - 1)
        print(' '.join(map(str, nums)))`;

      const sortSubC = await SubmissionModel.findOneAndUpdate(
        { userId: adaId, problemId: sortProblem._id.toString() },
        {
          userId: adaId,
          username: 'ada_lovelace',
          problemId: sortProblem._id.toString(),
          language: 'python',
          languageId: 71,
          code: quickSortCode,
          codeLength: quickSortCode.length,
          isTestRun: false,
          pipelineStatus: 'COMPLETED',
          verdict: 'ACCEPTED',
          executionTimeMs: 18,
          memoryUsedKb: 14600,
          normalizedTimeMs: 18,
          compositeScore: 96.5,
          testCasesTotal: 5,
          testCasesPassed: 5,
          aiStatus: 'COMPLETED',
          leaderboardSyncPending: false
        },
        { upsert: true, new: true }
      );

      await EvaluationReportModel.findOneAndUpdate(
        { submissionId: sortSubC._id.toString() },
        {
          submissionId: sortSubC._id.toString(),
          userId: adaId,
          username: 'ada_lovelace',
          problemId: sortProblem._id.toString(),
          verdict: 'ACCEPTED',
          pipelineStatus: 'COMPLETED',
          summary: 'Student C (Version 3) - Quick Sort evaluated. 5/5 test cases passed.',
          aiAnalysis: {
            status: 'COMPLETED',
            mode: 'OPTIMIZATION',
            codeSummary: 'In-place Lomuto partitioning with recursive sub-array sorting. Extremely fast in-memory execution due to low constant factors and cache locality.',
            theoreticalComplexity: {
              timeComplexity: 'Average O(N log N), Worst O(N^2)',
              spaceComplexity: 'O(log N)',
              explanation: 'Average case performs O(N log N) comparisons with O(log N) stack frames. Fixed pivot on presorted input causes worst-case O(N^2) depth.'
            },
            codeQuality: {
              score: 8.5,
              readabilityAnalysis: 'Modular partitioning logic and clear recursion bounds.',
              codeSmells: ['Rightmost pivot choice degrades to O(N^2) on sorted/reverse-sorted inputs', 'Recursion stack without tail-call optimization'],
              positivePractices: ['In-place partitioning minimizes auxiliary memory', 'High CPU cache locality']
            },
            optimizationSuggestions: [
              {
                title: 'Randomized or Median-of-Three Pivot Selection',
                rationale: 'Avoids worst-case O(N^2) degradation on presorted datasets.',
                expectedTimeImpact: 'Prevents recursion depth overflow',
                refactoredSnippet: 'import random\ndef randomized_partition(arr, low, high):\n    rand_idx = random.randint(low, high)\n    arr[high], arr[rand_idx] = arr[rand_idx], arr[high]\n    return partition(arr, low, high)'
              }
            ],
            generatedAt: new Date().toISOString()
          },
          metrics: {
            rawTimeMs: 18,
            normalizedTimeMs: 18,
            rawMemoryKb: 14600,
            normalizedMemoryKb: 14600,
            compositeScore: 96.5,
            percentileTime: 97,
            percentileMemory: 90
          }
        },
        { upsert: true, new: true }
      );

      // Seed Multi-Solution Comparison Document
      await MultiSolutionComparisonModel.findOneAndUpdate(
        { problemId: sortProblem._id.toString() },
        {
          problemId: sortProblem._id.toString(),
          problemTitle: 'Sort 10,000 Numbers (Sorting Challenge)',
          solutions: [
            {
              submissionId: sortSubA._id.toString(),
              userId: studentId,
              username: 'algo_student',
              versionLabel: 'Version 1',
              algorithmName: 'Bubble Sort',
              language: 'python',
              code: bubbleSortCode,
              verdict: 'ACCEPTED',
              executionTimeMs: 420,
              memoryUsedKb: 14200,
              timeComplexity: 'O(N^2)',
              spaceComplexity: 'O(1)',
              qualityScore: 6.5,
              compositeScore: 68.5,
              keyStrengths: ['In-place sorting with O(1) auxiliary memory', 'Simple and intuitive logic'],
              weaknessesOrBottlenecks: ['Quadratic O(N^2) time causes severe slowdown on large arrays', 'Performs excessive swaps without early break'],
              optimizationNotes: 'Add swapped flag to achieve O(N) best-case on presorted data.',
              createdAt: new Date().toISOString()
            },
            {
              submissionId: sortSubB._id.toString(),
              userId: alanId,
              username: 'alan_turing',
              versionLabel: 'Version 2',
              algorithmName: 'Merge Sort',
              language: 'python',
              code: mergeSortCode,
              verdict: 'ACCEPTED',
              executionTimeMs: 28,
              memoryUsedKb: 18900,
              timeComplexity: 'O(N log N)',
              spaceComplexity: 'O(N)',
              qualityScore: 9.0,
              compositeScore: 92.0,
              keyStrengths: ['Guaranteed O(N log N) runtime in all scenarios', 'Stable sorting algorithm'],
              weaknessesOrBottlenecks: ['Requires O(N) auxiliary memory for merging', 'Frequent array slicing incurs GC overhead'],
              optimizationNotes: 'Use index pointers and an in-place preallocated merge buffer.',
              createdAt: new Date().toISOString()
            },
            {
              submissionId: sortSubC._id.toString(),
              userId: adaId,
              username: 'ada_lovelace',
              versionLabel: 'Version 3',
              algorithmName: 'Quick Sort',
              language: 'python',
              code: quickSortCode,
              verdict: 'ACCEPTED',
              executionTimeMs: 18,
              memoryUsedKb: 14600,
              timeComplexity: 'Average O(N log N)',
              spaceComplexity: 'O(log N)',
              qualityScore: 8.5,
              compositeScore: 96.5,
              keyStrengths: ['Fastest empirical runtime (18ms) in controlled sandbox', 'In-place partitioning with minimal stack memory'],
              weaknessesOrBottlenecks: ['Naive pivot selection risks O(N^2) degradation on presorted arrays', 'Unstable sort'],
              optimizationNotes: 'Implement median-of-three or randomized pivot selection.',
              createdAt: new Date().toISOString()
            }
          ],
          matrixComparison: {
            theoreticalRankings: [
              {
                algorithmName: 'Merge Sort',
                timeComplexity: 'O(N log N)',
                spaceComplexity: 'O(N)',
                rank: 1,
                rationale: 'Guaranteed O(N log N) upper bound regardless of input ordering, ideal for mission-critical systems.'
              },
              {
                algorithmName: 'Quick Sort',
                timeComplexity: 'Average O(N log N)',
                spaceComplexity: 'O(log N)',
                rank: 2,
                rationale: 'Fastest practical runtime due to low constant factors and cache locality, but needs randomized pivot to guard against O(N^2).'
              },
              {
                algorithmName: 'Bubble Sort',
                timeComplexity: 'O(N^2)',
                spaceComplexity: 'O(1)',
                rank: 3,
                rationale: 'Optimal O(1) space, but catastrophic O(N^2) time complexity makes it unusable for N=10,000 (~50M comparisons).'
              }
            ],
            empiricalAnalysis: {
              fastestSubmissionId: sortSubC._id.toString(),
              lowestMemorySubmissionId: sortSubA._id.toString(),
              runtimeRangeMs: '18ms - 420ms (23x speedup)',
              memoryRangeKb: '14MB - 19MB'
            },
            evolutionarySynthesis:
              'The 3 student submissions demonstrate a classic textbook evolutionary progression from naive iterative sorting to modern divide-and-conquer algorithms:\n- Version 1 (Bubble Sort): Operates via adjacent swaps. While memory is optimal O(1), sorting 10,000 numbers requires ~50,000,000 operations, leading to 420ms execution.\n- Version 2 (Merge Sort): Halves the array recursively, guaranteeing O(N log N) time and finishing in 28ms. However, it requires O(N) auxiliary space (~18.9MB).\n- Version 3 (Quick Sort): Combines in-place partitioning with O(log N) stack frames. In our controlled testing sandbox, it delivers the fastest empirical runtime (18ms) due to superior CPU cache locality, provided pivot choice is randomized against presorted traps.',
            pedagogicalTakeaway:
              'Choose Merge Sort when stability and strict worst-case guarantees are required (e.g. database query engines); choose Quick Sort with randomized pivots for standard general-purpose in-memory sorting; avoid Bubble Sort except for pedagogical demonstration on trivial datasets.'
          }
        },
        { upsert: true, new: true }
      );
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
