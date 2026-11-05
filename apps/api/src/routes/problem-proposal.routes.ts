import { Router } from 'express';
import {
  createProposal,
  getProposalById,
  clarifyProposal,
  listAdminProposals,
  approveProposal,
  rejectProposal
} from '../controllers/problem-proposal.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Student / User Proposal Routes
router.post('/', authenticateToken, createProposal);
router.get('/:id', authenticateToken, getProposalById);
router.post('/:id/clarify', authenticateToken, clarifyProposal);

// Admin Moderation & Approval Routes
router.get('/admin/all', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), listAdminProposals);
router.patch('/admin/:id/approve', authenticateToken, requireRole('ADMIN'), approveProposal);
router.patch('/admin/:id/reject', authenticateToken, requireRole('ADMIN'), rejectProposal);

export default router;
