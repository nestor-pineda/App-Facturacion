import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';
import { env } from '@/config/env';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: env.GOOGLE_GENAI_API_KEY,
    }),
  ],
});

export { gemini20Flash };
