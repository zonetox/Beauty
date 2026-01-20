// AuthRedirectHandler: Handles automatic redirects for authenticated users
// Business owners and staff are redirected to /account when they visit homepage
// Regular users and admins stay on homepage

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';

const AuthRedirectHandler: React.FC = () => {
    const { user, state } = useAuth();
    const { role, isBusinessOwner, isBusinessStaff, isLoading } = useUserRole();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Only redirect if:
        // 1. Auth state is resolved (not loading)
        // 2. User is logged in
        // 3. Role is resolved (not loading)
        // 4. User has business access (owner OR staff)
        // 5. User is on homepage (/)
        // 6. Not already on account page (avoid redirect loop)
        if (
            state !== 'loading' &&
            !isLoading &&
            user &&
            (isBusinessOwner || isBusinessStaff) &&
            location.pathname === '/'
        ) {
            navigate('/account', { replace: true });
        }
    }, [user, state, role, isBusinessOwner, isBusinessStaff, isLoading, location.pathname, navigate]);

    // This component doesn't render anything
    return null;
};

export default AuthRedirectHandler;
