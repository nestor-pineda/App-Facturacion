import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/config/database', () => ({
  prisma: {
    invoice: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import * as invoiceService from '@/services/invoice.service';
import { prisma } from '@/config/database';

describe('invoiceService.list — date boundary handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hasta filter uses end-of-day (T23:59:59.999Z) to include the full boundary date', async () => {
    await invoiceService.list('user-1', { hasta: '2026-12-31' });

    const call = vi.mocked(prisma.invoice.findMany).mock.calls[0][0];
    const lteValue = (
      call?.where as Record<string, unknown> & { fecha_emision?: { lte?: Date } }
    )?.fecha_emision?.lte;

    expect(lteValue).toBeInstanceOf(Date);
    expect((lteValue as Date).toISOString()).toBe('2026-12-31T23:59:59.999Z');
  });

  it('desde filter uses start-of-day (T00:00:00.000Z)', async () => {
    await invoiceService.list('user-1', { desde: '2026-01-01' });

    const call = vi.mocked(prisma.invoice.findMany).mock.calls[0][0];
    const gteValue = (
      call?.where as Record<string, unknown> & { fecha_emision?: { gte?: Date } }
    )?.fecha_emision?.gte;

    expect(gteValue).toBeInstanceOf(Date);
    expect((gteValue as Date).toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});
