// components/BlogPostCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '../types.ts';
import { getOptimizedSupabaseUrl } from '../lib/image.ts';

const EyeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);


interface BlogPostCardProps {
  post: Partial<BlogPost> & { url: string; };
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post }) => {
  const { url, title, imageUrl, excerpt, author, date, category, viewCount } = post;
  const safeTitle = title ?? 'Untitled';
  const safeAuthor = author ?? 'Unknown';
  const safeDate = date ?? 'No date';
  const safeCategory = category ?? 'Uncategorized';
  const safeExcerpt = excerpt ?? '';
  const safeImageUrl = imageUrl ?? '';
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-xl">
      <Link to={url}>
        <img className="w-full h-56 object-cover" src={getOptimizedSupabaseUrl(safeImageUrl, { width: 500, quality: 75 })} alt={safeTitle} loading="lazy" />
        <div className="p-6">
          <p className="text-sm text-primary font-semibold">{safeCategory}</p>
          <h3 className="mt-2 text-xl font-bold text-neutral-dark font-serif">{safeTitle}</h3>
          <p className="mt-3 text-base text-gray-500">{safeExcerpt}</p>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <span>{safeAuthor}</span>
            <span className="mx-2">&bull;</span>
            <span>{safeDate}</span>
            {viewCount !== undefined && (
                <>
                    <span className="mx-2">&bull;</span>
                    <span className="flex items-center"><EyeIcon /> {viewCount.toLocaleString()}</span>
                </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default React.memo(BlogPostCard);
