// G1.2 - Unit Tests for PermissionGuard Component
// Tuân thủ Master Plan v1.1
// 100% hoàn thiện - không placeholder

// Mock useAdminAuth hook BEFORE imports
const mockUseAdminAuth = jest.fn();

jest.mock('../../contexts/AdminContext', () => {
  return {
    useAdminAuth: () => mockUseAdminAuth(),
    useAdmin: () => ({
      logAdminAction: jest.fn(),
      currentUser: null,
    }),
  };
});

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PermissionGuard from '../PermissionGuard';
import { AuthenticatedAdmin, AdminPermissions, AdminUserRole } from '../../types';

describe('PermissionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when user has permission', () => {
    const userWithPermission: AuthenticatedAdmin = {
      id: 1,
      user_name: 'admin',
      email: 'admin@test.com',
      role: AdminUserRole.ADMIN,
      permissions: {
        can_manage_businesses: true,
        can_manage_users: true,
      } as AdminPermissions,
      is_locked: false,
      authUser: null as any,
    };

    mockUseAdminAuth.mockReturnValue({
      currentUser: userWithPermission,
    });

    render(
      <MemoryRouter>
        <PermissionGuard permission="can_manage_businesses">
          <div>Protected Content</div>
        </PermissionGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show ForbiddenState when user does not have permission', () => {
    const userWithoutPermission: AuthenticatedAdmin = {
      id: 1,
      user_name: 'admin',
      email: 'admin@test.com',
      role: AdminUserRole.EDITOR,
      permissions: {
        can_manage_businesses: false,
        can_manage_users: false,
      } as AdminPermissions,
      is_locked: false,
      authUser: null as any,
    };

    mockUseAdminAuth.mockReturnValue({
      currentUser: userWithoutPermission,
    });

    render(
      <MemoryRouter>
        <PermissionGuard permission="can_manage_businesses">
          <div>Protected Content</div>
        </PermissionGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show ForbiddenState when user is not logged in', () => {
    mockUseAdminAuth.mockReturnValue({
      currentUser: null,
    });

    render(
      <MemoryRouter>
        <PermissionGuard permission="can_manage_businesses">
          <div>Protected Content</div>
        </PermissionGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/You must be logged in as an admin/)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render fallback when provided and user does not have permission', () => {
    const userWithoutPermission: AuthenticatedAdmin = {
      id: 1,
      user_name: 'admin',
      email: 'admin@test.com',
      role: AdminUserRole.EDITOR,
      permissions: {
        can_manage_businesses: false,
      } as AdminPermissions,
      is_locked: false,
      authUser: null as any,
    };

    mockUseAdminAuth.mockReturnValue({
      currentUser: userWithoutPermission,
    });

    render(
      <MemoryRouter>
        <PermissionGuard
          permission="can_manage_businesses"
          fallback={<div>Custom Fallback</div>}
          showForbiddenState={false}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

