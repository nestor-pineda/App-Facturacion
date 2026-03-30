import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-Id';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.get(REQUEST_ID_HEADER);
  const id = incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID();
  req.requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}
