import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import {
  ProblemCreateSchema,
  ProblemUpdateSchema,
  ProblemQuerySchema,
  ProblemListItem,
  SupportedLanguage
} from '../packages/shared/dist/index.js';
import {
  getProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  getAdminProblems,
  getAdminProblemById
} from '../apps/api/src/controllers/problem.controller.js';
import { ProblemModel } from '../apps/api/src/models/mongodb/problem.model.js';
import { authenticateToken, requireRole, optionalAuth } from '../apps/api/src/middleware/auth.middleware.js';

const JWT_SECRET = 'super_secret_jwt_access_key_min_32_characters_for_security_2026';

function generateTestToken(user: { id: string; email: string; username: string; role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

function mockReqRes(options: {
  query?: Record<string, any>;
  params?: Record<string, any>;
  body?: any;
  user?: any;
  headers?: Record<string, string>;
}) {
  const req: any = {
    query: options.query || {},
    params: options.params || {},
    body: options.body || {},
    user: options.user,
    headers: options.headers || {}
  };

  const res: any = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.data = payload;
      return this;
    },
    setHeader(name: string, val: string) {
      this.headers[name] = val;
      return this;
    }
  };

  return { req, res };
}

describe('Phase 3: Problem Catalog, Discovery & Problem Management Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Simulate active MongoDB connection on the exact mongoose instance used by ProblemModel and ProblemController
    vi.spyOn(ProblemModel.base.connection, 'readyState', 'get').mockReturnValue(1);
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Schema Validation (ProblemCreateSchema, ProblemUpdateSchema, ProblemQuerySchema)
  // =========================================================================
  describe('1. Shared Schemas Validation', () => {
    it('ProblemUpdateSchema: strictly rejects empty update objects ({})', () => {
      const result = ProblemUpdateSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('At least one field must be provided');
      }
    });

    it('ProblemUpdateSchema: accepts valid partial updates', () => {
      const result = ProblemUpdateSchema.safeParse({
        title: 'Updated Title',
        difficulty: 'HARD'
      });
      expect(result.success).toBe(true);
    });

    it('ProblemQuerySchema: accepts valid query options and defaults page and limit', () => {
      const result = ProblemQuerySchema.safeParse({
        difficulty: 'MEDIUM',
        sortBy: 'difficulty_asc',
        search: 'binary'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe('difficulty_asc');
      }
    });

    it('ProblemQuerySchema: rejects invalid sortBy option (e.g. unverified acceptance_rate)', () => {
      const result = ProblemQuerySchema.safeParse({
        sortBy: 'acceptance_rate'
      });
      expect(result.success).toBe(false);
    });

    it('ProblemCreateSchema: rejects invalid slug with spaces or uppercase', () => {
      const result = ProblemCreateSchema.safeParse({
        title: 'Valid Title',
        slug: 'Invalid Slug!',
        description: 'A problem description with enough characters for test.',
        difficulty: 'EASY',
        tags: ['Arrays'],
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
        starterCode: { python: 'def solve(): pass' },
        examples: [{ input: '1', output: '2' }],
        testCases: [{ input: '1', expectedOutput: '2', isPublic: true }]
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes('slug'))).toBe(true);
      }
    });
  });

  // =========================================================================
  // 2. Problem Discovery: Search, Filter, Sort ($or across title and description)
  // =========================================================================
  describe('2. Problem Discovery & Catalog API (getProblems)', () => {
    it('searches across both title and description using $or regex', async () => {
      let capturedFilter: any = null;
      let capturedSort: any = null;

      vi.spyOn(ProblemModel, 'find').mockImplementation((filter: any) => {
        capturedFilter = filter;
        return {
          select: () => ({
            skip: () => ({
              limit: () => ({
                sort: (sortOption: any) => {
                  capturedSort = sortOption;
                  return {
                    lean: () => Promise.resolve([
                      {
                        _id: new mongoose.Types.ObjectId(),
                        title: 'Binary Search Implementation',
                        slug: 'binary-search-implementation',
                        difficulty: 'EASY',
                        tags: ['Binary Search'],
                        totalSubmissions: 10,
                        acceptedSubmissions: 8
                      }
                    ])
                  };
                }
              })
            })
          })
        } as any;
      });

      vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(1 as any);

      const { req, res } = mockReqRes({
        query: { search: 'Binary Search', sortBy: 'difficulty_asc' }
      });

      await getProblems(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.problems).toHaveLength(1);

      // Verify $or filter on title and description
      expect(capturedFilter.$or).toBeDefined();
      expect(capturedFilter.$or).toHaveLength(2);
      expect(capturedFilter.$or[0].title).toEqual({ $regex: 'Binary Search', $options: 'i' });
      expect(capturedFilter.$or[1].description).toEqual({ $regex: 'Binary Search', $options: 'i' });

      // Verify sort mapping
      expect(capturedSort).toEqual({ difficulty: 1, createdAt: -1 });
    });

    it('correctly maps all sort options', async () => {
      const sortMappings: Record<string, any> = {
        difficulty_asc: { difficulty: 1, createdAt: -1 },
        difficulty_desc: { difficulty: -1, createdAt: -1 },
        title_asc: { title: 1 },
        latest: { createdAt: -1 }
      };

      for (const [sortBy, expectedSort] of Object.entries(sortMappings)) {
        let capturedSort: any = null;

        vi.spyOn(ProblemModel, 'find').mockImplementation(() => {
          return {
            select: () => ({
              skip: () => ({
                limit: () => ({
                  sort: (sortOption: any) => {
                    capturedSort = sortOption;
                    return {
                      lean: () => Promise.resolve([])
                    };
                  }
                })
              })
            })
          } as any;
        });

        vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(0 as any);

        const { req, res } = mockReqRes({ query: { sortBy } });
        await getProblems(req, res);

        expect(res.statusCode).toBe(200);
        expect(capturedSort).toEqual(expectedSort);
      }
    });

    it('strictly serves only PUBLISHED problems to general students', async () => {
      let capturedFilter: any = null;

      vi.spyOn(ProblemModel, 'find').mockImplementation((filter: any) => {
        capturedFilter = filter;
        return {
          select: () => ({
            skip: () => ({
              limit: () => ({
                sort: () => ({
                  lean: () => Promise.resolve([])
                })
              })
            })
          })
        } as any;
      });

      vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(0 as any);

      const { req, res } = mockReqRes({});
      await getProblems(req, res);

      expect(capturedFilter.status).toEqual({ $in: ['PUBLISHED', null] });
    });
  });

  // =========================================================================
  // 3. Problem Creation & Backend Pre-Publish Validation
  // =========================================================================
  describe('3. Problem Creation & Backend Pre-Publish Validation (createProblem)', () => {
    it('rejects publishing a problem (status: PUBLISHED) if hidden test cases are missing (422)', async () => {
      vi.spyOn(ProblemModel, 'findOne').mockResolvedValue(null);

      const { req, res } = mockReqRes({
        user: { id: 'admin_1', role: 'ADMIN' },
        body: {
          title: 'Two Sum Problem',
          slug: 'two-sum-problem',
          description: 'Calculate two sum indices that add up to target integer.',
          difficulty: 'EASY',
          status: 'PUBLISHED',
          tags: ['Arrays'],
          timeLimitMs: 2000,
          memoryLimitKb: 262144,
          starterCode: { python: 'def twoSum(): pass' },
          examples: [{ input: '4\n2 7 11 15\n9', output: '0 1' }],
          // Only public test cases; zero hidden test cases!
          testCases: [
            { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isPublic: true },
            { input: '3\n3 2 4\n6', expectedOutput: '1 2', isPublic: true }
          ]
        }
      });

      await createProblem(req, res);

      expect(res.statusCode).toBe(422);
      expect(res.data.success).toBe(false);
      expect(res.data.error.message).toContain('at least 1 public test case and 1 hidden test case');
    });

    it('rejects publishing a problem if public test cases are missing (422)', async () => {
      vi.spyOn(ProblemModel, 'findOne').mockResolvedValue(null);

      const { req, res } = mockReqRes({
        user: { id: 'admin_1', role: 'ADMIN' },
        body: {
          title: 'Two Sum Problem',
          slug: 'two-sum-problem',
          description: 'Calculate two sum indices that add up to target integer.',
          difficulty: 'EASY',
          status: 'PUBLISHED',
          tags: ['Arrays'],
          timeLimitMs: 2000,
          memoryLimitKb: 262144,
          starterCode: { python: 'def twoSum(): pass' },
          examples: [{ input: '4\n2 7 11 15\n9', output: '0 1' }],
          // Only hidden test cases; zero public test cases!
          testCases: [
            { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isPublic: false }
          ]
        }
      });

      await createProblem(req, res);

      expect(res.statusCode).toBe(422);
      expect(res.data.success).toBe(false);
      expect(res.data.error.message).toContain('at least 1 public test case and 1 hidden test case');
    });

    it('generates unique backend test-case IDs if omitted by the user', async () => {
      vi.spyOn(ProblemModel, 'findOne').mockResolvedValue(null);

      let createdDoc: any = null;
      vi.spyOn(ProblemModel, 'create').mockImplementation((doc: any) => {
        createdDoc = doc;
        return Promise.resolve({ ...doc, _id: new mongoose.Types.ObjectId() }) as any;
      });

      const { req, res } = mockReqRes({
        user: { id: 'admin_1', role: 'ADMIN' },
        body: {
          title: 'Two Sum Problem',
          slug: 'two-sum-problem',
          description: 'Calculate two sum indices that add up to target integer.',
          difficulty: 'EASY',
          status: 'PUBLISHED',
          tags: ['Arrays'],
          timeLimitMs: 2000,
          memoryLimitKb: 262144,
          starterCode: { python: 'def twoSum(): pass' },
          examples: [{ input: '4\n2 7 11 15\n9', output: '0 1' }],
          testCases: [
            { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isPublic: true }, // no id!
            { input: '3\n3 2 4\n6', expectedOutput: '1 2', isPublic: false }     // no id!
          ]
        }
      });

      await createProblem(req, res);

      expect(res.statusCode).toBe(201);
      expect(createdDoc.testCases[0].id).toBeDefined();
      expect(createdDoc.testCases[0].id).toMatch(/^tc-\d+-1-/);
      expect(createdDoc.testCases[1].id).toBeDefined();
      expect(createdDoc.testCases[1].id).toMatch(/^tc-\d+-2-/);
    });

    it('rejects duplicate slug with 409 CONFLICT', async () => {
      vi.spyOn(ProblemModel, 'findOne').mockResolvedValue({ _id: 'existing_id', slug: 'existing-slug' } as any);

      const { req, res } = mockReqRes({
        user: { id: 'admin_1', role: 'ADMIN' },
        body: {
          title: 'Existing Problem',
          slug: 'existing-slug',
          description: 'Problem description that has plenty of characters.',
          difficulty: 'EASY',
          tags: ['Arrays'],
          timeLimitMs: 2000,
          memoryLimitKb: 262144,
          starterCode: { python: 'pass' },
          examples: [{ input: '1', output: '2' }],
          testCases: [{ input: '1', expectedOutput: '2', isPublic: true }]
        }
      });

      await createProblem(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.data.success).toBe(false);
      expect(res.data.error.code).toBe('CONFLICT');
    });
  });

  // =========================================================================
  // 4. Problem Updating & Backend Pre-Publish Validation
  // =========================================================================
  describe('4. Problem Updating (updateProblem)', () => {
    it('rejects empty update payload ({}) with 422 VALIDATION_ERROR', async () => {
      const { req, res } = mockReqRes({
        params: { id: 'problem_123' },
        user: { id: 'admin_1', role: 'ADMIN' },
        body: {}
      });

      await updateProblem(req, res);

      expect(res.statusCode).toBe(422);
      expect(res.data.success).toBe(false);
    });

    it('enforces pre-publish validation when updating status to PUBLISHED', async () => {
      const mockProblem = {
        _id: new mongoose.Types.ObjectId(),
        slug: 'draft-problem',
        status: 'UNPUBLISHED',
        testCases: [
          { id: 'tc-1', input: '1', expectedOutput: '2', isPublic: true }
          // No hidden test case in the database!
        ]
      };

      vi.spyOn(ProblemModel, 'findOne').mockResolvedValue(mockProblem as any);

      const { req, res } = mockReqRes({
        params: { id: mockProblem._id.toString() },
        user: { id: 'admin_1', role: 'ADMIN' },
        body: { status: 'PUBLISHED' }
      });

      await updateProblem(req, res);

      expect(res.statusCode).toBe(422);
      expect(res.data.error.message).toContain('at least 1 public test case and 1 hidden test case');
    });

    it('rejects slug update if another problem already uses that slug (409)', async () => {
      const currentProblem = {
        _id: new mongoose.Types.ObjectId(),
        slug: 'my-old-slug'
      };

      vi.spyOn(ProblemModel, 'findOne')
        .mockResolvedValueOnce(currentProblem as any) // findOne for target problem
        .mockResolvedValueOnce({ _id: new mongoose.Types.ObjectId(), slug: 'taken-slug' } as any); // findOne for collision check

      const { req, res } = mockReqRes({
        params: { id: currentProblem._id.toString() },
        user: { id: 'admin_1', role: 'ADMIN' },
        body: { slug: 'taken-slug' }
      });

      await updateProblem(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.data.error.code).toBe('CONFLICT');
    });
  });

  // =========================================================================
  // 5. Soft-Delete Archiving (Preserving Historical Submissions)
  // =========================================================================
  describe('5. Soft-Delete Archiving (deleteProblem)', () => {
    it('soft-deletes by setting status to ARCHIVED and preserves problem document', async () => {
      const problemId = new mongoose.Types.ObjectId();
      const mockProblem = {
        _id: problemId,
        slug: 'problem-to-archive',
        status: 'PUBLISHED'
      };

      vi.spyOn(ProblemModel, 'findOne').mockResolvedValue(mockProblem as any);
      let capturedUpdate: any = null;
      vi.spyOn(ProblemModel, 'findByIdAndUpdate').mockImplementation((_id: any, update: any) => {
        capturedUpdate = update;
        return Promise.resolve({ ...mockProblem, status: 'ARCHIVED' }) as any;
      });

      // Verify findByIdAndDelete is NEVER called
      const deleteSpy = vi.spyOn(ProblemModel, 'findByIdAndDelete' as any);

      const { req, res } = mockReqRes({
        params: { id: problemId.toString() },
        user: { id: 'admin_1', role: 'ADMIN' }
      });

      await deleteProblem(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.status).toBe('ARCHIVED');
      expect(capturedUpdate).toEqual({ $set: { status: 'ARCHIVED' } });
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 6. Test-Case Privacy: Student Sanitization vs Admin Inspection
  // =========================================================================
  describe('6. Test-Case Privacy & Sanitization', () => {
    const mockProblemDoc = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Secret Problem',
      slug: 'secret-problem',
      status: 'PUBLISHED',
      totalSubmissions: 5,
      acceptedSubmissions: 4,
      testCases: [
        { id: 'tc-pub-1', input: '1', expectedOutput: '2', explanation: 'Public', isPublic: true },
        { id: 'tc-hidden-1', input: '999999', expectedOutput: '1000000', explanation: 'Secret large scale', isPublic: false }
      ]
    };

    it('student getProblemById: strictly sanitizes and returns only public test cases', async () => {
      vi.spyOn(ProblemModel, 'findOne').mockReturnValue({
        lean: () => Promise.resolve(mockProblemDoc)
      } as any);

      const { req, res } = mockReqRes({
        params: { id: mockProblemDoc.slug },
        user: { id: 'student_1', role: 'STUDENT' }
      });

      await getProblemById(req, res);

      expect(res.statusCode).toBe(200);
      const returnedCases = res.data.data.testCases;
      expect(returnedCases).toHaveLength(1);
      expect(returnedCases[0].id).toBe('tc-pub-1');
      expect(returnedCases[0].isPublic).toBe(true);
      // Hidden test case must NEVER be exposed
      expect(returnedCases.some((tc: any) => tc.id === 'tc-hidden-1')).toBe(false);
      expect(returnedCases.some((tc: any) => tc.input === '999999')).toBe(false);
    });

    it('student cannot view UNPUBLISHED problems via getProblemById (returns 404)', async () => {
      vi.spyOn(ProblemModel, 'findOne').mockReturnValue({
        lean: () => Promise.resolve({ ...mockProblemDoc, status: 'UNPUBLISHED' })
      } as any);

      const { req, res } = mockReqRes({
        params: { id: mockProblemDoc.slug },
        user: { id: 'student_1', role: 'STUDENT' }
      });

      await getProblemById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.data.success).toBe(false);
    });

    it('staff (ADMIN/INSTRUCTOR) can preview UNPUBLISHED problems via getProblemById', async () => {
      vi.spyOn(ProblemModel, 'findOne').mockReturnValue({
        lean: () => Promise.resolve({ ...mockProblemDoc, status: 'UNPUBLISHED' })
      } as any);

      const { req, res } = mockReqRes({
        params: { id: mockProblemDoc.slug },
        user: { id: 'instructor_1', role: 'INSTRUCTOR' }
      });

      await getProblemById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('authorized staff getAdminProblemById: returns full problem including all hidden test cases', async () => {
      vi.spyOn(ProblemModel, 'findOne').mockReturnValue({
        lean: () => Promise.resolve(mockProblemDoc)
      } as any);

      const { req, res } = mockReqRes({
        params: { id: mockProblemDoc._id.toString() },
        user: { id: 'admin_1', role: 'ADMIN' }
      });

      await getAdminProblemById(req, res);

      expect(res.statusCode).toBe(200);
      const returnedCases = res.data.data.testCases;
      expect(returnedCases).toHaveLength(2);
      expect(returnedCases.some((tc: any) => tc.id === 'tc-hidden-1' && tc.isPublic === false)).toBe(true);
    });
  });

  // =========================================================================
  // 7. Role-Based Access Control Middleware (authenticateToken, requireRole)
  // =========================================================================
  describe('7. Consistent Role-Based Access Control', () => {
    it('authenticateToken: blocks request without token (401)', () => {
      const { req, res } = mockReqRes({ headers: {} });
      const next = vi.fn();

      authenticateToken(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.data.error.code).toBe('UNAUTHORIZED');
      expect(next).not.toHaveBeenCalled();
    });

    it('authenticateToken: blocks request with expired or invalid token (401)', () => {
      const { req, res } = mockReqRes({
        headers: { authorization: 'Bearer invalid_signature_token' }
      });
      const next = vi.fn();

      authenticateToken(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.data.error.code).toBe('TOKEN_EXPIRED_OR_INVALID');
      expect(next).not.toHaveBeenCalled();
    });

    it('authenticateToken: populates req.user on valid token and calls next()', () => {
      const validToken = generateTestToken({
        id: 'user_123',
        email: 'user@example.com',
        username: 'coder',
        role: 'STUDENT'
      });

      const { req, res } = mockReqRes({
        headers: { authorization: `Bearer ${validToken}` }
      });
      const next = vi.fn();

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user_123');
      expect(req.user.role).toBe('STUDENT');
    });

    it('requireRole: blocks STUDENT from ADMIN / INSTRUCTOR routes (403 FORBIDDEN)', () => {
      const { req, res } = mockReqRes({
        user: { id: 'student_1', role: 'STUDENT', username: 'student' }
      });
      const next = vi.fn();

      const middleware = requireRole('ADMIN', 'INSTRUCTOR');
      middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.data.error.code).toBe('FORBIDDEN');
      expect(next).not.toHaveBeenCalled();
    });

    it('requireRole: allows INSTRUCTOR through to management routes', () => {
      const { req, res } = mockReqRes({
        user: { id: 'inst_1', role: 'INSTRUCTOR', username: 'prof_smith' }
      });
      const next = vi.fn();

      const middleware = requireRole('ADMIN', 'INSTRUCTOR');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });

    it('requireRole: allows ADMIN through to management routes', () => {
      const { req, res } = mockReqRes({
        user: { id: 'admin_1', role: 'ADMIN', username: 'sysadmin' }
      });
      const next = vi.fn();

      const middleware = requireRole('ADMIN', 'INSTRUCTOR');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });
  });
});
