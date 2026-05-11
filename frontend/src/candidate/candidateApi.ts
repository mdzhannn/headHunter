import type { ModerationStatus } from '../types';
import { fetchWithAuth } from './auth';

export interface CandidateResumeDto {
  id?: number;
  name?: string;
  surname?: string;
  patronymic?: string;
  age?: number;
  email?: string;
  phone?: string;
  gender?: string;
  married?: boolean;
  education?: string;
  location?: string;
  birthDay?: string;
  position?: string;
  salary?: number;
  skills?: string;
  workPlace?: string;
  aboutMe?: string;
  languages?: string;
  status?: string;
  photoUrl?: string | null;
  moderationStatus?: ModerationStatus;
  rejectionReason?: string | null;
}

export interface CandidateVacancyDto {
  id: number;
  jobTitle?: string;
  aboutCompany?: string;
  location?: string;
  requirements?: string;
  salary?: number;
  workType?: string;
  experience?: string;
  aboutVacancy?: string;
  createDate?: string;
  companyId?: number | null;
  category?: string | null;
}

export interface PagedResult<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

function buildVacancyQuery(p: {
  q?: string;
  city?: string;
  workType?: string;
  salaryMin?: string;
  salaryMax?: string;
  experience?: string;
  category?: string;
}) {
  const sp = new URLSearchParams();
  if (p.q?.trim()) sp.set('q', p.q.trim());
  if (p.city?.trim()) sp.set('city', p.city.trim());
  if (p.workType?.trim()) sp.set('workType', p.workType.trim());
  if (p.salaryMin?.trim()) sp.set('salaryMin', p.salaryMin.trim());
  if (p.salaryMax?.trim()) sp.set('salaryMax', p.salaryMax.trim());
  if (p.experience?.trim()) sp.set('experience', p.experience.trim());
  if (p.category?.trim()) sp.set('category', p.category.trim());
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export interface ChatMessageDto {
  id: number;
  conversationId: number;
  senderId: number;
  text: string;
  createdAt: string;
  readAt: string | null;
}

export interface ConversationListItemDto {
  id: number;
  applicationId: number;
  vacancyId: number;
  vacancyTitle: string;
  counterpartyLabel: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface CandidateApplicationItemDto {
  id: number;
  vacancyId: number | null;
  vacancyTitle: string | null;
  companyName: string | null;
  createdAt: string | null;
  status: string | null;
}

type PublicVacanciesResponse =
  | {
      content?: CandidateVacancyDto[];
      number?: number;
      size?: number;
      totalElements?: number;
      totalPages?: number;
    };

function reqPublic<T>(path: string): Promise<T> {
  const BASE = import.meta.env.VITE_API_BASE ?? '';
  return fetch(BASE + path, { headers: { 'Content-Type': 'application/json' } }).then(async (res) => {
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(text || `${res.status} ${res.statusText}`) as Error & { status: number };
      err.status = res.status;
      throw err;
    }
    return (text ? JSON.parse(text) : null) as T;
  });
}

function buildPublicVacanciesQuery(p: {
  category?: string;
  city?: string;
  type?: string;
  salaryMin?: number;
  salaryMax?: number;
  experience?: string;
  q?: string;
  page?: number;
  size?: number;
}) {
  const sp = new URLSearchParams();
  if (p.category?.trim()) sp.set('category', p.category.trim());
  if (p.city?.trim()) sp.set('city', p.city.trim());
  if (p.type?.trim()) sp.set('type', p.type.trim());
  if (typeof p.salaryMin === 'number') sp.set('salaryMin', String(p.salaryMin));
  if (typeof p.salaryMax === 'number') sp.set('salaryMax', String(p.salaryMax));
  if (p.experience?.trim()) sp.set('experience', p.experience.trim());
  if (p.q?.trim()) sp.set('q', p.q.trim());
  if (typeof p.page === 'number') sp.set('page', String(p.page));
  if (typeof p.size === 'number') sp.set('size', String(p.size));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const candidateApi = {
  getResume: () => fetchWithAuth<CandidateResumeDto>('/candidate/resume'),

  saveResume: (body: CandidateResumeDto) =>
    fetchWithAuth<CandidateResumeDto>('/candidate/resume', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  getVacancies: (filters: Parameters<typeof buildVacancyQuery>[0]) =>
    fetchWithAuth<CandidateVacancyDto[]>(`/candidate/vacancies${buildVacancyQuery(filters)}`),

  getPublicVacancies: async (params: Parameters<typeof buildPublicVacanciesQuery>[0]): Promise<PagedResult<CandidateVacancyDto>> => {
    const data = await reqPublic<PublicVacanciesResponse>(`/vacancies/public${buildPublicVacanciesQuery(params)}`);
    return {
      content: data?.content ?? [],
      pageNumber: data?.number ?? 0,
      pageSize: data?.size ?? (typeof params.size === 'number' ? params.size : 12),
      totalElements: data?.totalElements ?? 0,
      totalPages: data?.totalPages ?? 0,
    };
  },

  apply: (vacancyId: number) =>
    fetchWithAuth<null>(`/candidate/vacancies/${vacancyId}/apply`, { method: 'POST' }),

  getMyApplications: () => fetchWithAuth<CandidateApplicationItemDto[]>('/candidate/applications/my'),

  getConversations: () => fetchWithAuth<ConversationListItemDto[]>('/conversations/my'),

  getUnreadTotal: () => fetchWithAuth<{ total: number }>('/conversations/unread-total'),

  getMessages: (conversationId: number) =>
    fetchWithAuth<ChatMessageDto[]>(`/conversations/${conversationId}/messages`),

  markConversationRead: (conversationId: number) =>
    fetchWithAuth<null>(`/conversations/${conversationId}/read`, { method: 'POST' }),
};
