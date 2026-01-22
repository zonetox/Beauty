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
    </div>
  );
};

export default AuthLoadingScreen;
