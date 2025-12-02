
import React from 'react';
import toast from 'react-hot-toast';
import { AdminUser, AdminUserRole } from '../types.ts';
import { useAdminAuth } from '../contexts/AdminContext.tsx';

interface UserManagementTableProps {
    users: AdminUser[];
    onUpdateUser: (userId: number, updates: Partial<AdminUser>) => void;
    onEditUser: (user: AdminUser) => void;
    onDeleteUser: (userId: number) => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({ users, onUpdateUser, onEditUser, onDeleteUser }) => {
    const { currentUser } = useAdminAuth();

    const handleToggleLock = (user: AdminUser) => {
        if (user.id === currentUser?.id) {
            toast.error("You cannot lock your own account.");
            return;
        }
        onUpdateUser(user.id, { isLocked: !user.isLocked });
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Username</th>
                        <th scope="col" className="px-6 py-3">Role</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Last Login</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className={`bg-white border-b hover:bg-gray-50 ${user.isLocked ? 'bg-red-50' : ''}`}>
                            <td className="px-6 py-4 font-medium text-neutral-dark whitespace-nowrap">
                                {user.username}
                                <div className="text-xs text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${!user.isLocked ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {user.isLocked ? 'Locked' : 'Active'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {user.lastLogin 
                                    ? new Date(user.lastLogin).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : <span className="text-gray-400 italic">Never</span>
                                }
                            </td>
                            <td className="px-6 py-4 flex items-center gap-2">
                                <button onClick={() => onEditUser(user)} className="font-medium text-secondary hover:underline">Edit</button>
                                <button
                                    onClick={() => handleToggleLock(user)}
                                    className={`font-medium ${user.isLocked ? 'text-green-600 hover:text-green-800' : 'text-yellow-600 hover:text-yellow-800'} disabled:text-gray-400 disabled:cursor-not-allowed`}
                                    disabled={user.id === currentUser?.id}
                                >
                                    {user.isLocked ? 'Unlock' : 'Lock'}
                                </button>
                                <button
                                    onClick={() => onDeleteUser(user.id)}
                                    className="font-medium text-red-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                                    disabled={user.id === currentUser?.id}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagementTable;
