// Redesigned Business Registration Page
// Validated with Zod, Atomic Transaction Flow
// Replaces the old 2-step process with a robust single-page experience.

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../providers/AuthProvider.tsx';
import SEOHead from '../components/SEOHead.tsx';
import { BusinessRegistrationFormSchema, BusinessRegistrationFormData } from '../lib/schemas/business.schema.ts';
import { CATEGORIES } from '../constants.ts'; // Ensure we have categories

import BusinessOnboardingWizard from '../components/BusinessOnboardingWizard.tsx';

const RegisterBusinessPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, register } = useAuth();

    // If user is ALREADY logged in, show onboarding instead of signup
    if (user) {
        return <BusinessOnboardingWizard />;
    }

    // Form State
    const [formData, setFormData] = useState<BusinessRegistrationFormData>({
        email: '',
        password: '',
        confirmPassword: '',
        business_name: '',
        phone: '',
        address: '',
        category: CATEGORIES[0] || 'Spa', // Default to first category
        description: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof BusinessRegistrationFormData, string>>>({});

    // Handle Input Change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name as keyof BusinessRegistrationFormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    // Main Submit Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // 1. Client-side Zod Validation
        const validationResult = BusinessRegistrationFormSchema.safeParse(formData);

        if (!validationResult.success) {
            const fieldErrors: any = {};
            // Using explicit type or casting to avoid TS errors with ZodError structure if strict mode is aggressive
            validationResult.error.issues.forEach((err: any) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0]] = err.message;
                }
            });
            setErrors(fieldErrors);
            toast.error('Vui lòng kiểm tra lại thông tin đăng ký.');
            // Scroll to top error
            const firstErrorField = document.getElementById(Object.keys(fieldErrors)[0]);
            firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsSubmitting(true);

        try {
            // SINGLE ATOMIC REQUEST
            // The handle_new_user trigger on the server will capture this metadata
            // and create the Profile + Business record in a single transaction.
            await register(formData.email, formData.password, {
                full_name: formData.business_name,
                user_type: 'business',
                business_name: formData.business_name,
                phone: formData.phone,
                address: formData.address,
                category: formData.category,
                description: formData.description || ''
            });

            // Redirect immediately - The AuthProvider state update will handle the rest
            toast.success('Đăng ký doanh nghiệp thành công!');
            navigate('/account', { replace: true });

        } catch (err: any) {
            console.error('Registration Flow Error:', err);
            let msg = err.message || 'Đăng ký thất bại.';

            if (msg.includes('rate limit')) msg = 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.';
            if (msg.includes('already registered')) msg = 'Email này đã được sử dụng.';
            if (msg.includes('User already registered')) msg = 'Email này đã được sử dụng.';

            setErrors({ email: msg });
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const seoTitle = 'Đăng ký Doanh nghiệp | 1Beauty.asia';

    return (
        <>
            <SEOHead title={seoTitle} description="Đăng ký đối tác 1Beauty - Giải pháp quản lý Spa/Salon chuyên nghiệp" />

            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <Link to="/" className="inline-block mb-6">
                            <span className="text-3xl font-bold font-outfit text-gradient">1Beauty.asia</span>
                        </Link>
                        <h1 className="text-3xl font-extrabold text-neutral-dark">
                            Đăng ký Đối tác Doanh nghiệp
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Một tài khoản duy nhất để quản lý, tiếp thị và phát triển thương hiệu của bạn.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* SECTION 1: ACCOUNT INFO */}
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-semibold text-neutral-dark mb-6 flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">1</span>
                                Thông tin tài khoản
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email đăng nhập *</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                        placeholder="email@doanhnghiep.com"
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Mật khẩu *</label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Tối thiểu 6 ký tự"
                                    />
                                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Nhập lại mật khẩu"
                                    />
                                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: BUSINESS INFO */}
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-semibold text-neutral-dark mb-6 flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">2</span>
                                Thông tin doanh nghiệp
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="business_name">Tên doanh nghiệp / Thương hiệu *</label>
                                    <input
                                        id="business_name"
                                        name="business_name"
                                        type="text"
                                        value={formData.business_name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all ${errors.business_name ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Ví dụ: Luxury Spa & Clinic"
                                    />
                                    {errors.business_name && <p className="mt-1 text-sm text-red-500">{errors.business_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">Số điện thoại *</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="0912345678"
                                    />
                                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">Danh mục chính *</label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="address">Địa chỉ kinh doanh *</label>
                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                                    />
                                    {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">Giới thiệu ngắn (không bắt buộc)</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        value={formData.description}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Mô tả ngắn gọn về dịch vụ của bạn..."
                                    />
                                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                                </div>
                            </div>
                        </div>

                        {/* SUBMIT */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary text-white py-4 rounded-xl shadow-lg hover:bg-primary-dark hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-bold text-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang tạo tài khoản...
                                    </span>
                                ) : (
                                    'Đăng ký Doanh nghiệp Ngay (Miễn phí)'
                                )}
                            </button>
                            <p className="text-center text-sm text-gray-500 mt-4">
                                Bằng việc đăng ký, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của chúng tôi.
                            </p>
                        </div>
                    </form>

                    <div className="text-center mt-8">
                        <p className="text-gray-600">
                            Đã có tài khoản?{' '}
                            <Link to="/login" className="font-semibold text-primary hover:text-primary-dark">
                                Đăng nhập
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegisterBusinessPage;
