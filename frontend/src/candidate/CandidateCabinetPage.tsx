import { NavLink } from 'react-router-dom';
import { useMemo } from 'react';
import { Card, Btn } from '../components/ui';
import { decodeJwtPayload } from './auth';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CandidateCabinetPage() {
  const nav = useNavigate();
  const { token, logout } = useAuth();

  const claims = useMemo(() => (token ? decodeJwtPayload(token) : null), [token]);
  const phone = typeof claims?.phone === 'string' ? claims.phone : '—';

  const onLogout = () => {
    logout();
    nav('/app/login', { replace: true });
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 mb-2">Личный кабинет</h1>
      <p className="text-sm text-slate-500 mb-6">Вы вошли как {phone}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-5 border-slate-200 hover:border-indigo-200 transition-colors">
          <NavLink to="/app/resume" className="block">
            <div className="font-medium text-slate-900">Резюме</div>
            <p className="text-xs text-slate-500 mt-1">Заполнить данные, статус модерации</p>
          </NavLink>
        </Card>
        <Card className="p-5 border-slate-200 hover:border-indigo-200 transition-colors">
          <NavLink to="/app/vacancies" className="block">
            <div className="font-medium text-slate-900">Вакансии</div>
            <p className="text-xs text-slate-500 mt-1">Поиск и отклики на одобренные вакансии</p>
          </NavLink>
        </Card>
      </div>

      <div className="mt-8">
        <Btn variant="ghost" size="sm" onClick={onLogout}>
          Выйти из аккаунта
        </Btn>
      </div>
    </div>
  );
}
