import React, { useMemo } from 'react';
import { Business } from '../../types.ts';
import { useBusinessData } from '../../contexts/BusinessDataContext.tsx';
import BusinessManagementTable from '../BusinessManagementTable.tsx';

interface AdminBusinessesTabProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onEdit: (business: Business) => void;
    onDelete: (id: number) => void;
    onDuplicate: (business: Business) => void;
    onAddNew: () => void;
}

const AdminBusinessesTab: React.FC<AdminBusinessesTabProps> = ({
    searchQuery,
    setSearchQuery,
    onEdit,
    onDelete,
    onDuplicate,
    onAddNew
}) => {
    const { businesses, loading: businessesLoading, updateBusiness } = useBusinessData();

    const filteredBusinesses = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return businesses;
        return businesses.filter((b: Business) => b.name?.toLowerCase().includes(q));
    }, [businesses, searchQuery]);

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Business Management</h2>
                <button
                    onClick={onAddNew}
                    className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary-dark transition-colors"
                >
                    + Add New Business
                </button>
            </div>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-1/3 px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
            </div>
            {businessesLoading ? (
                <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <BusinessManagementTable
                    businesses={filteredBusinesses}
                    onEdit={onEdit}
                    onUpdate={updateBusiness}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                />
            )}
        </div>
    );
};

export default AdminBusinessesTab;
