// TemplateSelector.tsx
// Allows business to choose a visual template/theme for their landing page

import React from 'react';
import { TEMPLATE_PRESETS } from '../src/features/templates/presets.ts';

interface TemplateSelectorProps {
    currentTemplateId?: string;
    onChange: (templateId: string) => void;
    disabled?: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    currentTemplateId = 'luxury-minimal',
    onChange,
    disabled = false,
}) => {
    const presets = Object.values(TEMPLATE_PRESETS).slice(0, 8); // Focus on the top 8 premium ones

    return (
        <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h3 className="text-3xl font-serif text-primary mb-3">Kho giao diện Kiến trúc Tinh hoa</h3>
                <p className="text-neutral-500 font-light italic">
                    Chọn một phong cách thiết kế để khởi đầu hành trình định vị thương hiệu đẳng cấp của bạn.
                    Mọi thành phần đều có thể tùy chỉnh sau khi chọn.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {presets.map((preset) => {
                    const isSelected = currentTemplateId === preset.id;
                    const { colors } = preset.theme;

                    return (
                        <div
                            key={preset.id}
                            className={`group relative bg-white rounded-[2rem] overflow-hidden border transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 ${isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-neutral-100'
                                }`}
                        >
                            {/* Visual Preview Area */}
                            <div className="aspect-[16/10] relative overflow-hidden bg-neutral-50">
                                {/* Simulated Page Layout */}
                                <div className="absolute inset-0 p-6 flex flex-col gap-4">
                                    <div className="h-4 w-24 rounded-full" style={{ backgroundColor: colors.primary }} />
                                    <div className="space-y-2 mt-4">
                                        <div className="h-8 w-3/4 rounded-lg" style={{ backgroundColor: colors.neutral_dark, opacity: 0.8 }} />
                                        <div className="h-3 w-1/2 rounded-full" style={{ backgroundColor: colors.neutral_dark, opacity: 0.3 }} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-auto">
                                        <div className="aspect-video rounded-xl bg-neutral-200" />
                                        <div className="aspect-video rounded-xl bg-neutral-200" />
                                    </div>
                                </div>

                                {/* Color Swatches Overlay */}
                                <div className="absolute bottom-4 right-4 flex gap-1 bg-white/80 backdrop-blur-md p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: colors.primary }} />
                                    <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: colors.accent }} />
                                    <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: colors.secondary }} />
                                </div>

                                {/* Font Preview */}
                                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full shadow-lg">
                                    <span style={{ fontFamily: preset.theme.fonts.serif, color: colors.primary }} className="text-xl italic font-serif">Aa</span>
                                </div>

                                {/* Selection Overlay */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center">
                                        <div className="bg-primary text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest text-[10px] shadow-xl animate-scale-in">
                                            Đang sử dụng
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Content Area */}
                            <div className="p-8 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xl font-serif text-primary mb-1">{preset.name}</h4>
                                    <p className="text-xs text-neutral-400 font-light uppercase tracking-widest italic">
                                        {preset.theme.fonts.serif} Design System
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onChange(preset.id)}
                                    className={`px-8 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] transition-all duration-500 ${isSelected
                                        ? 'bg-primary text-white cursor-default'
                                        : 'bg-neutral-50 text-neutral-600 hover:bg-primary hover:text-white border border-neutral-100'
                                        }`}
                                >
                                    {isSelected ? 'Đã Chọn' : 'Sử Dụng'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-16 p-8 glass-card border-none rounded-[2rem] bg-accent/5 text-center">
                <p className="text-neutral-500 italic font-light">
                    Bạn muốn tùy chỉnh sâu hơn? Sau khi chọn mẫu, hãy vào phần <strong className="text-primary">Chỉnh sửa nội dung</strong> để thay đổi từng chi tiết nhỏ.
                </p>
            </div>
        </div>
    );
};

export default TemplateSelector;
