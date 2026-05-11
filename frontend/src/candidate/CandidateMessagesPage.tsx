import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { candidateApi, type ConversationListItemDto } from './candidateApi';
import { Card, SectionHeader } from '../components/ui';

function fmtTime(iso: string | null) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function CandidateMessagesPage() {
  const [items, setItems] = useState<ConversationListItemDto[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    candidateApi
      .getConversations()
      .then(setItems)
      .catch(() => setErr('Не удалось загрузить диалоги'));
  };

  useEffect(() => {
    load();
  }, []);

  const initials = (label: string) => {
    const parts = label.trim().split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] ?? 'C').toUpperCase();
  };

  return (
    <div>
      <SectionHeader title="Сообщения" subtitle="Чаты по откликам на вакансии" />

      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

      {items === null ? (
        <div className="grid gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 border-slate-200 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-slate-200 rounded" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 text-sm">
          Пока нет диалогов. Откликнитесь на вакансию — чат появится автоматически.
        </Card>
      ) : (
        <div className="grid gap-2">
          {items.map((c) => (
            <Link key={c.id} to={`/app/messages/${c.id}`} className="block">
              <Card className="p-4 hover:border-indigo-200 transition-colors border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-700 text-sm font-semibold flex items-center justify-center shrink-0">
                    {initials(c.counterpartyLabel || 'Company')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-slate-900 truncate">{c.counterpartyLabel}</div>
                      {c.lastMessageAt && <span className="text-[11px] text-slate-400 shrink-0">{fmtTime(c.lastMessageAt)}</span>}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{c.vacancyTitle}</div>
                    <p
                      className="text-sm text-slate-600 mt-1"
                      style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {c.lastMessagePreview || 'Нет сообщений'}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {c.unreadCount > 0 && (
                      <span className="min-w-[1.35rem] h-[1.35rem] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center leading-none">
                        {c.unreadCount > 99 ? '99+' : c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
