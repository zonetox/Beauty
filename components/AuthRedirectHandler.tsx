// AuthRedirectHandler: Handles automatic redirects for authenticated users
// Business owners are redirected to /account when they visit homepage
// Regular users stay on homepage

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserSession } from '../contexts/UserSessionContext.tsx';

const AuthRedirectHandler: React.FC = () => {
    const { currentUser, profile, loading } = useUserSession();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Only redirect if:
        // 1. User is logged in
        // 2. Profile is loaded
        // 3. User is a business owner (has businessId)
        // 4. User is on homepage (/)
        // 5. Not already loading
        if (!loading && currentUser && profile?.businessId && location.pathname === '/') {
            navigate('/account', { replace: true });
        }
    }, [currentUser, profile, loading, location.pathname, navigate]);

    // This component doesn't render anything
    return null;
};

export default AuthRedirectHandler;
