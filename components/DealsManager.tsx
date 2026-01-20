// C3.5 - Deals Management (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth, useDealsData } from '../contexts/BusinessContext.tsx';
import { Deal, DealStatus } from '../types.ts';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';
import EditDealModal from './EditDealModal.tsx';
import ConfirmDialog from './ConfirmDialog.tsx';

// Helper function to calculate deal status based on dates
const calculateDealStatus = (deal: Deal): DealStatus => {
    const now = new Date();
    const startDate = deal.start_date ? new Date(deal.start_date) : null;
    const endDate = deal.end_date ? new Date(deal.end_date) : null;

    if (startDate && startDate > now) {
        return DealStatus.SCHEDULED;
    }
    if (endDate && endDate < now) {
        return DealStatus.EXPIRED;
    }
    if (startDate && endDate && startDate <= now && endDate >= now) {
        return DealStatus.ACTIVE;
    }
    // Default to ACTIVE if no dates provided
    return DealStatus.ACTIVE;
};

const DealsManager: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { addDeal, updateDeal, deleteDeal } = useDealsData();

    const [editingDeal, setEditingDeal] = useState<Partial<Deal> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; dealId: string | null }>({ isOpen: false, dealId: null });

    // Calculate status for each deal and memoize
    const dealsWithStatus = useMemo(() => {
        if (!currentBusiness?.deals) return [];
        
        return currentBusiness.deals.map(deal => {
            const calculatedStatus = calculateDealStatus(deal);
            // Use calculated status if deal doesn't have explicit status or if dates changed
            const shouldUpdateStatus = !deal.status || 
                (deal.start_date || deal.end_date) && calculatedStatus !== deal.status;
            
            return {
                ...deal,
                displayStatus: shouldUpdateStatus ? calculatedStatus : deal.status,
                needsStatusUpdate: shouldUpdateStatus && calculatedStatus !== deal.status
            };
        });
    }, [currentBusiness?.deals]);

    // Auto-update status for deals that need it
    useEffect(() => {
        const dealsToUpdate = dealsWithStatus.filter(d => d.needsStatusUpdate);
        if (dealsToUpdate.length > 0) {
            // Update status for deals that need it
            dealsToUpdate.forEach(async (deal) => {
                try {
                    await updateDeal({
                        ...deal,
                        status: deal.displayStatus
                    } as Deal);
                } catch (error) {
                    // Silent fail - status will be recalculated on next render
                    console.warn('Failed to auto-update deal status:', error);
                }
            });
        }
    }, [dealsWithStatus, updateDeal]);

    if (!currentBusiness) {
        return (
            <div className="p-8">
                <EmptyState
                    title="No business found"
                    message="Please select a business to manage deals."
                />
            </div>
        );
    }

    const openModal = (deal: Partial<Deal> | null) => {
        setEditingDeal(deal);
        setIsModalOpen(true);
    };

    const handleSaveDeal = async (dealData: Deal) => {
        try {
            // Calculate status based on dates if not explicitly set
            const finalStatus = dealData.status || calculateDealStatus(dealData);
            const dealToSave = {
                ...dealData,
                status: finalStatus,
                business_id: currentBusiness.id
            };

            if (dealData.id) {
                await updateDeal(dealToSave as Deal);
            } else {
                await addDeal(dealToSave as Omit<Deal, 'id'>);
            }
            setIsModalOpen(false);
        } catch (error) {
            // Error already handled in context with toast
            // Don't close modal on error
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmDelete({ isOpen: true, dealId: id });
    };

    const confirmDeleteDeal = async () => {
        if (!confirmDelete.dealId) return;
        
        setIsDeleting(confirmDelete.dealId);
        try {
            await deleteDeal(confirmDelete.dealId);
            // Success toast is handled in context
        } catch (error) {
            // Error already handled in context with toast
        } finally {
            setIsDeleting(null);
            setConfirmDelete({ isOpen: false, dealId: null });
        }
    };

    const getStatusBadgeClass = (status: DealStatus) => {
        switch (status) {
            case DealStatus.ACTIVE:
                return 'bg-green-100 text-green-800';
            case DealStatus.EXPIRED:
                return 'bg-red-100 text-red-800';
            case DealStatus.SCHEDULED:
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-8">
            {isModalOpen && (
                <EditDealModal 
                    deal={editingDeal} 
                    onSave={handleSaveDeal} 
                    onClose={() => setIsModalOpen(false)}
                    businessId={currentBusiness.id}
                />
            )}
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold font-serif text-neutral-dark">Deals Management</h2>
                <button 
                    onClick={() => openModal(null)} 
                    className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isDeleting !== null}
                >
                    + Add New Deal
                </button>
            </div>

            {dealsWithStatus.length === 0 ? (
                <EmptyState
                    title="No deals yet"
                    message="Get started by creating your first deal to attract more customers."
                    action={
                        <button 
                            onClick={() => openModal(null)} 
                            className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90"
                        >
                            Create Your First Deal
                        </button>
                    }
                />
            ) : (
                <div className="space-y-3">
                    {dealsWithStatus.map(deal => (
                        <div 
                            key={deal.id} 
                            className="flex items-center gap-4 p-3 border rounded-md bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            {deal.image_url && (
                                <img 
                                    src={deal.image_url} 
                                    alt={deal.title} 
                                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            )}
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold text-neutral-dark">{deal.title}</p>
                                <p className="text-sm text-gray-500 truncate">{deal.description || 'No description'}</p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                    {deal.start_date && (
                                        <span>Start: {new Date(deal.start_date).toLocaleDateString()}</span>
                                    )}
                                    {deal.end_date && (
                                        <span>End: {new Date(deal.end_date).toLocaleDateString()}</span>
                                    )}
                                    {deal.deal_price && deal.original_price && (
                                        <span className="text-primary font-semibold">
                                            {deal.deal_price.toLocaleString('vi-VN')}đ 
                                            {deal.original_price > deal.deal_price && (
                                                <span className="text-gray-400 line-through ml-1">
                                                    {deal.original_price.toLocaleString('vi-VN')}đ
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${getStatusBadgeClass(deal.displayStatus)}`}>
                                {deal.displayStatus}
                            </span>
                            <div className="flex gap-2 flex-shrink-0">
                                <button 
                                    onClick={() => openModal(deal)} 
                                    className="text-secondary font-semibold text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isDeleting !== null}
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(deal.id)} 
                                    className="text-red-500 font-semibold text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isDeleting === deal.id || isDeleting !== null}
                                >
                                    {isDeleting === deal.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                title="Delete Deal"
                message="Are you sure you want to delete this deal? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDeleteDeal}
                onCancel={() => setConfirmDelete({ isOpen: false, dealId: null })}
            />
        </div>
    );
};

export default DealsManager;
