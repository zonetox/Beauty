import { Business, LandingPageConfig } from '../types.ts';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient.ts';
import { DEFAULT_UNIFIED_CONFIG } from '../src/features/landing-pages/constants.ts';
import { useCMS } from '../contexts/CMSContext.tsx';
import LandingPageSectionEditor from './LandingPageSectionEditor.tsx';
import TemplateSelector from './TemplateSelector.tsx';
import { Spinner } from './Spinner.tsx';
import { useBusiness } from '../contexts/BusinessContext.tsx';
import { useState, useEffect } from 'react';

const LandingPageManager: React.FC = () => {
    const { currentBusiness, updateBusiness } = useBusiness();
    const { isEditing, setIsEditing, stagedChanges, clearChanges, saveChanges } = useCMS();
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_UNIFIED_CONFIG);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isStructureOpen, setIsStructureOpen] = useState(false);

    useEffect(() => {
        if (currentBusiness?.landing_page_config) {
            setConfig(currentBusiness.landing_page_config as LandingPageConfig);
        } else {
            // First time setup with full demo content
            setConfig(DEFAULT_UNIFIED_CONFIG);
        }
    }, [currentBusiness]);

    if (!currentBusiness) return <div className="p-20 text-center"><Spinner /></div>;

    const handleSave = async (isPublic: boolean) => {
        setIsSaving(true);
        try {
            // Apply staged changes to config if saving
            let finalConfig = { ...config };

            // Map staged changes back to section content
            Object.entries(stagedChanges).forEach(([id, value]) => {
                const parts = id.split('_');
                if (parts.length >= 2) {
                    const sectionKey = parts[0];
                    const fieldKey = parts.slice(1).join('_');

                    if (finalConfig.sections[sectionKey]) {
                        if (!finalConfig.sections[sectionKey].content) {
                            finalConfig.sections[sectionKey].content = {};
                        }
                        (finalConfig.sections[sectionKey].content as any)[fieldKey] = value;
                    }
                }
            });

            const { error } = await supabase
                .from('businesses')
                .update({
                    landing_page_config: finalConfig,
                    // If public, we might want to update a separate column or flag
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentBusiness.id);

            if (error) throw error;

            if (updateBusiness) {
                await updateBusiness({ ...currentBusiness, landing_page_config: finalConfig } as Business);
            }

            clearChanges();
            toast.success(isPublic ? 'Đã công bố Landing Page thành công!' : 'Đã lưu bản nháp thành công!');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Lỗi khi lưu dữ liệu.');
        } finally {
            setIsSaving(false);
        }
    };

    const isTrialActive = () => {
        if (!currentBusiness.created_at) return true;
        const created = new Date(currentBusiness.created_at);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* CMS Control Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-primary/10 shadow-sm sticky top-0 z-40">
                <div>
                    <h2 className="text-2xl font-serif text-primary">Biên tập Landing Page</h2>
                    <p className="text-xs text-neutral-500 italic">Nhấp trực tiếp vào nội dung bên dưới để chỉnh sửa.</p>
                </div>

                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <div className="flex bg-neutral-100 p-1 rounded-full border border-neutral-200">
                        <button
                            onClick={() => setIsEditing(true)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${isEditing ? 'bg-primary text-white shadow-md' : 'text-neutral-500 hover:text-primary'}`}
                        >
                            Chỉnh sửa
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${!isEditing ? 'bg-primary text-white shadow-md' : 'text-neutral-500 hover:text-primary'}`}
                        >
                            Xem trước
                        </button>
                    </div>

                    <button
                        onClick={() => setIsLibraryOpen(true)}
                        className="px-5 py-2.5 bg-secondary/10 text-secondary rounded-full border border-secondary/20 hover:bg-secondary/20 transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                        Mẫu Thiết Kế
                    </button>

                    <button
                        onClick={() => setIsStructureOpen(true)}
                        className="px-5 py-2.5 bg-primary/5 text-primary rounded-full border border-primary/10 hover:bg-primary/10 transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                        Cấu trúc trang
                    </button>

                    <div className="h-8 w-px bg-neutral-200 mx-2"></div>

                    <button
                        onClick={() => handleSave(false)}
                        disabled={isSaving}
                        className="px-5 py-2.5 border border-primary text-primary rounded-full hover:bg-primary/5 transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                        Lưu Nháp
                    </button>

                    <button
                        onClick={() => handleSave(true)}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-primary text-white rounded-full hover:scale-105 transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        {isSaving ? <Spinner /> : 'CÔNG BỐ (PUBLIC)'}
                    </button>
                </div>
            </div>

            {/* Visual Editor Area */}
            <div className={`relative flex-grow rounded-[2.5rem] overflow-hidden border-4 ${isEditing ? 'border-primary/20' : 'border-transparent'} transition-all min-h-[800px] shadow-2xl`}>
                {!isTrialActive() && (
                    <div className="absolute inset-0 z-50 backdrop-blur-md bg-white/30 flex items-center justify-center p-8">
                        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-primary/20 text-center max-w-md">
                            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h3 className="text-2xl font-serif text-primary mb-4">Gói dùng thử đã hết hạn</h3>
                            <p className="text-gray-500 text-sm mb-8">Bạn vẫn có thể xem lại thiết kế, nhưng Landing Page đã bị tạm ẩn khỏi công chúng. Hãy nâng cấp để tiếp tục tỏa sáng!</p>
                            <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                                Nâng cấp ngay
                            </button>
                        </div>
                    </div>
                )}

                <LandingPagePreview
                    business={currentBusiness}
                    config={config}
                    onClose={() => { }}
                    isEditing={isEditing}
                    onUpdateContent={(sectionKey, content) => {
                        // This will be called if the "EDIT SECTION" button is clicked in Preview
                        // But we primarily use stagedChanges from Editable components
                    }}
                />
            </div>

            {/* Template Selector Modal */}
            {isLibraryOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl relative">
                        <button
                            onClick={() => setIsLibraryOpen(false)}
                            className="absolute top-8 right-8 z-10 w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-all text-2xl font-light"
                        >
                            &times;
                        </button>
                        <div className="p-12 overflow-y-auto max-h-full">
                            <TemplateSelector
                                currentTemplateId={currentBusiness.template_id}
                                onChange={(id) => {
                                    // Update template mechanism
                                    supabase.from('businesses').update({ template_id: id }).eq('id', currentBusiness.id);
                                    setIsLibraryOpen(false);
                                    toast.success('Mẫu đã được áp dụng!');
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Page Structure Modal */}
            {isStructureOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl relative">
                        <button
                            onClick={() => setIsStructureOpen(false)}
                            className="absolute top-8 right-8 z-10 w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-all text-2xl font-light"
                        >
                            &times;
                        </button>
                        <div className="p-12 overflow-y-auto max-h-full">
                            <LandingPageSectionEditor
                                config={config}
                                onChange={(newConfig) => {
                                    setConfig(newConfig);
                                    // No toast here as it's a live update in state
                                }}
                            />
                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={() => setIsStructureOpen(false)}
                                    className="px-8 py-3 bg-primary text-white rounded-full font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
                                >
                                    Hoàn tất
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPageManager;
