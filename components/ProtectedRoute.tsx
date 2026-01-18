
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import LoadingState from './LoadingState.tsx';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { state, user } = useAuth();
    const location = useLocation();

    // Auth state should be resolved by AuthGate, but double-check
    if (state === 'loading') {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingState message="Checking authentication..." />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (state === 'unauthenticated' || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // User is authenticated
    return <>{children}</>;
};

export default ProtectedRoute;
