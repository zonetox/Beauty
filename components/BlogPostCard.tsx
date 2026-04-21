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
  const { url, title, image_url, excerpt, author, date, category, view_count } = post;
  const safeTitle = title ?? 'Untitled';
  const safeAuthor = author ?? 'Unknown';
  const safeDate = date ?? 'No date';
  const safeCategory = category ?? 'Uncategorized';
  const safeExcerpt = excerpt ?? '';
  const safeimage_url = image_url ?? '';

  return (
    <div className="bg-white rounded-2xl border border-luxury-border shadow-soft overflow-hidden transition-all duration-500 transform hover:-translate-y-2 group">
      <Link to={url}>
        <div className="overflow-hidden">
          <img className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110" src={getOptimizedSupabaseUrl(safeimage_url, { width: 600, quality: 80 })} alt={safeTitle} loading="lazy" />
        </div>
        <div className="p-8">
          <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em] mb-3">{safeCategory}</p>
          <h3 className="text-2xl font-bold text-primary font-serif tracking-wide leading-snug group-hover:text-accent transition-colors">{safeTitle}</h3>
          <p className="mt-4 text-sm text-neutral-500 font-light tracking-wide line-clamp-3 leading-relaxed">{safeExcerpt}</p>
          <div className="mt-8 flex items-center text-[10px] uppercase tracking-widest font-bold text-neutral-400 border-t border-luxury-border pt-6">
            <span className="hover:text-primary transition-colors">{safeAuthor}</span>
            <span className="mx-3 text-neutral-200">|</span>
            <span>{safeDate}</span>
            {view_count !== undefined && (
              <>
                <span className="mx-3 text-neutral-200">|</span>
                <span className="flex items-center gap-1.5"><EyeIcon /> {view_count.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default React.memo(BlogPostCard);
