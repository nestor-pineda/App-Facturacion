import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const BACKEND_ROOT = resolve(__dirname, '../../..');

describe('GOOGLE_GENAI_API_KEY in env configuration', () => {
  it('permite GOOGLE_GENAI_API_KEY opcional (preprocess + string min(1) optional) en env.ts', () => {
    const envTs = readFileSync(resolve(BACKEND_ROOT, 'src/config/env.ts'), 'utf8');
    expect(envTs).toContain('GOOGLE_GENAI_API_KEY');
    expect(envTs).toMatch(/z\.string\(\)\.min\(1\)\.optional\(\)/);
  });

  it('documents GOOGLE_GENAI_API_KEY in .env.example', () => {
    const example = readFileSync(resolve(BACKEND_ROOT, '.env.example'), 'utf8');
    expect(example).toMatch(/^GOOGLE_GENAI_API_KEY=/m);
  });

  it('exige SEND_CONFIRMATION_SECRET independiente de JWT en env.ts y .env.example', () => {
    const envTs = readFileSync(resolve(BACKEND_ROOT, 'src/config/env.ts'), 'utf8');
    expect(envTs).toContain('SEND_CONFIRMATION_SECRET');
    expect(envTs).toContain('distinto de JWT_SECRET');
    const example = readFileSync(resolve(BACKEND_ROOT, '.env.example'), 'utf8');
    expect(example).toMatch(/^SEND_CONFIRMATION_SECRET=/m);
  });
});
