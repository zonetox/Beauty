// C2.6 - Login Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import ForgotPasswordModal from '../components/ForgotPasswordModal.tsx';
import SEOHead from '../components/SEOHead.tsx';
import { resolveUserRole } from '../lib/roleResolution';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, profile, user, state } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    // If user is already logged in, redirect based on resolved role
    useEffect(() => {
        // Wait for auth state to resolve
        if (state === 'loading') return;
        
        if (user && profile) {
            const resolveAndRedirect = async () => {
                try {
                    const roleResult = await resolveUserRole(user);
                    
                    if (roleResult.error) {
                        // Role resolution failed - show error but allow login
                        console.error('Role resolution error:', roleResult.error);
                    }

                    const state = location.state as { from?: { pathname?: string } } | null;
                    const from = state?.from?.pathname;

                    // Route based on resolved role - NO DEFAULT HOMEPAGE REDIRECT
                    if (roleResult.error) {
                        // Role resolution failed - show error but stay on login page
                        setError(roleResult.error);
                        return;
                    }

                    if (roleResult.role === 'admin') {
                        // Admin → admin panel
                        navigate('/admin', { replace: true });
                    } else if (roleResult.role === 'business_owner' && roleResult.businessId) {
                        // Business owner → business dashboard
                        navigate('/account', { replace: true });
                    } else if (roleResult.role === 'business_staff' && roleResult.businessId) {
                        // Business staff → business dashboard
                        navigate('/account', { replace: true });
                    } else if (roleResult.role === 'user') {
                        // Regular user: go back to where they were OR homepage
                        if (from && from !== '/login' && from !== '/register') {
                            navigate(from, { replace: true });
                        } else {
                            navigate('/', { replace: true });
                        }
                    } else {
                        // Unknown role or anonymous - should not happen after login
                        setError('Unable to determine user role. Please contact support.');
                    }
                } catch (err) {
                    console.error('Error resolving role:', err);
                    // Fallback to homepage
                    navigate('/', { replace: true });
                }
            };

            resolveAndRedirect();
        }
    }, [user, profile, state, navigate, location]);
    
    // SEO metadata
    const seoTitle = 'Đăng nhập | 1Beauty.asia';
    const seoDescription = 'Đăng nhập vào tài khoản doanh nghiệp của bạn trên 1Beauty.asia để quản lý thông tin và dịch vụ.';
    const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            // Auth state will update via subscription
            // useEffect above will handle redirect based on user type
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
            }
            setIsLoading(false);
        }
    };

    return (
        <>
            <SEOHead 
                title={seoTitle}
                description={seoDescription}
                keywords="đăng nhập, login, tài khoản doanh nghiệp, business account"
                url={seoUrl}
                type="website"
            />
            <ForgotPasswordModal 
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
            />
            <div className="flex items-center justify-center min-h-[calc(100vh-128px)] bg-background">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-center text-neutral-dark font-serif">Đăng nhập tài khoản Doanh nghiệp</h1>
                    {error && <p className="text-red-500 text-center bg-red-100 p-3 rounded-md">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                                 <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="text-sm font-medium text-primary hover:text-primary-dark focus:outline-none disabled:opacity-50" disabled={isLoading}>
                                    Quên mật khẩu?
                                </button>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </button>
                        </div>
                    </form>
                    <p className="text-sm text-center text-gray-600">
                        Chưa có tài khoản doanh nghiệp?{' '}
                        <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
                            Đăng ký tại đây
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
