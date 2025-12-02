import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
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
  );
};

export default NotFoundPage;