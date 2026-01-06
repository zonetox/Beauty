// D3.2 FIX: Centralize permission checks - PermissionGuard component
// Based on C1.4 recommendations from frontend_architecture.md

import React from 'react';
import { useAdminAuth } from '../contexts/AdminContext.tsx';
import { AdminPermissions } from '../types.ts';
import ForbiddenState from './ForbiddenState.tsx';

interface PermissionGuardProps {
    permission: keyof AdminPermissions;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showForbiddenState?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
    permission, 
    children, 
    fallback = null,
    showForbiddenState = true
}) => {
    const { currentUser } = useAdminAuth();
    
    // If no current user, show forbidden
    if (!currentUser) {
        return showForbiddenState ? (
            <ForbiddenState 
                title="Access Denied" 
                message="You must be logged in as an admin to access this resource."
            />
        ) : <>{fallback}</>;
    }
    
    // Check permission
    if (!currentUser.permissions?.[permission]) {
        return showForbiddenState ? (
            <ForbiddenState 
                title="Access Denied" 
                message={`You don't have permission to ${permission.replace(/can([A-Z])/g, '$1').toLowerCase()}.`}
            />
        ) : <>{fallback}</>;
    }
    
    return <>{children}</>;
};

export default PermissionGuard;




