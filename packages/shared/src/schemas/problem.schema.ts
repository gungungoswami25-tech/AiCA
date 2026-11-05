import { z } from 'zod';

export const TestCaseSchema = z.object({
  id: z.string().optional(),
  input: z.string(),
  expectedOutput: z.string(),
  isPublic: z.boolean().default(false),
  isEdgeCase: z.boolean().default(false),
  explanation: z.string().optional(),
  weight: z.number().default(1.0)
});

export const ProblemCreateSchema = z.object({
  title: z.string().min(3).max(100),
  slug: z.string().min(3).max(100),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  tags: z.array(z.string()),
  description: z.string().min(10),
  constraints: z.array(z.string()),
  examples: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string().optional()
    })
  ),
  timeLimitMs: z.number().int().min(100).max(10000).default(2000),
  memoryLimitKb: z.number().int().min(16384).max(524288).default(262144),
  starterCode: z.object({
    python: z.string().optional(),
    javascript: z.string().optional(),
    cpp: z.string().optional(),
    java: z.string().optional()
  }),
  testCases: z.array(TestCaseSchema)
});

export type ProblemCreateDto = z.infer<typeof ProblemCreateSchema>;
