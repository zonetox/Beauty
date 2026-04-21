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
        <section className="py-24 px-4 md:px-20 bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-accent mb-6 font-bold">Bộ sưu tập</h2>
                    <h3 className="text-5xl md:text-6xl font-serif text-primary tracking-tight">Không gian & <span className="italic font-light">Nghệ thuật</span></h3>
                    <div className="w-24 h-0.5 bg-gold/30 mx-auto mt-8" />
                </div>

                {layout === 'masonry' ? (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                        {items.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="relative group overflow-hidden rounded-2xl break-inside-avoid shadow-soft hover:shadow-premium transition-all duration-700"
                            >
                                <img
                                    src={item.url}
                                    alt={item.title || `Gallery image ${index + 1}`}
                                    className="w-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-6 text-center">
                                    <p className="text-white font-serif text-xl tracking-widest italic translate-y-8 group-hover:translate-y-0 transition-transform duration-700">
                                        {item.title || 'Luxury Experience'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {items.map((item, index) => (
                            <div key={item.id || index} className="aspect-square relative group overflow-hidden rounded-2xl shadow-soft">
                                <img
                                    src={item.url}
                                    alt={item.title || 'Gallery'}
                                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default GallerySection;
