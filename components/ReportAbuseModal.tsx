// Report Abuse Modal Component
// Phase 1.3: Allow users to report abusive reviews

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import { AbuseReport } from '../types.ts';
import toast from 'react-hot-toast';
import { useUserSession } from '../contexts/UserSessionContext.tsx';

interface ReportAbuseModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  reviewComment: string;
}

const REPORT_REASONS = [
  'Spam or fake review',
  'Inappropriate content',
  'Harassment or bullying',
  'False information',
  'Other',
];

const ReportAbuseModal: React.FC<ReportAbuseModalProps> = ({
  isOpen,
  onClose,
  reviewId,
  reviewComment,
}) => {
  const { currentUser } = useUserSession();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error('You must be logged in to report abuse.');
      return;
    }

    if (!selectedReason) {
      toast.error('Please select a reason for reporting.');
      return;
    }

    const reason = selectedReason === 'Other' ? customReason : selectedReason;

    if (!reason.trim()) {
      toast.error('Please provide a reason for reporting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('abuse_reports')
        .insert({
          review_id: reviewId,
          reporter_id: currentUser.id,
          reason: reason.trim(),
          status: 'Pending',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Thank you for reporting. We will review this report shortly.');
      onClose();
      
      // Reset form
      setSelectedReason('');
      setCustomReason('');
    } catch (error: any) {
      console.error('Error reporting abuse:', error);
      toast.error(error?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('');
      setCustomReason('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-neutral-dark">Report Abuse</h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600 mb-1">Review being reported:</p>
          <p className="text-sm text-gray-800 italic">&quot;{reviewComment.substring(0, 100)}{reviewComment.length > 100 ? '...' : ''}&quot;</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for reporting *
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    disabled={isSubmitting}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    required
                  />
                  <span className="ml-2 text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === 'Other' && (
            <div className="mb-4">
              <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
                Please specify *
              </label>
              <textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                rows={3}
                placeholder="Please describe the issue..."
                required={selectedReason === 'Other'}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedReason}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportAbuseModal;
