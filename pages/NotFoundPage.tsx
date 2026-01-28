// C2.6 - 404 Not Found Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead.tsx';

const NotFoundPage: React.FC = () => {
  // SEO metadata for 404 page
  const seoTitle = '404 - Trang không tồn tại | 1Beauty.asia';
  const seoDescription = 'Trang bạn tìm kiếm không tồn tại. Quay lại trang chủ để tiếp tục khám phá các dịch vụ làm đẹp.';
  const seoUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords="404, trang không tồn tại, not found"
        url={seoUrl}
        type="website"
      />
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-128px)] bg-background">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <p className="text-2xl md:text-3xl font-light text-neutral-dark mt-4">
            Oops! Trang bạn tìm kiếm không tồn tại.
          </p>
          <p className="mt-2 text-gray-500">
            Có vẻ như bạn đã đi lạc. Đừng lo, chúng tôi sẽ giúp bạn quay lại.
          </p>
          <Link 
            to="/" 
            className="mt-6 inline-block px-6 py-3 text-lg font-medium text-white bg-primary rounded-md hover:bg-primary-dark transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
