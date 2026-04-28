import React from 'react';
import { Business } from '../../types.ts';
import { getOptimizedSupabaseUrl } from '../../lib/image.ts';

import Editable from '../Editable.tsx';

interface TeamSectionProps {
    business: Business;
    content?: any;
    isEditing?: boolean;
}

const TeamSection: React.FC<TeamSectionProps> = ({ business, content }) => {
    const displayTitle = content?.title || 'Gặp gỡ chuyên gia của chúng tôi';
    const displaySubtitle = content?.subtitle || 'Đội ngũ';
    const displayMembers = content?.items || business.team || [];

    if (displayMembers.length === 0) {
        return null;
    }

    return (
        <section id="team" className="py-32 lg:py-48 bg-secondary relative">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">
                    <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-px bg-primary"></div>
                            <p className="text-xs font-bold uppercase text-primary tracking-[0.5em]">
                                <Editable id="team_subtitle" type="text" value={displaySubtitle}>
                                    {displaySubtitle}
                                </Editable>
                            </p>
                        </div>
                        <h2 className="text-5xl lg:text-7xl font-bold font-serif text-accent italic leading-tight">
                            <Editable id="team_title" type="text" value={displayTitle}>
                                {displayTitle}
                            </Editable>
                        </h2>
                        <p className="mt-8 text-accent/50 text-lg font-light leading-relaxed font-sans max-w-sm italic">
                            Đội ngũ chuyên gia hàng đầu với hàng chục năm kinh nghiệm trong ngành thẩm mỹ quốc tế.
                        </p>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-12 lg:gap-16">
                        {displayMembers.map((member: any, index: number) => (
                            <div key={index} className="group relative">
                                <div className="relative h-[500px] overflow-hidden rounded-luxury luxury-border-thin shadow-premium bg-white p-3 transform transition-transform duration-700 group-hover:scale-[1.02]">
                                    <img
                                        src={getOptimizedSupabaseUrl(member.image_url, { width: 600, quality: 85 })}
                                        alt={member.name}
                                        className="w-full h-full object-cover rounded-[1.8rem] grayscale group-hover:grayscale-0 transition-all duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-accent/90 via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 p-10 flex flex-col justify-end text-center">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <div className="w-6 h-px bg-primary"></div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">{member.role}</p>
                                            <div className="w-6 h-px bg-primary"></div>
                                        </div>
                                        <h4 className="font-serif italic text-3xl text-white">{member.name}</h4>
                                    </div>
                                </div>

                                {/* Info below (Fallback mobile) */}
                                <div className="mt-6 text-center lg:hidden">
                                    <h4 className="font-serif italic text-2xl text-accent">{member.name}</h4>
                                    <p className="text-primary text-xs uppercase tracking-widest mt-1 font-bold">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TeamSection;
