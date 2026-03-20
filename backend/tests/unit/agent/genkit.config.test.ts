import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({
  env: {
    GOOGLE_GENAI_API_KEY: 'test-google-genai-api-key-for-unit-tests',
  },
}));

describe('genkit.config', () => {
  it('exports ai and gemini20Flash', async () => {
    const { ai, gemini20Flash } = await import('@/agent/genkit.config');
    expect(ai).toBeDefined();
    expect(typeof ai.generate).toBe('function');
    expect(gemini20Flash).toBeDefined();
  });
});
