import mongoose, { Schema, Document } from 'mongoose';
import { ProblemProposal, ProposalStatus } from '@aica/shared';

export interface ProblemProposalDocument extends Omit<ProblemProposal, 'id'>, Document {}

const ProblemProposalSchema = new Schema<ProblemProposalDocument>({
  creatorUserId: { type: String, required: true, index: true },
  creatorUsername: { type: String, required: true },
  originalPrompt: { type: String, required: true },
  status: {
    type: String,
    enum: [
      'DRAFT',
      'QUEUED_FOR_GENERATION',
      'AI_ANALYZING',
      'AWAITING_CLARIFICATION',
      'GENERATED',
      'QUEUED_FOR_VALIDATION',
      'VALIDATING',
      'VALIDATION_FAILED',
      'PENDING_REVIEW',
      'PUBLISHED',
      'REJECTED',
      'DISCARDED'
    ],
    default: 'DRAFT',
    required: true,
    index: true
  },
  version: { type: Number, default: 1, required: true },
  idempotencyKey: { type: String, unique: true, required: true, index: true },
  clarifications: [{
    id: { type: String, required: true },
    question: { type: String, required: true },
    options: [{ type: String }],
    userAnswer: { type: String }
  }],
  generatedContent: {
    type: Schema.Types.Mixed,
    default: undefined
  },
  validationReport: {
    type: Schema.Types.Mixed,
    default: undefined
  },
  adminReview: {
    reviewedBy: { type: String },
    reviewedAt: { type: String },
    decisionNotes: { type: String }
  },
  publishedProblemId: { type: String, sparse: true, index: true }
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

// Index for admin listing
ProblemProposalSchema.index({ status: 1, createdAt: -1 });

export const ProblemProposalModel = mongoose.model<ProblemProposalDocument>(
  'ProblemProposal',
  ProblemProposalSchema
);
