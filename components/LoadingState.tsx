// D2.3 FIX: Standardized Loading State Component
// Based on C1.4 recommendations from frontend_architecture.md

import React from 'react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  fullScreen = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-16 h-16 border-4',
    lg: 'w-24 h-24 border-4',
  };

  const containerClasses = fullScreen
    ? 'flex items-center justify-center min-h-screen bg-white'
    : 'flex items-center justify-center py-12 bg-white';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;





