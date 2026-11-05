import { Request, Response } from 'express';
import { SubmissionModel } from '../models/mongodb/submission.model.js';
import { EvaluationReportModel } from '../models/mongodb/evaluation-report.model.js';
import { pgPool } from '../config/db.js';
import {
  createSuccessResponse,
  createErrorResponse,
  LeaderboardEntry,
  ProblemLeaderboardResponse,
  GlobalLeaderboardEntry,
  GlobalLeaderboardResponse
} from '@aica/shared';

export async function getProblemLeaderboard(req: Request, res: Response): Promise<void> {
  const { problemId } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 25));
  const skip = (page - 1) * limit;

  try {
    // Correctness Gate: ONLY ACCEPTED submissions are eligible for leaderboard ranking!
    const matchQuery = {
      problemId,
      verdict: 'ACCEPTED',
      isTestRun: false
    };

    // Deduplicate by userId: Each student appears at most once with their best composite score
    const pipeline: any[] = [
      { $match: matchQuery },
      { $sort: { compositeScore: -1, normalizedTimeMs: 1, memoryUsedKb: 1, createdAt: 1 } },
      {
        $group: {
          _id: '$userId',
          bestSubmission: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$bestSubmission' } },
      { $sort: { compositeScore: -1, normalizedTimeMs: 1, memoryUsedKb: 1, createdAt: 1 } },
      {
        $facet: {
          rankings: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const aggResult = await SubmissionModel.aggregate(pipeline);
    const submissions = aggResult[0]?.rankings || [];
    const totalRanked = aggResult[0]?.totalCount[0]?.count || 0;

    const rankings: LeaderboardEntry[] = await Promise.all(
      submissions.map(async (sub: any, index: number) => {
        // Fetch AI quality score from evaluation report if available
        let qualityScore = 7.5;
        const report = await EvaluationReportModel.findOne({ submissionId: sub._id.toString() }).lean();
        if (report && report.aiAnalysis?.codeQuality?.score) {
          qualityScore = report.aiAnalysis.codeQuality.score;
        }

        const timeScore = Math.max(0, 100 - sub.normalizedTimeMs);
        const memScore = Math.max(0, 100 - Math.round(sub.memoryUsedKb / 1024));
        const qualityPoints = qualityScore * 10;

        return {
          rank: skip + index + 1,
          userId: sub.userId,
          username: sub.username || 'Anonymous',
          submissionId: sub._id.toString(),
          language: sub.language,
          compositeScore: sub.compositeScore || 85.0,
          breakdown: {
            rawTimeMs: sub.executionTimeMs,
            normalizedTimeMs: sub.normalizedTimeMs,
            timeScore: Math.round(timeScore * 10) / 10,
            rawMemoryKb: sub.memoryUsedKb,
            normalizedMemoryKb: Math.max(1024, sub.memoryUsedKb - 12000),
            memoryScore: Math.round(memScore * 10) / 10,
            qualityScore,
            qualityPoints: Math.round(qualityPoints * 10) / 10,
            formula: '0.50 * Stime + 0.30 * Smem + 0.20 * Squality'
          },
          submittedAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : new Date().toISOString()
        };
      })
    );

    const responseData: ProblemLeaderboardResponse = {
      problemId: problemId as string,
      totalRanked,
      rankings
    };

    res.status(200).json(createSuccessResponse(responseData));
  } catch (err: any) {
    console.error('[LeaderboardController] getProblemLeaderboard error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve leaderboard'));
  }
}

export async function getGlobalLeaderboard(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 25));
  const skip = (page - 1) * limit;

  try {
    // 1. Aggregation pipeline across all problems
    // First, deduplicate each user's submissions per problem to retain only their best score
    const pipeline: any[] = [
      {
        $match: {
          verdict: 'ACCEPTED',
          isTestRun: false
        }
      },
      {
        $sort: { compositeScore: -1, normalizedTimeMs: 1, createdAt: 1 }
      },
      {
        $group: {
          _id: { userId: '$userId', problemId: '$problemId' },
          userId: { $first: '$userId' },
          username: { $first: '$username' },
          bestScore: { $first: '$compositeScore' },
          bestTimeMs: { $first: '$executionTimeMs' },
          submittedAt: { $first: '$createdAt' }
        }
      },
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          problemsSolved: { $sum: 1 },
          totalScore: { $sum: '$bestScore' },
          avgRuntimeMs: { $avg: '$bestTimeMs' },
          lastActiveAt: { $max: '$submittedAt' }
        }
      },
      {
        $sort: { problemsSolved: -1, totalScore: -1, avgRuntimeMs: 1 }
      },
      {
        $facet: {
          rankings: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const aggResult = await SubmissionModel.aggregate(pipeline);
    const rankingsRaw = aggResult[0]?.rankings || [];
    const totalRanked = aggResult[0]?.totalCount[0]?.count || 0;

    // 2. Enrich with PostgreSQL avatar & streak data if available
    const userIds = rankingsRaw.map((r: any) => r._id);
    const profileMap = new Map<string, { avatarUrl?: string; streak: number }>();

    if (userIds.length > 0) {
      try {
        const pgRes = await pgPool.query(
          'SELECT user_id, avatar_url, current_streak FROM user_profiles WHERE user_id = ANY($1)',
          [userIds]
        );
        for (const row of pgRes.rows) {
          profileMap.set(row.user_id, {
            avatarUrl: row.avatar_url,
            streak: row.current_streak || 0
          });
        }
      } catch (pgErr: any) {
        // Fallback gracefully if PostgreSQL is unreachable or running mocked
      }
    }

    const formattedRankings: GlobalLeaderboardEntry[] = rankingsRaw.map((u: any, index: number) => {
      const p = profileMap.get(u._id);
      return {
        rank: skip + index + 1,
        userId: u._id,
        username: u.username || 'Anonymous',
        avatarUrl: p?.avatarUrl,
        problemsSolved: u.problemsSolved || 0,
        totalScore: Math.round((u.totalScore || 0) * 10) / 10,
        avgRuntimeMs: Math.round((u.avgRuntimeMs || 0) * 10) / 10,
        streak: p?.streak || 0,
        lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : undefined
      };
    });

    const responseData: GlobalLeaderboardResponse = {
      totalRanked,
      page,
      limit,
      rankings: formattedRankings
    };

    res.status(200).json(createSuccessResponse(responseData));
  } catch (err: any) {
    console.error('[LeaderboardController] getGlobalLeaderboard error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve global leaderboard'));
  }
}
