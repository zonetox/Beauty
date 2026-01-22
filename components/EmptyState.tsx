// D2.3 FIX: Standardized Empty State Component
// Based on C1.4 recommendations from frontend_architecture.md

import React from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  message = 'There is no data to display at the moment.',
  icon,
  action
}) => {
  return (
    <div className="empty-state flex flex-col items-center justify-center py-12 px-4 bg-white">
      {icon && <div className="mb-4 text-gray-400 text-6xl">{icon}</div>}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;





