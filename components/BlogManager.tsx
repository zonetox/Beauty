// C3.7 - Blog Management (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth, useBusinessBlogData } from '../contexts/BusinessContext.tsx';
import { BusinessBlogPost, BusinessBlogPostStatus } from '../types.ts';
import RichTextEditor from './RichTextEditor.tsx';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';
import { uploadFile, deleteFileByUrl } from '../lib/storage.ts';
import { useStaffPermissions } from '../hooks/useStaffPermissions.ts';
import ForbiddenState from './ForbiddenState.tsx';
import ConfirmDialog from './ConfirmDialog.tsx';

const BlogManager: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { posts, loading, addPost, updatePost, deletePost } = useBusinessBlogData();
    const staffPermissions = useStaffPermissions();

    const [editingPost, setEditingPost] = useState<Partial<BusinessBlogPost> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; post: BusinessBlogPost | null }>({ isOpen: false, post: null });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showSEOSection, setShowSEOSection] = useState(false);

    // Move hooks before early return to follow Rules of Hooks
    const businessPosts = useMemo(() => {
        if (!currentBusiness) return [];
        return posts.filter(p => p.businessId === currentBusiness.id);
    }, [posts, currentBusiness]);

    if (!currentBusiness) {
        return (
            <div className="p-8">
                <EmptyState
                    title="No business found"
                    message="Please select a business to manage blog posts."
                />
            </div>
        );
    }

    // Check staff permissions: must be business owner or staff with canEditBlog permission
    if (!staffPermissions.isBusinessOwner && !staffPermissions.canEditBlog) {
        return (
            <div className="p-8">
                <ForbiddenState
                    title="Access Denied"
                    message="You don't have permission to manage blog posts. Only business owners and staff members with blog editing permissions can access this section."
                />
            </div>
        );
    }

    const validateForm = (postData: Partial<BusinessBlogPost>): boolean => {
        const newErrors: Record<string, string> = {};

        // Title validation
        if (!postData.title || postData.title.trim().length === 0) {
            newErrors.title = 'Title is required';
        } else if (postData.title.length > 200) {
            newErrors.title = 'Title must be less than 200 characters';
        }

        // Excerpt validation
        if (!postData.excerpt || postData.excerpt.trim().length === 0) {
            newErrors.excerpt = 'Excerpt is required';
        } else if (postData.excerpt.length > 300) {
            newErrors.excerpt = 'Excerpt must be less than 300 characters';
        }

        // Content validation
        if (!postData.content || postData.content.trim().length === 0 || postData.content === '<p><br></p>') {
            newErrors.content = 'Content is required';
        }

        // Image validation
        if (!postData.imageUrl || postData.imageUrl.trim().length === 0) {
            newErrors.imageUrl = 'Image URL or file upload is required';
        }

        // SEO validation (optional but validate length if provided)
        if (postData.seo) {
            if (postData.seo.title && postData.seo.title.length > 60) {
                newErrors.seoTitle = 'SEO Title must be less than 60 characters';
            }
            if (postData.seo.description && postData.seo.description.length > 160) {
                newErrors.seoDescription = 'SEO Description must be less than 160 characters';
            }
            if (postData.seo.keywords && postData.seo.keywords.length > 200) {
                newErrors.seoKeywords = 'SEO Keywords must be less than 200 characters';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImageUpload = async (file: File) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setIsUploadingImage(true);
        try {
            // If editing existing post, use its ID; otherwise generate a temp ID for upload path
            const postId = editingPost?.id || `temp-${Date.now()}`;
            const folder = `blog/${postId}`;
            const publicUrl = await uploadFile('blog-images', file, folder);

            setEditingPost(prev => ({
                ...prev,
                imageUrl: publicUrl
            }));

            // Clear image error if any
            if (errors.imageUrl) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.imageUrl;
                    return newErrors;
                });
            }

            toast.success('Image uploaded successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload image';
            toast.error(`Image upload failed: ${message}`);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSave = async (postToSave: Partial<BusinessBlogPost>) => {
        if (!validateForm(postToSave)) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsSaving(true);
        try {
            const postData = {
                ...postToSave,
                businessId: currentBusiness.id,
                title: postToSave.title?.trim() || '',
                excerpt: postToSave.excerpt?.trim() || '',
                content: postToSave.content || '',
                imageUrl: postToSave.imageUrl || '',
                author: currentBusiness.name,
                status: postToSave.status || BusinessBlogPostStatus.DRAFT,
                seo: postToSave.seo || undefined,
                isFeatured: postToSave.isFeatured || false,
            };

            if (postToSave.id) {
                // Update existing post
                await updatePost(postData as BusinessBlogPost);
            } else {
                // Create new post
                await addPost(postData);
            }

            toast.success(`Post ${postToSave.id ? 'updated' : 'created'} successfully!`);
            setEditingPost(null);
            setErrors({});
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save post';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublishToggle = async (post: BusinessBlogPost) => {
        const isPublishing = post.status === BusinessBlogPostStatus.DRAFT;
        const updatedPost = {
            ...post,
            status: isPublishing ? BusinessBlogPostStatus.PUBLISHED : BusinessBlogPostStatus.DRAFT,
            publishedDate: (isPublishing && !post.publishedDate) ? new Date().toISOString() : post.publishedDate,
        };

        try {
            await updatePost(updatedPost);
            toast.success(`Post ${isPublishing ? 'published' : 'reverted to draft'} successfully!`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update post';
            toast.error(message);
        }
    };
    
    const handleDelete = (post: BusinessBlogPost) => {
        setConfirmDelete({ isOpen: true, post });
    };

    const confirmDeletePost = async () => {
        if (!confirmDelete.post) return;
        const post = confirmDelete.post;
        setConfirmDelete({ isOpen: false, post: null });

        setIsDeleting(post.id);
        try {
            // Delete image from Storage if exists and is from blog-images bucket
            if (post.imageUrl && post.imageUrl.includes('blog-images')) {
                try {
                    await deleteFileByUrl('blog-images', post.imageUrl);
                } catch (deleteError) {
                    // Log but don't fail the delete operation
                    console.warn('Failed to delete blog post image from storage:', deleteError);
                }
            }

            await deletePost(post.id);
            toast.success('Post deleted successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete post';
            toast.error(message);
        } finally {
            setIsDeleting(null);
        }
    };

    const startNewPost = () => {
        setEditingPost({
            title: '',
            excerpt: '',
            content: '<p>Start writing your amazing blog post here!</p>',
            status: BusinessBlogPostStatus.DRAFT,
            imageUrl: '',
            isFeatured: false,
            seo: { title: '', description: '', keywords: '' },
        });
        setErrors({});
        setShowSEOSection(false);
    };

    const handleEdit = (post: BusinessBlogPost) => {
        setEditingPost({
            ...post,
            seo: post.seo || { title: '', description: '', keywords: '' },
        });
        setErrors({});
        setShowSEOSection(false);
    };

    /**
     * Handles field changes in the blog post form
     * @param field - The field name to update
     * @param value - The new value for the field
     */
    const handleFieldChange = (field: string, value: unknown): void => {
        setEditingPost(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSEOChange = (field: string, value: string) => {
        setEditingPost(prev => ({
            ...prev,
            seo: {
                ...(prev?.seo || { title: '', description: '', keywords: '' }),
                [field]: value
            }
        }));

        // Clear error when user starts typing
        const errorKey = `seo${field.charAt(0).toUpperCase() + field.slice(1)}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <LoadingState message="Loading blog posts..." />
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Editor View */}
            {editingPost && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold font-serif text-neutral-dark">
                            {editingPost.id ? 'Edit Post' : 'Create New Post'}
                        </h2>
                        <button
                            onClick={() => {
                                setEditingPost(null);
                                setErrors({});
                            }}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            ← Back to List
                        </button>
                    </div>

                    <div className="bg-white border rounded-lg p-6 space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={editingPost.title || ''}
                                onChange={e => handleFieldChange('title', e.target.value)}
                                maxLength={200}
                                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                                    errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter post title"
                                disabled={isSaving}
                            />
                            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                            <p className="mt-1 text-xs text-gray-500">{(editingPost.title || '').length} / 200 characters</p>
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Excerpt <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={editingPost.excerpt || ''}
                                onChange={e => handleFieldChange('excerpt', e.target.value)}
                                rows={3}
                                maxLength={300}
                                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                                    errors.excerpt ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter a short summary of your post"
                                disabled={isSaving}
                            />
                            {errors.excerpt && <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>}
                            <p className="mt-1 text-xs text-gray-500">{(editingPost.excerpt || '').length} / 300 characters</p>
                        </div>

                        {/* Featured Image */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Featured Image <span className="text-red-500">*</span>
                            </label>
                            
                            {/* Image Upload */}
                            <div className="mb-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                    className="hidden"
                                    id="image-upload"
                                    disabled={isUploadingImage || isSaving}
                                />
                                <label
                                    htmlFor="image-upload"
                                    className={`inline-block px-4 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-200 ${
                                        isUploadingImage || isSaving ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                                </label>
                                <span className="ml-2 text-sm text-gray-500">or enter URL below</span>
                            </div>

                            {/* Image URL Input */}
                            <input
                                type="text"
                                value={editingPost.imageUrl || ''}
                                onChange={e => handleFieldChange('imageUrl', e.target.value)}
                                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                                    errors.imageUrl ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter image URL (e.g., https://...) or upload image above"
                                disabled={isSaving || isUploadingImage}
                            />
                            {errors.imageUrl && <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>}

                            {/* Image Preview */}
                            {editingPost.imageUrl && (
                                <div className="mt-3">
                                    <img
                                        src={editingPost.imageUrl}
                                        alt="Featured image preview"
                                        className="w-full max-w-md h-auto rounded-md border"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/800x400/E6A4B4/FFFFFF?text=Image+Error';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Content <span className="text-red-500">*</span>
                            </label>
                            <RichTextEditor
                                value={editingPost.content || ''}
                                onChange={(content: string) => handleFieldChange('content', content)}
                                placeholder="Write your blog post content here..."
                            />
                            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
                        </div>

                        {/* Status and Featured */}
                        <div className="flex gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={editingPost.status || BusinessBlogPostStatus.DRAFT}
                                    onChange={e => handleFieldChange('status', e.target.value)}
                                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                                    disabled={isSaving}
                                >
                                    <option value={BusinessBlogPostStatus.DRAFT}>Draft</option>
                                    <option value={BusinessBlogPostStatus.PUBLISHED}>Published</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingPost.isFeatured || false}
                                        onChange={e => handleFieldChange('isFeatured', e.target.checked)}
                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                        disabled={isSaving}
                                    />
                                    <span className="text-sm font-medium text-gray-700">Featured Post</span>
                                </label>
                            </div>
                        </div>

                        {/* SEO Settings */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowSEOSection(!showSEOSection)}
                                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                <span>SEO Settings</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-4 w-4 transition-transform ${showSEOSection ? 'rotate-180' : ''}`}
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {showSEOSection && (
                                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-md border">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            SEO Title
                                        </label>
                                        <input
                                            type="text"
                                            value={editingPost.seo?.title || ''}
                                            onChange={e => handleSEOChange('title', e.target.value)}
                                            maxLength={60}
                                            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                                                errors.seoTitle ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="SEO title (max 60 characters)"
                                            disabled={isSaving}
                                        />
                                        {errors.seoTitle && <p className="mt-1 text-sm text-red-600">{errors.seoTitle}</p>}
                                        <p className="mt-1 text-xs text-gray-500">{(editingPost.seo?.title || '').length} / 60 characters</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            SEO Description
                                        </label>
                                        <textarea
                                            value={editingPost.seo?.description || ''}
                                            onChange={e => handleSEOChange('description', e.target.value)}
                                            rows={2}
                                            maxLength={160}
                                            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                                                errors.seoDescription ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="SEO description (max 160 characters)"
                                            disabled={isSaving}
                                        />
                                        {errors.seoDescription && <p className="mt-1 text-sm text-red-600">{errors.seoDescription}</p>}
                                        <p className="mt-1 text-xs text-gray-500">{(editingPost.seo?.description || '').length} / 160 characters</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            SEO Keywords
                                        </label>
                                        <input
                                            type="text"
                                            value={editingPost.seo?.keywords || ''}
                                            onChange={e => handleSEOChange('keywords', e.target.value)}
                                            maxLength={200}
                                            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                                                errors.seoKeywords ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="SEO keywords (comma-separated, max 200 characters)"
                                            disabled={isSaving}
                                        />
                                        {errors.seoKeywords && <p className="mt-1 text-sm text-red-600">{errors.seoKeywords}</p>}
                                        <p className="mt-1 text-xs text-gray-500">{(editingPost.seo?.keywords || '').length} / 200 characters</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingPost(null);
                                    setErrors({});
                                }}
                                className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSave(editingPost)}
                                className="px-4 py-2 bg-primary text-white rounded-md font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Post'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List View */}
            {!editingPost && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold font-serif text-neutral-dark">Blog Management</h2>
                        <button
                            onClick={startNewPost}
                            className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90"
                        >
                            + Create New Post
                        </button>
                    </div>

                    {businessPosts.length === 0 ? (
                        <EmptyState
                            title="No blog posts yet"
                            message="Get started by creating your first blog post to engage with your audience."
                            action={
                                <button
                                    onClick={startNewPost}
                                    className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90"
                                >
                                    Create Your First Post
                                </button>
                            }
                        />
                    ) : (
                        <div className="space-y-4">
                            {businessPosts.map(post => (
                                <div
                                    key={post.id}
                                    className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={post.imageUrl}
                                            alt={post.title}
                                            className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/E6A4B4/FFFFFF?text=No+Image';
                                            }}
                                        />
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-start gap-2 mb-1">
                                                <h3 className="font-bold text-lg truncate">{post.title}</h3>
                                                {post.isFeatured && (
                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex-shrink-0">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{post.excerpt}</p>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span
                                                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                        post.status === BusinessBlogPostStatus.PUBLISHED
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-200 text-gray-700'
                                                    }`}
                                                >
                                                    {post.status}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {post.publishedDate
                                                        ? `Published: ${new Date(post.publishedDate).toLocaleDateString()}`
                                                        : `Created: ${new Date(post.createdDate).toLocaleDateString()}`}
                                                </span>
                                                <span className="text-xs text-gray-500">Views: {post.viewCount}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleEdit(post)}
                                                className="text-secondary font-semibold text-sm hover:underline text-left"
                                                disabled={isDeleting !== null}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handlePublishToggle(post)}
                                                className={`font-semibold text-sm hover:underline text-left ${
                                                    post.status === BusinessBlogPostStatus.DRAFT ? 'text-green-600' : 'text-yellow-600'
                                                }`}
                                                disabled={isDeleting !== null}
                                            >
                                                {post.status === BusinessBlogPostStatus.DRAFT ? 'Publish' : 'Unpublish'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post)}
                                                className="text-red-500 font-semibold text-sm hover:underline text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={isDeleting === post.id || isDeleting !== null}
                                            >
                                                {isDeleting === post.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                title="Delete Blog Post"
                message={confirmDelete.post ? `Are you sure you want to delete the post "${confirmDelete.post.title}"? This action cannot be undone.` : ''}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDeletePost}
                onCancel={() => setConfirmDelete({ isOpen: false, post: null })}
            />
        </div>
    );
};

export default BlogManager;
