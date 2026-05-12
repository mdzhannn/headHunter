import { useCallback, useEffect, useState } from 'react';
import type { ModerationStatus } from '../types';
import { Btn, Input, PhoneInput, Card, Badge, Spinner, Toast, SectionHeader } from '../components/ui';
import { candidateApi, type CandidateResumeDto } from './candidateApi';

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

const empty: CandidateResumeDto = {};

export default function CandidateResumePage() {
  const [v, setV] = useState<CandidateResumeDto>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await candidateApi.getResume();
      setV(r);
    } catch {
      setToast({ msg: 'Не удалось загрузить резюме', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key: keyof CandidateResumeDto, val: string | number | boolean | undefined) => {
    setV(prev => ({ ...prev, [key]: val }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await candidateApi.saveResume(v);
      setV(saved);
      setToast({ msg: 'Сохранено', type: 'success' });
    } catch {
      setToast({ msg: 'Ошибка сохранения', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const ms = v.moderationStatus ?? 'PENDING';

  return (
    <div>
      <SectionHeader title="Моё резюме" subtitle="Просмотр и редактирование" />

      <Card className="p-4 mb-6 border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-600">Статус модерации:</span>
          <Badge color={modColor(ms)}>{modLabel(ms)}</Badge>
          {ms === 'REJECTED' && v.rejectionReason && (
            <span className="text-sm text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-100">
              Причина: {v.rejectionReason}
            </span>
          )}
        </div>
      </Card>

      <Card className="p-5 space-y-4 border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Имя" value={v.name ?? ''} onChange={e => setField('name', e.target.value)} />
          <Input label="Фамилия" value={v.surname ?? ''} onChange={e => setField('surname', e.target.value)} />
          <Input label="Отчество" value={v.patronymic ?? ''} onChange={e => setField('patronymic', e.target.value)} />
          <Input label="Возраст" type="number" value={v.age ?? ''} onChange={e => setField('age', e.target.value ? +e.target.value : undefined)} />
          <Input label="Email" value={v.email ?? ''} onChange={e => setField('email', e.target.value)} />
          <PhoneInput label="Телефон" value={v.phone ?? '+7'} onChange={val => setField('phone', val)} />
          <Input label="Пол" value={v.gender ?? ''} onChange={e => setField('gender', e.target.value)} />
          <Input
            label="Семейное положение (да/нет)"
            value={v.married === undefined ? '' : v.married ? 'да' : 'нет'}
            onChange={e => {
              const t = e.target.value.toLowerCase();
              if (t === 'да' || t === 'true') setField('married', true);
              else if (t === 'нет' || t === 'false') setField('married', false);
              else setField('married', undefined);
            }}
          />
          <Input label="Город" value={v.location ?? ''} onChange={e => setField('location', e.target.value)} />
          <Input label="Дата рождения" type="date" value={v.birthDay?.slice(0, 10) ?? ''} onChange={e => setField('birthDay', e.target.value || undefined)} />
          <Input label="Должность / специальность" value={v.position ?? ''} onChange={e => setField('position', e.target.value)} className="md:col-span-2" />
          <Input label="Ожидаемая зарплата" type="number" value={v.salary ?? ''} onChange={e => setField('salary', e.target.value ? +e.target.value : undefined)} />
          <Input label="Языки" value={v.languages ?? ''} onChange={e => setField('languages', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Образование</label>
          <textarea
            value={v.education ?? ''}
            onChange={e => setField('education', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Навыки</label>
          <textarea
            value={v.skills ?? ''}
            onChange={e => setField('skills', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Опыт / места работы</label>
          <textarea
            value={v.workPlace ?? ''}
            onChange={e => setField('workPlace', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">О себе</label>
          <textarea
            value={v.aboutMe ?? ''}
            onChange={e => setField('aboutMe', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
        <div className="flex justify-end pt-2">
          <Btn variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить резюме'}
          </Btn>
        </div>
      </Card>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
