import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from '@/config/env';
import '@/agent/genkit.config';
import { generalLimiter, authLimiter } from '@/api/middlewares/rate-limit.middleware';
import authRouter from '@/api/routes/auth.routes';
import clientRouter from '@/api/routes/client.routes';
import serviceRouter from '@/api/routes/service.routes';
import quoteRouter from '@/api/routes/quote.routes';
import invoiceRouter from '@/api/routes/invoice.routes';
import userRouter from '@/api/routes/user.routes';

const isDev = env.NODE_ENV === 'development';
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());

const app = express();

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/clients', generalLimiter, clientRouter);
app.use('/api/v1/services', generalLimiter, serviceRouter);
app.use('/api/v1/quotes', generalLimiter, quoteRouter);
app.use('/api/v1/invoices', generalLimiter, invoiceRouter);
app.use('/api/v1/users', generalLimiter, userRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { message: 'Ruta no encontrada', code: 'NOT_FOUND' } });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
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
