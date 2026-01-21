import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient.ts';
import { useStaff } from '../contexts/StaffContext.tsx';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { StaffMemberRole } from '../types.ts';
import { BusinessStaff } from '../types.ts';

interface StaffInviteModalProps {
  businessId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const StaffInviteModal: React.FC<StaffInviteModalProps> = ({ businessId, onClose, onSuccess }) => {
  const { refreshStaff } = useStaff();
  const { currentBusiness } = useBusinessAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffMemberRole>(StaffMemberRole.EDITOR);
  const [permissions, setPermissions] = useState<BusinessStaff['permissions']>({
    canEditLandingPage: true,
    canEditBlog: true,
    canManageMedia: false,
    canManageServices: false,
  });
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    setError(null);

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsInviting(true);
    try {
      // Use Edge Function to invite staff (handles both new and existing users)
      const { data, error: inviteError } = await supabase.functions.invoke('invite-staff', {
        body: {
          email,
          businessId,
          role,
          permissions,
          businessName: currentBusiness?.name,
        }
      });

      if (inviteError) {
        throw new Error(inviteError.message || 'Failed to invite staff member');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Refresh staff list
      await refreshStaff(businessId);

      toast.success(data?.isNewUser
        ? 'Staff member invited successfully. Invitation email sent.'
        : 'Staff member added successfully.');
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite staff member';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">Invite Staff Member</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            disabled={isInviting}
          />
          <p className="mt-1 text-xs text-gray-500">
            If the user doesn&apos;t have an account, they will receive an invitation email to create one.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffMemberRole)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={isInviting}
          >
            <option value={StaffMemberRole.EDITOR}>Editor</option>
            <option value={StaffMemberRole.ADMIN}>Admin</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.canEditLandingPage || false}
                onChange={(e) => setPermissions({ ...permissions, canEditLandingPage: e.target.checked })}
                className="mr-2"
                disabled={isInviting}
              />
              <span className="text-sm">Edit Landing Page</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.canEditBlog || false}
                onChange={(e) => setPermissions({ ...permissions, canEditBlog: e.target.checked })}
                className="mr-2"
                disabled={isInviting}
              />
              <span className="text-sm">Edit Blog</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.canManageMedia || false}
                onChange={(e) => setPermissions({ ...permissions, canManageMedia: e.target.checked })}
                className="mr-2"
                disabled={isInviting}
              />
              <span className="text-sm">Manage Media</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.canManageServices || false}
                onChange={(e) => setPermissions({ ...permissions, canManageServices: e.target.checked })}
                className="mr-2"
                disabled={isInviting}
              />
              <span className="text-sm">Manage Services</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            disabled={isInviting}
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={isInviting || !email}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {isInviting ? 'Adding...' : 'Add Staff'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffInviteModal;
