import { getApiBase } from './apiBase';

/** SockJS endpoint: same origin in dev (Vite proxy), or VITE_API_BASE + /ws in production. */
export function sockJsUrl(): string {
  const base = getApiBase();
  return base ? `${base}/ws` : '/ws';
}
