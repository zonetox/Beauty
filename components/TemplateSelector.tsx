// TemplateSelector.tsx
// Allows business to choose a visual template/theme for their landing page

import React from 'react';
import { TEMPLATE_PRESETS } from '../src/features/templates/presets.ts';

interface TemplateSelectorProps {
    currentTemplateId?: string;
    onChange: (templateId: string) => void;
    disabled?: boolean;
}

const TEMPLATE_ICONS: Record<string, string> = {
    'luxury-minimal': '👑',
    'korean-clinic': '🏥',
    'nature-spa': '🌿',
    'dark-premium': '🌑',
    'modern-beauty': '💄',
    'luna-spa': '🪷',
    'pink-nail': '💅',
};

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    currentTemplateId = 'luxury-minimal',
    onChange,
    disabled = false,
}) => {
    const presets = Object.values(TEMPLATE_PRESETS);

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-dark mb-1">Phong cách Landing Page</h3>
                <p className="text-sm text-gray-500">
                    Chọn một trong {presets.length} phong cách thiết kế. Bạn có thể thay đổi bất cứ lúc nào.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {presets.map((preset) => {
                    const isSelected = currentTemplateId === preset.id;
                    const { colors } = preset.theme;

                    return (
                        <button
                            key={preset.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(preset.id)}
                            className={`relative text-left border-2 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${isSelected
                                    ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                                    : 'border-gray-200 hover:border-gray-300'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            {/* Preview color bar */}
                            <div className="h-20 relative" style={{ backgroundColor: colors.background }}>
                                {/* Color swatches */}
                                <div className="absolute bottom-0 left-0 right-0 h-8 flex">
                                    <div className="flex-1" style={{ backgroundColor: colors.primary }} />
                                    <div className="flex-1" style={{ backgroundColor: colors.accent }} />
                                    <div className="flex-1" style={{ backgroundColor: colors.secondary }} />
                                    <div className="flex-1" style={{ backgroundColor: colors.primary_dark }} />
                                </div>
                                {/* Icon */}
                                <div className="absolute top-2 right-3 text-2xl">
                                    {TEMPLATE_ICONS[preset.id] || '🎨'}
                                </div>
                                {/* Font preview */}
                                <div className="absolute top-2 left-3">
                                    <span
                                        className="text-xs font-bold uppercase tracking-widest"
                                        style={{ color: colors.primary, fontFamily: preset.theme.fonts.serif }}
                                    >
                                        Aa
                                    </span>
                                </div>
                                {/* Selected overlay */}
                                {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                                        <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                            ✓ Đang dùng
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Name */}
                            <div className="px-3 py-2 bg-white">
                                <p className="text-sm font-semibold text-gray-800">{preset.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {preset.theme.fonts.serif} · {preset.styles.cardStyle}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                    <strong>Lưu ý:</strong> Thay đổi phong cách sẽ áp dụng ngay trên trang landing page công khai sau khi lưu.
                </p>
            </div>
        </div>
    );
};

export default TemplateSelector;
