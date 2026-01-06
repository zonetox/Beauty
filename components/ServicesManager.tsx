// C3.4 - Services Management (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { Service } from '../types.ts';
import EditServiceModal from './EditServiceModal.tsx';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';

const ServicesManager: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { addService, updateService, deleteService, updateServicesOrder } = useBusinessData();

    const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    
    // Local state for optimistic UI updates during drag-and-drop
    const [localServices, setLocalServices] = useState<Service[]>([]);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Sync local state when context data changes
    useEffect(() => {
        setLocalServices(currentBusiness?.services || []);
    }, [currentBusiness?.services]);

    const openModal = (service: Partial<Service> | null) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleSaveService = async (serviceToSave: Service) => {
        if (!currentBusiness) return;

        try {
            if (serviceToSave.business_id) {
                await updateService(serviceToSave);
            } else {
                await addService({ ...serviceToSave, business_id: currentBusiness.id });
            }
            setIsModalOpen(false);
        } catch (error) {
            // Error already handled in context with toast
            // Don't close modal on error
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
            try {
                await deleteService(id);
                // Success toast is handled in context
            } catch (error) {
                // Error already handled in context with toast
            }
        }
    };
    
    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        dragOverItem.current = index;
    };
    
    const handleDragEnd = async () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }

        const newServices = [...localServices];
        const draggedItemContent = newServices.splice(dragItem.current, 1)[0];
        newServices.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        
        setLocalServices(newServices); // Optimistic UI update
        
        // Send update to backend
        setIsReordering(true);
        try {
            await updateServicesOrder(newServices);
        } catch (error) {
            // Revert on error
            setLocalServices(currentBusiness?.services || []);
            toast.error('Failed to save service order. Please try again.');
        } finally {
            setIsReordering(false);
        }
    };
    
    // Empty state - no business found
    if (!currentBusiness) {
        return (
            <div className="p-8">
                <EmptyState
                    title="No business found"
                    message="Please select a business to manage services."
                />
            </div>
        );
    }

    return (
        <div className="p-8">
            {isModalOpen && (
                <EditServiceModal 
                    service={editingService} 
                    onSave={handleSaveService} 
                    onClose={() => setIsModalOpen(false)}
                    businessId={currentBusiness.id}
                />
            )}
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold font-serif text-neutral-dark">Services Management</h2>
                <button 
                    onClick={() => openModal(null)} 
                    className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isReordering}
                >
                    + Add New Service
                </button>
            </div>

            {localServices.length === 0 ? (
                <EmptyState
                    title="No services yet"
                    message="Get started by adding your first service to showcase what you offer."
                    action={
                        <button 
                            onClick={() => openModal(null)} 
                            className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90"
                        >
                            Add Your First Service
                        </button>
                    }
                />
            ) : (
                <div className="space-y-3">
                    {isReordering && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                            <p className="text-sm text-blue-800">Saving new order...</p>
                        </div>
                    )}
                    {localServices.map((service, index) => (
                        <div 
                            key={service.id}
                            draggable={!isReordering}
                            onDragStart={(e) => !isReordering && handleDragStart(e, index)}
                            onDragEnter={(e) => !isReordering && handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => !isReordering && e.preventDefault()}
                            className={`flex items-center gap-4 p-3 border rounded-md bg-white shadow-sm ${
                                isReordering ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                            <img 
                                src={service.image_url || 'https://placehold.co/128x128/E6A4B4/FFFFFF?text=No+Image'} 
                                alt={service.name} 
                                className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/128x128/E6A4B4/FFFFFF?text=No+Image';
                                }}
                            />
                            <div className="flex-grow">
                                <p className="font-semibold text-neutral-dark">{service.name}</p>
                                <p className="text-sm text-gray-500 truncate">{service.description || 'No description'}</p>
                                {service.duration_minutes && (
                                    <p className="text-xs text-gray-400 mt-1">Duration: {service.duration_minutes} minutes</p>
                                )}
                            </div>
                            <p className="font-semibold text-primary w-32 text-right flex-shrink-0">{service.price}</p>
                            <div className="flex gap-2 flex-shrink-0">
                                <button 
                                    onClick={() => openModal(service)} 
                                    className="text-secondary font-semibold text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isReordering}
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(service.id)} 
                                    className="text-red-500 font-semibold text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isReordering}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ServicesManager;