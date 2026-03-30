import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/invoice.service');

import * as invoiceService from '@/services/invoice.service';
import { createInvoiceTools } from '@/agent/tools/invoice.tools';

describe('createInvoiceTools', () => {
  const closureUserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createInvoice llama a invoiceService.create con userId del closure', async () => {
    const createPayload = {
      clientId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      fechaEmision: '2026-03-20',
      lines: [
        {
          descripcion: 'Consultoría',
          cantidad: 2,
          precioUnitario: 50,
          ivaPorcentaje: 21,
        },
      ],
    };
    const created = {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      estado: 'borrador' as const,
      subtotal: 100,
      total_iva: 21,
      total: 121,
    };
    vi.mocked(invoiceService.create).mockResolvedValue(created as never);

    const { createInvoiceTool } = createInvoiceTools(closureUserId);
    await createInvoiceTool(createPayload);

    expect(invoiceService.create).toHaveBeenCalledTimes(1);
    expect(invoiceService.create).toHaveBeenCalledWith(closureUserId, {
      client_id: createPayload.clientId,
      fecha_emision: createPayload.fechaEmision,
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

  it('listInvoices usa userId del closure en invoiceService.list', async () => {
    vi.mocked(invoiceService.list).mockResolvedValue([]);

    const { listInvoicesTool } = createInvoiceTools(closureUserId);
    await listInvoicesTool({
      estado: 'borrador',
      clientId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    });

    expect(invoiceService.list).toHaveBeenCalledWith(closureUserId, {
      estado: 'borrador',
      client_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    });
  });

  it('getInvoice usa userId del closure en invoiceService.getById', async () => {
    vi.mocked(invoiceService.getById).mockResolvedValue({
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      estado: 'borrador',
      client_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      fecha_emision: new Date('2026-03-20'),
      notas: null,
      subtotal: 100,
      total_iva: 21,
      total: 121,
      numero: null,
      lines: [],
      client: { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', nombre: 'Acme', email: 'a@b.c' },
    } as never);

    const { getInvoiceTool } = createInvoiceTools(closureUserId);
    const id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    await getInvoiceTool({ invoiceId: id });

    expect(invoiceService.getById).toHaveBeenCalledWith(closureUserId, id);
  });
});
