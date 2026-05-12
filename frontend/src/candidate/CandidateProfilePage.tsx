import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ModerationStatus } from '../types';
import { Badge, Btn, Card, Input, PhoneInput, Spinner, Toast } from '../components/ui';
import SentResumeDetails from '../components/SentResumeDetails';
import { candidateApi, type CandidateApplicationItemDto, type CandidateResumeDto, type ConversationListItemDto } from './candidateApi';

function PhotoUpload({ value, onChange }: { value?: string | null; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Файл слишком большой. Максимум 5 МБ.'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') onChange(reader.result); };
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 overflow-hidden cursor-pointer hover:border-[#0f2557] transition-colors flex items-center justify-center bg-slate-50 shrink-0"
        onClick={() => inputRef.current?.click()}
      >
        {value
          ? <img src={value} alt="Фото" className="w-full h-full object-cover" />
          : <span className="text-2xl">👤</span>}
      </div>
      <div>
        <button type="button" className="text-sm text-[#0f2557] hover:underline font-medium" onClick={() => inputRef.current?.click()}>
          {value ? 'Изменить фото' : 'Добавить фото'}
        </button>
        <p className="text-xs text-slate-400 mt-0.5">JPG, PNG или WebP · до 5 МБ</p>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
}

type TabId = 'resume' | 'applications';

function modLabel(s: ModerationStatus | undefined): string {
  if (s === 'APPROVED') return 'Одобрено';
  if (s === 'REJECTED') return 'Отклонено';
  return 'На проверке';
}

function modColor(s: ModerationStatus | undefined): 'amber' | 'green' | 'red' {
  if (s === 'APPROVED') return 'green';
  if (s === 'REJECTED') return 'red';
  return 'amber';
}

function applicationStatusLabel(status: string | null): string {
  if (status === 'VIEWED') return 'Просмотрен';
  if (status === 'INVITED') return 'Приглашение';
  if (status === 'REJECTED') return 'Отказ';
  return 'Отправлен';
}

function formatDate(raw: string | null): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const empty: CandidateResumeDto = {};

