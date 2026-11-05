import { z } from 'zod';

export const SubmissionRequestSchema = z.object({
  problemId: z.string().min(1, 'Problem ID is required'),
  language: z.enum(['python', 'javascript', 'cpp', 'java'], {
    errorMap: () => ({ message: 'Language must be one of: python, javascript, cpp, java' })
  }),
  code: z
    .string()
    .min(5, 'Code must be at least 5 characters')
    .max(65536, 'Code exceeds maximum limit of 64KB'),
  isTestRun: z.boolean().optional().default(false)
});

export type SubmissionRequestDto = z.infer<typeof SubmissionRequestSchema>;

export const CustomRunRequestSchema = z.object({
  language: z.enum(['python', 'javascript', 'cpp', 'java'], {
    errorMap: () => ({ message: 'Language must be one of: python, javascript, cpp, java' })
  }),
  code: z
    .string()
    .min(1, 'Source code cannot be empty')
    .max(65536, 'Code exceeds maximum limit of 64KB'),
  stdin: z
    .string()
    .max(65536, 'Standard input exceeds maximum limit of 64KB')
    .optional()
    .default('')
});

export type CustomRunRequestDto = z.infer<typeof CustomRunRequestSchema>;
