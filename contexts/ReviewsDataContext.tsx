import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Review, ReviewStatus } from '../types.ts';

interface ReviewsDataContextType {
  reviews: Review[];
  getReviewsByBusinessId: (businessId: number) => Review[];
  addReview: (newReviewData: Omit<Review, 'id'>) => void;
  addReply: (reviewId: string, replyContent: string) => void;
  toggleReviewVisibility: (reviewId: string) => void;
}

const ReviewsDataContext = createContext<ReviewsDataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'all_customer_reviews';

export const ReviewsDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    try {
      const savedJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedJSON) {
        setReviews(JSON.parse(savedJSON));
      } else {
        const initialReviews: Review[] = [];
        setReviews(initialReviews);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialReviews));
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
      setReviews([]);
    }
  }, []);

  const updateLocalStorage = (updatedReviews: Review[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedReviews));
    } catch (error) {
      console.error("Failed to save reviews:", error);
    }
  };

  const addReview = (newReviewData: Omit<Review, 'id'>) => {
    const reviewToAdd: Review = {
      ...newReviewData,
      id: crypto.randomUUID(),
    };
    const updatedReviews = [reviewToAdd, ...reviews];
    setReviews(updatedReviews);
    updateLocalStorage(updatedReviews);
  };

  const addReply = (reviewId: string, replyContent: string) => {
    const updatedReviews = reviews.map(r => 
      r.id === reviewId
        // FIX: Changed 'repliedDate' to 'replied_date' to match the Review type.
        ? { ...r, reply: { content: replyContent, replied_date: new Date().toISOString() } }
        : r
    );
    setReviews(updatedReviews);
    updateLocalStorage(updatedReviews);
  };
  
  const toggleReviewVisibility = (reviewId: string) => {
    const updatedReviews = reviews.map(r => 
      r.id === reviewId
        ? { ...r, status: r.status === ReviewStatus.VISIBLE ? ReviewStatus.HIDDEN : ReviewStatus.VISIBLE }
        : r
    );
    setReviews(updatedReviews);
    updateLocalStorage(updatedReviews);
  };

  const getReviewsByBusinessId = (businessId: number) => {
    return reviews
      // FIX: Changed 'businessId' to 'business_id' to match the Review type.
      .filter(r => r.business_id === businessId)
      // FIX: Changed 'submittedDate' to 'submitted_date' to match the Review type.
      .sort((a, b) => new Date(b.submitted_date).getTime() - new Date(a.submitted_date).getTime());
  };

  const value = { reviews, getReviewsByBusinessId, addReview, addReply, toggleReviewVisibility };

  return (
    <ReviewsDataContext.Provider value={value}>
      {children}
    </ReviewsDataContext.Provider>
  );
};

export const useReviewsData = () => {
  const context = useContext(ReviewsDataContext);
  if (!context) {
    throw new Error('useReviewsData must be used within a ReviewsDataProvider');
  }
  return context;
};
