import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';
import { env } from '@/config/env';

/**
 * Usamos `gemini20Flash` (modelo `gemini-2.0-flash` en la API).
 * `gemini15Flash` / `gemini-1.5-flash` devuelve 404 en v1beta (modelo retirado o no expuesto).
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: env.GOOGLE_GENAI_API_KEY,
    }),
  ],
});

export { gemini20Flash };
