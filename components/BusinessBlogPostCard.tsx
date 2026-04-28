

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
    <div className="group bg-secondary p-1 rounded-luxury luxury-border-thin transition-all duration-700 hover:shadow-premium">
      <Link to={`/business/${businessSlug}/post/${slug}`} className="bg-white rounded-[1.8rem] overflow-hidden flex flex-col h-full border border-primary/10">
        <div className="relative overflow-hidden h-72">
          <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" src={image_url} alt={title} />
          <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-bold tracking-widest text-accent uppercase">
            {published_date ? new Date(published_date).toLocaleDateString('vi-VN') : 'MỚI'}
          </div>
        </div>
        <div className="p-10 flex flex-col flex-grow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-primary/40"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Beauty Insights</span>
          </div>
          <h3 className="text-2xl lg:text-3xl font-serif italic text-accent group-hover:text-primary transition-colors leading-tight flex-grow">{title}</h3>
          <p className="mt-6 text-accent/50 text-sm font-light leading-relaxed line-clamp-3 italic">{excerpt}</p>

          <div className="mt-8 pt-6 border-t border-primary/10 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/40">By {author}</span>
            <span className="text-primary group-hover:translate-x-2 transition-transform">→</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BusinessBlogPostCard;
