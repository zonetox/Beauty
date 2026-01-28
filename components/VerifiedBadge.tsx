import React from 'react';

interface VerifiedBadgeProps {
  size?: 'small' | 'large';
  className?: string;
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 'small', className = '' }) => {
  const sizeClasses = size === 'small' ? 'w-5 h-5' : 'w-6 h-6';

  return (
    <div className={`group relative flex-shrink-0 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses} text-primary`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      {/* Custom Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-neutral-dark text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        This is a verified business listing.
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-dark"></div>
      </div>
    </div>
  );
};

export default VerifiedBadge;
