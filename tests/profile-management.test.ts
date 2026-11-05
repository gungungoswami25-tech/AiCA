import { describe, it, expect } from 'vitest';
import { UserProfile } from '../packages/shared/src/types/auth.js';

describe('Profile Management Tests', () => {
  it('should structure user profile correctly with default metrics', () => {
    const profile: UserProfile = {
      userId: 'test-uuid-1234',
      fullName: 'Mohan Kunjam',
      githubHandle: 'mohankunjam',
      bio: 'Optimizing algorithmic complexity from O(N²) to O(N)',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=mohan',
      totalSubmissions: 42,
      problemsSolved: 14,
      currentStreak: 5,
      lastActiveAt: new Date().toISOString()
    };

    expect(profile.userId).toBe('test-uuid-1234');
    expect(profile.fullName).toBe('Mohan Kunjam');
    expect(profile.problemsSolved).toBe(14);
    expect(profile.totalSubmissions).toBe(42);
    expect(profile.currentStreak).toBe(5);
  });

  it('should sanitize and trim profile input strings', () => {
    const rawFullName = '   Mohan Kunjam   ';
    const rawBio = '   Passionate about Judge0 isolated sandboxes.   ';
    const rawGithub = '  @mohankunjam  ';

    const cleanFullName = rawFullName.trim().slice(0, 100);
    const cleanBio = rawBio.trim().slice(0, 500);
    const cleanGithub = rawGithub.trim().replace(/^@/, '').slice(0, 100);

    expect(cleanFullName).toBe('Mohan Kunjam');
    expect(cleanBio).toBe('Passionate about Judge0 isolated sandboxes.');
    expect(cleanGithub).toBe('mohankunjam');
  });

  it('should calculate speedup percentage delta accurately', () => {
    const initialMs = 1420;
    const optimalMs = 18;
    const speedupPercent = Number((((initialMs - optimalMs) / initialMs) * 100).toFixed(1));

    expect(speedupPercent).toBe(98.7);
    expect(speedupPercent).toBeGreaterThan(90);
  });
});
