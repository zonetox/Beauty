

import { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import { Business, BusinessBlogPost, Review, ReviewStatus, BusinessAnalytics, Appointment, Order, OrderStatus, AppointmentStatus, Profile, Deal, AnalyticsDataPoint, TrafficSource } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { useUserSession } from './UserSessionContext.tsx';
import { PublicDataContext } from './BusinessDataContext.tsx';
// Removed useAdmin import to avoid circular dependency - admin notifications handled at higher level
import { activateBusinessFromOrder } from '../lib/businessUtils.ts';
import toast from 'react-hot-toast';
import { snakeToCamel } from '../lib/utils.ts';

// --- TYPE DEFINITION ---
interface BusinessContextType {
  currentBusiness: Business | null;
  // Business Blog
  posts: BusinessBlogPost[];
  blogLoading: boolean;
  getPostBySlug: (slug: string) => BusinessBlogPost | undefined;
  getPostsByBusinessId: (businessId: number) => BusinessBlogPost[];
  addPost: (newPostData: Omit<BusinessBlogPost, 'id' | 'slug' | 'createdDate' | 'viewCount'>) => Promise<void>;
  updatePost: (updatedPost: BusinessBlogPost) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  incrementViewCount: (postId: string) => Promise<void>;
  // Deals
  addDeal: (newDealData: Omit<Deal, 'id'>) => Promise<void>;
  updateDeal: (updatedDeal: Deal) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  // Reviews
  reviews: Review[];
  reviewsLoading: boolean;
  getReviewsByBusinessId: (businessId: number) => Review[];
  addReview: (reviewData: { business_id: number; rating: number; comment: string; userProfile: Profile }) => Promise<void>;
  addReply: (reviewId: string, replyContent: string) => Promise<void>;
  toggleReviewVisibility: (reviewId: string) => Promise<void>;
  // Analytics
  analyticsLoading: boolean;
  getAnalyticsByBusinessId: (businessId: number) => BusinessAnalytics | undefined;
  // Bookings
  appointments: Appointment[];
  appointmentsLoading: boolean;
  getAppointmentsForBusiness: (businessId: number) => Appointment[];
  addAppointment: (newAppointmentData: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => Promise<void>;
  // Orders
  orders: Order[];
  ordersLoading: boolean;
  addOrder: (newOrder: Omit<Order, 'id'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, notes?: string) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const toSnakeCase = <T,>(obj: T): T => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase) as unknown as T;
  return Object.keys(obj as object).reduce((acc: Record<string, unknown>, key: string) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase((obj as Record<string, unknown>)[key]);
    return acc;
  }, {}) as unknown as T;
};

