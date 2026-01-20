// Admin Protected Route - Requires admin access from database
// NO dev fallbacks. NO hardcoded admins.
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import { resolveUserRole } from '../lib/roleResolution';
import LoadingState from './LoadingState.tsx';

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
    const { user, profile, state } = useAuth();
    const location = useLocation();
    const [isAdmin, setIsAdmin] = useState<boolean | 'loading'>('loading');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        let timeoutId: NodeJS.Timeout | null = null;

        const verifyAdmin = async () => {
            // Wait for auth to finish loading
            if (state === 'loading') {
                return;
            }

            // If no user or profile, not admin
            if (!user || !profile) {
                if (mounted) {
                    setIsAdmin(false);
                }
                return;
            }

            try {
                // Add timeout to prevent hanging (10 seconds)
                timeoutId = setTimeout(() => {
                    if (mounted) {
                        setError('Admin verification timed out. Please try refreshing the page.');
                        setIsAdmin(false);
                    }
                }, 10000);

                // Add timeout wrapper for resolveUserRole
                const roleResolutionTimeout = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Role resolution timeout')), 8000);
                });

                const roleResult = await Promise.race([
                    resolveUserRole(user),
                    roleResolutionTimeout
                ]);

                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                if (!mounted) return;

                if (roleResult.error) {
                    setError(roleResult.error);
                    setIsAdmin(false);
                    return;
                }

                // MANDATORY: Admin access ONLY from admin_users table
                // NO fallbacks. NO dev shortcuts.
                // Admin must have: admin_users.email = auth.users.email AND is_locked = FALSE
                const adminStatus = roleResult.isAdmin && roleResult.role === 'admin';
                
                if (!adminStatus) {
                    setError('Admin access denied. Admin privileges are determined from the admin_users table. Your email is not registered as an admin.');
                }
                
                setIsAdmin(adminStatus);
            } catch (err: unknown) {
                // CRITICAL: Always clear loading state, even on error/timeout
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                if (!mounted) return;

                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                
                if (errorMessage.includes('timeout')) {
                    setError('Admin verification timed out. Please check your connection and try again.');
                } else {
                    setError(`Admin verification failed: ${errorMessage}`);
                }
                
                setIsAdmin(false);
            }
        };

        verifyAdmin();

        return () => {
            mounted = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [user, profile, state]);

    if (state === 'loading' || isAdmin === 'loading') {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <LoadingState message="Checking admin authentication..." />
            </div>
        );
    }

    if (!user || !profile) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="text-red-500 text-5xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-6">
                        {error || 'You do not have admin privileges. Admin access is determined from the database.'}
                    </p>
                    <Navigate to="/admin/login" state={{ from: location }} replace />
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminProtectedRoute;
