/**
 * Auto-heals and extracts clean connection URLs from raw environment variables.
 * Handles cases where users copy CLI commands (e.g. from Upstash, Neon, Atlas)
 * or enclose strings in mismatched quotes.
 */

export function sanitizeRedisUrl(input?: string): string {
  if (!input) return 'redis://localhost:6379';
  let s = input.trim().replace(/^["']|["']$/g, '');

  // If user pasted CLI command: redis-cli --tls -u redis://...
  const cliMatch = s.match(/-u\s+(rediss?:\/\/[^\s]+)/i);
  if (cliMatch) {
    s = cliMatch[1];
  } else {
    // If URL is embedded anywhere in the string
    const innerMatch = s.match(/(rediss?:\/\/[^\s]+)/i);
    if (innerMatch) {
      s = innerMatch[1];
    }
  }

  // Upstash or explicit TLS connections require rediss://
  if ((input.includes('--tls') || s.includes('upstash.io')) && s.startsWith('redis://')) {
    s = s.replace(/^redis:\/\//, 'rediss://');
  }

  try {
    new URL(s);
    return s;
  } catch {
    return 'redis://localhost:6379';
  }
}

export function sanitizeDatabaseUrl(input?: string): string | undefined {
  if (!input) return undefined;
  let s = input.trim().replace(/^["']|["']$/g, '');
  const match = s.match(/(postgres(?:ql)?:\/\/[^\s'"]+)/i);
  return match ? match[1] : s;
}

export function sanitizeMongoUri(input?: string): string {
  if (!input) return 'mongodb://localhost:27017/aica_lab';
  let s = input.trim().replace(/^["']|["']$/g, '');
  const match = s.match(/(mongodb(?:\+srv)?:\/\/[^\s'"]+)/i);
  return match ? match[1] : s;
}
