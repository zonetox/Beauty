import React from 'react';

const SkeletonRow = () => (
    <tr className="bg-white border-b">
        <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse w-full"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </td>
    </tr>
);

const UserManagementTableSkeleton: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Username</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3">Last Login</th>
                        </tr>
                    </thead>
                    <tbody>
                         {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagementTableSkeleton;