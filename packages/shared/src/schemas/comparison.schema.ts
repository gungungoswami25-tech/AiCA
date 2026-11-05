import { z } from 'zod';

export const ComparisonCreateSchema = z.object({
  submissionIdA: z.string().min(1, 'submissionIdA is required'),
  submissionIdB: z.string().min(1, 'submissionIdB is required')
});

export type ComparisonCreateDto = z.infer<typeof ComparisonCreateSchema>;
