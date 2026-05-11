import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Btn } from '../components/ui';
import { decodeJwtPayload } from './auth';
import { useAuth } from './AuthContext';
import { candidateApi } from './candidateApi';

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
    isActive ? 'bg-white text-[#2557a7] shadow-sm' : 'text-slate-600 hover:bg-slate-200'
  }`;

export default function CandidateProtectedLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const { token, isLoading, logout } = useAuth();
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    if (!isLoading && !token) nav('/app/login', { replace: true });
  }, [isLoading, token, nav]);

  useEffect(() => {
    let alive = true;
    const load = () => {
      candidateApi.getUnreadTotal().then((r) => {
        if (alive) setUnreadTotal(r.total);
      }).catch(() => {});
    };
    load();
    const id = setInterval(load, 20_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [location.pathname]);

  useEffect(() => {
    const onRefresh = () => {
      candidateApi.getUnreadTotal().then((r) => setUnreadTotal(r.total)).catch(() => {});
    };
    window.addEventListener('hh:conversations-changed', onRefresh);
    return () => window.removeEventListener('hh:conversations-changed', onRefresh);
  }, []);

  if (isLoading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Проверка входа…
      </div>
    );
  }

  // Pure employers have no candidate data — send them to their portal
  const jwtRole = (decodeJwtPayload(token)?.role as string | undefined) ?? '';
  if (jwtRole === 'EMPLOYER') {
    return <Navigate to="/employer" replace />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <NavLink to="/app" className="font-bold text-xl tracking-tight text-[#2557a7]">
            hh.kz
          </NavLink>
          <nav className="mx-auto bg-slate-100 rounded-full p-1 text-sm hidden md:flex">
            <NavLink to="/app/vacancies" className={linkCls}>
              Вакансии
            </NavLink>
            <NavLink to="/app/profile" className={linkCls}>
              Профиль
            </NavLink>
            <NavLink to="/app/messages" className={linkCls}>
              <span className="relative pr-3">
                Сообщения
                {unreadTotal > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {unreadTotal > 99 ? '99+' : unreadTotal}
                  </span>
                )}
              </span>
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-slate-600">📍 Алматы</span>
            <Btn variant="ghost" size="sm" onClick={logout}>
              Выйти
            </Btn>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        © hh.kz clone
      </footer>
    </div>
  );
}
