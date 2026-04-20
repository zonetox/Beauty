import React from 'react';
import { AdminUser, AuthenticatedAdmin } from '../../types.ts';
import { useAdminAuth } from '../../contexts/AdminContext.tsx';
import UserManagementTable from '../UserManagementTable.tsx';
import toast from 'react-hot-toast';

interface AdminUserManagementTabProps {
    currentUser: AuthenticatedAdmin | null;
    onEdit: (user: AdminUser | null) => void;
    onDelete: (id: number) => void;
}

const AdminUserManagementTab: React.FC<AdminUserManagementTabProps> = ({
    currentUser,
    onEdit,
    onDelete
}) => {
    const { adminUsers, updateAdminUser } = useAdminAuth();

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">User Management</h2>
                <button
                    onClick={() => onEdit(null)}
                    className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary-dark transition-colors"
                >
                    + Add New User
                </button>
            </div>
            <UserManagementTable
                users={adminUsers}
                onUpdateUser={updateAdminUser}
                onEditUser={onEdit}
                onDeleteUser={onDelete}
            />
        </div>
    );
};

export default AdminUserManagementTab;
