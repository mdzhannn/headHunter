import type { AdminDashboard, AuditLog, Company, ModerationStatus, PagedResult } from '../types';
import { CANDIDATE_TOKEN_KEY } from '../candidate/auth';
import { getApiBase } from '../apiBase';

const BASE = getApiBase();

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const token = localStorage.getItem(CANDIDATE_TOKEN_KEY);
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(BASE + url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...authHeader, ...opts?.headers },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

type FrontVacancy = {
  id: number;
  title: string;
  description: string;
  salary: number;
  company: string;
  userId?: number;
  moderationStatus: ModerationStatus;
  rejectionReason?: string | null;
  companyId?: number | null;
  createDate?: string | null;
};

type BackVacancy = {
  id: number;
  jobTitle?: string;
  aboutVacancy?: string;
  aboutCompany?: string;
  location?: string;
  requirements?: string;
  workType?: string;
  experience?: string;
  salary?: number;
  moderationStatus?: ModerationStatus;
  rejectionReason?: string | null;
  companyId?: number | null;
  createDate?: string | unknown;
  status?: string;
};

type FrontUser = {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  isBlocked?: boolean;
  roleName?: 'CANDIDATE' | 'EMPLOYER' | 'BOTH' | 'ADMIN';
  adminRoleName?: 'SUPER_ADMIN' | 'MODERATOR' | 'SUPPORT' | null;
};

type BackUser = {
  id: number;
  userName?: string;
  password?: string;
  active?: boolean;
  isActive?: boolean;
  phone?: string | null;
  email?: string | null;
  roleName?: 'CANDIDATE' | 'EMPLOYER' | 'BOTH' | 'ADMIN' | string;
  adminRoleName?: 'SUPER_ADMIN' | 'MODERATOR' | 'SUPPORT' | string | null;
};

type FrontResume = {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  position: string;
  userId?: number;
  moderationStatus: ModerationStatus;
  rejectionReason?: string | null;
};

type BackResume = {
  id: number;
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  position?: string;
  moderationStatus?: ModerationStatus;
  rejectionReason?: string | null;
};

const splitUserName = (userName?: string) => {
  const parts = (userName ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    name: parts[0] ?? '',
    surname: parts.slice(1).join(' '),
  };
};

const mapUserFromBack = (u: BackUser): FrontUser => {
  const parsed = splitUserName(u.userName);
  const login = (u.phone ?? '').trim();
  const resumeEmail = (u.email ?? '').trim();
  const loginLooksLikeEmail = login.includes('@');
  const displayEmail = resumeEmail || (loginLooksLikeEmail ? login : '');
  const displayPhone = loginLooksLikeEmail ? '' : login;

  return {
    id: u.id,
    name: parsed.name || u.userName || '',
    surname: parsed.surname,
    email: displayEmail,
    phone: displayPhone,
    isBlocked: !((u.active ?? u.isActive) ?? true),
    roleName: (u.roleName as 'CANDIDATE' | 'EMPLOYER' | 'BOTH' | 'ADMIN' | undefined) ?? 'CANDIDATE',
    adminRoleName: (u.adminRoleName as 'SUPER_ADMIN' | 'MODERATOR' | 'SUPPORT' | null | undefined) ?? null,
  };
};

const deriveLoginPhoneField = (u: Partial<FrontUser>): string | undefined => {
  const tel = u.phone?.trim();
  const mail = u.email?.trim();
  if (tel) return tel;
  if (mail) return mail;
  return undefined;
};

const mapUserToBack = (u: Partial<FrontUser>) => ({
  id: u.id,
  userName: [u.name, u.surname].filter(Boolean).join(' ').trim(),
  password: 'default123',
  active: !(u.isBlocked ?? false),
  roleName: u.roleName ?? 'CANDIDATE',
  adminRoleName: u.adminRoleName ?? null,
  phone: deriveLoginPhoneField(u),
});

const mapResumeFromBack = (r: BackResume): FrontResume => ({
  id: r.id,
  name: r.name ?? '',
  surname: r.surname ?? '',
  email: r.email ?? '',
  phone: r.phone ?? '',
  position: r.position ?? '',
  moderationStatus: r.moderationStatus ?? 'PENDING',
  rejectionReason: r.rejectionReason ?? null,
});

const mapResumeToBack = (r: Partial<FrontResume>) => ({
  id: r.id,
  name: r.name,
  surname: r.surname,
  email: r.email,
  phone: r.phone,
  position: r.position,
});

function normalizeBackendDate(d: unknown): string | null {
  if (d == null) return null;
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d.length >= 3) {
    const [y, m, day, h = 0, min = 0, sec = 0, nano = 0] = d as number[];
    return new Date(y, m - 1, day, h, min, sec, Math.floor(nano / 1e6)).toISOString();
  }
  return null;
}

const mapVacancyFromBack = (v: BackVacancy): FrontVacancy => ({
  id: v.id,
  title: v.jobTitle ?? '',
  description: v.aboutVacancy ?? '',
  company: v.aboutCompany ?? '',
  salary: Number(v.salary ?? 0),
  moderationStatus: v.moderationStatus ?? 'PENDING',
  rejectionReason: v.rejectionReason ?? null,
  companyId: v.companyId ?? null,
  createDate: normalizeBackendDate(v.createDate),
});

const mapVacancyToBack = (v: Partial<FrontVacancy>) => ({
  id: v.id,
  jobTitle: v.title,
  aboutVacancy: v.description,
  aboutCompany: v.company,
  salary: v.salary,
  companyId: v.companyId,
});

