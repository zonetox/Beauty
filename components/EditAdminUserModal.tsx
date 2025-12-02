import React, { useState, useEffect } from 'react';
// FIX: Add missing AdminPermissions import to resolve type errors.
import { AdminUser, AdminUserRole, AdminPermissions } from '../types.ts';
import { PERMISSION_PRESETS } from '../constants.ts';

interface EditAdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: AdminUser) => void;
  userToEdit?: AdminUser | null;
}

const PERMISSION_DESCRIPTIONS: { [key in keyof AdminPermissions]: string } = {
    canViewAnalytics: "View Analytics",
    canManageBusinesses: "Manage Businesses",
    canManageRegistrations: "Manage Registrations",
    canManageOrders: "Manage Orders",
    canManagePlatformBlog: "Manage Platform Blog",
    canManageUsers: "Manage Users",
    canManagePackages: "Manage Packages",
    canManageAnnouncements: "Manage Announcements",
    canManageSupportTickets: "Manage Support Tickets",
    canManageSiteContent: "Manage Site Content (Homepage, etc.)",
    canManageSystemSettings: "Manage System Settings",
    canUseAdminTools: "Use Admin Tools",
    canViewActivityLog: "View Activity Log",
    canViewEmailLog: "View Email Log",
};

const EditAdminUserModal: React.FC<EditAdminUserModalProps> = ({ isOpen, onClose, onSave, userToEdit }) => {
  const isEditMode = Boolean(userToEdit);
  
  const getInitialFormData = () => {
    if (userToEdit) {
      return { ...userToEdit, password: '' }; // Don't show password on edit
    }
    return {
      username: '',
      email: '',
      password: '',
      role: AdminUserRole.EDITOR,
      permissions: PERMISSION_PRESETS.Editor,
    };
  };
  
  const [formData, setFormData] = useState<Partial<AdminUser>>(getInitialFormData());

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
    }
  }, [userToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const role = e.target.value as AdminUserRole;
      setFormData(prev => ({
          ...prev,
          role,
          permissions: PERMISSION_PRESETS[role]
      }));
  };

  const handlePermissionChange = (permissionKey: keyof AdminPermissions) => {
      setFormData(prev => ({
          ...prev,
          permissions: {
              ...prev!.permissions!,
              [permissionKey]: !prev!.permissions![permissionKey]
          }
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as AdminUser);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold font-serif text-neutral-dark">{isEditMode ? 'Edit User & Permissions' : 'Add New User'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input type="text" name="username" value={formData.username || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" name="password" value={formData.password || ''} onChange={handleChange} required={!isEditMode} placeholder={isEditMode ? 'Leave blank to keep unchanged' : ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
            </div>
            <div className="pt-4 border-t">
                 <h3 className="text-lg font-semibold text-neutral-dark mb-2">Permissions</h3>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Role Preset</label>
                    <select value={formData.role} onChange={handlePresetChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50">
                        {Object.values(AdminUserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Selecting a preset will apply a default set of permissions below.</p>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {(Object.keys(PERMISSION_DESCRIPTIONS) as Array<keyof AdminPermissions>).map(key => (
                        <label key={key} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.permissions?.[key] || false}
                                onChange={() => handlePermissionChange(key)}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{PERMISSION_DESCRIPTIONS[key]}</span>
                        </label>
                    ))}
                </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t sticky bottom-0">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark">Save User</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdminUserModal;
