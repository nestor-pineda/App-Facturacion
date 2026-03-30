import type { Request } from 'express';
import { logger } from '@/config/logger';

/** Mensaje fijo del log; el campo `context` identifica la operación para filtros estructurados. */
const CONTROLLER_ERROR_LOG_MESSAGE = 'Error no controlado en controlador de API';

export function logControllerError(req: Request, context: string, err: unknown) {
  if (err instanceof Error) {
    logger.error({ err, requestId: req.requestId, context }, CONTROLLER_ERROR_LOG_MESSAGE);
    return;
  }
  logger.error(
    { requestId: req.requestId, context, detail: String(err) },
    CONTROLLER_ERROR_LOG_MESSAGE,
  );
}
