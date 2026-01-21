// C3.2 - Business Profile Editor (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// Không tạo schema mới, không tạo table mới, không refactor kiến trúc

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { BusinessCategory, HeroSlide, TrustIndicator, Business } from '../types.ts';
import { uploadFile } from '../lib/storage.ts';
import LoadingState from './LoadingState.tsx';
// import EmptyState from './EmptyState.tsx';
import { useStaffPermissions } from '../hooks/useStaffPermissions.ts';
import LandingPageSectionEditor from './LandingPageSectionEditor.tsx';
import LandingPagePreview from './LandingPagePreview.tsx';
import { LandingPageConfig } from '../types.ts';

// Helper to convert blob to base64 (for team member images)
// const blobToBase64 = (blob: Blob): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onloadend = () => resolve(reader.result as string);
//     reader.onerror = reject;
//     reader.readAsDataURL(blob);
//   });
// };

// Reusable form field components
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }> = ({ label, error, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            {...props}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${error ? 'border-red-500' : 'border-gray-300'
                }`}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

const TextareaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }> = ({ label, error, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <textarea
            {...props}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${error ? 'border-red-500' : 'border-gray-300'
                }`}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${active ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
    >
        {children}
    </button>
);

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface FormErrors {
    name?: string;
    description?: string;
    address?: string;
    city?: string;
    district?: string;
    ward?: string;
    phone?: string;
    email?: string;
    categories?: string;
    imageUrl?: string;
}

const BusinessProfileEditor: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { updateBusiness } = useBusinessData();
    const navigate = useNavigate();
    const staffPermissions = useStaffPermissions();

    const [formData, setFormData] = useState<Business | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'media' | 'hours' | 'social' | 'landing'>('info');
    const [errors, setErrors] = useState<FormErrors>({});
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [workingHoursList, setWorkingHoursList] = useState<Array<{ day: string; time: string }>>([]);

    // Initialize form data from currentBusiness
    useEffect(() => {
        if (currentBusiness) {
            const businessData = JSON.parse(JSON.stringify(currentBusiness));
            // Initialize hero slides if not present
            if (!businessData.heroSlides || businessData.heroSlides.length === 0) {
                businessData.heroSlides = [{
                    title: currentBusiness.name,
                    subtitle: currentBusiness.slogan || currentBusiness.categories.join(', '),
                    imageUrl: currentBusiness.heroImageUrl || currentBusiness.imageUrl,
                }];
            }
            setFormData(businessData);
            // Initialize working hours list
            const hours = currentBusiness.workingHours || {};
            const hoursList = Object.entries(hours).map(([day, time]) => ({ day, time: time as string }));
            setWorkingHoursList(hoursList.length > 0 ? hoursList : [{ day: '', time: '' }]);

            // Initialize landing_page_config if not present
            if (!businessData.landingPageConfig) {
                businessData.landingPageConfig = {
                    sections: {
                        hero: { enabled: true, order: 1 },
                        trust: { enabled: false, order: 2 },
                        services: { enabled: true, order: 3 },
                        gallery: { enabled: true, order: 4 },
                        team: { enabled: false, order: 5 },
                        reviews: { enabled: true, order: 6 },
                        cta: { enabled: true, order: 7 },
                        contact: { enabled: true, order: 8 },
                    },
                };
            }
        }
    }, [currentBusiness]);

    // Update formData when workingHoursList changes
    useEffect(() => {
        setFormData((prev) => {
            if (!prev) return null;
            const workingHoursObject = workingHoursList.reduce((acc, curr) => {
                if (curr.day.trim()) {
                    acc[curr.day.trim()] = curr.time.trim();
                }
                return acc;
            }, {} as { [key: string]: string });

            // Only update if changed to avoid extra renders
            if (JSON.stringify(prev.workingHours) === JSON.stringify(workingHoursObject)) {
                return prev;
            }

            return { ...prev, workingHours: workingHoursObject };
        });
    }, [workingHoursList]);

    // Loading state
    if (!currentBusiness || !formData) {
        return (
            <div className="p-8">
                <LoadingState message="Loading business profile..." />
            </div>
        );
    }

    // Validation function
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name || formData.name.trim().length < 2) {
            newErrors.name = 'Business name must be at least 2 characters.';
        }

        if (!formData.description || formData.description.trim().length < 10) {
            newErrors.description = 'Description must be at least 10 characters.';
        }

        if (!formData.address || formData.address.trim().length < 5) {
            newErrors.address = 'Address must be at least 5 characters.';
        }

        if (!formData.city || formData.city.trim().length < 2) {
            newErrors.city = 'City is required.';
        }

        if (!formData.district || formData.district.trim().length < 2) {
            newErrors.district = 'District is required.';
        }

        if (!formData.ward || formData.ward.trim().length < 2) {
            newErrors.ward = 'Ward is required.';
        }

        if (!formData.phone || !/^[0-9+\-\s()]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number.';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address.';
        }

        if (!formData.categories || formData.categories.length === 0) {
            newErrors.categories = 'Please select at least one category.';
        }

        if (!formData.imageUrl || formData.imageUrl.trim().length === 0) {
            // imageUrl is required in schema
            newErrors.imageUrl = 'Cover image is required.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumeric = type === 'number';
        setFormData((prev) => {
            if (!prev) return null;
            return { ...prev, [name]: isNumeric ? parseFloat(value) : value } as Business;
        });
        // Clear error for this field when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        const category = value as BusinessCategory;

        setFormData((prev: Business | null) => {
            if (!prev) return null;
            const currentCategories = prev.categories || [];
            if (checked) {
                return { ...prev, categories: [...new Set([...currentCategories, category])] } as Business;
            } else {
                const newCategories = currentCategories.filter((c: BusinessCategory) => c !== category);
                return { ...prev, categories: newCategories.length > 0 ? newCategories : currentCategories } as Business;
            }
        });
        // Clear error when category is selected
        if (errors.categories) {
            setErrors((prev) => ({ ...prev, categories: undefined }));
        }
    };

    // C3.2 FIX: Use correct storage buckets (business-logos, business-gallery) and paths
    const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        if (file.size > 4 * 1024 * 1024) {
            toast.error("File is too large. Please select a file smaller than 4MB.");
            return;
        }

        setIsUploadingLogo(true);
        try {
            // Use business-logos bucket with path: business/{business_id}/logo.{ext}

            const folder = `business/${currentBusiness.id}`;
            const publicUrl = await uploadFile('business-logos', file, folder);
            setFormData((prev) => {
                if (!prev) return null;
                const updated: Business = { ...prev, logoUrl: publicUrl };
                return updated;
            });
            toast.success('Logo uploaded successfully!');
        } catch (error: unknown) {
            const err = error as Record<string, unknown>;
            console.error('Logo upload error:', error);
            toast.error((err?.message as string) || 'Failed to upload logo. Please try again.');
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        if (file.size > 4 * 1024 * 1024) {
            toast.error("File is too large. Please select a file smaller than 4MB.");
            return;
        }

        setIsUploadingCover(true);
        try {
            // Use business-gallery bucket with path: business/{business_id}/cover.{ext}
            const folder = `business/${currentBusiness.id}`;
            const publicUrl = await uploadFile('business-gallery', file, folder);
            setFormData((prev) => {
                if (!prev) return null;
                const updated: Business = { ...prev, imageUrl: publicUrl };
                return updated;
            });
            toast.success('Cover image uploaded successfully!');
            // Clear error if cover image was missing
            if (errors.imageUrl) {
                setErrors((prev) => ({ ...prev, imageUrl: undefined }));
            }
        } catch (error: unknown) {
            const err = error as Record<string, unknown>;
            console.error('Cover image upload error:', error);
            toast.error((err?.message as string) || 'Failed to upload cover image. Please try again.');
        } finally {
            setIsUploadingCover(false);
        }
    };

    const handleSeoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            if (!prev) return null;
            return { ...prev, seo: { ...(prev.seo || {}), [name]: value } } as Business;
        });
    };

    const handleLandingPageConfigChange = (newConfig: LandingPageConfig) => {
        setFormData((prev) => {
            if (!prev) return null;
            return { ...prev, landingPageConfig: newConfig } as Business;
        });
    };

    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            if (!prev) return null;
            return { ...prev, socials: { ...(prev.socials || {}), [name]: value } } as Business;
        });
    };

    const handleWorkingHoursListChange = (index: number, field: 'day' | 'time', value: string) => {
        const newList = [...workingHoursList];
        if (newList[index]) {
            newList[index][field] = value;
        }
        setWorkingHoursList(newList);
    };

    const addWorkingHoursRow = () => {
        setWorkingHoursList([...workingHoursList, { day: '', time: '' }]);
    };

    const removeWorkingHoursRow = (index: number) => {
        setWorkingHoursList(workingHoursList.filter((_, i) => i !== index));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Additional validation for landing page tab
        if (activeTab === 'landing') {
            if (!formData.heroSlides || formData.heroSlides.length === 0) {
                toast.error('At least one hero slide is required.');
                return;
            }
            const invalidSlides = formData.heroSlides.filter((slide: HeroSlide) =>
                !slide.title || slide.title.trim().length === 0 ||
                !slide.subtitle || slide.subtitle.trim().length === 0 ||
                !slide.imageUrl || slide.imageUrl.trim().length === 0
            );
            if (invalidSlides.length > 0) {
                toast.error('All hero slides must have title, subtitle, and image URL.');
                return;
            }
        }

        if (!validateForm()) {
            toast.error('Please fix the errors before saving.');
            return;
        }

        setIsSaving(true);
        try {
            await updateBusiness(formData);
            toast.success('Profile saved successfully!');
        } catch (error: unknown) {
            const err = error as Record<string, unknown>;
            console.error('Save error:', error);
            toast.error((err?.message as string) || 'Failed to save profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="divide-y divide-gray-200">
            <div className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold font-serif text-neutral-dark">Business Profile Editor</h2>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(`/business/${currentBusiness.slug}`)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Preview Page
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving || isUploadingLogo || isUploadingCover}
                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors flex items-center justify-center min-w-[120px] ${isSaving || isUploadingLogo || isUploadingCover
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-dark'
                            }`}
                    >
                        {isSaving ? <><Spinner /> Saving...</> : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex space-x-2 px-6">
                    <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')}>Basic Info</TabButton>
                    <TabButton active={activeTab === 'media'} onClick={() => setActiveTab('media')}>Media & Content</TabButton>
                    <TabButton active={activeTab === 'landing'} onClick={() => setActiveTab('landing')}>Landing Page</TabButton>
                    <TabButton active={activeTab === 'hours'} onClick={() => setActiveTab('hours')}>Working Hours</TabButton>
                    <TabButton active={activeTab === 'social'} onClick={() => setActiveTab('social')}>Social & SEO</TabButton>
                </nav>
            </div>

            <div className="p-6 space-y-8">
                {activeTab === 'info' && (
                    <section>
                        <h3 className="text-lg font-semibold text-neutral-dark mb-4">Basic Information</h3>
                        <div className="space-y-4">
                            <InputField
                                label="Brand Name *"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                required
                                error={errors.name}
                            />
                            <TextareaField
                                label="Detailed Description *"
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                rows={5}
                                required
                                error={errors.description}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Categories *</label>
                                {errors.categories && <p className="text-sm text-red-600 mb-2">{errors.categories}</p>}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.values(BusinessCategory).map(cat => (
                                        <label key={cat} className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                value={cat}
                                                checked={formData.categories?.includes(cat) || false}
                                                onChange={handleCategoryChange}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                            <span className="text-sm">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-neutral-dark mt-8 mb-4">Contact & Location</h3>
                        <div className="space-y-4">
                            <InputField
                                label="Address *"
                                name="address"
                                value={formData.address || ''}
                                onChange={handleChange}
                                required
                                error={errors.address}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <InputField
                                    label="City *"
                                    name="city"
                                    value={formData.city || ''}
                                    onChange={handleChange}
                                    required
                                    error={errors.city}
                                />
                                <InputField
                                    label="District *"
                                    name="district"
                                    value={formData.district || ''}
                                    onChange={handleChange}
                                    required
                                    error={errors.district}
                                />
                                <InputField
                                    label="Ward *"
                                    name="ward"
                                    value={formData.ward || ''}
                                    onChange={handleChange}
                                    required
                                    error={errors.ward}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField
                                    label="Phone *"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    required
                                    error={errors.phone}
                                />
                                <InputField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={handleChange}
                                    error={errors.email}
                                />
                            </div>
                            <InputField
                                label="Website"
                                name="website"
                                type="url"
                                value={formData.website || ''}
                                onChange={handleChange}
                                placeholder="https://your-business.com"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField
                                    label="Latitude"
                                    name="latitude"
                                    type="number"
                                    step="any"
                                    value={formData.latitude || ''}
                                    onChange={handleChange}
                                    placeholder="e.g., 10.7769"
                                />
                                <InputField
                                    label="Longitude"
                                    name="longitude"
                                    type="number"
                                    step="any"
                                    value={formData.longitude || ''}
                                    onChange={handleChange}
                                    placeholder="e.g., 106.7009"
                                />
                            </div>
                            <p className="text-xs text-gray-500">Coordinates are used for precise map location. You can find them on OpenStreetMap by right-clicking a location.</p>
                        </div>
                    </section>
                )}

                {activeTab === 'media' && (
                    <section className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-dark mb-4">Logo & Cover Images</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Logo Management */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">Logo</label>
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={formData.logoUrl || 'https://placehold.co/128x128/E6A4B4/FFFFFF?text=Logo'}
                                            alt="Current Logo"
                                            className="w-32 h-32 object-cover rounded-md border bg-gray-100"
                                        />
                                        <div>
                                            <label
                                                htmlFor="logo-upload"
                                                className={`cursor-pointer bg-secondary text-white px-3 py-2 text-sm font-semibold rounded-md hover:opacity-90 inline-block ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                            >
                                                {isUploadingLogo ? <><Spinner /> Uploading...</> : 'Upload File'}
                                            </label>
                                            <input
                                                id="logo-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleLogoFileUpload}
                                                disabled={isUploadingLogo}
                                            />
                                            <p className="text-xs text-gray-500 mt-2">PNG, JPG. Max 4MB.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Cover Image */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image *</label>
                                    {errors.imageUrl && <p className="text-sm text-red-600 mb-2">{errors.imageUrl}</p>}
                                    <InputField
                                        label="Cover Image URL"
                                        name="imageUrl"
                                        value={formData.imageUrl || ''}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        required
                                        error={errors.imageUrl}
                                    />
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-sm text-gray-500">Or</span>
                                        <label
                                            htmlFor="cover-image-upload"
                                            className={`cursor-pointer text-sm font-semibold text-secondary hover:underline ${isUploadingCover ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            {isUploadingCover ? 'Uploading...' : 'Upload from device'}
                                        </label>
                                        <input
                                            id="cover-image-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleCoverImageUpload}
                                            disabled={isUploadingCover}
                                        />
                                    </div>
                                    <div className="mt-2 p-4 bg-gray-50 rounded-md border">
                                        <p className="text-sm text-gray-700">This image appears in listings.</p>
                                        <img
                                            src={formData.imageUrl || 'https://placehold.co/400x300/E6A4B4/FFFFFF?text=Cover'}
                                            alt="Cover preview"
                                            className="mt-2 w-full h-auto object-cover rounded-md aspect-video"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-8 border-t">
                            <h3 className="text-lg font-semibold text-neutral-dark mb-4">Video Content</h3>
                            <InputField
                                label="YouTube Video URL"
                                name="youtubeUrl"
                                value={formData.youtubeUrl || ''}
                                onChange={handleChange}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            <p className="text-xs text-gray-500 mt-1">This video will be featured on your landing page.</p>
                        </div>
                    </section>
                )}

                {activeTab === 'hours' && (
                    <section>
                        <h3 className="text-lg font-semibold text-neutral-dark mb-4">Working Hours</h3>
                        <div className="space-y-3">
                            {workingHoursList.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                    <input
                                        value={item.day}
                                        onChange={(e) => handleWorkingHoursListChange(index, 'day', e.target.value)}
                                        placeholder="Day(s) (e.g., Monday - Friday)"
                                        className="w-1/3 px-3 py-2 border rounded-md"
                                    />
                                    <input
                                        value={item.time}
                                        onChange={(e) => handleWorkingHoursListChange(index, 'time', e.target.value)}
                                        placeholder="Time (e.g., 9:00 - 21:00)"
                                        className="flex-grow px-3 py-2 border rounded-md"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeWorkingHoursRow(index)}
                                        className="text-red-500 font-bold p-2 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addWorkingHoursRow}
                            className="mt-3 text-sm text-secondary font-semibold hover:underline"
                        >
                            + Add hours
                        </button>
                    </section>
                )}

                {activeTab === 'social' && (
                    <section className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-dark mb-4">Social Media Links</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField
                                    label="Facebook URL"
                                    name="facebook"
                                    value={formData.socials?.facebook || ''}
                                    onChange={handleSocialChange}
                                />
                                <InputField
                                    label="Instagram URL"
                                    name="instagram"
                                    value={formData.socials?.instagram || ''}
                                    onChange={handleSocialChange}
                                />
                                <InputField
                                    label="Zalo Phone/Link"
                                    name="zalo"
                                    value={formData.socials?.zalo || ''}
                                    onChange={handleSocialChange}
                                />
                                <InputField
                                    label="TikTok URL"
                                    name="tiktok"
                                    value={formData.socials?.tiktok || ''}
                                    onChange={handleSocialChange}
                                />
                            </div>
                        </div>
                        <div className="pt-8 border-t">
                            <h3 className="text-lg font-semibold text-neutral-dark mb-4">SEO Settings</h3>
                            <div className="space-y-4">
                                <InputField
                                    label="Meta Title"
                                    name="title"
                                    value={formData.seo?.title || ''}
                                    onChange={handleSeoChange}
                                    maxLength={60}
                                />
                                <TextareaField
                                    label="Meta Description"
                                    name="description"
                                    value={formData.seo?.description || ''}
                                    onChange={handleSeoChange}
                                    rows={3}
                                    maxLength={160}
                                />
                                <InputField
                                    label="Meta Keywords"
                                    name="keywords"
                                    value={formData.seo?.keywords || ''}
                                    onChange={handleSeoChange}
                                />
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'landing' && (
                    <section>
                        <div className="mb-6 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-neutral-dark">Landing Page Builder</h3>
                            <button
                                type="button"
                                onClick={() => setIsPreviewOpen(true)}
                                className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-dark transition-colors text-sm font-medium"
                                disabled={!formData.landingPageConfig}
                            >
                                Preview Landing Page
                            </button>
                        </div>
                        {formData.landingPageConfig ? (
                            <LandingPageSectionEditor
                                config={formData.landingPageConfig}
                                onChange={handleLandingPageConfigChange}
                                disabled={!staffPermissions.isOwner && !staffPermissions.canEditLandingPage}
                            />
                        ) : (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    Landing page configuration is being initialized...
                                </p>
                            </div>
                        )}

                        {/* Trust Indicators Editor */}
                        <div className="mt-8 border-t pt-6">
                            <h3 className="text-lg font-semibold text-neutral-dark mb-4">Trust Indicators</h3>
                            <p className="text-sm text-gray-600 mb-4">Add badges, certifications, or awards to build trust with your customers.</p>

                            <div className="space-y-4">
                                {(formData.trustIndicators || []).map((indicator: TrustIndicator, index: number) => (
                                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <label htmlFor={`trust-indicator-type-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                                <select
                                                    id={`trust-indicator-type-${index}`}
                                                    value={indicator.type}
                                                    onChange={(e) => {
                                                        const updated = [...(formData.trustIndicators || [])];
                                                        updated[index] = { ...updated[index], type: e.target.value as TrustIndicator['type'] };
                                                        setFormData((prev) => {
                                                            if (!prev) return null;
                                                            const updatedResult: Business = { ...prev, trustIndicators: updated };
                                                            return updatedResult;
                                                        });
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                >
                                                    <option value="badge">Badge</option>
                                                    <option value="certification">Certification</option>
                                                    <option value="award">Award</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                                <input
                                                    type="text"
                                                    value={indicator.title}
                                                    onChange={(e) => {
                                                        const updated = [...(formData.trustIndicators || [])];
                                                        updated[index] = { ...updated[index], title: e.target.value };
                                                        setFormData((prev) => {
                                                            if (!prev) return null;
                                                            const updatedResult: Business = { ...prev, trustIndicators: updated };
                                                            return updatedResult;
                                                        });
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    placeholder="e.g., Verified Business"
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL (optional)</label>
                                            <input
                                                type="text"
                                                value={indicator.icon || ''}
                                                onChange={(e) => {
                                                    const updated = [...(formData.trustIndicators || [])];
                                                    updated[index] = { ...updated[index], icon: e.target.value };
                                                    setFormData((prev) => {
                                                        if (!prev) return null;
                                                        const updatedResult: Business = { ...prev, trustIndicators: updated };
                                                        return updatedResult;
                                                    });
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="https://example.com/icon.png"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                                            <textarea
                                                value={indicator.description || ''}
                                                onChange={(e) => {
                                                    const updated = [...(formData.trustIndicators || [])];
                                                    updated[index] = { ...updated[index], description: e.target.value };
                                                    setFormData((prev) => {
                                                        if (!prev) return null;
                                                        const updatedResult: Business = { ...prev, trustIndicators: updated };
                                                        return updatedResult;
                                                    });
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                rows={2}
                                                placeholder="Brief description of this indicator"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = (formData.trustIndicators || []).filter((_: TrustIndicator, i: number) => i !== index);
                                                setFormData((prev) => {
                                                    if (!prev) return null;
                                                    const updatedResult: Business = { ...prev, trustIndicators: updated };
                                                    return updatedResult;
                                                });
                                            }}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => {
                                        const newIndicator: TrustIndicator = { type: 'badge', title: '' };
                                        setFormData((prev) => {
                                            if (!prev) return null;
                                            const updatedResult: Business = {
                                                ...prev,
                                                trustIndicators: [...(prev.trustIndicators || []), newIndicator]
                                            };
                                            return updatedResult;
                                        });
                                    }}
                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors"
                                >
                                    + Add Trust Indicator
                                </button>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {isPreviewOpen && formData && currentBusiness && formData.landingPageConfig && (
                <LandingPagePreview
                    business={{ ...currentBusiness, landingPageConfig: formData.landingPageConfig }}
                    config={formData.landingPageConfig}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}

            <div className="p-6 flex justify-end border-t">
                <button
                    type="submit"
                    disabled={isSaving || isUploadingLogo || isUploadingCover}
                    className={`w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition-colors flex items-center justify-center min-w-[160px] ${isSaving || isUploadingLogo || isUploadingCover
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-dark'
                        }`}
                >
                    {isSaving ? <><Spinner /> Saving...</> : 'Save All Changes'}
                </button>
            </div>
        </form>
    );
};

export default BusinessProfileEditor;