export default function CandidateProfilePage() {
  const [tab, setTab] = useState<TabId>('resume');
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null);
  const [resume, setResume] = useState<CandidateResumeDto>(empty);
  const [apps, setApps] = useState<CandidateApplicationItemDto[]>([]);
  const [conversations, setConversations] = useState<ConversationListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resumeData, appsData, convData] = await Promise.all([
        candidateApi.getResume(),
        candidateApi.getMyApplications(),
        candidateApi.getConversations(),
      ]);
      setResume(resumeData);
      setApps(appsData);
      setConversations(convData);
    } catch {
      setToast({ msg: 'Не удалось загрузить профиль', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const conversationByApplication = useMemo(() => {
    const map = new Map<number, number>();
    conversations.forEach((c) => map.set(c.applicationId, c.id));
    return map;
  }, [conversations]);

  const setField = (key: keyof CandidateResumeDto, val: string | number | boolean | undefined) => {
    setResume(prev => ({ ...prev, [key]: val }));
  };

  const saveResume = async () => {
    setSaving(true);
    try {
      const saved = await candidateApi.saveResume(resume);
      setResume(saved);
      setToast({ msg: 'Резюме сохранено', type: 'success' });
    } catch {
      setToast({ msg: 'Ошибка сохранения резюме', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const ms = resume.moderationStatus ?? 'PENDING';

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-6">
      <div className="rounded-xl overflow-hidden border border-slate-200/90 shadow-sm">
        <div className="bg-[#0f2557] px-5 py-4">
          <h1 className="text-xl font-semibold text-white">Личный кабинет</h1>
          <p className="text-xs text-white/70 mt-0.5">Управляйте резюме и откликами</p>
        </div>
        <div className="bg-white border-b border-slate-200 flex gap-1 px-3">
          <button
            className={`px-4 py-3 text-sm border-b-2 transition-colors ${
              tab === 'resume'
                ? 'border-[#0f2557] text-[#0f2557] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab('resume')}
            type="button"
          >
            Моё резюме
          </button>
          <button
            className={`px-4 py-3 text-sm border-b-2 transition-colors ${
              tab === 'applications'
                ? 'border-[#0f2557] text-[#0f2557] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab('applications')}
            type="button"
          >
            Мои отклики
          </button>
        </div>
      </div>

      {tab === 'resume' ? (
        <div className="mt-5 space-y-4">
          <Card className="p-4 border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-600">Статус резюме:</span>
              <Badge color={modColor(ms)}>{modLabel(ms)}</Badge>
              {ms === 'REJECTED' && resume.rejectionReason && (
                <span className="text-sm text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                  Отклонено — {resume.rejectionReason}
                </span>
              )}
            </div>
          </Card>

          <Card className="p-5 space-y-4 border-slate-200">
            <PhotoUpload
              value={resume.photoUrl}
              onChange={(url) => setField('photoUrl', url)}
            />
            <div className="border-t border-slate-100" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Имя" value={resume.name ?? ''} onChange={e => setField('name', e.target.value)} />
              <Input label="Фамилия" value={resume.surname ?? ''} onChange={e => setField('surname', e.target.value)} />
              <Input label="Отчество" value={resume.patronymic ?? ''} onChange={e => setField('patronymic', e.target.value)} />
              <Input label="Возраст" type="number" value={resume.age ?? ''} onChange={e => setField('age', e.target.value ? +e.target.value : undefined)} />
              <Input label="Email" value={resume.email ?? ''} onChange={e => setField('email', e.target.value)} />
              <PhoneInput label="Телефон" value={resume.phone ?? '+7'} onChange={val => setField('phone', val)} />
              <Input label="Специальность" value={resume.position ?? ''} onChange={e => setField('position', e.target.value)} />
              <Input label="Желаемая зарплата" type="number" value={resume.salary ?? ''} onChange={e => setField('salary', e.target.value ? +e.target.value : undefined)} />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Образование</label>
                <textarea
                  value={resume.education ?? ''}
                  onChange={e => setField('education', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Навыки</label>
                <textarea
                  value={resume.skills ?? ''}
                  onChange={e => setField('skills', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Опыт</label>
                <textarea
                  value={resume.workPlace ?? ''}
                  onChange={e => setField('workPlace', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Btn variant="primary" className="!bg-[#0f2557] !border-[#0f2557]" onClick={saveResume} disabled={saving}>
                {saving ? 'Сохранение…' : 'Сохранить'}
              </Btn>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="mt-5 border-slate-200 overflow-hidden">
          {apps.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">Откликов пока нет.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Вакансия</th>
                    <th className="px-4 py-3 text-left font-medium">Компания</th>
                    <th className="px-4 py-3 text-left font-medium">Дата</th>
                    <th className="px-4 py-3 text-left font-medium">Статус</th>
                    <th className="px-4 py-3 text-left font-medium">Резюме при отклике</th>
                    <th className="px-4 py-3 text-left font-medium">Чат</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => {
                    const convId = conversationByApplication.get(app.id);
                    const showSnap = expandedAppId === app.id;
                    return (
                      <Fragment key={app.id}>
                        <tr className="border-t border-slate-100">
                          <td className="px-4 py-3 text-slate-800">{app.vacancyTitle ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{app.companyName ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(app.createdAt)}</td>
                          <td className="px-4 py-3 text-slate-700">{applicationStatusLabel(app.status)}</td>
                          <td className="px-4 py-3">
                            <Btn
                              size="sm"
                              variant="ghost"
                              className="!px-2 !py-1 text-xs"
                              onClick={() => setExpandedAppId(showSnap ? null : app.id)}
                            >
                              {showSnap ? 'Скрыть' : 'Показать'}
                            </Btn>
                          </td>
                          <td className="px-4 py-3">
                            {convId ? (
                              <Link className="text-[#0f2557] hover:underline font-medium" to={`/app/messages/${convId}`}>
                                Открыть чат
                              </Link>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                        {showSnap ? (
                          <tr key={`${app.id}-snap`} className="border-t border-slate-100 bg-slate-50/80">
                            <td colSpan={6} className="px-4 py-3">
                              <p className="text-xs font-medium text-slate-600 mb-2">Резюме на момент отклика</p>
                              <SentResumeDetails r={app.resumeAtApply} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
