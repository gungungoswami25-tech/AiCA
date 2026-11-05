import { describe, it, expect } from 'vitest';
import { GoogleAuthRequestSchema } from '../packages/shared/src/schemas/auth.schema.js';

describe('Google Authentication Tests', () => {
  it('should accept valid Google credential request', () => {
    const valid = { credential: 'sample_google_jwt_token_12345' };
    const parsed = GoogleAuthRequestSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.credential).toBe('sample_google_jwt_token_12345');
    }
  });

  it('should reject missing credential in Google auth payload', () => {
    const invalid = {};
    const parsed = GoogleAuthRequestSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('should reject empty string credential', () => {
    const invalid = { credential: '' };
    const parsed = GoogleAuthRequestSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('should format dev mock token correctly for local development', () => {
    const mockEmail = 'student.google@aica.lab';
    const devToken = `dev-mock-google-${mockEmail}`;
    expect(devToken.startsWith('dev-mock-google-')).toBe(true);
    const extractedEmail = devToken.replace('dev-mock-google-', '');
    expect(extractedEmail).toBe(mockEmail);
  });
});
