import type { NextRequest } from 'next/server';

export function isSameRequestOrigin(request: NextRequest) {
  const rawOrigin = request.headers.get('origin');
  if (!rawOrigin) return false;

  try {
    const origin = new URL(rawOrigin);
    const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    return Boolean(forwardedHost && origin.host.toLowerCase() === forwardedHost.toLowerCase());
  } catch {
    return false;
  }
}
