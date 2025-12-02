
// components/BlogComments.tsx
import React, { useState } from 'react';
import { useBlogData } from '../contexts/BusinessDataContext.tsx';
import { useUserSession } from '../contexts/UserSessionContext.tsx';

interface BlogCommentsProps {
    postId: number;
}

const BlogComments: React.FC<BlogCommentsProps> = ({ postId }) => {
    const { getCommentsByPostId, addComment } = useBlogData();
    const { currentUser } = useUserSession();

    const [commentContent, setCommentContent] = useState('');
    const [authorName, setAuthorName] = useState(currentUser?.user_metadata.full_name || '');
    
    const comments = getCommentsByPostId(postId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentContent.trim() || !authorName.trim()) {
            alert('Please provide your name and a comment.');
            return;
        }
        addComment(postId, authorName, commentContent);
        setCommentContent('');
        if (!currentUser) {
            setAuthorName('');
        }
    };

    return (
        <div className="mt-16 pt-12 border-t">
            <h2 className="text-3xl font-bold font-serif text-neutral-dark mb-8">{comments.length} Comment{comments.length !== 1 ? 's' : ''}</h2>
            
            {/* Comments List */}
            <div className="space-y-8 mb-12">
                {comments.map(comment => (
                    <div key={comment.id} className="flex gap-4">
                        <img src={comment.authorAvatarUrl} alt={comment.authorName} className="w-12 h-12 rounded-full flex-shrink-0 mt-1" loading="lazy" />
                        <div>
                            <p className="font-semibold text-neutral-dark">{comment.authorName}</p>
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
                            <label htmlFor="authorName" className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                id="authorName"
                                type="text"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
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
