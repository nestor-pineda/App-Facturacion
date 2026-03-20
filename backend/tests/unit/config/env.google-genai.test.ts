import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const BACKEND_ROOT = resolve(__dirname, '../../..');

describe('GOOGLE_GENAI_API_KEY in env configuration', () => {
  it('validates GOOGLE_GENAI_API_KEY as non-empty string in env.ts', () => {
    const envTs = readFileSync(resolve(BACKEND_ROOT, 'src/config/env.ts'), 'utf8');
    expect(envTs).toMatch(/GOOGLE_GENAI_API_KEY:\s*z\.string\(\)\.min\(1/);
  });

  it('documents GOOGLE_GENAI_API_KEY in .env.example', () => {
    const example = readFileSync(resolve(BACKEND_ROOT, '.env.example'), 'utf8');
    expect(example).toMatch(/^GOOGLE_GENAI_API_KEY=/m);
  });
});
