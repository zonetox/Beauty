// User Account Page - For regular users (not business owners)
// Displays user profile, favorites, appointments, reviews

import React, { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import SEOHead from '../components/SEOHead.tsx';
import { Link, useNavigate } from 'react-router-dom';
import BusinessCard from '../components/BusinessCard.tsx';
import EmptyState from '../components/EmptyState.tsx';

// AccountTab: Only include tabs for features that are ACTUALLY implemented
type AccountTab = 'profile' | 'favorites';

const UserAccountPage: React.FC = () => {
    const { user: currentUser, profile, state } = useAuth();
    const loading = state === 'loading';
    const isFavorite = (business_id: number) => profile?.favorites?.includes(business_id) ?? false;
    const { businesses } = useBusinessData();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<AccountTab>('profile');
    const [loadTimeout, setLoadTimeout] = useState(false);

    // Safety timeout
    useEffect(() => {
        if (loading) {
            const timeoutId = setTimeout(() => setLoadTimeout(true), 10000);
            return () => clearTimeout(timeoutId);
        }
        setLoadTimeout(false);
        return undefined;
    }, [loading]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !currentUser) {
            navigate('/login', { state: { from: '/account' }, replace: true });
        }
    }, [loading, currentUser, navigate]);

    // Get favorite businesses
    const favoriteBusinesses = businesses.filter(b => isFavorite(b.id));

    if (loading && !loadTimeout) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Đang tải tài khoản...</p>
            </div>
        );
    }

    if (loadTimeout || (!loading && !currentUser)) {
        return (
            <div className="container mx-auto px-4 py-16">
                <EmptyState title="Lỗi tải tài khoản" message="Không thể tải thông tin tài khoản." />
            </div>
        );
    }

    if (!profile && currentUser) {
        return (
            <div className="container mx-auto px-4 py-16">
                <EmptyState title="Tài khoản chưa hoàn tất" message="Vui lòng thử đăng nhập lại." />
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
                                <p className="mt-1 text-lg text-neutral-dark">{profile?.full_name || 'Chưa cập nhật'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <p className="mt-1 text-lg text-neutral-dark">{profile?.email || currentUser?.email}</p>
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
            default: return null;
        }
    };

    return (
        <>
            <SEOHead title="Tài khoản của tôi" description="Thông tin cá nhân" />
            <div className="bg-background py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold text-neutral-dark mb-8">Tài khoản của tôi</h1>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <aside className="md:col-span-1 space-y-2">
                            <button onClick={() => setActiveTab('profile')} className={`w-full text-left px-4 py-2 rounded-md ${activeTab === 'profile' ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}>Hồ sơ</button>
                            <button onClick={() => setActiveTab('favorites')} className={`w-full text-left px-4 py-2 rounded-md ${activeTab === 'favorites' ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}>Yêu thích</button>
                        </aside>
                        <main className="md:col-span-3">{renderContent()}</main>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserAccountPage;
