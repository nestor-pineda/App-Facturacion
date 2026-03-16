import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { API_BASE_PATH } from '@/lib/constants';
import Invoices from './Invoices';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Invoices', () => {
  it('shows loading then list when request succeeds', async () => {
    render(<Invoices />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /facturas/i })).toBeInTheDocument();
    });

    expect(screen.getByText('Cliente Test')).toBeInTheDocument();
  });

  it('shows empty state when list is empty', async () => {
    server.use(
      http.get(`${API_BASE_PATH}/invoices`, () =>
        HttpResponse.json({ success: true, data: [] }, { status: 200 }),
      ),
    );

    render(<Invoices />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /facturas/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/no hay facturas|0 facturas/i)).toBeInTheDocument();
  });
});
