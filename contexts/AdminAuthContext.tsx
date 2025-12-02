import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AdminUser } from '../types.ts';
import { useAdminPlatform } from './AdminPlatformContext.tsx';

interface AdminAuthContextType {
  currentUser: AdminUser | null;
  adminUsers: AdminUser[];
  loginAs: (userId: number) => void;
  addAdminUser: (newUser: Omit<AdminUser, 'id' | 'lastLogin' | 'isLocked'>) => void;
  updateAdminUser: (userId: number, updates: Partial<AdminUser>) => void;
  deleteAdminUser: (userId: number) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const { logAdminAction } = useAdminPlatform();

  // Load users from localStorage
  useEffect(() => {
    try {
      const savedUsersJSON = localStorage.getItem('admin_users');
      const initialAdminUsers: AdminUser[] = [];
      let loadedUsers = savedUsersJSON ? JSON.parse(savedUsersJSON) : initialAdminUsers;
      setAdminUsers(loadedUsers);

      const savedUserId = localStorage.getItem('current_user_id');
      const userToLoad = savedUserId 
        ? loadedUsers.find((u: AdminUser) => u.id === parseInt(savedUserId))
        : loadedUsers[0];
      
      setCurrentUser(userToLoad || loadedUsers[0] || null);
    } catch (error) {
      console.error("Failed to load admin auth data from localStorage", error);
      const initialAdminUsers: AdminUser[] = [];
      setAdminUsers(initialAdminUsers);
      setCurrentUser(initialAdminUsers[0] || null);
    }
  }, []);

  const updateLocalStorage = (users: AdminUser[]) => {
    try {
      localStorage.setItem('admin_users', JSON.stringify(users));
    } catch (error) {
      console.error("Failed to save admin users to localStorage", error);
    }
  };

  const loginAs = (userId: number) => {
    const userToLogin = adminUsers.find(u => u.id === userId);
    if (userToLogin) {
      const lastLoginTime = new Date().toISOString();
      const updatedUser = { ...userToLogin, lastLogin: lastLoginTime };
      
      const updatedUsers = adminUsers.map(u => u.id === userId ? updatedUser : u);
      setAdminUsers(updatedUsers);
      updateLocalStorage(updatedUsers);
      
      setCurrentUser(updatedUser);
      localStorage.setItem('current_user_id', String(userId));
    } else {
      console.warn("Attempted to log in as non-existent user ID:", userId);
    }
  };

  const addAdminUser = (newUser: Omit<AdminUser, 'id' | 'lastLogin' | 'isLocked'>) => {
    if (!currentUser) return;
    const newId = adminUsers.length > 0 ? Math.max(...adminUsers.map(u => u.id)) + 1 : 1;
    const userToAdd: AdminUser = { ...newUser, id: newId, isLocked: false };
    const updatedUsers = [...adminUsers, userToAdd];
    setAdminUsers(updatedUsers);
    updateLocalStorage(updatedUsers);
    logAdminAction(currentUser.username, 'Create User', `Created new user: ${userToAdd.username} with role ${userToAdd.role}.`);
  };

  const updateAdminUser = (userId: number, updates: Partial<AdminUser>) => {
    if (!currentUser) return;
    const originalUser = adminUsers.find(u => u.id === userId);
    if (!originalUser) return;
    
    const updatedUsers = adminUsers.map(user =>
      user.id === userId ? { ...user, ...updates } : user
    );
    setAdminUsers(updatedUsers);
    updateLocalStorage(updatedUsers);

    if (updates.role && updates.role !== originalUser.role) {
      logAdminAction(currentUser.username, 'Update User Role', `Changed role for ${originalUser.username} from ${originalUser.role} to ${updates.role}.`);
    }
    if (updates.isLocked !== undefined && updates.isLocked !== originalUser.isLocked) {
      const action = updates.isLocked ? 'Lock User' : 'Unlock User';
      logAdminAction(currentUser.username, action, `${action}: ${originalUser.username}.`);
    }
  };

  const deleteAdminUser = (userId: number) => {
    if (!currentUser) return;
    const userToDelete = adminUsers.find(u => u.id === userId);
    if (!userToDelete) return;

    const updatedUsers = adminUsers.filter(user => user.id !== userId);
    setAdminUsers(updatedUsers);
    updateLocalStorage(updatedUsers);
    logAdminAction(currentUser.username, 'Delete User', `Deleted user: ${userToDelete.username}.`);
  };

  return (
    <AdminAuthContext.Provider value={{ currentUser, adminUsers, loginAs, addAdminUser, updateAdminUser, deleteAdminUser }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
