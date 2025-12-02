

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Business, BusinessBlogPost, Review, BusinessAnalytics, Appointment, Order, OrderStatus, AppointmentStatus, Profile, Deal } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { useUserSession } from './UserSessionContext.tsx';
import { useBusinessData, useMembershipPackageData } from './BusinessDataContext.tsx';
import { useAdmin } from './AdminContext.tsx';
import toast from 'react-hot-toast';

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
  getAnalyticsByBusinessId: (businessId: number) => BusinessAnalytics | undefined;
  // Bookings
  appointments: Appointment[];
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

const toSnakeCase = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  return Object.keys(obj).reduce((acc: any, key: string) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
};

export const BusinessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- PARENT CONTEXTS ---
  const { profile } = useUserSession();
  const { businesses, updateBusiness, addDeal, updateDeal, deleteDeal } = useBusinessData();
  const { packages } = useMembershipPackageData();
  const { addNotification } = useAdmin();
  
  // --- STATES ---
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [posts, setPosts] = useState<BusinessBlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [analyticsData] = useState<BusinessAnalytics[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
  const fetchAllData = useCallback(async () => {
    if (!isSupabaseConfigured) {
        console.warn("Supabase is not configured. Serving empty data for preview purposes.");
        setBlogLoading(false);
        setReviewsLoading(false);
        setOrdersLoading(false);
        setPosts([]);
        setReviews([]);
        setOrders([]);
        setAppointments([]);
        return;
    }

    setBlogLoading(true);
    setReviewsLoading(true);
    setOrdersLoading(true);
    
    const [postsRes, reviewsRes, ordersRes, appointmentsRes] = await Promise.all([
        supabase.from('business_blog_posts').select('*').order('created_date', { ascending: false }),
        supabase.from('reviews').select('*').order('submitted_date', { ascending: false }),
        supabase.from('orders').select('*').order('submitted_at', { ascending: false }),
        supabase.from('appointments').select('*').order('created_at', { ascending: false })
    ]);

    if (postsRes.data) setPosts(postsRes.data.map(p => ({ ...p, businessId: p.business_id })) as BusinessBlogPost[]);
    if (postsRes.error) console.error("Error fetching business blog posts:", postsRes.error.message);
    
    if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
    if (reviewsRes.error) console.error("Error fetching reviews:", reviewsRes.error.message);

    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    if (ordersRes.error) console.error("Error fetching orders:", ordersRes.error.message);
    
    if (appointmentsRes.data) {
        const formattedAppointments = appointmentsRes.data.map(a => ({
            id: a.id,
            businessId: a.business_id,
            serviceId: a.service_id,
            serviceName: a.service_name,
            staffMemberId: a.staff_member_id,
            customerName: a.customer_name,
            customerEmail: a.customer_email,
            customerPhone: a.customer_phone,
            date: a.date,
            timeSlot: a.time_slot,
            status: a.status,
            notes: a.notes,
            createdAt: a.created_at,
        }));
        setAppointments(formattedAppointments as Appointment[]);
    }
    if (appointmentsRes.error) console.error("Error fetching appointments:", appointmentsRes.error.message);


    setBlogLoading(false);
    setReviewsLoading(false);
    setOrdersLoading(false);
  }, []);
  
  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // --- LOGIC (copied from old BusinessBlogDataContext) ---
  const addPost = async (newPostData: Omit<BusinessBlogPost, 'id' | 'slug' | 'createdDate' | 'viewCount'>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add post."); return; }
    const slug = newPostData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + `-${Date.now()}`;
    const postToAdd = {
        ...toSnakeCase(newPostData),
        slug: slug,
        view_count: 0,
    };
    const { error } = await supabase.from('business_blog_posts').insert(postToAdd);
    if (error) console.error("Error adding business post:", error.message);
    else await fetchAllData();
  };
  const updatePost = async (updatedPost: BusinessBlogPost) => {
      if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update post."); return; }
      const { id, ...postToUpdate } = updatedPost;
      const { error } = await supabase.from('business_blog_posts').update(toSnakeCase(postToUpdate)).eq('id', id);
      if (error) console.error("Error updating business post:", error.message);
      else await fetchAllData();
  };
  const deletePost = async (postId: string) => {
      if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete post."); return; }
      const { error } = await supabase.from('business_blog_posts').delete().eq('id', postId);
      if (error) console.error("Error deleting business post:", error.message);
      else await fetchAllData();
  };
  const getPostBySlug = (slug: string) => posts.find(p => p.slug === slug);
  const getPostsByBusinessId = (businessId: number) => posts.filter(p => p.businessId === businessId);
  const incrementViewCount = async (postId: string) => { 
    if (!isSupabaseConfigured) return;
    /* ... implementation unchanged ... */ 
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
        status: 'Visible',
    };
    const { error } = await supabase.from('reviews').insert(newReview);
    if (error) {
        console.error("Error adding review:", error.message);
        throw error;
    } else {
        await fetchAllData();
    }
  };
  const addReply = async (reviewId: string, replyContent: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add reply."); throw new Error("Preview Mode"); }
    const reply = { content: replyContent, replied_date: new Date().toISOString() };
    const { error } = await supabase.from('reviews').update({ reply }).eq('id', reviewId);
    if (error) {
        console.error("Error adding reply:", error.message);
        throw error;
    } else {
        await fetchAllData();
    }
  };
  const toggleReviewVisibility = async (reviewId: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot change review visibility."); return; }
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    const newStatus = review.status === 'Visible' ? 'Hidden' : 'Visible';
    const { error } = await supabase.from('reviews').update({ status: newStatus }).eq('id', reviewId);
    if (error) {
        console.error("Error toggling review visibility:", error.message);
        throw error;
    } else {
        await fetchAllData();
    }
  };
  const getReviewsByBusinessId = (businessId: number) => reviews.filter(r => r.business_id === businessId);
  const getAnalyticsByBusinessId = (businessId: number) => analyticsData.find(data => data.businessId === businessId);
  
  const addAppointment = async (newAppointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add appointment."); throw new Error("Preview Mode"); }
    const appointmentToAdd = toSnakeCase(newAppointmentData);
    const { error } = await supabase.from('appointments').insert(appointmentToAdd);
    if (error) {
        console.error("Error adding appointment:", error.message);
        throw error;
    } else {
        await fetchAllData();
    }
  };
  
  const updateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update appointment status."); return; }
    const { error } = await supabase.from('appointments').update({ status }).eq('id', appointmentId);
    if (error) {
        console.error("Error updating appointment status:", error.message);
        throw error;
    } else {
        await fetchAllData();
    }
  };
  
  const getAppointmentsForBusiness = (businessId: number) => appointments.filter(appt => appt.businessId === businessId);
  
  const addOrder = async (newOrderData: Omit<Order, 'id'>): Promise<Order> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add order."); throw new Error("Preview Mode"); }
    const { data, error } = await supabase.from('orders').insert(toSnakeCase(newOrderData)).select().single();
    if (error || !data) {
        console.error("Error adding order:", error);
        throw new Error("Failed to create order.");
    }
    await fetchAllData();
    return data as Order;
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
            const order = data as Order;
            const businessToUpdate = businesses.find(b => b.id === order.businessId);
            const packagePurchased = packages.find(p => p.id === order.packageId);

            if (businessToUpdate && packagePurchased) {
                const expiryDate = new Date();
                expiryDate.setMonth(expiryDate.getMonth() + packagePurchased.durationMonths);
                
                await updateBusiness({ 
                    ...businessToUpdate, 
                    membershipTier: packagePurchased.tier, 
                    membershipExpiryDate: expiryDate.toISOString(),
                    isActive: true, // Activate the business!
                });
                localStorage.removeItem(`expiry_notification_sent_${businessToUpdate.id}`);

                await addNotification(
                    businessToUpdate.email || '',
                    `Your ${packagePurchased.name} Plan is Active!`,
                    `Hello ${businessToUpdate.name},\n\nYour payment has been confirmed and your ${packagePurchased.name} membership plan is now active. Your business is now public on our directory! It will be valid until ${expiryDate.toLocaleDateString('vi-VN')}.\n\nThank you for partnering with us!\nThe BeautyDir Team`
                );
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
    getAnalyticsByBusinessId,
    appointments, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus,
    orders, ordersLoading, addOrder, updateOrderStatus,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
};

