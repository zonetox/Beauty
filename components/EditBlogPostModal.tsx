// components/EditBlogPostModal.tsx
import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types.ts';
import { useBlogData } from '../contexts/BusinessDataContext.tsx';
import RichTextEditor from './RichTextEditor.tsx';

interface EditBlogPostModalProps {
  post: Partial<BlogPost> | null;
  onClose: () => void;
  onSave: (post: BlogPost) => void;
}

const EditBlogPostModal: React.FC<EditBlogPostModalProps> = ({ post, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<BlogPost>>(post || {});
    const { blogCategories } = useBlogData();

    useEffect(() => {
        setFormData(post || { content: '' });
    }, [post]);
    
    if (!post) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleContentChange = (content: string) => {
        setFormData(prev => ({ ...prev, content }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as BlogPost);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 border-b">
                        <h2 className="text-2xl font-bold font-serif text-neutral-dark">{post.id ? 'Edit Blog Post' : 'Add New Blog Post'}</h2>
                    </div>
                    <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input type="text" name="title" value={formData.title || ''} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Image URL</label>
                                <input type="text" name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Excerpt</label>
                            <textarea name="excerpt" value={formData.excerpt || ''} onChange={handleChange} rows={3} required className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Author</label>
                                <input type="text" name="author" value={formData.author || ''} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select name="category" value={formData.category || ''} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white">
                                    <option value="">Select a category</option>
                                    {blogCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Content</label>
                            <RichTextEditor
                                value={formData.content || ''}
                                onChange={handleContentChange}
                            />
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold">Save Post</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBlogPostModal;
