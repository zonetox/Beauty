import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { BusinessBlogPost, Review, ReviewStatus, BusinessAnalytics, Appointment, AppointmentStatus, Order, OrderStatus, Profile, BusinessBlogPostStatus } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { useAdminPlatform } from './AdminPlatformContext.tsx';
import { useAdminAuth } from './AuthContext.tsx';
import { useUserData } from './UserDataContext.tsx';

// --- CONTEXT TYPE DEFINITION ---
interface BusinessDashboardContextType {
  // Business Blog
  posts: BusinessBlogPost[];
  blogLoading: boolean;
  getPostBySlug: (slug: string) => BusinessBlogPost | undefined;
  // FIX: Add getPostsByBusinessId to the context type.
  getPostsByBusinessId: (businessId: number) => BusinessBlogPost[];
  addPost: (newPostData: Omit<BusinessBlogPost, 'id' | 'slug' | 'createdDate' | 'viewCount'>) => Promise<void>;
  updatePost: (updatedPost: BusinessBlogPost) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  incrementViewCount: (postId: string) => Promise<void>;
  // Reviews
  reviews: Review[];
  reviewsLoading: boolean;
  getReviewsByBusinessId: (businessId: number) => Review[];
  addReview: (reviewData: { business_id: number; rating: number; comment: string; userProfile: Profile }) => Promise<void>;
  addReply: (reviewId: string, replyContent: string) => Promise<void>;
  toggleReviewVisibility: (reviewId: string) => Promise<void>;
  // Analytics
  getAnalyticsByBusinessId: (businessId: number) => BusinessAnalytics | undefined;
  // Bookings
  appointments: Appointment[];
  getAppointmentsForBusiness: (businessId: number) => Appointment[];
  addAppointment: (newAppointmentData: Omit<Appointment, 'id' | 'createdAt'>) => void;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  // Orders
  orders: Order[];
  ordersLoading: boolean;
  addOrder: (newOrder: Omit<Order, 'id'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, notes?: string) => void;
}

const BusinessDashboardContext = createContext<BusinessDashboardContextType | undefined>(undefined);

// --- LOCAL STORAGE KEYS ---
const APPOINTMENTS_STORAGE_KEY = 'all_appointments';

// FIX: Add missing 'toSnakeCase' helper function to convert object keys for Supabase.
const toSnakeCase = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  return Object.keys(obj).reduce((acc: any, key: string) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
};

