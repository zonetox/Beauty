import React, { useState, useMemo } from 'react';
import { Business, MembershipTier } from '../types.ts';
import ConfirmDialog from './ConfirmDialog.tsx';

// --- SVG Icons for Sorting ---
const SortAscIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
);

const SortDescIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const SortIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
    </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg className={`w-4 h-4 ${className}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


interface BusinessManagementTableProps {
    businesses: Business[];
    onEdit: (business: Business) => void;
    onUpdate: (business: Business) => void;
    onDelete: (businessId: number) => void;
    onDuplicate: (business: Business) => void;
}

type SortKey = 'name' | 'rating' | 'viewCount';

const BusinessManagementTable: React.FC<BusinessManagementTableProps> = ({ businesses, onEdit, onUpdate, onDelete, onDuplicate }) => {
    const [selectedBusinessIds, setSelectedBusinessIds] = useState<number[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
    const [confirmDialog, setConfirmDialog] = useState<{ 
        isOpen: boolean; 
        type: 'verify' | 'toggle' | 'delete' | null; 
        businessId?: number;
        businessName?: string;
        count?: number;
    }>({ isOpen: false, type: null });

    const sortedBusinesses = useMemo(() => {
        const sortableItems = [...businesses];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (sortConfig.key === 'name') {
                    return sortConfig.direction === 'asc' 
                        ? a.name.localeCompare(b.name) 
                        : b.name.localeCompare(a.name);
                }
                if (sortConfig.key === 'rating') {
                    return sortConfig.direction === 'asc' 
                        ? a.rating - b.rating 
                        : b.rating - a.rating;
                }
                if (sortConfig.key === 'viewCount') {
                    return sortConfig.direction === 'asc'
                        ? (a.viewCount || 0) - (b.viewCount || 0)
                        : (b.viewCount || 0) - (a.viewCount || 0);
                }
                return 0;
            });
        }
        return sortableItems;
    }, [businesses, sortConfig]);

    const requestSort = (key: SortKey) => {
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            setSortConfig({ key, direction: 'desc' });
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            setSortConfig({ key: null, direction: 'asc' });
        } else {
            setSortConfig({ key, direction: 'asc' });
        }
    };

    const handleTierChange = (business: Business, newTier: MembershipTier) => {
        onUpdate({ ...business, membershipTier: newTier });
    };

    const handleStatusToggle = (business: Business) => {
        onUpdate({ ...business, isActive: !business.isActive });
    };

    const handleVerificationToggle = (business: Business) => {
        onUpdate({ ...business, isVerified: !business.isVerified });
    };

    const handleFeaturedToggle = (business: Business) => {
        onUpdate({ ...business, isFeatured: !business.isFeatured });
    };

    const businessIds = useMemo(() => businesses.map(b => b.id), [businesses]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedBusinessIds(businessIds);
        } else {
            setSelectedBusinessIds([]);
        }
    };

    const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
        if (e.target.checked) {
            setSelectedBusinessIds(prev => [...prev, id]);
        } else {
            setSelectedBusinessIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };
    
    const handleVerifySelected = () => {
        setConfirmDialog({ isOpen: true, type: 'verify', count: selectedBusinessIds.length });
    };

    const confirmVerifySelected = () => {
        if (confirmDialog.type === 'verify' && confirmDialog.count) {
            selectedBusinessIds.forEach(id => {
                const businessToUpdate = businesses.find(b => b.id === id);
                if (businessToUpdate && !businessToUpdate.isVerified) {
                    onUpdate({ ...businessToUpdate, isVerified: true });
                }
            });
            setSelectedBusinessIds([]);
        }
        setConfirmDialog({ isOpen: false, type: null });
    };
    
    const handleToggleSelectedStatus = () => {
        setConfirmDialog({ isOpen: true, type: 'toggle', count: selectedBusinessIds.length });
    };

    const confirmToggleSelectedStatus = () => {
        if (confirmDialog.type === 'toggle' && confirmDialog.count) {
            selectedBusinessIds.forEach(id => {
                const businessToUpdate = businesses.find(b => b.id === id);
                if (businessToUpdate) {
                    onUpdate({ ...businessToUpdate, isActive: !businessToUpdate.isActive });
                }
            });
            setSelectedBusinessIds([]);
        }
        setConfirmDialog({ isOpen: false, type: null });
    };

    const isAllSelected = businessIds.length > 0 && selectedBusinessIds.length === businessIds.length;
    const isSomeSelected = selectedBusinessIds.length > 0 && selectedBusinessIds.length < businessIds.length;

    return (
        <>
            {/* Bulk Actions Bar */}
            {selectedBusinessIds.length > 0 && (
                <div className="bg-primary/10 p-3 rounded-lg mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="font-semibold text-neutral-dark text-sm">
                        {selectedBusinessIds.length} business{selectedBusinessIds.length > 1 ? 'es' : ''} selected.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button 
                            onClick={handleVerifySelected}
                            className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition-colors"
                        >
                            Verify Selected
                        </button>
                        <button
                            onClick={handleToggleSelectedStatus}
                            className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-md hover:bg-yellow-600 transition-colors"
                        >
                            Toggle Active Status
                        </button>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="p-4">
                                <div className="flex items-center">
                                    <input 
                                        id="checkbox-all" 
                                        type="checkbox"
                                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                                        checked={isAllSelected}
                                        ref={input => {
                                            if (input) input.indeterminate = isSomeSelected;
                                        }}
                                        onChange={handleSelectAll}
                                    />
                                    <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3">
                                <button onClick={() => requestSort('name')} className="flex items-center gap-1.5 group">
                                    Business Name
                                    {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <SortAscIcon /> : <SortDescIcon />) : <SortIcon className="text-gray-400 opacity-50 group-hover:opacity-100" />}
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3">
                                <button onClick={() => requestSort('rating')} className="flex items-center gap-1.5 group">
                                    Rating
                                    {sortConfig.key === 'rating' ? (sortConfig.direction === 'asc' ? <SortAscIcon /> : <SortDescIcon />) : <SortIcon className="text-gray-400 opacity-50 group-hover:opacity-100" />}
                                </button>
                            </th>
                             <th scope="col" className="px-6 py-3">
                                <button onClick={() => requestSort('viewCount')} className="flex items-center gap-1.5 group">
                                    Views
                                    {sortConfig.key === 'viewCount' ? (sortConfig.direction === 'asc' ? <SortAscIcon /> : <SortDescIcon />) : <SortIcon className="text-gray-400 opacity-50 group-hover:opacity-100" />}
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3">Membership Tier</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Verified</th>
                            <th scope="col" className="px-6 py-3">Featured</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedBusinesses.map(business => (
                            <tr key={business.id} className={`bg-white border-b hover:bg-gray-50 ${selectedBusinessIds.includes(business.id) ? 'bg-primary/5' : ''}`}>
                                <td className="w-4 p-4">
                                    <div className="flex items-center">
                                        <input 
                                            id={`checkbox-table-${business.id}`} 
                                            type="checkbox"
                                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                                            checked={selectedBusinessIds.includes(business.id)}
                                            onChange={(e) => handleSelectOne(e, business.id)}
                                        />
                                        <label htmlFor={`checkbox-table-${business.id}`} className="sr-only">checkbox</label>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-neutral-dark whitespace-nowrap">{business.name}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <StarIcon className="text-primary mr-1" />
                                        {business.rating.toFixed(1)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-600">
                                    {(business.viewCount || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={business.membershipTier} 
                                        onChange={(e) => handleTierChange(business, e.target.value as MembershipTier)}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2"
                                    >
                                        {Object.values(MembershipTier).map(tier => (
                                            <option key={tier} value={tier}>{tier}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${business.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {business.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${business.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {business.isVerified ? 'Verified' : 'Not Verified'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <label htmlFor={`featured-toggle-${business.id}`} className="inline-flex relative items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            id={`featured-toggle-${business.id}`} 
                                            className="sr-only peer" 
                                            checked={business.isFeatured || false} 
                                            onChange={() => handleFeaturedToggle(business)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </td>
                                <td className="px-6 py-4 flex items-center gap-2 flex-wrap">
                                    <button onClick={() => onEdit(business)} className="font-medium text-secondary hover:underline">Edit</button>
                                     <button onClick={() => onDuplicate(business)} className="font-medium text-blue-600 hover:underline">Duplicate</button>
                                    <button 
                                        onClick={() => setConfirmDialog({ isOpen: true, type: 'delete', businessId: business.id, businessName: business.name })}
                                        className="font-medium text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ConfirmDialog
                isOpen={confirmDialog.isOpen && confirmDialog.type === 'verify'}
                title="Verify Businesses"
                message={confirmDialog.count ? `Are you sure you want to verify ${confirmDialog.count} selected businesses?` : ''}
                confirmText="Verify"
                cancelText="Cancel"
                variant="info"
                onConfirm={confirmVerifySelected}
                onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
            />
            <ConfirmDialog
                isOpen={confirmDialog.isOpen && confirmDialog.type === 'toggle'}
                title="Toggle Active Status"
                message={confirmDialog.count ? `Are you sure you want to toggle the active status for ${confirmDialog.count} selected businesses?` : ''}
                confirmText="Toggle"
                cancelText="Cancel"
                variant="warning"
                onConfirm={confirmToggleSelectedStatus}
                onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
            />
            <ConfirmDialog
                isOpen={confirmDialog.isOpen && confirmDialog.type === 'delete'}
                title="Delete Business"
                message={confirmDialog.businessName ? `Are you sure you want to delete ${confirmDialog.businessName}? This action cannot be undone.` : ''}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={() => {
                    if (confirmDialog.businessId) {
                        onDelete(confirmDialog.businessId);
                    }
                    setConfirmDialog({ isOpen: false, type: null });
                }}
                onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
            />
        </>
    );
};

export default BusinessManagementTable;