import { Client, type IMessage } from '@stomp/stompjs';
import * as SockJSImport from 'sockjs-client';
import type { ChatMessageDto } from './candidateApi';

type SockCtor = new (url: string) => WebSocket;
const SockJS = ((SockJSImport as unknown as { default?: SockCtor }).default
  ?? (SockJSImport as unknown as SockCtor));

export function connectChatStomp(
  conversationId: number,
  token: string,
  onMessage: (msg: ChatMessageDto) => void,
  onError?: (err: unknown) => void
): Client {
  const client = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 4000,
    heartbeatIncoming: 20000,
    heartbeatOutgoing: 20000,
    onStompError: (frame) => onError?.(frame),
    onWebSocketError: (e) => onError?.(e),
    onConnect: () => {
      client.subscribe(`/topic/conversation.${conversationId}`, (message: IMessage) => {
        try {
          const body = JSON.parse(message.body) as ChatMessageDto;
          onMessage(body);
        } catch (e) {
          onError?.(e);
        }
      });
    },
  });

  client.activate();
  return client;
}

export function publishChatMessage(client: Client, conversationId: number, text: string) {
  client.publish({
    destination: '/app/chat.send',
    body: JSON.stringify({ conversationId, text }),
    headers: { 'content-type': 'application/json' },
  });
}
