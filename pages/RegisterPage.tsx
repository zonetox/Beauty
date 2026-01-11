// C2.6 - Register Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { MembershipTier, BusinessCategory } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { createBusinessWithTrial } from '../lib/businessUtils.ts';
import { useUserSession } from '../contexts/UserSessionContext.tsx';
import { supabase } from '../lib/supabaseClient.ts';
import SEOHead from '../components/SEOHead.tsx';

type UserType = 'user' | 'business';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { refreshProfile } = useUserSession();
    const [userType, setUserType] = useState<UserType>('user');
    const [formData, setFormData] = useState({
        full_name: '',
        business_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
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
            setError('Passwords do not match.');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (userType === 'business' && !formData.business_name.trim()) {
            setError('Business name is required.');
            return;
        }
        if (userType === 'user' && !formData.full_name.trim()) {
            setError('Full name is required.');
            return;
        }

        setIsSubmitting(true);

        if (!isSupabaseConfigured) {
            toast.error("Preview Mode: Registration is disabled.");
            setIsSubmitting(false);
            return;
        }
        
        try {
            // 1. Create Supabase Auth user (NO email verification - skip entirely)
            const displayName = userType === 'business' ? formData.business_name : formData.full_name;
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: undefined, // Skip email verification
                    data: {
                        full_name: displayName,
                        phone: formData.phone,
                    }
                }
            });

            if (signUpError || !authData.user) {
                throw signUpError || new Error('Failed to create user account.');
            }

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
                    address: '', // Will be filled in onboarding
                    categories: [BusinessCategory.SPA], // Default category, can be changed later
                });

                if (!business) {
                    throw new Error('Failed to create business. Please try again.');
                }

                // Refresh profile to ensure business_id is loaded
                // Wait a bit longer to ensure profile is updated with business_id
                let retries = 3;
                let profileUpdated = false;
                while (retries > 0 && !profileUpdated) {
                    try {
                        await refreshProfile();
                        // Verify profile has business_id
                        const { data: updatedProfile } = await supabase
                            .from('profiles')
                            .select('business_id')
                            .eq('id', authData.user.id)
                            .single();
                        
                        if (updatedProfile?.business_id === business.id) {
                            profileUpdated = true;
                        } else {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            retries--;
                        }
                    } catch (refreshError) {
                        console.warn('Profile refresh failed, retrying...', refreshError);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        retries--;
                    }
                }

                // Redirect to business dashboard
                toast.success('Đăng ký thành công! Tài khoản doanh nghiệp của bạn đã được tạo với gói dùng thử 30 ngày.');
                navigate('/account');
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
                navigate('/'); // Redirect to homepage for regular users
            }

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during registration.');
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên doanh nghiệp <span className="text-red-500">*</span></label>
                  <input type="text" name="business_name" value={formData.business_name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại {userType === 'business' && <span className="text-red-500">*</span>}</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required={userType === 'business'} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
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