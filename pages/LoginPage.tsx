// C2.6 - Login Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import ForgotPasswordModal from '../components/ForgotPasswordModal.tsx';
import SEOHead from '../components/SEOHead.tsx';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    // Get auth context - must be called unconditionally (React Hook rules)
    const { login, state, profile } = useAuth();

    // Unified redirection for authenticated users
    // If user is already logged in, redirect to account page
    useEffect(() => {
        if (state === 'authenticated' && profile) {
            navigate('/account', { replace: true });
        }
    }, [state, profile, navigate]);

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
            // Explicitly navigate to account page after success
            navigate('/account', { replace: true });
        } catch (err) {
            if (err instanceof Error) {
                // Translate common error messages to Vietnamese
                let errorMessage = err.message;
                if (errorMessage.includes('Invalid login credentials')) {
                    errorMessage = 'Email hoặc mật khẩu không đúng.';
                } else if (errorMessage.includes('Email not confirmed')) {
                    errorMessage = 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.';
                } else if (errorMessage.includes('Too many requests')) {
                    errorMessage = 'Quá nhiều lần thử. Vui lòng đợi một lát rồi thử lại.';
                }
                setError(errorMessage);
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
