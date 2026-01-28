

import React from 'react';
import { Link } from 'react-router-dom';
import { BusinessBlogPost } from '../types.ts';

interface BusinessBlogPostCardProps {
  post: BusinessBlogPost;
  businessSlug: string;
}

const BusinessBlogPostCard: React.FC<BusinessBlogPostCardProps> = ({ post, businessSlug }) => {
  const { slug, title, image_url, excerpt, author, published_date } = post;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-xl flex flex-col h-full">
      <Link to={`/business/${businessSlug}/post/${slug}`} className="flex flex-col h-full">
        <img className="w-full h-48 object-cover" src={image_url} alt={title} />
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-neutral-dark font-serif flex-grow">{title}</h3>
          <p className="mt-2 text-sm text-gray-500 line-clamp-3">{excerpt}</p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-xs text-gray-500">
            <span>By {author}</span>
            <span className="mx-2">&bull;</span>
            <span>{published_date ? new Date(published_date).toLocaleDateString('vi-VN') : ''}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BusinessBlogPostCard;
