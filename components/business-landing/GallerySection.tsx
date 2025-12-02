import React, { useState, useRef, useEffect } from 'react';
import { Business, MediaType } from '../../types.ts';
import { getOptimizedSupabaseUrl } from '../../lib/image.ts';

interface GallerySectionProps {
    business: Business;
}

const PlayIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/80 drop-shadow-lg transition-transform group-hover:scale-110" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);


const GallerySection: React.FC<GallerySectionProps> = ({ business }) => {
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


    if (!business.gallery || business.gallery.length === 0) {
        return null;
    }
    
    const handleVideoClick = (id: string) => {
        setPlayingVideoId(prevId => (prevId === id ? null : id));
    };

    return (
        <section id="gallery" className="py-20 lg:py-28">
            <div className="text-center">
                <p className="text-sm font-semibold uppercase text-primary tracking-widest">Thư viện</p>
                <h2 className="mt-2 text-3xl lg:text-4xl font-bold font-serif text-neutral-dark">
                    Không gian & Tác phẩm
                </h2>
            </div>
            <div className="mt-16 columns-2 md:columns-3 lg:columns-4 gap-4">
                {business.gallery.map(item => (
                    <div key={item.id} className="mb-4 break-inside-avoid rounded-lg overflow-hidden shadow-lg group relative">
                         {item.type === MediaType.IMAGE ? (
                            <>
                                <img src={getOptimizedSupabaseUrl(item.url, { width: 600, quality: 80 })} alt={item.title || 'Gallery image'} className="w-full h-auto" />
                                {item.title && (
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 pointer-events-none">
                                        <p className="text-white font-semibold text-sm">{item.title}</p>
                                    </div>
                                )}
                            </>
                         ) : (
                             <div className="relative cursor-pointer" onClick={() => handleVideoClick(item.id)}>
                                <video 
                                    ref={el => { videoRefs.current[item.id] = el; }}
                                    src={item.url} 
                                    className="w-full h-auto bg-black"
                                    controls={playingVideoId === item.id}
                                    playsInline
                                    onPause={() => setPlayingVideoId(null)}
                                />
                                {playingVideoId !== item.id && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                        <PlayIcon />
                                    </div>
                                )}
                             </div>
                         )}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default GallerySection;
