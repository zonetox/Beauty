import React, { useState } from 'react';

interface ReviewFormProps {
  onSubmit: (data: { rating: number; comment: string }) => void;
  onCancel: () => void;
}

const StarInput: React.FC<{ rating: number; onRate: (rating: number) => void }> = ({ rating, onRate }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className="flex items-center justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onRate(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                    aria-label={`Rate ${star} stars`}
                >
                    <svg
                        className={`w-10 h-10 transition-colors ${
                            (hoverRating || rating) >= star ? 'text-primary' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit, onCancel }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating.');
            return;
        }
        if (!comment.trim()) {
            setError('Please write a comment.');
            return;
        }
        onSubmit({ rating, comment });
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 rounded-lg border space-y-4">
            <h4 className="text-xl font-semibold text-neutral-dark text-center">How was your experience?</h4>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <StarInput rating={rating} onRate={(r) => { setRating(r); setError(''); }} />

            <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 sr-only">Your review</label>
                <textarea
                    id="comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => { setComment(e.target.value); setError(''); }}
                    placeholder="Share details of your own experience at this place"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
            </div>
            <div className="flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors">
                    Submit Review
                </button>
            </div>
        </form>
    );
};

export default ReviewForm;
