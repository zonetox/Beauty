// Progress Indicator Component
// Shows step-by-step progress for multi-step processes

import React from 'react';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: number;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  className = ''
}) => {
  const getStepIcon = (status: ProgressStep['status'], index: number) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'active':
        return (
          <div className="w-8 h-8 rounded-full bg-primary border-2 border-primary flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default: // pending
        return (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
            {index + 1}
          </div>
        );
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1">
              {getStepIcon(step.status, index)}
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${step.status === 'active'
                  ? 'text-primary'
                  : step.status === 'completed'
                    ? 'text-green-600'
                    : step.status === 'error'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}>
                  {step.label}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${step.status === 'completed'
                ? 'bg-green-500'
                : step.status === 'error'
                  ? 'bg-red-500'
                  : 'bg-gray-300'
                }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;
