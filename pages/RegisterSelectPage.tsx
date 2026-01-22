// Account Type Selection Page
// User chooses between "User" or "Business" account type

import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead.tsx';

const RegisterSelectPage: React.FC = () => {
    const seoTitle = 'Đăng ký tài khoản | 1Beauty.asia';
    const seoDescription = 'Chọn loại tài khoản phù hợp với bạn: Người dùng để tìm kiếm và đặt lịch dịch vụ làm đẹp, hoặc Doanh nghiệp để quảng bá và quản lý dịch vụ của bạn.';
    const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/register` : '';

    return (
        <>
            <SEOHead
                title={seoTitle}
                description={seoDescription}
                keywords="đăng ký, register, tạo tài khoản, beauty account"
                url={seoUrl}
                type="website"
            />
            <div className="bg-background min-h-[calc(100vh-128px)]">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl font-bold font-serif text-neutral-dark mb-4">
                                Chào mừng đến với 1Beauty.asia
                            </h1>
                            <p className="text-lg text-gray-600">
                                Chọn loại tài khoản phù hợp với bạn để bắt đầu
                            </p>
                        </div>

                        {/* Account Type Cards */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* User Account Card */}
                            <Link
                                to="/register/user"
                                className="group block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-primary"
                            >
                                <div className="p-8">
                                    {/* Icon */}
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-2xl font-bold text-neutral-dark mb-3 group-hover:text-primary transition-colors">
                                        Người dùng
                                    </h2>

                                    {/* Description */}
                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        Dành cho khách hàng muốn tìm kiếm, đặt lịch và đánh giá các dịch vụ làm đẹp
                                    </p>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-6">
                                        <li className="flex items-start">
                                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm text-gray-700">Tìm kiếm doanh nghiệp làm đẹp</span>
                                        </li>
                                        <li className="flex items-start">
                                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm text-gray-700">Đặt lịch hẹn trực tuyến</span>
                                        </li>
                                        <li className="flex items-start">
                                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm text-gray-700">Đánh giá và lưu yêu thích</span>
                                        </li>
                                    </ul>

                                    {/* CTA */}
                                    <div className="flex items-center text-primary font-semibold group-hover:translate-x-2 transition-transform">
                                        Đăng ký ngay
                                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>

                            {/* Business Account Card */}
                            <Link
                                to="/register/business"
                                className="group block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-primary"
                            >
                                <div className="p-8">
                                    {/* Icon */}
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-2xl font-bold text-neutral-dark mb-3 group-hover:text-primary transition-colors">
                                        Doanh nghiệp
                                    </h2>

                                    {/* Description */}
                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        Dành cho chủ salon, spa, phòng khám muốn quảng bá dịch vụ và quản lý đặt lịch
                                    </p>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-6">
                                        <li className="flex items-start">
                                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm text-gray-700">Trang giới thiệu doanh nghiệp</span>
                                        </li>
                                        <li className="flex items-start">
                                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm text-gray-700">Quản lý dịch vụ và đặt lịch</span>
                                        </li>
                                        <li className="flex items-start">
                                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm text-gray-700">Dùng thử Premium 30 ngày miễn phí</span>
                                        </li>
                                    </ul>

                                    {/* CTA */}
                                    <div className="flex items-center text-primary font-semibold group-hover:translate-x-2 transition-transform">
                                        Đăng ký ngay
                                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Login Link */}
                        <div className="text-center mt-12">
                            <p className="text-gray-600">
                                Đã có tài khoản?{' '}
                                <Link to="/login" className="text-primary font-semibold hover:text-primary-dark transition-colors">
                                    Đăng nhập tại đây
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegisterSelectPage;
