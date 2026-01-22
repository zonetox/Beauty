// Admin Abuse Reports Component
// Phase 1.3: Admin interface to manage abuse reports

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import { AbuseReport, Review } from '../types.ts';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../contexts/AdminContext.tsx';
import { snakeToCamel } from '../lib/utils.ts';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';

const AdminAbuseReports: React.FC = () => {
  const { currentUser } = useAdminAuth();
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [reviews, setReviews] = useState<Map<string, Review>>(new Map());
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | AbuseReport['status']>('all');
  const [selectedReport, setSelectedReport] = useState<AbuseReport | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch abuse reports
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('abuse_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const camelCaseData = snakeToCamel(data) as AbuseReport[];
        setReports(camelCaseData);

        // Fetch related reviews
        const reviewIds = [...new Set(camelCaseData.map(r => r.review_id))];
        if (reviewIds.length > 0) {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('*')
            .in('id', reviewIds);

          if (!reviewsError && reviewsData) {
            const reviewsMap = new Map<string, Review>();
            (snakeToCamel(reviewsData) as Review[]).forEach(review => {
              reviewsMap.set(review.id, review);
            });
            setReviews(reviewsMap);
          }
        }
      } catch (error) {
        console.error('Error fetching abuse reports:', error);
        toast.error('Failed to load abuse reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Filter reports by status
  const filteredReports = useMemo(() => {
    if (statusFilter === 'all') return reports;
    return reports.filter(r => r.status === statusFilter);
  }, [reports, statusFilter]);

  // Update report status
  const handleUpdateStatus = async (reportId: string, newStatus: AbuseReport['status'], notes?: string) => {
    setIsUpdating(true);
    try {
      const updateData: Partial<AbuseReport> = {
        status: newStatus,
        reviewed_by: currentUser?.authUser?.id,
        reviewed_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('abuse_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      // Update local state
      setReports(prev => prev.map(r =>
        r.id === reportId
          ? { ...r, status: newStatus, admin_notes: notes, reviewed_by: currentUser?.authUser?.id, reviewed_at: new Date().toISOString() }
          : r
      ));

      toast.success('Report status updated successfully.');
      setSelectedReport(null);
      setAdminNotes('');
    } catch (error: any) {
      console.error('Error updating report:', error);
      toast.error(error?.message || 'Failed to update report status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: AbuseReport['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingState message="Loading abuse reports..." />;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Abuse Reports</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AbuseReport['status'])}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="all">All</option>
            <option value="Pending">Pending</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <EmptyState
          title="No abuse reports"
          message={statusFilter === 'all' ? 'No abuse reports found.' : `No ${statusFilter.toLowerCase()} reports found.`}
        />
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const review = reviews.get(report.review_id);
            return (
              <div
                key={report.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Reported {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review && (
                      <div className="bg-gray-50 p-3 rounded-md mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Review:</p>
                        <p className="text-sm text-gray-600 italic">&quot;{review.comment}&quot;</p>
                        <p className="text-xs text-gray-500 mt-1">
                          By {review.user_name} • Rating: {review.rating}/5
                        </p>
                      </div>
                    )}
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700">Reason:</p>
                      <p className="text-sm text-gray-600">{report.reason}</p>
                    </div>
                    {report.admin_notes && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700">Admin Notes:</p>
                        <p className="text-sm text-gray-600">{report.admin_notes}</p>
                      </div>
                    )}
                    {report.reviewed_by && report.reviewed_at && (
                      <p className="text-xs text-gray-500">
                        Reviewed by admin on {new Date(report.reviewed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {report.status === 'Pending' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setAdminNotes('');
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'Dismissed')}
                      disabled={isUpdating}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {selectedReport?.id === report.id && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes (optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary focus:border-primary"
                      rows={3}
                      placeholder="Add notes about this report..."
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleUpdateStatus(report.id, 'Reviewed', adminNotes)}
                        disabled={isUpdating}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        Mark as Reviewed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(report.id, 'Resolved', adminNotes)}
                        disabled={isUpdating}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Mark as Resolved
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReport(null);
                          setAdminNotes('');
                        }}
                        className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminAbuseReports;
