import React from 'react';
import { Business } from '../../../types.ts';
import { TEMPLATE_PRESETS, DEFAULT_TEMPLATE } from './presets.ts';
import LuxuryTemplateLayout from './layouts/LuxuryTemplateLayout.tsx';

interface TemplateEngineProps {
    business: Business;
}

const TemplateEngine: React.FC<TemplateEngineProps> = ({ business }) => {
    // 1. Resolve Template Preset
    const templateId = business.template_id || DEFAULT_TEMPLATE;
    const preset = TEMPLATE_PRESETS[templateId] || TEMPLATE_PRESETS[DEFAULT_TEMPLATE];

    // 2. Wrap with Layout
    return (
        <LuxuryTemplateLayout
            business={business}
            preset={preset}
        />
    );
};

export default TemplateEngine;
