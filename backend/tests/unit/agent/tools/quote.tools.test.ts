import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/quote.service');

import * as quoteService from '@/services/quote.service';
import { createQuoteTools } from '@/agent/tools/quote.tools';

describe('createQuoteTools', () => {
  const closureUserId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createQuote llama a quoteService.create con userId del closure', async () => {
    const createPayload = {
      clientId: '22222222-2222-2222-2222-222222222222',
      fecha: '2026-03-20',
      lines: [
        {
          descripcion: 'Servicio',
          cantidad: 1,
          precioUnitario: 100,
          ivaPorcentaje: 21,
        },
      ],
    };
    const created = {
      id: '33333333-3333-3333-3333-333333333333',
      estado: 'borrador' as const,
      subtotal: 100,
      total_iva: 21,
      total: 121,
    };
    vi.mocked(quoteService.create).mockResolvedValue(created as never);

    const { createQuoteTool } = createQuoteTools(closureUserId);
    await createQuoteTool(createPayload);

    expect(quoteService.create).toHaveBeenCalledTimes(1);
    expect(quoteService.create).toHaveBeenCalledWith(closureUserId, {
      client_id: createPayload.clientId,
      fecha: createPayload.fecha,
      notas: undefined,
      lines: [
        {
          descripcion: createPayload.lines[0].descripcion,
          cantidad: createPayload.lines[0].cantidad,
          precio_unitario: createPayload.lines[0].precioUnitario,
          iva_porcentaje: createPayload.lines[0].ivaPorcentaje,
        },
      ],
    });
  });

  it('listQuotes usa userId del closure en quoteService.list', async () => {
    vi.mocked(quoteService.list).mockResolvedValue([]);

    const { listQuotesTool } = createQuoteTools(closureUserId);
    await listQuotesTool({
      estado: 'borrador',
      clientId: '55555555-5555-5555-5555-555555555555',
    });

    expect(quoteService.list).toHaveBeenCalledWith(closureUserId, {
      estado: 'borrador',
      client_id: '55555555-5555-5555-5555-555555555555',
    });
  });

  it('getQuote usa userId del closure en quoteService.getById', async () => {
    vi.mocked(quoteService.getById).mockResolvedValue({
      id: '66666666-6666-6666-6666-666666666666',
      estado: 'borrador',
      client_id: '22222222-2222-2222-2222-222222222222',
      fecha: new Date('2026-03-20'),
      notas: null,
      subtotal: 100,
      total_iva: 21,
      total: 121,
      lines: [],
      client: { id: '22222222-2222-2222-2222-222222222222', nombre: 'Acme', email: 'a@b.c' },
    } as never);

    const { getQuoteTool } = createQuoteTools(closureUserId);
    const id = '66666666-6666-6666-6666-666666666666';
    await getQuoteTool({ quoteId: id });

    expect(quoteService.getById).toHaveBeenCalledWith(closureUserId, id);
  });
});
