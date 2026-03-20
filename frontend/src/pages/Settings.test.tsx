import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, render, userEvent, waitFor } from '@/test/test-utils';
import Settings from '@/pages/Settings';

const loginMock = vi.fn();
const updateCurrentUserMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: unknown; login: typeof loginMock }) => unknown) =>
    selector({
      user: {
        id: 'u1',
        email: 'old@test.com',
        nombreComercial: 'Viejo Negocio',
        nif: '12345678A',
        direccionFiscal: 'Calle Antigua 1',
        telefono: '+34600000000',
      },
      login: loginMock,
    }),
}));

vi.mock('@/store/localeStore', () => ({
  useLocaleStore: (selector: (state: { locale: 'es' | 'en'; setLocale: (value: 'es' | 'en') => void }) => unknown) =>
    selector({
      locale: 'es',
      setLocale: vi.fn(),
    }),
}));

vi.mock('@/store/themeStore', () => ({
  useThemeStore: (selector: (state: { theme: 'light' | 'dark'; toggleTheme: () => void }) => unknown) =>
    selector({
      theme: 'light',
      toggleTheme: vi.fn(),
    }),
}));

vi.mock('@/api/endpoints/auth', () => ({
  updateCurrentUser: (...args: unknown[]) => updateCurrentUserMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

describe('Settings profile update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates profile and refreshes auth store user', async () => {
    updateCurrentUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'u1',
          email: 'new@test.com',
          nombreComercial: 'Nuevo Negocio',
          nif: '99999999Z',
          direccionFiscal: 'Calle Nueva 2',
          telefono: '+34611111111',
        },
      },
    });

    render(<Settings />);

    await userEvent.clear(screen.getByLabelText('Nombre comercial'));
    await userEvent.type(screen.getByLabelText('Nombre comercial'), 'Nuevo Negocio');
    await userEvent.clear(screen.getByLabelText('Email'));
    await userEvent.type(screen.getByLabelText('Email'), 'new@test.com');
    await userEvent.clear(screen.getByLabelText('NIF'));
    await userEvent.type(screen.getByLabelText('NIF'), '99999999Z');
    await userEvent.clear(screen.getByLabelText('Dirección fiscal'));
    await userEvent.type(screen.getByLabelText('Dirección fiscal'), 'Calle Nueva 2');
    await userEvent.clear(screen.getByLabelText('Teléfono (opcional)'));
    await userEvent.type(screen.getByLabelText('Teléfono (opcional)'), '+34611111111');

    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(updateCurrentUserMock).toHaveBeenCalledOnce();
      expect(loginMock).toHaveBeenCalledWith({
        id: 'u1',
        email: 'new@test.com',
        nombreComercial: 'Nuevo Negocio',
        nif: '99999999Z',
        direccionFiscal: 'Calle Nueva 2',
        telefono: '+34611111111',
      });
      expect(toastSuccessMock).toHaveBeenCalledOnce();
    });
  });

  it('shows error toast and does not mutate auth store when update fails', async () => {
    updateCurrentUserMock.mockRejectedValueOnce(new Error('Request failed'));

    render(<Settings />);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(updateCurrentUserMock).toHaveBeenCalledOnce();
      expect(loginMock).not.toHaveBeenCalled();
      expect(toastErrorMock).toHaveBeenCalledOnce();
    });
  });
});
