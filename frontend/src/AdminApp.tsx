import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from './api';
import type { AdminDashboard, AdminNotification } from './types';
import { getStoredToken, decodeJwtPayload, clearStoredToken } from './candidate/auth';
import UsersPage from './pages/UsersPage';
import ResumesPage from './pages/ResumesPage';
import VacanciesPage from './pages/VacanciesPage';
import CompaniesPage from './pages/CompaniesPage';
import DashboardPage from './pages/DashboardPage';
import AuditPage from './pages/AuditPage';
import { Client, type IMessage } from '@stomp/stompjs';
import * as SockJSImport from 'sockjs-client';

type SockCtor = new (url: string) => WebSocket;
const SockJS = ((SockJSImport as unknown as { default?: SockCtor }).default
  ?? (SockJSImport as unknown as SockCtor));

const ROUTE_LABELS: Record<string, string> = {
  '/admin/dashboard': 'Дашборд',
  '/admin/users': 'Пользователи',
  '/admin/companies': 'Компании',
  '/admin/resumes': 'Резюме',
  '/admin/vacancies': 'Вакансии',
  '/admin/audit': 'Audit Log',
};

type NavDef = {
  to: string;
  label: string;
  icon: string;
  pendingField?: keyof Pick<AdminDashboard, 'pendingCompanies' | 'pendingResumes' | 'pendingVacancies'>;
};

const NAV: NavDef[] = [
  { to: '/admin/dashboard', label: 'Дашборд', icon: '📊' },
  { to: '/admin/users', label: 'Пользователи', icon: '👤' },
  { to: '/admin/companies', label: 'Компании', icon: '🏢', pendingField: 'pendingCompanies' },
  { to: '/admin/resumes', label: 'Резюме', icon: '📄', pendingField: 'pendingResumes' },
  { to: '/admin/vacancies', label: 'Вакансии', icon: '💼', pendingField: 'pendingVacancies' },
  { to: '/admin/audit', label: 'Audit Log', icon: '🧾' },
];

function AdminShell() {
  const loc = useLocation();
  const nav = useNavigate();
  const crumb = ROUTE_LABELS[loc.pathname] ?? 'Админ';
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openNotifications, setOpenNotifications] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { nav('/app/login', { replace: true }); return; }
    const payload = decodeJwtPayload(token);
    if (payload?.role !== 'ADMIN') { nav('/app/login', { replace: true }); }
  }, [nav]);

  const reloadStats = useCallback(() => {
    api.dashboard
      .get()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    reloadStats();
  }, [reloadStats, loc.pathname]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    let client: Client | null = null;
    client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 4000,
      onConnect: () => {
        client?.subscribe('/topic/admin-notifications', (frame: IMessage) => {
          try {
            const next = JSON.parse(frame.body) as AdminNotification;
            setNotifications((prev) => [next, ...prev].slice(0, 20));
            setUnreadCount((c) => c + 1);
          } catch {
            // ignore broken frame
          }
        });
      },
    });
    client.activate();
    return () => {
      client?.deactivate();
    };
  }, []);

  useEffect(() => {
    setOpenNotifications(false);
  }, [loc.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-[#0f2557] flex flex-col fixed h-full">
        <div className="px-5 py-5 border-b border-[#1a3570]">
          <div className="flex items-center gap-2.5">
            <div>
              <div className="font-bold text-xl tracking-tight text-white leading-tight">job.kz</div>
              <div className="text-xs text-blue-300 mt-0.5">Admin Panel</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <div className="text-xs font-semibold text-blue-300/70 uppercase tracking-wider px-3 mb-2">Разделы</div>
          {NAV.map(n => {
            const pending =
              n.pendingField && stats ? stats[n.pendingField] : 0;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5
                  ${isActive
                    ? 'bg-white/15 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'}`
                }
              >
                <span className="relative inline-flex text-base leading-none">
                  <span>{n.icon}</span>
                  {pending > 0 && (
                    <span
                      className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold flex items-center justify-center leading-none shadow-sm"
                      title={`На проверке: ${pending}`}
                    >
                      {pending > 99 ? '99+' : pending}
                    </span>
                  )}
                </span>
                <span className="flex-1 text-left">{n.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1a3570] space-y-2">
          <button
            type="button"
            onClick={() => { clearStoredToken(); nav('/app/login', { replace: true }); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Выйти
          </button>
          <div className="text-xs text-blue-300/50">Spring Boot 3.3.1 · localhost:8080</div>
        </div>
      </aside>

      <main className="flex-1 ml-60">
        <header className="bg-[#0f2557] border-b border-[#1a3570] px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-300">job.kz</span>
              <span className="text-blue-400/60">/</span>
              <span className="text-white font-medium">{crumb}</span>
            </div>
            <div className="relative">
              <button
                type="button"
                className="w-9 h-9 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white relative transition-colors"
                onClick={() => {
                  setOpenNotifications((v) => !v);
                  setUnreadCount(0);
                }}
                title="Уведомления"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {openNotifications && (
                <div className="absolute right-0 mt-2 w-[360px] max-h-[420px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-20">
                  <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Последние уведомления
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-sm text-slate-500 text-center">Пока нет уведомлений</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((n, idx) => (
                        <div key={`${n.createdAt}-${n.type}-${n.entityId ?? 'null'}-${idx}`} className="px-3 py-2">
                          <div className="text-xs text-slate-400">
                            {new Date(n.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'medium' })}
                          </div>
                          <div className="text-sm text-slate-800 mt-0.5">{n.message}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {n.type}{n.entityId != null ? ` · #${n.entityId}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl">
          <Outlet context={{ stats, reloadStats }} />
        </div>
      </main>
    </div>
  );
}

export default function AdminApp() {
  return (
    <Routes>
      <Route path="/" element={<AdminShell />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="admin/dashboard" element={<DashboardPage />} />
        <Route path="admin/users" element={<UsersPage />} />
        <Route path="admin/companies" element={<CompaniesPage />} />
        <Route path="admin/resumes" element={<ResumesPage />} />
        <Route path="admin/vacancies" element={<VacanciesPage />} />
        <Route path="admin/audit" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}
