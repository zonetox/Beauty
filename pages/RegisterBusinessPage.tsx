// Business Registration Page
// Simplified registration for business owners (business creation happens later)

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useProfile } from '../providers/ProfileProvider.tsx';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.ts';
import { initializeUserProfile } from '../lib/postSignupInitialization.ts';
import SEOHead from '../components/SEOHead.tsx';

const RegisterBusinessPage: React.FC = () => {
    const navigate = useNavigate();
    const { register, state: authState } = useAuth();
    const { profile, isLoaded: profileLoaded } = useProfile();

    // Redirect authenticated users
    useEffect(() => {
        if (authState === 'authenticated' && profileLoaded && profile) {
            // If they already have a business, go to account
            if (profile.businessId) {
                navigate('/account', { replace: true });
            } else {
                // If they don't have a business, ensure they go to setup
                navigate('/account/business/setup', { replace: true });
            }
        }
    }, [authState, profileLoaded, profile, navigate]);

    const [formData, setFormData] = useState({
        business_name: '',
        email: '',
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
        if (!formData.business_name.trim()) {
            const errorMsg = 'Vui lòng nhập tên doanh nghiệp.';
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
            // Use business_name as full_name for now
            await register(formData.email, formData.password, {
                full_name: formData.business_name.trim(),
                user_type: 'business', // Metadata to track intent
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

            // Success! Wait for profile to be active in context
            toast.success('Tài khoản đã được tạo! Tiếp tục thiết lập doanh nghiệp của bạn.');
            setIsSubmitting(false);

            // The useEffect above will handle redirection once profile is loaded into context
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

    const seoTitle = 'Đăng ký tài khoản doanh nghiệp | 1Beauty.asia';
    const seoDescription = 'Tạo tài khoản doanh nghiệp miễn phí với gói dùng thử Premium 30 ngày để quảng bá dịch vụ làm đẹp của bạn trên 1Beauty.asia.';
    const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/register/business` : '';

    return (
        <>
            <SEOHead
                title={seoTitle}
                description={seoDescription}
                keywords="đăng ký doanh nghiệp, business registration, salon spa registration"
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h1 className="text-2xl font-bold font-serif text-neutral-dark mb-2">
                                    Đăng ký tài khoản Doanh nghiệp
                                </h1>
                                <p className="text-gray-600">
                                    Dùng thử Premium 30 ngày miễn phí
                                </p>
                            </div>

                            {/* Benefits Banner */}
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-green-800">
                                        <p className="font-semibold mb-1">Ưu đãi đặc biệt khi đăng ký!</p>
                                        <ul className="space-y-1 text-xs">
                                            <li>✓ Gói Premium 30 ngày hoàn toàn miễn phí</li>
                                            <li>✓ Trang giới thiệu doanh nghiệp chuyên nghiệp</li>
                                            <li>✓ Quản lý đặt lịch và dịch vụ dễ dàng</li>
                                        </ul>
                                    </div>
                                </div>
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
                                    <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên doanh nghiệp <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="business_name"
                                        type="text"
                                        name="business_name"
                                        value={formData.business_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Spa & Salon ABC"
                                        disabled={isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Bạn sẽ điền thông tin chi tiết doanh nghiệp ở bước tiếp theo
                                    </p>
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
                                        placeholder="email@business.com"
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
                                        'Tiếp tục'
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

export default RegisterBusinessPage;
