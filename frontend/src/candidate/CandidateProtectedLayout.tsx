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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !token) nav('/app/login', { replace: true });
  }, [isLoading, token, nav]);

  useEffect(() => {
    setMobileNavOpen(false);
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

  const drawerLinkCls = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
      isActive ? 'bg-white text-[#0f2557]' : 'text-white/90 hover:bg-white/10'
    }`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-[#0a1f47] bg-[#0f2557] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 min-w-0">
          {!employerMessagesOnly && (
            <button
              type="button"
              aria-label="Открыть меню"
              className="md:hidden shrink-0 inline-flex flex-col justify-center gap-1.5 p-2 rounded-lg border border-white/30 text-white hover:bg-white/10"
              onClick={() => setMobileNavOpen(true)}
            >
              <span className="block h-0.5 w-5 bg-current rounded" />
              <span className="block h-0.5 w-5 bg-current rounded" />
              <span className="block h-0.5 w-5 bg-current rounded" />
            </button>
          )}
          <NavLink
            to="/app"
            className="font-bold text-xl tracking-tight text-white shrink-0 min-w-0 truncate"
            onClick={() => setMobileNavOpen(false)}
          >
            job.kz
          </NavLink>
          <nav
            className={`mx-auto bg-white/10 rounded-full p-1 text-sm min-w-0 ${
              employerMessagesOnly ? 'flex flex-wrap justify-center flex-1' : 'hidden md:flex'
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
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-sm text-white/80">📍 Алматы</span>
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                logout();
              }}
              className="px-3 py-1.5 rounded-lg text-sm text-white border border-white/30 hover:bg-white/10 whitespace-nowrap"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {!employerMessagesOnly && (
        <>
          <button
            type="button"
            aria-hidden={!mobileNavOpen}
            className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity ${
              mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setMobileNavOpen(false)}
          />
          <aside
            className={`fixed top-0 left-0 bottom-0 z-50 w-[min(288px,85vw)] bg-[#0c214f] border-r border-white/10 shadow-xl md:hidden transition-transform duration-200 ease-out flex flex-col pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-4 ${
              mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="font-semibold text-white">Меню</span>
              <button
                type="button"
                aria-label="Закрыть меню"
                className="p-2 rounded-lg text-white/80 hover:bg-white/10 text-xl leading-none"
                onClick={() => setMobileNavOpen(false)}
              >
                ×
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3 overflow-y-auto">
              <NavLink to="/app/vacancies" className={drawerLinkCls} onClick={() => setMobileNavOpen(false)}>
                Вакансии
              </NavLink>
              <NavLink to="/app/profile" className={drawerLinkCls} onClick={() => setMobileNavOpen(false)}>
                Профиль
              </NavLink>
              <NavLink to="/app/messages" className={drawerLinkCls} onClick={() => setMobileNavOpen(false)}>
                <span className="relative inline-block pr-6">
                  Сообщения
                  {unreadTotal > 0 && (
                    <span className="absolute top-1/2 -translate-y-1/2 right-0 min-w-[1.25rem] h-[1.25rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold inline-flex items-center justify-center leading-none">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
                    </span>
                  )}
                </span>
              </NavLink>
            </nav>
          </aside>
        </>
      )}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        © job.kz
      </footer>
    </div>
  );
}
