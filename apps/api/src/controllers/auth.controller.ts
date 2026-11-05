import { Request, Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { pgPool } from '../config/db.js';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  createSuccessResponse,
  createErrorResponse,
  User,
  UserProfile
} from '@aica/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_access_key_min_32_characters_for_security_2026';
const JWT_EXPIRES_IN = '15m';

function signToken(user: Partial<User>): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function register(req: Request, res: Response): Promise<void> {
  const parseResult = RegisterRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(422).json(
      createErrorResponse('VALIDATION_ERROR', 'Invalid registration parameters', [
        { field: 'form', issue: parseResult.error.errors.map((e) => e.message).join(', ') }
      ])
    );
    return;
  }

  const { email, username, password } = parseResult.data;

  try {
    // 1. Check for duplicate email or username in PostgreSQL
    const existing = await pgPool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1',
      [email, username]
    );

    if (existing.rows.length > 0) {
      res.status(409).json(createErrorResponse('CONFLICT', 'Email or username already taken'));
      return;
    }

    // 2. Hash password with Argon2id
    const passwordHash = await argon2.hash(password);

    // 3. Insert user into PostgreSQL transaction
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const userRes = await client.query(
        `INSERT INTO users (email, username, password_hash, role, status)
         VALUES ($1, $2, $3, 'STUDENT', 'ACTIVE')
         RETURNING id, email, username, role, status, created_at, updated_at`,
        [email, username, passwordHash]
      );

      const newUser: User = userRes.rows[0];

      // Create default user profile
      await client.query(
        `INSERT INTO user_profiles (user_id, total_submissions, problems_solved, current_streak)
         VALUES ($1, 0, 0, 0)`,
        [newUser.id]
      );

      await client.query('COMMIT');

      const token = signToken(newUser);

      res.status(201).json(
        createSuccessResponse(
          {
            user: newUser,
            accessToken: token
          },
          'Registration successful'
        )
      );
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[AuthController] Register error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to register account'));
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const parseResult = LoginRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid credentials provided'));
    return;
  }

  const { email, password } = parseResult.data;

  try {
    const userRes = await pgPool.query(
      `SELECT id, email, username, password_hash, role, status, created_at, updated_at
       FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (userRes.rows.length === 0) {
      res.status(401).json(createErrorResponse('INVALID_CREDENTIALS', 'Invalid email or password'));
      return;
    }

    const row = userRes.rows[0];

    if (row.status !== 'ACTIVE') {
      res.status(403).json(createErrorResponse('ACCOUNT_SUSPENDED', 'Account is suspended or pending verification'));
      return;
    }

    const isMatch = await argon2.verify(row.password_hash, password);
    if (!isMatch) {
      res.status(401).json(createErrorResponse('INVALID_CREDENTIALS', 'Invalid email or password'));
      return;
    }

    const user: User = {
      id: row.id,
      email: row.email,
      username: row.username,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    const token = signToken(user);

    res.status(200).json(
      createSuccessResponse({
        user,
        accessToken: token
      })
    );
  } catch (err: any) {
    console.error('[AuthController] Login error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to authenticate user'));
  }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Not authenticated'));
    return;
  }

  try {
    const userRes = await pgPool.query(
      `SELECT u.id, u.email, u.username, u.role, u.status, u.created_at, u.updated_at,
              p.full_name, p.github_handle, p.bio, p.avatar_url, p.total_submissions,
              p.problems_solved, p.current_streak, p.last_active_at
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = $1 LIMIT 1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'User profile not found'));
      return;
    }

    const row = userRes.rows[0];
    const user: User = {
      id: row.id,
      email: row.email,
      username: row.username,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    const profile: UserProfile = {
      userId: row.id,
      fullName: row.full_name,
      githubHandle: row.github_handle,
      bio: row.bio,
      avatarUrl: row.avatar_url,
      totalSubmissions: row.total_submissions || 0,
      problemsSolved: row.problems_solved || 0,
      currentStreak: row.current_streak || 0,
      lastActiveAt: row.last_active_at || row.created_at
    };

    res.status(200).json(createSuccessResponse({ user, profile }));
  } catch (err: any) {
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to fetch user profile'));
  }
}
