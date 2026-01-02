

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Business, BlogPost, BlogComment, BlogCategory, MembershipPackage, Service, MediaItem, TeamMember, Deal, MediaType } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { useAdmin, useAdminAuth } from './AdminContext.tsx';
import { uploadFile, deleteFileByUrl } from '../lib/storage.ts';

// --- CACHE CONSTANTS ---
const PUBLIC_DATA_CACHE_KEY = 'publicDataCache';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes


// --- CONTEXT TYPE DEFINITION ---
interface PublicDataContextType {
  // Business Data
  businesses: Business[];
  businessLoading: boolean;
  addBusiness: (newBusiness: Business) => Promise<Business | null>;
  updateBusiness: (updatedBusiness: Business) => Promise<void>;
  deleteBusiness: (businessId: number) => Promise<void>;
  getBusinessBySlug: (slug: string) => Business | undefined;
  fetchBusinessBySlug: (slug: string) => Promise<Business | null>; // NEW: On-demand detailed fetch
  incrementBusinessViewCount: (businessId: number) => Promise<void>;
  // Service Data
  addService: (newServiceData: Omit<Service, 'id' | 'position'>) => Promise<void>;
  updateService: (updatedService: Service) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  updateServicesOrder: (orderedServices: Service[]) => Promise<void>;
  // Media/Gallery Data
  addMediaItem: (file: File, businessId: number) => Promise<void>;
  updateMediaItem: (updatedItem: MediaItem) => Promise<void>;
  deleteMediaItem: (itemToDelete: MediaItem) => Promise<void>;
  updateMediaOrder: (orderedMedia: MediaItem[]) => Promise<void>;
  // Team Data
  addTeamMember: (newMemberData: Omit<TeamMember, 'id'>) => Promise<void>;
  updateTeamMember: (updatedMember: TeamMember) => Promise<void>;
  deleteTeamMember: (memberId: string) => Promise<void>;
  // Deal Data
  addDeal: (newDealData: Omit<Deal, 'id'>) => Promise<void>;
  updateDeal: (updatedDeal: Deal) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  // Blog Data
  blogPosts: BlogPost[];
  blogLoading: boolean;
  addBlogPost: (newPost: Omit<BlogPost, 'id' | 'slug' | 'date' | 'viewCount'>) => Promise<void>;
  updateBlogPost: (updatedPost: BlogPost) => Promise<void>;
  deleteBlogPost: (postId: number) => Promise<void>;
  getPostBySlug: (slug: string) => BlogPost | undefined;
  incrementBlogViewCount: (postId: number) => Promise<void>;
  comments: BlogComment[];
  getCommentsByPostId: (postId: number) => BlogComment[];
  addComment: (postId: number, authorName: string, content: string) => void;
  blogCategories: BlogCategory[];
  addBlogCategory: (name: string) => Promise<void>;
  updateBlogCategory: (id: string, name: string) => Promise<void>;
  deleteBlogCategory: (id: string) => Promise<void>;
  // Membership Packages
  packages: MembershipPackage[];
  addPackage: (newPackage: Omit<MembershipPackage, 'id'>) => Promise<void>;
  updatePackage: (packageId: string, updates: Partial<MembershipPackage>) => Promise<void>;
  deletePackage: (packageId: string) => Promise<void>;
}

const PublicDataContext = createContext<PublicDataContextType | undefined>(undefined);

const COMMENTS_LOCAL_STORAGE_KEY = 'blog_comments';

// Helper to convert JS object keys from camelCase to snake_case for Supabase write operations.
const toSnakeCase = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  return Object.keys(obj).reduce((acc: any, key: string) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
};

