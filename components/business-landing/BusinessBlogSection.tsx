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

const BusinessBlogSection: React.FC<BusinessBlogSectionProps> = ({ business, content }) => {
    const displayTitle = content?.title || 'Tin tức & Cập nhật';
    const displaySubtitle = content?.subtitle || 'Blog';
    const { getPostsBybusiness_id } = useBusinessBlogData();
    const publishedPosts = content?.items || (getPostsBybusiness_id ? getPostsBybusiness_id(business.id).filter(p => p.status === BusinessBlogPostStatus.PUBLISHED) : []);

    if (publishedPosts.length === 0) {
        return null;
    }

    return (
        <section id="blog" className="py-32 lg:py-48 bg-white overflow-hidden">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-12 mb-24 animate-fade-in-up">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-px bg-primary"></div>
                            <p className="text-xs font-bold uppercase text-primary tracking-[0.5em]">
                                <Editable id="blog_subtitle" type="text" value={displaySubtitle}>
                                    {displaySubtitle}
                                </Editable>
                            </p>
                        </div>
                        <h2 className="mt-2 text-5xl lg:text-7xl font-bold font-serif text-accent italic leading-tight">
                            <Editable id="blog_title" type="text" value={displayTitle}>
                                {displayTitle}
                            </Editable>
                        </h2>
                    </div>
                    <button className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent border-b border-primary pb-2 hover:text-primary transition-colors">
                        Xem tất cả bài viết
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
                    {publishedPosts.slice(0, 3).map((post: any) => (
                        <BusinessBlogPostCard key={post.id} post={post} businessSlug={business.slug} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BusinessBlogSection;
