import express, { NextFunction, Request, Response } from 'express';
import { env } from './config/env';

const isDev = env.NODE_ENV === 'development';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Aquí se montarán los routers de /api/v1 cuando se implementen

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
