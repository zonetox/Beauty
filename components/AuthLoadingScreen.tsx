/**
 * Auth Loading Screen
 * 
 * Shown while checking authentication state on app initialization
 */

import React from 'react';

const AuthLoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-neutral-dark">Đang kiểm tra xác thực...</p>
      <p className="mt-2 text-sm text-gray-500">Vui lòng đợi trong giây lát</p>
    </div>
  );
};

export default AuthLoadingScreen;
