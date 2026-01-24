// C3.8 - Reviews Management (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth, useReviewsData } from '../contexts/BusinessContext.tsx';
import { Review, ReviewStatus } from '../types.ts';
import StarRating from './StarRating.tsx';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-gray-50 p-4 rounded-lg flex items-center border">
        <div className="bg-primary/10 text-primary p-3 rounded-full">{icon}</div>
        <div className="ml-4">
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-bold text-neutral-dark">{value}</p>
        </div>
    </div>
);

const ReplyForm: React.FC<{
    initialContent?: string;
    onSubmit: (content: string) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}> = ({ initialContent = '', onSubmit, onCancel, isSubmitting = false }) => {
    const [content, setContent] = useState(initialContent);
    const [error, setError] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!content.trim()) {
            setError('Reply content is required');
            return;
        }

        if (content.length > 1000) {
            setError('Reply must be less than 1000 characters');
            return;
        }

        setError('');
        try {
            await onSubmit(content);
        } catch (_error) {
            // Error handled by parent with toast
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
            <textarea
                value={content}
                onChange={(e) => {
                    setContent(e.target.value);
                    if (error) setError('');
                }}
                rows={3}
                maxLength={1000}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${error ? 'border-red-500' : 'border-gray-300'
                    }`}
                placeholder="Write your reply..."
                disabled={isSubmitting}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-between items-center">
                <p className="text-xs text-gray-500">{content.length} / 1000 characters</p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="text-sm px-3 py-1.5 bg-primary text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            'Save Reply'
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

const ReviewsManager: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { getReviewsByBusinessId, addReply, toggleReviewVisibility, loading } = useReviewsData();
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isReplying, setIsReplying] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all');
    const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

    const allReviews = getReviewsByBusinessId(currentBusiness?.id || -1);

    // Apply filters
    const reviews = useMemo(() => {
        if (!currentBusiness) return [];
        let filtered = allReviews;

        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

        if (ratingFilter !== 'all') {
            filtered = filtered.filter(r => r.rating === ratingFilter);
        }

        return filtered;
    }, [allReviews, statusFilter, ratingFilter, currentBusiness]);

    const averageRating = useMemo(() => {
        if (!currentBusiness || allReviews.length === 0) return 0;
        const total = allReviews.reduce((acc, r) => acc + r.rating, 0);
        return total / allReviews.length;
    }, [allReviews, currentBusiness]);

    // Rating distribution
    const ratingDistribution = useMemo(() => {
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        if (!currentBusiness) return distribution;
        allReviews.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) {
                distribution[r.rating as keyof typeof distribution]++;
            }
        });
        return distribution;
    }, [allReviews, currentBusiness]);

    if (!currentBusiness) {
        return (
            <div className="p-8">
                <EmptyState
                    title="No business found"
                    message="Please select a business to manage reviews."
                />
            </div>
        );
    }

    const getRatingPercentage = (rating: number) => {
        if (allReviews.length === 0) return 0;
        return (ratingDistribution[rating as keyof typeof ratingDistribution] / allReviews.length) * 100;
    };

    const handleReplySubmit = async (reviewId: string, content: string) => {
        setIsReplying(true);
        try {
            await addReply(reviewId, content);
            toast.success('Reply saved successfully!');
            setReplyingTo(null);
        } catch (_error) {
            // Error already handled in context with toast
        } finally {
            setIsReplying(false);
        }
    };

    const handleToggleVisibility = async (review: Review) => {
        setTogglingId(review.id);
        try {
            await toggleReviewVisibility(review.id);
            const newStatus = review.status === ReviewStatus.VISIBLE ? ReviewStatus.HIDDEN : ReviewStatus.VISIBLE;
            toast.success(`Review ${newStatus === ReviewStatus.HIDDEN ? 'hidden' : 'shown'} successfully!`);
        } catch (error) {
            // Error already handled in context with toast
        } finally {
            setTogglingId(null);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <LoadingState message="Loading reviews..." />
            </div>
        );
    }

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold font-serif text-neutral-dark mb-6">Reviews Management</h2>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Average Rating"
                    value={averageRating.toFixed(1)}
                    icon={<StarRating rating={averageRating} />}
                />
                <StatCard
                    title="Total Reviews"
                    value={allReviews.length}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h4l2-2v2z" />
                        </svg>
                    }
                />
                <StatCard
                    title="Visible Reviews"
                    value={allReviews.filter(r => r.status === ReviewStatus.VISIBLE).length}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    }
                />
                <StatCard
                    title="Hidden Reviews"
                    value={allReviews.filter(r => r.status === ReviewStatus.HIDDEN).length}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    }
                />
            </div>

            {/* Rating Distribution */}
            {allReviews.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border mb-8">
                    <h3 className="text-lg font-semibold text-neutral-dark mb-4">Rating Distribution</h3>
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(rating => {
                            const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                            const percentage = getRatingPercentage(rating);
                            return (
                                <div key={rating} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-16">
                                        <span className="text-sm font-medium text-gray-700">{rating}</span>
                                        <StarRating rating={rating} size="small" />
                                    </div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                                        <div
                                            className="bg-primary h-4 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-600 w-16 text-right">
                                        {count} ({percentage.toFixed(0)}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filters */}
            {allReviews.length > 0 && (
                <div className="flex gap-4 mb-6 flex-wrap">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'all' | ReviewStatus)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        >
                            <option value="all">All</option>
                            <option value={ReviewStatus.VISIBLE}>Visible</option>
                            <option value={ReviewStatus.HIDDEN}>Hidden</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Rating</label>
                        <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        >
                            <option value="all">All</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                    {(statusFilter !== 'all' || ratingFilter !== 'all') && (
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setStatusFilter('all');
                                    setRatingFilter('all');
                                }}
                                className="text-sm text-gray-600 hover:text-gray-800 underline"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <EmptyState
                    title={allReviews.length === 0 ? "No reviews yet" : "No reviews match your filters"}
                    message={
                        allReviews.length === 0
                            ? "Reviews from customers will appear here. Encourage your customers to leave reviews!"
                            : "Try adjusting your filters to see more reviews."
                    }
                    action={
                        allReviews.length === 0 ? undefined : (
                            <button
                                onClick={() => {
                                    setStatusFilter('all');
                                    setRatingFilter('all');
                                }}
                                className="text-primary hover:underline"
                            >
                                Clear Filters
                            </button>
                        )
                    }
                />
            ) : (
                <div className="space-y-6">
                    {reviews.map(review => (
                        <div
                            key={review.id}
                            className={`p-4 rounded-lg border ${review.status === ReviewStatus.HIDDEN ? 'bg-red-50 border-red-200' : 'bg-white'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4 flex-1">
                                    <img
                                        src={review.userAvatarUrl}
                                        alt={review.userName}
                                        className="w-12 h-12 rounded-full flex-shrink-0"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=random`;
                                        }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-neutral-dark">{review.userName}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(review.submittedDate).toLocaleString()}
                                        </p>
                                        <div className="mt-1">
                                            <StarRating rating={review.rating} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm flex-shrink-0">
                                    <button
                                        onClick={() => handleToggleVisibility(review)}
                                        className="font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                        disabled={togglingId === review.id || isReplying}
                                    >
                                        {togglingId === review.id ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                                ...
                                            </>
                                        ) : (
                                            review.status === ReviewStatus.VISIBLE ? 'Hide' : 'Show'
                                        )}
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-700 mt-3 pl-16">{review.comment}</p>

                            {/* Reply Section */}
                            <div className="pl-16 mt-4">
                                {review.reply ? (
                                    <div className="p-3 bg-primary/5 rounded-lg border-l-4 border-primary/50">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-semibold text-primary text-sm">Your reply:</p>
                                            {replyingTo !== review.id && (
                                                <button
                                                    onClick={() => setReplyingTo(review.id)}
                                                    className="text-xs font-semibold text-secondary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={isReplying || togglingId !== null}
                                                >
                                                    Edit Reply
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-gray-600">{review.reply.content}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(review.reply.repliedDate).toLocaleString()}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {replyingTo !== review.id && (
                                            <button
                                                onClick={() => setReplyingTo(review.id)}
                                                className="text-sm font-semibold text-secondary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={isReplying || togglingId !== null}
                                            >
                                                Reply to this review
                                            </button>
                                        )}
                                    </>
                                )}
                                {replyingTo === review.id && (
                                    <ReplyForm
                                        initialContent={review.reply?.content}
                                        onSubmit={(content) => handleReplySubmit(review.id, content)}
                                        onCancel={() => setReplyingTo(null)}
                                        isSubmitting={isReplying}
                                    />
                                )}
                            </div>
                            {review.status === ReviewStatus.HIDDEN && (
                                <p className="text-xs text-red-600 font-semibold text-center mt-3">
                                    This review is hidden and not visible on your public page.
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewsManager;
