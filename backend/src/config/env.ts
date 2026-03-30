import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/** Parsea ALLOWED_ORIGINS (coma-separada) para CORS y browser mutation guard. */
export const parseAllowedOriginsList = (raw: string): string[] =>
  raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener mínimo 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener mínimo 32 caracteres'),
  /** Secreto independiente para JWT de confirmación de envío (factura/presupuesto); no reutilizar JWT_SECRET. */
  SEND_CONFIRMATION_SECRET: z
    .string()
    .min(32, 'SEND_CONFIRMATION_SECRET debe tener mínimo 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.string().transform(Number).pipe(z.number().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  ALLOWED_ORIGINS: z
    .string()
    .trim()
    .min(1, 'ALLOWED_ORIGINS no puede estar vacío')
    .transform(parseAllowedOriginsList)
    .pipe(
      z
        .array(z.string().min(1))
        .min(1, 'Debe haber al menos un origen válido en ALLOWED_ORIGINS (URLs separadas por coma)')
        .refine((list) => !list.includes('*'), {
          message:
            'ALLOWED_ORIGINS no puede incluir *: con cookies/credenciales cada origen debe ser explícito (sin comodín)',
        }),
    ),
  /** Opcional: sin clave el servidor arranca pero el agente IA responde 503 (útil p. ej. Render sin AI). */
  GOOGLE_GENAI_API_KEY: z.preprocess(
    (val) => {
      if (val === undefined || val === '') return undefined;
      if (typeof val === 'string' && val.trim() === '') return undefined;
      return val;
    },
    z.string().min(1).optional()
  ),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('Facturación <noreply@facturacion.app>'),
})
  .refine((data) => data.JWT_SECRET !== data.JWT_REFRESH_SECRET, {
    message: 'JWT_SECRET y JWT_REFRESH_SECRET deben ser distintos',
    path: ['JWT_REFRESH_SECRET'],
  })
  .refine((data) => data.SEND_CONFIRMATION_SECRET !== data.JWT_SECRET, {
    message: 'SEND_CONFIRMATION_SECRET debe ser distinto de JWT_SECRET',
    path: ['SEND_CONFIRMATION_SECRET'],
  })
  .refine((data) => data.SEND_CONFIRMATION_SECRET !== data.JWT_REFRESH_SECRET, {
    message: 'SEND_CONFIRMATION_SECRET debe ser distinto de JWT_REFRESH_SECRET',
    path: ['SEND_CONFIRMATION_SECRET'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas o faltantes:\n');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
