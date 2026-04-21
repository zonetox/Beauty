import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.ts';
import { Business } from '../types.ts';
import LoadingState from '../components/LoadingState.tsx';
import toast from 'react-hot-toast';

const OnboardingPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchByToken = async () => {
            if (!token) return;

            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('onboarding_token', token)
                .single();

            if (error || !data) {
                console.error('Onboarding Fetch Error:', error);
                toast.error('Onboarding link không hợp lệ hoặc đã hết hạn');
                navigate('/');
                return;
            }

            setBusiness(data);
            setLoading(false);
        };

        fetchByToken();
    }, [token, navigate]);

    const handleOnboard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsSubmitting(true);
        try {
            // Since we don't have the user session yet, we need to instruct them
            // In a real scenario, the token should probably auto-login or the user should use the email provided
            // For now, let's update the business to mark it as "Claimed" and redirect to login

            const { error: updateError } = await supabase
                .from('businesses')
                .update({
                    onboarding_token: null, // Clear token after use
                    is_verified: true
                })
                .eq('id', business?.id);

            if (updateError) throw updateError;

            toast.success('Kích hoạt thành công! Hãy đăng nhập bằng mật khẩu mới của bạn.');
            navigate('/login');

        } catch (error: any) {
            toast.error('Lỗi: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <LoadingState />;

    return (
        <div className="min-h-screen bg-neutral-light flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white shadow-2xl rounded-sm overflow-hidden flex flex-col md:flex-row">
                {/* Preview Side */}
                <div className="md:w-1/2 bg-neutral-dark text-white p-8 flex flex-col justify-center">
                    <h1 className="text-4xl font-serif mb-4 italic">Welcome to</h1>
                    <h2 className="text-2xl font-bold mb-6">{business?.name}</h2>
                    <p className="text-neutral-light/70 mb-8 font-sans leading-relaxed">
                        Trang web Luxury của bạn đã sẵn sàng. Hãy kích hoạt tài khoản để bắt đầu đón khách ngay hôm nay.
                    </p>
                    <div className="border-t border-white/20 pt-6">
                        <p className="text-xs uppercase tracking-widest text-primary">Địa chỉ</p>
                        <p className="text-sm mt-2">{business?.address}</p>
                    </div>
                </div>

                {/* Form Side */}
                <div className="md:w-1/2 p-10">
                    <div className="mb-8">
                        <img src="/logo.png" alt="Beauty Asia" className="h-8 mb-6" />
                        <h3 className="text-xl font-bold text-neutral-dark">Kích hoạt tài khoản</h3>
                        <p className="text-gray-500 text-sm mt-1">Thiết lập mật khẩu quản trị của bạn</p>
                    </div>

                    <form onSubmit={handleOnboard} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                Mật khẩu mới
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-primary outline-none transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                Xác nhận mật khẩu
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border-b-2 border-gray-200 focus:border-primary outline-none transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary text-white py-4 font-bold tracking-widest hover:bg-opacity-90 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'ĐANG KÍCH HOẠT...' : 'KÍCH HOẠT NGAY'}
                        </button>
                    </form>

                    <p className="mt-8 text-[10px] text-gray-400 text-center uppercase tracking-tighter">
                        Bằng việc nhấn kích hoạt, bạn đồng ý với các điều khoản của Beauty Asia.
                    </p>
                </div>
            </div>

            {/* Link back to preview public site */}
            <a
                href={`/business/${business?.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 text-gray-500 hover:text-primary transition-colors text-sm underline"
            >
                Xem trước trang của bạn
            </a>
        </div>
    );
};

export default OnboardingPage;
