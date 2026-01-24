// Admin Protected Route - Requires admin access from database
// NO dev fallbacks. NO hardcoded admins.
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
    const { user, profile, state, role } = useAuth(); // Get role from AuthProvider
    const location = useLocation();
    const [isAdmin, setIsAdmin] = useState<boolean | 'loading'>('loading');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const verifyAdmin = () => {
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

            // Use role from AuthProvider (already resolved via get_user_context)
            const adminStatus = role === 'admin';

            if (!adminStatus) {
                setError('Admin access denied. Admin privileges are determined from the admin_users table. Your email is not registered as an admin.');
            }

            setIsAdmin(adminStatus);
        };

        verifyAdmin();

        return () => {
            mounted = false;
        };
    }, [user, profile, state, role]); // Add role to dependencies


    // Loading state - only show if not initializing
    if (state === 'loading' || isAdmin === 'loading') {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang kiểm tra quyền admin...</p>
                </div>
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
