// C3.4 - Edit Service Modal (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng Supabase Storage cho image upload
// 100% hoàn thiện, không placeholder

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Service } from '../types.ts';
import { uploadFile, deleteFileByUrl } from '../lib/storage.ts';

interface EditServiceModalProps {
    service: Partial<Service> | null;
    onSave: (service: Service) => Promise<void>;
    onClose: () => void;
    business_id: number;
}

const EditServiceModal: React.FC<EditServiceModalProps> = ({ service, onSave, onClose, business_id }) => {
    const [formData, setFormData] = useState<Partial<Service>>({
        name: '',
        description: '',
        image_url: '',
        price: '',
        duration_minutes: undefined
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imagePreview, setImagePreview] = useState<string>('');

    const isEditMode = Boolean(service && service.id);
    const oldimage_url = service?.image_url || '';

    // Initialize form data
    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name || '',
                description: service.description || '',
                image_url: service.image_url || '',
                price: service.price || '',
                duration_minutes: service.duration_minutes
            });
            setImagePreview(service.image_url || '');
        } else {
            setFormData({
                name: '',
                description: '',
                image_url: '',
                price: '',
                duration_minutes: undefined
            });
            setImagePreview('');
        }
        setErrors({});
    }, [service]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = value === '' ? undefined : parseInt(value, 10);
        setFormData(prev => ({ ...prev, [name]: numValue }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Name validation
        if (!formData.name || formData.name.trim().length === 0) {
            newErrors.name = 'Service name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Service name must be at least 2 characters';
        }

        // Description validation
        if (!formData.description || formData.description.trim().length === 0) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }

        // Price validation
        if (!formData.price || formData.price.trim().length === 0) {
            newErrors.price = 'Price is required';
        }

        // Image validation
        if (!formData.image_url || formData.image_url.trim().length === 0) {
            newErrors.image_url = 'Service image is required';
        }

        // Duration validation (optional, but if provided must be positive)
        if (formData.duration_minutes !== undefined && formData.duration_minutes < 1) {
            newErrors.duration_minutes = 'Duration must be at least 1 minute';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setErrors(prev => ({
                ...prev,
                image_url: 'Invalid image format. Please use JPG, PNG, or WebP.'
            }));
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setErrors(prev => ({
                ...prev,
                image_url: 'Image size must be less than 5MB.'
            }));
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.image_url;
            return newErrors;
        });

        try {
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Supabase Storage
            const folder = `business/${business_id}/services`;
            const image_url = await uploadFile('business-gallery', file, folder);

            // Delete old image if editing and image changed
            if (isEditMode && oldimage_url && oldimage_url !== image_url && oldimage_url.startsWith('http')) {
                try {
                    await deleteFileByUrl('business-gallery', oldimage_url);
                } catch (deleteError) {
                    // Log but don't fail the upload
                    console.warn('Failed to delete old image:', deleteError);
                }
            }

            setFormData(prev => ({ ...prev, image_url: image_url }));
            setUploadProgress(100);
            toast.success('Image uploaded successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload image';
            setErrors(prev => ({
                ...prev,
                image_url: message
            }));
            toast.error('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsSaving(true);
        try {
            const serviceToSave: Service = {
                id: service?.id || crypto.randomUUID(),
                business_id: business_id,
                name: formData.name!.trim(),
                description: formData.description!.trim(),
                price: formData.price!.trim(),
                image_url: formData.image_url!,
                duration_minutes: formData.duration_minutes,
                position: service?.position || 0
            };

            await onSave(serviceToSave);
            toast.success(isEditMode ? 'Service updated successfully!' : 'Service added successfully!');
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save service';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b sticky top-0 bg-white z-10">
                        <h3 className="text-xl font-bold font-serif text-neutral-dark">
                            {isEditMode ? 'Edit Service' : 'Add New Service'}
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Service Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Service Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                className={`mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="e.g., Facial Treatment"
                                disabled={isSaving || isUploading}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Service Image <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1 flex items-center gap-4">
                                <div className="relative">
                                    <img
                                        src={imagePreview || formData.image_url || 'https://placehold.co/128x128/E6A4B4/FFFFFF?text=No+Image'}
                                        alt="Service preview"
                                        className="w-24 h-24 object-cover rounded-md border bg-gray-100"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/128x128/E6A4B4/FFFFFF?text=No+Image';
                                        }}
                                    />
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                                            <div className="text-white text-xs text-center">
                                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                                                <p>{uploadProgress}%</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label
                                        htmlFor="service-image-upload"
                                        className={`cursor-pointer bg-secondary text-white px-3 py-2 text-sm font-semibold rounded-md hover:opacity-90 inline-block ${isUploading || isSaving ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        {isUploading ? 'Uploading...' : 'Choose Image'}
                                    </label>
                                    <input
                                        id="service-image-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={handleImageUpload}
                                        disabled={isUploading || isSaving}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, or WebP (max 5MB)</p>
                                </div>
                            </div>
                            {errors.image_url && <p className="mt-1 text-sm text-red-600">{errors.image_url}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                rows={4}
                                className={`mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary ${errors.description ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Describe your service in detail..."
                                disabled={isSaving || isUploading}
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price / Price Range <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="price"
                                value={formData.price || ''}
                                onChange={handleChange}
                                className={`mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary ${errors.price ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="e.g., 500,000đ or Contact Us"
                                disabled={isSaving || isUploading}
                            />
                            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                        </div>

                        {/* Duration (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (minutes) <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="number"
                                name="duration_minutes"
                                value={formData.duration_minutes || ''}
                                onChange={handleNumberChange}
                                min="1"
                                className={`mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary ${errors.duration_minutes ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="e.g., 60"
                                disabled={isSaving || isUploading}
                            />
                            {errors.duration_minutes && <p className="mt-1 text-sm text-red-600">{errors.duration_minutes}</p>}
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 sticky bottom-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSaving || isUploading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={isSaving || isUploading}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                'Save Service'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditServiceModal;
