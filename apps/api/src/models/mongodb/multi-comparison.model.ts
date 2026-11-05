import mongoose, { Schema, Document } from 'mongoose';
import { MultiSolutionComparison } from '@aica/shared';

export interface MultiSolutionComparisonDocument extends Omit<MultiSolutionComparison, 'id'>, Document {}

const MultiSolutionItemSchema = new Schema(
  {
    submissionId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    versionLabel: { type: String, default: 'Version 1' },
    algorithmName: { type: String, default: 'Standard Algorithm' },
    language: { type: String, required: true },
    code: { type: String, required: true },
    verdict: { type: String, required: true },
    executionTimeMs: { type: Number, required: true },
    memoryUsedKb: { type: Number, required: true },
    timeComplexity: { type: String, default: '' },
    spaceComplexity: { type: String, default: '' },
    qualityScore: { type: Number, default: 5 },
    compositeScore: { type: Number, default: 0 },
    keyStrengths: [{ type: String }],
    weaknessesOrBottlenecks: [{ type: String }],
    optimizationNotes: { type: String, default: '' },
    createdAt: { type: String, required: true }
  },
  { _id: false }
);

const MultiSolutionComparisonSchema = new Schema<MultiSolutionComparisonDocument>(
  {
    problemId: { type: String, required: true, index: true },
    problemTitle: { type: String, required: true },
    solutions: [MultiSolutionItemSchema],
    matrixComparison: {
      theoreticalRankings: [
        {
          algorithmName: { type: String },
          timeComplexity: { type: String },
          spaceComplexity: { type: String },
          rank: { type: Number },
          rationale: { type: String }
        }
      ],
      empiricalAnalysis: {
        fastestSubmissionId: { type: String },
        lowestMemorySubmissionId: { type: String },
        runtimeRangeMs: { type: String },
        memoryRangeKb: { type: String }
      },
      evolutionarySynthesis: { type: String, required: true },
      pedagogicalTakeaway: { type: String, required: true }
    }
  },
  {
    collection: 'multi_solution_comparisons',
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

MultiSolutionComparisonSchema.index({ createdAt: -1 });

export const MultiSolutionComparisonModel = mongoose.model<MultiSolutionComparisonDocument>(
  'MultiSolutionComparison',
  MultiSolutionComparisonSchema
);
