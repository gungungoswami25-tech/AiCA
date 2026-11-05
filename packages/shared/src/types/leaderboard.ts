import { SupportedLanguage } from '../constants/languages.js';

export interface LeaderboardScoreBreakdown {
  rawTimeMs: number;
  normalizedTimeMs: number;
  timeScore: number;
  rawMemoryKb: number;
  normalizedMemoryKb: number;
  memoryScore: number;
  qualityScore: number;
  qualityPoints: number;
  formula: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  submissionId: string;
  language: SupportedLanguage;
  compositeScore: number;
  breakdown: LeaderboardScoreBreakdown;
  submittedAt: string;
}

export interface ProblemLeaderboardResponse {
  problemId: string;
  totalRanked: number;
  rankings: LeaderboardEntry[];
}

export interface GlobalLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  problemsSolved: number;
  totalScore: number;
  avgRuntimeMs: number;
  streak: number;
  lastActiveAt?: string;
}

export interface GlobalLeaderboardResponse {
  totalRanked: number;
  page: number;
  limit: number;
  rankings: GlobalLeaderboardEntry[];
}
