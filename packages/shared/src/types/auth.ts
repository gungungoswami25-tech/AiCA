export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface User {
  id: string; // PostgreSQL UUID
  email: string;
  username: string;
  role: UserRole;
  status: AccountStatus;
  authProvider?: string;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  fullName?: string;
  githubHandle?: string;
  bio?: string;
  avatarUrl?: string;
  totalSubmissions: number;
  problemsSolved: number;
  currentStreak: number;
  lastActiveAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user: User;
  profile?: UserProfile;
  accessToken: string;
}
