
import { createContext, useState, useEffect, useContext, useCallback, useRef, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Business, BlogPost, BlogComment, BlogCategory, MembershipPackage, Service, MediaItem, TeamMember, Deal, Review, HomepageData, PageData } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { toSnakeCase } from '../lib/utils.ts';
import { useBusinesses } from '../src/features/directory/hooks/useBusinesses.ts';
import { useMarkers } from '../src/features/directory/hooks/useMarkers.ts';
import { useHomepageData as useNewHomepageData } from '../src/features/home/components/HomepageProvider.tsx';
import { usePublicPageContent as useNewPublicPageContent } from './PublicPageContentContext.tsx';

// --- CONTEXT TYPE DEFINITION ---
export interface PublicDataContextType {
  // Business Data
  businesses: Business[];
  businessMarkers: { id: number, name: string, slug?: string, logo_url?: string, image_url?: string, address?: string, rating?: number, review_count?: number, latitude: number, longitude: number, categories: string[], is_active: boolean }[];
  businessLoading: boolean;
  totalBusinesses: number;
  currentPage: number;
  fetchBusinesses: (page?: number, options?: { search?: string, location?: string, district?: string, category?: string }) => Promise<void>;
  addBusiness: (newBusiness: Business) => Promise<Business | null>;
  updateBusiness: (updatedBusiness: Business) => Promise<void>;
  deleteBusiness: (business_id: number) => Promise<void>;
  getBusinessBySlug: (slug: string) => Business | undefined;
  fetchBusinessBySlug: (slug: string) => Promise<Business | null>;
  incrementBusinessview_count: (business_id: number) => Promise<void>;
  // Service Data
  addService: (newServiceData: Omit<Service, 'id' | 'position'>) => Promise<void>;
  updateService: (updatedService: Service) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  updateServicesOrder: (orderedServices: Service[]) => Promise<void>;
  // Media/Gallery Data
  addMediaItem: (file: File, business_id: number) => Promise<void>;
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
  addBlogPost: (newPost: Omit<BlogPost, 'id' | 'slug' | 'date' | 'view_count'>) => Promise<void>;
  updateBlogPost: (updatedPost: BlogPost) => Promise<void>;
  deleteBlogPost: (post_id: number) => Promise<void>;
  getPostBySlug: (slug: string) => BlogPost | undefined;
  incrementBlogview_count: (post_id: number) => Promise<void>;
  comments: BlogComment[];
  getCommentsBypost_id: (post_id: number) => BlogComment[];
  addComment: (post_id: number, author_name: string, content: string) => void;
  blogCategories: BlogCategory[];
  addBlogCategory: (name: string) => Promise<void>;
  updateBlogCategory: (id: string, name: string) => Promise<void>;
  deleteBlogCategory: (id: string) => Promise<void>;
  // Membership Packages
  packages: MembershipPackage[];
  addPackage: (newPackage: Omit<MembershipPackage, 'id'>) => Promise<void>;
  updatePackage: (package_id: string, updates: Partial<MembershipPackage>) => Promise<void>;
  deletePackage: (package_id: string) => Promise<void>;

  // Backwards compatibility for homepage and public page data
  homepageData: HomepageData | undefined;
  homepageLoading: boolean;
  updateHomepageData: (newData: HomepageData) => Promise<unknown>;
  getPageContent: (page: 'about' | 'contact') => PageData | undefined;
  pageContentLoading: boolean;
}

// Export context so hooks file can use it
export const PublicDataContext = createContext<PublicDataContextType | undefined>(undefined);

const isDevelopment = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development';

