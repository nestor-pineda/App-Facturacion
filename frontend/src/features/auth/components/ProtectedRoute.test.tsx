import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from '@/store/authStore';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReset();
  });

  it('redirects to /login when not authenticated', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: (s: { isAuthenticated: boolean }) => unknown) =>
      selector({ isAuthenticated: false }) as never,
    );

    render(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>,
      { routerProps: { initialEntries: ['/'] } },
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders Outlet when authenticated', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: (s: { isAuthenticated: boolean }) => unknown) =>
      selector({ isAuthenticated: true }) as never,
    );

    render(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected content</div>} />
        </Route>
      </Routes>,
      { routerProps: { initialEntries: ['/'] } },
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
