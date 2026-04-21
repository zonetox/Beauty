import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';

/**
 * Legacy Business Setup Page
 * 
 * This page is deprecated in favor of the single-step registration flow.
 * It now serves as a redirector: business owners go to /business-profile,
 * regular users go to /account.
 */
const BusinessSetupPage: React.FC = () => {
    const navigate = useNavigate();
    const { role, state, isDataLoaded } = useAuth();

    useEffect(() => {
        // Wait for auth to be fully resolved before redirecting
        if (state === 'loading' || !isDataLoaded) return;

        const isBusinessUser = role === 'business_owner' || role === 'business_staff';
        if (isBusinessUser) {
            navigate('/business-profile', { replace: true });
        } else {
            // Regular users or new registrants go to account page
            navigate('/account', { replace: true });
        }
    }, [navigate, role, state, isDataLoaded]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Đang chuyển hướng...</p>
            </div>
        </div>
    );
};

export default BusinessSetupPage;
