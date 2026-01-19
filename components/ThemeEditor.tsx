import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { ThemeSettings } from '../types.ts';
import ConfirmDialog from './ConfirmDialog.tsx';

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
          logoUrl: '',
          faviconUrl: '/favicon.svg',
          colors: {
            primary: '#BFA16A', primaryDark: '#A98C5A', secondary: '#4A4A4A',
            accent: '#EAE0D1', background: '#FDFCF9', neutralDark: '#2D2D2D',
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
                <div>
                    <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                    <input type="text" name="logoUrl" value={formData.logoUrl} onChange={handleUrlChange} placeholder="Leave empty to use text logo" className="mt-1 w-full p-2 border rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Favicon URL</label>
                    <input type="text" name="faviconUrl" value={formData.faviconUrl} onChange={handleUrlChange} className="mt-1 w-full p-2 border rounded-md" />
                </div>
            </div>

            {/* Colors Section */}
            <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-neutral-dark border-b pb-2">Colors</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorInput label="Primary" name="primary" value={formData.colors.primary} onChange={handleColorChange} />
                    <ColorInput label="Primary Dark" name="primaryDark" value={formData.colors.primaryDark} onChange={handleColorChange} />
                    <ColorInput label="Secondary" name="secondary" value={formData.colors.secondary} onChange={handleColorChange} />
                    <ColorInput label="Accent" name="accent" value={formData.colors.accent} onChange={handleColorChange} />
                    <ColorInput label="Background" name="background" value={formData.colors.background} onChange={handleColorChange} />
                    <ColorInput label="Neutral Dark" name="neutralDark" value={formData.colors.neutralDark} onChange={handleColorChange} />
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
