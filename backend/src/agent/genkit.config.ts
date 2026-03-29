import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { env } from '@/config/env';

/**
 * Plugin oficial actual: `@genkit-ai/google-genai` (sustituye a `@genkit-ai/googleai`).
 * Modelo Gemini 3 Flash según IDs conocidos del SDK: `gemini-3-flash-preview`.
 *
 * Sin `GOOGLE_GENAI_API_KEY` no se registra el plugin; el arranque del servidor sigue siendo válido.
 */
export const ai = genkit({
  plugins: env.GOOGLE_GENAI_API_KEY
    ? [
        googleAI({
          apiKey: env.GOOGLE_GENAI_API_KEY,
        }),
      ]
    : [],
});
export const GEMINI_MODEL_NAME = 'gemini-3-flash-preview' as const;

