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
  const { getStaffPermissions, is_staff_member } = useStaff();

  const [permissions, setPermissions] = useState<StaffPermissions>({
    can_edit_landing_page: false,
    can_edit_blog: false,
    can_manage_media: false,
    can_manage_services: false,
    is_staff_member: false,
    is_business_owner: false,
    is_owner: false,
    has_access: false,
  });

  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentUser || !currentBusiness) {
        setPermissions({
          can_edit_landing_page: false,
          can_edit_blog: false,
          can_manage_media: false,
          can_manage_services: false,
          is_staff_member: false,
          is_business_owner: false,
          is_owner: false,
          has_access: false,
        });
        return;
      }

      // Check if user is business owner
      const isOwner = currentBusiness.owner_id === currentUser.id ||
        (currentBusiness as any).ownerId === currentUser.id;

      if (isOwner) {
        // Business owners have all permissions
        setPermissions({
          can_edit_landing_page: true,
          can_edit_blog: true,
          can_manage_media: true,
          can_manage_services: true,
          is_staff_member: false,
          is_business_owner: true,
          is_owner: true,
          has_access: true,
        });
        return;
      }

      // Check if user is staff member
      const isStaff = await is_staff_member(currentUser.id, currentBusiness.id);

      if (!isStaff) {
        setPermissions({
          can_edit_landing_page: false,
          can_edit_blog: false,
          can_manage_media: false,
          can_manage_services: false,
          is_staff_member: false,
          is_business_owner: false,
          is_owner: false,
          has_access: false,
        });
        return;
      }

      // Get staff permissions
      const staffPerms = await getStaffPermissions(currentUser.id, currentBusiness.id);

      if (!staffPerms) {
        setPermissions({
          can_edit_landing_page: false,
          can_edit_blog: false,
          can_manage_media: false,
          can_manage_services: false,
          is_staff_member: true,
          is_business_owner: false,
          is_owner: false,
          has_access: false,
        });
        return;
      }

      setPermissions({
        can_edit_landing_page: staffPerms.can_edit_landing_page || false,
        can_edit_blog: staffPerms.can_edit_blog || false,
        can_manage_media: staffPerms.can_manage_media || false,
        can_manage_services: staffPerms.can_manage_services || false,
        is_staff_member: true,
        is_business_owner: false,
        is_owner: false,
        has_access: true,
      });
    };

    checkPermissions();
  }, [currentUser, currentBusiness, is_staff_member, getStaffPermissions]);

  return permissions;
};
