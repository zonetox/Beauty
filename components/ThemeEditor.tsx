import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { ThemeSettings } from '../types.ts';
import ConfirmDialog from './ConfirmDialog.tsx';
import { uploadFile, deleteFileByUrl } from '../lib/storage.ts';

const ColorInput: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; name: string; }> = ({ label, value, onChange, name }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 flex items-center gap-2">
            <input type="color" value={value} onChange={onChange} name={name} className="w-10 h-10 p-1 border-gray-300 rounded-md" />
            <input type="text" value={value} onChange={onChange} name={name} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
    </div>
);

const ThemeEditor: React.FC = () => {
    const { theme, updateTheme, availableFonts } = useTheme();
    const [formData, setFormData] = useState<ThemeSettings>(JSON.parse(JSON.stringify(theme)));
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(formData.logo_url || null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(formData.favicon_url || null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, colors: { ...prev.colors, [name]: value } }));
    };

    const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, fonts: { ...prev.fonts, [name]: value } }));
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'logo_url') setLogoPreview(value || null);
        if (name === 'favicon_url') setFaviconPreview(value || null);
    };

    const handleImageUpload = async (file: File, type: 'logo' | 'favicon') => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh');
            return;
        }

        // Validate file size (max 2MB for logo, 500KB for favicon)
        const maxSize = type === 'logo' ? 2 * 1024 * 1024 : 500 * 1024;
        if (file.size > maxSize) {
            toast.error(`Kích thước file quá lớn. Logo tối đa 2MB, Favicon tối đa 500KB`);
            return;
        }

        const setUploading = type === 'logo' ? setUploadingLogo : setUploadingFavicon;
        const setPreview = type === 'logo' ? setLogoPreview : setFaviconPreview;
        const oldUrl = type === 'logo' ? formData.logo_url : formData.favicon_url;

        setUploading(true);
        try {
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Supabase Storage
            const folder = 'theme';
            const image_url = await uploadFile('business-gallery', file, folder);

            // Delete old image if it was uploaded to storage
            if (oldUrl && oldUrl.startsWith('http') && oldUrl.includes('supabase.co')) {
                try {
                    await deleteFileByUrl('business-gallery', oldUrl);
                } catch (deleteError) {
                    console.warn('Failed to delete old image:', deleteError);
                }
            }

            // Update form data
            if (type === 'logo') {
                setFormData(prev => ({ ...prev, logo_url: image_url }));
            } else {
                setFormData(prev => ({ ...prev, favicon_url: image_url }));
            }

            toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} đã được tải lên thành công!`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tải lên hình ảnh';
            toast.error(`Lỗi: ${message}`);
            setPreview(oldUrl || null);
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file, type);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateTheme(formData);
        toast.success('Theme updated successfully!');
    };
    
    const handleReset = () => {
        setShowResetConfirm(true);
    };

    const confirmReset = () => {
        setShowResetConfirm(false);
        const defaultTheme: ThemeSettings = {
          logo_url: '',
          favicon_url: '/favicon.svg',
          colors: {
            primary: '#BFA16A', primary_dark: '#A98C5A', secondary: '#4A4A4A',
            accent: '#EAE0D1', background: '#FDFCF9', neutral_dark: '#2D2D2D',
          },
          fonts: { sans: 'Inter', serif: 'Playfair Display' },
        };
        setFormData(defaultTheme);
        updateTheme(defaultTheme);
        toast.success('Theme has been reset to default.');
    };

    return (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-neutral-dark">Theme & Branding</h2>
                <div className="flex gap-2">
                    <button type="button" onClick={handleReset} className="px-4 py-2 border border-red-300 text-red-700 rounded-md font-semibold text-sm hover:bg-red-50">Reset to Default</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md font-semibold text-sm hover:bg-primary-dark">Save Theme</button>
                </div>
            </div>

            {/* Branding Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-dark border-b pb-2">Branding</h3>
                
                {/* Logo Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1">
                            <input 
                                type="text" 
                                name="logo_url" 
                                value={formData.logo_url} 
                                onChange={handleUrlChange} 
                                placeholder="URL logo hoặc để trống để dùng text logo" 
                                className="w-full p-2 border rounded-md" 
                            />
                            <p className="text-xs text-gray-500 mt-1">Hoặc tải lên từ thiết bị (tối đa 2MB)</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, 'logo')}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={uploadingLogo}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                            >
                                {uploadingLogo ? 'Đang tải...' : 'Chọn file'}
                            </button>
                        </div>
                    </div>
                    {logoPreview && (
                        <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Preview:</p>
                            <img src={logoPreview} alt="Logo preview" className="max-h-20 border rounded p-1" />
                        </div>
                    )}
                </div>

                {/* Favicon Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1">
                            <input 
                                type="text" 
                                name="favicon_url" 
                                value={formData.favicon_url} 
                                onChange={handleUrlChange} 
                                placeholder="URL favicon" 
                                className="w-full p-2 border rounded-md" 
                            />
                            <p className="text-xs text-gray-500 mt-1">Hoặc tải lên từ thiết bị (tối đa 500KB, khuyến nghị 32x32 hoặc 64x64px)</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <input
                                ref={faviconInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, 'favicon')}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => faviconInputRef.current?.click()}
                                disabled={uploadingFavicon}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                            >
                                {uploadingFavicon ? 'Đang tải...' : 'Chọn file'}
                            </button>
                        </div>
                    </div>
                    {faviconPreview && (
                        <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Preview:</p>
                            <img src={faviconPreview} alt="Favicon preview" className="h-8 w-8 border rounded p-1" />
                        </div>
                    )}
                </div>
            </div>

            {/* Colors Section */}
            <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-neutral-dark border-b pb-2">Colors</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorInput label="Primary" name="primary" value={formData.colors.primary} onChange={handleColorChange} />
                    <ColorInput label="Primary Dark" name="primary_dark" value={formData.colors.primary_dark} onChange={handleColorChange} />
                    <ColorInput label="Secondary" name="secondary" value={formData.colors.secondary} onChange={handleColorChange} />
                    <ColorInput label="Accent" name="accent" value={formData.colors.accent} onChange={handleColorChange} />
                    <ColorInput label="Background" name="background" value={formData.colors.background} onChange={handleColorChange} />
                    <ColorInput label="Neutral Dark" name="neutral_dark" value={formData.colors.neutral_dark} onChange={handleColorChange} />
                 </div>
            </div>

            {/* Fonts Section */}
             <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-neutral-dark border-b pb-2">Fonts</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Main Font (Sans-serif)</label>
                        <select name="sans" value={formData.fonts.sans} onChange={handleFontChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                           {availableFonts.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Heading Font (Serif)</label>
                        <select name="serif" value={formData.fonts.serif} onChange={handleFontChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                            {availableFonts.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                    </div>
                 </div>
             </div>
            <ConfirmDialog
                isOpen={showResetConfirm}
                title="Reset Theme Settings"
                message="Are you sure you want to reset all theme settings to default? This action cannot be undone."
                confirmText="Reset"
                cancelText="Cancel"
                variant="warning"
                onConfirm={confirmReset}
                onCancel={() => setShowResetConfirm(false)}
            />
        </form>
    );
};

export default ThemeEditor;
