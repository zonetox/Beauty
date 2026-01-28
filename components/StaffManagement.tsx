import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { useStaff } from '../contexts/StaffContext.tsx';
import { BusinessStaff, StaffMemberRole } from '../types.ts';
import StaffInviteModal from './StaffInviteModal.tsx';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';
import ConfirmDialog from './ConfirmDialog.tsx';

const StaffManagement: React.FC = () => {
  const { currentBusiness } = useBusinessAuth();
  const {
    staff,
    loading,
    get_staff_by_business_id,
    updateStaff,
    removeStaff,
    refresh_staff
  } = useStaff();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<BusinessStaff | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; staffId: string | null }>({ isOpen: false, staffId: null });

  useEffect(() => {
    if (currentBusiness) {
      get_staff_by_business_id(currentBusiness.id);
    }
  }, [currentBusiness, get_staff_by_business_id]);

  const handleUpdateStaff = async (staffId: string, updates: Partial<BusinessStaff>) => {
    try {
      await updateStaff(staffId, updates);
      toast.success('Staff updated successfully');
      setEditingStaff(null);
      if (currentBusiness) {
        await refresh_staff(currentBusiness.id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update staff');
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    setConfirmDialog({ isOpen: true, staffId });
  };

  const confirmRemoveStaff = async () => {
    if (!confirmDialog.staffId) return;

    try {
      await removeStaff(confirmDialog.staffId);
      toast.success('Staff removed successfully');
      if (currentBusiness) {
        await refresh_staff(currentBusiness.id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove staff');
    } finally {
      setConfirmDialog({ isOpen: false, staffId: null });
    }
  };

  const handleInviteSuccess = () => {
    setShowInviteModal(false);
    if (currentBusiness) {
      refresh_staff(currentBusiness.id);
    }
  };

  if (!currentBusiness) {
    return (
      <div className="p-8">
        <EmptyState
          title="No business found"
          message="Please select a business to manage staff."
        />
      </div>
    );
  }

  const businessStaff = staff.filter(s => s.business_id === currentBusiness.id);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-dark">Staff Management</h2>
          <p className="text-gray-600 mt-1">Manage staff members who can edit your landing page and blog</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Invite Staff
        </button>
      </div>

      {loading ? (
        <LoadingState message="Loading staff..." />
      ) : businessStaff.length === 0 ? (
        <EmptyState
          title="No staff members"
          message="Invite staff members to help manage your business content."
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {businessStaff.map((staffMember) => (
                <tr key={staffMember.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {staffMember.user_email || staffMember.user_id.substring(0, 8) + '...'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${staffMember.role === StaffMemberRole.ADMIN
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}>
                      {staffMember.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-2">
                      {staffMember.permissions.can_edit_landing_page && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Landing Page</span>
                      )}
                      {staffMember.permissions.can_edit_blog && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Blog</span>
                      )}
                      {staffMember.permissions.can_manage_media && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Media</span>
                      )}
                      {staffMember.permissions.can_manage_services && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Services</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setEditingStaff(staffMember)}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveStaff(staffMember.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showInviteModal && (
        <StaffInviteModal
          business_id={currentBusiness.id}
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteSuccess}
        />
      )}

      {editingStaff && (
        <StaffEditModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSave={(updates) => handleUpdateStaff(editingStaff.id, updates)}
        />
      )}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Remove Staff Member"
        message="Are you sure you want to remove this staff member? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmRemoveStaff}
        onCancel={() => setConfirmDialog({ isOpen: false, staffId: null })}
      />
    </div>
  );
};

// Staff Edit Modal Component
interface StaffEditModalProps {
  staff: BusinessStaff;
  onClose: () => void;
  onSave: (updates: Partial<BusinessStaff>) => Promise<void>;
}

const StaffEditModal: React.FC<StaffEditModalProps> = ({ staff, onSave, onClose }) => {
  const [role, setRole] = useState<StaffMemberRole>(staff.role);
  const [permissions, setPermissions] = useState<BusinessStaff['permissions']>(staff.permissions);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ role, permissions });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">Edit Staff Member</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffMemberRole)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                checked={permissions.can_edit_landing_page || false}
                onChange={(e) => setPermissions({ ...permissions, can_edit_landing_page: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">Edit Landing Page</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.can_edit_blog || false}
                onChange={(e) => setPermissions({ ...permissions, can_edit_blog: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">Edit Blog</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.can_manage_media || false}
                onChange={(e) => setPermissions({ ...permissions, can_manage_media: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">Manage Media</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.can_manage_services || false}
                onChange={(e) => setPermissions({ ...permissions, can_manage_services: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">Manage Services</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
