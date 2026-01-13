// Landing Page Section Editor Component
// Phase 1.2: Enable/disable sections and reorder sections

import React from 'react';
import { LandingPageConfig } from '../types.ts';

interface LandingPageSectionEditorProps {
  config: LandingPageConfig;
  onChange: (config: LandingPageConfig) => void;
  disabled?: boolean;
}

interface SectionInfo {
  key: keyof LandingPageConfig['sections'];
  label: string;
  description: string;
}

const SECTION_INFO: SectionInfo[] = [
  { key: 'hero', label: 'Hero Section', description: 'Large visual banner with title and CTA' },
  { key: 'trust', label: 'Trust Indicators', description: 'Badges, certifications, awards' },
  { key: 'services', label: 'Services', description: 'List of services offered' },
  { key: 'gallery', label: 'Gallery', description: 'Photo and video gallery' },
  { key: 'team', label: 'Team', description: 'Team members showcase' },
  { key: 'reviews', label: 'Reviews', description: 'Customer reviews and ratings' },
  { key: 'cta', label: 'Call-to-Action', description: 'Booking and contact CTA section' },
  { key: 'contact', label: 'Contact & Map', description: 'Contact form and location map' },
];

const LandingPageSectionEditor: React.FC<LandingPageSectionEditorProps> = ({ 
  config, 
  onChange, 
  disabled = false 
}) => {
  // Get sections sorted by order
  const sortedSections = Object.entries(config.sections)
    .map(([key, section]) => ({
      key: key as keyof LandingPageConfig['sections'],
      ...section,
      ...SECTION_INFO.find(s => s.key === key),
    }))
    .sort((a, b) => a.order - b.order);

  const handleToggle = (sectionKey: keyof LandingPageConfig['sections']) => {
    if (disabled) return;
    
    const newConfig: LandingPageConfig = {
      sections: {
        ...config.sections,
        [sectionKey]: {
          ...config.sections[sectionKey],
          enabled: !config.sections[sectionKey].enabled,
        },
      },
    };
    onChange(newConfig);
  };

  const handleMoveUp = (index: number) => {
    if (disabled || index === 0) return;
    
    const currentSection = sortedSections[index];
    const previousSection = sortedSections[index - 1];
    
    const newConfig: LandingPageConfig = {
      sections: {
        ...config.sections,
        [currentSection.key]: {
          ...config.sections[currentSection.key],
          order: previousSection.order,
        },
        [previousSection.key]: {
          ...config.sections[previousSection.key],
          order: currentSection.order,
        },
      },
    };
    onChange(newConfig);
  };

  const handleMoveDown = (index: number) => {
    if (disabled || index === sortedSections.length - 1) return;
    
    const currentSection = sortedSections[index];
    const nextSection = sortedSections[index + 1];
    
    const newConfig: LandingPageConfig = {
      sections: {
        ...config.sections,
        [currentSection.key]: {
          ...config.sections[currentSection.key],
          order: nextSection.order,
        },
        [nextSection.key]: {
          ...config.sections[nextSection.key],
          order: currentSection.order,
        },
      },
    };
    onChange(newConfig);
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-dark mb-2">Landing Page Sections</h3>
        <p className="text-sm text-gray-600">
          Enable or disable sections and reorder them to customize your landing page layout.
        </p>
      </div>

      <div className="space-y-2">
        {sortedSections.map((section, index) => (
          <div
            key={section.key}
            className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
              section.enabled
                ? 'bg-white border-gray-300'
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
          >
            {/* Drag handle / Order indicator */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={disabled || index === 0}
                className={`p-1 rounded ${
                  disabled || index === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={disabled || index === sortedSections.length - 1}
                className={`p-1 rounded ${
                  disabled || index === sortedSections.length - 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Section info */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="font-medium text-gray-900">{section.label}</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Order: {section.order}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            </div>

            {/* Toggle switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={section.enabled}
                onChange={() => handleToggle(section.key)}
                disabled={disabled}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer ${
                section.enabled ? 'bg-primary' : 'bg-gray-300'
              } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              } transition-colors`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  section.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Disabled sections will not appear on your public landing page. 
          Use the up/down arrows to change the order of sections.
        </p>
      </div>
    </div>
  );
};

export default LandingPageSectionEditor;
