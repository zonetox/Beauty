import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import toast from 'react-hot-toast';
import { BlogPost, BlogComment, BlogCategory } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { BLOG_CATEGORIES as initialBlogCategories } from '../constants.ts';

interface BlogDataContextType {
  blogPosts: BlogPost[];
  loading: boolean;
  addBlogPost: (newPost: Omit<BlogPost, 'id' | 'slug' | 'date' | 'viewCount' | 'updatedAt'>) => Promise<void>;
  updateBlogPost: (updatedPost: BlogPost) => Promise<void>;
  deleteBlogPost: (postId: number) => Promise<void>;
  bulkAddBlogPosts: (posts: Omit<BlogPost, 'id' | 'slug' | 'date' | 'viewCount' | 'updatedAt'>[]) => Promise<{ success: number; failed: number }>;
  getPostBySlug: (slug: string) => BlogPost | undefined;
  incrementViewCount: (postId: number) => Promise<void>;
  comments: BlogComment[];
  getCommentsByPostId: (postId: number) => BlogComment[];
  addComment: (postId: number, authorName: string, content: string) => void;
  blogCategories: BlogCategory[];
  addBlogCategory: (name: string) => Promise<void>;
  updateBlogCategory: (id: string, name: string) => Promise<void>;
  deleteBlogCategory: (id: string) => Promise<void>;
}

// Database Row Interface
interface BlogPostDbRow {
  id: number;
  slug: string;
  title: string;
  image_url: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  content: string;
  view_count: number;
  status: string;
  is_featured: boolean;
  seo: any;
  updated_at: string;
}

const BlogDataContext = createContext<BlogDataContextType | undefined>(undefined);




