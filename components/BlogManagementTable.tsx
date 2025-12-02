


import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types.ts';

interface BlogManagementTableProps {
    posts: BlogPost[];
    onEdit: (post: BlogPost) => void;
    onDelete: (postId: number) => void;
    onUpdate: (post: BlogPost) => void;
}

const BlogManagementTable: React.FC<BlogManagementTableProps> = ({ posts, onEdit, onDelete, onUpdate }) => {
    const [viewInputs, setViewInputs] = useState<Record<number, string>>({});

    useEffect(() => {
        // Initialize or update the local input state when the posts prop changes.
        const initialInputs = posts.reduce((acc, post) => {
            acc[post.id] = String(post.viewCount || 0);
            return acc;
        }, {} as Record<number, string>);
        setViewInputs(initialInputs);
    }, [posts]);

    const handleViewChange = (postId: number, value: string) => {
        setViewInputs(prev => ({ ...prev, [postId]: value }));
    };

    const handleViewUpdate = (post: BlogPost) => {
        const newViewCount = parseInt(viewInputs[post.id], 10);
        if (!isNaN(newViewCount) && newViewCount !== post.viewCount) {
            onUpdate({ ...post, viewCount: newViewCount });
        } else {
            // If the input is invalid or unchanged, revert it to the original value.
            handleViewChange(post.id, String(post.viewCount));
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Title</th>
                        <th scope="col" className="px-6 py-3">Category</th>
                        <th scope="col" className="px-6 py-3">Author</th>
                        <th scope="col" className="px-6 py-3">Date</th>
                        <th scope="col" className="px-6 py-3">Views</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map(post => (
                        <tr key={post.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-neutral-dark whitespace-nowrap">{post.title}</td>
                            <td className="px-6 py-4">{post.category}</td>
                            <td className="px-6 py-4">{post.author}</td>
                            <td className="px-6 py-4">{post.date}</td>
                            <td className="px-6 py-4">
                               <input
                                    type="number"
                                    value={viewInputs[post.id] || ''}
                                    onChange={(e) => handleViewChange(post.id, e.target.value)}
                                    onBlur={() => handleViewUpdate(post)}
                                    onKeyDown={(e) => { if(e.key === 'Enter') handleViewUpdate(post); }}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    aria-label={`View count for ${post.title}`}
                                />
                            </td>
                            <td className="px-6 py-4 flex items-center gap-4">
                                <button onClick={() => onEdit(post)} className="font-medium text-secondary hover:underline">Edit</button>
                                <button onClick={() => onDelete(post.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BlogManagementTable;