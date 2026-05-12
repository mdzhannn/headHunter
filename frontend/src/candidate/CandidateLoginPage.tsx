import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Btn, Input, Card, Toast } from '../components/ui';
import { useAuth } from './AuthContext';

export default function CandidateLoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  const handleLogin = async () => {
    if (!email.trim()) return notify('Введите email', 'error');
    if (!password.trim()) return notify('Введите пароль', 'error');
    setLoading(true);
    try {
      const role = await login(email.trim(), password);
      notify('Вход выполнен');
      if (role === 'ADMIN') {
        nav('/admin/dashboard', { replace: true });
      } else if (role === 'EMPLOYER') {
        nav('/employer', { replace: true });
      } else {
        nav('/app/register', { replace: true });
      }
    } catch (e) {
      const status = e instanceof Error ? (e as Error & { status?: number }).status : undefined;
      if (status === 400) notify('Проверьте email и пароль', 'error');
      else if (status === 401) notify('Неверный email или пароль', 'error');
      else if (status === 403) notify('Аккаунт заблокирован', 'error');
      else notify('Не удалось войти', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-md border-slate-200">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-[#2557a7] text-white font-bold text-base flex items-center justify-center mx-auto mb-3 tracking-tight">
            job.kz
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Вход</h1>
          <p className="text-sm text-slate-500 mt-1">Войдите по email и паролю</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Email"
            placeholder="example@gmail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <Input
            label="Пароль"
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <div className="text-right -mt-2">
            <Link to="/app/forgot-password" className="text-sm text-[#2557a7] hover:underline">
              Забыли пароль?
            </Link>
          </div>
          <Btn variant="primary" className="w-full !bg-[#2557a7] !border-[#2557a7] hover:!bg-[#1f4a91] justify-center" onClick={handleLogin} disabled={loading || !email.trim() || !password.trim()}>
            {loading ? 'Вход...' : 'Войти'}
          </Btn>
          <p className="text-sm text-slate-500 text-center">
            Нет аккаунта?{' '}
            <Link to="/app/signup" className="text-[#2557a7] hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </Card>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
