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

const VideoSection: React.FC<VideoSectionProps> = ({ business, content, isEditing }) => {
    const displayTitle = content?.title || 'Khám phá không gian của chúng tôi';
    const displaySubtitle = content?.subtitle || 'Video';
    const embedUrl = getYoutubeEmbedUrl(content?.video_url || business.youtube_url);

    if (!embedUrl) {
        return null;
    }

    return (
        <section id="video" className="py-20 lg:py-28 bg-background rounded-lg -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <p className="text-sm font-semibold uppercase text-primary tracking-widest">
                    <Editable id="video_subtitle" type="text" value={displaySubtitle}>
                        {displaySubtitle}
                    </Editable>
                </p>
                <h2 className="mt-2 text-3xl lg:text-4xl font-bold font-serif text-neutral-dark">
                    <Editable id="video_title" type="text" value={displayTitle}>
                        {displayTitle}
                    </Editable>
                </h2>
            </div>
            <div className="mt-16 max-w-4xl mx-auto aspect-video">
                <iframe
                    className="w-full h-full rounded-lg shadow-xl"
                    src={embedUrl}
                    title={`${business.name} YouTube video`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        </section>
    );
};

export default VideoSection;

