const IPV4_PORT = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/;
const IPV6_PORT = /^\[([0-9a-fA-F:]+)\]:\d+$/;

export function getClientIp(headers: Headers): string | null {
  const candidates = [
    headers.get('x-vercel-forwarded-for'),
    headers.get('x-forwarded-for'),
    headers.get('x-real-ip'),
  ];

  for (const candidate of candidates) {
    const first = candidate?.split(',')[0]?.trim();
    if (!first) continue;
    const ipv4 = first.match(IPV4_PORT)?.[1];
    if (ipv4) return ipv4;
    const ipv6 = first.match(IPV6_PORT)?.[1];
    if (ipv6) return ipv6;
    return first;
  }
  return null;
}

export function securityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
}
