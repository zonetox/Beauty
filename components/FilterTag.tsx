import React from 'react';

interface FilterTagProps {
  label: string;
  value: string;
  onRemove: () => void;
}

const FilterTag: React.FC<FilterTagProps> = ({ label, value, onRemove }) => (
  <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
    <strong>{label}:</strong> {value}
    <button onClick={onRemove} className="text-primary hover:text-primary-dark font-bold text-lg leading-none" aria-label={`Remove ${label} filter`}>
      &times;
    </button>
  </span>
);

export default React.memo(FilterTag);