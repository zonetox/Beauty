

import { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import { Business, BusinessBlogPost, Review, ReviewStatus, BusinessAnalytics, Appointment, Order, OrderStatus, AppointmentStatus, Profile, Deal, AnalyticsDataPoint, TrafficSource } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { useAuth } from '../providers/AuthProvider.tsx';
import { PublicDataContext } from './BusinessDataContext.tsx';
// Removed useAdmin import to avoid circular dependency - admin notifications handled at higher level
import { activateBusinessFromOrder } from '../lib/businessUtils.ts';
import toast from 'react-hot-toast';
import { toSnakeCase } from '../lib/utils.ts';

// --- TYPE DEFINITION ---
interface BusinessContextType {
  currentBusiness: Business | null;
  // Business Blog
  posts: BusinessBlogPost[];
  blogLoading: boolean;
  getPostBySlug: (slug: string) => BusinessBlogPost | undefined;
  getPostsBybusiness_id: (business_id: number) => BusinessBlogPost[];
  addPost: (newPostData: Omit<BusinessBlogPost, 'id' | 'slug' | 'created_date' | 'view_count'>) => Promise<void>;
  updatePost: (updatedPost: BusinessBlogPost) => Promise<void>;
  deletePost: (post_id: string) => Promise<void>;
  incrementview_count: (post_id: string) => Promise<void>;
  // Deals
  addDeal: (newDealData: Omit<Deal, 'id'>) => Promise<void>;
  updateDeal: (updatedDeal: Deal) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  // Reviews
  reviews: Review[];
  reviewsLoading: boolean;
  getReviewsBybusiness_id: (business_id: number) => Review[];
  addReview: (reviewData: { business_id: number; rating: number; comment: string; userProfile: Profile }) => Promise<void>;
  addReply: (reviewId: string, replyContent: string) => Promise<void>;
  toggleReviewVisibility: (reviewId: string) => Promise<void>;
  // Analytics
  analyticsLoading: boolean;
  getAnalyticsBybusiness_id: (business_id: number) => BusinessAnalytics | undefined;
  // Bookings
  appointments: Appointment[];
  appointmentsLoading: boolean;
  getAppointmentsForBusiness: (business_id: number) => Appointment[];
  addAppointment: (newAppointmentData: Omit<Appointment, 'id' | 'created_at'>) => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => Promise<void>;
  // Orders
  orders: Order[];
  ordersLoading: boolean;
  addOrder: (newOrder: Omit<Order, 'id'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, notes?: string) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);



export function BusinessProvider({ children }: { children: ReactNode }) {
  // --- PARENT CONTEXTS ---
  const { profile, state } = useAuth();
  const profileLoading = state === 'loading';
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
    if (profile && profile.business_id && businesses.length > 0) {
      const userBusiness = businesses.find(b => b.id === profile.business_id);
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
    if (!profile?.business_id) {
      setBlogLoading(false);
      setReviewsLoading(false);
      setOrdersLoading(false);
      setAppointmentsLoading(false);
      setAnalyticsLoading(false);
      return;
    }

    // Additional check: If user is admin, don't load business dashboard data
    // Admin should use admin panel, not business dashboard
    // This prevents double loading when admin user also has business_id
    // Note: We check via useUserSession to avoid circular dependency
    // If profile doesn't have business_id, we already returned above
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
      supabase.from('businesses').select('id, slug, view_count').order('id'),
      supabase.from('page_views')
        .select('id, page_type, page_id, viewed_at')
        .order('viewed_at', { ascending: false }),
      supabase.from('conversions')
        .select('id, business_id, conversion_type, source, converted_at')
        .order('converted_at', { ascending: false })
    ]);

    if (postsRes.data) setPosts(postsRes.data as BusinessBlogPost[]);
    if (postsRes.error) console.error("Error fetching business blog posts:", postsRes.error.message);

    if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
    if (reviewsRes.error) console.error("Error fetching reviews:", reviewsRes.error.message);

    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    if (ordersRes.error) console.error("Error fetching orders:", ordersRes.error.message);

    if (appointmentsRes.data) {
      setAppointments(appointmentsRes.data as Appointment[]);
    }
    if (appointmentsRes.error) console.error("Error fetching appointments:", appointmentsRes.error.message);

    // Calculate analytics from database data (C3.10: Migrated from mock data, Phase 2.2: Added conversions)
    if (businessesRes.data && reviewsRes.data && appointmentsRes.data && ordersRes.data) {
      const analytics: BusinessAnalytics[] = businessesRes.data.map((business: { id: number }) => {
        const business_id = business.id;
        const businessReviews = reviewsRes.data.filter((r: { business_id: number | null }) => r.business_id === business_id);
        const businessAppointments = appointmentsRes.data.filter((a: { business_id: number | null }) => a.business_id === business_id);
        const businessOrders = ordersRes.data.filter((o: { business_id: number | null }) => o.business_id === business_id);
        const businessSlug = (businessesRes.data.find((b: { id: number; slug: string }) => b.id === business_id))?.slug;

        // Get page views for this business (from page_views table where page_id = slug or page_type = 'business')
        const businessPageViews = (pageViewsRes.data as unknown as { page_type: string; page_id: string; viewed_at: string }[])?.filter((pv) =>
          (pv.page_type === 'business' && pv.page_id === businessSlug) ||
          (pv.page_type === 'business' && pv.page_id === String(business_id))
        ) || [];

        // Get conversions for this business
        const businessConversions = (conversionsRes.data as unknown as { business_id: number; conversion_type: string; converted_at: string }[])?.filter((c) => c.business_id === business_id) || [];

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
            page_views: dayPageViews || 0,
            contact_clicks: dayContactClicks + dayBookingClicks, // Combine contact and booking
            call_clicks: dayCallClicks,
            direction_clicks: 0, // Not tracked yet
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
          business_id: business_id,
          time_series: timeSeries,
          traffic_sources: trafficSources,
          average_time_on_page: 0, // Not tracked in current schema
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
  }, [profile?.business_id]);

  // Only fetch when user has a business
  useEffect(() => {
    // Wait for profile to finish loading before making decisions
    if (profileLoading) {
      return;
    }

    if (profile?.business_id && !hasFetchedRef.current) {
      fetchAllData();
    } else if (!profile?.business_id) {
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
  }, [profile?.business_id, profileLoading, fetchAllData]); // Depend on profileLoading to wait for auth check

  // --- LOGIC (copied from old BusinessBlogDataContext) ---
  const addPost = async (newPostData: Omit<BusinessBlogPost, 'id' | 'slug' | 'created_date' | 'view_count'>) => {
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
    if (oldPost && oldPost.image_url !== updatedPost.image_url && oldPost.image_url.includes('blog-images')) {
      try {
        const { deleteFileByUrl } = await import('../lib/storage.ts');
        await deleteFileByUrl('blog-images', oldPost.image_url);
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

  const deletePost = async (post_id: string) => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot delete post.");
      throw new Error("Preview Mode: Cannot delete post.");
    }
    // Delete image from Storage if exists and is from blog-images bucket
    const post = posts.find(p => p.id === post_id);
    if (post && post.image_url && post.image_url.includes('blog-images')) {
      try {
        const { deleteFileByUrl } = await import('../lib/storage.ts');
        await deleteFileByUrl('blog-images', post.image_url);
      } catch (deleteError) {
        // Log but don't fail the delete operation
        console.warn('Failed to delete blog post image from storage:', deleteError);
      }
    }

    const { error } = await supabase.from('business_blog_posts').delete().eq('id', post_id);
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
  const getPostsBybusiness_id = (business_id: number) => posts.filter(p => p.business_id === business_id);
  const incrementview_count = async (post_id: string) => {
    if (!isSupabaseConfigured) return;
    await supabase.rpc('increment_business_blog_view_count', { p_post_id: post_id });
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
      user_name: userProfile.full_name || 'Anonymous',
      user_avatar_url: userProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.full_name || 'A')}&background=random`,
      status: ReviewStatus.VISIBLE,
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
    const reply = { reply_content: replyContent, reply_date: new Date().toISOString() };
    const { error } = await supabase.from('reviews').update(reply).eq('id', reviewId);
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
  const getReviewsBybusiness_id = (business_id: number) => reviews.filter(r => r.business_id === business_id);
  const getAnalyticsBybusiness_id = (business_id: number) => analyticsData.find(data => data.business_id === business_id);

  const addAppointment = async (newAppointmentData: Omit<Appointment, 'id' | 'created_at'>) => {
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

  const getAppointmentsForBusiness = (business_id: number) => appointments.filter(appt => appt.business_id === business_id);

  const addOrder = async (newOrderData: Omit<Order, 'id'>): Promise<Order> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add order."); throw new Error("Preview Mode"); }
    const { data, error } = await supabase.from('orders').insert(toSnakeCase(newOrderData)).select().single();
    if (error || !data) {
      console.error("Error adding order:", error);
      throw new Error("Failed to create order.");
    }
    hasFetchedRef.current = false; // Reset to allow refetch
    await fetchAllData();
    return data as Order;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, notes?: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update order status."); return; }
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    const updates = {
      status: newStatus,
      confirmed_at: newStatus === OrderStatus.COMPLETED ? new Date().toISOString() : orderToUpdate.confirmed_at,
      notes: notes || orderToUpdate.notes,
    };

    const { data, error } = await supabase.from('orders').update(updates).eq('id', orderId).select().single();

    if (!error && data) {
      if (newStatus === OrderStatus.COMPLETED) {
        const order = data as unknown as Order;
        const businessToUpdate = businesses.find(b => b.id === order.business_id);
        const packagePurchased = packages.find(p => p.id === order.package_id);

        if (businessToUpdate && packagePurchased) {
          // Calculate expiry date for notification
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + (packagePurchased.duration_months || 0));

          // Use centralized activation function (removes duplicate logic)
          const activated = await activateBusinessFromOrder(
            order.business_id,
            packagePurchased
          );

          if (activated) {
            // Refresh business data
            await updateBusiness({
              ...businessToUpdate,
              membership_tier: packagePurchased.tier,
              membership_expiry_date: expiryDate.toISOString(),
              is_active: true,
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
    posts, blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementview_count, getPostsBybusiness_id,
    addDeal, updateDeal, deleteDeal,
    reviews, reviewsLoading, getReviewsBybusiness_id, addReview, addReply, toggleReviewVisibility,
    analyticsData, analyticsLoading, getAnalyticsBybusiness_id,
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
  const { posts, blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementview_count, getPostsBybusiness_id } = useBusiness();
  return { posts, loading: blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementview_count, getPostsBybusiness_id };
}

export function useDealsData() {
  const { addDeal, updateDeal, deleteDeal } = useBusiness();
  return { addDeal, updateDeal, deleteDeal };
}

export function useReviewsData() {
  const { reviews, reviewsLoading, getReviewsBybusiness_id, addReview, addReply, toggleReviewVisibility } = useBusiness();
  return { reviews, loading: reviewsLoading, getReviewsBybusiness_id, addReview, addReply, toggleReviewVisibility };
}

export function useAnalyticsData() {
  const { getAnalyticsBybusiness_id, analyticsLoading } = useBusiness();
  return { getAnalyticsBybusiness_id, loading: analyticsLoading };
}

export function useBookingData() {
  const { appointments, appointmentsLoading, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus } = useBusiness();
  return { appointments, loading: appointmentsLoading, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus };
}

export function useOrderData() {
  const { orders, ordersLoading, addOrder, updateOrderStatus } = useBusiness();
  return { orders, loading: ordersLoading, addOrder, updateOrderStatus };
}
