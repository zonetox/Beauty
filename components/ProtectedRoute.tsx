
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import LoadingState from './LoadingState.tsx';
import { resolveUserRole } from '../lib/roleResolution';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { state, user, profile } = useAuth();
    const location = useLocation();
    const [roleResolved, setRoleResolved] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);

    useEffect(() => {
        const verifyAccess = async () => {
            if (state === 'loading' || !user) {
                return;
            }

            // MANDATORY: Verify profile exists
            if (!profile) {
                setInitError('User profile not found. Account is incomplete.');
                setRoleResolved(true);
                return;
            }

            // Resolve role to ensure user type is determined
            const roleResult = await resolveUserRole(user);
            
            if (roleResult.error) {
                setInitError(roleResult.error);
            }
            
            setRoleResolved(true);
        };

        verifyAccess();
    }, [state, user, profile]);

    // Loading state
    if (state === 'loading' || !roleResolved) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingState message="Checking authentication..." />
            </div>
        );
    }

    // Error state - BLOCK access
    if (initError) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Setup Incomplete</h2>
                    <p className="text-gray-600 mb-6">{initError}</p>
                    <button
                        onClick={() => {
                            navigate('/contact', { replace: true });
                        }}
                        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (state === 'unauthenticated' || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // MANDATORY: Require profile
    if (!profile) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
                    <p className="text-gray-600 mb-6">Your account profile is missing. Please contact support.</p>
                </div>
            </div>
        );
    }

    // User is authenticated and has profile
    return <>{children}</>;
};

export default ProtectedRoute;