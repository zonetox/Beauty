
import React, { useState } from 'react';
import { Service } from '../types.ts';

interface EditServiceModalProps {
    service: Partial<Service> | null;
    onSave: (service: Service) => void;
    onClose: () => void;
}

// Helper to convert a file blob to a Base64 string
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const EditServiceModal: React.FC<EditServiceModalProps> = ({ service, onSave, onClose }) => {
    // FIX: Changed 'imageUrl' to 'image_url' to match the Service type.
    const [formData, setFormData] = useState<Partial<Service>>(service || {
        name: '',
        description: '',
        image_url: '',
        price: ''
    });

    const isEditMode = Boolean(service && service.id);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

     const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await blobToBase64(file);
            // FIX: Changed 'imageUrl' to 'image_url' to match the Service type.
            setFormData(prev => ({ ...prev, image_url: base64 as string }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.price && formData.description && formData.image_url) {
            onSave({
                id: formData.id || crypto.randomUUID(),
                ...formData
            } as Service);
        } else {
            alert('Please fill out all fields, including the image.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-bold font-serif text-neutral-dark">
                            {isEditMode ? 'Edit Service' : 'Add New Service'}
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Service Name</label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Image</label>
                            <div className="mt-1 flex items-center gap-4">
                                {/* FIX: Changed 'imageUrl' to 'image_url' to match the Service type. */}
                                <img src={formData.image_url || 'https://placehold.co/128x128/E6A4B4/FFFFFF?text=Img'} alt="Service preview" className="w-24 h-24 object-cover rounded-md border bg-gray-100" />
                                <label htmlFor="service-image-upload" className="cursor-pointer bg-secondary text-white px-3 py-2 text-sm font-semibold rounded-md hover:opacity-90">
                                    Choose File
                                </label>
                                <input id="service-image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" value={formData.description || ''} onChange={handleChange} required rows={3} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price / Price Range</label>
                            <input type="text" name="price" value={formData.price || ''} onChange={handleChange} required placeholder="e.g., 500,000đ or Contact Us" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold">Save Service</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditServiceModal;
