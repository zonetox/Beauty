
// D2.3 FIX: Import standardized loading state
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserSession } from '../contexts/UserSessionContext.tsx';
import LoadingState from './LoadingState.tsx';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { currentUser, loading } = useUserSession();
    const location = useLocation();

    // E1.1 FIX: Use standardized LoadingState component
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingState message="Checking authentication..." />
            </div>
        );
    }

    if (!currentUser) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows us to send them along to that page after they login.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
