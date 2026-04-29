import { isIP } from 'net';

const PRIVATE_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^::1$/,
  /^fe80:/,
];

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    if (u.pathname.endsWith('/') && u.pathname !== '/') {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}

export function isPublicUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (!['http:', 'https:'].includes(url.protocol)) return false;

    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;

    const ip = isIP(hostname);
    if (ip) {
      return !PRIVATE_RANGES.some(r => r.test(hostname));
    }

    // Block common internal domains
    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return false;

    return true;
  } catch {
    return false;
  }
}
