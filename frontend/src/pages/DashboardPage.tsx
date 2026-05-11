import { NavLink, useOutletContext } from 'react-router-dom';
import type { AdminDashboard } from '../types';
import { Card, SectionHeader, Spinner } from '../components/ui';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type OutletCtx = { stats: AdminDashboard | null; reloadStats: () => void };

function Num({ n }: { n: number }) {
  return <span className="text-2xl font-semibold tabular-nums text-slate-900">{n.toLocaleString('ru-RU')}</span>;
}

export default function DashboardPage() {
  const { stats } = useOutletContext<OutletCtx>();

  if (!stats) {
    return (
      <div>
        <SectionHeader title="Дашборд" subtitle="Загрузка статистики…" />
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Дашборд"
        subtitle="Обзор и очередь на модерацию"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Пользователи</div>
          <Num n={stats.totalUsers} />
          <NavLink to="/admin/users" className="text-xs text-indigo-600 hover:text-indigo-800 mt-2 inline-block font-medium">
            Раздел →
          </NavLink>
        </Card>
        <Card className="p-5 border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Компании</div>
          <Num n={stats.totalCompanies} />
          <div className="text-xs text-amber-700 mt-1.5 font-medium">
            На проверке: {stats.pendingCompanies.toLocaleString('ru-RU')}
          </div>
          <NavLink to="/admin/companies" className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 inline-block font-medium">
            Раздел →
          </NavLink>
        </Card>
        <Card className="p-5 border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Резюме</div>
          <Num n={stats.totalResumes} />
          <div className="text-xs text-amber-700 mt-1.5 font-medium">
            На проверке: {stats.pendingResumes.toLocaleString('ru-RU')}
          </div>
          <NavLink to="/admin/resumes" className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 inline-block font-medium">
            Раздел →
          </NavLink>
        </Card>
        <Card className="p-5 border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Вакансии</div>
          <Num n={stats.totalVacancies} />
          <div className="text-xs text-amber-700 mt-1.5 font-medium">
            На проверке: {stats.pendingVacancies.toLocaleString('ru-RU')}
          </div>
          <NavLink to="/admin/vacancies" className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 inline-block font-medium">
            Раздел →
          </NavLink>
        </Card>
      </div>

      <h3 className="text-sm font-semibold text-slate-700 mb-3">Очередь модерации</h3>
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-4 flex items-center justify-between border-amber-100 bg-amber-50/50">
          <div>
            <div className="text-sm font-medium text-slate-800">Компании</div>
            <div className="text-xs text-slate-500">ожидают решения</div>
          </div>
          <span className="text-xl font-bold text-amber-800 tabular-nums">{stats.pendingCompanies}</span>
        </Card>
        <Card className="p-4 flex items-center justify-between border-amber-100 bg-amber-50/50">
          <div>
            <div className="text-sm font-medium text-slate-800">Резюме</div>
            <div className="text-xs text-slate-500">ожидают решения</div>
          </div>
          <span className="text-xl font-bold text-amber-800 tabular-nums">{stats.pendingResumes}</span>
        </Card>
        <Card className="p-4 flex items-center justify-between border-amber-100 bg-amber-50/50">
          <div>
            <div className="text-sm font-medium text-slate-800">Вакансии</div>
            <div className="text-xs text-slate-500">ожидают решения</div>
          </div>
          <span className="text-xl font-bold text-amber-800 tabular-nums">{stats.pendingVacancies}</span>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-8">
        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">Регистрации за 30 дней</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.registrationsByDay ?? []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    if (Number.isNaN(d.getTime())) return value;
                    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
                  }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [Number(value ?? 0), 'Регистрации']}
                  labelFormatter={(label) => {
                    const d = new Date(label);
                    if (Number.isNaN(d.getTime())) return label;
                    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
                  }}
                />
                <Line type="monotone" dataKey="count" name="Регистрации" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">Воронка откликов</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { stage: 'Всего', value: stats.applicationFunnel?.total ?? 0 },
                  { stage: 'Рассмотрено', value: stats.applicationFunnel?.reviewed ?? 0 },
                  { stage: 'Принято', value: stats.applicationFunnel?.accepted ?? 0 },
                  { stage: 'Отклонено', value: stats.applicationFunnel?.rejected ?? 0 },
                ]}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [Number(value ?? 0), 'Отклики']} />
                <Legend />
                <Bar dataKey="value" name="Кол-во" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-4 mt-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">Топ работодателей по вакансиям</div>
        {stats.topEmployers && stats.topEmployers.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {stats.topEmployers.map((e, idx) => (
              <div key={`${e.employerName}-${idx}`} className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
                <div className="text-xs text-slate-500 truncate">{e.employerName}</div>
                <div className="text-lg font-semibold text-slate-900">{e.count}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">Пока нет данных</div>
        )}
      </Card>
    </div>
  );
}
