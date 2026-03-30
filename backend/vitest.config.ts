import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    env: {
      GOOGLE_GENAI_API_KEY: 'vitest-placeholder-google-genai-api-key',
      SEND_CONFIRMATION_SECRET: 'vitest-send-confirmation-secret-32chars-min',
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    // Los tests de integración comparten la misma DB: ejecución secuencial obligatoria
    fileParallelism: false,
  },
});
