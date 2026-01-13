// Phase 3.3 - Landing Page Moderation Component
// Admin UI to view and moderate business landing pages

import React, { useState, useMemo } from 'react';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { Business } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';
import toast from 'react-hot-toast';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';

type LandingPageStatus = 'Pending' | 'Approved' | 'Rejected' | 'Needs Review';

const AdminLandingPageModeration: React.FC = () => {
    const { businesses, loading } = useBusinessData();
    const [statusFilter, setStatusFilter] = useState<LandingPageStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBusinesses = useMemo(() => {
        let filtered = businesses.filter(b => {
            const status = b.landingPageStatus || 'Approved';
            if (statusFilter !== 'all' && status !== statusFilter) return false;
            if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
        return filtered.sort((a, b) => {
            // Sort by status priority: Pending > Needs Review > Approved > Rejected
            const statusPriority: { [key: string]: number } = {
                'Pending': 1,
                'Needs Review': 2,
                'Approved': 3,
                'Rejected': 4,
            };
            const aPriority = statusPriority[a.landingPageStatus || 'Approved'] || 5;
            const bPriority = statusPriority[b.landingPageStatus || 'Approved'] || 5;
            if (aPriority !== bPriority) return aPriority - bPriority;
            return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        });
    }, [businesses, statusFilter, searchQuery]);

    const updateLandingPageStatus = async (businessId: number, newStatus: LandingPageStatus) => {
        try {
            const { error } = await supabase
                .from('businesses')
                .update({ landing_page_status: newStatus })
                .eq('id', businessId);

            if (error) throw error;

            toast.success(`Landing page status updated to ${newStatus}`);
            // Refresh businesses data
            window.location.reload();
        } catch (error: any) {
            console.error('Error updating landing page status:', error);
            toast.error(`Failed to update status: ${error.message}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Needs Review':
                return 'bg-orange-100 text-orange-800';
            case 'Approved':
                return 'bg-green-100 text-green-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const statusCounts = useMemo(() => {
        const counts: { [key: string]: number } = {
            'Pending': 0,
            'Needs Review': 0,
            'Approved': 0,
            'Rejected': 0,
        };
        businesses.forEach(b => {
            const status = b.landingPageStatus || 'Approved';
            counts[status] = (counts[status] || 0) + 1;
        });
        return counts;
    }, [businesses]);

    if (loading) {
        return (
            <div className="p-8">
                <LoadingState message="Loading landing pages..." />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <div>
                <h2 className="text-2xl font-bold font-serif text-neutral-dark mb-2">Landing Page Moderation</h2>
                <p className="text-gray-600">Review and moderate business landing pages</p>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-600">Pending</div>
                    <div className="text-2xl font-bold text-yellow-600">{statusCounts['Pending'] || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-600">Needs Review</div>
                    <div className="text-2xl font-bold text-orange-600">{statusCounts['Needs Review'] || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-600">Approved</div>
                    <div className="text-2xl font-bold text-green-600">{statusCounts['Approved'] || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-600">Rejected</div>
                    <div className="text-2xl font-bold text-red-600">{statusCounts['Rejected'] || 0}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by business name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            statusFilter === 'all'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setStatusFilter('Pending')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            statusFilter === 'Pending'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setStatusFilter('Needs Review')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            statusFilter === 'Needs Review'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Needs Review
                    </button>
                </div>
            </div>

            {/* Business List */}
            {filteredBusinesses.length === 0 ? (
                <EmptyState
                    title="No landing pages found"
                    message={searchQuery || statusFilter !== 'all' 
                        ? "No businesses match your search criteria."
                        : "No businesses have landing pages yet."}
                />
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-gray-700">Business</th>
                                    <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
                                    <th className="px-6 py-3 font-semibold text-gray-700">Joined Date</th>
                                    <th className="px-6 py-3 font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBusinesses.map((business) => {
                                    const currentStatus = (business.landingPageStatus || 'Approved') as LandingPageStatus;
                                    return (
                                        <tr key={business.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {business.logoUrl && (
                                                        <img
                                                            src={business.logoUrl}
                                                            alt={business.name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-neutral-dark">{business.name}</div>
                                                        <div className="text-xs text-gray-500">{business.categories.join(', ')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(currentStatus)}`}>
                                                    {currentStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(business.joinedDate).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`/business/${business.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline text-sm font-medium"
                                                    >
                                                        View Page
                                                    </a>
                                                    <select
                                                        value={currentStatus}
                                                        onChange={(e) => updateLandingPageStatus(business.id, e.target.value as LandingPageStatus)}
                                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary focus:border-primary"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Needs Review">Needs Review</option>
                                                        <option value="Approved">Approved</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLandingPageModeration;
