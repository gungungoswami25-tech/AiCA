import { z } from 'zod';

export const ComparisonCreateSchema = z.object({
  submissionIdA: z.string().min(1, 'submissionIdA is required'),
  submissionIdB: z.string().min(1, 'submissionIdB is required')
});

export type ComparisonCreateDto = z.infer<typeof ComparisonCreateSchema>;

export const MultiComparisonCreateSchema = z.object({
  submissionIds: z
    .array(z.string().min(1, 'Submission ID cannot be empty'))
    .min(2, 'At least 2 submissions are required for comparison')
    .max(5, 'At most 5 submissions can be compared at once')
});

export type MultiComparisonCreateDto = z.infer<typeof MultiComparisonCreateSchema>;
