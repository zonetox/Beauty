// LoginPage.tsx - Support for role-based separation
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import ForgotPasswordModal from '../components/ForgotPasswordModal.tsx';
import SEOHead from '../components/SEOHead.tsx';
import { supabase } from '../lib/supabaseClient.ts';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    // Use `role` (not profile.user_type) for correct redirect logic
    const { login, state, role, isDataLoaded } = useAuth();

    // Redirect already-authenticated users away from login page
    useEffect(() => {
        if (state === 'authenticated' && isDataLoaded && role && role !== 'anonymous') {
            const isBusinessRole = role === 'business_owner' || role === 'business_staff';
            const target = isBusinessRole ? '/business-profile' : '/account';
            navigate(target, { replace: true });
        }
    }, [state, isDataLoaded, role, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            // Handle redirection after fresh login — use role from DB context
            const authUser = (await supabase.auth.getUser()).data.user;
            const { data } = await supabase.rpc('get_user_context', { p_user_id: authUser?.id });
            const dbRole = data?.role as string | undefined;
            let target = '/account';
            if (dbRole === 'business_owner' || dbRole === 'business_staff') {
                target = '/business-profile';
            } else if (
                authUser?.user_metadata?.user_type === 'business' &&
                !data?.business_id
            ) {
                // Business signup but no business linked yet → setup step
                target = '/account/business/setup';
            }
            navigate(target, { replace: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Đăng nhập thất bại.';
            setError(message);
            setIsLoading(false);
        }
    };

    return (
        <>
            <SEOHead title="Đăng nhập" description="Đăng nhập vào hệ thống" />
            <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />
            <div className="flex items-center justify-center min-h-[calc(100vh-128px)] bg-background">
                <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-center mb-6">Đăng nhập tài khoản</h1>
                    {error && <p className="text-red-500 text-center bg-red-100 p-3 mb-4 rounded">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border p-2 rounded" />
                        <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border p-2 rounded" />
                        <button type="submit" disabled={isLoading} className="w-full bg-primary text-white py-2 rounded font-bold font-outfit disabled:bg-gray-400">
                            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>
                    <div className="text-center mt-4 space-y-2">
                        <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="text-sm text-primary">Quên mật khẩu?</button>
                        <p className="text-sm">Chưa có tài khoản? <Link to="/register" className="text-primary font-bold">Đăng ký ngay</Link></p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
