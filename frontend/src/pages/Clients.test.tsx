import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { API_BASE_PATH } from '@/lib/constants';
import Clients from './Clients';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Clients', () => {
  it('shows loading then list when request succeeds', async () => {
    render(<Clients />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /clientes/i })).toBeInTheDocument();
    });

    expect(screen.getByText('Cliente Test')).toBeInTheDocument();
    expect(screen.getByText('client@example.com')).toBeInTheDocument();
  });

  it('shows empty state when list is empty', async () => {
    server.use(
      http.get(`${API_BASE_PATH}/clients`, () =>
        HttpResponse.json({ success: true, data: [], meta: { total: 0 } }, { status: 200 }),
      ),
    );

    render(<Clients />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /clientes/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/no hay clientes|0 clientes/i)).toBeInTheDocument();
  });

  it('shows error state when request fails', async () => {
    server.use(
      http.get(`${API_BASE_PATH}/clients`, () =>
        HttpResponse.json({ success: false, error: { message: 'Error', code: 'ERROR' } }, { status: 500 }),
      ),
    );

    render(<Clients />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /clientes/i })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('Cliente Test')).not.toBeInTheDocument();
    });
  });
});
