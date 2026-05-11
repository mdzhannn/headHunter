import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Client } from '@stomp/stompjs';
import { Btn, Card } from '../components/ui';
import { decodeJwtPayload } from './auth';
import { useAuth } from './AuthContext';
import { candidateApi, type ChatMessageDto } from './candidateApi';
import { connectChatStomp, publishChatMessage } from './chatStomp';

function currentUserId(t: string | null): number | null {
  if (!t) return null;
  const p = decodeJwtPayload(t);
  const sub = p?.sub;
  if (typeof sub === 'string' && sub) return Number(sub);
  return null;
}

function fmtMsgTime(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function CandidateChatPage() {
  const { id } = useParams();
  const convId = Number(id);
  const nav = useNavigate();
  const { token } = useAuth();
  const me = currentUserId(token);

  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [wsErr, setWsErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<Client | null>(null);
  const [sending, setSending] = useState(false);

  const appendMessage = useCallback((m: ChatMessageDto) => {
    setMessages((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m].sort((a, b) => a.id - b.id);
    });
  }, []);

  useEffect(() => {
    if (!Number.isFinite(convId) || convId <= 0) {
      nav('/app/messages', { replace: true });
      return;
    }

    let cancelled = false;
    setLoading(true);
    candidateApi
      .getMessages(convId)
      .then((list) => {
        if (!cancelled) setMessages(list);
      })
      .catch(() => {
        if (!cancelled) nav('/app/messages', { replace: true });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    candidateApi.markConversationRead(convId).catch(() => {});
    window.dispatchEvent(new Event('hh:conversations-changed'));

    try {
      if (!token) throw new Error('Нет токена');
      const client = connectChatStomp(
        convId,
        token,
        (m) => {
          appendMessage(m);
          window.dispatchEvent(new Event('hh:conversations-changed'));
        },
        () => setWsErr('Проблема соединения. Перезагрузите страницу.')
      );
      clientRef.current = client;
    } catch {
      setWsErr('Не удалось подключить чат');
    }

    return () => {
      cancelled = true;
      void clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, [convId, nav, appendMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const t = text.trim();
    if (!t || !clientRef.current?.connected) return;
    setSending(true);
    setText('');
    publishChatMessage(clientRef.current, convId, t);
    setTimeout(() => setSending(false), 120);
  };

  if (!Number.isFinite(convId) || convId <= 0) return null;

  return (
    <div className="flex flex-col h-[min(78vh,calc(100vh-8rem))]">
      <div className="flex items-center gap-3 mb-3">
        <Link to="/app/messages" className="text-sm text-[#2557a7] hover:underline">
          ← Диалоги
        </Link>
      </div>

      {wsErr && <p className="text-xs text-amber-700 mb-2">{wsErr}</p>}

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100 bg-white text-sm text-slate-600">
          Диалог #{convId}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                  <div className="h-12 w-44 rounded-2xl bg-slate-200 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            messages.map((m) => {
              const mine = me !== null && m.senderId === me;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      mine
                        ? 'bg-[#2557a7] text-white rounded-br-md'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p
                      className={`text-[10px] mt-1 ${mine ? 'text-blue-100' : 'text-slate-400'}`}
                    >
                      {fmtMsgTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        <div className="p-3 border-t border-slate-200 flex gap-2 items-end bg-white">
          <textarea
            className="flex-1 min-h-[44px] max-h-28 resize-none px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2557a7] focus:ring-2 focus:ring-blue-100"
            placeholder="Сообщение…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Btn variant="primary" className="!bg-[#2557a7] !border-[#2557a7]" onClick={send} disabled={!text.trim() || sending}>
            Отправить
          </Btn>
        </div>
      </Card>
    </div>
  );
}
