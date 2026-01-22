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

const AppInitializationScreen: React.FC<AppInitializationScreenProps> = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="text-center">
        {/* Loading Spinner */}
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};

export default AppInitializationScreen;
