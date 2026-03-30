import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { BROWSER_MUTATION_HEADER_NAME } from '@/api/constants/browser-mutation.constants';
import { browserMutationGuard } from '@/api/middlewares/browser-mutation-guard.middleware';
import { requestIdMiddleware } from '@/api/middlewares/request-id.middleware';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import '@/agent/genkit.config';
import { generalLimiter, authLimiter } from '@/api/middlewares/rate-limit.middleware';
import authRouter from '@/api/routes/auth.routes';
import clientRouter from '@/api/routes/client.routes';
import serviceRouter from '@/api/routes/service.routes';
import quoteRouter from '@/api/routes/quote.routes';
import invoiceRouter from '@/api/routes/invoice.routes';
import userRouter from '@/api/routes/user.routes';
import agentRouter from '@/agent/agent.routes';

const isDev = env.NODE_ENV === 'development';

/** Métodos que expone la API REST (OPTIONS lo usa el preflight CORS). */
const CORS_ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as const;

const UNHANDLED_ERROR_LOG_LABEL = '[express] Unhandled error';

const app = express();

app.use(requestIdMiddleware);
app.use(helmet());
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
    methods: [...CORS_ALLOWED_METHODS],
    allowedHeaders: ['Content-Type', BROWSER_MUTATION_HEADER_NAME],
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(browserMutationGuard);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/clients', generalLimiter, clientRouter);
app.use('/api/v1/services', generalLimiter, serviceRouter);
app.use('/api/v1/quotes', generalLimiter, quoteRouter);
app.use('/api/v1/invoices', generalLimiter, invoiceRouter);
app.use('/api/v1/users', generalLimiter, userRouter);
app.use('/api/v1/agent', generalLimiter, agentRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { message: 'Ruta no encontrada', code: 'NOT_FOUND' } });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(
    { err, requestId: req.requestId, label: UNHANDLED_ERROR_LOG_LABEL },
    UNHANDLED_ERROR_LOG_LABEL,
  );
  res.status(500).json({
    success: false,
    error: {
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
      ...(isDev && { stack: err.stack }),
    },
  });
});

export default app;
