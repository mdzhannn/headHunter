import { useState } from 'react';
import { api } from '../api';
import { Btn, Input, Card, SectionHeader, Toast } from '../components/ui';

export default function EmailPage() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  const [msg, setMsg] = useState({ email: '', message: '' });
  const [code, setCode] = useState({ email: '' });
  const [verify, setVerify] = useState({ email: '', code: '' });
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  const handleSendMsg = async () => {
    try { await api.email.sendMessage(msg.email, msg.message); notify('Сообщение отправлено'); setMsg({ email: '', message: '' }); }
    catch { notify('Ошибка отправки', 'error'); }
  };

  const handleSendCode = async () => {
    try { await api.email.sendCode(code.email); notify('Код отправлен на ' + code.email); setCode({ email: '' }); }
    catch { notify('Ошибка', 'error'); }
  };

  const handleVerify = async () => {
    try {
      const result = await api.email.verify(verify.email, verify.code);
      setVerifyResult(result ? '✓ Код подтверждён' : '✕ Неверный код');
    } catch { notify('Ошибка проверки', 'error'); }
  };

  return (
    <div>
      <SectionHeader title="Уведомления" subtitle="Email-сервис (заглушка)" />

      <div className="grid gap-4 max-w-2xl">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">✉</span>
            Отправить сообщение
          </h3>
          <div className="grid gap-3">
            <Input label="Email" type="email" value={msg.email} onChange={e => setMsg(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Сообщение</label>
              <textarea value={msg.message} onChange={e => setMsg(f => ({ ...f, message: e.target.value }))}
                rows={3} placeholder="Текст сообщения..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder-slate-400" />
            </div>
            <Btn variant="primary" onClick={handleSendMsg} className="w-fit">Отправить</Btn>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center text-xs">#</span>
            Отправить код
          </h3>
          <div className="flex gap-3">
            <Input label="Email" type="email" value={code.email} onChange={e => setCode({ email: e.target.value })} placeholder="user@example.com" className="flex-1" />
            <div className="flex items-end">
              <Btn variant="primary" onClick={handleSendCode}>Отправить код</Btn>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">✓</span>
            Проверить код
          </h3>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email" type="email" value={verify.email} onChange={e => setVerify(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
              <Input label="Код" value={verify.code} onChange={e => setVerify(f => ({ ...f, code: e.target.value }))} placeholder="123456" />
            </div>
            <div className="flex items-center gap-4">
              <Btn variant="primary" onClick={handleVerify}>Проверить</Btn>
              {verifyResult && (
                <span className={`text-sm font-medium ${verifyResult.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {verifyResult}
                </span>
              )}
            </div>
          </div>
        </Card>

        <div className="text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
          ⚠ Сервис уведомлений работает в режиме заглушки — сообщения пишутся в консоль сервера, verify всегда возвращает true.
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
