import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Btn, Card, Input, Toast } from '../components/ui';
import SentResumeDetails from '../components/SentResumeDetails';
import { decodeJwtPayload } from '../candidate/auth';
import { useAuth } from '../candidate/AuthContext';
import type { CandidateResumeDto } from '../candidate/candidateApi';
import { employerApi, type EmployerApplicationItemDto, type EmployerCompanyDto, type EmployerVacancyDto } from './employerApi';

type VacancyForm = {
  jobTitle: string;
  aboutVacancy: string;
  location: string;
  requirements: string;
  salary: number;
  workType: string;
  experience: string;
};

const emptyVacancy: VacancyForm = {
  jobTitle: '',
  aboutVacancy: '',
  location: '',
  requirements: '',
  salary: 0,
  workType: '',
  experience: '',
};

function moderationBadge(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
  if (status === 'APPROVED') return { text: 'Одобрено', color: 'green' as const };
  if (status === 'REJECTED') return { text: 'Отклонено', color: 'red' as const };
  return { text: 'На проверке', color: 'amber' as const };
}

function applicationStatusLabel(status: string | null | undefined): string {
  if (status === 'VIEWED') return 'Просмотрен';
  if (status === 'INVITED') return 'Приглашение';
  if (status === 'REJECTED') return 'Отказ';
  return 'Отправлен';
}

