
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Business, ReviewStatus } from '../../types.ts';
import StarRating from '../StarRating.tsx';
import { useReviewsData } from '../../contexts/BusinessContext.tsx';
import { useAuth } from '../../providers/AuthProvider.tsx';
import ReviewForm from '../ReviewForm.tsx';
import ReportAbuseModal from '../ReportAbuseModal.tsx';

interface ReviewsSectionProps {
    business: Business;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ business }) => {
    const { getReviewsByBusinessId, addReview } = useReviewsData();
    const { user: currentUser, profile } = useAuth();

    const [showForm, setShowForm] = useState(false);
    const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
    const [reportingReviewComment, setReportingReviewComment] = useState<string>('');

    const allReviewsForBusiness = getReviewsByBusinessId(business.id);
    const visibleReviews = allReviewsForBusiness.filter(r => r.status === ReviewStatus.VISIBLE);

    const handleReviewSubmit = async (data: { rating: number; comment: string }) => {
        if (!profile) {
            toast.error("You must be logged in to submit a review.");
            return;
        }

        const submissionPromise = addReview({
            businessId: business.id,
            rating: data.rating,
            comment: data.comment,
            userProfile: profile
        });

        toast.promise(submissionPromise, {
            loading: 'Submitting your review...',
            success: 'Thank you for your review!',
            error: 'Failed to submit review. Please try again.',
        });

        setShowForm(false);
    };


    return (
        <section id="reviews" className="py-20 lg:py-28">
            <div className="text-center">
                <p className="text-sm font-semibold uppercase text-primary tracking-widest">Đánh giá</p>
                <h2 className="mt-2 text-3xl lg:text-4xl font-bold font-serif text-neutral-dark">
                    Khách hàng nói gì về chúng tôi
                </h2>
            </div>

            <div className="mt-12 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    {!currentUser ? (
                        <p>
                            <Link to="/login" className="font-semibold text-primary hover:underline">Đăng nhập</Link> để để lại đánh giá của bạn.
                        </p>
                    ) : (
                        !showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-primary text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-dark transition-colors"
                            >
                                Viết đánh giá
                            </button>
                        )
                    )}
                </div>

                {showForm && (
                    <div className="mb-12">
                        <ReviewForm
                            onSubmit={handleReviewSubmit}
                            onCancel={() => setShowForm(false)}
                        />
                    </div>
                )}
            </div>

            {visibleReviews.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {visibleReviews.slice(0, 3).map(review => (
                        <div key={review.id} className="bg-white p-6 rounded-lg border border-gray-100 shadow-lg flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <StarRating rating={review.rating} />
                                {currentUser && (
                                    <button
                                        onClick={() => {
                                            setReportingReviewId(review.id);
                                            setReportingReviewComment(review.comment);
                                        }}
                                        className="text-xs text-red-600 hover:text-red-800 hover:underline"
                                        title="Report abuse"
                                    >
                                        Report
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-600 mt-4 italic flex-grow">&quot;{review.comment}&quot;</p>
                            <div className="mt-6 flex items-center">
                                <img src={review.userAvatarUrl} alt={review.userName} className="w-12 h-12 rounded-full object-cover" />
                                <div className="ml-4">
                                    <p className="font-semibold text-neutral-dark">{review.userName}</p>
                                    <p className="text-sm text-gray-400">{new Date(review.submittedDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !showForm && <p className="text-center text-gray-500 mt-8">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            )}

            {reportingReviewId && (
                <ReportAbuseModal
                    isOpen={!!reportingReviewId}
                    onClose={() => {
                        setReportingReviewId(null);
                        setReportingReviewComment('');
                    }}
                    reviewId={reportingReviewId}
                    reviewComment={reportingReviewComment}
                />
            )}
        </section>
    );
};

export default ReviewsSection;
