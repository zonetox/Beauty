
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Business, ReviewStatus } from '../../types.ts';
import StarRating from '../StarRating.tsx';
import { useReviewsData } from '../../contexts/BusinessContext.tsx';
import { useAuth } from '../../providers/AuthProvider.tsx';
import ReviewForm from '../ReviewForm.tsx';
import ReportAbuseModal from '../ReportAbuseModal.tsx';

import Editable from '../Editable.tsx';

interface ReviewsSectionProps {
    business: Business;
    content?: any;
    isEditing?: boolean;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ business, content }) => {
    const displayTitle = content?.title || 'Khách hàng nói gì về chúng tôi';
    const displaySubtitle = content?.subtitle || 'Đánh giá';
    const { getReviewsBybusiness_id, addReview } = useReviewsData();
    const { user: currentUser, profile } = useAuth();

    const [showForm, setShowForm] = useState(false);
    const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
    const [reportingReviewComment, setReportingReviewComment] = useState<string>('');

    const allReviewsForBusiness = getReviewsBybusiness_id(business.id);
    const visibleReviews = allReviewsForBusiness.filter(r => r.status === ReviewStatus.VISIBLE);

    const handleReviewSubmit = async (data: { rating: number; comment: string }) => {
        if (!profile) {
            toast.error("You must be logged in to submit a review.");
            return;
        }

        const submissionPromise = addReview({
            business_id: business.id,
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
        <section id="reviews" className="py-32 lg:py-48 bg-white relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <div className="text-center mb-20 animate-fade-in-up">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-12 h-px bg-primary"></div>
                        <p className="text-xs font-bold uppercase text-primary tracking-[0.5em]">
                            <Editable id="reviews_subtitle" type="text" value={displaySubtitle}>
                                {displaySubtitle}
                            </Editable>
                        </p>
                        <div className="w-12 h-px bg-primary"></div>
                    </div>
                    <h2 className="mt-2 text-5xl lg:text-7xl font-bold font-serif text-accent italic">
                        <Editable id="reviews_title" type="text" value={displayTitle}>
                            {displayTitle}
                        </Editable>
                    </h2>
                </div>

                <div className="max-w-4xl mx-auto mb-16 text-center">
                    {!currentUser ? (
                        <p className="text-accent/40 text-sm tracking-widest uppercase mb-8">
                            <Link to="/login" className="text-primary hover:underline font-bold">Đăng nhập</Link> để để lại đánh giá của bạn.
                        </p>
                    ) : (
                        !showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="group relative overflow-hidden bg-accent text-white px-10 py-4 rounded-full font-bold text-[10px] tracking-[0.3em] uppercase hover:text-primary transition-colors border border-accent"
                            >
                                <span className="relative z-10 transition-colors duration-500">Viết đánh giá trải nghiệm</span>
                                <div className="absolute inset-x-0 bottom-0 h-0 bg-white transition-all duration-500 group-hover:h-full z-0"></div>
                            </button>
                        )
                    )}

                    {showForm && (
                        <div className="mt-8 bg-secondary p-10 rounded-luxury luxury-border-thin animate-scale-in">
                            <ReviewForm
                                onSubmit={handleReviewSubmit}
                                onCancel={() => setShowForm(false)}
                            />
                        </div>
                    )}
                </div>

                {visibleReviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {visibleReviews.slice(0, 3).map(review => (
                            <div key={review.id} className="group relative bg-white p-10 rounded-luxury luxury-border-thin shadow-premium hover:shadow-2xl transition-all duration-700 hover:-translate-y-2">
                                <div className="flex justify-between items-start mb-8">
                                    <StarRating rating={review.rating} />
                                    {currentUser && (
                                        <button
                                            onClick={() => {
                                                setReportingReviewId(review.id);
                                                setReportingReviewComment(review.comment);
                                            }}
                                            className="text-[10px] uppercase tracking-widest text-accent/20 hover:text-primary transition-colors"
                                        >
                                            Báo cáo
                                        </button>
                                    )}
                                </div>
                                <p className="text-accent/70 text-lg lg:text-xl font-light italic leading-relaxed font-sans flex-grow line-clamp-4">
                                    &quot;{review.comment}&quot;
                                </p>
                                <div className="mt-10 flex items-center pt-8 border-t border-primary/10">
                                    <div className="relative">
                                        <img src={review.user_avatar_url} alt={review.user_name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-lg" />
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                                            <svg className="w-3 h-3 text-accent" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-serif italic text-accent text-lg">{review.user_name}</p>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-accent/40 font-bold mt-1">KHÁCH HÀNG TẠI NGỌC DUNG</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !showForm && <p className="text-center text-accent/30 font-light italic mt-8">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                )}
            </div>

            {
                reportingReviewId && (
                    <ReportAbuseModal
                        isOpen={!!reportingReviewId}
                        onClose={() => {
                            setReportingReviewId(null);
                            setReportingReviewComment('');
                        }}
                        reviewId={reportingReviewId}
                        reviewComment={reportingReviewComment}
                    />
                )
            }
        </section >
    );
};

export default ReviewsSection;
