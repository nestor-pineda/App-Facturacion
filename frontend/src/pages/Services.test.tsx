import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { API_BASE_PATH } from '@/lib/constants';
import Services from './Services';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Services', () => {
  it('shows loading then list when request succeeds', async () => {
    render(<Services />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /servicios/i })).toBeInTheDocument();
    });

    expect(screen.getByText('Servicio Test')).toBeInTheDocument();
  });

  it('shows empty state when list is empty', async () => {
    server.use(
      http.get(`${API_BASE_PATH}/services`, () =>
        HttpResponse.json({ success: true, data: [] }, { status: 200 }),
      ),
    );

    render(<Services />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /servicios/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/no hay servicios|0 servicios/i)).toBeInTheDocument();
  });
});
