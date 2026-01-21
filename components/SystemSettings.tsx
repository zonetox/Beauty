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
                siteName: settings.siteName || 'Beauty Directory',
                supportEmail: settings.supportEmail || 'support@beautydir.com',
                maintenanceMode: settings.maintenanceMode || false,
                logoUrl: settings.logoUrl || '',
                faviconUrl: settings.faviconUrl || '',
                colors: {
                    primary: settings.colors?.primary || '#D4A574',
                    primaryDark: settings.colors?.primaryDark || '#B8935F',
                    secondary: settings.colors?.secondary || '#8B7355',
                    accent: settings.colors?.accent || '#F5E6D3',
                    background: settings.colors?.background || '#FFFFFF',
                    neutralDark: settings.colors?.neutralDark || '#2C2C2C',
                },
                seoDefaults: {
                    defaultTitle: settings.seoDefaults?.defaultTitle || 'Beauty Directory - Find the Best Beauty Services',
                    defaultDescription: settings.seoDefaults?.defaultDescription || 'Discover top-rated spas, salons, and beauty clinics in your area.',
                    defaultKeywords: settings.seoDefaults?.defaultKeywords || 'beauty, spa, salon, beauty directory',
                },
                emailConfig: {
                    fromEmail: settings.emailConfig?.fromEmail || 'noreply@beautydir.com',
                    fromName: settings.emailConfig?.fromName || 'Beauty Directory',
                    replyTo: settings.emailConfig?.replyTo || 'support@beautydir.com',
                },
                bankDetails: settings.bankDetails || {
                    bankName: '',
                    accountName: '',
                    accountNumber: '',
                    transferNote: '',
                },
            });
            if (settings.logoUrl) setLogoPreview(settings.logoUrl);
            if (settings.faviconUrl) setFaviconPreview(settings.faviconUrl);
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
            const imageUrl = await uploadFile('business-gallery', file, folder);
            setFormData(prev => ({ ...prev!, logoUrl: imageUrl }));
            setLogoPreview(imageUrl);
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
            const imageUrl = await uploadFile('business-gallery', file, folder);
            setFormData(prev => ({ ...prev!, faviconUrl: imageUrl }));
            setFaviconPreview(imageUrl);
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
                            <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
                                Site Name
                            </label>
                            <input
                                type="text"
                                id="siteName"
                                name="siteName"
                                value={formData.siteName || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700 mb-1">
                                Support Email
                            </label>
                            <input
                                type="email"
                                id="supportEmail"
                                name="supportEmail"
                                value={formData.supportEmail || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                                Logo
                            </label>
                            <input
                                type="file"
                                id="logoUrl"
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
                            {formData.logoUrl && !logoPreview && (
                                <p className="text-xs text-gray-500 mt-1">Current logo URL: {formData.logoUrl}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="faviconUrl" className="block text-sm font-medium text-gray-700 mb-1">
                                Favicon
                            </label>
                            <input
                                type="file"
                                id="faviconUrl"
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
                            {formData.faviconUrl && !faviconPreview && (
                                <p className="text-xs text-gray-500 mt-1">Current favicon URL: {formData.faviconUrl}</p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="maintenanceMode"
                                    checked={formData.maintenanceMode || false}
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
                            <label htmlFor="seoDefaults.defaultTitle" className="block text-sm font-medium text-gray-700 mb-1">
                                Default Title
                            </label>
                            <input
                                type="text"
                                id="seoDefaults.defaultTitle"
                                name="seoDefaults.defaultTitle"
                                value={formData.seoDefaults?.defaultTitle || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="Beauty Directory - Find the Best Beauty Services"
                            />
                        </div>
                        <div>
                            <label htmlFor="seoDefaults.defaultDescription" className="block text-sm font-medium text-gray-700 mb-1">
                                Default Description
                            </label>
                            <textarea
                                id="seoDefaults.defaultDescription"
                                name="seoDefaults.defaultDescription"
                                value={formData.seoDefaults?.defaultDescription || ''}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="Discover top-rated spas, salons, and beauty clinics in your area."
                            />
                        </div>
                        <div>
                            <label htmlFor="seoDefaults.defaultKeywords" className="block text-sm font-medium text-gray-700 mb-1">
                                Default Keywords
                            </label>
                            <input
                                type="text"
                                id="seoDefaults.defaultKeywords"
                                name="seoDefaults.defaultKeywords"
                                value={formData.seoDefaults?.defaultKeywords || ''}
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
                            <label htmlFor="emailConfig.fromEmail" className="block text-sm font-medium text-gray-700 mb-1">
                                From Email
                            </label>
                            <input
                                type="email"
                                id="emailConfig.fromEmail"
                                name="emailConfig.fromEmail"
                                value={formData.emailConfig?.fromEmail || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="noreply@beautydir.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="emailConfig.fromName" className="block text-sm font-medium text-gray-700 mb-1">
                                From Name
                            </label>
                            <input
                                type="text"
                                id="emailConfig.fromName"
                                name="emailConfig.fromName"
                                value={formData.emailConfig?.fromName || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="Beauty Directory"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="emailConfig.replyTo" className="block text-sm font-medium text-gray-700 mb-1">
                                Reply To
                            </label>
                            <input
                                type="email"
                                id="emailConfig.replyTo"
                                name="emailConfig.replyTo"
                                value={formData.emailConfig?.replyTo || ''}
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
                            <label htmlFor="bankDetails.bankName" className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Name
                            </label>
                            <input
                                type="text"
                                id="bankDetails.bankName"
                                name="bankDetails.bankName"
                                value={formData.bankDetails.bankName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="bankDetails.accountName" className="block text-sm font-medium text-gray-700 mb-1">
                                Account Name
                            </label>
                            <input
                                type="text"
                                id="bankDetails.accountName"
                                name="bankDetails.accountName"
                                value={formData.bankDetails.accountName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="bankDetails.accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                Account Number
                            </label>
                            <input
                                type="text"
                                id="bankDetails.accountNumber"
                                name="bankDetails.accountNumber"
                                value={formData.bankDetails.accountNumber}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="bankDetails.transferNote" className="block text-sm font-medium text-gray-700 mb-1">
                                Transfer Note Template
                            </label>
                            <textarea
                                id="bankDetails.transferNote"
                                name="bankDetails.transferNote"
                                value={formData.bankDetails.transferNote}
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