export function PublicDataProvider({ children }: { children: ReactNode }) {
  // Use new providers via hooks for consolidated data
  const { homepageData, loading: homepageLoading, updateHomepageData } = useNewHomepageData();
  const { getPageContent, loading: pageContentLoading } = useNewPublicPageContent();

  // --- STATES & HOOKS ---
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState<{
    search?: string,
    location?: string,
    district?: string,
    category?: string
  }>({});

  const { data: businessQueryData, isLoading: businessLoading } = useBusinesses({
    page: currentPage,
    ...searchFilters
  });

  const { data: businessMarkers = [] } = useMarkers();

  const businesses = businessQueryData?.businesses || [];
  const totalBusinesses = businessQueryData?.total || 0;

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading] = useState(false);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [blogCategories] = useState<BlogCategory[]>([]);
  const [packages] = useState<MembershipPackage[]>([]);

  // --- DATA FETCHING ---
  const fetchBusinesses = useCallback(async (page: number = 1, options: {
    search?: string,
    location?: string,
    district?: string,
    category?: string
  } = {}): Promise<void> => {
    setCurrentPage(page);
    setSearchFilters(options);
  }, []);

  const refetchAllPublicData = useCallback(async (): Promise<void> => {
    // Handled by react-query hooks automatically if stale
  }, []);

  // --- BUSINESS LOGIC ---
  const addBusiness = async (newBusiness: Business): Promise<Business | null> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add business."); return null; }
    const businessData = { ...newBusiness } as Partial<Business>;
    delete businessData.id;
    delete businessData.services;
    delete businessData.gallery;
    delete businessData.team;
    delete businessData.deals;
    delete businessData.reviews;
    delete businessData.business_blog_posts;
    delete (businessData as any).businessBlogPosts; // Just in case
    const { data, error } = await supabase.from('businesses').insert(toSnakeCase(businessData) as any).select().single();
    if (error) {
      console.error('Error adding business:', error.message);
      throw error;
    }
    if (data) {
      const bId = data.id;
      const tasks = [];
      const stripId = (item: any) => { const { id, ...rest } = item; return rest; };
      if (newBusiness.services?.length) {
        tasks.push(supabase.from('services').insert(newBusiness.services.map((s, i) => ({ ...stripId(toSnakeCase(s)), business_id: bId, position: i }))));
      }
      if (newBusiness.gallery?.length) {
        tasks.push(supabase.from('media_items').insert(newBusiness.gallery.map((g, i) => ({ ...stripId(toSnakeCase(g)), business_id: bId, position: i }))));
      }
      if (newBusiness.team?.length) {
        tasks.push(supabase.from('team_members').insert(newBusiness.team.map(t => ({ ...stripId(toSnakeCase(t)), business_id: bId }))));
      }
      if (newBusiness.deals?.length) {
        tasks.push(supabase.from('deals').insert(newBusiness.deals.map(d => ({ ...stripId(toSnakeCase(d)), business_id: bId }))));
      }
      if (newBusiness.reviews?.length) {
        tasks.push(supabase.from('reviews').insert(newBusiness.reviews.map(r => ({ ...stripId(toSnakeCase(r)), business_id: bId }))));
      }

      if (tasks.length > 0) {
        try {
          await Promise.all(tasks);
        } catch (e) {
          console.error("Error inserting relational data:", e);
        }
      }

      await refetchAllPublicData();
      return data as Business;
    }
    return null;
  };

  const updateBusiness = async (updatedBusiness: Business) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update business."); return; }
    const { id } = updatedBusiness;

    // 1. Prepare core business data for update
    const businessToUpdate = { ...updatedBusiness } as Partial<Business & { business_blog_posts?: unknown }>;
    delete businessToUpdate.id;
    // We intentionally keep references for potential bulk updates if needed, 
    // but the main table update should strip them.
    const coreData = { ...businessToUpdate };
    delete coreData.services;
    delete coreData.gallery;
    delete coreData.team;
    delete coreData.deals;
    delete coreData.reviews;
    delete coreData.business_blog_posts;

    // 2. Perform updates in parallel
    try {
      const tasks = [];

      // Update core business info
      tasks.push(supabase.from('businesses').update(toSnakeCase(coreData) as any).eq('id', id));

      // helper to strip IDs for upsert (or keep them if they exist)
      const prepareForUpsert = (item: any) => {
        const cleaned = toSnakeCase(item);
        return { ...cleaned, business_id: id };
      };

      // Update related tables (Upsert pattern)
      if (updatedBusiness.services) {
        tasks.push(supabase.from('services').upsert(updatedBusiness.services.map((s, i) => ({ ...prepareForUpsert(s), position: s.position || i }))));
      }
      if (updatedBusiness.gallery) {
        tasks.push(supabase.from('media_items').upsert(updatedBusiness.gallery.map((g, i) => ({ ...prepareForUpsert(g), position: g.position || i }))));
      }
      if (updatedBusiness.team) {
        tasks.push(supabase.from('team_members').upsert(updatedBusiness.team.map(t => prepareForUpsert(t))));
      }
      if (updatedBusiness.deals) {
        tasks.push(supabase.from('deals').upsert(updatedBusiness.deals.map(d => prepareForUpsert(d))));
      }

      const results = await Promise.all(tasks);
      const errors = results.filter(r => r.error).map(r => r.error?.message);

      if (errors.length > 0) {
        console.error('Multiple update errors:', errors);
        toast.error('Có lỗi xảy ra khi lưu một số thành phần: ' + errors.join(', '));
      }

      await refetchAllPublicData();
    } catch (error: any) {
      console.error('Relational update exception:', error);
      toast.error('Lỗi hệ thống khi lưu: ' + error.message);
      throw error;
    }
  };

  const deleteBusiness = async (business_id: number): Promise<void> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete business."); return; }
    const { error } = await supabase.from('businesses').delete().eq('id', business_id);
    if (!error) await refetchAllPublicData();
  };

  const getBusinessBySlug = (slug: string): Business | undefined => {
    return businesses.find(b => b.slug === slug);
  };

  const businessesRef = useRef(businesses);
  useEffect(() => {
    businessesRef.current = businesses;
  }, [businesses]);

  const fetchBusinessBySlug = useCallback(async (slug: string): Promise<Business | null> => {
    if (!isSupabaseConfigured) {
      return businessesRef.current.find(b => b.slug === slug) || null;
    }

    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .single();

    if (businessError || !businessData) {
      return businessesRef.current.find(b => b.slug === slug) || null;
    }

    const business_id = businessData.id;
    const [servicesRes, mediaRes, teamRes, dealsRes, reviewsRes] = await Promise.all([
      supabase.from('services').select('*').eq('business_id', business_id).order('position', { ascending: true }),
      supabase.from('media_items').select('*').eq('business_id', business_id).order('position', { ascending: true }),
      supabase.from('team_members').select('*').eq('business_id', business_id),
      supabase.from('deals').select('*').eq('business_id', business_id),
      supabase.from('reviews').select('*').eq('business_id', business_id).order('submitted_date', { ascending: false })
    ]);

    return {
      ...(businessData as unknown as Business),
      services: (servicesRes.data || []) as unknown as Service[],
      gallery: (mediaRes.data || []) as unknown as MediaItem[],
      team: (teamRes.data || []) as unknown as TeamMember[],
      deals: (dealsRes.data || []) as unknown as Deal[],
      reviews: (reviewsRes.data || []) as unknown as Review[]
    };
  }, []);

  const incrementBusinessview_count = async (business_id: number) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.rpc('increment_business_view_count', { p_business_id: business_id });
    } catch (error) {
      if (isDevelopment) console.warn('[Tracking] Business view count increment failed:', error);
    }
  };

  const addService = async (newServiceData: Omit<Service, 'id' | 'position'>): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const currentServices = businesses.find(b => b.id === newServiceData.business_id)?.services || [];
    const newPosition = currentServices.length > 0 ? Math.max(...currentServices.map(s => s.position)) + 1 : 1;
    await supabase.from('services').insert({ ...toSnakeCase(newServiceData), position: newPosition });
    await refetchAllPublicData();
  };

  const updateService = async (updatedService: Service) => {
    const { id, ...serviceToUpdate } = updatedService;
    await supabase.from('services').update(toSnakeCase(serviceToUpdate)).eq('id', id);
    await refetchAllPublicData();
  };

  const deleteService = async (serviceId: string): Promise<void> => {
    await supabase.from('services').delete().eq('id', serviceId);
    await refetchAllPublicData();
  };

  const updateServicesOrder = async (orderedServices: Service[]): Promise<void> => {
    const updates = orderedServices.map((service, index) => ({ ...toSnakeCase(service), position: index + 1 }));
    await supabase.from('services').upsert(updates);
  };

  const addMediaItem = async (_file: File, _business_id: number): Promise<void> => {
    // Logic tải lên media yêu cầu các import về storage, đã được đơn giản hóa ở đây để phục hồi context
    toast.error("Việc tải lên media được xử lý bởi các hook chuyên dụng.");
  };

  const updateMediaItem = async (updatedItem: MediaItem): Promise<void> => {
    const { id, ...itemToUpdate } = updatedItem;
    await supabase.from('media_items').update(toSnakeCase(itemToUpdate)).eq('id', id);
    await refetchAllPublicData();
  };

  const deleteMediaItem = async (itemToDelete: MediaItem) => {
    await supabase.from('media_items').delete().eq('id', itemToDelete.id);
    await refetchAllPublicData();
  };

  const updateMediaOrder = async (orderedMedia: MediaItem[]): Promise<void> => {
    const updates = orderedMedia.map((item, index) => ({ ...toSnakeCase(item), position: index + 1 }));
    await supabase.from('media_items').upsert(updates);
  };

  const addTeamMember = async (newMemberData: Omit<TeamMember, 'id'>) => {
    await supabase.from('team_members').insert(toSnakeCase(newMemberData));
    await refetchAllPublicData();
  };

  const updateTeamMember = async (updatedMember: TeamMember) => {
    const { id, ...memberToUpdate } = updatedMember;
    await supabase.from('team_members').update(toSnakeCase(memberToUpdate)).eq('id', id);
    await refetchAllPublicData();
  };

  const deleteTeamMember = async (memberId: string): Promise<void> => {
    await supabase.from('team_members').delete().eq('id', memberId);
    await refetchAllPublicData();
  };

  const addDeal = async (newDealData: Omit<Deal, 'id'>): Promise<void> => {
    await supabase.from('deals').insert(toSnakeCase(newDealData));
    await refetchAllPublicData();
  };

  const updateDeal = async (updatedDeal: Deal) => {
    const { id, ...dealToUpdate } = updatedDeal;
    await supabase.from('deals').update(toSnakeCase(dealToUpdate)).eq('id', id);
    await refetchAllPublicData();
  };

  const deleteDeal = async (dealId: string): Promise<void> => {
    await supabase.from('deals').delete().eq('id', dealId);
    await refetchAllPublicData();
  };

  // --- BLOG LOGIC ---
  const fetchComments = useCallback(async (): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.from('blog_comments').select('*').order('date', { ascending: false });
    if (data) {
      setComments((data || []).map((comment) => ({
        id: comment.id,
        post_id: comment.post_id,
        author_name: comment.author_name,
        author_avatar_url: '',
        content: comment.content,
        date: comment.date || comment.created_at || new Date().toISOString(),
      })));
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addBlogPost = async (newPostData: Omit<BlogPost, 'id' | 'slug' | 'date' | 'view_count'>): Promise<void> => {
    const slug = newPostData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + `-${Date.now()}`;
    await supabase.from('blog_posts').insert(toSnakeCase({ ...newPostData, slug, view_count: 0, date: new Date().toISOString() }));
    await refetchAllPublicData();
  };

  const updateBlogPost = async (updatedPost: BlogPost) => {
    await supabase.from('blog_posts').update(toSnakeCase(updatedPost)).eq('id', updatedPost.id);
    await refetchAllPublicData();
  };

  const deleteBlogPost = async (post_id: number): Promise<void> => {
    await supabase.from('blog_posts').delete().eq('id', post_id);
    await refetchAllPublicData();
  };

  const getPostBySlug = (slug: string): BlogPost | undefined => {
    return blogPosts.find(p => p.slug === slug);
  };

  const incrementBlogview_count = async (post_id: number) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.rpc('increment_blog_view_count', { p_post_id: post_id });
      setBlogPosts(prev => prev.map((b: BlogPost) => b.id === post_id ? { ...b, view_count: (b.view_count || 0) + 1 } : b));
    } catch (e) {
      if (isDevelopment) console.warn('Blog view increment failed');
    }
  };

  const getCommentsBypost_id = (post_id: number): BlogComment[] => {
    return comments.filter(c => c.post_id === post_id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const addComment = async (post_id: number, author_name: string, content: string) => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.from('blog_comments').insert({ post_id, author_name, content, date: new Date().toISOString() }).select().single();
    if (data) {
      setComments(prev => [...prev, {
        id: data.id,
        post_id: data.post_id,
        author_name: data.author_name,
        author_avatar_url: '',
        content: data.content,
        date: data.date || data.created_at || new Date().toISOString()
      }]);
    }
  };

  const addBlogCategory = async (name: string): Promise<void> => {
    await supabase.from('blog_categories').insert({ name: name.trim() });
    await refetchAllPublicData();
  };

  const updateBlogCategory = async (id: string, name: string): Promise<void> => {
    await supabase.from('blog_categories').update({ name }).eq('id', id);
    await refetchAllPublicData();
  };

  const deleteBlogCategory = async (id: string): Promise<void> => {
    await supabase.from('blog_categories').delete().eq('id', id);
    await refetchAllPublicData();
  };

  const addPackage = async (newPackage: Omit<MembershipPackage, 'id'>): Promise<void> => {
    await supabase.from('membership_packages').insert(toSnakeCase({ ...newPackage, id: `pkg_${crypto.randomUUID()}` }));
    await refetchAllPublicData();
  };

  const updatePackage = async (package_id: string, updates: Partial<MembershipPackage>): Promise<void> => {
    await supabase.from('membership_packages').update(toSnakeCase(updates)).eq('id', package_id);
    await refetchAllPublicData();
  };

  const deletePackage = async (package_id: string): Promise<void> => {
    await supabase.from('membership_packages').delete().eq('id', package_id);
    await refetchAllPublicData();
  };

  // --- COMBINED VALUE ---
  const value: PublicDataContextType = {
    businesses, businessMarkers, businessLoading, totalBusinesses, currentPage, fetchBusinesses,
    addBusiness, updateBusiness, deleteBusiness, getBusinessBySlug, fetchBusinessBySlug, incrementBusinessview_count,
    addService, updateService, deleteService, updateServicesOrder,
    addMediaItem, updateMediaItem, deleteMediaItem, updateMediaOrder,
    addTeamMember, updateTeamMember, deleteTeamMember,
    addDeal, updateDeal, deleteDeal,
    blogPosts, blogLoading, addBlogPost, updateBlogPost, deleteBlogPost, getPostBySlug, incrementBlogview_count,
    comments, getCommentsBypost_id, addComment, blogCategories, addBlogCategory, updateBlogCategory, deleteBlogCategory,
    packages, addPackage, updatePackage, deletePackage,
    homepageData, homepageLoading, updateHomepageData: async (d) => updateHomepageData(d),
    getPageContent, pageContentLoading
  };

  return (
    <PublicDataContext.Provider value={value}>
      {children}
    </PublicDataContext.Provider>
  );
}

