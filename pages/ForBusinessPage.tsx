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
            <div className="bg-background relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute top-1/2 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl opacity-30"></div>
                </div>

                <div className="container mx-auto px-4 py-24 relative z-10">
                    {/* Hero Section - High Conversion Design */}
                    <div className="max-w-4xl mx-auto text-center mb-24">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-8 animate-fade-in-up">
                            <span>SaaS Solutions for Beauty Elite</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold font-serif text-primary mb-8 tracking-tightest uppercase animate-fade-in-up delay-100">
                            Nâng tầm <span className="text-accent underline decoration-primary/20 underline-offset-8">Vị thế</span> <br />
                            Doanh nghiệp của bạn
                        </h1>
                        <p className="text-xl text-neutral-500 max-w-3xl mx-auto leading-relaxed font-light tracking-wide animate-fade-in-up delay-200">
                            Tham gia hệ sinh thái 1Beauty.asia để tiếp cận cộng đồng hàng chục ngàn người dùng,
                            sở hữu trang landing page chuyên nghiệp chuẩn SEO và hệ thống quản trị hiệu suất cao.
                        </p>
                    </div>

                    {/* Luxury SaaS Benefit Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 animate-fade-in-up delay-300">
                        <div className="group bg-white p-10 rounded-[2.5rem] shadow-premium hover:shadow-2xl transition-all duration-700 border border-neutral-100 hover:border-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[5rem] transition-all group-hover:w-32 group-hover:h-32"></div>
                            <div className="text-5xl mb-8 transform group-hover:scale-110 transition-transform duration-500">📱</div>
                            <h3 className="text-2xl font-bold text-primary mb-4 font-serif">Landing Page Chuyên Biệt</h3>
                            <p className="text-neutral-500 leading-relaxed font-light">
                                Giao diện tối ưu chuyển đổi, chuẩn SEO Industrial giúp khách hàng tìm thấy bạn ngay giây đầu tiên.
                            </p>
                        </div>
                        <div className="group bg-white p-10 rounded-[2.5rem] shadow-premium hover:shadow-2xl transition-all duration-700 border border-neutral-100 hover:border-accent/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[5rem] transition-all group-hover:w-32 group-hover:h-32"></div>
                            <div className="text-5xl mb-8 transform group-hover:scale-110 transition-transform duration-500">👥</div>
                            <h3 className="text-2xl font-bold text-primary mb-4 font-serif">Tiếp Cận Thông Minh</h3>
                            <p className="text-neutral-500 leading-relaxed font-light">
                                Thuật toán kết nối dựa trên vị trí và hành vi người dùng, đảm bảo tỷ lệ đặt lịch cao nhất khu vực.
                            </p>
                        </div>
                        <div className="group bg-white p-10 rounded-[2.5rem] shadow-premium hover:shadow-2xl transition-all duration-700 border border-neutral-100 hover:border-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[5rem] transition-all group-hover:w-32 group-hover:h-32"></div>
                            <div className="text-5xl mb-8 transform group-hover:scale-110 transition-transform duration-500">⚙️</div>
                            <h3 className="text-2xl font-bold text-primary mb-4 font-serif">Vận Hành Tối Ưu</h3>
                            <p className="text-neutral-500 leading-relaxed font-light">
                                Bộ công cụ quản trị đa kênh quy mô lớn, hỗ trợ báo cáo phân tích theo thời gian thực 24/7.
                            </p>
                        </div>
                    </div>

                    {/* Elite Features Showcase */}
                    <div className="bg-neutral-dark rounded-[3rem] shadow-2xl p-12 md:p-20 mb-24 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold font-serif text-white mb-16 text-center tracking-tight">
                                Giải Pháp <span className="text-primary italic">Toàn Diện</span> Cho Thủ Phủ Làm Đẹp
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                                {[
                                    { title: "Quản lý dịch vụ & Giá", desc: "Tự động hóa bảng giá đa tầng theo thời gian thực." },
                                    { title: "Hệ thống Booking VIP", desc: "Xử lý hàng ngàn lịch đặt mỗi ngày không gián đoạn." },
                                    { title: "Review Management", desc: "Quản trị danh tiếng AI-driven cho doanh nghiệp." },
                                    { title: "Corporate Blogging", desc: "Xây dựng uy tín qua nội dung chuyên sâu chất lượng cao." },
                                    { title: "Elite Analytics", desc: "Báo cáo doanh thu và xu hướng thị trường chính xác." },
                                    { title: "CRM Tích Hợp", desc: "Quản lý lòng trung thành khách hàng quy mô lớn." }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-6 group">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex flex-shrink-0 items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg mb-2 font-serif group-hover:text-primary transition-colors">{item.title}</h4>
                                            <p className="text-gray-400 font-light text-sm leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Premium CTA Section */}
                    <div className="text-center relative max-w-4xl mx-auto py-16 px-8 rounded-[3rem] border border-primary/20 bg-gradient-to-br from-white to-neutral-50 shadow-premium overflow-hidden">
                        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
                        <h2 className="text-4xl font-bold font-serif text-primary mb-6 animate-fade-in-up">
                            Kiến Tạo Tương Lai Ngay Hôm Nay
                        </h2>
                        <p className="text-lg text-neutral-500 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                            Tham gia cùng 1,000+ đối tác dẫn đầu xu hướng làm đẹp tại Việt Nam.
                            Đăng ký chỉ mất 3 phút để bắt đầu hành trình số hóa.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            {user ? (
                                <Link
                                    to="/register"
                                    className="bg-primary text-white px-12 py-5 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-[0_15px_30px_-5px_rgba(0,0,0,0.4)] tracking-wide"
                                >
                                    Bắt đầu hành trình VIP
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/register"
                                        className="bg-primary text-white px-12 py-5 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-[0_15px_30px_-5px_rgba(0,0,0,0.4)] tracking-wide"
                                    >
                                        Đăng Ký Đối Tác
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="bg-white text-primary border-2 border-primary/20 px-12 py-5 rounded-full font-bold text-lg hover:bg-primary/5 transition-all"
                                    >
                                        Đăng Nhập
                                    </Link>
                                </>
                            )}
                        </div>
                        <p className="mt-8 text-neutral-400 text-xs uppercase tracking-[0.2em] font-medium">Hỗ trợ kỹ thuật 24/7 từ đội ngũ chuyên gia</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ForBusinessPage;
