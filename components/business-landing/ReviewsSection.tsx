
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Business, ReviewStatus } from '../../types.ts';
import StarRating from '../StarRating.tsx';
import { useReviewsData } from '../../contexts/BusinessContext.tsx';
import { useUserSession } from '../../contexts/UserSessionContext.tsx';
import ReviewForm from '../ReviewForm.tsx';

interface ReviewsSectionProps {
    business: Business;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ business }) => {
    const { getReviewsByBusinessId, addReview } = useReviewsData();
    const { currentUser, profile } = useUserSession();
    
    const [showForm, setShowForm] = useState(false);

    const allReviewsForBusiness = getReviewsByBusinessId(business.id);
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
                            <StarRating rating={review.rating} />
                            <p className="text-gray-600 mt-4 italic flex-grow">&quot;{review.comment}&quot;</p>
                            <div className="mt-6 flex items-center">
                                <img src={review.user_avatar_url} alt={review.user_name} className="w-12 h-12 rounded-full object-cover" />
                                <div className="ml-4">
                                    <p className="font-semibold text-neutral-dark">{review.user_name}</p>
                                    <p className="text-sm text-gray-400">{new Date(review.submitted_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !showForm && <p className="text-center text-gray-500 mt-8">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            )}
        </section>
    );
};

export default ReviewsSection;
