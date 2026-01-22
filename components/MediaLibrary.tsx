// C3.6 - Media Management (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { useBusinessData, useMembershipPackageData } from '../contexts/BusinessDataContext.tsx';
import { MediaItem, MediaCategory, MediaType } from '../types.ts';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';
import EditMediaModal from './EditMediaModal.tsx';
import ConfirmDialog from './ConfirmDialog.tsx';

// --- Reusable Components ---
const StatDisplay: React.FC<{ label: string; value: number; limit: number }> = ({ label, value, limit }) => {
    const percentage = limit > 0 ? (value / limit) * 100 : 0;
    const isOverLimit = value > limit;
    return (
        <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className={`text-xs font-semibold ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
                    {value} / {limit}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full ${isOverLimit ? 'bg-red-500' : 'bg-primary'}`}
                    /* Dynamic width calculation - CSS inline necessary for dynamic percentages */
                    style={{ width: `${Math.min(percentage, 100)}%`, minWidth: '2px' }}
                ></div>
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
    const [isReordering, setIsReordering] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map()); // file name -> progress
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; item: MediaItem | null }>({ isOpen: false, item: null });

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
        if (!currentPackage || !currentBusiness) {
            toast.error('Business or package information not available');
            return;
        }

        const fileArray = Array.from(files);
        const validFiles: File[] = [];
        const errors: string[] = [];

        // Validate files
        for (const file of fileArray) {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (!isImage && !isVideo) {
                errors.push(`${file.name}: Invalid file type. Only images and videos are supported.`);
                continue;
            }

            // File size validation
            const maxImageSize = 10 * 1024 * 1024; // 10MB
            const maxVideoSize = 50 * 1024 * 1024; // 50MB

            if (isImage && file.size > maxImageSize) {
                errors.push(`${file.name}: Image size exceeds 10MB limit.`);
                continue;
            }

            if (isVideo && file.size > maxVideoSize) {
                errors.push(`${file.name}: Video size exceeds 50MB limit.`);
                continue;
            }

            // Check limits
            if (isImage && photoCount >= currentPackage.permissions.photoLimit) {
                errors.push(`${file.name}: Photo limit (${currentPackage.permissions.photoLimit}) reached.`);
                continue;
            }

            if (isVideo && videoCount >= currentPackage.permissions.videoLimit) {
                errors.push(`${file.name}: Video limit (${currentPackage.permissions.videoLimit}) reached.`);
                continue;
            }

            validFiles.push(file);
        }

        // Show errors
        if (errors.length > 0) {
            errors.forEach(error => toast.error(error));
        }

        if (validFiles.length === 0) {
            return;
        }

        // Upload valid files
        const uploadPromises: Promise<void>[] = [];
        const uploadProgress = new Map<string, number>();

        for (const file of validFiles) {
            uploadProgress.set(file.name, 0);
            setUploadingFiles(new Map(uploadProgress));

            try {
                // Simulate progress (actual upload doesn't provide progress in current implementation)
                const progressInterval = setInterval(() => {
                    const currentProgress = uploadProgress.get(file.name) || 0;
                    const newProgress = Math.min(currentProgress + 10, 90);
                    uploadProgress.set(file.name, newProgress);
                    setUploadingFiles(new Map(uploadProgress));
                }, 200);

                await addMediaItem(file, currentBusiness.id);

                clearInterval(progressInterval);
                uploadProgress.set(file.name, 100);
                setUploadingFiles(new Map(uploadProgress));

                // Remove from progress after a short delay
                setTimeout(() => {
                    uploadProgress.delete(file.name);
                    setUploadingFiles(new Map(uploadProgress));
                }, 500);
            } catch (error) {
                uploadProgress.delete(file.name);
                setUploadingFiles(new Map(uploadProgress));
                const message = error instanceof Error ? error.message : 'Failed to upload file';
                toast.error(`${file.name}: ${message}`);
            }
        }

        if (uploadPromises.length > 0) {
            try {
                await Promise.all(uploadPromises);
                toast.success(`Successfully uploaded ${validFiles.length} file(s)!`);
            } catch {
                // Individual errors already handled above
            }
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    // --- Item Actions ---
    const handleDelete = async (item: MediaItem) => {
        setConfirmDelete({ isOpen: true, item });
    };

    const confirmDeleteItem = async () => {
        if (!confirmDelete.item) return;

        setIsDeleting(confirmDelete.item.id);
        try {
            await deleteMediaItem(confirmDelete.item);
            // Success toast is handled in context
        } catch {
            // Error already handled in context with toast
        } finally {
            setIsDeleting(null);
            setConfirmDelete({ isOpen: false, item: null });
        }
    };

    const handleEditSave = async (updatedItem: MediaItem) => {
        try {
            await updateMediaItem(updatedItem);
            setEditingItem(null);
            // Success toast is handled in context
        } catch {
            // Error already handled in context with toast
            // Don't close modal on error
        }
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        const filteredItem = filteredMedia[index];
        if (filteredItem?.id) {
            const originalIndex = localMedia.findIndex(item => item?.id === filteredItem.id);
            dragItem.current = originalIndex;
        }
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        const filteredItem = filteredMedia[index];
        if (filteredItem?.id) {
            const originalIndex = localMedia.findIndex(item => item?.id === filteredItem.id);
            dragOverItem.current = originalIndex;
        }
    };

    const handleDragEnd = async () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }

        const newMedia = [...localMedia];
        const draggedItemContent = newMedia.splice(dragItem.current, 1)[0];
        if (draggedItemContent) {
            newMedia.splice(dragOverItem.current, 0, draggedItemContent);
        }

        dragItem.current = null;
        dragOverItem.current = null;

        setLocalMedia(newMedia); // Optimistic UI update

        // Send update to backend
        setIsReordering(true);
        try {
            await updateMediaOrder(newMedia);
        } catch {
            // Revert on error
            setLocalMedia(currentBusiness?.gallery || []);
            toast.error('Failed to save media order. Please try again.');
        } finally {
            setIsReordering(false);
        }
    };

    const canDrag = activeFilter === 'all' && !isReordering;

    // Loading state
    if (!currentBusiness) {
        return (
            <div className="p-8">
                <EmptyState
                    title="No business found"
                    message="Please select a business to manage media."
                />
            </div>
        );
    }

    if (!currentPackage) {
        return (
            <div className="p-8">
                <LoadingState message="Loading package information..." />
            </div>
        );
    }

    return (
        <div className="p-8">
            {editingItem && (
                <EditMediaModal
                    item={editingItem}
                    onSave={handleEditSave}
                    onClose={() => setEditingItem(null)}
                />
            )}

            <h2 className="text-2xl font-bold font-serif text-neutral-dark mb-2">Media Library</h2>
            <p className="text-gray-500 mb-6">Manage all photos and videos for your landing page.</p>

            <div className="bg-gray-50 p-4 rounded-lg border flex flex-col md:flex-row gap-6 mb-6">
                <StatDisplay label="Photos" value={photoCount} limit={currentPackage.permissions.photoLimit} />
                <StatDisplay label="Videos" value={videoCount} limit={currentPackage.permissions.videoLimit} />
            </div>

            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-8 ${isDraggingOver ? 'border-primary bg-primary/10' : 'border-gray-300 bg-white'
                    } ${uploadingFiles.size > 0 ? 'opacity-50 pointer-events-none' : ''}`}
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
                    disabled={uploadingFiles.size > 0}
                />
                <label
                    htmlFor="file-upload"
                    className={`cursor-pointer ${uploadingFiles.size > 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                    <p className="font-semibold text-neutral-dark">Drag & drop files here</p>
                    <p className="text-gray-500 text-sm mt-1">or click to browse</p>
                    <p className="text-xs text-gray-400 mt-2">Images (JPG, PNG, WEBP, max 10MB) and Videos (MP4, WEBM, max 50MB) supported.</p>
                </label>
                {uploadingFiles.size > 0 && (
                    <div className="mt-4 space-y-2">
                        {Array.from(uploadingFiles.entries()).map(([fileName, progress]) => (
                            <div key={fileName} className="text-left">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span className="truncate">{fileName}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        /* Dynamic progress - CSS inline necessary for upload progress calculation */
                                        style={{ width: `${progress}%`, minWidth: '2px' }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-b mb-6">
                <nav className="flex space-x-4">
                    {['all', ...Object.values(MediaCategory)].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveFilter(cat as any)}
                            className={`px-3 py-2 text-sm font-medium rounded-t-md capitalize transition-colors ${activeFilter === cat
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-gray-500 hover:text-neutral-dark'
                                }`}
                            disabled={isReordering}
                        >
                            {cat}
                        </button>
                    ))}
                </nav>
                {!canDrag && activeFilter !== 'all' && (
                    <p className="text-xs text-yellow-600 pt-2">Sorting is only available in the &apos;All&apos; view.</p>
                )}
                {isReordering && (
                    <p className="text-xs text-blue-600 pt-2">Saving new order...</p>
                )}
            </div>

            {filteredMedia.length === 0 ? (
                <EmptyState
                    title={activeFilter === 'all' ? 'No media yet' : `No media in ${activeFilter} category`}
                    message={activeFilter === 'all'
                        ? 'Get started by uploading your first photos or videos to showcase your business.'
                        : 'Try selecting a different category or upload new media.'}
                    action={activeFilter === 'all' ? (
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90 inline-block"
                        >
                            Upload Your First Media
                        </label>
                    ) : undefined}
                />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredMedia.map((item, index) => (
                        <div
                            key={item.id}
                            draggable={canDrag}
                            onDragStart={(e) => canDrag && handleDragStart(e, index)}
                            onDragEnter={(e) => canDrag && handleDragEnter(e, index)}
                            onDragEnd={canDrag ? handleDragEnd : undefined}
                            onDragOver={(e) => canDrag && e.preventDefault()}
                            className={`group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''
                                } ${isDeleting === item.id ? 'opacity-50' : ''}`}
                        >
                            {item.type === MediaType.IMAGE ? (
                                <img
                                    src={item.url}
                                    alt={item.title || 'Media item'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/E6A4B4/FFFFFF?text=Image+Error';
                                    }}
                                />
                            ) : (
                                <video
                                    src={item.url}
                                    className="w-full h-full object-cover bg-black"
                                    muted
                                    playsInline
                                    onError={(e) => {
                                        (e.target as HTMLVideoElement).style.display = 'none';
                                    }}
                                />
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
                                    <button
                                        onClick={() => setEditingItem(item)}
                                        className="bg-white/80 rounded-full p-1.5 hover:bg-white text-neutral-dark disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isDeleting !== null || isReordering}
                                        title="Edit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item)}
                                        className="bg-red-500/80 rounded-full p-1.5 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isDeleting === item.id || isDeleting !== null || isReordering}
                                        title="Delete"
                                    >
                                        {isDeleting === item.id ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                title="Delete Media Item"
                message="Are you sure you want to delete this media item? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDeleteItem}
                onCancel={() => setConfirmDelete({ isOpen: false, item: null })}
            />
        </div>
    );
};

export default MediaLibrary;
