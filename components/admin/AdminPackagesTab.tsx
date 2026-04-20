import React from 'react';
import { MembershipPackage, MembershipTier } from '../../types.ts';
import { useMembershipPackageData } from '../../contexts/BusinessDataContext.tsx';
import PackageManagementTable from '../PackageManagementTable.tsx';

interface AdminPackagesTabProps {
    onEdit: (pkg: MembershipPackage | null) => void;
    onDelete: (id: string) => void;
}

const AdminPackagesTab: React.FC<AdminPackagesTabProps> = ({ onEdit, onDelete }) => {
    const { packages, updatePackage } = useMembershipPackageData();

    const handleAddNew = () => {
        onEdit({
            id: '',
            tier: MembershipTier.PREMIUM,
            name: '',
            price: 0,
            duration_months: 12,
            description: '',
            features: [''],
            permissions: {
                photo_limit: 10,
                video_limit: 2,
                featured_level: 1,
                custom_landing_page: true,
                private_blog: false,
                seo_support: false,
                monthly_post_limit: 5,
                featured_post_limit: 0,
            },
            is_popular: false,
            is_active: true
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Membership Packages</h2>
                <button
                    onClick={handleAddNew}
                    className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary-dark transition-colors"
                >
                    + Add New Package
                </button>
            </div>
            <PackageManagementTable
                packages={packages}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdate={updatePackage}
            />
        </div>
    );
};

export default AdminPackagesTab;
