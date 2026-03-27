import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/client.service');

import * as clientService from '@/services/client.service';
import { createClientTools } from '@/agent/tools/client.tools';

describe('createClientTools', () => {
  const closureUserId = 'closure-user-id-11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searchClients llama a clientService.search con el userId del closure', async () => {
    const clientRow = {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      user_id: closureUserId,
      nombre: 'Acme SL',
      email: 'info@acme.test',
      cif_nif: 'B12345678',
      direccion: 'Calle 1',
      telefono: null as string | null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    vi.mocked(clientService.search).mockResolvedValue([clientRow]);

    const { searchClientsTool } = createClientTools(closureUserId);
    const result = await searchClientsTool({ query: 'acme' });

    expect(clientService.search).toHaveBeenCalledTimes(1);
    expect(clientService.search).toHaveBeenCalledWith(closureUserId, 'acme');
    expect(result).toEqual([
      {
        id: clientRow.id,
        nombre: clientRow.nombre,
        email: clientRow.email,
        cifNif: clientRow.cif_nif,
      },
    ]);
  });

  it('listClients llama a clientService.list con el userId del closure', async () => {
    vi.mocked(clientService.list).mockResolvedValue({ data: [], total: 0 });

    const { listClientsTool } = createClientTools(closureUserId);
    await listClientsTool({});

    expect(clientService.list).toHaveBeenCalledTimes(1);
    expect(clientService.list).toHaveBeenCalledWith(closureUserId);
  });

  it('no usa userId del input: searchClients ignora userId extra y usa siempre el del closure', async () => {
    vi.mocked(clientService.search).mockResolvedValue([]);

    const attackerId = '99999999-9999-9999-9999-999999999999';
    const { searchClientsTool } = createClientTools(closureUserId);

    await searchClientsTool({
      query: 'x',
      userId: attackerId,
    } as { query: string; userId: string });

    expect(clientService.search).toHaveBeenCalledWith(closureUserId, 'x');
    expect(clientService.search).not.toHaveBeenCalledWith(attackerId, expect.anything());
  });

  it('no usa userId del input: listClients ignora userId extra y usa siempre el del closure', async () => {
    vi.mocked(clientService.list).mockResolvedValue({ data: [], total: 0 });

    const attackerId = '88888888-8888-8888-8888-888888888888';
    const { listClientsTool } = createClientTools(closureUserId);

    await listClientsTool({ userId: attackerId } as Record<string, unknown>);

    expect(clientService.list).toHaveBeenCalledWith(closureUserId);
    expect(clientService.list).not.toHaveBeenCalledWith(attackerId);
  });
});
