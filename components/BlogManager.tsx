import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth, useBusinessBlogData } from '../contexts/BusinessContext.tsx';
import { BusinessBlogPost, BusinessBlogPostStatus } from '../types.ts';
import RichTextEditor from './RichTextEditor.tsx';

const BlogManager: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { posts, loading, addPost, updatePost, deletePost } = useBusinessBlogData();

    const [editingPost, setEditingPost] = useState<Partial<BusinessBlogPost> | null>(null);

    if (!currentBusiness) return null;

    const businessPosts = useMemo(() => posts.filter(p => p.businessId === currentBusiness.id), [posts, currentBusiness.id]);

    const handleSave = (postToSave: Partial<BusinessBlogPost>) => {
        if (!postToSave.title || !postToSave.excerpt || !postToSave.content) {
            toast.error('Title, Excerpt, and Content are required.');
            return;
        }

        const promise = postToSave.id
            ? updatePost(postToSave as BusinessBlogPost)
            : addPost({
                businessId: currentBusiness.id,
                title: postToSave.title,
                excerpt: postToSave.excerpt,
                content: postToSave.content,
                imageUrl: postToSave.imageUrl || `https://picsum.photos/seed/bblog-${Date.now()}/400/300`,
                author: currentBusiness.name,
                status: postToSave.status || BusinessBlogPostStatus.DRAFT,
                seo: postToSave.seo,
            });

        toast.promise(promise, {
            loading: 'Saving post...',
            success: 'Post saved successfully!',
            error: 'Failed to save post.'
        }).then(() => {
            setEditingPost(null);
        });
    };

    const handlePublishToggle = (post: BusinessBlogPost) => {
        const isPublishing = post.status === BusinessBlogPostStatus.DRAFT;
        const updatedPost = {
            ...post,
            status: isPublishing ? BusinessBlogPostStatus.PUBLISHED : BusinessBlogPostStatus.DRAFT,
            publishedDate: (isPublishing && !post.publishedDate) ? new Date().toISOString() : post.publishedDate,
        };
        const promise = updatePost(updatedPost);
        toast.promise(promise, {
            loading: isPublishing ? 'Publishing...' : 'Unpublishing...',
            success: `Post ${isPublishing ? 'published' : 'reverted to draft'}.`,
            error: 'Action failed.'
        });
    };
    
    const handleDelete = (post: BusinessBlogPost) => {
        if (window.confirm(`Are you sure you want to delete the post "${post.title}"?`)) {
            const promise = deletePost(post.id);
            toast.promise(promise, {
                loading: 'Deleting post...',
                success: 'Post deleted.',
                error: 'Failed to delete post.'
            });
        }
    };

    const startNewPost = () => {
        setEditingPost({
            title: '',
            excerpt: '',
            content: '<p>Start writing your amazing blog post here!</p>',
            status: BusinessBlogPostStatus.DRAFT,
            imageUrl: '',
            seo: { title: '', description: '', keywords: '' },
        });
    };
    
    if (loading) {
        return <div className="p-8 text-center">Loading posts...</div>;
    }

    return (
        <div className="p-8">
            {/* Editor View */}
            <div style={{ display: editingPost ? 'block' : 'none' }}>
                <div>
                    <h2 className="text-2xl font-bold font-serif mb-4">{editingPost?.id ? 'Edit Post' : 'Create New Post'}</h2>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={editingPost?.title || ''}
                            onChange={e => editingPost && setEditingPost(p => ({ ...p, title: e.target.value }))}
                            className="w-full p-2 border rounded-md"
                            placeholder="Post Title"
                        />
                        <input
                            type="text"
                            value={editingPost?.imageUrl || ''}
                            onChange={e => editingPost && setEditingPost(p => ({...p, imageUrl: e.target.value}))}
                            placeholder="Featured Image URL (e.g., https://...)"
                            className="w-full p-2 border rounded-md"
                        />
                        <textarea
                            value={editingPost?.excerpt || ''}
                            onChange={e => editingPost && setEditingPost(p => ({ ...p, excerpt: e.target.value }))}
                            rows={3}
                            className="w-full p-2 border rounded-md"
                            placeholder="Excerpt (Short Summary)"
                        />
                        <RichTextEditor
                            value={editingPost?.content || ''}
                            onChange={(content: string) => editingPost && setEditingPost(p => ({ ...p, content }))}
                        />
                        {/* SEO Settings can be added here as a <details> element if needed */}
                         <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingPost(null)} className="px-4 py-2 border rounded-md">Cancel</button>
                            <button type="button" onClick={() => editingPost && handleSave(editingPost)} className="px-4 py-2 bg-primary text-white rounded-md font-semibold">Save Draft</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* List View */}
            <div style={{ display: !editingPost ? 'block' : 'none' }}>
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold font-serif text-neutral-dark">Blog Management</h2>
                     <button onClick={startNewPost} className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90">
                        + Create New Post
                     </button>
                </div>

                <div className="space-y-4">
                    {businessPosts.map(post => (
                        <div key={post.id} className="p-4 border rounded-lg bg-white flex items-center gap-4">
                            <img src={post.imageUrl} alt={post.title} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
                            <div className="flex-grow">
                                <h3 className="font-bold text-lg">{post.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${post.status === BusinessBlogPostStatus.PUBLISHED ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{post.status}</span>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                <button onClick={() => setEditingPost(post)} className="text-secondary font-semibold text-sm hover:underline">Edit</button>
                                <button onClick={() => handlePublishToggle(post)} className="font-semibold text-sm hover:underline" style={{ color: post.status === BusinessBlogPostStatus.DRAFT ? '#16a34a' : '#ca8a04' }}>
                                    {post.status === BusinessBlogPostStatus.DRAFT ? 'Publish' : 'Unpublish'}
                                </button>
                                <button onClick={() => handleDelete(post)} className="text-red-500 font-semibold text-sm hover:underline">Delete</button>
                            </div>
                        </div>
                    ))}
                    {businessPosts.length === 0 && <p className="text-center py-8 text-gray-500">No blog posts yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default BlogManager;