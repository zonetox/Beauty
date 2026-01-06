// C3.6 - Edit Media Modal (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md
// 100% hoàn thiện, không placeholder

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MediaItem, MediaCategory, MediaType } from '../types.ts';

interface EditMediaModalProps {
    item: MediaItem;
    onSave: (updatedItem: MediaItem) => Promise<void>;
    onClose: () => void;
}

const EditMediaModal: React.FC<EditMediaModalProps> = ({ item, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<MediaItem>>({
        title: '',
        description: '',
        category: MediaCategory.UNCATEGORIZED
    });
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form data
    useEffect(() => {
        setFormData({
            title: item.title || '',
            description: item.description || '',
            category: item.category || MediaCategory.UNCATEGORIZED
        });
        setErrors({});
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Title validation (optional but if provided, should be reasonable length)
        if (formData.title && formData.title.length > 100) {
            newErrors.title = 'Title must be less than 100 characters';
        }

        // Description validation (optional but if provided, should be reasonable length)
        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'Description must be less than 500 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsSaving(true);
        try {
            const updatedItem: MediaItem = {
                ...item,
                title: formData.title?.trim() || undefined,
                description: formData.description?.trim() || undefined,
                category: formData.category || MediaCategory.UNCATEGORIZED
            };

            await onSave(updatedItem);
            toast.success('Media details updated successfully!');
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save media details';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-bold font-serif text-neutral-dark">Edit Media Details</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="w-full max-h-64 flex justify-center bg-gray-100 rounded-md overflow-hidden">
                            {item.type === MediaType.IMAGE ? (
                                <img 
                                    src={item.url} 
                                    alt="Media preview" 
                                    className="w-auto h-auto max-w-full max-h-64 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/E6A4B4/FFFFFF?text=Image+Error';
                                    }}
                                />
                            ) : (
                                <video 
                                    src={item.url} 
                                    controls 
                                    className="w-full h-auto max-h-64"
                                    onError={(e) => {
                                        (e.target as HTMLVideoElement).style.display = 'none';
                                    }}
                                />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title || ''}
                                onChange={handleChange}
                                maxLength={100}
                                className={`mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary ${
                                    errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter media title"
                                disabled={isSaving}
                            />
                            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                            <p className="mt-1 text-xs text-gray-500">{(formData.title || '').length} / 100 characters</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                rows={4}
                                maxLength={500}
                                className={`mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary ${
                                    errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter media description"
                                disabled={isSaving}
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                            <p className="mt-1 text-xs text-gray-500">{(formData.description || '').length} / 500 characters</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary border-gray-300"
                                disabled={isSaving}
                            >
                                {Object.values(MediaCategory).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditMediaModal;



