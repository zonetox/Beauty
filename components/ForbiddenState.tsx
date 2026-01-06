// D2.3 FIX: Standardized Forbidden State Component
// Based on C1.4 recommendations from frontend_architecture.md

import React from 'react';
import { Link } from 'react-router-dom';

interface ForbiddenStateProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
}

const ForbiddenState: React.FC<ForbiddenStateProps> = ({ 
  title = 'Access Denied',
  message = 'You do not have permission to access this resource.',
  showBackButton = true,
  backUrl = '/',
  backLabel = 'Go to Home'
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        {showBackButton && (
          <Link
            to={backUrl}
            className="inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
};

export default ForbiddenState;




