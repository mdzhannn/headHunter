import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Btn, Card, Input, Toast } from '../components/ui';
import { candidateAuth } from './auth';
import { PasswordStrength, evaluatePasswordStrength } from './PasswordStrength';

export default function CandidateForgotPasswordPage() {
  const OTP_LENGTH = 6;
  const nav = useNavigate();
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [loading, setLoading] = useState(false);
  const [retryInSec, setRetryInSec] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });
  const otpCode = otp.join('');
  const passwordState = evaluatePasswordStrength(newPassword);
  const canSubmitPassword = passwordState.score >= 2;

  useEffect(() => {
    if (!retryInSec) return undefined;
    const timerId = window.setInterval(() => setRetryInSec((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => window.clearInterval(timerId);
  }, [retryInSec]);

  const sendOtp = async () => {
    if (!email.trim()) return notify('Введите email', 'error');
    setLoading(true);
    try {
      await candidateAuth.sendPasswordResetOtp(email.trim());
      setStep('otp');
      setOtp(Array(OTP_LENGTH).fill(''));
      setRetryInSec(59);
      notify('Код отправлен на email');
      window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch (e) {
      const status = e instanceof Error ? (e as Error & { status?: number }).status : undefined;
      if (status === 404) notify('Аккаунт с таким email не найден', 'error');
      else if (status === 429) notify('Слишком много запросов. Подождите ~10 минут', 'error');
      else notify('Не удалось отправить код', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== OTP_LENGTH) return notify('Введите код из письма', 'error');
    setLoading(true);
    try {
      await candidateAuth.verifyPasswordResetOtp(email.trim(), otpCode);
      setStep('password');
      notify('Код подтверждён. Теперь задайте новый пароль');
    } catch {
      notify('Неверный или просроченный код', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!canSubmitPassword) return notify('Новый пароль должен быть не ниже среднего', 'error');
    setLoading(true);
    try {
      await candidateAuth.resetPassword(email.trim(), newPassword);
      notify('Пароль обновлён');
      nav('/app/login', { replace: true });
    } catch {
      notify('Не удалось обновить пароль', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, rawValue: string) => {
    const value = rawValue.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
    if (!digits.length) return;
    const next = Array(OTP_LENGTH).fill('');
    digits.forEach((digit, idx) => {
      next[idx] = digit;
    });
    setOtp(next);
    otpRefs.current[Math.min(digits.length - 1, OTP_LENGTH - 1)]?.focus();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-md border-slate-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#2557a7] text-white font-bold text-lg flex items-center justify-center mx-auto mb-3">hh</div>
          <h1 className="text-xl font-semibold text-slate-900">Сброс пароля</h1>
          <p className="text-sm text-slate-500 mt-1">
            {step === 'email' && 'Введите email для получения кода'}
            {step === 'otp' && 'Подтвердите email кодом из письма'}
            {step === 'password' && 'Введите новый пароль'}
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || step !== 'email'}
            autoComplete="email"
          />

          {step === 'email' && (
            <Btn
              variant="primary"
              className="w-full !bg-[#2557a7] !border-[#2557a7] hover:!bg-[#1f4a91]"
              onClick={sendOtp}
              disabled={loading || !email.trim()}
            >
              Получить код
            </Btn>
          )}

          {step === 'otp' && (
            <>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Код из письма</p>
                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      className="h-12 rounded-lg border border-slate-300 text-center text-lg outline-none focus:border-[#2557a7] focus:ring-2 focus:ring-blue-100"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      autoComplete="one-time-code"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>
              <div className="text-sm text-slate-500">
                {retryInSec > 0 ? (
                  <span>Повторить через {retryInSec}с</span>
                ) : (
                  <button type="button" className="text-[#2557a7] hover:underline" onClick={sendOtp} disabled={loading}>
                    Отправить код повторно
                  </button>
                )}
              </div>
              <Btn
                variant="primary"
                className="w-full !bg-[#2557a7] !border-[#2557a7] hover:!bg-[#1f4a91]"
                onClick={verifyOtp}
                disabled={loading || otpCode.length < OTP_LENGTH}
              >
                Подтвердить код
              </Btn>
            </>
          )}

          {step === 'password' && (
            <>
              <Input
                label="Новый пароль"
                type="password"
                placeholder="Минимум 8 символов, A-Z и цифра"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
              <PasswordStrength value={newPassword} />
              <Btn
                variant="primary"
                className="w-full !bg-[#2557a7] !border-[#2557a7] hover:!bg-[#1f4a91]"
                onClick={resetPassword}
                disabled={loading || !canSubmitPassword}
              >
                Сохранить новый пароль
              </Btn>
            </>
          )}

          <p className="text-sm text-slate-500 text-center">
            Вспомнили пароль?{' '}
            <Link to="/app/login" className="text-[#2557a7] hover:underline">
              Вернуться ко входу
            </Link>
          </p>
        </div>
      </Card>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
