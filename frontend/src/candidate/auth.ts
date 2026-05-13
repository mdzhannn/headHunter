import { getApiBase } from '../apiBase';

const BASE = getApiBase();

export const CANDIDATE_TOKEN_KEY = 'hh_candidate_token';
export const CANDIDATE_REFRESH_TOKEN_KEY = 'hh_candidate_refresh_token';
export type AdminSubRole = 'SUPER_ADMIN' | 'MODERATOR' | 'SUPPORT';

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
}

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(text || `${res.status} ${res.statusText}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return (text ? JSON.parse(text) : null) as T;
}

export const candidateAuth = {
  registerSendEmailOtp: (fullName: string, email: string) =>
    req<void>('/auth/register/send-email-otp', {
      method: 'POST',
      body: JSON.stringify({ fullName, email }),
    }),

  registerVerifyEmailOtp: (email: string, code: string) =>
    req<void>('/auth/register/verify-email-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  completeRegistration: (email: string, password: string) =>
    req<AuthResponse>('/auth/register/complete', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    req<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  sendPasswordResetOtp: (email: string) =>
    req<void>('/auth/password/send-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyPasswordResetOtp: (email: string, code: string) =>
    req<void>('/auth/password/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  resetPassword: (email: string, newPassword: string) =>
    req<void>('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    }),
};

export function getStoredToken(): string | null {
  return localStorage.getItem(CANDIDATE_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(CANDIDATE_REFRESH_TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(CANDIDATE_TOKEN_KEY, token);
}

export function setStoredRefreshToken(token: string) {
  localStorage.setItem(CANDIDATE_REFRESH_TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(CANDIDATE_TOKEN_KEY);
  localStorage.removeItem(CANDIDATE_REFRESH_TOKEN_KEY);
}

export function setStoredAuthTokens(accessToken: string, refreshToken?: string) {
  setStoredToken(accessToken);
  if (refreshToken) {
    setStoredRefreshToken(refreshToken);
  }
}

export function authHeaders(): HeadersInit {
  const t = getStoredToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export async function candidateReq<T>(path: string, opts?: RequestInit): Promise<T> {
  return fetchWithAuth<T>(path, opts);
}

async function requestRefreshToken(refreshToken: string): Promise<AuthResponse> {
  const res = await fetch(BASE + '/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(text || `${res.status} ${res.statusText}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return (text ? JSON.parse(text) : null) as AuthResponse;
}

function redirectToLogin() {
  if (window.location.pathname !== '/app/login') {
    window.location.assign('/app/login');
  }
}

export async function fetchWithAuth<T>(path: string, opts?: RequestInit, attempt = 0): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
      ...opts?.headers,
    },
  });
  if (res.status === 401 && attempt === 0) {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      clearStoredToken();
      redirectToLogin();
      const err = new Error('unauthorized') as Error & { status: number };
      err.status = 401;
      throw err;
    }
    try {
      const refreshed = await requestRefreshToken(refreshToken);
      setStoredAuthTokens(refreshed.accessToken, refreshed.refreshToken);
      return fetchWithAuth<T>(path, opts, 1);
    } catch {
      clearStoredToken();
      redirectToLogin();
      const err = new Error('unauthorized') as Error & { status: number };
      err.status = 401;
      throw err;
    }
  }
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(text || `${res.status} ${res.statusText}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return (text ? JSON.parse(text) : null) as T;
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getAdminSubRoleFromToken(token: string | null): AdminSubRole | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const v = payload?.adminRole;
  if (v === 'SUPER_ADMIN' || v === 'MODERATOR' || v === 'SUPPORT') return v;
  return null;
}
