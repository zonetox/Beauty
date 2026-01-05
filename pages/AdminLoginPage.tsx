import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminContext.tsx';

const AdminLoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { adminLogin, currentUser, adminUsers, loginAs } = useAdminAuth();
    const navigate = useNavigate();
    
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    useEffect(() => {
        // When the list of admin users loads, set the default selected user in the dropdown.
        if (adminUsers.length > 0 && !selectedUserId) {
            setSelectedUserId(String(adminUsers[0].id));
        }
    }, [adminUsers, selectedUserId]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await adminLogin(email, password);
            // The onAuthStateChange listener in the context will handle redirection
            // but we can navigate optimistically.
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleQuickLogin = () => {
        if (!selectedUserId) {
            setError("Please select a user to log in as.");
            return;
        }
        setError('');
        const success = loginAs(Number(selectedUserId));
        if (success) {
            navigate('/admin');
        } else {
            setError("Could not log in as the selected user.");
        }
    };

    // If already logged in as an admin, redirect to the dashboard
    if (currentUser) {
        return <Navigate to="/admin" replace />;
    }

    // D1.1 FIX: Safely check for development mode (production-safe)
    const isDev = (() => {
        // Check Vite environment variable first
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            return import.meta.env.MODE === 'development' || import.meta.env.DEV === true;
        }
        // Fallback to Node.js environment variable
        if (typeof process !== 'undefined' && process.env) {
            return process.env.NODE_ENV === 'development';
        }
        // Default to false (production-safe)
        return false;
    })();

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-neutral-dark font-serif">Admin Panel Login</h1>
                {error && <p className="text-red-500 text-center bg-red-100 p-3 rounded-md">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:bg-primary/50"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>

                {/* Developer Quick Login - Only show in development mode */}
                {isDev && adminUsers.length > 0 && (
                    <div className="pt-6 border-t border-gray-200">
                        <div className="text-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-500">🚀 Developer Quick Login</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="user-select" className="block text-sm font-medium text-gray-700">Select User</label>
                                <select 
                                    id="user-select" 
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                                >
                                    {adminUsers.map(user => (
                                        <option key={user.id} value={user.id}>{user.username} ({user.role})</option>
                                    ))}
                                </select>
                            </div>
                             <button
                                type="button"
                                onClick={handleQuickLogin}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:opacity-90"
                            >
                                Login as Selected User
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLoginPage;