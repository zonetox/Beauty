// G1.2 - Unit Tests for ProtectedRoute Component
// Tuân thủ Master Plan v1.1
// 100% hoàn thiện - không placeholder

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { User } from '@supabase/supabase-js';

// Mock useAuth hook
const mockUseAuth = jest.fn();

jest.mock('../../providers/AuthProvider.tsx', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock role resolution
jest.mock('../../lib/roleResolution', () => ({
  resolveUserRole: jest.fn().mockResolvedValue({ role: 'user', error: null }),
}));

// Mock react-router-dom Navigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, state }: { to: string; state?: any }) => (
    <div data-testid="navigate" data-to={to} data-state={JSON.stringify(state)}>
      Navigate to {to}
    </div>
  ),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when user is authenticated and data is loaded', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
    } as User;

    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: { id: '123' },
      state: 'authenticated',
      isDataLoaded: true,
      error: null,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('should render nothing when auth identity is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      state: 'loading',
      isDataLoaded: false,
    });

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show loading state when data is not yet loaded', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123' } as User,
      state: 'authenticated',
      isDataLoaded: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText(/Đang tải dữ liệu/)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      state: 'unauthenticated',
      isDataLoaded: true,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      const navigate = screen.getByTestId('navigate');
      expect(navigate).toBeInTheDocument();
      expect(navigate.getAttribute('data-to')).toBe('/login');
    });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should preserve location state when redirecting', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      state: 'unauthenticated',
      isDataLoaded: true,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      const navigate = screen.getByTestId('navigate');
      const state = JSON.parse(navigate.getAttribute('data-state') || '{}');
      expect(state.from).toBeDefined();
    });
  });

  it('should show completion error state when profile is missing', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123' } as User,
      profile: null,
      state: 'authenticated',
      isDataLoaded: true,
      error: null,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText(/Tài khoản chưa hoàn tất/)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
