import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../providers/AuthProvider.tsx';

/**
 * Legacy Business Setup Page
 * 
 * This page is deprecated in favor of the single-step registration flow.
 * It now serves as a redirector to ensure legacy links don't break.
 */
const BusinessSetupPage: React.FC = () => {
    const navigate = useNavigate();
    // const { profile } = useAuth();

    useEffect(() => {
        // Always redirect to account dashboard
        // If user has business, they see dashboard.
        // If not, they see user dashboard (and can verify or register specifically via correct flows)
        navigate('/account', { replace: true });
    }, [navigate]);

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
