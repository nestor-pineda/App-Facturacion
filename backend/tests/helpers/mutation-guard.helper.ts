import type { Test } from 'supertest';
import { BROWSER_MUTATION_HEADER_NAME, BROWSER_MUTATION_HEADER_VALUE } from '@/api/constants/browser-mutation.constants';
import { parseAllowedOriginsList } from '@/api/middlewares/browser-mutation-guard.middleware';
import { env } from '@/config/env';

const primaryAllowedOrigin = (): string => {
  const list = parseAllowedOriginsList(env.ALLOWED_ORIGINS);
  const first = list[0];
  if (!first) {
    throw new Error('ALLOWED_ORIGINS debe definir al menos un origen para tests');
  }
  return first;
};

export const mutationGuardHeaders = (): Record<string, string> => ({
  Origin: primaryAllowedOrigin(),
  [BROWSER_MUTATION_HEADER_NAME]: BROWSER_MUTATION_HEADER_VALUE,
});

/** Aplica Origin + cabecera anti-CSRF a peticiones POST/PUT/PATCH/DELETE en tests. */
export const withMutationGuards = <T extends Pick<Test, 'set'>>(req: T): T =>
  req.set(mutationGuardHeaders()) as T;
