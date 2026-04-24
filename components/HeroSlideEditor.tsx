
import React from 'react';
import { HeroSlide } from '../types.ts';
import { uploadFile } from '../lib/storage.ts';
import toast from 'react-hot-toast';

interface HeroSlideEditorProps {
    slides: HeroSlide[];
    onChange: (slides: HeroSlide[]) => void;
    businessId: number;
}

const HeroSlideEditor: React.FC<HeroSlideEditorProps> = ({ slides, onChange, businessId }) => {
    const handleSlideChange = (index: number, field: keyof HeroSlide, value: string) => {
        const newSlides = [...slides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        onChange(newSlides);
    };

    const handleAddSlide = () => {
        if (slides.length >= 5) {
            toast.error('Tối đa 5 slides.');
            return;
        }
        onChange([...slides, { title: '', subtitle: '', image_url: '' }]);
    };

    const handleRemoveSlide = (index: number) => {
        if (slides.length <= 1) {
            toast.error('Phải có ít nhất 1 slide.');
            return;
        }
        onChange(slides.filter((_, i) => i !== index));
    };

    const handleImageUpload = async (index: number, file: File) => {
        try {
            const folder = `business/${businessId}/hero`;
            const publicUrl = await uploadFile('business-gallery', file, folder);
            handleSlideChange(index, 'image_url', publicUrl);
            toast.success('Đã tải ảnh lên thành công!');
        } catch (error) {
            toast.error('Lỗi khi tải ảnh lên.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h4 className="text-xl font-serif text-primary">Biên tập Hero Slider</h4>
                <button
                    type="button"
                    onClick={handleAddSlide}
                    className="text-xs font-bold uppercase tracking-widest text-secondary hover:underline"
                >
                    + Thêm Slide mới
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {slides.map((slide, index) => (
                    <div key={index} className="p-6 bg-white rounded-2xl border border-neutral-100 shadow-sm relative group">
                        <button
                            type="button"
                            onClick={() => handleRemoveSlide(index)}
                            className="absolute top-4 right-4 text-neutral-300 hover:text-red-500 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-1/3">
                                <div className="aspect-video rounded-xl bg-neutral-50 overflow-hidden border border-neutral-100 mb-2 relative group/img">
                                    <img
                                        src={slide.image_url || 'https://placehold.co/600x400?text=No+Image'}
                                        alt={`Slide ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                                        <span className="text-white text-xs font-bold uppercase tracking-widest">Đổi ảnh</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleImageUpload(index, e.target.files[0])}
                                        />
                                    </label>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Image URL"
                                    value={slide.image_url}
                                    onChange={(e) => handleSlideChange(index, 'image_url', e.target.value)}
                                    className="w-full text-[10px] px-2 py-1 border rounded"
                                />
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Tiêu đề Slide</label>
                                    <input
                                        type="text"
                                        value={slide.title}
                                        onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 ring-primary/10"
                                        placeholder="Vd: Chăm sóc sắc đẹp toàn diện"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Mô tả ngắn</label>
                                    <textarea
                                        value={slide.subtitle}
                                        onChange={(e) => handleSlideChange(index, 'subtitle', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 ring-primary/10"
                                        rows={2}
                                        placeholder="Vd: Trải nghiệm dịch vụ 5 sao tại trung tâm TP.HCM"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HeroSlideEditor;