function formatDateTime(raw: string | null | undefined): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function EmployerPortalPage() {
  const { token, logout } = useAuth();
  const role = token ? String((decodeJwtPayload(token)?.role as string | undefined) ?? '') : '';
  const canEmployer = role === 'EMPLOYER' || role === 'BOTH';
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<EmployerCompanyDto>({
    name: '',
    inn: '',
    contacts: '',
    documents: '',
  });
  const [vacancyForm, setVacancyForm] = useState<VacancyForm>(emptyVacancy);
  const [vacancies, setVacancies] = useState<EmployerVacancyDto[]>([]);
  const [resumes, setResumes] = useState<CandidateResumeDto[]>([]);
  const [applications, setApplications] = useState<EmployerApplicationItemDto[]>([]);
  const [expandedApplicationId, setExpandedApplicationId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingVacancy, setSavingVacancy] = useState(false);

  const load = async () => {
    if (!token || !canEmployer) return;
    setLoading(true);
    try {
      const [myCompany, myVacancies, resumeList, appList] = await Promise.all([
        employerApi.getMyCompany(),
        employerApi.getMyVacancies().catch(() => []),
        employerApi.listResumes().catch(() => []),
        employerApi.listApplications().catch(() => []),
      ]);
      if (myCompany) {
        setCompany({
          id: myCompany.id,
          name: myCompany.name ?? '',
          inn: myCompany.inn ?? '',
          contacts: myCompany.contacts ?? '',
          documents: myCompany.documents ?? '',
          moderationStatus: myCompany.moderationStatus,
          rejectionReason: myCompany.rejectionReason,
        });
      }
      setVacancies(myVacancies);
      setResumes(resumeList);
      setApplications(appList);
    } catch {
      setToast({ msg: 'Не удалось загрузить данные работодателя', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canEmployer]);

  const saveCompany = async () => {
    if (!company.name.trim()) {
      setToast({ msg: 'Введите название компании', type: 'error' });
      return;
    }
    setSavingCompany(true);
    try {
      const saved = await employerApi.saveMyCompany({
        ...company,
        name: company.name.trim(),
      });
      setCompany({
        id: saved.id,
        name: saved.name ?? '',
        inn: saved.inn ?? '',
        contacts: saved.contacts ?? '',
        documents: saved.documents ?? '',
        moderationStatus: saved.moderationStatus,
        rejectionReason: saved.rejectionReason,
      });
      setToast({ msg: 'Профиль компании сохранен', type: 'success' });
    } catch {
      setToast({ msg: 'Ошибка сохранения компании', type: 'error' });
    } finally {
      setSavingCompany(false);
    }
  };

  const createVacancy = async () => {
    if (!vacancyForm.jobTitle.trim()) {
      setToast({ msg: 'Введите название вакансии', type: 'error' });
      return;
    }
    setSavingVacancy(true);
    try {
      await employerApi.createVacancy({
        jobTitle: vacancyForm.jobTitle.trim(),
        aboutVacancy: vacancyForm.aboutVacancy,
        location: vacancyForm.location,
        requirements: vacancyForm.requirements,
        salary: vacancyForm.salary,
        workType: vacancyForm.workType,
        experience: vacancyForm.experience,
      });
      setVacancyForm(emptyVacancy);
      await load();
      setToast({ msg: 'Вакансия отправлена на модерацию', type: 'success' });
    } catch {
      setToast({ msg: 'Сначала заполните профиль компании', type: 'error' });
    } finally {
      setSavingVacancy(false);
    }
  };

  const deleteVacancy = async (id: number) => {
    if (!confirm('Удалить вакансию?')) return;
    try {
      await employerApi.deleteVacancy(id);
      setVacancies((prev) => prev.filter((v) => v.id !== id));
      setToast({ msg: 'Вакансия удалена', type: 'success' });
    } catch {
      setToast({ msg: 'Ошибка удаления вакансии', type: 'error' });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <Card className="max-w-xl mx-auto p-6">
          <h1 className="text-xl font-semibold text-slate-900">Режим работодателя</h1>
          <p className="text-sm text-slate-600 mt-2">Войдите по email, затем зарегистрируйте компанию и публикуйте свои вакансии.</p>
          <Link to="/app/login" className="inline-block mt-4">
            <Btn variant="primary">Войти</Btn>
          </Link>
        </Card>
      </div>
    );
  }

  if (!canEmployer) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <Card className="max-w-xl mx-auto p-6">
          <h1 className="text-xl font-semibold text-slate-900">Режим работодателя</h1>
          <p className="text-sm text-slate-600 mt-2">
            У вас нет роли работодателя. Попросите администратора назначить роль <b>EMPLOYER</b> или <b>BOTH</b> в админке пользователей.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/app/vacancies">
              <Btn variant="ghost">Вернуться к поиску работы</Btn>
            </Link>
            {token ? (
              <Btn variant="primary" onClick={() => logout()}>
                Выйти
              </Btn>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Ищу сотрудника</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/app/messages">
              <Btn variant="ghost">Сообщения с кандидатами</Btn>
            </Link>
            {role === 'BOTH' ? (
              <Link to="/app/vacancies">
                <Btn variant="ghost">Поиск работы</Btn>
              </Link>
            ) : null}
            <Btn
              variant="ghost"
              onClick={() => logout()}
              className="text-red-700 border-red-200 hover:bg-red-50"
            >
              Выйти
            </Btn>
          </div>
        </div>

        <Card className="p-4 md:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Профиль компании</h2>
            {company.moderationStatus && (
              <Badge color={moderationBadge(company.moderationStatus).color}>
                {moderationBadge(company.moderationStatus).text}
              </Badge>
            )}
          </div>
          {company.rejectionReason && (
            <p className="text-sm text-red-600 mt-2">Причина отклонения: {company.rejectionReason}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Input label="Название компании" value={company.name} onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))} />
            <Input label="БИН/ИНН" value={company.inn ?? ''} onChange={(e) => setCompany((p) => ({ ...p, inn: e.target.value }))} />
            <Input label="Контакты" value={company.contacts ?? ''} onChange={(e) => setCompany((p) => ({ ...p, contacts: e.target.value }))} />
            <Input label="Документы (ссылка)" value={company.documents ?? ''} onChange={(e) => setCompany((p) => ({ ...p, documents: e.target.value }))} />
          </div>
          <div className="mt-3">
            <Btn variant="primary" onClick={saveCompany} disabled={savingCompany || loading}>
              {savingCompany ? 'Сохранение...' : 'Сохранить компанию'}
            </Btn>
          </div>
        </Card>

        <Card className="p-4 md:p-5">
          <h2 className="font-semibold text-slate-900 mb-1">Резюме кандидатов</h2>
          <p className="text-sm text-slate-500 mb-3">
            Список всех резюме в системе (кроме отклонённых модерацией). Статус модерации указан в карточке, если применимо.
          </p>
          {resumes.length === 0 ? (
            <p className="text-sm text-slate-500">Пока нет резюме.</p>
          ) : (
            <div className="space-y-3 max-h-[min(70vh,520px)] overflow-y-auto pr-1">
              {resumes.map((r, idx) => {
                const fullName = [r.surname, r.name, r.patronymic].filter(Boolean).join(' ').trim() || 'Кандидат';
                const skillsShort =
                  r.skills && r.skills.length > 160 ? `${r.skills.slice(0, 160)}…` : (r.skills ?? '');
                return (
                  <div key={r.id ?? `resume-${idx}`} className="border border-slate-200 rounded-lg p-3 bg-white">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{fullName}</p>
                        <p className="text-sm text-slate-700 mt-1">{r.position || 'Должность не указана'}</p>
                      </div>
                      {r.moderationStatus && (
                        <Badge color={moderationBadge(r.moderationStatus as 'PENDING' | 'APPROVED' | 'REJECTED').color}>
                          {moderationBadge(r.moderationStatus as 'PENDING' | 'APPROVED' | 'REJECTED').text}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{[r.location, r.education].filter(Boolean).join(' · ') || '—'}</p>
                    {r.salary != null && r.salary > 0 && (
                      <p className="text-xs text-slate-600 mt-1">Ожидания: {r.salary.toLocaleString('ru-RU')} ₸</p>
                    )}
                    {(r.email || r.phone) && (
                      <p className="text-xs text-slate-600 mt-2">
                        {r.email && <span>{r.email}</span>}
                        {r.email && r.phone && <span> · </span>}
                        {r.phone && <span>{r.phone}</span>}
                      </p>
                    )}
                    {skillsShort ? <p className="text-xs text-slate-600 mt-2 leading-relaxed">{skillsShort}</p> : null}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h2 className="font-semibold text-slate-900">Отклики на ваши вакансии</h2>
            <Btn
              size="sm"
              variant="ghost"
              onClick={async () => {
                try {
                  const res = await employerApi.repairConversations();
                  setToast({ msg: res.message, type: 'success' });
                  await load();
                } catch {
                  setToast({ msg: 'Ошибка при создании чатов', type: 'error' });
                }
              }}
            >
              Создать чаты для старых откликов
            </Btn>
          </div>
          <p className="text-sm text-slate-500 mb-3">
            Для каждого отклика показано резюме в том виде, в каком кандидат отправил его при отклике (для старых откликов без снимка — текущая версия из профиля).
          </p>
          {applications.length === 0 ? (
            <p className="text-sm text-slate-500">Пока нет откликов на вакансии вашей компании.</p>
          ) : (
            <div className="space-y-2 max-h-[min(70vh,480px)] overflow-y-auto pr-1">
              {applications.map((a) => {
                const open = expandedApplicationId === a.id;
                return (
                  <div key={a.id} className="border border-slate-200 rounded-lg p-3 bg-white">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{a.vacancyTitle ?? 'Вакансия'}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatDateTime(a.createdAt)}</p>
                      </div>
                      <Badge color="amber">{applicationStatusLabel(a.status)}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Btn size="sm" variant="ghost" onClick={() => setExpandedApplicationId(open ? null : a.id)}>
                        {open ? 'Скрыть резюме' : 'Резюме на момент отклика'}
                      </Btn>
                      {a.conversationId ? (
                        <Link to={`/app/messages/${a.conversationId}`}>
                          <Btn size="sm" variant="primary">
                            Написать в чат
                          </Btn>
                        </Link>
                      ) : (
                        <span className="text-xs text-amber-600">Чат ещё не создан — нажмите «Создать чаты для старых откликов»</span>
                      )}
                    </div>
                    {open ? (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <SentResumeDetails r={a.resumeAtApply} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-4 md:p-5">
          <h2 className="font-semibold text-slate-900">Разместить вакансию</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Input label="Название" value={vacancyForm.jobTitle} onChange={(e) => setVacancyForm((p) => ({ ...p, jobTitle: e.target.value }))} />
            <Input label="Зарплата" type="number" value={vacancyForm.salary} onChange={(e) => setVacancyForm((p) => ({ ...p, salary: Number(e.target.value) || 0 }))} />
            <Input label="Локация" value={vacancyForm.location} onChange={(e) => setVacancyForm((p) => ({ ...p, location: e.target.value }))} />
            <Input label="Тип занятости" value={vacancyForm.workType} onChange={(e) => setVacancyForm((p) => ({ ...p, workType: e.target.value }))} />
            <Input label="Опыт" value={vacancyForm.experience} onChange={(e) => setVacancyForm((p) => ({ ...p, experience: e.target.value }))} />
            <Input label="Требования" value={vacancyForm.requirements} onChange={(e) => setVacancyForm((p) => ({ ...p, requirements: e.target.value }))} />
          </div>
          <div className="mt-3">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Описание</label>
            <textarea
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              rows={4}
              value={vacancyForm.aboutVacancy}
              onChange={(e) => setVacancyForm((p) => ({ ...p, aboutVacancy: e.target.value }))}
            />
          </div>
          <div className="mt-3">
            <Btn variant="primary" onClick={createVacancy} disabled={savingVacancy || loading}>
              {savingVacancy ? 'Сохранение...' : 'Разместить вакансию'}
            </Btn>
          </div>
        </Card>

        <Card className="p-4 md:p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Мои вакансии</h2>
          {vacancies.length === 0 ? (
            <p className="text-sm text-slate-500">Пока нет вакансий.</p>
          ) : (
            <div className="space-y-2">
              {vacancies.map((v) => (
                <div key={v.id} className="border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{v.jobTitle || 'Без названия'}</p>
                    <p className="text-sm text-slate-600 mt-1">{v.location || 'Локация не указана'}</p>
                    {v.rejectionReason && <p className="text-xs text-red-600 mt-1">Причина: {v.rejectionReason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={moderationBadge(v.moderationStatus).color}>{moderationBadge(v.moderationStatus).text}</Badge>
                    <Btn size="sm" variant="danger" onClick={() => deleteVacancy(v.id)}>
                      Удалить
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
