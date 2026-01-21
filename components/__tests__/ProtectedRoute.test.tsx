// G1.2 - Unit Tests for ProtectedRoute Component
// Tuân thủ Master Plan v1.1
// 100% hoàn thiện - không placeholder


import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { User } from '@supabase/supabase-js';


// Mock useUserSession hook
const mockUseUserSession = jest.fn();
jest.mock('../../contexts/UserSessionContext', () => ({
  ...jest.requireActual('../../contexts/UserSessionContext'),
  useUserSession: () => mockUseUserSession(),
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

  it('should render children when user is authenticated', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
    } as User;

    mockUseUserSession.mockReturnValue({
      currentUser: mockUser,
      loading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show loading state when loading', () => {
    mockUseUserSession.mockReturnValue({
      currentUser: null,
      loading: true,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    mockUseUserSession.mockReturnValue({
      currentUser: null,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toBeInTheDocument();
    expect(navigate.getAttribute('data-to')).toBe('/login');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should preserve location state when redirecting', () => {
    mockUseUserSession.mockReturnValue({
      currentUser: null,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    const navigate = screen.getByTestId('navigate');
    const state = JSON.parse(navigate.getAttribute('data-state') || '{}');
    expect(state.from).toBeDefined();
  });
});

