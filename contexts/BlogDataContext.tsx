import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { BlogPost, BlogComment, BlogCategory } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { BLOG_CATEGORIES as initialBlogCategories } from '../constants.ts';

interface BlogDataContextType {
  blogPosts: BlogPost[];
  loading: boolean;
  addBlogPost: (newPost: Omit<BlogPost, 'id' | 'slug' | 'date' | 'viewCount'>) => Promise<void>;
  updateBlogPost: (updatedPost: BlogPost) => Promise<void>;
  deleteBlogPost: (postId: number) => Promise<void>;
  getPostBySlug: (slug: string) => BlogPost | undefined;
  incrementViewCount: (postId: number) => Promise<void>;
  comments: BlogComment[];
  getCommentsByPostId: (postId: number) => BlogComment[];
  addComment: (postId: number, authorName: string, content: string) => void;
  blogCategories: BlogCategory[];
  addBlogCategory: (name: string) => void;
  updateBlogCategory: (id: string, name: string) => void;
  deleteBlogCategory: (id: string) => void;
}

const BlogDataContext = createContext<BlogDataContextType | undefined>(undefined);

const COMMENTS_LOCAL_STORAGE_KEY = 'blog_comments';
const CATEGORIES_LOCAL_STORAGE_KEY = 'blog_categories';


export const BlogDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);

  // Fetch blog posts from Supabase
  const fetchBlogPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('blog_posts').select('*').order('date', { ascending: false });
    if (error) {
      console.error("Error fetching blog posts:", error);
    } else if (data) {
      setBlogPosts(data as BlogPost[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  // Comments and Categories continue to use localStorage for this iteration.
   useEffect(() => {
    try {
      const savedCommentsJSON = localStorage.getItem(COMMENTS_LOCAL_STORAGE_KEY);
      setComments(savedCommentsJSON ? JSON.parse(savedCommentsJSON) : []);
    } catch (error) {
      console.error(`Failed to parse comments from localStorage:`, error);
      setComments([]);
    }
  }, []);
  
  useEffect(() => {
    try {
      const savedCategoriesJSON = localStorage.getItem(CATEGORIES_LOCAL_STORAGE_KEY);
      setBlogCategories(savedCategoriesJSON ? JSON.parse(savedCategoriesJSON) : initialBlogCategories);
    } catch (error) {
      console.error(`Failed to parse blog categories from localStorage:`, error);
      setBlogCategories(initialBlogCategories);
    }
  }, []);

  const updateCommentsLocalStorage = (commentsToSave: BlogComment[]) => {
    localStorage.setItem(COMMENTS_LOCAL_STORAGE_KEY, JSON.stringify(commentsToSave));
  };
  
  const updateCategoriesLocalStorage = (categoriesToSave: BlogCategory[]) => {
    localStorage.setItem(CATEGORIES_LOCAL_STORAGE_KEY, JSON.stringify(categoriesToSave));
  };

  const addBlogPost = async (newPostData: Omit<BlogPost, 'id' | 'slug' | 'date' | 'viewCount'>) => {
    const slug = newPostData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + `-${Date.now()}`;
    const postToAdd = {
      ...newPostData,
      slug,
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '/'),
      viewCount: 0,
    };
    const { data, error } = await supabase.from('blog_posts').insert(postToAdd).select().single();
    if (!error && data) {
      setBlogPosts(prev => [data as BlogPost, ...prev]);
    }
  };

  const updateBlogPost = async (updatedPost: BlogPost) => {
    const { id, ...postToUpdate } = updatedPost;
    const { data, error } = await supabase.from('blog_posts').update(postToUpdate).eq('id', id).select().single();
    if (!error && data) {
      setBlogPosts(prev => prev.map(p => (p.id === id ? (data as BlogPost) : p)));
    }
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

  const addComment = (postId: number, authorName: string, content: string) => {
    const newComment: BlogComment = {
        id: crypto.randomUUID(),
        postId,
        authorName,
        authorAvatarUrl: `https://picsum.photos/seed/${authorName.replace(/\s+/g, '-')}/100/100`,
        content,
        date: new Date().toISOString(),
    };
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    updateCommentsLocalStorage(updatedComments);
  };
  
  const addBlogCategory = (name: string) => {
    if (name.trim() === '' || blogCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert("Category name cannot be empty or duplicate.");
      return;
    }
    const newCategory: BlogCategory = { id: `cat-${crypto.randomUUID()}`, name };
    const updatedCategories = [...blogCategories, newCategory];
    setBlogCategories(updatedCategories);
    updateCategoriesLocalStorage(updatedCategories);
  };

  const updateBlogCategory = (id: string, name: string) => {
    const updatedCategories = blogCategories.map(c => c.id === id ? { ...c, name } : c);
    setBlogCategories(updatedCategories);
    updateCategoriesLocalStorage(updatedCategories);
  };
  
  const deleteBlogCategory = (id: string) => {
    const updatedCategories = blogCategories.filter(c => c.id !== id);
    setBlogCategories(updatedCategories);
    updateCategoriesLocalStorage(updatedCategories);
  };


  const value = { blogPosts, loading, addBlogPost, updateBlogPost, deleteBlogPost, getPostBySlug, incrementViewCount, comments, getCommentsByPostId, addComment, blogCategories, addBlogCategory, updateBlogCategory, deleteBlogCategory };

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
