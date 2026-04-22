/**
 * For Business Explanation Page
 * 
 * This page explains the business registration process BEFORE showing any forms.
 * Visible only to anonymous users and regular users.
 * Business owners and staff are redirected away.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';
import SEOHead from '../components/SEOHead.tsx';
import { useEffect } from 'react';

const ForBusinessPage: React.FC = () => {
    const { user, state } = useAuth();
    const { is_business, isLoading } = useUserRole();
    const navigate = useNavigate();

    // BLOCK ACCESS: Redirect business owners
    useEffect(() => {
        if (state !== 'loading' && !isLoading && user) {
            if (is_business) {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [user, state, isLoading, is_business, navigate]);

    // Show loading while checking
    if (state === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg font-semibold">Đang tải...</p>
                </div>
            </div>
        );
    }

    // Block if user has business access
    if (user && is_business) {
        return null; // Will redirect via useEffect
    }

    const seoTitle = 'Dành cho Doanh nghiệp | 1Beauty.asia';
    const seoDescription = 'Đăng ký tài khoản doanh nghiệp trên 1Beauty.asia để quảng bá dịch vụ và kết nối với khách hàng.';
    const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/for-business` : '';

    return (
        <>
            <SEOHead
                title={seoTitle}
                description={seoDescription}
                keywords="đăng ký doanh nghiệp, business registration, partner registration"
                url={seoUrl}
                type="website"
            />
            <div className="bg-background">
                <div className="container mx-auto px-4 py-16">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold font-serif text-neutral-dark mb-6">
                            Đưa Doanh Nghiệp Của Bạn Lên Một Tầm Cao Mới
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Tham gia BeautyDir ngay hôm nay để kết nối với hàng triệu khách hàng tiềm năng,
                            xây dựng một trang landing page chuyên nghiệp, và quản lý hoạt động kinh doanh của bạn một cách dễ dàng.
                        </p>
                    </div>

                    {/* Benefits Section */}
                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        <div className="bg-white p-8 rounded-lg shadow-md">
                            <div className="text-4xl mb-4">📱</div>
                            <h3 className="text-xl font-bold text-neutral-dark mb-3">Trang Landing Page Chuyên Nghiệp</h3>
                            <p className="text-gray-600">
                                Tạo trang landing page đẹp mắt, tối ưu SEO để khách hàng dễ dàng tìm thấy bạn.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-lg shadow-md">
                            <div className="text-4xl mb-4">👥</div>
                            <h3 className="text-xl font-bold text-neutral-dark mb-3">Tiếp Cận Khách Hàng</h3>
                            <p className="text-gray-600">
                                Kết nối với hàng triệu khách hàng đang tìm kiếm dịch vụ làm đẹp trong khu vực của bạn.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-lg shadow-md">
                            <div className="text-4xl mb-4">⚙️</div>
                            <h3 className="text-xl font-bold text-neutral-dark mb-3">Quản Lý Dễ Dàng</h3>
                            <p className="text-gray-600">
                                Quản lý dịch vụ, đặt lịch, đánh giá và blog của doanh nghiệp từ một nơi duy nhất.
                            </p>
                        </div>
                    </div>

                    {/* Features Section */}
                    <div className="bg-white rounded-lg shadow-md p-8 mb-16">
                        <h2 className="text-3xl font-bold font-serif text-neutral-dark mb-8 text-center">
                            Tính Năng Dành Cho Doanh Nghiệp
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="text-2xl">✅</div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Quản lý dịch vụ và giá cả</h4>
                                    <p className="text-gray-600">Thêm, sửa, xóa dịch vụ và cập nhật giá cả dễ dàng.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="text-2xl">✅</div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Quản lý đặt lịch</h4>
                                    <p className="text-gray-600">Xem và xác nhận các đặt lịch từ khách hàng.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="text-2xl">✅</div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Quản lý đánh giá</h4>
                                    <p className="text-gray-600">Trả lời đánh giá và tương tác với khách hàng.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="text-2xl">✅</div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Viết blog doanh nghiệp</h4>
                                    <p className="text-gray-600">Chia sẻ tin tức và cập nhật về doanh nghiệp của bạn.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="text-2xl">✅</div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Quản lý ưu đãi</h4>
                                    <p className="text-gray-600">Tạo và quản lý các chương trình khuyến mãi.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="text-2xl">✅</div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Thống kê và phân tích</h4>
                                    <p className="text-gray-600">Theo dõi lượt xem, đặt lịch và hiệu quả marketing.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="text-center bg-primary/5 rounded-lg p-12">
                        <h2 className="text-3xl font-bold font-serif text-neutral-dark mb-4">
                            Sẵn Sàng Bắt Đầu?
                        </h2>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                            Đăng ký ngay để tạo tài khoản doanh nghiệp và bắt đầu quảng bá dịch vụ của bạn.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            {user ? (
                                <Link
                                    to="/register"
                                    className="inline-block bg-primary text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-primary-dark transition-transform transform hover:scale-105 shadow-lg"
                                >
                                    Đăng Ký Doanh Nghiệp
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/register"
                                        className="inline-block bg-primary text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-primary-dark transition-transform transform hover:scale-105 shadow-lg"
                                    >
                                        Đăng Ký Ngay
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="inline-block bg-white text-primary border-2 border-primary px-8 py-4 rounded-md font-semibold text-lg hover:bg-primary/10 transition-transform transform hover:scale-105"
                                    >
                                        Đã Có Tài Khoản? Đăng Nhập
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ForBusinessPage;
