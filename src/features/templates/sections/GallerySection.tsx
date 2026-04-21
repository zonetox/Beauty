import React from 'react';
import { Business, MediaItem } from '../../../../types.ts';

interface GallerySectionProps {
    business: Business;
    galleryItems?: MediaItem[];
    layout?: 'grid' | 'masonry';
}

const GallerySection: React.FC<GallerySectionProps> = ({ business, galleryItems = [], layout = 'masonry' }) => {
    const items = galleryItems.length > 0 ? galleryItems : (business.gallery || []);

    if (items.length === 0) return null;

    return (
        <section className="py-20 px-4 md:px-20 bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-sm uppercase tracking-[0.3em] text-primary mb-2">Bộ sưu tập</h2>
                    <h3 className="text-3xl md:text-5xl font-serif text-neutral-dark">Không gian & Nghệ thuật</h3>
                    <div className="w-24 h-px bg-primary mx-auto mt-6" />
                </div>

                {layout === 'masonry' ? (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                        {items.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="relative group overflow-hidden rounded-sm break-inside-avoid shadow-sm hover:shadow-xl transition-all duration-500"
                            >
                                <img
                                    src={item.url}
                                    alt={item.title || `Gallery image ${index + 1}`}
                                    className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <p className="text-white font-serif text-lg italic translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        {item.title || 'Luxury Experience'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item, index) => (
                            <div key={item.id || index} className="aspect-square relative group overflow-hidden">
                                <img
                                    src={item.url}
                                    alt={item.title || 'Gallery'}
                                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default GallerySection;
