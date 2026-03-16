import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { User } from '@/types/entities';

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  nombreComercial: 'Test SL',
  nif: 'B12345678',
  direccionFiscal: 'Calle Test 1',
  telefono: '+34600000000',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('has initial state with user null and isAuthenticated false', () => {
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('login sets user and isAuthenticated true', () => {
    useAuthStore.getState().login(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('logout clears user and sets isAuthenticated false', () => {
    useAuthStore.getState().login(mockUser);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
