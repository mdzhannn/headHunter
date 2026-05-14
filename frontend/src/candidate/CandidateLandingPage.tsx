import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import DotMatrixBackground from '../components/DotMatrixBackground';
import { candidateApi, type CandidateVacancyDto } from './candidateApi';
import { useAuth } from './AuthContext';

type DashboardStats = {
  totalResumes: number;
  totalVacancies: number;
  totalCompanies: number;
};

type PopularCategory = {
  name: string;
  vacanciesCount: number;
  salaryFrom: number;
  salaryTo: number;
};

const hhBlue = '#2557a7';

function formatCount(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function formatSalary(value: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₸`;
}

function normalizeTitle(v: CandidateVacancyDto): string {
  return (v.jobTitle ?? '').trim();
}

function groupCategories(vacancies: CandidateVacancyDto[]): PopularCategory[] {
  const bucket = new Map<string, { count: number; salaries: number[] }>();
  for (const vacancy of vacancies) {
    const category = normalizeTitle(vacancy) || 'Другое';
    const prev = bucket.get(category) ?? { count: 0, salaries: [] };
    prev.count += 1;
    if (typeof vacancy.salary === 'number' && vacancy.salary > 0) {
      prev.salaries.push(vacancy.salary);
    }
    bucket.set(category, prev);
  }

  return Array.from(bucket.entries())
    .map(([name, value]) => {
      const salaryFrom = value.salaries.length ? Math.min(...value.salaries) : 0;
      const salaryTo = value.salaries.length ? Math.max(...value.salaries) : 0;
      return { name, vacanciesCount: value.count, salaryFrom, salaryTo };
    })
    .sort((a, b) => b.vacanciesCount - a.vacanciesCount);
}

function StatSkeleton() {
  return <div className="h-16 rounded-xl bg-white/15 animate-pulse" />;
}

export default function CandidateLandingPage() {
  const { token, logout } = useAuth();
  const resumeHref = token ? '/app/profile' : '/app/signup';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vacancies, setVacancies] = useState<CandidateVacancyDto[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    api.dashboard
      .get()
      .then((data) => {
        if (!alive) return;
        setStats({
          totalResumes: data.totalResumes ?? 0,
          totalVacancies: data.totalVacancies ?? 0,
          totalCompanies: data.totalCompanies ?? 0,
        });
      })
      .catch(() => {
        if (alive) setStats({ totalResumes: 0, totalVacancies: 0, totalCompanies: 0 });
      })
      .finally(() => {
        if (alive) setIsStatsLoading(false);
      });

    candidateApi
      .getPublicVacancies({ page: 0, size: 120 })
      .then((data) => {
        if (alive) setVacancies(data.content);
      })
      .catch(() => {
        if (alive) setVacancies([]);
      })
      .finally(() => {
        if (alive) setIsCategoriesLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => groupCategories(vacancies), [vacancies]);
  const visibleCategories = expanded ? categories : categories.slice(0, 8);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-3 min-w-0">
            <div className="font-bold text-xl tracking-tight text-[#2557a7] shrink-0">job.kz</div>

            <div className="mx-auto bg-slate-100 rounded-full p-1 text-sm inline-flex shrink-0 min-w-0">
              <button className="px-4 py-1.5 rounded-full bg-white shadow-sm font-medium text-[#2557a7] whitespace-nowrap">
                Ищу работу
              </button>
              <Link
                to="/employer"
                className="px-4 py-1.5 rounded-full text-slate-600 hover:text-slate-900 whitespace-nowrap"
              >
                Ищу сотрудника
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3 text-sm shrink-0 flex-wrap justify-end">
              <span className="hidden lg:inline text-slate-600">📍 Алматы</span>
              {token ? (
                <>
                  <Link to="/app/messages" className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50">
                    Сообщения
                  </Link>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50"
                    onClick={() => logout()}
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <Link to="/app/login" className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50">
                  Войти
                </Link>
              )}
              <Link
                to={resumeHref}
                className="px-3 py-1.5 rounded-lg text-white font-medium whitespace-nowrap"
                style={{ backgroundColor: hhBlue }}
              >
                {token ? 'Создать резюме' : 'Регистрация'}
              </Link>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="font-bold text-xl tracking-tight text-[#2557a7] truncate shrink min-w-0">job.kz</div>
              <Link
                to={resumeHref}
                className="px-3 py-2 rounded-lg text-white font-medium text-sm shrink-0 whitespace-nowrap"
                style={{ backgroundColor: hhBlue }}
              >
                {token ? 'Резюме' : 'Регистрация'}
              </Link>
            </div>
            <div className="bg-slate-100 rounded-full p-1 text-sm flex w-full max-w-md mx-auto">
              <button
                type="button"
                className="flex-1 px-3 py-2 rounded-full bg-white shadow-sm font-medium text-[#2557a7] text-center"
              >
                Ищу работу
              </button>
              <Link
                to="/employer"
                className="flex-1 px-3 py-2 rounded-full text-slate-600 hover:text-slate-900 text-center"
              >
                Работодатель
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-between text-sm">
              <span className="text-slate-500 text-xs shrink-0">📍 Алматы</span>
              <div className="flex flex-wrap gap-2 justify-end min-w-0">
                {token ? (
                  <>
                    <Link to="/app/messages" className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50">
                      Сообщения
                    </Link>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50"
                      onClick={() => logout()}
                    >
                      Выйти
                    </button>
                  </>
                ) : (
                  <Link to="/app/login" className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50">
                    Войти
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-center bg-cover"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1900&q=80)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-[rgb(2,6,23)]/78 via-slate-950/55 to-[rgb(15,23,42)]/70"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 z-[2] min-h-0">
          <DotMatrixBackground rgb="0,180,80" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
            <div className="space-y-4">
              <h1 className="text-2xl md:text-4xl font-bold text-white max-w-2xl">Работа найдётся для каждого</h1>

              {isStatsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
                  <StatSkeleton />
                  <StatSkeleton />
                  <StatSkeleton />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
                  <div className="rounded-xl p-4 bg-white/10 border border-white/20">
                    <p className="text-white/70 text-xs uppercase">Резюме</p>
                    <p className="text-white text-2xl font-semibold">{formatCount(stats?.totalResumes ?? 0)}</p>
                  </div>
                  <div className="rounded-xl p-4 bg-white/10 border border-white/20">
                    <p className="text-white/70 text-xs uppercase">Вакансии</p>
                    <p className="text-white text-2xl font-semibold">{formatCount(stats?.totalVacancies ?? 0)}</p>
                  </div>
                  <div className="rounded-xl p-4 bg-white/10 border border-white/20">
                    <p className="text-white/70 text-xs uppercase">Компании</p>
                    <p className="text-white text-2xl font-semibold">{formatCount(stats?.totalCompanies ?? 0)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 w-full md:w-52">
              {['App Store', 'Google Play', 'AppGallery'].map((store) => (
                <div key={store} className="rounded-xl bg-black/55 border border-white/25 px-4 py-3 text-white text-sm">
                  {store}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 bg-white rounded-2xl shadow-xl p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2557a7] focus:ring-2 focus:ring-blue-100"
                placeholder="Профессия, должность или компания"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="button"
                className="h-12 w-12 shrink-0 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                ⚙️
              </button>
              <Link
                to={`/app/vacancies${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`}
                className="h-12 px-6 rounded-xl text-white font-medium inline-flex items-center justify-center"
                style={{ backgroundColor: hhBlue }}
              >
                Найти
              </Link>
            </div>
            <div className="mt-3">
              <Link to="/employer" className="text-sm text-[#2557a7] hover:underline">
                Я ищу сотрудника
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold mb-5">⚡ Популярное</h2>

        {isCategoriesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl border border-slate-200 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {visibleCategories.map((item) => (
                <article key={item.name} className="border border-slate-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm">
                  <h3
                    className="font-semibold text-slate-900 min-h-[3rem]"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {item.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2">
                    {item.salaryFrom > 0 && item.salaryTo > 0
                      ? `${formatSalary(item.salaryFrom)} - ${formatSalary(item.salaryTo)}`
                      : 'Зарплата не указана'}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">{item.vacanciesCount} вакансий</p>
                </article>
              ))}
            </div>

            {categories.length > 8 && (
              <div className="mt-5">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
                  onClick={() => setExpanded((prev) => !prev)}
                >
                  {expanded ? 'Свернуть' : 'Развернуть'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
