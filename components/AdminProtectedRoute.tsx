
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminContext.tsx';

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
    const { currentUser, loading } = useAdminAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><p>Checking admin authentication...</p></div>;
    }

    if (!currentUser) {
        // Redirect them to the /admin/login page, saving the location they were trying to access.
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default AdminProtectedRoute;
