/** SockJS endpoint: same origin in dev (Vite proxy), or VITE_API_BASE + /ws in production. */
export function sockJsUrl(): string {
  const base = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');
  return base ? `${base}/ws` : '/ws';
}
