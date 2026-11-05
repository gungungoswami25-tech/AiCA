import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/db.js';
import { createErrorResponse, RATE_LIMIT_CONFIG } from '@aica/shared';

export function submissionRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const userId = req.user?.id || req.ip || 'anonymous';
  const key = `ratelimit:submissions:${userId}`;

  // Try Redis sliding window counter
  redisClient
    .multi()
    .incr(key)
    .expire(key, Math.ceil(RATE_LIMIT_CONFIG.WINDOW_MS / 1000))
    .exec()
    .then((results: any) => {
      if (!results) {
        next();
        return;
      }

      const count = results[0][1] as number;
      if (count > RATE_LIMIT_CONFIG.MAX_SUBMISSIONS_PER_MINUTE) {
        res.status(429).json(
          createErrorResponse(
            'RATE_LIMIT_EXCEEDED',
            `Too many submissions. Maximum ${RATE_LIMIT_CONFIG.MAX_SUBMISSIONS_PER_MINUTE} submissions per minute.`
          )
        );
        return;
      }

      next();
    })
    .catch(() => {
      // In case Redis is down during dev, don't block
      next();
    });
}
