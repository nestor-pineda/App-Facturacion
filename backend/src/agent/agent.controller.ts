import util from 'node:util';
import { Request, Response } from 'express';
import { AgentChatSchema } from '@/agent/agent.schemas';
import { runBillingFlow } from '@/agent/flows/billing.flow';
import { env } from '@/config/env';

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AGENT_ERROR: 'AGENT_ERROR',
  AGENT_MISCONFIGURED: 'AGENT_MISCONFIGURED',
  AGENT_RATE_LIMITED: 'AGENT_RATE_LIMITED',
  AGENT_MODEL_UNAVAILABLE: 'AGENT_MODEL_UNAVAILABLE',
} as const;

const AGENT_FAILURE_MESSAGE = 'El agente no pudo procesar la solicitud';

const AGENT_MISCONFIGURED_MESSAGE =
  'El asistente no está disponible: revisa GOOGLE_GENAI_API_KEY en el servidor (clave inválida o no configurada).';

const AGENT_RATE_LIMITED_MESSAGE =
  'El asistente está temporalmente limitado por cuota de Google AI (demasiadas peticiones o free tier agotado). Espera unos minutos o revisa tu plan en Google AI Studio.';

const AGENT_MODEL_UNAVAILABLE_MESSAGE =
  'El modelo configurado para el asistente no está disponible para este proyecto de Google AI. Actualiza el modelo en el servidor (p. ej. gemini-3-flash-preview o gemini-2.5-flash).';

function isGoogleAiApiKeyInvalidError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const withDetails = error as { errorDetails?: unknown };
  if (!Array.isArray(withDetails.errorDetails)) {
    return false;
  }
  return withDetails.errorDetails.some(
    (d): d is { reason?: string } =>
      d !== null && typeof d === 'object' && (d as { reason?: string }).reason === 'API_KEY_INVALID'
  );
}

function isGoogleAiRateLimitedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status: number }).status === 429
  );
}

function isGoogleAiModelUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const withStatus = error as { status?: unknown; message?: unknown };
  const is404 = withStatus.status === 404;
  const message =
    typeof withStatus.message === 'string' ? withStatus.message.toLowerCase() : '';
  return (
    is404 &&
    (message.includes('model') &&
      (message.includes('no longer available') || message.includes('not found')))
  );
}

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

  if (!env.GOOGLE_GENAI_API_KEY) {
    return res.status(503).json({
      success: false,
      error: {
        message: AGENT_MISCONFIGURED_MESSAGE,
        code: ERROR_CODES.AGENT_MISCONFIGURED,
      },
    });
  }

  try {
    const result = await runBillingFlow(message, history, userId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(
      '[AgentChat] Error (inspect):',
      util.inspect(error, { depth: 12, colors: false, maxArrayLength: null, breakLength: 120 })
    );
    if (error instanceof Error) {
      console.error('[AgentChat] Error message:', error.message);
      console.error('[AgentChat] Error stack:', error.stack);
      if (error.cause !== undefined) {
        console.error(
          '[AgentChat] Error cause:',
          util.inspect(error.cause, { depth: 12, colors: false, maxArrayLength: null })
        );
      }
    }
    if (isGoogleAiApiKeyInvalidError(error)) {
      console.error('[AgentChat] Classified as AGENT_MISCONFIGURED (Google API key invalid)');
      return res.status(503).json({
        success: false,
        error: {
          message: AGENT_MISCONFIGURED_MESSAGE,
          code: ERROR_CODES.AGENT_MISCONFIGURED,
        },
      });
    }
    if (isGoogleAiRateLimitedError(error)) {
      console.error(
        '[AgentChat] Classified as AGENT_RATE_LIMITED (HTTP 429 / cuota o límite de Google Generative AI)'
      );
      return res.status(503).json({
        success: false,
        error: {
          message: AGENT_RATE_LIMITED_MESSAGE,
          code: ERROR_CODES.AGENT_RATE_LIMITED,
        },
      });
    }
    if (isGoogleAiModelUnavailableError(error)) {
      console.error('[AgentChat] Classified as AGENT_MODEL_UNAVAILABLE (modelo no disponible)');
      return res.status(503).json({
        success: false,
        error: {
          message: AGENT_MODEL_UNAVAILABLE_MESSAGE,
          code: ERROR_CODES.AGENT_MODEL_UNAVAILABLE,
        },
      });
    }
    return res.status(500).json({
      success: false,
      error: { message: AGENT_FAILURE_MESSAGE, code: ERROR_CODES.AGENT_ERROR },
    });
  }
}
