// C2.6 - Register Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';
import SEOHead from '../components/SEOHead.tsx';
import { initializeUserProfile } from '../lib/postSignupInitialization';
import { createBusinessWithTrial } from '../lib/businessUtils';
import { useQueryClient } from '@tanstack/react-query';
import { keys } from '../lib/queryKeys';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, refreshAuth, user, state } = useAuth();
  const { role, is_business, isLoading: roleLoading } = useUserRole();
  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // BLOCK ACCESS: Business owners and admins should not see registration form
  // Only anonymous users can register
  useEffect(() => {
    if (state !== 'loading' && !roleLoading && user) {
      if (is_business) {
        toast.success('Bạn đã có quyền truy cập doanh nghiệp. Đang chuyển đến dashboard...');
        navigate('/dashboard', { replace: true });
      } else if (role === 'admin') {
        // Admins should use admin panel to create businesses, not registration form
        toast.success('Quản trị viên không thể sử dụng form đăng ký. Vui lòng sử dụng admin panel.');
        navigate('/admin', { replace: true });
      }
    }
  }, [user, state, roleLoading, role, is_business, navigate]);

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
  if (user && (is_business || role === 'admin')) {
    return null; // Will redirect via useEffect
  }

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

    // 1. Create Supabase Auth user using AuthProvider
    // ALWAYS register as business and pass business intentions in metadata
    try {
      await register(formData.email, formData.password, {
        full_name: formData.business_name,
        user_type: 'business',
        business_name: formData.business_name,
      });

      // Get the newly created user from auth state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get user from current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Đăng ký thất bại. Vui lòng thử lại.');
      }
      const newUser = session.user;

      // 2. MANDATORY: Initialize and verify profile exists
      const profileResult = await initializeUserProfile(newUser, 3000);

      if (!profileResult.success || !profileResult.profileId) {
        throw new Error(profileResult.error || 'Khởi tạo tài khoản thất bại. Vui lòng thử lại.');
      }

      // 3. MANDATORY for Business users: Create the business record if it doesn't exist
      // This is a safety fallback in case the DB trigger handle_new_user() failed or was bypassed
      await createBusinessWithTrial({
        name: formData.business_name,
        owner_id: newUser.id,
        email: formData.email,
        phone: "Chưa cập nhật",
        address: "Chưa cập nhật",
        categories: ['Spa & Massage']
      });

      // 4. Redirection to Business Dashboard
      // Removed polling loop for business_id as Dashboard now handles asynchronous linking gracefully.
      await queryClient.invalidateQueries({ queryKey: keys.auth.role(newUser.id) });
      await refreshAuth();
      toast.success('Đăng ký thành công! Chào mừng đối tác đến với 1Beauty.asia.');
      navigate('/dashboard', { replace: true });
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
  const seoTitle = 'Đăng ký đối tác | 1Beauty.asia';
  const seoDescription = 'Đăng ký tài khoản doanh nghiệp trên 1Beauty.asia để quảng bá dịch vụ và kết nối với khách hàng.';
  const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/register` : '';

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords="đăng ký đối tác, register, tạo tài khoản doanh nghiệp, business registration"
        url={seoUrl}
        type="website"
      />
      <div className="bg-background">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold font-serif text-center text-neutral-dark mb-10">
            Trở thành đối tác của BeautyDir
          </h1>


          {/* Registration Form */}
          <div className="max-w-xl mx-auto glass-card p-12 rounded-[2.5rem] shadow-premium border border-white/40 animate-fade-in-up">
            <h2 className="text-3xl font-serif text-primary mb-10 tracking-tight">
              Đăng ký đối tác mới
            </h2>

            {error && (
              <div className="bg-red-50 text-red-500 text-xs font-bold uppercase tracking-widest p-4 rounded-xl mb-8 border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="business_name" className="block text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 mb-2 ml-1">Tên doanh nghiệp</label>
                  <input id="business_name" type="text" name="business_name" value={formData.business_name} onChange={handleChange} required placeholder="Ví dụ: Luxury Spa Quận 1" className="w-full px-6 py-4 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-neutral-300 italic font-light" />
                </div>

                <div>
                  <label htmlFor="user-email" className="block text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 mb-2 ml-1">Email đăng nhập</label>
                  <input id="user-email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="đối-tác@beauty.asia" className="w-full px-6 py-4 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-neutral-300 italic font-light" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="user-password" className="block text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 mb-2 ml-1">Mật khẩu</label>
                    <input id="user-password" type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" className="w-full px-6 py-4 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-neutral-300" />
                  </div>
                  <div>
                    <label htmlFor="user-confirm-password" className="block text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 mb-2 ml-1">Xác nhận</label>
                    <input id="user-confirm-password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" className="w-full px-6 py-4 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-neutral-300" />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white py-5 px-8 rounded-full font-bold uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Đang khởi tạo...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Bắt đầu hành trình <span className="ml-2 text-lg group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </span>
                  )}
                </button>
              </div>

              <p className="text-center text-neutral-400 text-xs font-light italic">
                Bằng cách đăng ký, bạn đồng ý với các Điều khoản & Chính sách thượng lưu của chúng tôi
              </p>

              <div className="pt-8 border-t border-primary/5 text-center">
                <p className="text-sm font-light text-neutral-500">
                  Đã là đối tác?{' '}
                  <Link to="/login" className="font-bold text-primary hover:text-accent transition-colors underline underline-offset-4">
                    Đăng nhập tại đây
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
