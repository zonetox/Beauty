// C4.1 - Admin Login Page (Admin Panel) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, 100% database connection

import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminContext.tsx';
import SEOHead from '../components/SEOHead.tsx';

const AdminLoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { adminLogin, currentUser } = useAdminAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await adminLogin(email, password);
            // The onAuthStateChange listener in the context will handle redirection
            // but we can navigate optimistically.
            navigate('/admin');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // If already logged in as an admin, redirect to the dashboard
    if (currentUser) {
        return <Navigate to="/admin" replace />;
    }

    // SEO metadata (noindex for admin pages)
    const seoTitle = 'Admin Login | 1Beauty.asia';
    const seoDescription = 'Admin panel login page for 1Beauty.asia management system.';
    const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/admin/login` : '';

    return (
        <>
            <SEOHead 
                title={seoTitle}
                description={seoDescription}
                url={seoUrl}
                type="website"
            />
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

            </div>
        </div>
        </>
    );
};

export default AdminLoginPage;