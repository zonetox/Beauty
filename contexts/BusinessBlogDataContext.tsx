import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { BusinessBlogPost, Review, ReviewStatus, BusinessAnalytics, Appointment, AppointmentStatus, Order, OrderStatus, Profile, BusinessBlogPostStatus, MembershipTier, MembershipPackage } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { activateBusinessFromOrder } from '../lib/businessUtils.ts';
import toast from 'react-hot-toast';
import { snakeToCamel } from '../lib/utils.ts';


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



  // --- DATA LOADING & SAVING ---
  useEffect(() => {
    let cancelled = false;
    
    const fetchAllData = async () => {
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

      if (!cancelled) {
        if (postsRes.data) setPosts(snakeToCamel(postsRes.data) as BusinessBlogPost[]);
        if (postsRes.error) console.error("Error fetching business blog posts:", postsRes.error);

        if (reviewsRes.data) setReviews(snakeToCamel(reviewsRes.data) as Review[]);
        if (reviewsRes.error) console.error("Error fetching reviews:", reviewsRes.error);

        if (ordersRes.data) setOrders(snakeToCamel(ordersRes.data) as Order[]);
        if (ordersRes.error) console.error("Error fetching orders:", ordersRes.error);

        setBlogLoading(false);
        setReviewsLoading(false);
        setOrdersLoading(false);
      }
    };
    
    fetchAllData();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // --- BUSINESS BLOG LOGIC ---
  const addPost = async (newPostData: Omit<BusinessBlogPost, 'id' | 'slug' | 'createdDate' | 'viewCount'>) => {
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
  const deletePost = async (postId: string) => {
    // D3.4 FIX: Add error feedback for failed actions
    const { error } = await supabase.from('business_blog_posts').delete().eq('id', postId);
    if (error) {
      console.error("Error deleting business post:", error);
      toast.error(`Failed to delete post: ${error.message}`);
    } else {
      await fetchAllData();
      toast.success("Post deleted successfully!");
    }
  };
  const getPostBySlug = (slug: string) => posts.find(p => p.slug === slug);
  // FEAT: Add function to get posts by business ID.
  const getPostsByBusinessId = (businessId: number) => {
    return posts.filter(p => p.businessId === businessId);
  };
  // D2.2 FIX: Use safe RPC function for view count increment (RPC function created in migration)
  const incrementViewCount = async (postId: string) => {
    const { error } = await supabase.rpc('increment_business_blog_view_count', { p_post_id: postId });
    if (error) {
      console.error('Error incrementing business blog view count:', error.message);
    } else {
      // Optimistically update UI
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
      user_name: userProfile.fullName || 'Anonymous',
      user_avatar_url: userProfile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.fullName || 'A')}&background=random`,
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
      confirmed_at: newStatus === OrderStatus.COMPLETED ? new Date().toISOString() : order.confirmedAt,
      notes: notes || order.notes,
    };

    const { error: updateError } = await supabase.from('orders').update(updates).eq('id', orderId);

    if (!updateError) {
      // 3. Trigger Business Activation if Completed (using centralized function)
      if (newStatus === OrderStatus.COMPLETED) {
        // Fetch package and business data
        const [packageRes, businessRes] = await Promise.all([
          supabase.from('membership_packages').select('*').eq('id', order.packageId).single(),
          supabase.from('businesses').select('id, name, email').eq('id', order.businessId).single()
        ]);

        if (packageRes.data && businessRes.data) {
          const packagePurchased = snakeToCamel(packageRes.data) as MembershipPackage;
          
          // Use centralized activation function (removes duplicate logic)
          await activateBusinessFromOrder(
            order.businessId,
            packagePurchased,
            businessRes.data.email,
            businessRes.data.name
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