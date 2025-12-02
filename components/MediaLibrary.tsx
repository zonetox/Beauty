import React, { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth } from '../contexts/BusinessAuthContext.tsx';
import { useBusinessData, useMembershipPackageData } from '../contexts/BusinessDataContext.tsx';
import { MediaItem, MediaCategory, MediaType } from '../types.ts';

// --- Reusable Components ---
const StatDisplay: React.FC<{ label: string; value: number; limit: number }> = ({ label, value, limit }) => {
    const percentage = limit > 0 ? (value / limit) * 100 : 0;
    return (
        <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-xs font-semibold text-gray-500">{value} / {limit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const EditMediaModal: React.FC<{ item: MediaItem; onSave: (updatedItem: MediaItem) => void; onClose: () => void; }> = ({ item, onSave, onClose }) => {
    const [formData, setFormData] = useState(item);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-bold font-serif text-neutral-dark">Edit Media Details</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="w-full max-h-64 flex justify-center bg-gray-100 rounded-md">
                             {item.type === MediaType.IMAGE ? (
                                <img src={item.url} alt="Media preview" className="w-auto h-auto max-w-full max-h-64 object-contain" />
                             ) : (
                                <video src={item.url} controls className="w-full h-auto max-h-64" />
                             )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2">
                                {Object.values(MediaCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const MediaLibrary: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { addMediaItem, updateMediaItem, deleteMediaItem, updateMediaOrder } = useBusinessData();
    const { packages } = useMembershipPackageData();

    const [activeFilter, setActiveFilter] = useState<MediaCategory | 'all'>('all');
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

    // Local state for optimistic UI updates during drag-and-drop
    const [localMedia, setLocalMedia] = useState<MediaItem[]>([]);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    
    // Sync local state when context data changes
    useEffect(() => {
        setLocalMedia(currentBusiness?.gallery || []);
    }, [currentBusiness?.gallery]);

    const currentPackage = useMemo(() => packages.find(p => p.tier === currentBusiness?.membershipTier), [packages, currentBusiness]);

    const photoCount = useMemo(() => localMedia.filter(item => item.type === MediaType.IMAGE).length, [localMedia]);
    const videoCount = useMemo(() => localMedia.filter(item => item.type === MediaType.VIDEO).length, [localMedia]);

    const filteredMedia = useMemo(() => {
        if (activeFilter === 'all') return localMedia;
        return localMedia.filter(item => item.category === activeFilter);
    }, [localMedia, activeFilter]);

    // --- Upload Handlers ---
    const handleFileUpload = async (files: FileList) => {
        if (!currentPackage || !currentBusiness) return;
        const fileArray = Array.from(files);
        
        const uploadPromises: Promise<any>[] = [];
        let currentPhotoCount = photoCount;
        let currentVideoCount = videoCount;

        for (const file of fileArray) {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (isImage && currentPhotoCount < currentPackage.permissions.photoLimit) {
                uploadPromises.push(addMediaItem(file, currentBusiness.id));
                currentPhotoCount++;
            } else if (isImage) {
                toast.error(`Photo limit reached. Some images were not uploaded.`);
            }

            if (isVideo && currentVideoCount < currentPackage.permissions.videoLimit) {
                uploadPromises.push(addMediaItem(file, currentBusiness.id));
                currentVideoCount++;
            } else if (isVideo) {
                 toast.error(`Video limit reached. Some videos were not uploaded.`);
            }
        }
        
        if (uploadPromises.length > 0) {
            toast.promise(Promise.all(uploadPromises), {
                loading: `Uploading ${uploadPromises.length} file(s)...`,
                success: 'Files uploaded successfully!',
                error: 'An error occurred during upload.'
            });
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (e.dataTransfer.files) {
            handleFileUpload(e.dataTransfer.files);
        }
    };
    
    // --- Item Actions ---
    const handleDelete = (item: MediaItem) => {
        if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
            const promise = deleteMediaItem(item);
            toast.promise(promise, {
                loading: 'Deleting media...',
                success: 'Media deleted.',
                error: 'Failed to delete media.'
            });
        }
    };

    const handleEditSave = (updatedItem: MediaItem) => {
        const promise = updateMediaItem(updatedItem);
        toast.promise(promise, {
            loading: 'Saving details...',
            success: 'Details saved.',
            error: 'Failed to save details.'
        });
        setEditingItem(null);
    };
    
    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        // Find the index in the original unfiltered array
        const originalIndex = localMedia.findIndex(item => item.id === filteredMedia[index].id);
        dragItem.current = originalIndex;
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
         // Find the index in the original unfiltered array
        const originalIndex = localMedia.findIndex(item => item.id === filteredMedia[index].id);
        dragOverItem.current = originalIndex;
    };
    
    const handleDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }

        const newMedia = [...localMedia];
        const draggedItemContent = newMedia.splice(dragItem.current, 1)[0];
        newMedia.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        
        setLocalMedia(newMedia); // Optimistic UI update
        updateMediaOrder(newMedia); // Send update to backend
    };

    const canDrag = activeFilter === 'all';


    if (!currentBusiness || !currentPackage) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            {editingItem && <EditMediaModal item={editingItem} onSave={handleEditSave} onClose={() => setEditingItem(null)} />}

            <h2 className="text-2xl font-bold font-serif text-neutral-dark mb-2">Media Library</h2>
            <p className="text-gray-500 mb-6">Manage all photos and videos for your landing page.</p>

            <div className="bg-gray-50 p-4 rounded-lg border flex flex-col md:flex-row gap-6 mb-6">
                <StatDisplay label="Photos" value={photoCount} limit={currentPackage.permissions.photoLimit} />
                <StatDisplay label="Videos" value={videoCount} limit={currentPackage.permissions.videoLimit} />
            </div>

            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-8 ${isDraggingOver ? 'border-primary bg-primary/10' : 'border-gray-300 bg-white'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDrop}
            >
                <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    accept="image/png, image/jpeg, image/webp, video/mp4, video/webm, video/quicktime"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                    <p className="font-semibold text-neutral-dark">Drag & drop files here</p>
                    <p className="text-gray-500 text-sm mt-1">or click to browse</p>
                    <p className="text-xs text-gray-400 mt-2">Images (JPG, PNG, WEBP) and Videos (MP4, WEBM) supported.</p>
                </label>
            </div>
            
            <div className="border-b mb-6">
                <nav className="flex space-x-4">
                    {['all', ...Object.values(MediaCategory)].map(cat => (
                        <button key={cat} onClick={() => setActiveFilter(cat as any)} className={`px-3 py-2 text-sm font-medium rounded-t-md capitalize ${activeFilter === cat ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-neutral-dark'}`}>
                            {cat}
                        </button>
                    ))}
                </nav>
                {!canDrag && <p className="text-xs text-yellow-600 pt-2">Sorting is only available in the 'All' view.</p>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredMedia.map((item, index) => (
                    <div
                        key={item.id}
                        draggable={canDrag}
                        onDragStart={(e) => canDrag && handleDragStart(e, index)}
                        onDragEnter={(e) => canDrag && handleDragEnter(e, index)}
                        onDragEnd={canDrag ? handleDragEnd : undefined}
                        onDragOver={(e) => canDrag && e.preventDefault()}
                        className={`group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                        {item.type === MediaType.IMAGE ? (
                            <img src={item.url} alt={item.title || 'Media item'} className="w-full h-full object-cover" />
                        ) : (
                            <video src={item.url} className="w-full h-full object-cover bg-black" muted playsInline />
                        )}

                        {item.type === MediaType.VIDEO && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/80" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            <p className="text-white text-xs font-semibold truncate">{item.title || 'Untitled'}</p>
                            <div className="flex justify-end gap-1">
                                <button onClick={() => setEditingItem(item)} className="bg-white/80 rounded-full p-1.5 hover:bg-white text-neutral-dark">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                </button>
                                <button onClick={() => handleDelete(item)} className="bg-red-500/80 rounded-full p-1.5 hover:bg-red-500 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
             {filteredMedia.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No media found in this category.</p>
                </div>
            )}
        </div>
    );
};

export default MediaLibrary;