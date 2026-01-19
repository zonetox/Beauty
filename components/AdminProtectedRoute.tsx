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
        const verifyAdmin = async () => {
            if (state === 'loading') return;

            if (!user || !profile) {
                setIsAdmin(false);
                return;
            }

            try {
                const roleResult = await resolveUserRole(user);
                
                if (roleResult.error) {
                    setError(roleResult.error);
                    setIsAdmin(false);
                    return;
                }

                setIsAdmin(roleResult.isAdmin && roleResult.role === 'admin');
            } catch (err: any) {
                setError(`Admin verification failed: ${err.message}`);
                setIsAdmin(false);
            }
        };

        verifyAdmin();
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