// Unified Hooks
export const useBusinessData = () => {
  const context = useContext(PublicDataContext);
  if (!context) throw new Error('useBusinessData must be used within PublicDataProvider');
  return context;
};

export const useBlogData = () => {
  const context = useBusinessData();
  return {
    blogPosts: context.blogPosts,
    loading: context.blogLoading,
    addBlogPost: context.addBlogPost,
    updateBlogPost: context.updateBlogPost,
    deleteBlogPost: context.deleteBlogPost,
    getPostBySlug: context.getPostBySlug,
    incrementview_count: context.incrementBlogview_count,
    comments: context.comments,
    getCommentsBypost_id: context.getCommentsBypost_id,
    addComment: context.addComment,
    blogCategories: context.blogCategories,
    addBlogCategory: context.addBlogCategory,
    updateBlogCategory: context.updateBlogCategory,
    deleteBlogCategory: context.deleteBlogCategory,
    categories: context.blogCategories,
    addCategory: context.addBlogCategory,
    updateCategory: context.updateBlogCategory,
    deleteCategory: context.deleteBlogCategory
  };
};

export const useMembershipPackageData = () => {
  const context = useBusinessData();
  return {
    packages: context.packages,
    addPackage: context.addPackage,
    updatePackage: context.updatePackage,
    deletePackage: context.deletePackage
  };
};

export const useHomepageData = () => {
  const context = useContext(PublicDataContext);
  if (!context) throw new Error('useHomepageData must be used within PublicDataProvider');
  return {
    homepageData: context.homepageData,
    updateHomepageData: context.updateHomepageData,
    loading: context.homepageLoading
  };
};

export const usePublicPageContent = () => {
  const context = useContext(PublicDataContext);
  if (!context) throw new Error('usePublicPageContent must be used within PublicDataProvider');
  return {
    getPageContent: context.getPageContent,
    loading: context.pageContentLoading
  };
};