// Users
export const api = {
  users: {
    getAll: async () => {
      const data = await req<BackUser[]>('/api');
      return (data ?? []).map(mapUserFromBack);
    },
    getById: async (id: number) => {
      const data = await req<BackUser>(`/api/${id}`);
      return mapUserFromBack(data);
    },
    create: (data: Partial<FrontUser>) =>
      req('/api', { method: 'POST', body: JSON.stringify(mapUserToBack(data)) }),
    update: (data: Partial<FrontUser>) =>
      req('/api', { method: 'PUT', body: JSON.stringify(mapUserToBack(data)) }),
    delete: (id: number) => req(`/api/${id}`, { method: 'DELETE' }),
    block: (id: number) => req(`/api/${id}/block`, { method: 'POST' }),
    unblock: (id: number) => req(`/api/${id}/unblock`, { method: 'POST' }),
  },
  resumes: {
    getAll: async () => {
      const data = await req<BackResume[]>('/resume');
      return (data ?? []).map(mapResumeFromBack);
    },
    getPending: async () => {
      const data = await req<BackResume[]>('/resume/pending');
      return (data ?? []).map(mapResumeFromBack);
    },
    getById: async (id: number) => {
      const data = await req<BackResume>(`/resume/${id}`);
      return mapResumeFromBack(data);
    },
    create: (data: Partial<FrontResume>) =>
      req('/resume', { method: 'POST', body: JSON.stringify(mapResumeToBack(data)) }),
    update: (data: Partial<FrontResume>) =>
      req('/resume', { method: 'PUT', body: JSON.stringify(mapResumeToBack(data)) }),
    delete: (id: number) => req(`/resume/${id}`, { method: 'DELETE' }),
    adminApprove: (id: number) =>
      req<BackResume>(`/admin/resume/${id}/approve`, { method: 'POST' }).then(mapResumeFromBack),
    adminReject: (id: number, reason: string) =>
      req<BackResume>(`/admin/resume/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }).then(mapResumeFromBack),
    adminDelete: (id: number) => req(`/admin/resume/${id}`, { method: 'DELETE' }),
    bulk: (ids: number[], action: 'APPROVE' | 'REJECT' | 'DELETE') =>
      req('/admin/resume/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids, action }),
      }),
  },
  vacancies: {
    getAll: async () => {
      const data = await req<BackVacancy[]>('/vacancy');
      return (data ?? []).map(mapVacancyFromBack);
    },
    getPending: async () => {
      const data = await req<BackVacancy[]>('/vacancy/pending');
      return (data ?? []).map(mapVacancyFromBack);
    },
    getById: async (id: number) => {
      const data = await req<BackVacancy>(`/vacancy/${id}`);
      return mapVacancyFromBack(data);
    },
    create: (data: Partial<FrontVacancy>) =>
      req('/vacancy', { method: 'POST', body: JSON.stringify(mapVacancyToBack(data)) }),
    update: (data: Partial<FrontVacancy>) =>
      req('/vacancy', { method: 'PUT', body: JSON.stringify(mapVacancyToBack(data)) }),
    delete: (id: number) => req(`/vacancy/${id}`, { method: 'DELETE' }),
    getRawById: async (id: number) => {
      const data = await req<BackVacancy>(`/vacancy/${id}`);
      return data;
    },
    adminApprove: (id: number) =>
      req<BackVacancy>(`/admin/vacancy/${id}/approve`, { method: 'POST' }).then(mapVacancyFromBack),
    adminReject: (id: number, reason: string) =>
      req<BackVacancy>(`/admin/vacancy/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }).then(mapVacancyFromBack),
    adminUpdate: (id: number, body: Record<string, unknown>) =>
      req<BackVacancy>(`/admin/vacancy/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then(mapVacancyFromBack),
    adminDelete: (id: number) => req(`/admin/vacancy/${id}`, { method: 'DELETE' }),
    bulk: (ids: number[], action: 'APPROVE' | 'REJECT' | 'DELETE') =>
      req('/admin/vacancy/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids, action }),
      }),
  },
  companies: {
    list: async (status?: string) => {
      const q = status ? `?status=${encodeURIComponent(status)}` : '';
      const data = await req<Company[]>(`/admin/companies${q}`);
      return data ?? [];
    },
    getById: async (id: number) => req<Company>(`/admin/companies/${id}`),
    approve: (id: number) => req(`/admin/companies/${id}/approve`, { method: 'POST' }),
    reject: (id: number, reason: string) =>
      req(`/admin/companies/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    delete: (id: number) => req(`/admin/companies/${id}`, { method: 'DELETE' }),
  },
  dashboard: {
    get: () => req<AdminDashboard>('/admin/dashboard'),
  },
  audit: {
    get: (params: {
      entityType?: string;
      adminEmail?: string;
      from?: string;
      to?: string;
      page?: number;
      size?: number;
    }) => {
      const sp = new URLSearchParams();
      if (params.entityType?.trim()) sp.set('entityType', params.entityType.trim());
      if (params.adminEmail?.trim()) sp.set('adminEmail', params.adminEmail.trim());
      if (params.from?.trim()) sp.set('from', params.from.trim());
      if (params.to?.trim()) sp.set('to', params.to.trim());
      sp.set('page', String(params.page ?? 0));
      sp.set('size', String(params.size ?? 20));
      return req<PagedResult<AuditLog>>(`/admin/audit?${sp.toString()}`);
    },
  },
  email: {
    sendMessage: (email: string, message: string) =>
      req(`/email/send/message?email=${encodeURIComponent(email)}&message=${encodeURIComponent(message)}`, { method: 'POST' }),
    sendCode: (email: string) =>
      req(`/email/send/code?email=${encodeURIComponent(email)}`, { method: 'POST' }),
    verify: (email: string, code: string) =>
      req(`/email/send/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`),
  },
};
