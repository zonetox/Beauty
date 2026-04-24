
import React, { useState, useEffect } from 'react';
import { useBusiness } from '../contexts/BusinessContext.tsx';
import LandingPageSectionEditor from './LandingPageSectionEditor.tsx';
import LandingPagePreview from './LandingPagePreview.tsx';
import TemplateSelector from './TemplateSelector.tsx';
import HeroSlideEditor from './HeroSlideEditor.tsx';
import { Business, HeroSlide, TrustIndicator, LandingPageConfig } from '../types.ts';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient.ts';

const Spinner = () => (
    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
);

type ViewMode = 'dashboard' | 'editor' | 'library' | 'drafts';

const LandingPageManager: React.FC = () => {
    const { currentBusiness, updateBusiness } = useBusiness();
    const [view, setView] = useState<ViewMode>('dashboard');
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Form state (buffered for editing)
    const [formData, setFormData] = useState<Partial<Business> | null>(null);

    useEffect(() => {
        if (currentBusiness) {
            setFormData({
                template_id: currentBusiness.template_id || 'luxury-minimal',
                landing_page_config: currentBusiness.landing_page_config || {
                    sections: {
                        hero: { enabled: true, order: 1 },
                        services: { enabled: true, order: 2 },
                        contact: { enabled: true, order: 3 }
                    }
                },
                hero_slides: currentBusiness.hero_slides || [],
                landing_page_drafts: currentBusiness.landing_page_drafts || [],
                trust_indicators: currentBusiness.trust_indicators || []
            });
        }
    }, [currentBusiness]);

    if (!currentBusiness || !formData) return <div className="p-20 text-center"><Spinner /></div>;

    const handleSave = async (silent = false) => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('businesses')
                .update({
                    template_id: formData.template_id,
                    landing_page_config: formData.landing_page_config,
                    hero_slides: formData.hero_slides,
                    landing_page_drafts: formData.landing_page_drafts,
                    trust_indicators: formData.trust_indicators
                })
                .eq('id', currentBusiness.id);

            if (error) throw error;
            if (!silent) toast.success('Đã lưu thay đổi thành công!');
            if (updateBusiness && formData) {
                await updateBusiness({ ...currentBusiness, ...formData } as Business);
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Lỗi khi lưu dữ liệu.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublishDraft = async (draft: any) => {
        if (confirm(`Bạn có chắc muốn "Công bố" bản nháp "${draft.name}" không? Trang hiện tại sẽ bị thay thế.`)) {
            setFormData(prev => prev ? { ...prev, template_id: draft.template_id, landing_page_config: draft.config } : null);
            // Save immediately
            setIsSaving(true);
            try {
                const { error } = await supabase
                    .from('businesses')
                    .update({
                        template_id: draft.template_id,
                        landing_page_config: draft.config
                    })
                    .eq('id', currentBusiness.id);
                if (error) throw error;
                toast.success('Đã công bố bản nháp thành công!');
                setView('dashboard');
                if (updateBusiness) {
                    await updateBusiness({ ...currentBusiness, template_id: draft.template_id, landing_page_config: draft.config } as Business);
                }
            } catch (err) {
                toast.error('Lỗi khi công bố.');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleSaveDraft = () => {
        const drafts = formData.landing_page_drafts || [];
        if (drafts.length >= 5) {
            toast.error('Kho bản nháp đã đầy (5/5).');
            return;
        }
        const draftName = prompt('Tên bản nháp:', `Bản nháp ${new Date().toLocaleDateString('vi-VN')}`);
        if (!draftName) return;

        const newDraft = {
            id: crypto.randomUUID(),
            name: draftName,
            template_id: formData.template_id || 'luxury-minimal',
            config: formData.landing_page_config!,
            updated_at: new Date().toISOString()
        };

        const updatedDrafts = [...drafts, newDraft];
        setFormData(prev => prev ? ({ ...prev, landing_page_drafts: updatedDrafts } as Partial<Business>) : null);

        // Save drafts to DB immediately
        supabase.from('businesses').update({ landing_page_drafts: updatedDrafts }).eq('id', currentBusiness.id)
            .then(() => toast.success('Đã lưu vào kho bản nháp!'));
    };

    return (
        <div className="animate-fade-in">
            {/* Header / Breadcrumb-like toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h2 className="text-4xl font-serif text-primary mb-2">Quản lý Landing Page</h2>
                    <p className="text-neutral-500 font-light italic">Xây dựng và tối ưu hóa diện mạo trực tuyến của bạn.</p>
                </div>

                <div className="flex gap-3">
                    {view !== 'dashboard' && (
                        <button
                            onClick={() => setView('dashboard')}
                            className="px-6 py-3 border border-neutral-200 text-neutral-500 rounded-full hover:bg-neutral-50 transition-all text-[10px] font-bold uppercase tracking-widest"
                        >
                            Quay lại Tổng quan
                        </button>
                    )}
                    <button
                        onClick={() => setIsPreviewOpen(true)}
                        className="px-6 py-3 bg-secondary text-white rounded-full hover:shadow-xl transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-secondary/20"
                    >
                        Xem trước (Live Preview)
                    </button>
                </div>
            </div>

            {/* View Switching Logic */}
            {view === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Live Status Card */}
                    <div className="md:col-span-8 space-y-8">
                        <div className="glass-card rounded-[2.5rem] p-8 border border-primary/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8">
                                <span className="bg-green-100 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">
                                    Đang hoạt động (Live)
                                </span>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-serif text-primary mb-4">Giao diện hiện tại</h3>
                                <div className="aspect-video w-full rounded-[1.5rem] bg-neutral-50 border border-neutral-100 overflow-hidden mb-8 relative shadow-inner">
                                    <div className="absolute inset-0 flex items-center justify-center opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000">
                                        <div className="text-center">
                                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.3em] mb-2 text-primary">Mẫu: {formData.template_id}</p>
                                            <p className="font-serif italic text-xl text-primary">Biểu tượng của sự tinh tế</p>
                                        </div>
                                    </div>
                                    {/* Abstract preview pattern */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/90 to-transparent" />
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => setView('editor')}
                                        className="flex-1 min-w-[200px] px-8 py-5 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Chỉnh sửa Nội dung & Giao diện
                                    </button>
                                    <button
                                        onClick={() => setView('library')}
                                        className="flex-1 min-w-[200px] px-8 py-5 border-2 border-primary/10 text-primary rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-primary/5 transition-all"
                                    >
                                        Thay đổi Mẫu thiết kế
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats or Tips Area */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-8 bg-accent/5 rounded-[2rem] border border-accent/10">
                                <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">Tốc độ tải trang</p>
                                <p className="text-3xl font-serif text-primary">98/100</p>
                                <p className="text-xs text-neutral-500 mt-2">Dữ liệu được tối ưu hóa cho di động.</p>
                            </div>
                            <div className="p-8 bg-neutral-50 rounded-[2rem] border border-neutral-100">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Mục tiêu SEO</p>
                                <p className="text-3xl font-serif text-primary">Đạt chuẩn</p>
                                <p className="text-xs text-neutral-500 mt-2">Đã tối ưu hóa Metatags và Schema.</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Drafts & Quick Links */}
                    <div className="md:col-span-4 space-y-8">
                        <div className="glass-card rounded-[2.5rem] p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-xl font-serif text-primary">Bản nháp</h4>
                                <button
                                    onClick={() => setView('drafts')}
                                    className="text-[10px] font-bold text-accent uppercase tracking-widest hover:underline"
                                >
                                    Xem tất cả
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(formData.landing_page_drafts || []).slice(0, 3).map(draft => (
                                    <div key={draft.id} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-primary/20 transition-all group">
                                        <p className="font-serif text-primary mb-1">{draft.name}</p>
                                        <p className="text-[8px] text-neutral-400 uppercase tracking-widest">{new Date(draft.updated_at).toLocaleDateString('vi-VN')}</p>
                                        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handlePublishDraft(draft)} className="text-[8px] font-bold text-primary uppercase">CÔNG BỐ</button>
                                        </div>
                                    </div>
                                ))}
                                {(formData.landing_page_drafts || []).length === 0 && (
                                    <p className="text-xs text-neutral-400 italic font-light">Chưa có bản nháp nào.</p>
                                )}
                            </div>
                        </div>

                        <div className="p-8 bg-primary rounded-[2.5rem] text-white shadow-xl shadow-primary/20">
                            <h4 className="text-xl font-serif mb-4">Mẹo thiết kế</h4>
                            <p className="text-xs font-light italic opacity-80 leading-relaxed">
                                "Sử dụng hình ảnh chất lượng cao và đồng bộ tông màu với mẫu thiết kế để tăng tỉ lệ chuyển đổi khách hàng lên đến 40%."
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {view === 'editor' && (
                <div className="space-y-12 animate-fade-in">
                    <div className="flex justify-between items-center bg-neutral-50 p-6 rounded-[2rem] border border-neutral-100 sticky top-4 z-50 shadow-sm backdrop-blur-md bg-white/80">
                        <div>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">Chế độ Biên tập</span>
                            <h3 className="text-xl font-serif text-primary mt-2">Thiết kế Nội dung & Giao diện</h3>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveDraft}
                                className="px-6 py-3 border border-primary text-primary rounded-full hover:bg-primary/5 transition-all text-[10px] font-bold uppercase tracking-widest"
                            >
                                Lưu Nháp
                            </button>
                            <button
                                onClick={() => handleSave()}
                                disabled={isSaving}
                                className="px-8 py-3 bg-primary text-white rounded-full hover:scale-105 transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                {isSaving ? <Spinner /> : 'Cập nhật Live'}
                            </button>
                        </div>
                    </div>

                    {/* Main Editor Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Right: Section Controls */}
                        <div className="lg:col-span-5 space-y-8 h-fit lg:sticky lg:top-32">
                            <div className="p-8 glass-card rounded-[2.5rem]">
                                <LandingPageSectionEditor
                                    config={formData.landing_page_config!}
                                    onChange={(config: LandingPageConfig) => setFormData(prev => prev ? ({ ...prev, landing_page_config: config } as Partial<Business>) : null)}
                                />
                            </div>
                        </div>

                        {/* Left: Content Editors */}
                        <div className="lg:col-span-7 space-y-12">
                            <div className="p-10 glass-card rounded-[2.5rem]">
                                <HeroSlideEditor
                                    slides={formData.hero_slides || []}
                                    onChange={(slides: HeroSlide[]) => setFormData(prev => prev ? ({ ...prev, hero_slides: slides } as Partial<Business>) : null)}
                                    businessId={currentBusiness.id}
                                />
                            </div>

                            <div className="p-10 glass-card rounded-[2.5rem]">
                                <div className="flex justify-between items-center mb-8">
                                    <h4 className="text-xl font-serif text-primary">Chứng chỉ & Uy tín</h4>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newIndicator: TrustIndicator = { type: 'badge', title: 'Huy hiệu mới' };
                                            setFormData(prev => prev ? { ...prev, trust_indicators: [...(prev.trust_indicators || []), newIndicator] } : null);
                                        }}
                                        className="text-[10px] font-bold text-accent uppercase tracking-widest"
                                    >
                                        + Thêm chứng chỉ
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(formData.trust_indicators || []).map((indicator, idx) => (
                                        <div key={idx} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between group">
                                            <span className="text-xs font-serif text-primary truncate max-w-[150px]">{indicator.title}</span>
                                            <button
                                                onClick={() => {
                                                    const updated = [...(formData.trust_indicators || [])].filter((_, i) => i !== idx);
                                                    setFormData(prev => prev ? ({ ...prev, trust_indicators: updated } as Partial<Business>) : null);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'library' && (
                <div className="animate-fade-in space-y-12">
                    <TemplateSelector
                        currentTemplateId={formData.template_id}
                        onChange={(id) => {
                            setFormData(prev => prev ? { ...prev, template_id: id } : null);
                            toast.success('Mẫu đã được áp dụng tạm thời. Hãy Chỉnh sửa hoặc Cập nhật Live để chính thức áp dụng.');
                            setView('editor');
                        }}
                    />
                </div>
            )}

            {view === 'drafts' && (
                <div className="animate-fade-in space-y-12">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h3 className="text-4xl font-serif text-primary mb-4">Kho bản nháp Thiết kế</h3>
                        <p className="text-neutral-500 font-light italic">Quản lý các phương án thiết kế khác nhau trước khi quyết định đưa vào vận hành thực tế.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(formData.landing_page_drafts || []).map(draft => (
                            <div key={draft.id} className="p-8 bg-white border border-neutral-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between">
                                <div className="mb-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const updated = (formData.landing_page_drafts || []).filter(d => d.id !== draft.id);
                                                setFormData(prev => prev ? { ...prev, landing_page_drafts: updated } : null);
                                                supabase.from('businesses').update({ landing_page_drafts: updated }).eq('id', currentBusiness.id);
                                            }}
                                            className="text-neutral-300 hover:text-red-500 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                    <h4 className="text-2xl font-serif text-primary mb-2">{draft.name}</h4>
                                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Mẫu: {draft.template_id}</p>
                                    <p className="text-[10px] text-neutral-400 italic opacity-60">Lần cuối: {new Date(draft.updated_at).toLocaleString('vi-VN')}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/business/${currentBusiness?.slug || ''}?draft=${draft.id}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="flex-1 px-6 py-4 bg-neutral-50 text-neutral-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-neutral-100 transition-all"
                                    >
                                        Xem trước
                                    </button>
                                    <button
                                        onClick={() => handlePublishDraft(draft)}
                                        className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                    >
                                        CÔNG BỐ (PUBLISH)
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(formData.landing_page_drafts || []).length === 0 && (
                            <div className="md:col-span-2 p-20 text-center bg-neutral-50 rounded-[2.5rem] border-2 border-dashed border-neutral-200">
                                <p className="text-neutral-400 italic">Chưa có bản nháp nào được lưu trữ.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Global Overlay Preview */}
            {isPreviewOpen && (
                <LandingPagePreview
                    business={{ ...currentBusiness, landing_page_config: formData.landing_page_config!, template_id: formData.template_id!, hero_slides: formData.hero_slides! }}
                    config={formData.landing_page_config!}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}
        </div>
    );
};

export default LandingPageManager;
