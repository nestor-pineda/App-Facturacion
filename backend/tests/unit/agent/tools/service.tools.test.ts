import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/service.service');

import * as serviceService from '@/services/service.service';
import { createServiceTools } from '@/agent/tools/service.tools';

describe('createServiceTools', () => {
  const closureUserId = 'closure-user-id-22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searchServices llama a serviceService.search con el userId del closure', async () => {
    const serviceRow = {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      user_id: closureUserId,
      nombre: 'Consultoría',
      descripcion: 'Horas',
      precio_base: 120,
      iva_porcentaje: 21,
      created_at: new Date(),
      updated_at: new Date(),
    };
    vi.mocked(serviceService.search).mockResolvedValue([serviceRow as never]);

    const { searchServicesTool } = createServiceTools(closureUserId);
    const result = await searchServicesTool({ query: 'cons' });

    expect(serviceService.search).toHaveBeenCalledTimes(1);
    expect(serviceService.search).toHaveBeenCalledWith(closureUserId, 'cons');
    expect(result).toEqual([
      {
        id: serviceRow.id,
        nombre: serviceRow.nombre,
        descripcion: serviceRow.descripcion,
        precioBase: 120,
        ivaPorcentaje: 21,
      },
    ]);
  });

  it('listServices llama a serviceService.list con el userId del closure', async () => {
    vi.mocked(serviceService.list).mockResolvedValue([]);

    const { listServicesTool } = createServiceTools(closureUserId);
    await listServicesTool({});

    expect(serviceService.list).toHaveBeenCalledTimes(1);
    expect(serviceService.list).toHaveBeenCalledWith(closureUserId);
  });

  it('no usa userId del input: searchServices ignora userId extra y usa siempre el del closure', async () => {
    vi.mocked(serviceService.search).mockResolvedValue([]);

    const attackerId = '77777777-7777-7777-7777-777777777777';
    const { searchServicesTool } = createServiceTools(closureUserId);

    await searchServicesTool({
      query: 'x',
      userId: attackerId,
    } as { query: string; userId: string });

    expect(serviceService.search).toHaveBeenCalledWith(closureUserId, 'x');
    expect(serviceService.search).not.toHaveBeenCalledWith(attackerId, expect.anything());
  });

  it('no usa userId del input: listServices ignora userId extra y usa siempre el del closure', async () => {
    vi.mocked(serviceService.list).mockResolvedValue([]);

    const attackerId = '66666666-6666-6666-6666-666666666666';
    const { listServicesTool } = createServiceTools(closureUserId);

    await listServicesTool({ userId: attackerId } as Record<string, unknown>);

    expect(serviceService.list).toHaveBeenCalledWith(closureUserId);
    expect(serviceService.list).not.toHaveBeenCalledWith(attackerId);
  });
});
