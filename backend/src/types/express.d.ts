import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
    };
    /** Mismo valor que `user.id` tras `authenticate` (convención del agente IA). */
    userId?: string;
  }
}