// --- CUSTOM HOOKS ---
export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within a BusinessProvider');
  return context;
};

// Sub-hooks for convenience
export const useBusinessAuth = () => ({ currentBusiness: useBusiness().currentBusiness });
export const useBusinessBlogData = () => {
  // FIX: Destructure 'blogLoading' instead of 'loading' to match the context value.
  const { posts, blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementViewCount, getPostsByBusinessId } = useBusiness();
  return { posts, loading: blogLoading, getPostBySlug, addPost, updatePost, deletePost, incrementViewCount, getPostsByBusinessId };
};
export const useDealsData = () => {
    const { addDeal, updateDeal, deleteDeal } = useBusiness();
    return { addDeal, updateDeal, deleteDeal };
};
export const useReviewsData = () => {
  const { reviews, reviewsLoading, getReviewsByBusinessId, addReview, addReply, toggleReviewVisibility } = useBusiness();
  return { reviews, loading: reviewsLoading, getReviewsByBusinessId, addReview, addReply, toggleReviewVisibility };
};
export const useAnalyticsData = () => ({ getAnalyticsByBusinessId: useBusiness().getAnalyticsByBusinessId });
export const useBookingData = () => {
  const { appointments, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus } = useBusiness();
  return { appointments, getAppointmentsForBusiness, addAppointment, updateAppointmentStatus };
};
export const useOrderData = () => {
  const { orders, ordersLoading, addOrder, updateOrderStatus } = useBusiness();
  return { orders, loading: ordersLoading, addOrder, updateOrderStatus };
};