import { SupportedLanguage } from '../constants/languages.js';

export type ProblemDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isPublic: boolean;
  isEdgeCase: boolean;
  explanation?: string;
  weight: number;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemBenchmarks {
  targetTimeMs: number;
  pythonMultiplier: number;
  jsMultiplier: number;
  cppMultiplier: number;
  javaMultiplier: number;
}

export interface Problem {
  id: string; // MongoDB ObjectId
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  description: string;
  constraints: string[];
  examples: ProblemExample[];
  timeLimitMs: number;
  memoryLimitKb: number;
  benchmarks: ProblemBenchmarks;
  starterCode: Record<SupportedLanguage, string>;
  testCases?: TestCase[]; // Populated only for admin or internally by worker
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate?: number;
  createdBy: string; // PostgreSQL UUID
  createdAt: string;
  updatedAt: string;
}

export interface ProblemListItem {
  id: string;
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  acceptanceRate: number;
  totalSubmissions: number;
}
