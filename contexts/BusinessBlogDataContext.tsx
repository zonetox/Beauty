import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { BusinessBlogPost, Review, ReviewStatus, BusinessAnalytics, Appointment, AppointmentStatus, Order, OrderStatus, Profile, MembershipPackage } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { activateBusinessFromOrder } from '../lib/businessUtils.ts';
import toast from 'react-hot-toast';


// --- CONTEXT TYPE DEFINITION ---
interface BusinessDashboardContextType {
  // Business Blog
  posts: BusinessBlogPost[];
  blogLoading: boolean;
  getPostBySlug: (slug: string) => BusinessBlogPost | undefined;
  getPostsBybusiness_id: (business_id: number) => BusinessBlogPost[];
  addPost: (newPostData: Omit<BusinessBlogPost, 'id' | 'slug' | 'created_date' | 'view_count'>) => Promise<void>;
  updatePost: (updatedPost: BusinessBlogPost) => Promise<void>;
  deletePost: (post_id: string) => Promise<void>;
  incrementview_count: (post_id: string) => Promise<void>;
  // Reviews
  reviews: Review[];
  reviewsLoading: boolean;
  getReviewsBybusiness_id: (business_id: number) => Review[];
  addReview: (reviewData: { business_id: number; rating: number; comment: string; userProfile: Profile }) => Promise<void>;
  addReply: (reviewId: string, replyContent: string) => Promise<void>;
  toggleReviewVisibility: (reviewId: string) => Promise<void>;
  // Analytics
  getAnalyticsBybusiness_id: (business_id: number) => BusinessAnalytics | undefined;
  // Bookings
  appointments: Appointment[];
  getAppointmentsForBusiness: (business_id: number) => Appointment[];
  addAppointment: (newAppointmentData: Omit<Appointment, 'id' | 'created_at'>) => void;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  // Orders
  orders: Order[];
  ordersLoading: boolean;
  addOrder: (newOrder: Omit<Order, 'id'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, notes?: string) => void;
}

const BusinessDashboardContext = createContext<BusinessDashboardContextType | undefined>(undefined);

// --- LOCAL STORAGE KEYS ---


/**
 * Helper to convert JS object keys from camelCase to snake_case for Supabase write operations.
 * @template T - The type of the input object
 * @param obj - The object to convert
 * @returns The object with snake_case keys
 */
function toSnakeCase<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase) as T;
  return Object.keys(obj as Record<string, unknown>).reduce((acc, key: string) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    const value = (obj as Record<string, unknown>)[key];
    (acc as Record<string, unknown>)[snakeKey] = toSnakeCase(value);
    return acc;
  }, {} as T);
}

