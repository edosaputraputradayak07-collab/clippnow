export function buildMobileRequest(baseUrl: string, path: string, accessToken: string, init: RequestInit = {}) {
  const url = new URL(path, baseUrl).toString();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return new Request(url, { ...init, headers });
}