export const BlogDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);

  // Fetch blog posts from Supabase
  useEffect(() => {
    let cancelled = false;

    const fetchBlogPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('blog_posts')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error("Error fetching blog posts:", error);
      } else if (data && !cancelled) {
        setBlogPosts((data as any[]).map((post) => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          imageUrl: post.image_url,
          excerpt: post.excerpt,
          author: post.author,
          date: post.date,
          category: post.category,
          content: post.content,
          viewCount: post.view_count || 0,
          status: post.status || 'Published',
          isFeatured: post.is_featured,
          seo: post.seo,
          updatedAt: post.updated_at
        })));
      }
      if (!cancelled) {
        setLoading(false);
      }
    };

    fetchBlogPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch comments from database (C2.4: Migrated from localStorage)
  // Move fetchComments outside useEffect so it can be called from other places
  const fetchComments = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage if Supabase not configured
      try {
        const savedCommentsJSON = localStorage.getItem('blog_comments');
        if (savedCommentsJSON) {
          setComments(JSON.parse(savedCommentsJSON));
        }
      } catch (error) {
        console.error('Failed to parse comments from localStorage:', error);
        setComments([]);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching blog comments:', error);
        // Fallback to localStorage
        try {
          const savedCommentsJSON = localStorage.getItem('blog_comments');
          if (savedCommentsJSON) {
            setComments(JSON.parse(savedCommentsJSON));
          }
        } catch (e) {
          console.error('Failed to parse comments from localStorage:', e);
        }
      } else if (data) {
        const mappedComments: BlogComment[] = data.map(comment => ({
          id: comment.id,
          postId: comment.post_id,
          authorName: comment.author_name,
          authorAvatarUrl: `https://picsum.photos/seed/${comment.author_name.replace(/\s+/g, '-')}/100/100`,
          content: comment.content,
          date: comment.date || comment.created_at || new Date().toISOString(),
        }));
        setComments(mappedComments);
      }
    } catch (error) {
      console.error('Error in fetchComments:', error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComments();
  }, [fetchComments]);

  // Fetch blog categories from Supabase
  const fetchBlogCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching blog categories:', error);
        setBlogCategories(initialBlogCategories);
      } else if (data && data.length > 0) {
        setBlogCategories(data as BlogCategory[]);
      } else {
        // Fallback to initial constants if DB is empty
        setBlogCategories(initialBlogCategories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setBlogCategories(initialBlogCategories);
    }
  }, []);

  useEffect(() => {
    fetchBlogCategories();
  }, [fetchBlogCategories]);

  // Remove unused function
  // const updateCategoriesLocalStorage = (categoriesToSave: BlogCategory[]) => { ... };

  const addBlogPost = async (newPostData: Omit<BlogPost, 'id' | 'slug' | 'date' | 'viewCount' | 'updatedAt'>) => {
    const slug = newPostData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + `-${Date.now()}`;
    const now = new Date().toISOString();

    const postToAdd = {
      title: newPostData.title,
      content: newPostData.content,
      author: newPostData.author,
      category: newPostData.category,
      excerpt: newPostData.excerpt,
      image_url: newPostData.imageUrl,
      slug,
      date: now,
      status: newPostData.status || 'Published',
      is_featured: newPostData.isFeatured || false,
      seo: newPostData.seo || { title: '', description: '', keywords: '' },
      view_count: 0
    };

    const { data, error } = await supabase.from('blog_posts').insert(postToAdd).select().single() as unknown as { data: BlogPostDbRow | null, error: any };

    if (!error && data) {
      setBlogPosts(prev => [({
        id: data.id,
        slug: data.slug,
        title: data.title,
        imageUrl: data.image_url,
        excerpt: data.excerpt,
        author: data.author,
        date: data.date,
        category: data.category,
        content: data.content,
        viewCount: data.view_count || 0,
        status: data.status,
        isFeatured: data.is_featured,
        seo: data.seo,
        updatedAt: data.updated_at
      } as BlogPost), ...prev]);
    } else {
      console.error("Error adding post:", error);
      throw error;
    }
  };

  const updateBlogPost = async (updatedPost: BlogPost) => {
    const { id, ...postToUpdate } = updatedPost;
    const mappedUpdates = {
      title: postToUpdate.title,
      content: postToUpdate.content,
      author: postToUpdate.author,
      category: postToUpdate.category,
      excerpt: postToUpdate.excerpt,
      image_url: postToUpdate.imageUrl,
      slug: postToUpdate.slug,
      status: postToUpdate.status,
      is_featured: postToUpdate.isFeatured,
      seo: postToUpdate.seo,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('blog_posts').update(mappedUpdates).eq('id', id).select().single() as unknown as { data: BlogPostDbRow | null, error: any };

    if (!error && data) {
      const updatedData = {
        id: data.id,
        slug: data.slug,
        title: data.title,
        imageUrl: data.image_url,
        excerpt: data.excerpt,
        author: data.author,
        date: data.date,
        category: data.category,
        content: data.content,
        viewCount: data.view_count || 0,
        status: data.status,
        isFeatured: data.is_featured,
        seo: data.seo,
        updatedAt: data.updated_at
      } as BlogPost;
      setBlogPosts(prev => prev.map(p => (p.id === id ? updatedData : p)));
    } else {
      console.error("Error updating post:", error);
      throw error;
    }
  };

  const bulkAddBlogPosts = async (posts: Omit<BlogPost, 'id' | 'slug' | 'date' | 'viewCount' | 'updatedAt'>[]) => {
    const now = new Date().toISOString();
    const postsToAdd = posts.map(post => {
      const timestamp = Date.now() + Math.floor(Math.random() * 1000);
      const slug = post.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + `-${timestamp}`;

      return {
        title: post.title,
        content: post.content,
        author: post.author || 'Admin',
        category: post.category,
        excerpt: post.excerpt,
        image_url: post.imageUrl,
        slug,
        date: now,
        status: post.status || 'Published',
        is_featured: post.isFeatured || false,
        seo: post.seo || { title: post.title, description: post.excerpt, keywords: post.category },
        view_count: 0
      };
    });

    const { data, error } = await supabase.from('blog_posts').insert(postsToAdd).select() as unknown as { data: BlogPostDbRow[] | null, error: any };

    if (error) {
      console.error("Error bulk adding posts:", error);
      throw error;
    }

    if (data) {
      const newPosts = data.map((post: any) => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        imageUrl: post.image_url,
        excerpt: post.excerpt,
        author: post.author,
        date: post.date,
        category: post.category,
        content: post.content,
        viewCount: post.view_count || 0,
        status: post.status,
        isFeatured: post.is_featured,
        seo: post.seo,
        updatedAt: post.updated_at
      } as BlogPost));

      setBlogPosts(prev => [...newPosts, ...prev]);
      return { success: data.length, failed: posts.length - data.length };
    }

    return { success: 0, failed: posts.length };
  };

  const deleteBlogPost = async (postId: number) => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
    if (!error) {
      setBlogPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const getPostBySlug = (slug: string) => {
    return blogPosts.find(p => p.slug === slug);
  };

  const incrementViewCount = async (postId: number) => {
    const { error } = await supabase.rpc('increment_blog_view_count', { p_post_id: postId });
    if (!error) {
      setBlogPosts(prev => prev.map(p => p.id === postId ? { ...p, viewCount: p.viewCount + 1 } : p));
    }
  };

  const getCommentsByPostId = (postId: number) => {
    return comments.filter(c => c.postId === postId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const addComment = async (postId: number, authorName: string, content: string) => {
    const newComment: BlogComment = {
      id: crypto.randomUUID(),
      postId,
      authorName,
      authorAvatarUrl: `https://picsum.photos/seed/${authorName.replace(/\s+/g, '-')}/100/100`,
      content,
      date: new Date().toISOString(),
    };

    // Update local state immediately
    setComments(prev => [...prev, newComment]);

    if (!isSupabaseConfigured) {
      // Fallback to localStorage if Supabase not configured
      try {
        const updatedComments = [...comments, newComment];
        localStorage.setItem('blog_comments', JSON.stringify(updatedComments));
      } catch (error) {
        console.error('Failed to save comment to localStorage:', error);
      }
      return;
    }

    try {
      // Save to database
      const { error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          author_name: authorName,
          content: content,
          date: newComment.date,
        });

      if (error) {
        console.error('Error saving comment:', error);
        // Revert local state
        setComments(prev => prev.filter(c => c.id !== newComment.id));
        // Fallback to localStorage
        try {
          const updatedComments = [...comments, newComment];
          localStorage.setItem('blog_comments', JSON.stringify(updatedComments));
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
      } else {
        // Refresh comments from database
        await fetchComments();
      }
    } catch (error) {
      console.error('Error in addComment:', error);
      // Revert local state
      setComments(prev => prev.filter(c => c.id !== newComment.id));
    }
  };

  const addBlogCategory = async (name: string) => {
    if (name.trim() === '' || blogCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Category name cannot be empty or duplicate.");
      return;
    }

    const { data, error } = await supabase
      .from('blog_categories')
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category to database.');
    } else if (data) {
      setBlogCategories((prev: BlogCategory[]) => [...prev, data as BlogCategory]);
      toast.success(`Category "${name}" added.`);
    }
  };

  const updateBlogCategory = async (id: string, name: string) => {
    const { error } = await supabase
      .from('blog_categories')
      .update({ name })
      .eq('id', id);

    if (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category.');
    } else {
      setBlogCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    }
  };

  const deleteBlogCategory = async (id: string) => {
    const { error } = await supabase
      .from('blog_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category.');
    } else {
      setBlogCategories(prev => prev.filter(c => c.id !== id));
    }
  };


  const value = { blogPosts, loading, addBlogPost, updateBlogPost, deleteBlogPost, bulkAddBlogPosts, getPostBySlug, incrementViewCount, comments, getCommentsByPostId, addComment, blogCategories, addBlogCategory, updateBlogCategory, deleteBlogCategory };

  return (
    <BlogDataContext.Provider value={value}>
      {children}
    </BlogDataContext.Provider>
  );
};

export const useBlogData = () => {
  const context = useContext(BlogDataContext);
  if (!context) {
    throw new Error('useBlogData must be used within a BlogDataProvider');
  }
  return context;
};
