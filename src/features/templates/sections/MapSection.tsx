import React from 'react';
import { Business } from '../../../../types.ts';

interface MapSectionProps {
    business: Business;
    mapFilter?: string;
}

const MapSection: React.FC<MapSectionProps> = ({ business, mapFilter = 'grayscale(100%) opacity(0.7) contrast(1.1)' }) => {
    const position: [number, number] = [
        business.latitude || 10.7769,
        business.longitude || 106.7009
    ];

    const delta = 0.005;
    const bbox = `${position[1] - delta},${position[0] - delta},${position[1] + delta},${position[0] + delta}`;
    const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${position[0]},${position[1]}`;

    return (
        <section className="relative w-full h-[500px] bg-[#f9f9f9]">
            {/* Overlay info box */}
            <div className="absolute top-12 left-4 md:left-20 z-10 bg-white p-8 shadow-2xl max-w-sm rounded-sm">
                <h4 className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Vị trí của chúng tôi</h4>
                <h5 className="text-2xl font-serif text-neutral-dark mb-4">{business.name}</h5>
                <div className="space-y-4 text-neutral-dark/70 text-sm font-sans">
                    <p className="flex items-start gap-3">
                        <span className="text-primary mt-1">📍</span>
                        {business.address}, {business.district}, {business.city}
                    </p>
                    <p className="flex items-center gap-3">
                        <span className="text-primary">📞</span>
                        {business.phone}
                    </p>
                    <p className="flex items-center gap-3">
                        <span className="text-primary">✉️</span>
                        {business.email || 'contact@beauty.asia'}
                    </p>
                </div>
                <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 block text-center py-3 bg-neutral-dark text-white text-xs font-bold tracking-widest hover:bg-primary transition-colors"
                >
                    DẪN ĐƯỜNG ĐẾN SPA
                </a>
            </div>

            {/* Styled Map via iframe */}
            <div className="w-full h-full relative overflow-hidden" style={{ filter: mapFilter }}>
                <iframe
                    src={mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    title="Business Location"
                />
            </div>

            {/* Soft overlay to blend map edges */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent pointer-events-none z-20" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
        </section>
    );
};

export default MapSection;
