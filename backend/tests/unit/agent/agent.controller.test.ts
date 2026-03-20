import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

vi.mock('@/agent/flows/billing.flow', () => ({
  runBillingFlow: vi.fn(),
}));

import { agentChat } from '@/agent/agent.controller';
import { runBillingFlow } from '@/agent/flows/billing.flow';

const makeRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

describe('agentChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 400 si message está vacío', async () => {
    const req = {
      body: { message: '', history: [] },
      userId: 'user-1',
    } as unknown as Request;
    const res = makeRes();

    await agentChat(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    );
    expect(vi.mocked(runBillingFlow)).not.toHaveBeenCalled();
  });

  it('retorna 400 si historial supera 20 mensajes', async () => {
    const history = Array.from({ length: 21 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('model' as const),
      content: `m${i}`,
    }));
    const req = {
      body: { message: 'Hola', history },
      userId: 'user-1',
    } as unknown as Request;
    const res = makeRes();

    await agentChat(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(vi.mocked(runBillingFlow)).not.toHaveBeenCalled();
  });

  it('retorna 200 con reply y toolsUsed si runBillingFlow resuelve correctamente', async () => {
    vi.mocked(runBillingFlow).mockResolvedValue({
      reply: 'Listo.',
      toolsUsed: ['searchClients'],
    });
    const req = {
      body: { message: 'Busca clientes', history: [] },
      userId: 'user-42',
    } as unknown as Request;
    const res = makeRes();

    await agentChat(req, res);

    expect(runBillingFlow).toHaveBeenCalledWith('Busca clientes', [], 'user-42');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { reply: 'Listo.', toolsUsed: ['searchClients'] },
    });
  });

  it('retorna 500 si runBillingFlow lanza error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(runBillingFlow).mockRejectedValue(new Error('fallo red'));
    const req = {
      body: { message: 'Hola', history: [] },
      userId: 'user-1',
    } as unknown as Request;
    const res = makeRes();

    await agentChat(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'El agente no pudo procesar la solicitud',
        code: 'AGENT_ERROR',
      },
    });
    errSpy.mockRestore();
  });

  it('retorna 503 con AGENT_MISCONFIGURED si Google AI rechaza la API key', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(runBillingFlow).mockRejectedValue({
      errorDetails: [{ reason: 'API_KEY_INVALID' }],
    });
    const req = {
      body: { message: 'Hola', history: [] },
      userId: 'user-1',
    } as unknown as Request;
    const res = makeRes();

    await agentChat(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message:
          'El asistente no está disponible: revisa GOOGLE_GENAI_API_KEY en el servidor (clave inválida o no configurada).',
        code: 'AGENT_MISCONFIGURED',
      },
    });
    errSpy.mockRestore();
  });

  it('retorna 503 con AGENT_RATE_LIMITED si Google AI responde 429 (cuota)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(runBillingFlow).mockRejectedValue({ status: 429 });
    const req = {
      body: { message: 'Hola', history: [] },
      userId: 'user-1',
    } as unknown as Request;
    const res = makeRes();

    await agentChat(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message:
          'El asistente está temporalmente limitado por cuota de Google AI (demasiadas peticiones o free tier agotado). Espera unos minutos o revisa tu plan en Google AI Studio.',
        code: 'AGENT_RATE_LIMITED',
      },
    });
    errSpy.mockRestore();
  });
});
