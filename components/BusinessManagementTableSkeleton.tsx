import React from 'react';

const SkeletonRow = () => (
    <tr className="bg-white border-b">
        <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse w-full"></div>
        </td>
        <td className="px-6 py-4">
            <div className="flex items-center gap-3">
                <div className="h-6 w-11 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
        </td>
        <td className="px-6 py-4">
             <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
        </td>
        <td className="px-6 py-4">
            <div className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-10"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
        </td>
    </tr>
);

const BusinessManagementTableSkeleton: React.FC = () => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Business Name</th>
                        <th scope="col" className="px-6 py-3">Membership Tier</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Verified</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                </tbody>
            </table>
        </div>
    );
};

export default BusinessManagementTableSkeleton;
