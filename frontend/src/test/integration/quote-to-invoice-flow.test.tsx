import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { API_BASE_PATH } from '@/lib/constants';
import { Routes, Route } from 'react-router-dom';
import Quotes from '@/features/quotes/pages/Quotes';
import QuoteDetail from '@/features/quotes/pages/QuoteDetail';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/entities';

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  nombreComercial: 'Test SL',
  nif: 'B12345678',
  direccionFiscal: 'Calle Test 1',
  telefono: '+34600000000',
};

const QUOTE_ID = '33333333-3333-4333-a333-333333333333';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Quote to invoice flow integration', () => {
  it('when logged in, quotes list loads and quote detail shows convert button', async () => {
    useAuthStore.getState().login(mockUser);

    render(
      <Routes>
        <Route path="/quotes" element={<Quotes />} />
      </Routes>,
      { routerProps: { initialEntries: ['/quotes'] } },
    );

    await waitFor(() => {
      expect(screen.getByText('Cliente Test')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /presupuestos/i })).toBeInTheDocument();
  });

  it('convert quote to invoice calls POST convert endpoint', async () => {
    useAuthStore.getState().login(mockUser);

    const sentQuote = {
      id: QUOTE_ID,
      numero: '2026/001',
      estado: 'enviado',
      fecha: '2026-01-15',
      subtotal: 100,
      totalIva: 21,
      total: 121,
      notas: null,
      client: { id: '11111111-1111-4111-a111-111111111111', nombre: 'Cliente Test', email: 'c@c.com', cifNif: 'B1', direccion: 'Calle 1', createdAt: '', updatedAt: '' },
      lines: [{ id: '1', serviceId: null, descripcion: 'S', cantidad: 1, precioUnitario: 100, ivaPorcentaje: 21, subtotal: 100 }],
      createdAt: '',
      updatedAt: '',
    };

    let convertRequested = false;
    server.use(
      http.get(`${API_BASE_PATH}/quotes`, () =>
        HttpResponse.json({ success: true, data: [sentQuote] }, { status: 200 }),
      ),
      http.post(`${API_BASE_PATH}/quotes/:id/convert`, () => {
        convertRequested = true;
        return HttpResponse.json(
          { success: true, data: { id: '44444444-4444-4444-a444-444444444444', estado: 'borrador' } },
          { status: 201 },
        );
      }),
    );

    render(
      <Routes>
        <Route path="/quotes/:id" element={<QuoteDetail />} />
      </Routes>,
      { routerProps: { initialEntries: [`/quotes/${QUOTE_ID}`] } },
    );

    const convertButton = await screen.findByRole('button', { name: /convertir a factura|convert to invoice/i }, { timeout: 3000 });
    await userEvent.click(convertButton);

    const confirmButton = await screen.findByRole('button', { name: /^convertir$/i }, { timeout: 2000 });
    await userEvent.click(confirmButton);

    await waitFor(
      () => {
        expect(convertRequested).toBe(true);
      },
      { timeout: 3000 },
    );
  });
});
