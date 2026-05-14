import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Btn, Card, Input, Toast } from '../components/ui';
import { candidateApi, type CandidateVacancyDto } from './candidateApi';
import { useAuth } from './AuthContext';

type Filters = {
  category: string;
  city: string;
  workTypes: string[];
  salaryMin: number;
  salaryMax: number;
  experience: string;
  q: string;
};

const initialFilters: Filters = {
  category: '',
  city: '',
  workTypes: [],
  salaryMin: 0,
  salaryMax: 1_500_000,
  experience: '',
  q: '',
};

const pageSize = 12;

function fmtMoney(n: number | undefined | null) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₸';
}

function formatDate(raw: string | undefined) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
}

function shortText(text: string | undefined, max = 180) {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function VacancyCardSkeleton() {
  return (
    <Card className="p-5 border-slate-200">
      <div className="animate-pulse space-y-3">
        <div className="h-5 w-2/3 bg-slate-200 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
        <div className="h-4 w-1/3 bg-slate-200 rounded" />
        <div className="h-16 w-full bg-slate-100 rounded" />
      </div>
    </Card>
  );
}

type VacancyFiltersFormProps = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  categories: string[];
  cities: string[];
  onApply: () => void;
  onReset: () => void;
};

function VacancyFiltersForm({
  filters,
  setFilters,
  categories,
  cities,
  onApply,
  onReset,
}: VacancyFiltersFormProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Поиск"
        placeholder="Профессия, должность или компания"
        value={filters.q}
        onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
      />
      <Input
        label="Специальность / категория"
        placeholder="Напр. Frontend"
        value={filters.category}
        onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
      />
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Город</p>
        <select
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 outline-none transition focus:border-[#0f2557] focus:ring-2 focus:ring-[#0f2557]/15"
          value={filters.city}
          onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
        >
          <option value="">Любой</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Тип занятости</p>
        <div className="space-y-0.5 text-sm text-slate-700">
          {['Полная', 'Частичная', 'Удалённая'].map((type) => (
            <label
              key={type}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-2 cursor-pointer hover:bg-white/80 transition-colors"
            >
              <input
                type="checkbox"
                className="rounded border-slate-300 text-[#0f2557] focus:ring-[#0f2557]/30"
                checked={filters.workTypes.includes(type)}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    workTypes: e.target.checked ? [type] : prev.workTypes.filter((w) => w !== type),
                  }))
                }
              />
              {type}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Зарплата, ₸</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={filters.salaryMin}
            onChange={(e) => setFilters((f) => ({ ...f, salaryMin: Number(e.target.value) || 0 }))}
          />
          <Input
            type="number"
            value={filters.salaryMax}
            onChange={(e) => setFilters((f) => ({ ...f, salaryMax: Number(e.target.value) || 0 }))}
          />
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Опыт работы</p>
        <div className="space-y-0.5 text-sm text-slate-700">
          {['без опыта', '1-3 года', '3-6 лет', '6+ лет'].map((exp) => (
            <label
              key={exp}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-2 cursor-pointer hover:bg-white/80 transition-colors"
            >
              <input
                type="radio"
                className="border-slate-300 text-[#0f2557] focus:ring-[#0f2557]/30"
                checked={filters.experience === exp}
                onChange={() => setFilters((prev) => ({ ...prev, experience: exp }))}
              />
              {exp}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Популярные категории</p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${
                filters.category === c
                  ? 'bg-[#0f2557] border-[#0f2557] text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, category: c }))}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-stretch">
        <Btn variant="primary" className="!bg-[#0f2557] !border-[#0f2557] flex-1 justify-center" onClick={onApply}>
          Применить
        </Btn>
        <Btn variant="ghost" className="border-slate-200 text-slate-600 hover:bg-white shrink-0 justify-center" onClick={onReset}>
          Сбросить
        </Btn>
      </div>
    </div>
  );
}

export default function CandidateVacanciesPage() {
  const nav = useNavigate();
  const { token, logout } = useAuth();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [applied, setApplied] = useState<Filters>(initialFilters);
  const [list, setList] = useState<CandidateVacancyDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  const [resumeApproved, setResumeApproved] = useState(false);
  const [resumeChecked, setResumeChecked] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const isAuthed = Boolean(token);

  useEffect(() => {
    if (!filterSheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filterSheetOpen]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await candidateApi.getPublicVacancies({
        category: applied.category || undefined,
        city: applied.city || undefined,
        type: applied.workTypes[0] || undefined,
        salaryMin: applied.salaryMin,
        salaryMax: applied.salaryMax,
        experience: applied.experience || undefined,
        q: applied.q || undefined,
        page,
        size: pageSize,
      });
      setList(data.content);
      setTotalPages(data.totalPages || 0);
    } catch {
      setToast({ msg: 'Ошибка загрузки вакансий', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    if (!isAuthed) {
      setResumeApproved(false);
      setResumeChecked(true);
      return;
    }
    // Параллельно: проверяем резюме и загружаем уже отправленные отклики
    Promise.all([
      candidateApi.getResume().catch(() => null),
      candidateApi.getMyApplications().catch(() => []),
    ]).then(([resume, apps]) => {
      if (!alive) return;
      if (resume) setResumeApproved(resume.moderationStatus === 'APPROVED');
      const ids = new Set<number>(
        apps.flatMap((a) => (a.vacancyId != null ? [a.vacancyId] : [])),
      );
      setAppliedIds(ids);
      setResumeChecked(true);
    });
    return () => {
      alive = false;
    };
  }, [isAuthed]);

  const categories = useMemo(
    () => Array.from(new Set(list.map((v) => (v.category ?? v.jobTitle ?? '').trim()).filter(Boolean))).slice(0, 10),
    [list],
  );
  const cities = useMemo(() => Array.from(new Set(list.map((v) => (v.location ?? '').trim()).filter(Boolean))).slice(0, 10), [list]);

  const applyFilters = () => {
    setApplied({ ...filters });
    setPage(0);
    setFilterSheetOpen(false);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setApplied(initialFilters);
    setPage(0);
    setFilterSheetOpen(false);
  };

  const applyVacancy = async (id: number) => {
    if (!isAuthed) {
      nav('/app/login', { replace: true });
      return;
    }
    if (!resumeApproved) {
      setToast({ msg: 'Отклик доступен только после одобрения резюме', type: 'error' });
      return;
    }
    setApplying(id);
    try {
      await candidateApi.apply(id);
      setAppliedIds(prev => new Set(prev).add(id));
      setToast({ msg: 'Отклик отправлен', type: 'success' });
    } catch (e) {
      const st = e instanceof Error ? (e as Error & { status?: number }).status : undefined;
      if (st === 409) {
        setAppliedIds(prev => new Set(prev).add(id));
        setToast({ msg: 'Вы уже откликались на эту вакансию', type: 'error' });
      } else if (st === 400) setToast({ msg: 'Сначала заполните резюме в разделе «Резюме»', type: 'error' });
      else setToast({ msg: 'Не удалось откликнуться', type: 'error' });
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <header className="border-b border-[#0a1f47] bg-[#0f2557] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center gap-3 min-w-0 flex-wrap">
            <Link to="/app" className="font-bold text-xl tracking-tight text-white shrink-0">
              job.kz
            </Link>

            <div className="mx-auto hidden md:flex bg-white/10 rounded-full p-1 text-sm">
              <button
                type="button"
                className="px-4 py-1.5 rounded-full bg-white shadow-sm font-medium text-[#0f2557]"
              >
                Ищу работу
              </button>
              <Link to="/employer" className="px-4 py-1.5 rounded-full text-white/80 hover:text-white whitespace-nowrap">
                Ищу сотрудника
              </Link>
            </div>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 text-xs sm:text-sm shrink-0">
              {isAuthed ? (
                <>
                  <Link
                    className="px-2.5 py-1.5 sm:px-3 rounded-lg border border-white/30 text-white hover:bg-white/10 whitespace-nowrap"
                    to="/app/messages"
                  >
                    Сообщения
                  </Link>
                  <Link
                    className="px-2.5 py-1.5 sm:px-3 rounded-lg border border-white/30 text-white hover:bg-white/10 whitespace-nowrap"
                    to="/app/profile"
                  >
                    Профиль
                  </Link>
                  <button
                    type="button"
                    className="px-2.5 py-1.5 sm:px-3 rounded-lg border border-white/30 text-white hover:bg-white/10 whitespace-nowrap"
                    onClick={() => logout()}
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <Link
                  className="px-2.5 py-1.5 sm:px-3 rounded-lg border border-white/30 text-white hover:bg-white/10"
                  to="/app/login"
                >
                  Войти
                </Link>
              )}
            </div>
          </div>

          <div className="flex md:hidden bg-white/10 rounded-full p-1 text-sm w-full max-w-md mx-auto">
            <span className="flex-1 px-3 py-2 rounded-full bg-white shadow-sm font-medium text-[#0f2557] text-center">
              Ищу работу
            </span>
            <Link
              to="/employer"
              className="flex-1 px-3 py-2 rounded-full text-white/90 hover:text-white text-center"
            >
              Работодатель
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-4 md:p-6 flex-1 min-w-0">
        <div className="mb-3 flex items-center justify-between gap-2 lg:hidden sticky top-0 z-10 -mx-4 px-4 py-2 bg-white/90 backdrop-blur border-b border-slate-200">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-[#0f2557] shadow-sm"
            onClick={() => setFilterSheetOpen(true)}
          >
            Фильтры
          </button>
          <span className="text-xs text-slate-500 truncate">
            {loading ? 'Загрузка…' : `${list.length} на странице`}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-4">
          <aside className="hidden lg:block lg:sticky lg:top-20 self-start">
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
              <div className="bg-[#0f2557] px-4 py-3 border-b border-[#0a1f47]">
                <h2 className="text-base font-semibold text-white">Фильтры</h2>
                <p className="text-xs text-white/70 mt-0.5">Уточните параметры поиска</p>
              </div>
              <div className="p-4 bg-slate-50/60">
                <VacancyFiltersForm
                  filters={filters}
                  setFilters={setFilters}
                  categories={categories}
                  cities={cities}
                  onApply={applyFilters}
                  onReset={resetFilters}
                />
              </div>
            </div>
          </aside>

        <section className="space-y-3 min-w-0">
          {!isAuthed && (
            <Card className="p-3 border-blue-200 bg-blue-50 text-sm text-blue-800">
              Чтобы откликаться, войдите в аккаунт.
            </Card>
          )}
          {isAuthed && resumeChecked && !resumeApproved && (
            <Card className="p-3 border-amber-200 bg-amber-50 text-sm text-amber-800">
              Отклик будет доступен после одобрения вашего резюме.
            </Card>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <VacancyCardSkeleton key={i} />
              ))}
            </div>
          ) : list.length === 0 ? (
            <Card className="p-6 text-sm text-slate-500">Подходящих вакансий нет. Измените фильтры.</Card>
          ) : (
            <div className="space-y-3">
              {list.map(item => {
                const isApplied = appliedIds.has(item.id);
                return (
                  <Card key={item.id} className="p-5 border-slate-200">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg text-slate-900">{item.jobTitle ?? 'Вакансия'}</h3>
                        <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs">🏢</span>
                          {item.aboutCompany ?? 'Компания'}
                        </p>
                        <p className="text-sm text-emerald-700 font-semibold mt-2">{fmtMoney(item.salary)}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                          {item.location && <span className="bg-slate-100 px-2 py-0.5 rounded">{item.location}</span>}
                          {item.workType && <span className="bg-slate-100 px-2 py-0.5 rounded">{item.workType}</span>}
                          {item.experience && <span className="bg-slate-100 px-2 py-0.5 rounded">{item.experience}</span>}
                        </div>
                        <p className="mt-3 text-sm text-slate-600">{shortText(item.aboutVacancy || item.requirements || '')}</p>
                        <p className="mt-2 text-xs text-slate-400">Опубликовано: {formatDate(item.createDate)}</p>
                      </div>
                      <div className="flex shrink-0 sm:justify-end">
                        {isApplied ? (
                          <span className="inline-flex w-full items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-500 border border-slate-200 cursor-default select-none sm:w-auto">
                            Отклик отправлен
                          </span>
                        ) : (
                          <Btn
                            variant="primary"
                            size="sm"
                            className="!bg-[#2557a7] !border-[#2557a7] w-full justify-center sm:w-auto"
                            disabled={applying === item.id || (isAuthed && resumeChecked && !resumeApproved)}
                            onClick={() => applyVacancy(item.id)}
                          >
                            {applying === item.id ? 'Отправка...' : 'Откликнуться'}
                          </Btn>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Btn variant="ghost" size="sm" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                Назад
              </Btn>
              <span className="text-sm text-slate-600">
                Страница {page + 1} из {totalPages}
              </span>
              <Btn variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Вперёд
              </Btn>
            </div>
          )}
        </section>
      </div>

      {filterSheetOpen && (
        <>
          <button
            type="button"
            aria-label="Закрыть фильтры"
            className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
            onClick={() => setFilterSheetOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 flex w-[min(100vw,380px)] flex-col bg-white shadow-2xl lg:hidden pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#0a1f47] bg-[#0f2557] px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-white">Фильтры</h2>
                <p className="text-xs text-white/70 mt-0.5">Уточните параметры поиска</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-2xl leading-none text-white/90 hover:bg-white/10"
                onClick={() => setFilterSheetOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain bg-slate-50/60">
              <VacancyFiltersForm
                filters={filters}
                setFilters={setFilters}
                categories={categories}
                cities={cities}
                onApply={applyFilters}
                onReset={resetFilters}
              />
            </div>
          </div>
        </>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">© job.kz</footer>
    </div>
  );
}
