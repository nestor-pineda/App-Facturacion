import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { API_BASE_PATH } from '@/lib/constants';
import { Routes, Route } from 'react-router-dom';
import Login from '@/features/auth/pages/Login';
import Invoices from '@/features/invoices/pages/Invoices';
import InvoiceCreate from '@/features/invoices/pages/InvoiceCreate';
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

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Invoice flow integration', () => {
  it('login redirects to dashboard then user can open invoices list and create invoice page', async () => {
    render(
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div data-testid="dashboard">Dashboard</div>} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/new" element={<InvoiceCreate />} />
      </Routes>,
      { routerProps: { initialEntries: ['/login'] } },
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/contraseña|password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión|login/i }));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    useAuthStore.getState().login(mockUser);
  });

  it('when logged in, invoices list loads and create invoice page shows form', async () => {
    useAuthStore.getState().login(mockUser);

    const { unmount } = render(
      <Routes>
        <Route path="/invoices" element={<Invoices />} />
      </Routes>,
      { routerProps: { initialEntries: ['/invoices'] } },
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /facturas/i })).toBeInTheDocument();
    });
    expect(screen.getByText('Cliente Test')).toBeInTheDocument();

    unmount();

    render(
      <Routes>
        <Route path="/invoices/new" element={<InvoiceCreate />} />
      </Routes>,
      { routerProps: { initialEntries: ['/invoices/new'] } },
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear factura|create invoice/i })).toBeInTheDocument();
    });
  });
});
