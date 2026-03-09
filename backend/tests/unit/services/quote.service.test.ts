import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/config/database', () => ({
  prisma: {
    quote: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import * as quoteService from '@/services/quote.service';
import { prisma } from '@/config/database';

describe('quoteService.list — date boundary handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hasta filter uses end-of-day (T23:59:59.999Z) to include the full boundary date', async () => {
    await quoteService.list('user-1', { hasta: '2026-12-31' });

    const call = vi.mocked(prisma.quote.findMany).mock.calls[0][0];
    const lteValue = (call?.where as Record<string, unknown> & { fecha?: { lte?: Date } })?.fecha?.lte;

    expect(lteValue).toBeInstanceOf(Date);
    expect((lteValue as Date).toISOString()).toBe('2026-12-31T23:59:59.999Z');
  });

  it('desde filter uses start-of-day (T00:00:00.000Z)', async () => {
    await quoteService.list('user-1', { desde: '2026-01-01' });

    const call = vi.mocked(prisma.quote.findMany).mock.calls[0][0];
    const gteValue = (call?.where as Record<string, unknown> & { fecha?: { gte?: Date } })?.fecha?.gte;

    expect(gteValue).toBeInstanceOf(Date);
    expect((gteValue as Date).toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});
