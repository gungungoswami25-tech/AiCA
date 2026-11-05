import mongoose, { Schema, Document } from 'mongoose';
import { SolutionComparison } from '@aica/shared';

export interface SolutionComparisonDocument extends Omit<SolutionComparison, 'id'>, Document {}

const SnapshotSchema = new Schema({
  submissionId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  executionTimeMs: { type: Number, required: true },
  memoryUsedKb: { type: Number, required: true },
  timeComplexity: { type: String, default: '' },
  spaceComplexity: { type: String, default: '' },
  qualityScore: { type: Number, default: 5 },
  compositeScore: { type: Number, default: 0 },
  createdAt: { type: String, required: true }
}, { _id: false });

const SolutionComparisonSchema = new Schema<SolutionComparisonDocument>({
  problemId: { type: String, required: true, index: true },
  submissionA: { type: SnapshotSchema, required: true },
  submissionB: { type: SnapshotSchema, required: true },
  deltaAnalysis: {
    executionTimeDiffMs: { type: Number, default: 0 },
    memoryDiffKb: { type: Number, default: 0 },
    qualityScoreDiff: { type: Number, default: 0 },
    timeComplexityComparison: { type: String, default: '' },
    spaceComplexityComparison: { type: String, default: '' },
    tradeOffSummary: { type: String, default: '' }
  }
}, {
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
});

// Expire comparisons after 7 days
SolutionComparisonSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export const SolutionComparisonModel = mongoose.model<SolutionComparisonDocument>(
  'SolutionComparison',
  SolutionComparisonSchema
);
