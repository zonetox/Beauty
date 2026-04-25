import React from 'react';
import { Business, BusinessBlogPostStatus } from '../../types.ts';
import { useBusinessBlogData } from '../../contexts/BusinessContext.tsx';
import BusinessBlogPostCard from '../BusinessBlogPostCard.tsx';

import Editable from '../Editable.tsx';

interface BusinessBlogSectionProps {
    business: Business;
    content?: any;
    isEditing?: boolean;
}

const BusinessBlogSection: React.FC<BusinessBlogSectionProps> = ({ business, content, isEditing }) => {
    const displayTitle = content?.title || 'Tin tức & Cập nhật';
    const displaySubtitle = content?.subtitle || 'Blog';
    const { getPostsBybusiness_id } = useBusinessBlogData();
    const publishedPosts = content?.items || (getPostsBybusiness_id ? getPostsBybusiness_id(business.id).filter(p => p.status === BusinessBlogPostStatus.PUBLISHED) : []);

    if (publishedPosts.length === 0) {
        return null;
    }

    return (
        <section id="blog" className="py-20 lg:py-28">
            <div className="text-center">
                <p className="text-sm font-semibold uppercase text-primary tracking-widest">
                    <Editable id="blog_subtitle" type="text" value={displaySubtitle}>
                        {displaySubtitle}
                    </Editable>
                </p>
                <h2 className="mt-2 text-3xl lg:text-4xl font-bold font-serif text-neutral-dark">
                    <Editable id="blog_title" type="text" value={displayTitle}>
                        {displayTitle}
                    </Editable>
                </h2>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {publishedPosts.slice(0, 3).map((post: any) => (
                    <BusinessBlogPostCard key={post.id} post={post} businessSlug={business.slug} />
                ))}
            </div>
        </section>
    );
};

export default BusinessBlogSection;
