// User Registration Page
// Simplified registration for regular users (no business creation)

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../providers/AuthProvider.tsx';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.ts';
import { initializeUserProfile } from '../lib/postSignupInitialization';
import SEOHead from '../components/SEOHead.tsx';

const RegisterUserPage: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            const errorMsg = 'Mật khẩu không khớp.';
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }
        if (formData.password.length < 6) {
            const errorMsg = 'Mật khẩu phải có ít nhất 6 ký tự.';
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }
        if (!formData.full_name.trim()) {
            const errorMsg = 'Vui lòng nhập họ và tên.';
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        setIsSubmitting(true);

        if (!isSupabaseConfigured) {
            toast.error("Preview Mode: Registration is disabled.");
            setIsSubmitting(false);
            return;
        }

        try {
            // Step 1: Create Supabase Auth user
            await register(formData.email, formData.password, {
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim(),
            });

            // Wait for session to be established
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get user from current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session?.user) {
                throw new Error('Không thể xác thực tài khoản. Vui lòng thử lại.');
            }
            const newUser = session.user;

            // Step 2: Initialize and verify profile
            const profileResult = await initializeUserProfile(newUser, 3000);

            if (!profileResult.success || !profileResult.profileId) {
                throw new Error(profileResult.error || 'Khởi tạo hồ sơ thất bại. Vui lòng liên hệ hỗ trợ.');
            }

            // Success!
            toast.success('Đăng ký thành công! Chào mừng bạn đến với 1Beauty.asia.');
            await new Promise(resolve => setTimeout(resolve, 1000));
            navigate('/account', { replace: true });

        } catch (err: unknown) {
            const error = err as Record<string, unknown>;
            let errorMessage = (error.message as string) || 'Đã xảy ra lỗi không mong muốn trong quá trình đăng ký.';

            // Translate common errors
            if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
                errorMessage = 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.';
            } else if (errorMessage.includes('invalid email')) {
                errorMessage = 'Email không hợp lệ. Vui lòng kiểm tra lại.';
            } else if (errorMessage.includes('password')) {
                errorMessage = 'Mật khẩu không đủ mạnh. Vui lòng thử lại với mật khẩu khác.';
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const seoTitle = 'Đăng ký tài khoản người dùng | 1Beauty.asia';
    const seoDescription = 'Tạo tài khoản người dùng miễn phí để tìm kiếm, đặt lịch và đánh giá các dịch vụ làm đẹp trên 1Beauty.asia.';
    const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/register/user` : '';

    return (
        <>
            <SEOHead
                title={seoTitle}
                description={seoDescription}
                keywords="đăng ký người dùng, user registration, tài khoản miễn phí"
                url={seoUrl}
                type="website"
            />
            <div className="bg-background min-h-[calc(100vh-128px)]">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-md mx-auto">
                        {/* Back Link */}
                        <Link
                            to="/register"
                            className="inline-flex items-center text-gray-600 hover:text-primary mb-6 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Quay lại
                        </Link>

                        {/* Form Card */}
                        <div className="bg-white p-8 rounded-lg shadow-md">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h1 className="text-2xl font-bold font-serif text-neutral-dark mb-2">
                                    Đăng ký tài khoản Người dùng
                                </h1>
                                <p className="text-gray-600">
                                    Tạo tài khoản miễn phí để bắt đầu
                                </p>
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start">
                                        <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <p className="ml-3 text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="full_name"
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nguyễn Văn A"
                                        disabled={isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="email@example.com"
                                        disabled={isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="0987654321"
                                        disabled={isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Mật khẩu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="Tối thiểu 6 ký tự"
                                        disabled={isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nhập lại mật khẩu"
                                        disabled={isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary text-white py-3 px-4 rounded-md shadow-sm text-base font-medium hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Đăng ký'
                                    )}
                                </button>
                            </form>

                            {/* Login Link */}
                            <p className="text-sm text-center text-gray-600 mt-6">
                                Đã có tài khoản?{' '}
                                <Link to="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
                                    Đăng nhập tại đây
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegisterUserPage;
