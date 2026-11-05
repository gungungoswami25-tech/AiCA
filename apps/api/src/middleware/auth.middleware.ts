import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, createErrorResponse } from '@aica/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.query.token as string | undefined);

  if (!token) {
    res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication token required'));
    return;
  }

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_access_key_min_32_characters_for_security_2026';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      res.status(401).json(createErrorResponse('TOKEN_EXPIRED_OR_INVALID', 'Session expired or invalid'));
      return;
    }

    req.user = decoded as AuthenticatedUser;
    next();
  });
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

  if (token) {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_access_key_min_32_characters_for_security_2026';
    jwt.verify(token, secret, (_, decoded) => {
      if (decoded) {
        req.user = decoded as AuthenticatedUser;
      }
      next();
    });
  } else {
    next();
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json(createErrorResponse('FORBIDDEN', 'Insufficient permissions for this resource'));
      return;
    }

    next();
  };
}
