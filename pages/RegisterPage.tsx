// pages/RegisterPage.tsx

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { MembershipTier, BusinessCategory } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
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
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsSubmitting(true);

        if (!isSupabaseConfigured) {
            toast.error("Preview Mode: Registration is disabled.");
            setIsSubmitting(false);
            return;
        }
        
        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.business_name,
                        phone: formData.phone,
                    }
                }
            });

            if (signUpError) {
                throw signUpError;
            }
            
            // On success, Supabase sends a confirmation email. 
            // The user is logged in, and the trigger will create their business/profile.
            toast.success('Registration successful! Please check your email to confirm your account.');
            navigate('/account'); // Redirect to dashboard

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during registration.');
        } finally {
            setIsSubmitting(false);
        }
    };
  
    return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold font-serif text-center text-neutral-dark mb-10">Trở thành đối tác của BeautyDir</h1>
        
        {/* Registration Form */}
        <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 font-serif text-neutral-dark">Tạo tài khoản Doanh nghiệp</h2>
           {error && <p className="text-red-500 text-center bg-red-100 p-3 rounded-md mb-4">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên doanh nghiệp</label>
                <input type="text" name="business_name" value={formData.business_name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
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
  );
};

export default RegisterPage;