import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { env } from '@/config/env';

/**
 * `gemini-2.0-flash` ya no está disponible para cuentas/proyectos nuevos.
 * Migramos a `gemini-2.5-flash`, recomendado en la documentación actual de Genkit.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: env.GOOGLE_GENAI_API_KEY,
    }),
  ],
});
export const GEMINI_MODEL_NAME = 'gemini-2.5-flash' as const;

