// User Account Page - For regular users (not business owners)
// Displays user profile, favorites, and settings

import React, { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import SEOHead from '../components/SEOHead.tsx';
import { Link, useNavigate } from 'react-router-dom';
import BusinessCard from '../components/BusinessCard.tsx';
import EmptyState from '../components/EmptyState.tsx';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient.ts';

type AccountTab = 'profile' | 'favorites' | 'inbox' | 'settings';

interface InboxMessage {
    id: string;
    subject: string;
    body: string;
    sent_at: string;
    read: boolean;
}

const UserAccountPage: React.FC = () => {
    const { user: currentUser, profile, state } = useAuth();
    const loading = state === 'loading';
    const isFavorite = (business_id: number) => profile?.favorites?.includes(business_id) ?? false;
    const { businesses } = useBusinessData();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<AccountTab>('profile');
    const [loadTimeout, setLoadTimeout] = useState(false);
    const [messages, setMessages] = useState<InboxMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Settings Profile form
    const [settingName, setSettingName] = useState(profile?.full_name || currentUser?.user_metadata?.full_name || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile?.full_name || currentUser?.user_metadata?.full_name) {
            setSettingName(profile?.full_name || currentUser?.user_metadata?.full_name || '');
        }
    }, [profile, currentUser]);

    // Safety timeout
    useEffect(() => {
        if (loading) {
            const timeoutId = setTimeout(() => setLoadTimeout(true), 10000);
            return () => clearTimeout(timeoutId);
        }
        void Promise.resolve().then(() => setLoadTimeout(false));
        return undefined;
    }, [loading]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !currentUser) {
            navigate('/login', { state: { from: '/account' }, replace: true });
        }
    }, [loading, currentUser, navigate]);

    // Fetch inbox messages
    useEffect(() => {
        if (activeTab === 'inbox' && currentUser?.email) {
            const fetchMessages = async () => {
                setLoadingMessages(true);
                try {
                    // Get messages from last 30 days
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    // Thử fetch từ notifications table (system inbox)
                    const { data, error } = await supabase
                        .from('notifications')
                        .select('*')
                        .eq('recipient_email', currentUser.email)
                        .gte('sent_at', thirtyDaysAgo.toISOString())
                        .order('sent_at', { ascending: false });

                    if (!error && data) {
                        setMessages(data);
                    }
                } catch (err) {
                    console.error("Error fetching messages:", err);
                } finally {
                    setLoadingMessages(false);
                }
            };
            fetchMessages();
        }
    }, [activeTab, currentUser?.email]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsSaving(true);
        try {
            // Update Auth Metadata
            await supabase.auth.updateUser({
                data: { full_name: settingName }
            });

            // Update Database Profile
            await supabase.from('profiles').update({
                full_name: settingName
            }).eq('id', currentUser.id);

            toast.success('Cập nhật thông tin thành công!');
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi cập nhật thông tin.');
        } finally {
            setIsSaving(false);
        }
    };

    const markAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    };

    // Get favorite businesses
    const favoriteBusinesses = businesses.filter(b => isFavorite(b.id));

    const hasLoadTimeout = loading && loadTimeout;

    if (loading && !hasLoadTimeout) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Đang tải tài khoản...</p>
            </div>
        );
    }

    if (hasLoadTimeout || (!loading && !currentUser)) {
        return (
            <div className="container mx-auto px-4 py-16">
                <EmptyState title="Lỗi tải tài khoản" message="Không thể tải thông tin tài khoản." />
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-neutral-dark">Thông tin tài khoản</h2>
                        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                                <p className="mt-1 text-lg text-neutral-dark font-medium">{profile?.full_name || currentUser?.user_metadata?.full_name || 'Chưa cập nhật'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <p className="mt-1 text-lg text-neutral-dark font-medium">{profile?.email || currentUser?.email}</p>
                            </div>
                            <div className="pt-4 mt-4 border-t">
                                <button
                                    onClick={() => setActiveTab('settings')}
                                    className="text-primary hover:underline font-medium text-sm border-2 border-primary px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors"
                                >
                                    Sửa đổi thông tin
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'favorites':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-neutral-dark">Yêu thích</h2>
                        {favoriteBusinesses.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                                <p>Bạn chưa có yêu thích nào.</p>
                                <Link to="/directory" className="text-primary hover:underline mt-4 block">Khám phá ngay →</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {favoriteBusinesses.map(b => <BusinessCard key={b.id} business={b} />)}
                            </div>
                        )}
                    </div>
                );
            case 'inbox':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-neutral-dark">Hộp thư & Ưu đãi</h2>
                            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Tự động xóa sau 30 ngày</span>
                        </div>
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            {loadingMessages ? (
                                <div className="p-8 text-center text-gray-500">Đang tải tin nhắn...</div>
                            ) : messages.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <p>Hộp thư của bạn đang trống.</p>
                                    <p className="text-sm mt-1">Các chương trình khuyến mãi sẽ xuất hiện tại đây.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {messages.map((msg) => (
                                        <li
                                            key={msg.id}
                                            className={`p-5 transition-colors cursor-pointer ${!msg.read ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                                            onClick={() => markAsRead(msg.id, msg.read)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className={`font-medium ${!msg.read ? 'text-primary' : 'text-neutral-dark'}`}>{msg.subject}</h3>
                                                <span className="text-xs text-gray-500">{new Date(msg.sent_at).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2">{msg.body}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-neutral-dark">Cài đặt tài khoản</h2>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                    <input
                                        type="text"
                                        required
                                        value={settingName}
                                        onChange={(e) => setSettingName(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary p-2 border"
                                        placeholder="Nhập họ và tên của bạn"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-xs text-gray-400 font-normal">(Không thể thay đổi)</span></label>
                                    <input
                                        type="email"
                                        disabled
                                        value={currentUser?.email || ''}
                                        className="w-full border-gray-200 bg-gray-50 rounded-md shadow-sm p-2 border text-gray-500"
                                    />
                                </div>
                                <div className="pt-4 border-t">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-primary text-white font-medium py-2 px-6 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <>
            <SEOHead title="Tài khoản của tôi" description="Thông tin cá nhân" />
            <div className="bg-background py-12 min-h-[calc(100vh-128px)]">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold font-outfit text-neutral-dark mb-8">Tài khoản của tôi</h1>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <aside className="md:col-span-1 space-y-2">
                            <button onClick={() => setActiveTab('profile')} className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${activeTab === 'profile' ? 'bg-primary text-white shadow-md' : 'hover:bg-primary/10 text-neutral-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                Hồ sơ
                            </button>
                            <button onClick={() => setActiveTab('favorites')} className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${activeTab === 'favorites' ? 'bg-primary text-white shadow-md' : 'hover:bg-primary/10 text-neutral-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                                Yêu thích
                            </button>
                            <button onClick={() => setActiveTab('inbox')} className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 justify-between ${activeTab === 'inbox' ? 'bg-primary text-white shadow-md' : 'hover:bg-primary/10 text-neutral-600'}`}>
                                <div className="flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                                    Hộp thư
                                </div>
                            </button>
                            <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${activeTab === 'settings' ? 'bg-primary text-white shadow-md' : 'hover:bg-primary/10 text-neutral-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                                Cài đặt
                            </button>
                        </aside>
                        <main className="md:col-span-3">{renderContent()}</main>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserAccountPage;