export const PublicDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATES ---
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [packages, setPackages] = useState<MembershipPackage[]>([]);

  const { logAdminAction } = useAdmin();
  const { currentUser: currentAdmin } = useAdminAuth();

  // --- DATA FETCHING ---
  const fetchAllPublicData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. Serving empty data for preview purposes. All write operations will fail.");
      setBusinessLoading(false);
      setBlogLoading(false);
      setBusinesses([]);
      setBlogPosts([]);
      setBlogCategories([]);
      setPackages([]);
      return;
    }

    // 1. Try to load from cache
    try {
      const cachedDataJSON = localStorage.getItem(PUBLIC_DATA_CACHE_KEY);
      if (cachedDataJSON) {
        const { timestamp, data } = JSON.parse(cachedDataJSON);
        if (Date.now() - timestamp < CACHE_DURATION_MS && data) {
          console.log("Loading public data from cache.");
          setBusinesses(data.businesses || []);
          setBlogPosts(data.blogPosts || []);
          setBlogCategories(data.blogCategories || []);
          setPackages(data.packages || []);
          setBusinessLoading(false);
          setBlogLoading(false);
          return; // Exit if cache is valid
        }
      }
    } catch (e) {
      console.error("Failed to read cache:", e);
    }

    // 2. If cache is invalid or missing, fetch from Supabase
    setBusinessLoading(true);
    setBlogLoading(true);

    // OPTIMIZED: Remove heavy relations from initial fetch
    const [bizRes, blogRes, catRes, pkgRes] = await Promise.all([
      supabase.from('businesses').select('*').order('is_featured', { ascending: false }).order('id', { ascending: true }),
      supabase.from('blog_posts').select('*').order('date', { ascending: false }),
      supabase.from('blog_categories').select('*').order('name'),
      supabase.from('membership_packages').select('*').order('price')
    ]);

    let fetchedBusinesses: Business[] = [];
    let fetchedBlogPosts: BlogPost[] = [];
    let fetchedCategories: BlogCategory[] = [];
    let fetchedPackages: MembershipPackage[] = [];

    if (bizRes.error) {
      console.error('Error fetching businesses:', bizRes.error.message);
    } else if (bizRes.data) {
      // No formatting needed for relations since we aren't fetching them yet
      fetchedBusinesses = bizRes.data.map(b => ({ ...b, services: [], gallery: [], team: [], deals: [], reviews: [] })) as Business[];
    }
    setBusinessLoading(false);

    if (blogRes.error) console.error("Error fetching blog posts:", blogRes.error.message);
    else if (blogRes.data) fetchedBlogPosts = blogRes.data as BlogPost[];
    setBlogLoading(false);

    if (catRes.error) {
      console.error("Error fetching blog categories:", catRes.error.message);
      toast.error(`Could not load blog categories: ${catRes.error.message}`);
    } else if (catRes.data) {
      fetchedCategories = catRes.data as BlogCategory[];
    }

    if (pkgRes.error) {
      console.error("Error fetching packages:", pkgRes.error.message);
      toast.error(`Could not load membership packages: ${pkgRes.error.message}`);
    } else if (pkgRes.data) {
      fetchedPackages = pkgRes.data as MembershipPackage[];
    }

    // Update state with fetched data
    setBusinesses(fetchedBusinesses);
    setBlogPosts(fetchedBlogPosts);
    setBlogCategories(fetchedCategories);
    setPackages(fetchedPackages);

    // 3. Save new data to cache
    try {
      const cachePayload = {
        timestamp: Date.now(),
        data: {
          businesses: fetchedBusinesses,
          blogPosts: fetchedBlogPosts,
          blogCategories: fetchedCategories,
          packages: fetchedPackages,
        },
      };
      localStorage.setItem(PUBLIC_DATA_CACHE_KEY, JSON.stringify(cachePayload));
      console.log("Public data fetched from Supabase and cached.");
    } catch (e) {
      console.error("Failed to write to cache:", e);
    }
  }, []);

  useEffect(() => { fetchAllPublicData(); }, [fetchAllPublicData]);

  // --- BUSINESS LOGIC ---
  const addBusiness = async (newBusiness: Business): Promise<Business | null> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add business."); return null; }
    const { id, services, gallery, team, deals, reviews, ...businessData } = newBusiness;
    const { data, error } = await supabase.from('business').insert(toSnakeCase(businessData)).select().single();
    if (error) { console.error('Error adding business:', error.message); return null; }
    if (data) { await fetchAllPublicData(); if (currentAdmin) logAdminAction(currentAdmin.username, 'Add Business', `Added new business: ${data.name} (ID: ${data.id}).`); return data as Business; }
    return null;
  };

  const updateBusiness = async (updatedBusiness: Business) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update business."); return; }
    const { id, services, gallery, team, deals, reviews, ...businessToUpdate } = updatedBusiness;
    const { error } = await supabase.from('business').update(toSnakeCase(businessToUpdate)).eq('id', id);
    if (error) { console.error('Error updating business:', error.message); } else { await fetchAllPublicData(); }
  };
  const deleteBusiness = async (businessId: number) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete business."); return; }
    /* ... implementation unchanged ... */
  };

  // Existing synchronous getter (from loaded list)
  const getBusinessBySlug = (slug: string) => businesses.find(b => b.slug === slug);

  // NEW: Async detailed getter
  const fetchBusinessBySlug = useCallback(async (slug: string): Promise<Business | null> => {
    if (!isSupabaseConfigured) return businesses.find(b => b.slug === slug) || null;

    // 1. Fetch the main business record
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .single();

    if (businessError || !businessData) {
      console.error("Error fetching business details:", businessError?.message);
      return null;
    }

    // 2. Parallel fetch for relations
    const businessId = businessData.id;
    const [servicesRes, mediaRes, teamRes, dealsRes, reviewsRes] = await Promise.all([
      supabase.from('services').select('*').eq('business_id', businessId).order('position', { ascending: true }),
      supabase.from('media_items').select('*').eq('business_id', businessId).order('position', { ascending: true }),
      supabase.from('team_members').select('*').eq('business_id', businessId),
      supabase.from('deals').select('*').eq('business_id', businessId),
      supabase.from('reviews').select('*').eq('business_id', businessId)
    ]);

    // 3. Assemble full object
    const fullBusiness: Business = {
      ...businessData,
      services: servicesRes.data || [],
      gallery: mediaRes.data || [], // Map to 'gallery'
      team: teamRes.data || [],
      deals: dealsRes.data || [],
      reviews: reviewsRes.data || []
    };

    return fullBusiness;
  }, [businesses]); // Depend on businesses if we want fallback, but mainly standalone

  const incrementBusinessViewCount = async (businessId: number) => {
    if (!isSupabaseConfigured) return; // Silent fail in preview
    const { error } = await supabase.rpc('increment_view_count', { p_business_id: businessId });
    if (error) console.error('Error incrementing view count:', error.message);
    else setBusinesses(prev => prev.map(b => b.id === businessId ? { ...b, viewCount: (b.viewCount || 0) + 1 } : b));
  };

  // --- SERVICES LOGIC ---
  const addService = async (newServiceData: Omit<Service, 'id' | 'position'>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add service."); return; }
    const currentServices = businesses.find(b => b.id === newServiceData.business_id)?.services || [];
    const newPosition = currentServices.length > 0 ? Math.max(...currentServices.map(s => s.position)) + 1 : 1;
    const { error } = await supabase.from('services').insert({ ...toSnakeCase(newServiceData), position: newPosition });
    if (error) console.error("Error adding service:", error.message);
    else await fetchAllPublicData();
  };
  const updateService = async (updatedService: Service) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update service."); return; }
    const { id, ...serviceToUpdate } = updatedService;
    const { error } = await supabase.from('services').update(toSnakeCase(serviceToUpdate)).eq('id', id);
    if (error) console.error("Error updating service:", error.message);
    else await fetchAllPublicData();
  };
  const deleteService = async (serviceId: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete service."); return; }
    const { error } = await supabase.from('services').delete().eq('id', serviceId);
    if (error) console.error("Error deleting service:", error.message);
    else await fetchAllPublicData();
  };
  const updateServicesOrder = async (orderedServices: Service[]) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot reorder services."); return; }
    const updates = orderedServices.map((service, index) => ({ id: service.id, position: index + 1 }));
    const { error } = await supabase.from('services').upsert(updates);
    if (error) toast.error("Could not save new service order.");
  };

  // --- MEDIA/GALLERY LOGIC ---
  const addMediaItem = async (file: File, businessId: number) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot upload media."); return; }
    const publicUrl = await uploadFile('business-assets', file, `${businessId}/gallery`);
    const isImage = file.type.startsWith('image/');
    const currentMedia = businesses.find(b => b.id === businessId)?.gallery || [];
    const newPosition = currentMedia.length > 0 ? Math.max(...currentMedia.map(m => m.position)) + 1 : 1;
    const newItem = { business_id: businessId, url: publicUrl, type: isImage ? MediaType.IMAGE : MediaType.VIDEO, title: file.name, position: newPosition };
    const { error } = await supabase.from('media_items').insert(newItem);
    if (error) console.error("Error adding media item:", error.message);
    else await fetchAllPublicData();
  };
  const updateMediaItem = async (updatedItem: MediaItem) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update media."); return; }
    const { id, ...itemToUpdate } = updatedItem;
    const { error } = await supabase.from('media_items').update(toSnakeCase(itemToUpdate)).eq('id', id);
    if (error) console.error("Error updating media item:", error.message);
    else await fetchAllPublicData();
  };
  const deleteMediaItem = async (itemToDelete: MediaItem) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete media."); return; }
    await deleteFileByUrl('business-assets', itemToDelete.url);
    const { error } = await supabase.from('media_items').delete().eq('id', itemToDelete.id);
    if (error) console.error("Error deleting media item record:", error.message);
    else await fetchAllPublicData();
  };
  const updateMediaOrder = async (orderedMedia: MediaItem[]) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot reorder media."); return; }
    const updates = orderedMedia.map((item, index) => ({ id: item.id, position: index + 1, }));
    const { error } = await supabase.from('media_items').upsert(updates);
    if (error) toast.error("Could not save new media order.");
  };

  // --- TEAM LOGIC ---
  const addTeamMember = async (newMemberData: Omit<TeamMember, 'id'>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add team member."); return; }
    const { error } = await supabase.from('team_members').insert(toSnakeCase(newMemberData));
    if (error) console.error("Error adding team member:", error.message);
    else await fetchAllPublicData();
  };
  const updateTeamMember = async (updatedMember: TeamMember) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update team member."); return; }
    const { id, ...memberToUpdate } = updatedMember;
    const { error } = await supabase.from('team_members').update(toSnakeCase(memberToUpdate)).eq('id', id);
    if (error) console.error("Error updating team member:", error.message);
    else await fetchAllPublicData();
  };
  const deleteTeamMember = async (memberId: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete team member."); return; }
    const { error } = await supabase.from('team_members').delete().eq('id', memberId);
    if (error) console.error("Error deleting team member:", error.message);
    else await fetchAllPublicData();
  };

  // --- DEALS LOGIC ---
  const addDeal = async (newDealData: Omit<Deal, 'id'>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add deal."); return; }
    const { error } = await supabase.from('deals').insert(toSnakeCase(newDealData));
    if (error) { toast.error(`Failed to add deal: ${error.message}`); }
    else { await fetchAllPublicData(); toast.success('Deal added successfully!'); }
  };
  const updateDeal = async (updatedDeal: Deal) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update deal."); return; }
    const { id, ...dealToUpdate } = updatedDeal;
    const { error } = await supabase.from('deals').update(toSnakeCase(dealToUpdate)).eq('id', id);
    if (error) { toast.error(`Failed to update deal: ${error.message}`); }
    else { await fetchAllPublicData(); toast.success('Deal updated successfully!'); }
  };
  const deleteDeal = async (dealId: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete deal."); return; }
    const { error } = await supabase.from('deals').delete().eq('id', dealId);
    if (error) { toast.error(`Failed to delete deal: ${error.message}`); }
    else { await fetchAllPublicData(); toast.success('Deal deleted successfully!'); }
  };

  // --- BLOG LOGIC ---
  useEffect(() => {
    try {
      const savedCommentsJSON = localStorage.getItem(COMMENTS_LOCAL_STORAGE_KEY);
      setComments(savedCommentsJSON ? JSON.parse(savedCommentsJSON) : []);
    } catch (e) { console.error(e) }
  }, []);

  const addBlogPost = async (newPostData: Omit<BlogPost, 'id' | 'slug' | 'date' | 'viewCount'>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add blog post."); return; }
    const slug = newPostData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + `-${Date.now()}`;
    const postToAdd = { ...newPostData, slug, date: new Date().toLocaleDateString('en-GB'), view_count: 0 };
    const { error } = await supabase.from('blog_posts').insert(postToAdd);
    if (!error) await fetchAllPublicData();
  };
  const updateBlogPost = async (updatedPost: BlogPost) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update blog post."); return; }
    const { id, ...postToUpdate } = updatedPost;
    const { error } = await supabase.from('blog_posts').update(postToUpdate).eq('id', id);
    if (!error) await fetchAllPublicData();
  };
  const deleteBlogPost = async (postId: number) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete blog post."); return; }
    const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
    if (!error) await fetchAllPublicData();
  };
  const getPostBySlug = (slug: string) => blogPosts.find(p => p.slug === slug);
  const incrementBlogViewCount = async (postId: number) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.rpc('increment_blog_view_count', { p_post_id: postId });
    if (!error) setBlogPosts(prev => prev.map(p => p.id === postId ? { ...p, viewCount: p.viewCount + 1 } : p));
  };
  const getCommentsByPostId = (postId: number) => comments.filter(c => c.postId === postId);
  const addComment = (postId: number, authorName: string, content: string) => { /* ... */ };

  const addBlogCategory = async (name: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add category."); return; }
    if (name.trim() === '' || blogCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) { return toast.error("Category name cannot be empty or duplicate."); }
    const { error } = await supabase.from('blog_categories').insert({ name });
    if (!error) { await fetchAllPublicData(); toast.success("Category added."); }
    else { toast.error(`Failed to add category: ${error.message}`); }
  };
  const updateBlogCategory = async (id: string, name: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update category."); return; }
    const { error } = await supabase.from('blog_categories').update({ name }).eq('id', id);
    if (!error) { await fetchAllPublicData(); toast.success("Category updated."); }
    else { toast.error(`Failed to update category: ${error.message}`); }
  };
  const deleteBlogCategory = async (id: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete category."); return; }
    const { error } = await supabase.from('blog_categories').delete().eq('id', id);
    if (!error) { await fetchAllPublicData(); toast.success("Category deleted."); }
    else { toast.error(`Failed to delete category: ${error.message}`); }
  };

  // --- PACKAGES LOGIC ---
  const addPackage = async (newPackage: Omit<MembershipPackage, 'id'>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add package."); return; }
    const { error } = await supabase.from('membership_packages').insert({ ...newPackage, id: `pkg_${crypto.randomUUID()}` });
    if (!error) { await fetchAllPublicData(); toast.success("Package added."); }
    else { toast.error(`Failed to add package: ${error.message}`); }
  };
  const updatePackage = async (packageId: string, updates: Partial<MembershipPackage>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update package."); return; }
    const { error } = await supabase.from('membership_packages').update(updates).eq('id', packageId);
    if (!error) { await fetchAllPublicData(); toast.success("Package updated."); }
    else { toast.error(`Failed to update package: ${error.message}`); }
  };
  const deletePackage = async (packageId: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete package."); return; }
    const { error } = await supabase.from('membership_packages').delete().eq('id', packageId);
    if (!error) { await fetchAllPublicData(); toast.success("Package deleted."); }
    else { toast.error(`Failed to delete package: ${error.message}`); }
  };

  // --- COMBINED VALUE ---
  const value = {
    businesses, businessLoading, addBusiness, updateBusiness, deleteBusiness, getBusinessBySlug, fetchBusinessBySlug, incrementBusinessViewCount,
    addService, updateService, deleteService, updateServicesOrder,
    addMediaItem, updateMediaItem, deleteMediaItem, updateMediaOrder,
    addTeamMember, updateTeamMember, deleteTeamMember,
    addDeal, updateDeal, deleteDeal,
    blogPosts, blogLoading, addBlogPost, updateBlogPost, deleteBlogPost, getPostBySlug, incrementBlogViewCount, comments, getCommentsByPostId, addComment, blogCategories, addBlogCategory, updateBlogCategory, deleteBlogCategory,
    packages, addPackage, updatePackage, deletePackage,
  };

  return (
    <PublicDataContext.Provider value={value}>
      {children}
    </PublicDataContext.Provider>
  );
};

