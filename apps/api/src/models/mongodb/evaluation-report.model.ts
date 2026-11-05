import mongoose, { Schema, Document } from 'mongoose';
import { EvaluationReport } from '@aica/shared';

export interface EvaluationReportDocument extends Omit<EvaluationReport, 'id'>, Document {}

const EvaluationReportSchema = new Schema<EvaluationReportDocument>({
  submissionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  problemId: { type: String, required: true, index: true },
  verdict: { type: String, required: true },
  pipelineStatus: { type: String, required: true },
  summary: { type: String, required: true },
  aiAnalysis: {
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'SKIPPED'],
      default: 'PENDING'
    },
    mode: {
      type: String,
      enum: ['OPTIMIZATION', 'DIAGNOSTIC'],
      default: 'OPTIMIZATION'
    },
    codeSummary: { type: String, default: '' },
    theoreticalComplexity: {
      timeComplexity: { type: String, default: '' },
      spaceComplexity: { type: String, default: '' },
      explanation: { type: String, default: '' }
    },
    codeQuality: {
      score: { type: Number, default: 5 },
      readabilityAnalysis: { type: String, default: '' },
      codeSmells: [{ type: String }],
      positivePractices: [{ type: String }]
    },
    diagnosticFeedback: {
      rootCauseBug: { type: String },
      edgeCaseVulnerability: { type: String },
      socraticHint: { type: String }
    },
    optimizationSuggestions: [{
      title: { type: String },
      rationale: { type: String },
      expectedTimeImpact: { type: String },
      refactoredSnippet: { type: String }
    }],
    generatedAt: { type: String }
  },
  metrics: {
    rawTimeMs: { type: Number, default: 0 },
    normalizedTimeMs: { type: Number, default: 0 },
    rawMemoryKb: { type: Number, default: 0 },
    normalizedMemoryKb: { type: Number, default: 0 },
    compositeScore: { type: Number, default: 0 },
    percentileTime: { type: Number, default: 0 },
    percentileMemory: { type: Number, default: 0 }
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

export const EvaluationReportModel = mongoose.model<EvaluationReportDocument>(
  'EvaluationReport',
  EvaluationReportSchema
);
