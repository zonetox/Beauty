import React, { useState, useRef, useEffect } from 'react';
import { Business, MediaType } from '../../types.ts';
import { getOptimizedSupabaseUrl } from '../../lib/image.ts';

import Editable from '../Editable.tsx';

interface GallerySectionProps {
    business: Business;
    content?: any;
    isEditing?: boolean;
}

const PlayIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/80 drop-shadow-lg transition-transform group-hover:scale-110" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);


const GallerySection: React.FC<GallerySectionProps> = ({ business, content }) => {
    const displayTitle = content?.title || 'Không gian & Tác phẩm';
    const displaySubtitle = content?.subtitle || 'Thư viện';
    const displayItems = content?.items || business.gallery || [];
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
    const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

    useEffect(() => {
        // Effect to ensure only one video plays at a time.
        // When playingVideoId changes, pause all other videos.
        Object.keys(videoRefs.current).forEach(videoId => {
            const videoEl = videoRefs.current[videoId];
            if (videoEl) {
                if (videoId === playingVideoId) {
                    videoEl.play().catch(e => console.error("Video play failed:", e));
                } else {
                    if (!videoEl.paused) {
                        videoEl.pause();
                    }
                }
            }
        });
    }, [playingVideoId]);


    if (displayItems.length === 0) {
        return null;
    }

    const handleVideoClick = (id: string) => {
        setPlayingVideoId(prevId => (prevId === id ? null : id));
    };

    return (
        <section id="gallery" className="py-32 lg:py-48 bg-secondary">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="text-center mb-24">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-12 h-px bg-primary"></div>
                        <p className="text-xs font-bold uppercase text-primary tracking-[0.5em]">
                            <Editable id="gallery_subtitle" type="text" value={displaySubtitle}>
                                {displaySubtitle}
                            </Editable>
                        </p>
                        <div className="w-12 h-px bg-primary"></div>
                    </div>
                    <h2 className="mt-2 text-5xl lg:text-7xl font-bold font-serif text-accent italic">
                        <Editable id="gallery_title" type="text" value={displayTitle}>
                            {displayTitle}
                        </Editable>
                    </h2>
                </div>

                <div className="columns-1 md:columns-2 lg:columns-3 gap-8">
                    {displayItems.map((item: any) => (
                        <div key={item.id} className="mb-8 break-inside-avoid rounded-luxury overflow-hidden luxury-border-thin group relative bg-white p-2 shadow-premium hover:shadow-2xl transition-all duration-700 hover:-translate-y-2">
                            {item.type === MediaType.IMAGE ? (
                                <div className="relative overflow-hidden rounded-[1.8rem]">
                                    <img
                                        src={getOptimizedSupabaseUrl(item.url, { width: 800, quality: 85 })}
                                        alt={item.title || 'Gallery image'}
                                        className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-accent/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-px bg-primary"></div>
                                            <p className="text-white font-serif italic text-lg">{item.title || 'Pure Beauty'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative cursor-pointer overflow-hidden rounded-[1.8rem]" onClick={() => handleVideoClick(item.id)}>
                                    <video
                                        ref={el => { videoRefs.current[item.id] = el; }}
                                        src={item.url}
                                        className="w-full h-auto bg-accent grayscale group-hover:grayscale-0 transition-all duration-1000"
                                        controls={playingVideoId === item.id}
                                        playsInline
                                        onPause={() => setPlayingVideoId(null)}
                                    />
                                    {playingVideoId !== item.id && (
                                        <div className="absolute inset-0 bg-accent/30 flex items-center justify-center pointer-events-none group-hover:bg-accent/10 transition-colors">
                                            <PlayIcon />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GallerySection;
