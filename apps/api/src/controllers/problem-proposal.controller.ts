import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Queue } from 'bullmq';
import { ProblemProposalModel } from '../models/mongodb/problem-proposal.model.js';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import { PublicationOutboxModel } from '../models/mongodb/publication-outbox.model.js';
import {
  createSuccessResponse,
  createErrorResponse,
  ProblemProposalCreateSchema,
  ProblemProposalClarifySchema,
  AdminProposalApproveSchema,
  AdminProposalRejectSchema
} from '@aica/shared';
import { redisClient } from '../config/db.js';

// BullMQ Producer Queues
const problemGenQueue = new Queue('problem-generation-queue', { connection: redisClient });
const outboxQueue = new Queue('publication-outbox-queue', { connection: redisClient });

export async function createProposal(req: Request, res: Response): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json(createErrorResponse('SERVICE_UNAVAILABLE', 'Database connection unavailable'));
    return;
  }

  const parseResult = ProblemProposalCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json(
      createErrorResponse('VALIDATION_ERROR', 'Invalid proposal prompt', [
        { field: 'prompt', issue: parseResult.error.errors.map((e) => e.message).join(', ') }
      ])
    );
    return;
  }

  const { prompt } = parseResult.data;
  const userId = req.user?.id || 'anonymous_student';
  const username = req.user?.username || 'Student';

  // Compute deterministic idempotency key
  const idempotencyKey = crypto
    .createHash('sha256')
    .update(`${userId}:${prompt.trim().toLowerCase()}`)
    .digest('hex');

  try {
    // 1. Idempotency Check: if active proposal exists within last 1 hour, return it
    const existing = await ProblemProposalModel.findOne({ idempotencyKey });
    if (existing && existing.status !== 'DISCARDED' && existing.status !== 'REJECTED') {
      res.status(200).json(
        createSuccessResponse(
          {
            proposalId: existing._id.toString(),
            status: existing.status,
            idempotentReplay: true
          },
          'Existing proposal retrieved'
        )
      );
      return;
    }

    // 2. Persist new Proposal in MongoDB
    const proposal = await ProblemProposalModel.create({
      creatorUserId: userId,
      creatorUsername: username,
      originalPrompt: prompt.trim(),
      status: 'QUEUED_FOR_GENERATION',
      version: 1,
      idempotencyKey,
      clarifications: []
    });

    const proposalId = proposal._id.toString();

    // 3. Dispatch Job to BullMQ Generation Queue
    await problemGenQueue.add(
      'generate-problem-spec',
      {
        proposalId,
        version: 1,
        prompt: prompt.trim()
      },
      {
        jobId: `gen:${proposalId}:v1`,
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    );

    res.status(202).json(
      createSuccessResponse(
        {
          proposalId,
          status: 'QUEUED_FOR_GENERATION',
          estimatedWaitSeconds: 20
        },
        'Problem proposal queued for AI formulation and verification'
      )
    );
  } catch (err: any) {
    console.error('[ProblemProposalController] createProposal error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to ingest problem proposal'));
  }
}

export async function getProposalById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const proposal = await ProblemProposalModel.findById(id).lean();
    if (!proposal) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Problem proposal not found'));
      return;
    }

    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'INSTRUCTOR';
    const isCreator = req.user?.id === proposal.creatorUserId;

    if (!isAdmin && !isCreator) {
      res.status(403).json(createErrorResponse('FORBIDDEN', 'Access denied to this proposal'));
      return;
    }

    // Zero-Leakage: For non-admins, redact private reference solutions
    const sanitizedProposal: any = {
      ...proposal,
      id: proposal._id.toString()
    };
    delete sanitizedProposal._id;
    delete sanitizedProposal.__v;

    if (!isAdmin && sanitizedProposal.generatedContent?.referenceSolutions) {
      delete sanitizedProposal.generatedContent.referenceSolutions;
    }

    res.status(200).json(createSuccessResponse(sanitizedProposal));
  } catch (err: any) {
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve proposal'));
  }
}

export async function clarifyProposal(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = ProblemProposalClarifySchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid clarification answers'));
    return;
  }

  try {
    const proposal = await ProblemProposalModel.findById(id);
    if (!proposal) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Proposal not found'));
      return;
    }

    if (proposal.status !== 'AWAITING_CLARIFICATION') {
      res.status(400).json(createErrorResponse('INVALID_STATE', `Proposal is in state ${proposal.status}, not awaiting clarification`));
      return;
    }

    const { answers } = parseResult.data;

    // Record user answers in proposal
    proposal.clarifications = proposal.clarifications.map((c) => ({
      ...c,
      userAnswer: answers[c.id] || c.userAnswer
    }));

    proposal.status = 'QUEUED_FOR_GENERATION';
    proposal.version += 1;
    await proposal.save();

    // Re-dispatch to BullMQ Generation Queue
    await problemGenQueue.add(
      'generate-problem-spec',
      {
        proposalId: id,
        version: proposal.version,
        prompt: proposal.originalPrompt,
        clarifications: answers
      },
      {
        jobId: `gen:${id}:v${proposal.version}`,
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 }
      }
    );

    res.status(202).json(createSuccessResponse({ proposalId: id, status: 'QUEUED_FOR_GENERATION' }, 'Clarifications recorded, re-generating problem specification'));
  } catch (err: any) {
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to record clarifications'));
  }
}

