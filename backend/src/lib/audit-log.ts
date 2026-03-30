import type { Request } from 'express';
import { logger } from '@/config/logger';

export function auditLog(req: Request, event: string, data: Record<string, unknown> = {}) {
  logger.info({
    type: 'audit',
    event,
    requestId: req.requestId,
    ...data,
  });
}