// --- CUSTOM HOOKS ---
const usePublicData = () => {
  const context = useContext(PublicDataContext);
  if (!context) throw new Error('usePublicData must be used within a PublicDataProvider');
  return context;
};

export const useBusinessData = () => {
  const { businesses, businessLoading, addBusiness, updateBusiness, deleteBusiness, getBusinessBySlug, fetchBusinessBySlug, incrementBusinessViewCount, addService, updateService, deleteService, updateServicesOrder, addMediaItem, updateMediaItem, deleteMediaItem, updateMediaOrder, addTeamMember, updateTeamMember, deleteTeamMember, addDeal, updateDeal, deleteDeal } = usePublicData();
  return { businesses, loading: businessLoading, addBusiness, updateBusiness, deleteBusiness, getBusinessBySlug, fetchBusinessBySlug, incrementBusinessViewCount, addService, updateService, deleteService, updateServicesOrder, addMediaItem, updateMediaItem, deleteMediaItem, updateMediaOrder, addTeamMember, updateTeamMember, deleteTeamMember, addDeal, updateDeal, deleteDeal };
};

export const useBlogData = () => {
  const { blogPosts, blogLoading, addBlogPost, updateBlogPost, deleteBlogPost, getPostBySlug, incrementBlogViewCount, comments, getCommentsByPostId, addComment, blogCategories, addBlogCategory, updateBlogCategory, deleteBlogCategory } = usePublicData();
  return { blogPosts, loading: blogLoading, addBlogPost, updateBlogPost, deleteBlogPost, getPostBySlug, incrementViewCount: incrementBlogViewCount, comments, getCommentsByPostId, addComment, blogCategories, addBlogCategory, updateBlogCategory, deleteBlogCategory };
};

export const useMembershipPackageData = () => {
  const { packages, addPackage, updatePackage, deletePackage } = usePublicData();
  return { packages, addPackage, updatePackage, deletePackage };
};
