import { Request, Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { pgPool } from '../config/db.js';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  GoogleAuthRequestSchema,
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
    const isConnErr = err.code === 'ECONNREFUSED' || err.message?.includes('connect') || err.message?.includes('timeout');
    res.status(isConnErr ? 503 : 500).json(
      createErrorResponse(
        isConnErr ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR',
        isConnErr ? 'PostgreSQL database connection failed. Please verify DATABASE_URL in environment settings.' : 'Failed to register account',
        [{ issue: err.message }]
      )
    );
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
    const isConnErr = err.code === 'ECONNREFUSED' || err.message?.includes('connect') || err.message?.includes('timeout');
    res.status(isConnErr ? 503 : 500).json(
      createErrorResponse(
        isConnErr ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR',
        isConnErr ? 'PostgreSQL database connection failed. Please verify DATABASE_URL in environment settings.' : 'Failed to authenticate user',
        [{ issue: err.message }]
      )
    );
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

export async function googleAuth(req: Request, res: Response): Promise<void> {
  const parseResult = GoogleAuthRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json(
      createErrorResponse('VALIDATION_ERROR', 'Invalid Google authentication parameters', [
        { field: 'credential', issue: 'Google credential token is required' }
      ])
    );
    return;
  }

  const { credential } = parseResult.data;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClient = new OAuth2Client(googleClientId);

  let googleUser: {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
    email_verified?: boolean;
  } | null = null;

  try {
    // Attempt cryptographic verification with Google's public keys
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId || undefined
    });
    const payload = ticket.getPayload();
    if (payload && payload.sub && payload.email) {
      googleUser = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified
      };
    }
  } catch (verifyErr: any) {
    // Fallback for non-production environments / development testing
    if (process.env.NODE_ENV !== 'production' && credential.startsWith('dev-mock-google-')) {
      const mockEmail = credential.replace('dev-mock-google-', '').trim() || 'demo.google@aica.lab';
      googleUser = {
        sub: `dev-sub-${Buffer.from(mockEmail).toString('hex').slice(0, 16)}`,
        email: mockEmail,
        name: mockEmail.split('@')[0],
        picture: `https://api.dicebear.com/7.x/identicon/svg?seed=${mockEmail}`,
        email_verified: true
      };
    } else {
      console.error('[AuthController] Google token verification failed:', verifyErr.message);
      res.status(401).json(createErrorResponse('INVALID_CREDENTIALS', 'Invalid or expired Google credential token'));
      return;
    }
  }

  if (!googleUser || !googleUser.email) {
    res.status(400).json(createErrorResponse('INVALID_CREDENTIALS', 'Unable to extract valid user details from Google token'));
    return;
  }

  const { email, sub: googleId, name, picture } = googleUser;

  try {
    // 1. Check if user already exists by google_id OR email
    const existingUserRes = await pgPool.query(
      `SELECT id, email, username, role, status, auth_provider, google_id, created_at, updated_at
       FROM users
       WHERE google_id = $1 OR email = $2
       LIMIT 1`,
      [googleId, email]
    );

    let user: User;

    if (existingUserRes.rows.length > 0) {
      const row = existingUserRes.rows[0];

      if (row.status !== 'ACTIVE') {
        res.status(403).json(createErrorResponse('ACCOUNT_SUSPENDED', 'Account is suspended or pending verification'));
        return;
      }

      // Link google_id if not already set
      if (!row.google_id || row.google_id !== googleId) {
        await pgPool.query(
          `UPDATE users SET google_id = $1, auth_provider = 'google', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [googleId, row.id]
        );
      }

      // Update avatar or name in user_profiles if missing
      if (picture || name) {
        await pgPool.query(
          `UPDATE user_profiles
           SET avatar_url = COALESCE(avatar_url, $1),
               full_name = COALESCE(full_name, $2)
           WHERE user_id = $3`,
          [picture || null, name || null, row.id]
        );
      }

      user = {
        id: row.id,
        email: row.email,
        username: row.username,
        role: row.role,
        status: row.status,
        authProvider: 'google',
        googleId,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } else {
      // 2. Register new user with Google identity
      const baseName = (name || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .slice(0, 20) || 'student';

      let candidateUsername = baseName;
      const usernameCheck = await pgPool.query(
        'SELECT id FROM users WHERE username = $1 LIMIT 1',
        [candidateUsername]
      );

      if (usernameCheck.rows.length > 0) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        candidateUsername = `${baseName.slice(0, 15)}_${randomSuffix}`;
      }

      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');

        const insertRes = await client.query(
          `INSERT INTO users (email, username, password_hash, role, status, auth_provider, google_id)
           VALUES ($1, $2, NULL, 'STUDENT', 'ACTIVE', 'google', $3)
           RETURNING id, email, username, role, status, auth_provider, google_id, created_at, updated_at`,
          [email, candidateUsername, googleId]
        );

        user = {
          id: insertRes.rows[0].id,
          email: insertRes.rows[0].email,
          username: insertRes.rows[0].username,
          role: insertRes.rows[0].role,
          status: insertRes.rows[0].status,
          authProvider: insertRes.rows[0].auth_provider,
          googleId: insertRes.rows[0].google_id,
          createdAt: insertRes.rows[0].created_at,
          updatedAt: insertRes.rows[0].updated_at
        };

        // Initialize user profile
        await client.query(
          `INSERT INTO user_profiles (user_id, full_name, avatar_url, total_submissions, problems_solved, current_streak)
           VALUES ($1, $2, $3, 0, 0, 0)`,
          [user.id, name || null, picture || null]
        );

        await client.query('COMMIT');
      } catch (txErr: any) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }
    }

    // 3. Fetch latest profile
    const profileRes = await pgPool.query(
      `SELECT full_name, github_handle, bio, avatar_url, total_submissions, problems_solved, current_streak, last_active_at
       FROM user_profiles WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );

    const profileRow = profileRes.rows[0];
    const profile: UserProfile = {
      userId: user.id,
      fullName: profileRow?.full_name,
      githubHandle: profileRow?.github_handle,
      bio: profileRow?.bio,
      avatarUrl: profileRow?.avatar_url,
      totalSubmissions: profileRow?.total_submissions || 0,
      problemsSolved: profileRow?.problems_solved || 0,
      currentStreak: profileRow?.current_streak || 0,
      lastActiveAt: profileRow?.last_active_at || user.createdAt
    };

    const token = signToken(user);

    res.status(200).json(
      createSuccessResponse(
        {
          user,
          profile,
          accessToken: token
        },
        'Google authentication successful'
      )
    );
  } catch (err: any) {
    console.error('[AuthController] Google auth error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to authenticate with Google'));
  }
}

