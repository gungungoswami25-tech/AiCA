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

export async function runSeed(disconnectMongoose = true) {
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
            expectedOutput: '4',
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
      }
    ];

    for (const p of problemsData) {
      await ProblemModel.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
    }

    console.log('[Seed] MongoDB problem catalog seeded successfully with 3 comprehensive problems.');
    if (disconnectMongoose) {
      await mongoose.disconnect();
    }
  } catch (err: any) {
    console.warn('[Seed] MongoDB seed deferred/offline:', err.message);
  }

  console.log('[Seed] Database seeding completed.');
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed().then(() => process.exit(0)).catch(() => process.exit(1));
}
