import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({
  env: {
    GOOGLE_GENAI_API_KEY: 'test-google-genai-api-key-for-unit-tests',
  },
}));

describe('genkit.config', () => {
  it('exports ai and GEMINI_MODEL_NAME', async () => {
    const { ai, GEMINI_MODEL_NAME } = await import('@/agent/genkit.config');
    expect(ai).toBeDefined();
    expect(typeof ai.generate).toBe('function');
    expect(GEMINI_MODEL_NAME).toBe('gemini-2.5-flash');
  });
});
