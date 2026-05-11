import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { AuditLog } from '../types';
import { Btn, Card, Empty, Input, SectionHeader, Spinner, Toast } from '../components/ui';

const ENTITY_TYPES = ['ALL', 'USER', 'RESUME', 'VACANCY', 'COMPANY'];

function toIsoFromDateStart(value: string): string | undefined {
  if (!value) return undefined;
  return `${value}T00:00:00`;
}

function toIsoFromDateEnd(value: string): string | undefined {
  if (!value) return undefined;
  return `${value}T23:59:59`;
}

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'medium' });
}

function previewOldValue(raw: string | null): string {
  if (!raw) return '—';
  try {
    const parsed = JSON.parse(raw) as unknown;
    return JSON.stringify(parsed);
  } catch {
    return raw;
  }
}

export default function AuditPage() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [entityType, setEntityType] = useState('ALL');
  const [adminEmail, setAdminEmail] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.audit.get({
        entityType: entityType === 'ALL' ? undefined : entityType,
        adminEmail,
        from: toIsoFromDateStart(dateFrom),
        to: toIsoFromDateEnd(dateTo),
        page,
        size,
      });
      setRows(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch {
      setToast({ msg: 'Не удалось загрузить audit logs', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [adminEmail, dateFrom, dateTo, entityType, page, size]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = () => {
    setPage(0);
    load();
  };

  const resetFilters = () => {
    setEntityType('ALL');
    setAdminEmail('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  return (
    <div>
      <SectionHeader title="Audit Log" subtitle={`Всего записей: ${totalElements}`} />

      <Card className="p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Тип сущности</label>
            <select
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              {ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <Input label="Email администратора" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@company.com" />
          <Input label="Дата от" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input label="Дата до" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <div className="flex items-end gap-2">
            <Btn variant="primary" className="w-full" onClick={applyFilters}>
              Применить
            </Btn>
            <Btn variant="ghost" className="w-full" onClick={resetFilters}>
              Сброс
            </Btn>
          </div>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty label="Записей не найдено" />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 font-medium">
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">Админ</th>
                  <th className="px-4 py-3">Действие</th>
                  <th className="px-4 py-3">Сущность</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Старое значение</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/70 align-top">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.changedAt)}</td>
                    <td className="px-4 py-3">{row.adminEmail || 'unknown'}</td>
                    <td className="px-4 py-3 font-medium">{row.action}</td>
                    <td className="px-4 py-3">{row.entityType}</td>
                    <td className="px-4 py-3">{row.entityId ?? '—'}</td>
                    <td className="px-4 py-3 max-w-[500px]">
                      <pre className="text-xs whitespace-pre-wrap break-all text-slate-700">{previewOldValue(row.oldValue)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Страница {totalPages === 0 ? 0 : page + 1} из {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Размер страницы</label>
            <select
              className="px-2 py-1 text-sm bg-white border border-slate-200 rounded-lg"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <Btn variant="ghost" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Назад
          </Btn>
          <Btn variant="ghost" onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= totalPages}>
            Вперёд
          </Btn>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
