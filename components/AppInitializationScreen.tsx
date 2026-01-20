/**
 * Unified App Initialization Screen
 * 
 * Single loading screen shown during app initialization.
 * Prevents multiple loading screens from appearing simultaneously.
 */

import React from 'react';

interface AppInitializationScreenProps {
  message?: string;
}

const AppInitializationScreen: React.FC<AppInitializationScreenProps> = ({ 
  message = 'Đang tải ứng dụng...' 
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="text-center">
        {/* Logo or Brand */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
        </div>
        
        {/* Loading Spinner */}
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        
        {/* Loading Message */}
        <p className="text-lg font-semibold text-neutral-dark mb-2">{message}</p>
        <p className="text-sm text-gray-500">Vui lòng đợi trong giây lát</p>
      </div>
    </div>
  );
};

export default AppInitializationScreen;
