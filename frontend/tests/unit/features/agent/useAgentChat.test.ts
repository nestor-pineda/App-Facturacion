import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgentChat } from '@/features/agent/hooks/useAgentChat';
import apiClient from '@/api/client';

vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('useAgentChat', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('añade mensaje del usuario al historial al enviar', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        success: true,
        data: { reply: 'Respuesta', toolsUsed: [] },
      },
    });

    const { result } = renderHook(() => useAgentChat());

    await act(async () => {
      await result.current.sendMessage('Hola');
    });

    expect(result.current.messages[0]).toEqual({ role: 'user', content: 'Hola' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/agent/chat',
      expect.objectContaining({
        message: 'Hola',
        history: [],
      }),
    );
  });

  it('añade respuesta del asistente al historial cuando la API responde', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        success: true,
        data: { reply: 'Todo listo', toolsUsed: ['searchClients'] },
      },
    });

    const { result } = renderHook(() => useAgentChat());

    await act(async () => {
      await result.current.sendMessage('Busca clientes');
    });

    expect(result.current.messages).toEqual([
      { role: 'user', content: 'Busca clientes' },
      { role: 'model', content: 'Todo listo' },
    ]);
  });

  it('gestiona estado isPending correctamente', async () => {
    let resolvePost: (value: unknown) => void;
    const postPromise = new Promise((resolve) => {
      resolvePost = resolve;
    });
    vi.mocked(apiClient.post).mockReturnValue(postPromise as never);

    const { result } = renderHook(() => useAgentChat());

    await act(async () => {
      void result.current.sendMessage('Espera');
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.messages.some((m) => m.role === 'user' && m.content === 'Espera')).toBe(true);

    await act(async () => {
      resolvePost!({
        data: {
          success: true,
          data: { reply: 'Ok', toolsUsed: [] },
        },
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
    expect(result.current.messages).toHaveLength(2);
  });

  it('gestiona error si la API falla', async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: {
        data: {
          success: false,
          error: { message: 'El agente no pudo procesar la solicitud', code: 'AGENT_ERROR' },
        },
      },
    });

    const { result } = renderHook(() => useAgentChat());

    await act(async () => {
      await result.current.sendMessage('Fallo');
    });

    expect(result.current.messages).toEqual([{ role: 'user', content: 'Fallo' }]);
    expect(result.current.error).toBe('El agente no pudo procesar la solicitud');
    expect(result.current.isPending).toBe(false);
  });
});
