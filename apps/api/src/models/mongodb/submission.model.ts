import mongoose, { Schema, Document } from 'mongoose';
import { Submission, TestResultItem } from '@aica/shared';

export interface SubmissionDocument extends Omit<Submission, 'id'>, Document {}

const TestResultSchema = new Schema<TestResultItem>({
  testCaseId: { type: String, required: true },
  index: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  isPublic: { type: Boolean, required: true },
  actualOutput: { type: String },
  expectedOutput: { type: String },
  executionTimeMs: { type: Number, default: 0 },
  memoryKb: { type: Number, default: 0 },
  errorMessage: { type: String }
}, { _id: false });

const SubmissionSchema = new Schema<SubmissionDocument>({
  userId: { type: String, required: true, index: true }, // PostgreSQL UUID
  username: { type: String, required: true, index: true }, // Denormalized
  problemId: { type: String, required: true, index: true },
  language: {
    type: String,
    enum: ['python', 'javascript', 'cpp', 'java'],
    required: true
  },
  languageId: { type: Number, required: true },
  code: { type: String, required: true },
  codeLength: { type: Number, required: true },
  isTestRun: { type: Boolean, default: false },
  pipelineStatus: {
    type: String,
    enum: ['QUEUED', 'COMPILING', 'EXECUTING', 'ANALYZING_AI', 'COMPLETED', 'FAILED'],
    default: 'QUEUED',
    index: true
  },
  verdict: {
    type: String,
    enum: [
      'PENDING',
      'ACCEPTED',
      'WRONG_ANSWER',
      'TIME_LIMIT_EXCEEDED',
      'MEMORY_LIMIT_EXCEEDED',
      'COMPILATION_ERROR',
      'RUNTIME_ERROR',
      'INTERNAL_ERROR'
    ],
    default: 'PENDING',
    index: true
  },
  executionTimeMs: { type: Number, default: 0 },
  memoryUsedKb: { type: Number, default: 0 },
  normalizedTimeMs: { type: Number, default: 0 },
  compositeScore: { type: Number, default: 0.0, index: true },
  compileOutput: { type: String, default: '' },
  testCasesTotal: { type: Number, default: 0 },
  testCasesPassed: { type: Number, default: 0 },
  testResults: [TestResultSchema],
  evaluationReportId: { type: String },
  aiStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'SKIPPED'],
    default: 'PENDING',
    index: true
  },
  aiError: { type: String, default: '' }
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

SubmissionSchema.index({ problemId: 1, verdict: 1, compositeScore: -1 });

export const SubmissionModel = mongoose.model<SubmissionDocument>('Submission', SubmissionSchema);
