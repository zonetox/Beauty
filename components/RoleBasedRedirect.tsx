/**
 * Role-Based Redirect Component
 * 
 * Routes users to correct area based on resolved role from database.
 * NO guessing. NO fallbacks.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import { resolveUserRole, UserRole } from '../lib/roleResolution';
import LoadingState from './LoadingState.tsx';

interface RoleBasedRedirectProps {
  children: React.ReactNode;
  requiredRole?: UserRole[];
  redirectTo?: string;
}

const RoleBasedRedirect: React.FC<RoleBasedRedirectProps> = ({
  children,
  requiredRole,
  redirectTo
}) => {
  const { user, profile, state } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<UserRole | 'loading' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performRedirect = async () => {
      if (state === 'loading') return;

      // Not authenticated
      if (!user) {
        navigate('/login', { state: { from: location }, replace: true });
        return;
      }

      // Profile required
      if (!profile) {
        setRole('error');
        setError('Profile not found. Account is incomplete.');
        return;
      }

      // Resolve role
      try {
        const roleResult = await resolveUserRole(user);

        if (roleResult.error) {
          setRole('error');
          setError(roleResult.error);
          return;
        }

        setRole(roleResult.role);

        // If redirectTo is specified, redirect based on role
        if (redirectTo) {
          navigate(redirectTo, { replace: true });
          return;
        }

        // Auto-redirect based on role
        if (roleResult.role === 'business_owner' && roleResult.business_id) {
          navigate('/account', { replace: true });
        } else if (roleResult.role === 'admin') {
          // Admin can access admin panel
          navigate('/admin', { replace: true });
        } else if (roleResult.role === 'user') {
          // Regular user stays on current page or goes to homepage
          if (location.pathname === '/login' || location.pathname === '/register') {
            navigate('/', { replace: true });
          }
        }
      } catch (err: unknown) {
        console.error('Error resolving user role:', err);
        setRole('error');
        setError(`Role resolution failed: ${(err as Error).message}`);
      }
    };

    performRedirect();
  }, [user, profile, state, navigate, location, redirectTo]);

  // Loading
  if (state === 'loading' || role === 'loading') {
    return <LoadingState message="Resolving user role..." />;
  }

  // Error - BLOCK access
  if (role === 'error') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Setup Incomplete</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to determine account type.'}</p>
          <p className="text-sm text-gray-500">Please contact support.</p>
        </div>
      </div>
    );
  }

  // Check required role
  if (requiredRole && !requiredRole.includes(role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You do not have permission to access this area.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRedirect;