export function BusinessProvider({ children }: { children: ReactNode }) {
  // --- PARENT CONTEXTS ---
  const { profile, loading: profileLoading } = useUserSession();
  // Use useContext directly instead of hooks to avoid initialization order issues
  const publicDataContext = useContext(PublicDataContext);
  const businesses = publicDataContext?.businesses || [];
  const updateBusiness = publicDataContext?.updateBusiness || (async () => { });
  const addDeal = publicDataContext?.addDeal || (async () => { });
  const updateDeal = publicDataContext?.updateDeal || (async () => { });
  const deleteDeal = publicDataContext?.deleteDeal || (async () => { });
  const packages = publicDataContext?.packages || [];
  // Removed useAdmin to avoid circular dependency - admin notifications handled at higher level

  // --- STATES ---
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [posts, setPosts] = useState<BusinessBlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<BusinessAnalytics[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // --- IDENTIFY CURRENT BUSINESS ---
  useEffect(() => {
    if (profile && profile.businessId && businesses.length > 0) {
      const userBusiness = businesses.find(b => b.id === profile.businessId);
      setCurrentBusiness(userBusiness || null);
    } else {
      setCurrentBusiness(null);
    }
  }, [profile, businesses]);

  // --- DATA FETCHING (from old BusinessBlogDataContext) ---
  // Lazy load: only fetch when user has a business (business dashboard)
  const hasFetchedRef = useRef(false);

  const fetchAllData = useCallback(async () => {
    // Only fetch if user has a business
    // IMPORTANT: Skip if user is admin (admin doesn't need business dashboard data)
    // This prevents loading business data when admin accesses /admin page
    if (!profile?.businessId) {
      setBlogLoading(false);
      setReviewsLoading(false);
      setOrdersLoading(false);
      setAppointmentsLoading(false);
      setAnalyticsLoading(false);
      return;
    }

    // Additional check: If user is admin, don't load business dashboard data
    // Admin should use admin panel, not business dashboard
    // This prevents double loading when admin user also has businessId
    // Note: We check via useUserSession to avoid circular dependency
    // If profile doesn't have businessId, we already returned above
    // This check is mainly to prevent loading when admin accesses /admin page
    // For now, we'll rely on the route protection to prevent this scenario

    // Prevent double fetch
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. Serving empty data for preview purposes.");
      setBlogLoading(false);
      setReviewsLoading(false);
      setOrdersLoading(false);
      setAppointmentsLoading(false);
      setPosts([]);
      setReviews([]);
      setOrders([]);
      setAppointments([]);
      hasFetchedRef.current = false; // Reset on error
      return;
    }

    setBlogLoading(true);
    setReviewsLoading(true);
    setOrdersLoading(true);
    setAppointmentsLoading(true);
    setAnalyticsLoading(true);

    // F2.1: Optimize queries - select only needed columns
    const [postsRes, reviewsRes, ordersRes, appointmentsRes, businessesRes, pageViewsRes, conversionsRes] = await Promise.all([
      supabase.from('business_blog_posts')
        .select('id, business_id, slug, title, excerpt, image_url, content, author, created_date, published_date, status, view_count, is_featured, seo')
        .order('created_date', { ascending: false }),
      supabase.from('reviews')
        .select('id, user_id, business_id, user_name, user_avatar_url, rating, comment, submitted_date, status, reply')
        .order('submitted_date', { ascending: false }),
      supabase.from('orders')
        .select('id, business_id, business_name, package_id, package_name, amount, status, payment_method, submitted_at, confirmed_at, notes')
        .order('submitted_at', { ascending: false }),
      supabase.from('appointments')
        .select('id, business_id, service_id, service_name, staff_member_id, customer_name, customer_email, customer_phone, date, time_slot, status, notes, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('businesses').select('id, view_count').order('id'),
      supabase.from('page_views')
        .select('id, page_type, page_id, business_id, viewed_at')
        .order('viewed_at', { ascending: false }),
      supabase.from('conversions')
        .select('id, business_id, conversion_type, source, converted_at')
        .order('converted_at', { ascending: false })
    ]);

    if (postsRes.data) setPosts(snakeToCamel(postsRes.data) as BusinessBlogPost[]);
    if (postsRes.error) console.error("Error fetching business blog posts:", postsRes.error.message);

    if (reviewsRes.data) setReviews(snakeToCamel(reviewsRes.data) as Review[]);
    if (reviewsRes.error) console.error("Error fetching reviews:", reviewsRes.error.message);

    if (ordersRes.data) setOrders(snakeToCamel(ordersRes.data) as Order[]);
    if (ordersRes.error) console.error("Error fetching orders:", ordersRes.error.message);

    if (appointmentsRes.data) {
      setAppointments(snakeToCamel(appointmentsRes.data) as Appointment[]);
    }
    if (appointmentsRes.error) console.error("Error fetching appointments:", appointmentsRes.error.message);

    // Calculate analytics from database data (C3.10: Migrated from mock data, Phase 2.2: Added conversions)
    if (businessesRes.data && reviewsRes.data && appointmentsRes.data && ordersRes.data) {
      const analytics: BusinessAnalytics[] = businessesRes.data.map((business: { id: number }) => {
        const businessId = business.id;
        const businessReviews = reviewsRes.data.filter((r: { business_id: number | null }) => r.business_id === businessId);
        const businessAppointments = appointmentsRes.data.filter((a: { business_id: number | null }) => a.business_id === businessId);
        const businessOrders = ordersRes.data.filter((o: { business_id: number | null }) => o.business_id === businessId);

        // Get page views for this business (from page_views table where page_id = businessId or page_type = 'business')
        const businessPageViews = (pageViewsRes.data as { page_type: string; page_id: string; business_id: number; viewed_at: string }[])?.filter((pv) =>
          (pv.page_type === 'business' && pv.page_id === String(businessId)) ||
          (pv.business_id === businessId)
        ) || [];

        // Get conversions for this business
        const businessConversions = (conversionsRes.data as { business_id: number; conversion_type: string; converted_at: string }[])?.filter((c) => c.business_id === businessId) || [];

        // Calculate time series for last 30 days
        const timeSeries: AnalyticsDataPoint[] = [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const dateStr = date.toISOString().split('T')[0];

          // Count page views for this day
          const dayPageViews = businessPageViews.filter((pv) => {
            const viewDate = new Date(pv.viewed_at);
            viewDate.setHours(0, 0, 0, 0);
            return viewDate.getTime() === date.getTime();
          }).length;

          // Count conversions by type for this day
          const dayConversions = businessConversions.filter((c) => {
            const convDate = new Date(c.converted_at);
            convDate.setHours(0, 0, 0, 0);
            return convDate.getTime() === date.getTime();
          });

          const dayCallClicks = dayConversions.filter((c) => c.conversion_type === 'call').length;
          const dayContactClicks = dayConversions.filter((c) => c.conversion_type === 'contact').length;
          const dayBookingClicks = dayConversions.filter((c) => c.conversion_type === 'booking').length;
          // const dayCtaClicks = dayConversions.filter((c: any) => c.conversion_type === 'click').length;

          timeSeries.push({
            date: dateStr,
            pageViews: dayPageViews || 0,
            contactClicks: dayContactClicks + dayBookingClicks, // Combine contact and booking
            callClicks: dayCallClicks,
            directionClicks: 0, // Not tracked yet
          });
        }

        // Calculate traffic sources (simplified)
        const totalInteractions = businessReviews.length + businessAppointments.length + businessOrders.length;
        const trafficSources: TrafficSource[] = [
          { source: 'Google', percentage: totalInteractions > 0 ? Math.round((businessReviews.length / totalInteractions) * 100) : 0 },
          { source: 'Homepage', percentage: totalInteractions > 0 ? Math.round((businessAppointments.length / totalInteractions) * 100) : 0 },
          { source: 'Blog', percentage: totalInteractions > 0 ? Math.round((businessOrders.length / totalInteractions) * 100) : 0 },
          { source: 'Direct Search', percentage: totalInteractions > 0 ? Math.max(0, 100 - (businessReviews.length + businessAppointments.length + businessOrders.length) / totalInteractions * 100) : 0 },
        ];

        return {
          businessId,
          timeSeries,
          trafficSources,
          averageTimeOnPage: 0, // Not tracked in current schema
        };
      });

      setAnalyticsData(analytics);
    }

    setBlogLoading(false);
    setReviewsLoading(false);
    setOrdersLoading(false);
    setAppointmentsLoading(false);
    setAnalyticsLoading(false);
    // Don't reset hasFetchedRef here - keep it true to prevent re-fetch
  }, [profile?.businessId]);

  // Only fetch when user has a business
  useEffect(() => {
    // Wait for profile to finish loading before making decisions
    if (profileLoading) {
      return;
    }

    if (profile?.businessId && !hasFetchedRef.current) {
      fetchAllData();
    } else if (!profile?.businessId) {
      // Reset when user doesn't have business (or not logged in)
      hasFetchedRef.current = false;
      setPosts([]);
      setReviews([]);
      setOrders([]);
      setAppointments([]);
      setAnalyticsData([]);
      // CRITICAL: Set loading to false so public pages can render
      setBlogLoading(false);
      setReviewsLoading(false);
      setOrdersLoading(false);
      setAppointmentsLoading(false);
      setAnalyticsLoading(false);
    }
  }, [profile?.businessId, profileLoading, fetchAllData]); // Depend on profileLoading to wait for auth check

  // --- LOGIC (copied from old BusinessBlogDataContext) ---
  const addPost = async (newPostData: Omit<BusinessBlogPost, 'id' | 'slug' | 'createdDate' | 'viewCount'>) => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot add post.");
      throw new Error("Preview Mode: Cannot add post.");
    }
    const slug = newPostData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + `-${Date.now()}`;
    const postToAdd = {
      ...toSnakeCase(newPostData),
      slug: slug,
      view_count: 0,
    };
    const { error } = await supabase.from('business_blog_posts').insert(postToAdd as any);
    if (error) {
      console.error("Error adding business post:", error.message);
      toast.error(`Failed to add post: ${error.message}`);
      throw error;
    }
    hasFetchedRef.current = false; // Reset to allow refetch
    await fetchAllData();
    toast.success("Post added successfully!");
  };

  const updatePost = async (updatedPost: BusinessBlogPost) => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot update post.");
      throw new Error("Preview Mode: Cannot update post.");
    }
    // If image changed and old image is from blog-images bucket, delete it
    const oldPost = posts.find(p => p.id === updatedPost.id);
    if (oldPost && oldPost.imageUrl !== updatedPost.imageUrl && oldPost.imageUrl.includes('blog-images')) {
      try {
        const { deleteFileByUrl } = await import('../lib/storage.ts');
        await deleteFileByUrl('blog-images', oldPost.imageUrl);
      } catch (deleteError) {
        // Log but don't fail the update operation
        console.warn('Failed to delete old blog post image from storage:', deleteError);
      }
    }

    const { id, ...postToUpdate } = updatedPost;
    const { error } = await supabase.from('business_blog_posts').update(toSnakeCase(postToUpdate) as any).eq('id', id);
    if (error) {
      console.error("Error updating business post:", error.message);
      toast.error(`Failed to update post: ${error.message}`);
      throw error;
    }
    hasFetchedRef.current = false; // Reset to allow refetch
    await fetchAllData();
    toast.success("Post updated successfully!");
  };

  const deletePost = async (postId: string) => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot delete post.");
      throw new Error("Preview Mode: Cannot delete post.");
    }
    // Delete image from Storage if exists and is from blog-images bucket
    const post = posts.find(p => p.id === postId);
    if (post && post.imageUrl && post.imageUrl.includes('blog-images')) {
      try {
        const { deleteFileByUrl } = await import('../lib/storage.ts');
        await deleteFileByUrl('blog-images', post.imageUrl);
      } catch (deleteError) {
        // Log but don't fail the delete operation
        console.warn('Failed to delete blog post image from storage:', deleteError);
      }
    }

    const { error } = await supabase.from('business_blog_posts').delete().eq('id', postId);
    if (error) {
      console.error("Error deleting business post:", error.message);
      toast.error(`Failed to delete post: ${error.message}`);
      throw error;
    }
    hasFetchedRef.current = false; // Reset to allow refetch
    await fetchAllData();
    toast.success("Post deleted successfully!");
  };
  const getPostBySlug = (slug: string) => posts.find(p => p.slug === slug);
  const getPostsByBusinessId = (businessId: number) => posts.filter(p => p.businessId === businessId);
  const incrementViewCount = async (postId: string) => {
    if (!isSupabaseConfigured) return;
    await supabase.rpc('increment_business_blog_view_count', { p_post_id: postId });
  };
  const addReview = async (reviewData: { business_id: number; rating: number; comment: string; userProfile: Profile }) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add review."); throw new Error("Preview Mode"); }
    const { userProfile, ...rest } = reviewData;
    if (!userProfile?.id) {
      throw new Error("User must be logged in to post a review.");
    }
    const newReview = {
      ...rest,
      user_id: userProfile.id,
      user_name: userProfile.fullName || 'Anonymous',
      user_avatar_url: userProfile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.fullName || 'A')}&background=random`,
      status: 'Visible' as ReviewStatus,
    };
    const { error } = await supabase.from('reviews').insert(newReview);
    if (error) {
      console.error("Error adding review:", error.message);
      throw error;
    } else {
      hasFetchedRef.current = false; // Reset to allow refetch
      await fetchAllData();
    }
  };
  const addReply = async (reviewId: string, replyContent: string) => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot add reply.");
      throw new Error("Preview Mode: Cannot add reply.");
    }
    const reply = { content: replyContent, replied_date: new Date().toISOString() };
    const { error } = await supabase.from('reviews').update({ reply }).eq('id', reviewId);
    if (error) {
      console.error("Error adding reply:", error.message);
      toast.error(`Failed to save reply: ${error.message}`);
      throw error;
    }
    hasFetchedRef.current = false; // Reset to allow refetch
    await fetchAllData();
    toast.success("Reply saved successfully!");
  };
  const toggleReviewVisibility = async (reviewId: string) => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot change review visibility.");
      throw new Error("Preview Mode: Cannot change review visibility.");
    }
    const review = reviews.find(r => r.id === reviewId);
    if (!review) {
      throw new Error("Review not found");
    }
    const newStatus = review.status === ReviewStatus.VISIBLE ? ReviewStatus.HIDDEN : ReviewStatus.VISIBLE;
    const { error } = await supabase.from('reviews').update({ status: newStatus }).eq('id', reviewId);
    if (error) {
      console.error("Error toggling review visibility:", error.message);
      toast.error(`Failed to update review visibility: ${error.message}`);
      throw error;
    }
    hasFetchedRef.current = false; // Reset to allow refetch
    await fetchAllData();
    toast.success(`Review ${newStatus === ReviewStatus.HIDDEN ? 'hidden' : 'shown'} successfully!`);
  };
  const getReviewsByBusinessId = (businessId: number) => reviews.filter(r => r.business_id === businessId);
  const getAnalyticsByBusinessId = (businessId: number) => analyticsData.find(data => data.businessId === businessId);

  const addAppointment = async (newAppointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add appointment."); throw new Error("Preview Mode"); }
    const appointmentToAdd = toSnakeCase(newAppointmentData);
    const { error } = await supabase.from('appointments').insert(appointmentToAdd as any);
    if (error) {
      console.error("Error adding appointment:", error.message);
      throw error;
    } else {
      hasFetchedRef.current = false; // Reset to allow refetch
      await fetchAllData();
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus) => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot update appointment status.");
      throw new Error("Preview Mode: Cannot update appointment status.");
    }
    const { error } = await supabase.from('appointments').update({ status }).eq('id', appointmentId);
    if (error) {
      console.error("Error updating appointment status:", error.message);
      toast.error(`Failed to update appointment: ${error.message}`);
      throw error;
    }
    hasFetchedRef.current = false; // Reset to allow refetch
    await fetchAllData();
  };

  const getAppointmentsForBusiness = (businessId: number) => appointments.filter(appt => appt.businessId === businessId);

  const addOrder = async (newOrderData: Omit<Order, 'id'>): Promise<Order> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add order."); throw new Error("Preview Mode"); }
    const { data, error } = await supabase.from('orders').insert(toSnakeCase(newOrderData)).select().single();
    if (error || !data) {
      console.error("Error adding order:", error);
      throw new Error("Failed to create order.");
    }
    hasFetchedRef.current = false; // Reset to allow refetch
    await fetchAllData();
    return snakeToCamel(data) as Order;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, notes?: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update order status."); return; }
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    const updates = {
      status: newStatus,
      confirmed_at: newStatus === OrderStatus.COMPLETED ? new Date().toISOString() : orderToUpdate.confirmedAt,
      notes: notes || orderToUpdate.notes,
    };

    const { data, error } = await supabase.from('orders').update(updates).eq('id', orderId).select().single();

    if (!error && data) {
      if (newStatus === OrderStatus.COMPLETED) {
        const order = snakeToCamel(data) as unknown as Order;
        const businessToUpdate = businesses.find(b => b.id === order.businessId);
        const packagePurchased = packages.find(p => p.id === order.packageId);

        if (businessToUpdate && packagePurchased) {
          // Calculate expiry date for notification
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + packagePurchased.durationMonths);

          // Use centralized activation function (removes duplicate logic)
          const activated = await activateBusinessFromOrder(
            order.businessId,
            packagePurchased
          );

          if (activated) {
            // Refresh business data
            await updateBusiness({
              ...businessToUpdate,
              membershipTier: packagePurchased.tier,
              membershipExpiryDate: expiryDate.toISOString(),
              isActive: true,
            });

            // Send notification - removed to avoid circular dependency
            // Admin notifications will be handled at higher level where both contexts are available
            // TODO: Implement notification via event system or higher-level component
          }
        }
      }
      await fetchAllData(); // Refetch all data to ensure UI is consistent
    } else {
      console.error("Error updating order status:", error?.message);
    }
  };

  const value = {
    currentBusiness,
    posts, blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementViewCount, getPostsByBusinessId,
    addDeal, updateDeal, deleteDeal,
    reviews, reviewsLoading, getReviewsByBusinessId, addReview, addReply, toggleReviewVisibility,
    analyticsData, analyticsLoading, getAnalyticsByBusinessId,
    appointments, appointmentsLoading, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus,
    orders, ordersLoading, addOrder, updateOrderStatus,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

// --- CUSTOM HOOKS ---
// Convert all hooks to function declarations for proper hoisting
export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}

// Sub-hooks for convenience
export function useBusinessAuth() {
  return { currentBusiness: useBusiness().currentBusiness };
}

export function useBusinessBlogData() {
  const { posts, blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementViewCount, getPostsByBusinessId } = useBusiness();
  return { posts, loading: blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementViewCount, getPostsByBusinessId };
}

export function useDealsData() {
  const { addDeal, updateDeal, deleteDeal } = useBusiness();
  return { addDeal, updateDeal, deleteDeal };
}

export function useReviewsData() {
  const { reviews, reviewsLoading, getReviewsByBusinessId, addReview, addReply, toggleReviewVisibility } = useBusiness();
  return { reviews, loading: reviewsLoading, getReviewsByBusinessId, addReview, addReply, toggleReviewVisibility };
}

export function useAnalyticsData() {
  const { getAnalyticsByBusinessId, analyticsLoading } = useBusiness();
  return { getAnalyticsByBusinessId, loading: analyticsLoading };
}

export function useBookingData() {
  const { appointments, appointmentsLoading, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus } = useBusiness();
  return { appointments, loading: appointmentsLoading, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus };
}

export function useOrderData() {
  const { orders, ordersLoading, addOrder, updateOrderStatus } = useBusiness();
  return { orders, loading: ordersLoading, addOrder, updateOrderStatus };
}