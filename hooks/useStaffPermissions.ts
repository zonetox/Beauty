import { useState, useEffect } from 'react';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useStaff } from '../contexts/StaffContext.tsx';
import { StaffPermissions } from '../types.ts';

/**
 * Hook to check if current user has staff permissions for the current business
 * Returns permissions and access status
 */
export const useStaffPermissions = (): StaffPermissions => {
  const { currentBusiness } = useBusinessAuth();
  const { user: currentUser } = useAuth();
  const { getStaffPermissions, isStaffMember } = useStaff();

  const [permissions, setPermissions] = useState<StaffPermissions>({
    canEditLandingPage: false,
    canEditBlog: false,
    canManageMedia: false,
    canManageServices: false,
    isStaffMember: false,
    isBusinessOwner: false,
    isOwner: false,
    hasAccess: false,
  });

  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentUser || !currentBusiness) {
        setPermissions({
          canEditLandingPage: false,
          canEditBlog: false,
          canManageMedia: false,
          canManageServices: false,
          isStaffMember: false,
          isBusinessOwner: false,
          isOwner: false,
          hasAccess: false,
        });
        return;
      }

      // Check if user is business owner
      const isOwner = currentBusiness.owner_id === currentUser.id ||
        (currentBusiness as any).ownerId === currentUser.id;

      if (isOwner) {
        // Business owners have all permissions
        setPermissions({
          canEditLandingPage: true,
          canEditBlog: true,
          canManageMedia: true,
          canManageServices: true,
          isStaffMember: false,
          isBusinessOwner: true,
          isOwner: true,
          hasAccess: true,
        });
        return;
      }

      // Check if user is staff member
      const isStaff = await isStaffMember(currentUser.id, currentBusiness.id);

      if (!isStaff) {
        setPermissions({
          canEditLandingPage: false,
          canEditBlog: false,
          canManageMedia: false,
          canManageServices: false,
          isStaffMember: false,
          isBusinessOwner: false,
          isOwner: false,
          hasAccess: false,
        });
        return;
      }

      // Get staff permissions
      const staffPerms = await getStaffPermissions(currentUser.id, currentBusiness.id);

      if (!staffPerms) {
        setPermissions({
          canEditLandingPage: false,
          canEditBlog: false,
          canManageMedia: false,
          canManageServices: false,
          isStaffMember: true,
          isBusinessOwner: false,
          isOwner: false,
          hasAccess: false,
        });
        return;
      }

      setPermissions({
        canEditLandingPage: staffPerms.canEditLandingPage || false,
        canEditBlog: staffPerms.canEditBlog || false,
        canManageMedia: staffPerms.canManageMedia || false,
        canManageServices: staffPerms.canManageServices || false,
        isStaffMember: true,
        isBusinessOwner: false,
        isOwner: false,
        hasAccess: true,
      });
    };

    checkPermissions();
  }, [currentUser, currentBusiness, isStaffMember, getStaffPermissions]);

  return permissions;
};
