import { createAdminClient } from '@/lib/supabase/admin';
export { getClientIp, securityHeaders } from './defense-core';
import { getClientIp } from './defense-core';

export async function securityGuard(key: string, limit = 30, windowSeconds = 60) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('clippnow_security_guard', {
    p_key: key.slice(0, 250),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  return !error && data === true;
}

export async function logSecurityEvent(params: {
  userId?: string | null;
  eventType: string;
  severity: 'info' | 'warning' | 'critical';
  request?: Request;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const ip = params.request ? getClientIp(params.request.headers) : null;
  const userAgent = params.request?.headers.get('user-agent') ?? null;
  await admin.rpc('log_clippnow_security_event', {
    p_user_id: params.userId ?? null,
    p_event_type: params.eventType,
    p_severity: params.severity,
    p_ip_address: ip,
    p_user_agent: userAgent,
    p_metadata: params.metadata ?? {},
  });
}

// Keep request-derived IP handling centralized through defense-core.
