// RegisterUserPage.tsx - Support for role-based separation
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../providers/AuthProvider.tsx';
import SEOHead from '../components/SEOHead.tsx';


const RegisterUserPage: React.FC = () => {
    const navigate = useNavigate();
    const { register, state: authState, profile, isDataLoaded } = useAuth();

    // Redirection useEffect
    useEffect(() => {
        if (authState === 'authenticated' && isDataLoaded && profile) {
            const target = (profile.user_type === 'business' || profile.business_id)
                ? '/business-profile'
                : '/account';
            navigate(target, { replace: true });
        }
    }, [authState, isDataLoaded, profile, navigate]);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error('Mật khẩu không khớp.');
            return;
        }
        setIsSubmitting(true);

        try {
            await register(formData.email, formData.password, { full_name: formData.full_name });
            toast.success('Đăng ký thành công!');
            // Redirection handled by useEffect
        } catch (err: any) {
            toast.error(err.message || 'Đăng ký thất bại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <SEOHead title="Đăng ký người dùng" description="Tạo tài khoản cá nhân" />
            <div className="flex items-center justify-center min-h-[calc(100vh-128px)] bg-gray-50">
                <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-center mb-6">Đăng ký tài khoản cá nhân</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="text" placeholder="Họ và tên" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required className="w-full border p-2 rounded" />
                        <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full border p-2 rounded" />
                        <input type="password" placeholder="Mật khẩu" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="w-full border p-2 rounded" />
                        <input type="password" placeholder="Xác nhận mật khẩu" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required className="w-full border p-2 rounded" />
                        <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white py-2 rounded font-bold font-outfit disabled:bg-gray-400">
                            {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
                        </button>
                    </form>
                    <p className="text-center mt-4 text-sm font-outfit">Đã có tài khoản? <Link to="/login" className="text-primary font-bold">Đăng nhập</Link></p>
                </div>
            </div>
        </>
    );
};

export default RegisterUserPage;
