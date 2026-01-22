// C3.5 - Edit Deal Modal (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng Supabase Storage cho image upload
// 100% hoàn thiện, không placeholder

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Deal, DealStatus } from '../types.ts';
import { uploadFile, deleteFileByUrl } from '../lib/storage.ts';

interface EditDealModalProps {
    deal: Partial<Deal> | null;
    onSave: (deal: Deal) => Promise<void>;
    onClose: () => void;
    businessId: number;
}

// Helper function to calculate discount percentage from prices
const calculateDiscount = (originalPrice?: number, dealPrice?: number): number | undefined => {
    if (!originalPrice || !dealPrice || originalPrice <= 0) return undefined;
    return Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
};

// Helper function to calculate deal status based on dates
const calculateDealStatus = (startDate?: string, endDate?: string): DealStatus => {
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && start > now) {
        return DealStatus.SCHEDULED;
    }
    if (end && end < now) {
        return DealStatus.EXPIRED;
    }
    if (start && end && start <= now && end >= now) {
        return DealStatus.ACTIVE;
    }
    return DealStatus.ACTIVE;
};

const EditDealModal: React.FC<EditDealModalProps> = ({ deal, onSave, onClose, businessId }) => {
    const [formData, setFormData] = useState<Partial<Deal>>({
        title: '',
        description: '',
        image_url: '',
        start_date: '',
        end_date: '',
        original_price: undefined,
        deal_price: undefined,
        discount_percentage: undefined,
        status: DealStatus.ACTIVE
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imagePreview, setImagePreview] = useState<string>('');

    const isEditMode = Boolean(deal && deal.id);
    const oldImageUrl = deal?.image_url || '';

    // Initialize form data
    useEffect(() => {
        if (deal) {
            // Format dates for input (YYYY-MM-DD)
            const formatDateForInput = (dateStr?: string) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return date.toISOString().split('T')[0];
            };

            setFormData({
                title: deal.title || '',
                description: deal.description || '',
                image_url: deal.image_url || '',
                start_date: formatDateForInput(deal.start_date),
                end_date: formatDateForInput(deal.end_date),
                original_price: deal.original_price,
                deal_price: deal.deal_price,
                discount_percentage: deal.discount_percentage,
                status: deal.status || DealStatus.ACTIVE
            });
            setImagePreview(deal.image_url || '');
        } else {
            setFormData({
                title: '',
                description: '',
                image_url: '',
                start_date: '',
                end_date: '',
                original_price: undefined,
                deal_price: undefined,
                discount_percentage: undefined,
                status: DealStatus.ACTIVE
            });
            setImagePreview('');
        }
        setErrors({});
    }, [deal]);

    // Auto-calculate discount when prices change
    useEffect(() => {
        if (formData.original_price && formData.deal_price) {
            const calculated = calculateDiscount(formData.original_price, formData.deal_price);
            if (calculated !== undefined && calculated >= 0 && calculated <= 100) {
                setFormData(prev => ({ ...prev, discount_percentage: calculated }));
            }
        }
    }, [formData.original_price, formData.deal_price]);

    // Auto-calculate status when dates change
    useEffect(() => {
        if (formData.start_date || formData.end_date) {
            const calculatedStatus = calculateDealStatus(formData.start_date, formData.end_date);
            setFormData(prev => ({ ...prev, status: calculatedStatus }));
        }
    }, [formData.start_date, formData.end_date]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let processedValue: string | number | undefined = value;

        if (type === 'number') {
            processedValue = value === '' ? undefined : parseFloat(value);
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));

        // Clear error when user starts typing
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

        // Title validation
        if (!formData.title || formData.title.trim().length === 0) {
            newErrors.title = 'Deal title is required';
        } else if (formData.title.trim().length < 3) {
            newErrors.title = 'Deal title must be at least 3 characters';
        }

        // Description validation
        if (!formData.description || formData.description.trim().length === 0) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }

        // Date validation
        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            if (start >= end) {
                newErrors.end_date = 'End date must be after start date';
            }
        }

        // Price validation
        if (formData.original_price !== undefined && formData.original_price < 0) {
            newErrors.original_price = 'Original price cannot be negative';
        }
        if (formData.deal_price !== undefined && formData.deal_price < 0) {
            newErrors.deal_price = 'Deal price cannot be negative';
        }
        if (formData.original_price !== undefined && formData.deal_price !== undefined) {
            if (formData.deal_price > formData.original_price) {
                newErrors.deal_price = 'Deal price cannot be greater than original price';
            }
        }

        // Discount validation
        if (formData.discount_percentage !== undefined) {
            if (formData.discount_percentage < 0 || formData.discount_percentage > 100) {
                newErrors.discount_percentage = 'Discount must be between 0 and 100';
            }
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
            const folder = `business/${businessId}/deals`;
            const imageUrl = await uploadFile('business-gallery', file, folder);

            // Delete old image if editing and image changed
            if (isEditMode && oldImageUrl && oldImageUrl !== imageUrl && oldImageUrl.startsWith('http')) {
                try {
                    await deleteFileByUrl('business-gallery', oldImageUrl);
                } catch (deleteError) {
                    // Log but don't fail the upload
                    console.warn('Failed to delete old image:', deleteError);
                }
            }

            setFormData(prev => ({ ...prev, image_url: imageUrl }));
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
            // Format dates to ISO string
            const formatDateToISO = (dateStr?: string) => {
                if (!dateStr) return undefined;
                const date = new Date(dateStr);
                return date.toISOString();
            };

            // Calculate final status
            const finalStatus = calculateDealStatus(formData.start_date, formData.end_date);

            const dealToSave: Deal = {
                id: deal?.id || crypto.randomUUID(),
                business_id: businessId,
                title: formData.title!.trim(),
                description: formData.description!.trim(),
                image_url: formData.image_url || undefined,
                start_date: formatDateToISO(formData.start_date),
                end_date: formatDateToISO(formData.end_date),
                original_price: formData.original_price,
                deal_price: formData.deal_price,
                discount_percentage: formData.discount_percentage,
                status: finalStatus
            };

            await onSave(dealToSave);
            toast.success(isEditMode ? 'Deal updated successfully!' : 'Deal created successfully!');
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save deal';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b sticky top-0 bg-white z-10">
                        <h3 className="text-xl font-bold font-serif text-neutral-dark">
                            {isEditMode ? 'Edit Deal' : 'Create New Deal'}
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deal Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title || ''}
                                onChange={handleChange}
                                className={`mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary ${errors.title ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="e.g., Summer Special - 50% Off"
                                disabled={isSaving || isUploading}
                            />
                            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
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
                                placeholder="Describe your deal in detail..."
                                disabled={isSaving || isUploading}
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deal Image <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <div className="mt-1 flex items-center gap-4">
                                <div className="relative">
                                    <img
                                        src={imagePreview || formData.image_url || 'https://placehold.co/128x128/E6A4B4/FFFFFF?text=No+Image'}
                                        alt="Deal preview"
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
                                        htmlFor="deal-image-upload"
                                        className={`cursor-pointer bg-secondary text-white px-3 py-2 text-sm font-semibold rounded-md hover:opacity-90 inline-block ${isUploading || isSaving ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        {isUploading ? 'Uploading...' : 'Choose Image'}
                                    </label>
                                    <input
                                        id="deal-image-upload"
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

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date <span className="text-gray-400 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date || ''}
                                    onChange={handleChange}
                                    className={`mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary ${errors.start_date ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    disabled={isSaving || isUploading}
                                />
                                {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date <span className="text-gray-400 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date || ''}
                                    onChange={handleChange}
                                    className={`mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary ${errors.end_date ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    disabled={isSaving || isUploading}
                                />
                                {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
                            </div>
                        </div>

                        {/* Prices */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Original Price (VND) <span className="text-gray-400 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="number"
                                    name="original_price"
                                    value={formData.original_price || ''}
                                    onChange={handleChange}
                                    min="0"
                                    step="1000"
                                    className={`mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary ${errors.original_price ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="e.g., 1000000"
                                    disabled={isSaving || isUploading}
                                />
                                {errors.original_price && <p className="mt-1 text-sm text-red-600">{errors.original_price}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deal Price (VND) <span className="text-gray-400 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="number"
                                    name="deal_price"
                                    value={formData.deal_price || ''}
                                    onChange={handleChange}
                                    min="0"
                                    step="1000"
                                    className={`mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary ${errors.deal_price ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="e.g., 500000"
                                    disabled={isSaving || isUploading}
                                />
                                {errors.deal_price && <p className="mt-1 text-sm text-red-600">{errors.deal_price}</p>}
                            </div>
                        </div>

                        {/* Discount & Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount % <span className="text-gray-400 text-xs">(Auto-calculated)</span>
                                </label>
                                <input
                                    type="number"
                                    name="discount_percentage"
                                    value={formData.discount_percentage || ''}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    className={`mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary ${errors.discount_percentage ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Auto-calculated"
                                    disabled={isSaving || isUploading}
                                />
                                {errors.discount_percentage && <p className="mt-1 text-sm text-red-600">{errors.discount_percentage}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status <span className="text-gray-400 text-xs">(Auto-calculated from dates)</span>
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary border-gray-300"
                                    disabled={isSaving || isUploading}
                                >
                                    {Object.values(DealStatus).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Status is auto-calculated based on dates</p>
                            </div>
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
                                'Save Deal'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDealModal;




