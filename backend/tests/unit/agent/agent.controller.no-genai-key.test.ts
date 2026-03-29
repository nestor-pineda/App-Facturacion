import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

vi.mock('@/agent/flows/billing.flow', () => ({
  runBillingFlow: vi.fn(),
}));

vi.mock('@/config/env', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/config/env')>();
  return {
    env: {
      ...mod.env,
      GOOGLE_GENAI_API_KEY: undefined,
    },
  };
});

import { agentChat } from '@/agent/agent.controller';
import { runBillingFlow } from '@/agent/flows/billing.flow';

const makeRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

describe('agentChat sin GOOGLE_GENAI_API_KEY', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 503 AGENT_MISCONFIGURED sin llamar a runBillingFlow', async () => {
    const req = {
      body: { message: 'Hola', history: [] },
      userId: 'user-1',
    } as unknown as Request;
    const res = makeRes();

    await agentChat(req, res);

    expect(runBillingFlow).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message:
          'El asistente no está disponible: revisa GOOGLE_GENAI_API_KEY en el servidor (clave inválida o no configurada).',
        code: 'AGENT_MISCONFIGURED',
      },
    });
  });
});
