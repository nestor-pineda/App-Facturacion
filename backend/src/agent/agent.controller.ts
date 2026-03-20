import { Request, Response } from 'express';
import { AgentChatSchema } from '@/agent/agent.schemas';
import { runBillingFlow } from '@/agent/flows/billing.flow';

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AGENT_ERROR: 'AGENT_ERROR',
} as const;

const AGENT_FAILURE_MESSAGE = 'El agente no pudo procesar la solicitud';

export async function agentChat(req: Request, res: Response) {
  const parsed = AgentChatSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return res.status(400).json({
      success: false,
      error: {
        message: firstIssue?.message ?? 'Datos de entrada inválidos',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    });
  }

  const { message, history } = parsed.data;
  const userId = req.userId!;

  try {
    const result = await runBillingFlow(message, history, userId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[AgentChat] Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: AGENT_FAILURE_MESSAGE, code: ERROR_CODES.AGENT_ERROR },
    });
  }
}
