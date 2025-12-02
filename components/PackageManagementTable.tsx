import React from 'react';
import { MembershipPackage } from '../types.ts';

interface PackageManagementTableProps {
    packages: MembershipPackage[];
    onEdit: (pkg: MembershipPackage) => void;
    onDelete: (packageId: string) => void;
    onUpdate: (packageId: string, updates: Partial<MembershipPackage>) => void;
}

const PackageManagementTable: React.FC<PackageManagementTableProps> = ({ packages, onEdit, onDelete, onUpdate }) => {
    
    const handleStatusToggle = (pkg: MembershipPackage) => {
        onUpdate(pkg.id, { isActive: !pkg.isActive });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Package Name</th>
                        <th scope="col" className="px-6 py-3">Price</th>
                        <th scope="col" className="px-6 py-3">Duration</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {packages.map(pkg => (
                        <tr key={pkg.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-neutral-dark whitespace-nowrap">
                                {pkg.name}
                                {pkg.isPopular && <span className="ml-2 text-xs font-semibold bg-accent/50 text-neutral-dark px-2 py-0.5 rounded-full">Popular</span>}
                            </td>
                            <td className="px-6 py-4">{formatPrice(pkg.price)}</td>
                            <td className="px-6 py-4">{pkg.durationMonths} months</td>
                            <td className="px-6 py-4">
                                <label htmlFor={`status-toggle-${pkg.id}`} className="inline-flex relative items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        id={`status-toggle-${pkg.id}`} 
                                        className="sr-only peer" 
                                        checked={pkg.isActive} 
                                        onChange={() => handleStatusToggle(pkg)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900">{pkg.isActive ? 'Active' : 'Inactive'}</span>
                                </label>
                            </td>
                            <td className="px-6 py-4 flex items-center gap-4">
                                <button onClick={() => onEdit(pkg)} className="font-medium text-secondary hover:underline">Edit</button>
                                <button onClick={() => onDelete(pkg.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PackageManagementTable;
