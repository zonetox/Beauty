// Business Setup Page
// Complete business profile after registration (protected route)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../providers/AuthProvider.tsx';
import { BusinessCategory } from '../types.ts';
import { createBusinessWithTrial } from '../lib/businessUtils.ts';
import SEOHead from '../components/SEOHead.tsx';

const BusinessSetupPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile, refreshAuth } = useAuth();

    const [formData, setFormData] = useState({
        business_name: '',
        category: BusinessCategory.SPA,
        phone: '',
        address: '',
        city: 'Ho Chi Minh',
        district: 'District 1',
        ward: 'Ben Nghe',
        description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Pre-fill business name from user metadata if available
    useEffect(() => {
        if (user?.user_metadata?.full_name) {
            setFormData(prev => ({
                ...prev,
                business_name: user.user_metadata.full_name,
            }));
        }
    }, [user]);

    // Redirect if user already has a business
    useEffect(() => {
        if (profile?.businessId) {
            toast.success('Bạn đã có doanh nghiệp. Chuyển đến dashboard...');
            navigate('/account', { replace: true });
        }
    }, [profile, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.business_name.trim()) {
            const errorMsg = 'Vui lòng nhập tên doanh nghiệp.';
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }
        if (!formData.phone.trim()) {
            const errorMsg = 'Vui lòng nhập số điện thoại.';
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }
        if (!formData.address.trim()) {
            const errorMsg = 'Vui lòng nhập địa chỉ doanh nghiệp.';
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        if (!user) {
            toast.error('Vui lòng đăng nhập để tiếp tục.');
            navigate('/login');
            return;
        }

        setIsSubmitting(true);

        try {
            // Create business with trial
            const business = await createBusinessWithTrial({
                name: formData.business_name.trim(),
                owner_id: user.id,
                email: user.email || '',
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                city: formData.city,
                district: formData.district,
                ward: formData.ward,
                categories: [formData.category],
                description: formData.description.trim() || `Chào mừng đến với ${formData.business_name.trim()}`,
            });

            if (!business) {
                throw new Error('Không thể tạo doanh nghiệp. Vui lòng thử lại.');
            }

            // Refresh profile to get updated business_id
            await refreshAuth();

            // Success!
            toast.success('Thiết lập doanh nghiệp thành công! Gói Premium 30 ngày đã được kích hoạt.');
            await new Promise(resolve => setTimeout(resolve, 1000));
            navigate('/account', { replace: true });

        } catch (err: unknown) {
            const error = err as Record<string, unknown>;
            const errorMessage = (error.message as string) || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const seoTitle = 'Thiết lập doanh nghiệp | 1Beauty.asia';
    const seoDescription = 'Hoàn tất thiết lập thông tin doanh nghiệp của bạn để bắt đầu sử dụng 1Beauty.asia.';
    const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/account/business/setup` : '';

    // Show loading if checking profile
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <SEOHead
                title={seoTitle}
                description={seoDescription}
                keywords="thiết lập doanh nghiệp, business setup"
                url={seoUrl}
                type="website"
            />
            <div className="bg-background min-h-[calc(100vh-128px)]">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-2xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold font-serif text-neutral-dark mb-2">
                                Thiết lập thông tin doanh nghiệp
                            </h1>
                            <p className="text-gray-600">
                                Hoàn tất thông tin để kích hoạt gói Premium 30 ngày miễn phí
                            </p>
                        </div>

                        {/* Progress Indicator */}
                        <div className="mb-8">
                            <div className="flex items-center justify-center space-x-4">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                                        ✓
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-gray-700">Tạo tài khoản</span>
                                </div>
                                <div className="w-16 h-1 bg-primary"></div>
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                                        2
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-primary">Thiết lập doanh nghiệp</span>
                                </div>
                            </div>
                        </div>

                        {/* Form Card */}
                        <div className="bg-white p-8 rounded-lg shadow-md">
                            {/* Error Display */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start">
                                        <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <p className="ml-3 text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Business Name */}
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
                                </div>

                                {/* Category */}
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                        Lĩnh vực <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        {Object.values(BusinessCategory).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        placeholder="0987654321"
                                        disabled={isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* Address */}
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                        Địa chỉ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="address"
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        placeholder="123 Nguyễn Huệ"
                                        disabled={isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* Location Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                            Thành phố
                                        </label>
                                        <input
                                            id="city"
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder="Ho Chi Minh"
                                            disabled={isSubmitting}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                                            Quận/Huyện
                                        </label>
                                        <input
                                            id="district"
                                            type="text"
                                            name="district"
                                            value={formData.district}
                                            onChange={handleChange}
                                            placeholder="District 1"
                                            disabled={isSubmitting}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
                                            Phường/Xã
                                        </label>
                                        <input
                                            id="ward"
                                            type="text"
                                            name="ward"
                                            value={formData.ward}
                                            onChange={handleChange}
                                            placeholder="Ben Nghe"
                                            disabled={isSubmitting}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả ngắn (tùy chọn)
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Giới thiệu ngắn về doanh nghiệp của bạn..."
                                        disabled={isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Bạn có thể cập nhật thông tin chi tiết hơn sau trong dashboard
                                    </p>
                                </div>

                                {/* Submit Button */}
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
                                            Đang tạo doanh nghiệp...
                                        </>
                                    ) : (
                                        'Hoàn tất thiết lập'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BusinessSetupPage;
