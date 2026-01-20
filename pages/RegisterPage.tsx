// C2.6 - Register Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { BusinessCategory } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { createBusinessWithTrial } from '../lib/businessUtils.ts';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';
import SEOHead from '../components/SEOHead.tsx';
import ProgressIndicator, { ProgressStep } from '../components/ProgressIndicator.tsx';
import { initializeUserProfile } from '../lib/postSignupInitialization';
import { verifyBusinessLinked } from '../lib/roleResolution';

type UserType = 'user' | 'business';

type RegistrationStep = 
    | 'idle'
    | 'creating_account'
    | 'initializing_profile'
    | 'creating_business'
    | 'verifying_business'
    | 'completing'
    | 'error';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register, refreshProfile, user, state } = useAuth();
    const { role, isBusinessOwner, isBusinessStaff, isLoading: roleLoading } = useUserRole();
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
    const [currentStep, setCurrentStep] = useState<RegistrationStep>('idle');
    const [error, setError] = useState('');
    const [errorStep, setErrorStep] = useState<string | null>(null);

    // BLOCK ACCESS: Business owners, staff, and admins should not see registration form
    // Only anonymous users and regular users (without business access) can register
    useEffect(() => {
        if (state !== 'loading' && !roleLoading && user) {
            if (isBusinessOwner || isBusinessStaff) {
                toast.success('Bạn đã có quyền truy cập doanh nghiệp. Đang chuyển đến dashboard...');
                navigate('/account', { replace: true });
            } else if (role === 'admin') {
                // Admins should use admin panel to create businesses, not registration form
                toast.success('Quản trị viên không thể sử dụng form đăng ký. Vui lòng sử dụng admin panel.');
                navigate('/admin', { replace: true });
            }
        }
    }, [user, state, roleLoading, role, isBusinessOwner, isBusinessStaff, navigate]);

    // Show loading state while checking access
    if (state === 'loading' || roleLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg font-semibold">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    // Block access if user already has business access or is admin
    if (user && (isBusinessOwner || isBusinessStaff || role === 'admin')) {
        return null; // Will redirect via useEffect
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Get step status for progress indicator
    const getStepStatus = (stepId: string): ProgressStep['status'] => {
        if (currentStep === 'error' && errorStep === stepId) {
            return 'error';
        }
        if (currentStep === 'idle') {
            return 'pending';
        }
        
        const stepOrder: RegistrationStep[] = userType === 'business'
            ? ['idle', 'creating_account', 'initializing_profile', 'creating_business', 'verifying_business', 'completing']
            : ['idle', 'creating_account', 'initializing_profile', 'completing'];
        
        // Map step IDs to RegistrationStep values
        const stepMapping: Record<string, RegistrationStep> = {
            'account': 'creating_account',
            'profile': 'initializing_profile',
            'business': 'creating_business',
            'verify': 'verifying_business',
            'complete': 'completing',
        };
        
        const mappedStep = stepMapping[stepId];
        if (!mappedStep) return 'pending';
        
        const currentIndex = stepOrder.indexOf(currentStep);
        const stepIndex = stepOrder.indexOf(mappedStep);
        
        if (stepIndex < 0) return 'pending';
        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'active';
        return 'pending';
    };

    // Get progress steps based on user type
    const getProgressSteps = (): ProgressStep[] => {
        if (userType === 'business') {
            return [
                { id: 'account', label: 'Tạo tài khoản', status: getStepStatus('account') },
                { id: 'profile', label: 'Khởi tạo hồ sơ', status: getStepStatus('profile') },
                { id: 'business', label: 'Tạo doanh nghiệp', status: getStepStatus('business') },
                { id: 'verify', label: 'Xác minh', status: getStepStatus('verify') },
                { id: 'complete', label: 'Hoàn tất', status: getStepStatus('complete') },
            ];
        } else {
            return [
                { id: 'account', label: 'Tạo tài khoản', status: getStepStatus('account') },
                { id: 'profile', label: 'Khởi tạo hồ sơ', status: getStepStatus('profile') },
                { id: 'complete', label: 'Hoàn tất', status: getStepStatus('complete') },
            ];
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setErrorStep(null);
        setCurrentStep('idle');
        
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
            // Step 1: Create Supabase Auth user
            setCurrentStep('creating_account');
            const displayName = userType === 'business' ? formData.business_name : formData.full_name;
            
            try {
                await register(formData.email, formData.password, {
                    full_name: displayName,
                    phone: formData.phone,
                });
            } catch (registerError: unknown) {
                setErrorStep('creating_account');
                const errorMessage = registerError instanceof Error ? registerError.message : String(registerError);
                if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
                    throw new Error('Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.');
                } else if (errorMessage.includes('invalid email')) {
                    throw new Error('Email không hợp lệ. Vui lòng kiểm tra lại.');
                } else if (errorMessage.includes('password')) {
                    throw new Error('Mật khẩu không đủ mạnh. Vui lòng thử lại với mật khẩu khác.');
                } else {
                    throw new Error(`Không thể tạo tài khoản: ${errorMessage || 'Lỗi không xác định'}`);
                }
            }

            // Wait for session to be established
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get user from current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session?.user) {
                setErrorStep('creating_account');
                throw new Error('Không thể xác thực tài khoản. Vui lòng thử lại.');
            }
            const newUser = session.user;

            // Step 2: Initialize and verify profile
            setCurrentStep('initializing_profile');
            let profileResult;
            try {
                profileResult = await initializeUserProfile(newUser, 5000); // Increased timeout to 5s
            } catch (profileError: unknown) {
                setErrorStep('initializing_profile');
                const errorMessage = profileError instanceof Error ? profileError.message : String(profileError);
                throw new Error(`Không thể khởi tạo hồ sơ: ${errorMessage || 'Lỗi không xác định'}`);
            }
            
            if (!profileResult.success || !profileResult.profileId) {
                setErrorStep('initializing_profile');
                throw new Error(profileResult.error || 'Khởi tạo hồ sơ thất bại. Vui lòng liên hệ hỗ trợ.');
            }

            // Step 3: Handle business registration if user type is 'business'
            if (userType === 'business') {
                setCurrentStep('creating_business');
                let business;
                try {
                    business = await createBusinessWithTrial({
                        name: formData.business_name.trim(),
                        owner_id: newUser.id,
                        email: formData.email,
                        phone: formData.phone.trim(),
                        address: formData.address.trim(),
                        categories: [formData.category],
                    });
                } catch (businessError: unknown) {
                    setErrorStep('creating_business');
                    const errorMessage = businessError instanceof Error ? businessError.message : String(businessError);
                    throw new Error(`Không thể tạo doanh nghiệp: ${errorMessage || 'Lỗi không xác định'}`);
                }

                if (!business) {
                    setErrorStep('creating_business');
                    throw new Error('Tạo doanh nghiệp thất bại. Vui lòng thử lại.');
                }

                // Step 4: Verify business is linked to profile
                setCurrentStep('verifying_business');
                let businessResult;
                try {
                    businessResult = await verifyBusinessLinked(newUser.id);
                } catch (verifyError: unknown) {
                    setErrorStep('verifying_business');
                    const errorMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
                    throw new Error(`Không thể xác minh doanh nghiệp: ${errorMessage || 'Lỗi không xác định'}`);
                }
                
                if (!businessResult.exists || !businessResult.businessId) {
                    setErrorStep('verifying_business');
                    throw new Error(businessResult.error || 'Thiết lập tài khoản doanh nghiệp chưa hoàn tất. Vui lòng liên hệ hỗ trợ.');
                }

                // Step 5: Complete
                setCurrentStep('completing');
                try {
                    await refreshProfile();
                } catch (refreshError) {
                    // Non-critical - profile should already be loaded
                    console.warn('Profile refresh failed:', refreshError);
                }
                
                toast.success('Đăng ký thành công! Tài khoản doanh nghiệp của bạn đã được tạo với gói dùng thử 30 ngày.');
                navigate('/account', { replace: true });
            } else {
                // User registration - complete
                setCurrentStep('completing');
                try {
                    await refreshProfile();
                } catch (refreshError) {
                    // Non-critical - profile should already be loaded
                    console.warn('Profile refresh failed:', refreshError);
                }
                
                toast.success('Đăng ký thành công! Chào mừng bạn đến với 1Beauty.asia.');
                navigate('/', { replace: true });
            }

        } catch (err: unknown) {
            setCurrentStep('error');
            const error = err as Record<string, unknown>;
            const errorMessage = (error.message as string) || 'Đã xảy ra lỗi không mong muốn trong quá trình đăng ký.';
            setError(errorMessage);
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
            
            {/* Progress Indicator */}
            {isSubmitting && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <ProgressIndicator steps={getProgressSteps()} />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">Lỗi đăng ký</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                    {errorStep && (
                      <p className="mt-2 text-xs text-red-600">
                        Lỗi xảy ra ở bước: {getProgressSteps().find(s => s.id === errorStep)?.label || errorStep}
                      </p>
                    )}
                    {currentStep === 'error' && (
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setErrorStep(null);
                          setCurrentStep('idle');
                        }}
                        className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
                      >
                        Thử lại
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

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
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="mt-6 w-full bg-primary text-white py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {currentStep === 'creating_account' && 'Đang tạo tài khoản...'}
                  {currentStep === 'initializing_profile' && 'Đang khởi tạo hồ sơ...'}
                  {currentStep === 'creating_business' && 'Đang tạo doanh nghiệp...'}
                  {currentStep === 'verifying_business' && 'Đang xác minh...'}
                  {currentStep === 'completing' && 'Đang hoàn tất...'}
                  {!currentStep || currentStep === 'idle' && 'Đang đăng ký...'}
                </>
              ) : (
                'Đăng ký'
              )}
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