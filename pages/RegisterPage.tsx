// C2.6 - Register Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { MembershipTier, BusinessCategory } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { createBusinessWithTrial } from '../lib/businessUtils.ts';
import { useAuth } from '../providers/AuthProvider.tsx';
import SEOHead from '../components/SEOHead.tsx';

type UserType = 'user' | 'business';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register, refreshProfile } = useAuth();
    const [userType, setUserType] = useState<UserType>('user');
    const [formData, setFormData] = useState({
        full_name: '',
        business_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        // Business-specific fields
        category: BusinessCategory.SPA,
        address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Validation - Show toast instead of browser alerts
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
        if (userType === 'business') {
            if (!formData.business_name.trim()) {
                const errorMsg = 'Vui lòng nhập tên doanh nghiệp.';
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
        }
        if (userType === 'user' && !formData.full_name.trim()) {
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
            // 1. Create Supabase Auth user using AuthProvider
            const displayName = userType === 'business' ? formData.business_name : formData.full_name;
            await register(formData.email, formData.password, {
                full_name: displayName,
                phone: formData.phone,
            });

            // Get the newly created user from auth state
            // Wait a bit for auth state to update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get user from current session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                throw new Error('Failed to create user account.');
            }
            const authData = { user: session.user };

            // 2. Wait for profile to be created by trigger (handle_new_user)
            // The trigger creates profile automatically with business_id = NULL
            await new Promise(resolve => setTimeout(resolve, 500));

            // 3. Handle business registration if user type is 'business'
            if (userType === 'business') {
                const business = await createBusinessWithTrial({
                    name: formData.business_name.trim(),
                    owner_id: authData.user.id,
                    email: formData.email,
                    phone: formData.phone.trim(),
                    address: formData.address.trim(),
                    categories: [formData.category],
                });

                if (!business) {
                    throw new Error('Failed to create business. Please try again.');
                }

                // createBusinessWithTrial already updates profile.business_id
                // Just refresh profile once and redirect
                try {
                    await refreshProfile();
                    // Small delay to ensure profile is loaded in context
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (refreshError) {
                    console.warn('Profile refresh failed, but continuing:', refreshError);
                }

                toast.success('Đăng ký thành công! Tài khoản doanh nghiệp của bạn đã được tạo với gói dùng thử 30 ngày.');
                navigate('/account', { replace: true });
            } else {
                // User registration - profile already created by trigger with business_id = NULL
                // Just refresh profile and redirect to homepage
                try {
                    await refreshProfile();
                    // Small delay to ensure profile is loaded
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (refreshError) {
                    console.warn('Profile refresh failed, but continuing:', refreshError);
                }

                toast.success('Đăng ký thành công! Chào mừng bạn đến với 1Beauty.asia.');
                navigate('/', { replace: true }); // Redirect to homepage for regular users
            }

        } catch (err: unknown) {
            const error = err as Record<string, unknown>;
            const errorMessage = (error.message as string) || 'An unexpected error occurred during registration.';
            setError(errorMessage);
            // Show toast error instead of browser alert
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };
  
    // SEO metadata
    const seoTitle = 'Đăng ký | 1Beauty.asia';
    const seoDescription = userType === 'business' 
        ? 'Đăng ký tài khoản doanh nghiệp trên 1Beauty.asia để quảng bá dịch vụ và kết nối với khách hàng.'
        : 'Đăng ký tài khoản người dùng trên 1Beauty.asia để khám phá và đặt lịch với các doanh nghiệp làm đẹp.';
    const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/register` : '';

    return (
    <>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords={userType === 'business' 
            ? "đăng ký, register, tạo tài khoản doanh nghiệp, business registration"
            : "đăng ký, register, tạo tài khoản người dùng, user registration"}
        url={seoUrl}
        type="website"
      />
      <div className="bg-background">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold font-serif text-center text-neutral-dark mb-10">
            {userType === 'business' ? 'Trở thành đối tác của BeautyDir' : 'Đăng ký tài khoản'}
          </h1>
          
          {/* User Type Selection */}
          <div className="max-w-xl mx-auto mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <label className="block text-sm font-medium text-gray-700 mb-3">Bạn muốn đăng ký với tư cách:</label>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="user"
                    checked={userType === 'user'}
                    onChange={(e) => setUserType(e.target.value as UserType)}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg text-center transition-all ${
                    userType === 'user' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="font-semibold text-lg mb-1">Người dùng</div>
                    <div className="text-sm text-gray-600">Xem doanh nghiệp, đặt lịch, đánh giá</div>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="business"
                    checked={userType === 'business'}
                    onChange={(e) => setUserType(e.target.value as UserType)}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg text-center transition-all ${
                    userType === 'business' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="font-semibold text-lg mb-1">Doanh nghiệp</div>
                    <div className="text-sm text-gray-600">Quảng bá dịch vụ, quản lý đặt lịch</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 font-serif text-neutral-dark">
              {userType === 'business' ? 'Tạo tài khoản Doanh nghiệp' : 'Tạo tài khoản Người dùng'}
            </h2>
             {error && <p className="text-red-500 text-center bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {userType === 'business' ? (
                <>
                  <div>
                    <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">Tên doanh nghiệp <span className="text-red-500">*</span></label>
                    <input id="business_name" type="text" name="business_name" value={formData.business_name} onChange={handleChange} required title="Tên doanh nghiệp" placeholder="Nhập tên doanh nghiệp" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Lĩnh vực <span className="text-red-500">*</span></label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} required title="Chọn lĩnh vực doanh nghiệp" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                      {Object.values(BusinessCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Địa chỉ doanh nghiệp <span className="text-red-500">*</span></label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="Nhập địa chỉ đầy đủ của doanh nghiệp" />
                  </div>
                  <div>
                    <label htmlFor="business-email" className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                    <input id="business-email" type="email" name="email" value={formData.email} onChange={handleChange} required title="Email doanh nghiệp" placeholder="Nhập email doanh nghiệp" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="business-phone" className="block text-sm font-medium text-gray-700">Số điện thoại <span className="text-red-500">*</span></label>
                    <input id="business-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} required title="Số điện thoại doanh nghiệp" placeholder="0987654321" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="business-password" className="block text-sm font-medium text-gray-700">Mật khẩu <span className="text-red-500">*</span></label>
                    <input id="business-password" type="password" name="password" value={formData.password} onChange={handleChange} required title="Mật khẩu (tối thiểu 6 ký tự)" placeholder="Nhập mật khẩu" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="business-confirm-password" className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                    <input id="business-confirm-password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required title="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
                    <input id="full_name" type="text" name="full_name" value={formData.full_name} onChange={handleChange} required title="Họ và tên" placeholder="Nhập họ và tên" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="user-email" className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                    <input id="user-email" type="email" name="email" value={formData.email} onChange={handleChange} required title="Email" placeholder="Nhập email" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="user-phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                    <input id="user-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} title="Số điện thoại" placeholder="0987654321" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="user-password" className="block text-sm font-medium text-gray-700">Mật khẩu <span className="text-red-500">*</span></label>
                    <input id="user-password" type="password" name="password" value={formData.password} onChange={handleChange} required title="Mật khẩu (tối thiểu 6 ký tự)" placeholder="Nhập mật khẩu" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="user-confirm-password" className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                    <input id="user-confirm-password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required title="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                </>
              )}
            </div>
            <button type="submit" disabled={isSubmitting} className="mt-6 w-full bg-primary text-white py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
             <p className="text-sm text-center text-gray-600 mt-4">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                    Đăng nhập tại đây
                </Link>
            </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;