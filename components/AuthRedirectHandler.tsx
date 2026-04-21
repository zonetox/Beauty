// AuthRedirectHandler: Handles automatic redirects for authenticated users
// Business owners and staff are redirected to /account when they visit homepage
// Regular users and admins stay on homepage

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';

const AuthRedirectHandler: React.FC = () => {
    const { user, state, role, isDataLoaded } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Redirect logic:
        // 1. Auth is fully resolved
        if (!isDataLoaded || state === 'loading' || !user) return;

        // 2. Determine if user should be redirected from homepage (all authenticated non-admins)
        const isBusinessUser = role !== 'admin';
        const isHomepage = location.pathname === '/';

        if (isBusinessUser && isHomepage) {
            console.log('[AuthRedirectHandler] Neutralizing homepage for business user, redirecting to dashboard');
            navigate('/business-profile', { replace: true });
        }
    }, [user, state, role, isDataLoaded, location.pathname, navigate]);

    // This component doesn't render anything
    return null;
};

export default AuthRedirectHandler;
