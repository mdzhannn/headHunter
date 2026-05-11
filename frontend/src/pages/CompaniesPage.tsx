import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { Company, ModerationStatus } from '../types';
import { Badge, Btn, Card, Empty, Modal, SectionHeader, Spinner, Toast } from '../components/ui';

const STATUS_FILTER: Array<'all' | ModerationStatus> = ['all', 'PENDING', 'APPROVED', 'REJECTED'];

const statusBadgeColor = (s: ModerationStatus): 'amber' | 'green' | 'red' => {
  if (s === 'PENDING') return 'amber';
  if (s === 'APPROVED') return 'green';
  return 'red';
};

function statusLabel(s: ModerationStatus): string {
  switch (s) {
    case 'PENDING':
      return 'На проверке';
    case 'APPROVED':
      return 'Одобрено';
    case 'REJECTED':
      return 'Отклонено';
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

export default function CompaniesPage() {
  const [rows, setRows] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ModerationStatus>('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [detail, setDetail] = useState<Company | null>(null);
  const [rejectFor, setRejectFor] = useState<Company | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.companies.list(filter === 'all' ? undefined : filter);
      setRows(data);
    } catch {
      notify('Ошибка загрузки компаний', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (c: Company) => {
    try {
      const d = await api.companies.getById(c.id);
      setDetail(d);
    } catch {
      notify('Не удалось загрузить карточку', 'error');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.companies.approve(id);
      notify('Компания подтверждена');
      load();
    } catch {
      notify('Ошибка подтверждения', 'error');
    }
  };

  const submitReject = async () => {
    if (!rejectFor) return;
    try {
      await api.companies.reject(rejectFor.id, rejectReason.trim());
      notify('Компания отклонена');
      setRejectFor(null);
      setRejectReason('');
      load();
    } catch {
      notify('Ошибка отклонения', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить компанию? Связь вакансий с компанией будет сброшена.')) return;
    try {
      await api.companies.delete(id);
      notify('Удалено');
      load();
    } catch {
      notify('Ошибка удаления', 'error');
    }
  };

  return (
    <div className="max-w-6xl">
      <SectionHeader
        title="Компании"
        subtitle={`${rows.length} в списке`}
      />

      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_FILTER.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all
              ${filter === f
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {f === 'all' ? 'Все' : statusLabel(f)}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty label="Нет компаний" />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 font-medium">
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3 whitespace-nowrap">ИНН</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3 whitespace-nowrap">Дата</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{c.inn ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge color={statusBadgeColor(c.moderationStatus)}>{statusLabel(c.moderationStatus)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Btn size="sm" variant="ghost" onClick={() => openDetail(c)}>
                          Карточка
                        </Btn>
                        {c.moderationStatus !== 'APPROVED' && (
                          <Btn size="sm" variant="success" onClick={() => handleApprove(c.id)}>
                            Подтвердить
                          </Btn>
                        )}
                        {c.moderationStatus !== 'REJECTED' && (
                          <Btn size="sm" variant="danger" onClick={() => { setRejectFor(c); setRejectReason(''); }}>
                            Отклонить
                          </Btn>
                        )}
                        <Btn size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                          Удалить
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <div className="space-y-3 text-sm text-slate-700">
            <div><span className="text-slate-400">ИНН:</span> {detail.inn ?? '—'}</div>
            <div><span className="text-slate-400">Статус:</span>{' '}
              <Badge color={statusBadgeColor(detail.moderationStatus)}>{statusLabel(detail.moderationStatus)}</Badge>
            </div>
            <div><span className="text-slate-400">Владелец (user id):</span> {detail.ownerId}</div>
            <div>
              <div className="text-slate-400 mb-1">Контакты</div>
              <pre className="whitespace-pre-wrap bg-slate-50 rounded-lg p-3 text-xs">{detail.contacts ?? '—'}</pre>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Документы</div>
              <pre className="whitespace-pre-wrap bg-slate-50 rounded-lg p-3 text-xs">{detail.documents ?? '—'}</pre>
            </div>
            {detail.rejectionReason && (
              <div>
                <div className="text-slate-400 mb-1">Причина отказа</div>
                <p className="text-red-700 bg-red-50 rounded-lg p-3 text-xs">{detail.rejectionReason}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {rejectFor && (
        <Modal title="Отклонить компанию" onClose={() => { setRejectFor(null); setRejectReason(''); }}>
          <p className="text-sm text-slate-600 mb-3">{rejectFor.name}</p>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Причина отказа</label>
          <textarea
            className="w-full min-h-[100px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Укажите причину…"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Btn variant="ghost" onClick={() => { setRejectFor(null); setRejectReason(''); }}>Отмена</Btn>
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
