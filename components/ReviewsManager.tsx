import React, { useState, useMemo } from 'react';
import { useBusinessAuth, useReviewsData } from '../contexts/BusinessContext.tsx';
import { Review, ReviewStatus } from '../types.ts';
import StarRating from './StarRating.tsx';

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-gray-50 p-4 rounded-lg flex items-center border">
        <div className="bg-primary/10 text-primary p-3 rounded-full">{icon}</div>
        <div className="ml-4">
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-bold text-neutral-dark">{value}</p>
        </div>
    </div>
);

const ReplyForm: React.FC<{ initialContent?: string; onSubmit: (content: string) => void; onCancel: () => void; }> = ({ initialContent = '', onSubmit, onCancel }) => {
    const [content, setContent] = useState(initialContent);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(content);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="w-full p-2 border rounded-md"
                placeholder="Write your reply..."
                required
            />
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={onCancel} className="text-sm px-3 py-1 border rounded-md">Cancel</button>
                <button type="submit" className="text-sm px-3 py-1 bg-primary text-white rounded-md">Save Reply</button>
            </div>
        </form>
    );
};


const ReviewsManager: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { getReviewsByBusinessId, addReply, toggleReviewVisibility } = useReviewsData();
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    if (!currentBusiness) return null;

    const reviews = getReviewsByBusinessId(currentBusiness.id);

    const averageRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((acc, r) => acc + r.rating, 0);
        return total / reviews.length;
    }, [reviews]);
    
    const handleReplySubmit = (reviewId: string, content: string) => {
        addReply(reviewId, content);
        setReplyingTo(null);
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold font-serif text-neutral-dark mb-6">Reviews Management</h2>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard title="Average Rating" value={averageRating.toFixed(1)} icon={<StarRating rating={averageRating} />} />
                <StatCard title="Total Reviews" value={reviews.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h4l2-2v2z" /></svg>} />
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.map(review => (
                    <div key={review.id} className={`p-4 rounded-lg border ${review.status === ReviewStatus.HIDDEN ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                        <div className="flex justify-between items-start">
                             <div className="flex gap-4">
                                {/* FIX: Changed 'userAvatarUrl' and 'userName' to match the Review type. */}
                                <img src={review.user_avatar_url} alt={review.user_name} className="w-12 h-12 rounded-full" />
                                <div>
                                    <p className="font-semibold text-neutral-dark">{review.user_name}</p>
                                    {/* FIX: Changed 'submittedDate' to 'submitted_date' to match the Review type. */}
                                    <p className="text-xs text-gray-400">{new Date(review.submitted_date).toLocaleString()}</p>
                                    <StarRating rating={review.rating} />
                                </div>
                            </div>
                             <div className="flex items-center gap-2 text-sm">
                                <button onClick={() => toggleReviewVisibility(review.id)} className="font-semibold hover:underline">
                                    {review.status === ReviewStatus.VISIBLE ? 'Hide' : 'Show'}
                                </button>
                                 <span className="text-gray-300">|</span>
                                <button className="font-semibold text-red-500 hover:underline">Report</button>
                             </div>
                        </div>
                        <p className="text-gray-700 mt-2 pl-16">{review.comment}</p>
                        
                        {/* Reply Section */}
                        <div className="pl-16 mt-3">
                            {review.reply ? (
                                <div className="p-3 bg-primary/5 rounded-lg border-l-4 border-primary/50">
                                    <p className="font-semibold text-primary text-sm">Your reply:</p>
                                    <p className="text-gray-600 mt-1">{review.reply.content}</p>
                                    {replyingTo !== review.id && (
                                        <button onClick={() => setReplyingTo(review.id)} className="text-xs font-semibold text-secondary hover:underline mt-2">Edit Reply</button>
                                    )}
                                </div>
                            ) : (
                                <>
                                {replyingTo !== review.id && (
                                    <button onClick={() => setReplyingTo(review.id)} className="text-sm font-semibold text-secondary hover:underline">
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
                                />
                            )}
                        </div>
                        {review.status === ReviewStatus.HIDDEN && (
                           <p className="text-xs text-red-600 font-semibold text-center mt-3">This review is hidden and not visible on your public page.</p>
                        )}
                    </div>
                ))}
                 {reviews.length === 0 && <p className="text-center py-8 text-gray-500">No reviews yet.</p>}
            </div>
        </div>
    );
};

export default ReviewsManager;
