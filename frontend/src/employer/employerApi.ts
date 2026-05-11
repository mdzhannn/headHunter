import { fetchWithAuth } from '../candidate/auth';

export interface EmployerCompanyDto {
  id?: number;
  name: string;
  inn?: string | null;
  contacts?: string | null;
  documents?: string | null;
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
}

export interface EmployerVacancyDto {
  id: number;
  jobTitle?: string;
  aboutCompany?: string;
  location?: string;
  requirements?: string;
  salary?: number;
  workType?: string;
  experience?: string;
  aboutVacancy?: string;
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
}

export const employerApi = {
  getMyCompany: () => fetchWithAuth<EmployerCompanyDto | null>('/employer/company'),
  saveMyCompany: (body: EmployerCompanyDto) =>
    fetchWithAuth<EmployerCompanyDto>('/employer/company', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  getMyVacancies: () => fetchWithAuth<EmployerVacancyDto[]>('/employer/vacancies'),
  createVacancy: (body: Omit<EmployerVacancyDto, 'id'>) =>
    fetchWithAuth<EmployerVacancyDto>('/employer/vacancies', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteVacancy: (id: number) =>
    fetchWithAuth<void>(`/employer/vacancies/${id}`, {
      method: 'DELETE',
    }),
};
