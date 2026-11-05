export type SupportedLanguage = 'python' | 'javascript' | 'cpp' | 'java';

export interface LanguageConfig {
  id: number;
  name: string;
  slug: SupportedLanguage;
  monacoLanguage: string;
  extension: string;
  multiplier: number;
  memoryOffsetKb: number;
  defaultBoilerplate: string;
}

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  python: {
    id: 71,
    name: 'Python (3.10)',
    slug: 'python',
    monacoLanguage: 'python',
    extension: '.py',
    multiplier: 4.0,
    memoryOffsetKb: 12288, // 12MB CPython runtime footprint
    defaultBoilerplate: `def solve():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()\n`
  },
  javascript: {
    id: 63,
    name: 'JavaScript (Node.js 18)',
    slug: 'javascript',
    monacoLanguage: 'javascript',
    extension: '.js',
    multiplier: 2.5,
    memoryOffsetKb: 20480, // 20MB V8 runtime footprint
    defaultBoilerplate: `function solve() {\n    // Write your solution here\n}\n\nsolve();\n`
  },
  cpp: {
    id: 54,
    name: 'C++ (GCC 12.2)',
    slug: 'cpp',
    monacoLanguage: 'cpp',
    extension: '.cpp',
    multiplier: 1.0,
    memoryOffsetKb: 2048, // 2MB binary footprint
    defaultBoilerplate: `#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Write your solution here\n    return 0;\n}\n`
  },
  java: {
    id: 62,
    name: 'Java (OpenJDK 17)',
    slug: 'java',
    monacoLanguage: 'java',
    extension: '.java',
    multiplier: 2.0,
    memoryOffsetKb: 28672, // 28MB JVM base footprint
    defaultBoilerplate: `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n    }\n}\n`
  }
};

export const JUDGE0_LANGUAGE_IDS: Record<number, SupportedLanguage> = {
  71: 'python',
  63: 'javascript',
  54: 'cpp',
  62: 'java'
};
