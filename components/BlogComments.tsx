
// components/BlogComments.tsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useBlogData } from '../contexts/BusinessDataContext.tsx';
import { useAuth } from '../providers/AuthProvider.tsx';

interface BlogCommentsProps {
    post_id: number;
}

const BlogComments: React.FC<BlogCommentsProps> = ({ post_id }) => {
    const { getCommentsBypost_id, addComment } = useBlogData();
    const { user: currentUser } = useAuth();

    const [commentContent, setCommentContent] = useState('');
    const [author_name, setauthor_name] = useState(currentUser?.user_metadata?.full_name || '');

    const comments = getCommentsBypost_id(post_id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentContent.trim() || !author_name.trim()) {
            toast.error('Vui lòng nhập tên và nội dung bình luận.');
            return;
        }
        addComment(post_id, author_name, commentContent);
        setCommentContent('');
        if (!currentUser) {
            setauthor_name('');
        }
    };

    return (
        <div className="mt-16 pt-12 border-t">
            <h2 className="text-3xl font-bold font-serif text-neutral-dark mb-8">{comments.length} Comment{comments.length !== 1 ? 's' : ''}</h2>

            {/* Comments List */}
            <div className="space-y-8 mb-12">
                {comments.map(comment => (
                    <div key={comment.id} className="flex gap-4">
                        <img src={comment.author_avatar_url} alt={comment.author_name} className="w-12 h-12 rounded-full flex-shrink-0 mt-1" loading="lazy" />
                        <div>
                            <p className="font-semibold text-neutral-dark">{comment.author_name}</p>
                            <p className="text-xs text-gray-400 mb-2">{new Date(comment.date).toLocaleString()}</p>
                            <p className="text-gray-600">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Comment Form */}
            <div>
                <h3 className="text-2xl font-bold font-serif text-neutral-dark mb-4">Leave a Comment</h3>
                <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-gray-50 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="author_name" className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                id="author_name"
                                type="text"
                                value={author_name}
                                onChange={(e) => setauthor_name(e.target.value)}
                                disabled={!!currentUser}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="commentContent" className="block text-sm font-medium text-gray-700">Your Comment</label>
                        <textarea
                            id="commentContent"
                            rows={5}
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div className="text-right">
                        <button type="submit" className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors">
                            Post Comment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BlogComments;
