import util from 'node:util';
import { Request, Response } from 'express';
import { AgentChatSchema } from '@/agent/agent.schemas';
import { runBillingFlow } from '@/agent/flows/billing.flow';
import { AUDIT_EVENT } from '@/constants/audit-events.constants';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { auditLog } from '@/lib/audit-log';

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

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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

function logAgentFailure(req: Request, userId: string, error: unknown) {
  const base = { requestId: req.requestId, userId };
  if (error instanceof Error) {
    logger.error({ ...base, err: error }, '[AgentChat]');
    return;
  }
  if (!IS_PRODUCTION) {
    logger.error(
      {
        ...base,
        payload: util.inspect(error, { depth: 6, maxArrayLength: 25, colors: false }),
      },
      '[AgentChat]',
    );
    return;
  }
  logger.error({ ...base, valueType: typeof error }, '[AgentChat] non-Error');
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

  const started = Date.now();
  try {
    const result = await runBillingFlow(message, history, userId);
    auditLog(req, AUDIT_EVENT.AGENT_CHAT_SUCCESS, {
      userId,
      toolsUsed: result.toolsUsed,
      durationMs: Date.now() - started,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    logAgentFailure(req, userId, error);

    if (isGoogleAiApiKeyInvalidError(error)) {
      auditLog(req, AUDIT_EVENT.AGENT_CHAT_ERROR, {
        userId,
        code: ERROR_CODES.AGENT_MISCONFIGURED,
      });
      return res.status(503).json({
        success: false,
        error: {
          message: AGENT_MISCONFIGURED_MESSAGE,
          code: ERROR_CODES.AGENT_MISCONFIGURED,
        },
      });
    }
    if (isGoogleAiRateLimitedError(error)) {
      auditLog(req, AUDIT_EVENT.AGENT_CHAT_ERROR, {
        userId,
        code: ERROR_CODES.AGENT_RATE_LIMITED,
      });
      return res.status(503).json({
        success: false,
        error: {
          message: AGENT_RATE_LIMITED_MESSAGE,
          code: ERROR_CODES.AGENT_RATE_LIMITED,
        },
      });
    }
    if (isGoogleAiModelUnavailableError(error)) {
      auditLog(req, AUDIT_EVENT.AGENT_CHAT_ERROR, {
        userId,
        code: ERROR_CODES.AGENT_MODEL_UNAVAILABLE,
      });
      return res.status(503).json({
        success: false,
        error: {
          message: AGENT_MODEL_UNAVAILABLE_MESSAGE,
          code: ERROR_CODES.AGENT_MODEL_UNAVAILABLE,
        },
      });
    }
    auditLog(req, AUDIT_EVENT.AGENT_CHAT_ERROR, { userId, code: ERROR_CODES.AGENT_ERROR });
    return res.status(500).json({
      success: false,
      error: { message: AGENT_FAILURE_MESSAGE, code: ERROR_CODES.AGENT_ERROR },
    });
  }
}
