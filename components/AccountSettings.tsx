import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../providers/AuthProvider.tsx';
// src/types.ts imports handled below if needed
import BusinessProfileEditor from './BusinessProfileEditor.tsx';
import MembershipAndBilling from './MembershipAndBilling.tsx';
import { supabase } from '../lib/supabaseClient.ts';
import { Building2, Shield, CreditCard, User, UserCircle, Lock, Camera, Save, Bell } from 'lucide-react';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }> = ({ active, onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all relative border-b-2 overflow-hidden ${active
            ? 'text-primary border-primary bg-primary/[0.03]'
            : 'text-neutral-400 border-transparent hover:text-primary/70 hover:bg-gray-50/50'
            }`}
    >
        <span className={`${active ? 'text-primary' : 'text-neutral-300'} transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>{icon}</span>
        {children}
        {active && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary animate-slide-in-left"></div>}
    </button>
);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string; title?: string; icon?: React.ReactNode }> = ({ children, className = '', title, icon }) => (
    <div className={`glass-card p-6 sm:p-8 rounded-[2rem] border border-white/40 shadow-glass overflow-hidden relative group ${className}`}>
        {(title || icon) && (
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100/50">
                {icon && <div className="p-2 bg-primary/10 rounded-xl text-primary">{icon}</div>}
                {title && <h3 className="text-xl font-serif text-primary tracking-wide">{title}</h3>}
            </div>
        )}
        {children}
    </div>
);

const AccountSettings: React.FC = () => {
    const { user, profile, refreshAuth } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'security' | 'billing'>('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);

    // Profile state
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

    // Security state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const isBusiness = profile?.user_type === 'business' || profile?.user_type === 'admin';
    const hasBusinessId = !!profile?.business_id;

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [profile]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSaving) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;
            toast.success('Cập nhật thành công!');
            await refreshAuth();
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu không khớp!');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Mật khẩu tối thiểu 6 ký tự!');
            return;
        }

        setIsChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success('Đã thay đổi mật khẩu!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const toggleNotification = async (key: 'bookings' | 'reviews') => {
        if (!user || !profile) return;

        try {
            const currentSettings = profile.notification_settings || {};
            const dbKey = key === 'bookings' ? 'booking_requests' : 'review_alerts';
            const newVal = !currentSettings[dbKey as keyof typeof currentSettings];

            const { error } = await supabase
                .from('profiles')
                .update({
                    notification_settings: {
                        ...currentSettings,
                        [dbKey]: newVal
                    }
                })
                .eq('id', user.id);

            if (error) throw error;
            await refreshAuth();
            toast.success('Đã cập nhật tùy chọn thông báo');
        } catch (err: any) {
            toast.error('Lỗi: ' + err.message);
        }
    };

    const handleInitializeBusiness = async () => {
        if (!user || isInitializing) return;
        setIsInitializing(true);

        const bName = fullName || 'Doanh nghiệp của tôi';
        const slug = `${bName.toLowerCase().trim().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`;

        try {
            const { data: business, error: bErr } = await supabase
                .from('businesses')
                .insert({
                    name: bName,
                    slug,
                    owner_id: user.id,
                    is_active: true,
                    is_verified: false,
                    address: 'Chưa cập nhật',
                    city: 'TP. Hồ Chí Minh',
                    district: 'Quận 1',
                    ward: 'Phường Bến Thành',
                    phone: 'Chưa cập nhật',
                    description: 'Hồ sơ doanh nghiệp mới xây dựng.',
                    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60',
                    categories: ['Spa & Massage'],
                    working_hours: {
                        monday: { open: "09:00", close: "18:00" },
                        tuesday: { open: "09:00", close: "18:00" },
                        wednesday: { open: "09:00", close: "18:00" },
                        thursday: { open: "09:00", close: "18:00" },
                        friday: { open: "09:00", close: "18:00" },
                        saturday: { open: "09:00", close: "18:00" },
                        sunday: { open: "Closed", close: "Closed" }
                    }
                })
                .select()
                .single();

            if (bErr) throw bErr;

            const { error: pErr } = await supabase
                .from('profiles')
                .update({ business_id: business.id, user_type: 'business' })
                .eq('id', user.id);

            if (pErr) throw pErr;

            toast.success('Đã khởi tạo doanh nghiệp!');
            await refreshAuth();
            window.location.reload();
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message);
        } finally {
            setIsInitializing(false);
        }
    };

    return (
        <div className="animate-fade-in bg-background/50 min-h-screen">
            {/* Header Area */}
            <div className="p-8 md:p-12 border-b border-luxury-border/30 bg-white/40 backdrop-blur-md relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <h1 className="text-3xl md:text-4xl font-serif text-primary tracking-tight mb-2">Cài đặt</h1>
                    <p className="text-neutral-500 font-light text-sm italic max-w-xl">
                        {activeTab === 'profile' && 'Cập nhật thông tin cá nhân của bạn.'}
                        {activeTab === 'business' && 'Quản lý thông tin thương hiệu và vận hành.'}
                        {activeTab === 'security' && 'Tăng cường bảo mật và tùy chỉnh thông báo.'}
                        {activeTab === 'billing' && 'Quản lý gói hội viên và quyền lợi đối tác.'}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-luxury-border/30 sticky top-0 bg-white/70 backdrop-blur-xl z-20 shadow-sm overflow-x-auto no-scrollbar">
                <div className="max-w-6xl mx-auto w-full flex">
                    <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserCircle size={16} />}>Cá nhân</TabButton>
                    {isBusiness && (
                        <TabButton active={activeTab === 'business'} onClick={() => setActiveTab('business')} icon={<Building2 size={16} />}>Doanh nghiệp</TabButton>
                    )}
                    <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield size={16} />}>Bảo mật</TabButton>
                    {isBusiness && (
                        <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={<CreditCard size={16} />}>Gói hội viên</TabButton>
                    )}
                </div>
            </div>

            {/* Main Content Areas */}
            <div className="max-w-6xl mx-auto p-4 sm:p-8 md:p-12 pb-32">
                {/* Personal Tab */}
                {activeTab === 'profile' && (
                    <div className="animate-fade-in-up grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            <GlassCard title="Hồ sơ chuẩn" icon={<User size={20} />}>
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Họ và tên</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full px-5 py-3 bg-white/50 border border-luxury-border/30 rounded-xl focus:border-primary/50 transition-all outline-none text-sm"
                                                    placeholder="Nhập tên..."
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Email (Cố định)</label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    value={user?.email || ''}
                                                    disabled
                                                    className="w-full px-5 py-3 bg-gray-100/50 border border-transparent rounded-xl text-neutral-400 cursor-not-allowed text-sm"
                                                />
                                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300" size={14} />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2 space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Ảnh đại diện (URL)</label>
                                            <div className="flex gap-4">
                                                <input
                                                    type="text"
                                                    value={avatarUrl}
                                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                                    className="flex-1 px-5 py-3 bg-white/50 border border-luxury-border/30 rounded-xl focus:border-primary/50 transition-all outline-none text-sm font-light italic"
                                                    placeholder="https://..."
                                                />
                                                <div className="w-12 h-12 bg-primary/5 rounded-xl border border-dashed border-primary/20 flex items-center justify-center overflow-hidden">
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Camera size={18} className="text-primary/30" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="px-8 py-3 bg-primary text-white text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:translate-y-0 transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isSaving ? 'Đang lưu...' : <><Save size={14} /> Lưu thay đổi</>}
                                        </button>
                                    </div>
                                </form>
                            </GlassCard>

                            {!hasBusinessId && isBusiness && (
                                <div className="p-8 rounded-[2rem] border border-primary/20 bg-primary/[0.02] text-center space-y-4">
                                    <Building2 className="w-12 h-12 text-primary/40 mx-auto" />
                                    <h3 className="text-xl font-serif text-primary">Kích hoạt tài khoản Doanh nghiệp</h3>
                                    <p className="text-neutral-500 text-sm italic max-w-sm mx-auto">Bạn chưa có hồ sơ doanh nghiệp. Hãy khởi tạo ngay để bắt đầu kinh doanh.</p>
                                    <button
                                        onClick={handleInitializeBusiness}
                                        disabled={isInitializing}
                                        className="px-8 py-4 bg-primary text-white text-[11px] font-bold uppercase tracking-widest rounded-full transition-all shadow-xl shadow-primary/20 hover:scale-[1.02]"
                                    >
                                        {isInitializing ? 'Đang tạo...' : 'Khởi tạo ngay'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="hidden md:block">
                            <div className="sticky top-28 space-y-6">
                                <div className="p-6 bg-white rounded-[2rem] border border-luxury-border/30 shadow-sm text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-white shadow-xl overflow-hidden ring-4 ring-primary/5">
                                        <img
                                            src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=60'}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <h4 className="font-serif text-lg text-primary">{fullName || 'Chưa đặt tên'}</h4>
                                    <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">{profile?.user_type === 'admin' ? 'Quản trị viên' : 'Chủ doanh nghiệp'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Business Tab */}
                {activeTab === 'business' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        {hasBusinessId ? (
                            <div className="space-y-6">
                                <BusinessProfileEditor initialTab="info" />
                            </div>
                        ) : (
                            <div className="p-20 text-center glass-card rounded-[2rem] border border-dashed border-luxury-border/50">
                                <Building2 className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                                <p className="text-neutral-400 italic">Hãy khởi tạo hồ sơ doanh nghiệp tại tab Cá nhân trước.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="animate-fade-in-up grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <GlassCard title="Thông báo" icon={<Bell size={20} />}>
                            <div className="space-y-4">
                                {[
                                    { id: 'bookings', label: 'Đặt lịch hẹn', desc: 'Nhận email khi có yêu cầu đặt chỗ mới.', active: profile?.notification_settings?.booking_requests !== false },
                                    { id: 'reviews', label: 'Đánh giá khách hàng', desc: 'Thông báo khi có phản hồi mới từ người dùng.', active: profile?.notification_settings?.review_alerts !== false },
                                    { id: 'system', label: 'Cập nhật hệ thống', desc: 'Thông tin bảo trì và tính năng mới.', disabled: true, active: true }
                                ].map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => !item.disabled && toggleNotification(item.id as 'bookings' | 'reviews')}
                                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${item.disabled ? 'bg-gray-50 opacity-40 border-gray-100 cursor-not-allowed' : 'bg-white/40 border-luxury-border/30 hover:bg-white hover:border-primary/20 cursor-pointer'}`}
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">{item.label}</p>
                                            <p className="text-[10px] text-neutral-400 italic mt-1 font-light">{item.desc}</p>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${item.disabled ? 'bg-neutral-200' : (item.active ? 'bg-primary' : 'bg-neutral-300')}`}>
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm shadow-black/20 transition-all duration-300 ${item.active ? 'right-0.5' : 'left-0.5'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        <GlassCard title="Đổi mật khẩu" icon={<Lock size={20} />}>
                            <form onSubmit={handleUpdatePassword} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-5 py-3 bg-white/50 border border-luxury-border/30 rounded-xl focus:border-primary/50 outline-none text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Xác nhận mật khẩu</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-5 py-3 bg-white/50 border border-luxury-border/30 rounded-xl focus:border-primary/50 outline-none text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isChangingPassword || !newPassword}
                                        className="w-full py-4 bg-primary text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-40"
                                    >
                                        {isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                                    </button>
                                </div>
                            </form>
                        </GlassCard>
                    </div>
                )}

                {/* Subscription Tab */}
                {activeTab === 'billing' && (
                    <div className="animate-fade-in-up max-w-5xl mx-auto">
                        <MembershipAndBilling />
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slide-in-left {
                    from { transform: translateX(-100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-left {
                    animation: slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default AccountSettings;
