import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api';
import type { Company, Vacancy, ModerationStatus } from '../types';
import { Btn, Input, Badge, Card, SectionHeader, Empty, Spinner, Modal, Toast } from '../components/ui';
import { getAdminSubRoleFromToken, getStoredToken } from '../candidate/auth';

const emptyForm = { title: '', description: '', salary: 0, company: '', userId: 0 };

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

function formatTableDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

export default function VacanciesPage() {
  const adminSubRole = getAdminSubRoleFromToken(getStoredToken());
  const canModerate = adminSubRole === 'SUPER_ADMIN' || adminSubRole === 'MODERATOR';
  const [allVacancies, setAllVacancies] = useState<Vacancy[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | ModerationStatus>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editVacancy, setEditVacancy] = useState<Vacancy | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [rejectFor, setRejectFor] = useState<Vacancy | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const companyName = useCallback(
    (v: Vacancy) => {
      if (v.companyId != null) {
        const c = companies.find(x => x.id === v.companyId);
        if (c) return c.name;
      }
      return v.company || '—';
    },
    [companies],
  );

  const filtered = useMemo(() => {
    return allVacancies.filter(v => {
      if (statusFilter !== 'all' && v.moderationStatus !== statusFilter) return false;
      if (companyFilter !== '' && String(v.companyId ?? '') !== companyFilter) return false;
      const vDay = v.createDate ? new Date(v.createDate) : null;
      if (dateFrom && vDay) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (vDay < from) return false;
      }
      if (dateTo && vDay) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (vDay > to) return false;
      }
      if (dateFrom && !vDay) return false;
      if (dateTo && !vDay) return false;
      return true;
    });
  }, [allVacancies, statusFilter, companyFilter, dateFrom, dateTo]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vacList, coList] = await Promise.all([api.vacancies.getAll(), api.companies.list()]);
      setAllVacancies(vacList as Vacancy[]);
      setCompanies(coList);
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
    setSelectedIds((prev) => prev.filter((id) => filtered.some((v) => v.id === id)));
  }, [filtered]);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  const handleCreate = async () => {
    try {
      await api.vacancies.create(form);
      notify('Вакансия создана');
      setShowCreate(false);
      setForm(emptyForm);
      load();
    } catch {
      notify('Ошибка создания', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editVacancy) return;
    try {
      const raw = await api.vacancies.getRawById(editVacancy.id);
      const body = {
        ...raw,
        id: editVacancy.id,
        jobTitle: form.title,
        aboutVacancy: form.description,
        aboutCompany: form.company,
        salary: form.salary,
      };
      await api.vacancies.adminUpdate(editVacancy.id, body);
      notify('Обновлено');
      setEditVacancy(null);
      load();
    } catch {
      notify('Ошибка обновления', 'error');
    }
  };

  const handleAdminDelete = async (id: number) => {
    if (!confirm('Удалить вакансию?')) return;
    try {
      await api.vacancies.adminDelete(id);
      notify('Удалено');
      load();
    } catch {
      notify('Ошибка удаления', 'error');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.vacancies.adminApprove(id);
      notify('Вакансия одобрена');
      load();
    } catch {
      notify('Ошибка подтверждения', 'error');
    }
  };

  const submitReject = async () => {
    if (!rejectFor || !rejectReason.trim()) return;
    try {
      await api.vacancies.adminReject(rejectFor.id, rejectReason.trim());
      notify('Вакансия отклонена');
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

  const allVisibleSelected = filtered.length > 0 && filtered.every((v) => selectedIds.includes(v.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((v) => v.id === id)));
      return;
    }
    const visibleIds = filtered.map((v) => v.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const runBulk = async (action: 'APPROVE' | 'REJECT' | 'DELETE') => {
    if (selectedIds.length === 0) return;
    if (action === 'DELETE' && !confirm(`Удалить выбранные вакансии (${selectedIds.length})?`)) return;
    try {
      await api.vacancies.bulk(selectedIds, action);
      notify(`Массовая операция ${action} выполнена`);
      setSelectedIds([]);
      await load();
    } catch {
      notify('Ошибка массовой операции', 'error');
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n) + ' ₸';

  return (
    <div className="max-w-6xl">
      <SectionHeader
        title="Вакансии"
        subtitle={`${filtered.length} в таблице (всего: ${allVacancies.length})`}
        action={canModerate ? <Btn variant="primary" onClick={() => setShowCreate(true)}>+ Добавить</Btn> : undefined}
      />

      <Card className="p-4 mb-5 space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Фильтры</div>
        <div className="flex flex-wrap gap-2 items-center">
          {STATUS_OPTS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all
                ${statusFilter === f
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {f === 'all' ? 'Все статусы' : statusLabel(f)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Компания</label>
            <select
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800"
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
            >
              <option value="">Все компании</option>
              {companies.map(c => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Input label="Дата от" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <Input label="Дата до" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <div className="flex items-end">
            <Btn variant="ghost" className="w-full" onClick={() => { setDateFrom(''); setDateTo(''); setCompanyFilter(''); setStatusFilter('all'); }}>
              Сбросить фильтры
            </Btn>
          </div>
        </div>
      </Card>

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

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Empty label="Нет вакансий по фильтрам" />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 font-medium">
                  {canModerate && (
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
                    </th>
                  )}
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3">Компания</th>
                  <th className="px-4 py-3 whitespace-nowrap">Зарплата</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3 whitespace-nowrap">Дата</th>
                  <th className="px-4 py-3 min-w-[200px]">Примечание</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    {canModerate && (
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(v.id)} onChange={() => toggleSelected(v.id)} />
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px]">{v.title}</td>
                    <td className="px-4 py-3 text-slate-600">{companyName(v)}</td>
                    <td className="px-4 py-3 text-emerald-700 font-medium whitespace-nowrap">{fmt(v.salary)}</td>
                    <td className="px-4 py-3">
                      <Badge color={statusBadgeColor(v.moderationStatus)}>{statusLabel(v.moderationStatus)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatTableDate(v.createDate)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 align-top max-w-xs">
                      {v.moderationStatus === 'REJECTED' && v.rejectionReason ? (
                        <span className="text-red-700 bg-red-50 rounded px-2 py-1 inline-block border border-red-100">{v.rejectionReason}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {canModerate && v.moderationStatus !== 'APPROVED' && (
                          <Btn size="sm" variant="success" onClick={() => handleApprove(v.id)}>
                            Подтвердить
                          </Btn>
                        )}
                        {canModerate && v.moderationStatus !== 'REJECTED' && (
                          <Btn
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setRejectFor(v);
                              setRejectReason('');
                            }}
                          >
                            Отклонить
                          </Btn>
                        )}
                        {canModerate && <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditVacancy(v);
                            setForm({
                              title: v.title,
                              description: v.description,
                              salary: v.salary,
                              company: v.company,
                              userId: v.userId ?? 0,
                            });
                          }}
                        >
                          Редактировать
                        </Btn>}
                        {canModerate && <Btn size="sm" variant="danger" onClick={() => handleAdminDelete(v.id)}>
                          Удалить
                        </Btn>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showCreate && canModerate && (
        <Modal title="Новая вакансия" onClose={() => setShowCreate(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Название"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Java Backend Developer"
              className="col-span-2"
            />
            <Input
              label="Компания"
              value={form.company}
              onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              placeholder="ТОО «Компания»"
            />
            <Input
              label="Зарплата (₸)"
              type="number"
              value={form.salary}
              onChange={e => setForm(f => ({ ...f, salary: +e.target.value }))}
              placeholder="500000"
            />
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Описание</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Описание вакансии..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder-slate-400"
              />
            </div>
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

      {editVacancy && canModerate && (
        <Modal title="Редактировать вакансию" onClose={() => setEditVacancy(null)}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Название" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="col-span-2" />
            <Input label="Компания" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            <Input label="Зарплата (₸)" type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: +e.target.value }))} />
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Описание</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Btn onClick={() => setEditVacancy(null)}>Отмена</Btn>
            <Btn variant="primary" onClick={handleUpdate}>
              Сохранить
            </Btn>
          </div>
        </Modal>
      )}

      {rejectFor && canModerate && (
        <Modal title="Отклонить вакансию" onClose={() => { setRejectFor(null); setRejectReason(''); }}>
          <p className="text-sm text-slate-600 mb-2">{rejectFor.title}</p>
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
