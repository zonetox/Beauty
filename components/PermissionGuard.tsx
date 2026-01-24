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
    const { currentUser, loading } = useAdminAuth();

    // Show nothing while loading (parent component should handle loading state)
    if (loading) {
        return <>{fallback}</>;
    }

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
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <p className="text-sm text-yellow-700">
                    Bạn không có quyền truy cập chức năng này. ({permission})
                </p>
            </div>
        ) : <>{fallback}</>;
    }

    return <>{children}</>;
};

export default PermissionGuard;