export const BusinessDashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATES ---
  const [posts, setPosts] = useState<BusinessBlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [analyticsData] = useState<BusinessAnalytics[]>([]);
  const [appointments, _setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // --- DATA LOADING & SAVING ---
  // Define fetchAllData as a useCallback so it can be called from other functions
  const fetchAllData = useCallback(async () => {
    setBlogLoading(true);
    setReviewsLoading(true);
    setOrdersLoading(true);

    // PHASE 3: Optimize queries - select only needed columns (matching BusinessContext optimization)
    const [postsRes, reviewsRes, ordersRes] = await Promise.all([
      supabase.from('business_blog_posts')
        .select('id, business_id, slug, title, excerpt, image_url, content, author, created_date, published_date, status, view_count, is_featured, seo')
        .order('created_date', { ascending: false }),
      supabase.from('reviews')
        .select('id, user_id, business_id, user_name, user_avatar_url, rating, comment, submitted_date, status, reply')
        .order('submitted_date', { ascending: false }),
      supabase.from('orders')
        .select('id, business_id, business_name, package_id, package_name, amount, status, payment_method, submitted_at, confirmed_at, notes')
        .order('submitted_at', { ascending: false })
    ]);

    if (postsRes.data) setPosts(postsRes.data as BusinessBlogPost[]);
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
  const addPost = async (newPostData: Omit<BusinessBlogPost, 'id' | 'slug' | 'created_date' | 'view_count'>) => {
    const slug = newPostData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + `-${Date.now()}`;
    const postToAdd = {
      ...toSnakeCase(newPostData),
      slug: slug,
      view_count: 0,
    };
    // D3.4 FIX: Add error feedback for failed actions
    const { error } = await supabase.from('business_blog_posts').insert(postToAdd);
    if (error) {
      console.error("Error adding business post:", error);
      toast.error(`Failed to add post: ${error.message}`);
    } else {
      await fetchAllData();
      toast.success("Post added successfully!");
    }
  };
  const updatePost = async (updatedPost: BusinessBlogPost) => {
    const { id, ...postToUpdate } = updatedPost;
    // D3.4 FIX: Add error feedback for failed actions
    const { error } = await supabase.from('business_blog_posts').update(toSnakeCase(postToUpdate)).eq('id', id);
    if (error) {
      console.error("Error updating business post:", error);
      toast.error(`Failed to update post: ${error.message}`);
    } else {
      await fetchAllData();
      toast.success("Post updated successfully!");
    }
  };
  const deletePost = async (post_id: string) => {
    // D3.4 FIX: Add error feedback for failed actions
    const { error } = await supabase.from('business_blog_posts').delete().eq('id', post_id);
    if (error) {
      console.error("Error deleting business post:", error);
      toast.error(`Failed to delete post: ${error.message}`);
    } else {
      await fetchAllData();
      toast.success("Post deleted successfully!");
    }
  };
  const getPostBySlug = (slug: string) => posts.find(p => p.slug === slug);
  const getPostsBybusiness_id = (business_id: number) => {
    return posts.filter(p => p.business_id === business_id);
  };
  // D2.2 FIX: Use safe RPC function for view count increment (RPC function created in migration)
  const incrementview_count = async (post_id: string) => {
    try {
      const { error } = await supabase.rpc('increment_business_blog_view_count', { p_post_id: post_id });
      if (error) {
        // CRITICAL: Tracking failures are silent - only debug log in development
        if (import.meta.env.MODE === 'development') {
          console.debug('[Tracking] Business blog view count increment failed (best-effort):', error.message);
        }
      } else {
        // Optimistically update UI
        setPosts(prev => prev.map(p => p.id === post_id ? { ...p, view_count: (p.view_count || 0) + 1 } : p));
      }
    } catch (error) {
      // CRITICAL: Catch ALL errors (network, CORS, adblock, etc.) and silently fail
      if (import.meta.env.MODE === 'development') {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.debug('[Tracking] Business blog view count increment failed (best-effort):', errorMessage);
      }
      // NEVER rethrow - tracking must never affect app flow
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
    const reply = { reply_content: replyContent, reply_date: new Date().toISOString() };
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
  const getReviewsBybusiness_id = (business_id: number) => reviews.filter(r => r.business_id === business_id);

  // --- ANALYTICS LOGIC ---
  const getAnalyticsBybusiness_id = (business_id: number) => analyticsData.find(data => data.business_id === business_id);

  // --- BOOKINGS LOGIC ---
  const addAppointment = (_newAppointmentData: Omit<Appointment, 'id' | 'created_at'>) => { /* ... */ };
  const updateAppointmentStatus = (_appointmentId: string, _status: AppointmentStatus) => { /* ... */ };
  const getAppointmentsForBusiness = (business_id: number) => appointments.filter(appt => appt.business_id === business_id);

  // --- ORDERS LOGIC ---
  const addOrder = async (newOrderData: Omit<Order, 'id'>): Promise<Order> => {
    const { data, error } = await supabase.from('orders').insert(toSnakeCase(newOrderData)).select().single();
    if (error || !data) {
      console.error("Error adding order:", error);
      throw new Error("Failed to create order.");
    }
    await fetchAllData();
    return data as Order;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, notes?: string) => {
    // Determine who is performing this action (Admin context doesn't have 'businesses' list easily available like BusinessContext)
    // But we can query Supabase directly to get the necessary info.

    // 1. Get the current order details
    const { data: orderData, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (orderError || !orderData) {
      toast.error("Order not found.");
      return;
    }
    const order = orderData as Order;

    // 2. Prepare updates
    const updates = {
      status: newStatus,
      confirmed_at: newStatus === OrderStatus.COMPLETED ? new Date().toISOString() : order.confirmed_at,
      notes: notes || order.notes,
    };

    const { error: updateError } = await supabase.from('orders').update(updates).eq('id', orderId);

    if (!updateError) {
      // 3. Trigger Business Activation if Completed (using centralized function)
      if (newStatus === OrderStatus.COMPLETED) {
        // Fetch package and business data
        const [packageRes, businessRes] = await Promise.all([
          supabase.from('membership_packages').select('*').eq('id', order.package_id).single(),
          supabase.from('businesses').select('id, name, email').eq('id', order.business_id).single()
        ]);

        if (packageRes.data && businessRes.data) {
          const packagePurchased = packageRes.data as unknown as MembershipPackage;

          // Use centralized activation function (removes duplicate logic)
          await activateBusinessFromOrder(
            order.business_id,
            packagePurchased
          );
        }
      }
      await fetchAllData();
      toast.success("Order status updated.");
    } else {
      console.error("Error updating order:", updateError);
      toast.error("Failed to update order.");
    }
  };

  // --- COMBINED VALUE & PROVIDER ---
  const value = {
    posts, blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementview_count, getPostsBybusiness_id,
    reviews, reviewsLoading, getReviewsBybusiness_id, addReview, addReply, toggleReviewVisibility,
    getAnalyticsBybusiness_id,
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
  const { posts, blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementview_count, getPostsBybusiness_id } = useBusinessDashboardData();
  return { posts, loading: blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementview_count, getPostsBybusiness_id };
};
export const useReviewsData = () => {
  const { reviews, reviewsLoading, getReviewsBybusiness_id, addReview, addReply, toggleReviewVisibility } = useBusinessDashboardData();
  return { reviews, loading: reviewsLoading, getReviewsBybusiness_id, addReview, addReply, toggleReviewVisibility };
};
export const useAnalyticsData = () => {
  const { getAnalyticsBybusiness_id } = useBusinessDashboardData();
  return { getAnalyticsBybusiness_id };
};
export const useBookingData = () => {
  const { appointments, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus } = useBusinessDashboardData();
  return { appointments, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus };
};
export const useOrderData = () => {
  const { orders, ordersLoading, addOrder, updateOrderStatus } = useBusinessDashboardData();
  return { orders, loading: ordersLoading, addOrder, updateOrderStatus };
};
