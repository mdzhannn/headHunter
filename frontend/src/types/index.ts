export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  isBlocked?: boolean;
  roleName?: 'CANDIDATE' | 'EMPLOYER' | 'BOTH' | 'ADMIN';
  adminRoleName?: 'SUPER_ADMIN' | 'MODERATOR' | 'SUPPORT' | null;
}

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Resume {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  position: string;
  userId?: number;
  moderationStatus: ModerationStatus;
  rejectionReason?: string | null;
}

export interface Vacancy {
  id: number;
  title: string;
  description: string;
  salary: number;
  company: string;
  userId: number;
  moderationStatus: ModerationStatus;
  rejectionReason?: string | null;
  companyId?: number | null;
  createDate?: string | null;
}

export interface Company {
  id: number;
  name: string;
  inn?: string | null;
  contacts?: string | null;
  documents?: string | null;
  moderationStatus: ModerationStatus;
  rejectionReason?: string | null;
  ownerId: number;
  /** ISO date string from backend */
  createdAt?: string | null;
}

export type Tab = 'users' | 'resumes' | 'vacancies' | 'email' | 'companies' | 'audit';

export interface AdminDashboard {
  totalUsers: number;
  totalCompanies: number;
  totalResumes: number;
  totalVacancies: number;
  pendingCompanies: number;
  pendingResumes: number;
  pendingVacancies: number;
  registrationsByDay: Array<{ date: string; count: number }>;
  applicationFunnel: {
    total: number;
    reviewed: number;
    accepted: number;
    rejected: number;
  };
  topEmployers: Array<{
    employerName: string;
    count: number;
  }>;
}

export interface AuditLog {
  id: number;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValue: string | null;
  changedAt: string;
}

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface AdminNotification {
  type: string;
  message: string;
  entityId: number | null;
  createdAt: string;
}
