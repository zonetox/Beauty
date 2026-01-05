
// D2.3 FIX: Import standardized loading state
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminContext.tsx';
import LoadingState from './LoadingState.tsx';

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
    const { currentUser, loading } = useAdminAuth();
    const location = useLocation();

    // E1.1 FIX: Use standardized LoadingState component
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <LoadingState message="Checking admin authentication..." />
            </div>
        );
    }

    if (!currentUser) {
        // Redirect them to the /admin/login page, saving the location they were trying to access.
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default AdminProtectedRoute;
