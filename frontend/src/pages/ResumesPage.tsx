import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api';
import type { Resume, ModerationStatus } from '../types';
import { Btn, Input, Badge, Card, SectionHeader, Empty, Spinner, Modal, Toast } from '../components/ui';
import { getAdminSubRoleFromToken, getStoredToken } from '../candidate/auth';

const emptyForm = { name: '', surname: '', email: '', phone: '', position: '', userId: 0 };

const STATUS_OPTS: Array<'all' | ModerationStatus> = ['all', 'PENDING', 'APPROVED', 'REJECTED'];

function statusBadgeColor(s: ModerationStatus): 'amber' | 'green' | 'red' {
  if (s === 'PENDING') return 'amber';
  if (s === 'APPROVED') return 'green';
  return 'red';
}

function statusLabel(s: ModerationStatus): string {
  if (s === 'PENDING') return 'На проверке';
  if (s === 'APPROVED') return 'Одобрено';
  return 'Отклонено';
}

export default function ResumesPage() {
  const adminSubRole = getAdminSubRoleFromToken(getStoredToken());
  const canModerate = adminSubRole === 'SUPER_ADMIN' || adminSubRole === 'MODERATOR';
  const [allResumes, setAllResumes] = useState<Resume[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | ModerationStatus>('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editResume, setEditResume] = useState<Resume | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [rejectFor, setRejectFor] = useState<Resume | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const resumes = useMemo(() => {
    if (statusFilter === 'all') return allResumes;
    return allResumes.filter(r => r.moderationStatus === statusFilter);
  }, [allResumes, statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.resumes.getAll();
      setAllResumes(data as Resume[]);
    } catch {
      setToast({ msg: 'Ошибка загрузки', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => resumes.some((r) => r.id === id)));
  }, [resumes]);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  const handleCreate = async () => {
    try {
      await api.resumes.create(form);
      notify('Резюме создано');
      setShowCreate(false);
      setForm(emptyForm);
      load();
    } catch {
      notify('Ошибка создания', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editResume) return;
    try {
      await api.resumes.update({ ...editResume, ...form });
      notify('Обновлено');
      setEditResume(null);
      load();
    } catch {
      notify('Ошибка обновления', 'error');
    }
  };

  const handleAdminDelete = async (id: number) => {
    if (!confirm('Удалить резюме?')) return;
    try {
      await api.resumes.adminDelete(id);
      notify('Удалено');
      load();
    } catch {
      notify('Ошибка удаления', 'error');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.resumes.adminApprove(id);
      notify('Резюме одобрено');
      load();
    } catch {
      notify('Ошибка подтверждения', 'error');
    }
  };

  const submitReject = async () => {
    if (!rejectFor || !rejectReason.trim()) return;
    try {
      await api.resumes.adminReject(rejectFor.id, rejectReason.trim());
      notify('Резюме отклонено');
      setRejectFor(null);
      setRejectReason('');
      load();
    } catch {
      notify('Ошибка отклонения', 'error');
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const allVisibleSelected = resumes.length > 0 && resumes.every((r) => selectedIds.includes(r.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !resumes.some((r) => r.id === id)));
      return;
    }
    const visibleIds = resumes.map((r) => r.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const runBulk = async (action: 'APPROVE' | 'REJECT' | 'DELETE') => {
    if (selectedIds.length === 0) return;
    if (action === 'DELETE' && !confirm(`Удалить выбранные резюме (${selectedIds.length})?`)) return;
    try {
      await api.resumes.bulk(selectedIds, action);
      notify(`Массовая операция ${action} выполнена`);
      setSelectedIds([]);
      await load();
    } catch {
      notify('Ошибка массовой операции', 'error');
    }
  };

  return (
    <div>
      <SectionHeader
        title="Резюме"
        subtitle={`${resumes.length} в списке (всего в базе: ${allResumes.length})`}
        action={canModerate ? <Btn variant="primary" onClick={() => setShowCreate(true)}>+ Добавить</Btn> : undefined}
      />

      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_OPTS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all
              ${statusFilter === f
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {f === 'all' ? 'Все' : statusLabel(f)}
          </button>
        ))}
      </div>

      {canModerate && selectedIds.length > 0 && (
        <Card className="p-4 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">Выбрано: {selectedIds.length}</span>
          <Btn size="sm" variant="success" onClick={() => runBulk('APPROVE')}>
            Подтвердить выбранные
          </Btn>
          <Btn size="sm" variant="danger" onClick={() => runBulk('REJECT')}>
            Отклонить выбранные
          </Btn>
          <Btn size="sm" variant="danger" onClick={() => runBulk('DELETE')}>
            Удалить выбранные
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
            Снять выбор
          </Btn>
        </Card>
      )}

      {canModerate && resumes.length > 0 && (
        <div className="mb-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
            Выбрать все в текущем списке
          </label>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : resumes.length === 0 ? (
        <Empty label="Нет резюме" />
      ) : (
        <div className="grid gap-3">
          {resumes.map(r => (
            <Card key={r.id} className="px-5 py-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                  {r.name?.[0]}
                  {r.surname?.[0]}
                </div>
                {canModerate && (
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => toggleSelected(r.id)}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 text-sm">
                      {r.name} {r.surname}
                    </span>
                    <Badge color="slate">#{r.id}</Badge>
                    <Badge color={statusBadgeColor(r.moderationStatus)}>{statusLabel(r.moderationStatus)}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{r.position}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {r.email} · {r.phone}
                  </div>
                  {r.moderationStatus === 'REJECTED' && r.rejectionReason && (
                    <div className="mt-2 text-xs text-red-700 bg-red-50 rounded-lg px-2 py-1.5 border border-red-100">
                      <span className="text-red-600 font-medium">Причина: </span>
                      {r.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0 justify-end">
                  {canModerate && r.moderationStatus !== 'APPROVED' && (
                    <Btn size="sm" variant="success" onClick={() => handleApprove(r.id)}>
                      Подтвердить
                    </Btn>
                  )}
                  {canModerate && r.moderationStatus !== 'REJECTED' && (
                    <Btn
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setRejectFor(r);
                        setRejectReason('');
                      }}
                    >
                      Отклонить
                    </Btn>
                  )}
                  {canModerate && <Btn
                    size="sm"
                    onClick={() => {
                      setEditResume(r);
                      setForm({
                        name: r.name,
                        surname: r.surname,
                        email: r.email,
                        phone: r.phone,
                        position: r.position,
                        userId: r.userId ?? 0,
                      });
                    }}
                  >
                    Изменить
                  </Btn>}
                  {canModerate && <Btn size="sm" variant="danger" onClick={() => handleAdminDelete(r.id)}>
                    Удалить
                  </Btn>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && canModerate && (
        <Modal title="Новое резюме" onClose={() => setShowCreate(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Имя" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Иван" />
            <Input label="Фамилия" value={form.surname} onChange={e => setForm(f => ({ ...f, surname: e.target.value }))} placeholder="Иванов" />
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ivan@mail.com" />
            <Input label="Телефон" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+7..." />
            <Input
              label="Должность"
              value={form.position}
              onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
              placeholder="Java Backend Developer"
              className="col-span-2"
            />
            <Input label="ID пользователя" type="number" value={form.userId} onChange={e => setForm(f => ({ ...f, userId: +e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Btn onClick={() => setShowCreate(false)}>Отмена</Btn>
            <Btn variant="primary" onClick={handleCreate}>
              Создать
            </Btn>
          </div>
        </Modal>
      )}

      {editResume && canModerate && (
        <Modal title="Редактировать резюме" onClose={() => setEditResume(null)}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Имя" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Фамилия" value={form.surname} onChange={e => setForm(f => ({ ...f, surname: e.target.value }))} />
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Телефон" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input
              label="Должность"
              value={form.position}
              onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
              className="col-span-2"
            />
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Btn onClick={() => setEditResume(null)}>Отмена</Btn>
            <Btn variant="primary" onClick={handleUpdate}>
              Сохранить
            </Btn>
          </div>
        </Modal>
      )}

      {rejectFor && canModerate && (
        <Modal title="Отклонить резюме" onClose={() => { setRejectFor(null); setRejectReason(''); }}>
          <p className="text-sm text-slate-600 mb-2">
            {rejectFor.name} {rejectFor.surname}
          </p>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Причина</label>
          <textarea
            className="w-full min-h-[100px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Укажите причину отклонения…"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Btn variant="ghost" onClick={() => { setRejectFor(null); setRejectReason(''); }}>
              Отмена
            </Btn>
            <Btn variant="danger" onClick={submitReject} disabled={!rejectReason.trim()}>
              Отклонить
            </Btn>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
