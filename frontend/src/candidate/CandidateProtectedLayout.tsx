import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { decodeJwtPayload } from './auth';
import { useAuth } from './AuthContext';
import { candidateApi } from './candidateApi';

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
    isActive ? 'bg-white text-[#0f2557] shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
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

  const jwtRole = (decodeJwtPayload(token)?.role as string | undefined) ?? '';
  const employerMessagesOnly =
    jwtRole === 'EMPLOYER' &&
    (location.pathname === '/app/messages' || location.pathname.startsWith('/app/messages/'));
  if (jwtRole === 'EMPLOYER' && !employerMessagesOnly) {
    return <Navigate to="/employer" replace />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-[#0a1f47] bg-[#0f2557] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <NavLink to="/app" className="font-bold text-xl tracking-tight text-white">
            job.kz
          </NavLink>
          <nav
            className={`mx-auto bg-white/10 rounded-full p-1 text-sm ${
              employerMessagesOnly ? 'flex flex-wrap justify-center' : 'hidden md:flex'
            }`}
          >
            {employerMessagesOnly ? (
              <>
                <NavLink to="/employer" className={linkCls}>
                  Кабинет работодателя
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
              </>
            ) : (
              <>
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
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-white/80">📍 Алматы</span>
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 rounded-lg text-sm text-white border border-white/30 hover:bg-white/10"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        © job.kz
      </footer>
    </div>
  );
}
