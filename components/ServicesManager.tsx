import React, { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { Service } from '../types.ts';
import EditServiceModal from './EditServiceModal.tsx';

const ServicesManager: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { addService, updateService, deleteService, updateServicesOrder } = useBusinessData();

    const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
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

    const handleSaveService = (serviceToSave: Service) => {
        if (!currentBusiness) return;

        const promise = serviceToSave.business_id
            ? updateService(serviceToSave)
            : addService({ ...serviceToSave, business_id: currentBusiness.id });

        toast.promise(promise, {
            loading: 'Saving service...',
            success: 'Service saved successfully!',
            error: 'Failed to save service.'
        });
        
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this service?")) {
            const promise = deleteService(id);
            toast.promise(promise, {
                loading: 'Deleting service...',
                success: 'Service deleted.',
                error: 'Failed to delete service.'
            });
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
    
    const handleDragEnd = () => {
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
        updateServicesOrder(newServices); // Send update to backend
    };
    
    return (
        <div className="p-8">
            {isModalOpen && <EditServiceModal service={editingService} onSave={handleSaveService} onClose={() => setIsModalOpen(false)} />}
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                 <h2 className="text-2xl font-bold font-serif text-neutral-dark">Services Management</h2>
                 <button onClick={() => openModal(null)} className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90">
                    + Add New Service
                 </button>
            </div>

            <div className="space-y-3">
                {localServices.map((service, index) => (
                    <div 
                        key={service.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className="flex items-center gap-4 p-3 border rounded-md bg-white shadow-sm cursor-grab active:cursor-grabbing"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                        <img src={service.image_url} alt={service.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                        <div className="flex-grow">
                            <p className="font-semibold text-neutral-dark">{service.name}</p>
                            <p className="text-sm text-gray-500 truncate">{service.description}</p>
                        </div>
                        <p className="font-semibold text-primary w-32 text-right flex-shrink-0">{service.price}</p>
                        <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => openModal(service)} className="text-secondary font-semibold text-sm hover:underline">Edit</button>
                            <button onClick={() => handleDelete(service.id)} className="text-red-500 font-semibold text-sm hover:underline">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
            {localServices.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">You haven't added any services yet.</p>
                    <button onClick={() => openModal(null)} className="mt-4 bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90">
                        Add Your First Service
                    </button>
                </div>
            )}
        </div>
    );
};

export default ServicesManager;