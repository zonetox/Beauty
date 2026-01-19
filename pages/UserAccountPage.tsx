// User Account Page - For regular users (not business owners)
// Displays user profile, favorites, appointments, reviews

import React, { useState } from 'react';
import { useUserSession } from '../contexts/UserSessionContext.tsx';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import SEOHead from '../components/SEOHead.tsx';
import { Link } from 'react-router-dom';
import BusinessCard from '../components/BusinessCard.tsx';

// AccountTab: Only include tabs for features that are ACTUALLY implemented
// Do NOT include incomplete features (appointments, reviews are not implemented for regular users)
type AccountTab = 'profile' | 'favorites';

const UserAccountPage: React.FC = () => {
    const { currentUser, profile, isFavorite, toggleFavorite } = useUserSession();
    const { businesses } = useBusinessData();
    const [activeTab, setActiveTab] = useState<AccountTab>('profile');

    // Get favorite businesses
    const favoriteBusinesses = businesses.filter(b => isFavorite(b.id));

    if (!currentUser || !profile) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold">Loading account...</h1>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold font-serif text-neutral-dark">Thông tin tài khoản</h2>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                                    <p className="mt-1 text-lg text-neutral-dark">{profile.fullName || currentUser.user_metadata?.full_name || 'Chưa cập nhật'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p className="mt-1 text-lg text-neutral-dark">{profile.email || currentUser.email || 'Chưa cập nhật'}</p>
                                </div>
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-gray-500">
                                        Bạn đang sử dụng tài khoản người dùng. Để trở thành đối tác doanh nghiệp, vui lòng{' '}
                                        <Link to="/for-business" className="text-primary hover:underline font-medium">
                                            đăng ký doanh nghiệp
                                        </Link>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'favorites':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold font-serif text-neutral-dark">Doanh nghiệp yêu thích</h2>
                        {favoriteBusinesses.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <p className="text-gray-500">Bạn chưa có doanh nghiệp yêu thích nào.</p>
                                <Link to="/directory" className="mt-4 inline-block text-primary hover:underline font-medium">
                                    Khám phá doanh nghiệp →
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {favoriteBusinesses.map(business => (
                                    <BusinessCard key={business.id} business={business} />
                                ))}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <SEOHead 
                title="Tài khoản của tôi | 1Beauty.asia"
                description="Quản lý thông tin tài khoản, doanh nghiệp yêu thích và lịch hẹn của bạn."
            />
            <div className="bg-background py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold font-serif text-neutral-dark mb-2">Tài khoản của tôi</h1>
                    <p className="text-gray-500 mb-8">Xin chào, <strong className="text-primary">{profile.fullName || currentUser.user_metadata?.full_name || currentUser.email}</strong>!</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <aside className="md:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-4">
                                <nav className="space-y-2">
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            activeTab === 'profile'
                                                ? 'bg-primary text-white'
                                                : 'text-neutral-dark hover:bg-primary/10'
                                        }`}
                                    >
                                        Thông tin tài khoản
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('favorites')}
                                        className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            activeTab === 'favorites'
                                                ? 'bg-primary text-white'
                                                : 'text-neutral-dark hover:bg-primary/10'
                                        }`}
                                    >
                                        Yêu thích ({favoriteBusinesses.length})
                                    </button>
                                    {/* Removed incomplete features: appointments, reviews */}
                                    {/* Only show tabs for features that are ACTUALLY implemented */}
                                </nav>
                            </div>
                        </aside>
                        <main className="md:col-span-3 bg-white rounded-lg shadow-md min-h-[600px] p-8">
                            {renderContent()}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserAccountPage;
