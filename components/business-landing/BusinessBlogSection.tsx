import React from 'react';
import { Business, BusinessBlogPostStatus } from '../../types.ts';
import { useBusinessBlogData } from '../../contexts/BusinessContext.tsx';
import BusinessBlogPostCard from '../BusinessBlogPostCard.tsx';

interface BusinessBlogSectionProps {
    business: Business;
}

const BusinessBlogSection: React.FC<BusinessBlogSectionProps> = ({ business }) => {
    const { getPostsByBusinessId } = useBusinessBlogData();
    const publishedPosts = getPostsByBusinessId ? getPostsByBusinessId(business.id).filter(p => p.status === BusinessBlogPostStatus.PUBLISHED) : [];

    if (publishedPosts.length === 0) {
        return null;
    }

    return (
        <section id="blog" className="py-20 lg:py-28">
            <div className="text-center">
                <p className="text-sm font-semibold uppercase text-primary tracking-widest">Blog</p>
                <h2 className="mt-2 text-3xl lg:text-4xl font-bold font-serif text-neutral-dark">
                    Tin tức & Cập nhật
                </h2>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {publishedPosts.slice(0, 3).map(post => (
                    <BusinessBlogPostCard key={post.id} post={post} businessSlug={business.slug} />
                ))}
            </div>
        </section>
    );
};

export default BusinessBlogSection;