export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    const requestUrl = new URL(request.url);
    const requestOrigin = `${requestUrl.protocol}//${requestUrl.host}`;
    return origin === requestOrigin;
  } catch {
    return false;
  }
}

export function noStoreHeaders() {
  return { 'Cache-Control': 'no-store, max-age=0' };
}