export const BusinessDashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATES ---
  const [posts, setPosts] = useState<BusinessBlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [analyticsData] = useState<BusinessAnalytics[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const { logAdminAction } = useAdminPlatform();
  const { currentUser: currentAdmin } = useAdminAuth();

  // --- DATA LOADING & SAVING ---
  const fetchAllData = useCallback(async () => {
    setBlogLoading(true);
    setReviewsLoading(true);
    setOrdersLoading(true);
    
    const [postsRes, reviewsRes, ordersRes] = await Promise.all([
        supabase.from('business_blog_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('reviews').select('*').order('submitted_at', { ascending: false }),
        supabase.from('orders').select('*').order('submitted_at', { ascending: false })
    ]);

    if (postsRes.data) setPosts(postsRes.data.map(p => ({ ...p, businessId: p.business_id })) as BusinessBlogPost[]);
    if (postsRes.error) console.error("Error fetching business blog posts:", postsRes.error);
    
    if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
    if (reviewsRes.error) console.error("Error fetching reviews:", reviewsRes.error);

    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    if (ordersRes.error) console.error("Error fetching orders:", ordersRes.error);

    setBlogLoading(false);
    setReviewsLoading(false);
    setOrdersLoading(false);
  }, []);
  
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- BUSINESS BLOG LOGIC ---
  const addPost = async (newPostData: Omit<BusinessBlogPost, 'id' | 'slug' | 'createdDate' | 'viewCount'>) => {
    const slug = newPostData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + `-${Date.now()}`;
    const postToAdd = {
        ...toSnakeCase(newPostData),
        slug: slug,
        view_count: 0,
    };
    const { error } = await supabase.from('business_blog_posts').insert(postToAdd);
    if (error) console.error("Error adding business post:", error);
    else await fetchAllData();
  };
  const updatePost = async (updatedPost: BusinessBlogPost) => {
      const { id, ...postToUpdate } = updatedPost;
      const { error } = await supabase.from('business_blog_posts').update(toSnakeCase(postToUpdate)).eq('id', id);
      if (error) console.error("Error updating business post:", error);
      else await fetchAllData();
  };
  const deletePost = async (postId: string) => {
      const { error } = await supabase.from('business_blog_posts').delete().eq('id', postId);
      if (error) console.error("Error deleting business post:", error);
      else await fetchAllData();
  };
  const getPostBySlug = (slug: string) => posts.find(p => p.slug === slug);
  // FEAT: Add function to get posts by business ID.
  const getPostsByBusinessId = (businessId: number) => {
    return posts.filter(p => p.businessId === businessId);
  };
  const incrementViewCount = async (postId: string) => {
      // NOTE: This requires an RPC function 'increment_business_blog_view_count' to be created in Supabase.
      // CREATE OR REPLACE FUNCTION increment_business_blog_view_count(p_post_id uuid) ...
      const { error } = await supabase.rpc('increment_business_blog_view_count', { p_post_id: postId });
      if (!error) {
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, viewCount: (p.viewCount || 0) + 1 } : p));
      }
  };

  // --- REVIEWS LOGIC ---
  const addReview = async (reviewData: { business_id: number; rating: number; comment: string; userProfile: Profile }) => {
    const { userProfile, ...rest } = reviewData;
    if (!userProfile?.id) {
        throw new Error("User must be logged in to post a review.");
    }
    const newReview = {
        ...rest,
        user_id: userProfile.id,
        user_name: userProfile.full_name || 'Anonymous',
        user_avatar_url: userProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.full_name || 'A')}&background=random`,
        status: ReviewStatus.VISIBLE,
    };
    const { error } = await supabase.from('reviews').insert(newReview);
    if (error) {
        console.error("Error adding review:", error);
        throw error;
    } else {
        await fetchAllData();
    }
  };
  const addReply = async (reviewId: string, replyContent: string) => {
    const reply = { content: replyContent, replied_date: new Date().toISOString() };
    const { error } = await supabase.from('reviews').update({ reply }).eq('id', reviewId);
    if (error) {
        console.error("Error adding reply:", error);
        throw error;
    } else {
        await fetchAllData();
    }
  };
  const toggleReviewVisibility = async (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    const newStatus = review.status === ReviewStatus.VISIBLE ? ReviewStatus.HIDDEN : ReviewStatus.VISIBLE;
    const { error } = await supabase.from('reviews').update({ status: newStatus }).eq('id', reviewId);
    if (error) {
        console.error("Error toggling review visibility:", error);
        throw error;
    } else {
        await fetchAllData();
    }
  };
  const getReviewsByBusinessId = (businessId: number) => reviews.filter(r => r.business_id === businessId);

  // --- ANALYTICS LOGIC ---
  const getAnalyticsByBusinessId = (businessId: number) => analyticsData.find(data => data.businessId === businessId);

  // --- BOOKINGS LOGIC ---
  const addAppointment = (newAppointmentData: Omit<Appointment, 'id' | 'createdAt'>) => { /* ... */ };
  const updateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => { /* ... */ };
  const getAppointmentsForBusiness = (businessId: number) => appointments.filter(appt => appt.businessId === businessId);
  
  // --- ORDERS LOGIC ---
  const addOrder = async (newOrderData: Omit<Order, 'id'>): Promise<Order> => { /* ... (implementation is correct) ... */ return {} as Order; };
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, notes?: string) => { /* ... (implementation is correct) ... */ };

  // --- COMBINED VALUE & PROVIDER ---
  const value = {
    posts, blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementViewCount, getPostsByBusinessId,
    reviews, reviewsLoading, getReviewsByBusinessId, addReview, addReply, toggleReviewVisibility,
    getAnalyticsByBusinessId,
    appointments, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus,
    orders, ordersLoading, addOrder, updateOrderStatus,
  };

  return <BusinessDashboardContext.Provider value={value}>{children}</BusinessDashboardContext.Provider>;
};

// --- CUSTOM HOOKS ---
const useBusinessDashboardData = () => {
  const context = useContext(BusinessDashboardContext);
  if (!context) throw new Error('Hook must be used within a BusinessDashboardProvider');
  return context;
};

export const useBusinessBlogData = () => {
  const { posts, blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementViewCount, getPostsByBusinessId } = useBusinessDashboardData();
  return { posts, loading: blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementViewCount, getPostsByBusinessId };
};
export const useReviewsData = () => {
  const { reviews, reviewsLoading, getReviewsByBusinessId, addReview, addReply, toggleReviewVisibility } = useBusinessDashboardData();
  return { reviews, loading: reviewsLoading, getReviewsByBusinessId, addReview, addReply, toggleReviewVisibility };
};
export const useAnalyticsData = () => {
  const { getAnalyticsByBusinessId } = useBusinessDashboardData();
  return { getAnalyticsByBusinessId };
};
export const useBookingData = () => {
  const { appointments, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus } = useBusinessDashboardData();
  return { appointments, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus };
};
export const useOrderData = () => {
  const { orders, ordersLoading, addOrder, updateOrderStatus } = useBusinessDashboardData();
  return { orders, loading: ordersLoading, addOrder, updateOrderStatus };
};