import mongoose, { Schema, Document } from 'mongoose';

export interface PublicationOutboxDocument extends Document {
  eventType: string;
  payload: {
    problemId: string;
    proposalId: string;
    adminUserId: string;
    slug: string;
    publishedAt: string;
  };
  status: 'PENDING' | 'DISPATCHED' | 'FAILED';
  retryCount: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PublicationOutboxSchema = new Schema<PublicationOutboxDocument>({
  eventType: { type: String, required: true, default: 'PROBLEM_PUBLISHED' },
  payload: {
    problemId: { type: String, required: true },
    proposalId: { type: String, required: true },
    adminUserId: { type: String, required: true },
    slug: { type: String, required: true },
    publishedAt: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['PENDING', 'DISPATCHED', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  retryCount: { type: Number, default: 0 },
  lastError: { type: String }
}, {
  timestamps: true
});

PublicationOutboxSchema.index({ status: 1, createdAt: 1 });

export const PublicationOutboxModel = mongoose.model<PublicationOutboxDocument>(
  'PublicationOutbox',
  PublicationOutboxSchema
);
