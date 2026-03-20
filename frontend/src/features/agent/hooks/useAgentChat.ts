import axios from 'axios';
import { useCallback, useRef, useState } from 'react';
import apiClient from '@/api/client';
import { API_BASE_PATH } from '@/lib/constants';

const AGENT_CHAT_URL = `${API_BASE_PATH}/agent/chat` as const;

export type AgentChatMessage = {
  role: 'user' | 'model';
  content: string;
};

function extractAgentErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string } } | undefined;
    if (data?.error?.message) {
      return data.error.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error && typeof error === 'object' && 'response' in error) {
    type ErrBody = { error?: { message?: string } };
    type WithResponse = { response?: { data?: ErrBody } };
    const data = (error as WithResponse).response?.data;
    if (data?.error?.message) {
      return data.error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'No se pudo conectar con el asistente.';
}

export function useAgentChat() {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isPending) {
      return;
    }

    setError(null);
    const historyPayload = [...messagesRef.current];

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setIsPending(true);

    try {
      const res = await apiClient.post<{
        success: true;
        data: { reply: string; toolsUsed: string[] };
      }>(AGENT_CHAT_URL, {
        message: trimmed,
        history: historyPayload,
      });

      const body = res.data;
      if (!body?.success || !body.data?.reply) {
        throw new Error('Respuesta inválida del servidor');
      }

      setMessages((prev) => [...prev, { role: 'model', content: body.data.reply }]);
    } catch (e) {
      setError(extractAgentErrorMessage(e));
    } finally {
      setIsPending(false);
    }
  }, [isPending]);

  return {
    messages,
    sendMessage,
    isPending,
    error,
  };
}
