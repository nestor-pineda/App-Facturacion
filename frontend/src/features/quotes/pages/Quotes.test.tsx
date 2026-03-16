import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { API_BASE_PATH } from '@/lib/constants';
import Quotes from './Quotes';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Quotes', () => {
  it('shows loading then list when request succeeds', async () => {
    render(<Quotes />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /presupuestos/i })).toBeInTheDocument();
    });

    expect(screen.getByText('Cliente Test')).toBeInTheDocument();
  });

  it('shows empty state when list is empty', async () => {
    server.use(
      http.get(`${API_BASE_PATH}/quotes`, () =>
        HttpResponse.json({ success: true, data: [] }, { status: 200 }))
    );

    render(<Quotes />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /presupuestos/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/no hay presupuestos|0 presupuestos/i)).toBeInTheDocument();
  });
});
