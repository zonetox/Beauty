// LoginPage.tsx - Support for role-based separation
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import ForgotPasswordModal from '../components/ForgotPasswordModal.tsx';
import SEOHead from '../components/SEOHead.tsx';

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
            navigate('/business-profile', { replace: true });
        }
    }, [state, isDataLoaded, role, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/business-profile', { replace: true });
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
                <div className="w-full max-w-md p-10 glass-card rounded-[2.5rem] shadow-premium border border-white/40 animate-fade-in-up">
                    <h1 className="text-3xl font-serif text-primary text-center mb-8 tracking-tight">Chào mừng quý đối tác</h1>

                    {error && (
                        <div className="bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest p-4 rounded-xl mb-6 border border-red-100 animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 mb-2 ml-1">Email</label>
                            <input
                                type="email"
                                placeholder="đối-tác@beauty.asia"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-6 py-4 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-neutral-300 font-light italic"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 mb-2 ml-1">Mật khẩu</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-6 py-4 bg-white/50 border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-neutral-300"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-white py-5 px-8 rounded-full font-bold uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 group"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Đang xác thực...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        Tiến vào không gian <span className="ml-2 text-lg group-hover:translate-x-1 transition-transform">&rarr;</span>
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-8 pt-8 border-t border-primary/5 space-y-4">
                        <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="text-xs font-light italic text-neutral-400 hover:text-primary transition-colors">Dành cho đối tác quên mật khẩu?</button>
                        <p className="text-sm font-light text-neutral-600">
                            Khởi đầu hành trình mới?{' '}
                            <Link to="/register" className="font-bold text-primary hover:text-accent transition-colors underline underline-offset-4">Đăng ký ngay</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
