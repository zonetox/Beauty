// User Account Page - For regular users (not business owners)
// Displays user profile, favorites, appointments, reviews

import React, { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import SEOHead from '../components/SEOHead.tsx';
import { Link, useNavigate } from 'react-router-dom';
import BusinessCard from '../components/BusinessCard.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { useAppInitialization } from '../contexts/AppInitializationContext.tsx';

// AccountTab: Only include tabs for features that are ACTUALLY implemented
// Do NOT include incomplete features (appointments, reviews are not implemented for regular users)
type AccountTab = 'profile' | 'favorites';

const UserAccountPage: React.FC = () => {
    const { user: currentUser, profile, state } = useAuth();
    const loading = state === 'loading';
    const isFavorite = (businessId: number) => profile?.favorites?.includes(businessId) ?? false;
    const { businesses } = useBusinessData();
    const navigate = useNavigate();
    const { isInitializing } = useAppInitialization();
    const [activeTab, setActiveTab] = useState<AccountTab>('profile');
    const [loadTimeout, setLoadTimeout] = useState(false);

    // Safety timeout: If loading takes more than 10 seconds, show error
    useEffect(() => {
        if (loading) {
            const timeoutId = setTimeout(() => {
                setLoadTimeout(true);
            }, 10000);

            return () => clearTimeout(timeoutId);
        }
        return undefined;
    }, [loading]);

    // Reset timeout when loading completes
    useEffect(() => {
        if (!loading) {
            setLoadTimeout(false);
        }
    }, [loading]);

    // Redirect to login if not authenticated (after loading completes)
    useEffect(() => {
        if (!loading && !currentUser) {
            navigate('/login', { state: { from: '/account' }, replace: true });
        }
    }, [loading, currentUser, navigate]);

    // Get favorite businesses
    const favoriteBusinesses = businesses.filter(b => isFavorite(b.id));

    // Don't show loading if app is still initializing
    if (isInitializing) {
        return null; // AppInitializationScreen will be shown
    }

    // Loading state - show spinner (only if not initializing)
    if (loading && !loadTimeout) {
        return (
            <>
                <SEOHead title="Đang tải tài khoản..." description="Đang tải thông tin tài khoản..." />
                <div className="container mx-auto px-4 py-16">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải tài khoản...</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Timeout or error state
    if (loadTimeout || (!loading && !currentUser)) {
        return (
            <>
                <SEOHead title="Lỗi tải tài khoản" description="Không thể tải thông tin tài khoản" />
                <div className="container mx-auto px-4 py-16">
                    <EmptyState
                        title="Không thể tải tài khoản"
                        message={
                            loadTimeout
                                ? "Tải thông tin tài khoản mất quá nhiều thời gian. Vui lòng thử lại sau."
                                : "Bạn cần đăng nhập để xem tài khoản."
                        }
                    />
                </div>
            </>
        );
    }

    // Profile not found (user exists but profile doesn't)
    if (!loading && currentUser && !profile) {
        return (
            <>
                <SEOHead title="Tài khoản chưa hoàn tất" description="Thông tin tài khoản chưa được thiết lập" />
                <div className="container mx-auto px-4 py-16">
                    <EmptyState
                        title="Tài khoản chưa hoàn tất"
                        message="Thông tin tài khoản của bạn chưa được thiết lập. Vui lòng liên hệ hỗ trợ hoặc thử đăng nhập lại."
                    />
                </div>
            </>
        );
    }

    // Should not reach here if data is valid, but safety check
    if (!currentUser || !profile) {
        return (
            <>
                <SEOHead title="Đang tải tài khoản..." description="Đang tải thông tin tài khoản..." />
                <div className="container mx-auto px-4 py-16">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải tài khoản...</p>
                        </div>
                    </div>
                </div>
            </>
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
                                        className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'profile'
                                            ? 'bg-primary text-white'
                                            : 'text-neutral-dark hover:bg-primary/10'
                                            }`}
                                    >
                                        Thông tin tài khoản
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('favorites')}
                                        className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'favorites'
                                            ? 'bg-primary text-white'
                                            : 'text-neutral-dark hover:bg-primary/10'
                                            }`}
                                    >
                                        Yêu thích ({favoriteBusinesses.length})
                                    </button>
                                    <div className="pt-4 mt-4 border-t border-gray-100">
                                        <Link
                                            to="/"
                                            className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                                            Về trang chủ
                                        </Link>
                                    </div>
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