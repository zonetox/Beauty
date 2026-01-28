// C3.13 - System Settings Component (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSettings } from '../contexts/AdminContext.tsx';
import { AppSettings } from '../types.ts';
import { uploadFile } from '../lib/storage.ts';
import LoadingState from './LoadingState.tsx';

const SystemSettings: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const [formData, setFormData] = useState<AppSettings | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

    useEffect(() => {
        if (settings) {
            setFormData({
                site_name: settings.site_name || 'Beauty Directory',
                support_email: settings.support_email || 'support@beautydir.com',
                maintenance_mode: settings.maintenance_mode || false,
                logo_url: settings.logo_url || '',
                favicon_url: settings.favicon_url || '',
                colors: {
                    primary: settings.colors?.primary || '#D4A574',
                    primary_dark: settings.colors?.primary_dark || '#B8935F',
                    secondary: settings.colors?.secondary || '#8B7355',
                    accent: settings.colors?.accent || '#F5E6D3',
                    background: settings.colors?.background || '#FFFFFF',
                    neutral_dark: settings.colors?.neutral_dark || '#2C2C2C',
                },
                seo_defaults: {
                    default_title: settings.seo_defaults?.default_title || 'Beauty Directory - Find the Best Beauty Services',
                    default_description: settings.seo_defaults?.default_description || 'Discover top-rated spas, salons, and beauty clinics in your area.',
                    default_keywords: settings.seo_defaults?.default_keywords || 'beauty, spa, salon, beauty directory',
                },
                email_config: {
                    from_email: settings.email_config?.from_email || 'noreply@beautydir.com',
                    from_name: settings.email_config?.from_name || 'Beauty Directory',
                    reply_to: settings.email_config?.reply_to || 'support@beautydir.com',
                },
                bank_details: settings.bank_details || {
                    bank_name: '',
                    account_name: '',
                    account_number: '',
                    transfer_note: '',
                },
            });
            if (settings.logo_url) setLogoPreview(settings.logo_url);
            if (settings.favicon_url) setFaviconPreview(settings.favicon_url);
        }
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (!formData) return;

        if (name.includes('.')) {
            const keys = name.split('.');
            if (keys.length === 2 && keys[0] && keys[1]) {
                setFormData(prev => ({
                    ...prev!,
                    [keys[0]]: {
                        ...(prev as any)[keys[0]],
                        [keys[1]]: type === 'checkbox' ? checked : value,
                    },
                }));
            } else if (keys.length === 3 && keys[0] && keys[1] && keys[2]) {
                // For nested objects like colors.primary
                setFormData(prev => ({
                    ...prev!,
                    [keys[0]]: {
                        ...(prev as any)[keys[0]],
                        [keys[1]]: {
                            ...(prev as any)[keys[0]]?.[keys[1]],
                            [keys[2]]: type === 'checkbox' ? checked : value,
                        },
                    },
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev!,
                [name]: type === 'checkbox' ? checked : value,
            }));
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setIsUploadingLogo(true);
        try {
            const folder = 'system';
            const image_url = await uploadFile('business-gallery', file, folder);
            setFormData(prev => ({ ...prev!, logo_url: image_url }));
            setLogoPreview(image_url);
            toast.success('Logo uploaded successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload logo';
            toast.error(message);
        } finally {
            setIsUploadingLogo(false);
            e.target.value = '';
        }
    };

    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 1 * 1024 * 1024) {
            toast.error('Favicon size must be less than 1MB');
            return;
        }

        setIsUploadingFavicon(true);
        try {
            const folder = 'system';
            const image_url = await uploadFile('business-gallery', file, folder);
            setFormData(prev => ({ ...prev!, favicon_url: image_url }));
            setFaviconPreview(image_url);
            toast.success('Favicon uploaded successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload favicon';
            toast.error(message);
        } finally {
            setIsUploadingFavicon(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        setIsSubmitting(true);
        try {
            await updateSettings(formData);
            toast.success('Settings saved successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save settings';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!formData) {
        return (
            <div className="p-8">
                <LoadingState message="Loading system settings..." />
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold font-serif text-neutral-dark mb-6">System Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Site Branding */}
                <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-semibold text-neutral-dark mb-4">Site Branding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="site_name" className="block text-sm font-medium text-gray-700 mb-1">
                                Site Name
                            </label>
                            <input
                                type="text"
                                id="site_name"
                                name="site_name"
                                value={formData.site_name || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="support_email" className="block text-sm font-medium text-gray-700 mb-1">
                                Support Email
                            </label>
                            <input
                                type="email"
                                id="support_email"
                                name="support_email"
                                value={formData.support_email || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-1">
                                Logo
                            </label>
                            <input
                                type="file"
                                id="logo_url"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                disabled={isUploadingLogo}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:opacity-50"
                            />
                            {logoPreview && (
                                <div className="mt-2">
                                    <img src={logoPreview} alt="Logo preview" className="h-16 w-auto object-contain" />
                                </div>
                            )}
                            {formData.logo_url && !logoPreview && (
                                <p className="text-xs text-gray-500 mt-1">Current logo URL: {formData.logo_url}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="favicon_url" className="block text-sm font-medium text-gray-700 mb-1">
                                Favicon
                            </label>
                            <input
                                type="file"
                                id="favicon_url"
                                accept="image/*"
                                onChange={handleFaviconUpload}
                                disabled={isUploadingFavicon}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:opacity-50"
                            />
                            {faviconPreview && (
                                <div className="mt-2">
                                    <img src={faviconPreview} alt="Favicon preview" className="h-8 w-8 object-contain" />
                                </div>
                            )}
                            {formData.favicon_url && !faviconPreview && (
                                <p className="text-xs text-gray-500 mt-1">Current favicon URL: {formData.favicon_url}</p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="maintenance_mode"
                                    checked={formData.maintenance_mode || false}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1">When enabled, the site will be in maintenance mode.</p>
                        </div>
                    </div>
                </div>

                {/* Color Scheme */}
                <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-semibold text-neutral-dark mb-4">Color Scheme</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(formData.colors || {}).map(([key, value]) => (
                            <div key={key}>
                                <label htmlFor={`colors.${key}`} className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        id={`colors.${key}`}
                                        name={`colors.${key}`}
                                        value={value || '#000000'}
                                        onChange={handleChange}
                                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={value || ''}
                                        onChange={(e) => {
                                            const keys = `colors.${key}`.split('.');
                                            setFormData(prev => ({
                                                ...prev!,
                                                [keys[0]]: {
                                                    ...(prev as any)[keys[0]],
                                                    [keys[1]]: {
                                                        ...(prev as any)[keys[0]]?.[keys[1]],
                                                        [keys[2]]: e.target.value,
                                                    },
                                                },
                                            }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary font-mono text-sm"
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SEO Defaults */}
                <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-semibold text-neutral-dark mb-4">SEO Defaults</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="seo_defaults.default_title" className="block text-sm font-medium text-gray-700 mb-1">
                                Default Title
                            </label>
                            <input
                                type="text"
                                id="seo_defaults.default_title"
                                name="seo_defaults.default_title"
                                value={formData.seo_defaults?.default_title || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="Beauty Directory - Find the Best Beauty Services"
                            />
                        </div>
                        <div>
                            <label htmlFor="seo_defaults.default_description" className="block text-sm font-medium text-gray-700 mb-1">
                                Default Description
                            </label>
                            <textarea
                                id="seo_defaults.default_description"
                                name="seo_defaults.default_description"
                                value={formData.seo_defaults?.default_description || ''}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="Discover top-rated spas, salons, and beauty clinics in your area."
                            />
                        </div>
                        <div>
                            <label htmlFor="seo_defaults.default_keywords" className="block text-sm font-medium text-gray-700 mb-1">
                                Default Keywords
                            </label>
                            <input
                                type="text"
                                id="seo_defaults.default_keywords"
                                name="seo_defaults.default_keywords"
                                value={formData.seo_defaults?.default_keywords || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="beauty, spa, salon, beauty directory"
                            />
                        </div>
                    </div>
                </div>

                {/* Email Configuration */}
                <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-semibold text-neutral-dark mb-4">Email Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="email_config.from_email" className="block text-sm font-medium text-gray-700 mb-1">
                                From Email
                            </label>
                            <input
                                type="email"
                                id="email_config.from_email"
                                name="email_config.from_email"
                                value={formData.email_config?.from_email || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="noreply@beautydir.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="email_config.from_name" className="block text-sm font-medium text-gray-700 mb-1">
                                From Name
                            </label>
                            <input
                                type="text"
                                id="email_config.from_name"
                                name="email_config.from_name"
                                value={formData.email_config?.from_name || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="Beauty Directory"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="email_config.reply_to" className="block text-sm font-medium text-gray-700 mb-1">
                                Reply To
                            </label>
                            <input
                                type="email"
                                id="email_config.reply_to"
                                name="email_config.reply_to"
                                value={formData.email_config?.reply_to || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="support@beautydir.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-semibold text-neutral-dark mb-4">Bank Transfer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="bank_details.bank_name" className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Name
                            </label>
                            <input
                                type="text"
                                id="bank_details.bank_name"
                                name="bank_details.bank_name"
                                value={formData.bank_details.bank_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="bank_details.account_name" className="block text-sm font-medium text-gray-700 mb-1">
                                Account Name
                            </label>
                            <input
                                type="text"
                                id="bank_details.account_name"
                                name="bank_details.account_name"
                                value={formData.bank_details.account_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="bank_details.account_number" className="block text-sm font-medium text-gray-700 mb-1">
                                Account Number
                            </label>
                            <input
                                type="text"
                                id="bank_details.account_number"
                                name="bank_details.account_number"
                                value={formData.bank_details.account_number}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="bank_details.transfer_note" className="block text-sm font-medium text-gray-700 mb-1">
                                Transfer Note Template
                            </label>
                            <textarea
                                id="bank_details.transfer_note"
                                name="bank_details.transfer_note"
                                value={formData.bank_details.transfer_note}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="Payment for [Tên doanh nghiệp] - Order [Mã đơn hàng]"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Use [Tên doanh nghiệp] and [Mã đơn hàng] as placeholders</p>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => setFormData(settings || null)}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SystemSettings;