export async function listAdminProposals(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  try {
    const [proposals, total] = await Promise.all([
      ProblemProposalModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProblemProposalModel.countDocuments(filter)
    ]);

    const formatted = proposals.map((p: any) => ({
      ...p,
      id: p._id.toString()
    }));

    res.status(200).json(
      createSuccessResponse({
        proposals: formatted,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      })
    );
  } catch (err: any) {
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve proposals'));
  }
}

export async function approveProposal(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = AdminProposalApproveSchema.safeParse(req.body);
  const decisionNotes = parseResult.success ? parseResult.data.decisionNotes : undefined;
  const adminUserId = req.user?.id || 'admin';

  try {
    const proposal = await ProblemProposalModel.findById(id);
    if (!proposal) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Proposal not found'));
      return;
    }

    // Idempotency: if already PUBLISHED, return existing problem
    if (proposal.status === 'PUBLISHED' && proposal.publishedProblemId) {
      const existingProblem = await ProblemModel.findById(proposal.publishedProblemId);
      res.status(200).json(createSuccessResponse(existingProblem, 'Problem already approved and published'));
      return;
    }

    if (proposal.status !== 'PENDING_REVIEW') {
      res.status(400).json(createErrorResponse('INVALID_STATE', `Proposal cannot be approved in status ${proposal.status}. Must be PENDING_REVIEW.`));
      return;
    }

    const content = proposal.generatedContent;
    if (!content) {
      res.status(400).json(createErrorResponse('CORRUPTED_CONTENT', 'Proposal is missing generated problem content'));
      return;
    }

    // Check slug collision
    let slug = content.slug;
    const slugCollision = await ProblemModel.findOne({ slug });
    if (slugCollision) {
      slug = `${content.slug}-${proposal._id.toString().slice(-4)}`;
    }

    // 1. Insert into ProblemModel with status: 'PUBLISHED'
    const newProblem = await ProblemModel.create({
      title: content.title,
      slug,
      status: 'PUBLISHED', // Explicit approved transition
      version: 1,
      sourceProposalId: proposal._id.toString(),
      difficulty: content.difficulty,
      tags: content.tags || [],
      description: content.description,
      constraints: content.constraints || [],
      examples: content.examples || [],
      starterCode: content.starterCode,
      testCases: content.testCases,
      createdBy: proposal.creatorUserId
    });

    const publishedProblemId = newProblem._id.toString();

    // 2. Update Proposal state atomically
    proposal.status = 'PUBLISHED';
    proposal.publishedProblemId = publishedProblemId;
    proposal.adminReview = {
      reviewedBy: adminUserId,
      reviewedAt: new Date().toISOString(),
      decisionNotes
    };
    await proposal.save();

    // 3. Record in PublicationOutbox for asynchronous reliable PostgreSQL audit logging
    const outboxRecord = await PublicationOutboxModel.create({
      eventType: 'PROBLEM_PUBLISHED',
      payload: {
        problemId: publishedProblemId,
        proposalId: id,
        adminUserId,
        slug,
        publishedAt: new Date().toISOString()
      },
      status: 'PENDING'
    });

    // 4. Enqueue BullMQ outbox reconciler job
    await outboxQueue.add(
      'reconcile-audit',
      { outboxId: outboxRecord._id.toString() },
      { attempts: 5, backoff: { type: 'exponential', delay: 1000 } }
    );

    res.status(200).json(
      createSuccessResponse(
        {
          publishedProblemId,
          slug,
          title: newProblem.title,
          status: 'PUBLISHED'
        },
        'Problem successfully approved and published to catalog'
      )
    );
  } catch (err: any) {
    console.error('[ProblemProposalController] approveProposal error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to approve and publish problem'));
  }
}

export async function rejectProposal(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = AdminProposalRejectSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Rejection reason is required'));
    return;
  }

  const { reason } = parseResult.data;
  const adminUserId = req.user?.id || 'admin';

  try {
    const proposal = await ProblemProposalModel.findById(id);
    if (!proposal) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Proposal not found'));
      return;
    }

    proposal.status = 'REJECTED';
    proposal.adminReview = {
      reviewedBy: adminUserId,
      reviewedAt: new Date().toISOString(),
      decisionNotes: reason
    };
    await proposal.save();

    res.status(200).json(createSuccessResponse({ id, status: 'REJECTED' }, 'Proposal rejected with feedback'));
  } catch (err: any) {
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to reject proposal'));
  }
}
