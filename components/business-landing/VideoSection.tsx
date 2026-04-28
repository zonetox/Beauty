import React from 'react';
import { Business } from '../../types';

import Editable from '../Editable.tsx';

interface VideoSectionProps {
    business: Business;
    content?: any;
    isEditing?: boolean;
}

const getYoutubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    let videoId = '';
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v') || '';
        }
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
        }
    } catch {
        console.error("Invalid YouTube URL provided for business:", url);
    }
    return null;
};

const VideoSection: React.FC<VideoSectionProps> = ({ business, content }) => {
    const displayTitle = content?.title || 'Khám phá không gian của chúng tôi';
    const displaySubtitle = content?.subtitle || 'Video';
    const embedUrl = getYoutubeEmbedUrl(content?.video_url || business.youtube_url);

    if (!embedUrl) {
        return null;
    }

    return (
        <section id="video" className="py-32 lg:py-48 bg-secondary">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="text-center mb-24 animate-fade-in-up">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-12 h-px bg-primary"></div>
                        <p className="text-xs font-bold uppercase text-primary tracking-[0.5em]">
                            <Editable id="video_subtitle" type="text" value={displaySubtitle}>
                                {displaySubtitle}
                            </Editable>
                        </p>
                        <div className="w-12 h-px bg-primary"></div>
                    </div>
                    <h2 className="mt-2 text-5xl lg:text-7xl font-bold font-serif text-accent italic">
                        <Editable id="video_title" type="text" value={displayTitle}>
                            {displayTitle}
                        </Editable>
                    </h2>
                </div>

                <div className="max-w-6xl mx-auto relative">
                    {/* Cinematic Frame Decoration */}
                    <div className="absolute -inset-4 border border-primary/20 rounded-luxury z-0"></div>
                    <div className="absolute -inset-8 border border-primary/10 rounded-luxury z-0 rotate-1"></div>

                    <div className="relative z-10 bg-white rounded-luxury overflow-hidden shadow-premium p-4 luxury-border-thin">
                        <div className="aspect-video">
                            <iframe
                                className="w-full h-full rounded-xl"
                                src={embedUrl}
                                title={`${business.name} YouTube video`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>

                    {/* Luxury Caption */}
                    <div className="mt-12 text-center">
                        <p className="font-serif italic text-accent/50 text-xl font-light">"Kiến tạo vẻ đẹp hoàn mỹ từ tâm hồn"</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VideoSection;

