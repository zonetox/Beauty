import React from 'react';
import { Business } from '../../types.ts';
import { getOptimizedSupabaseUrl } from '../../lib/image.ts';

interface TeamSectionProps {
    business: Business;
}

const TeamSection: React.FC<TeamSectionProps> = ({ business }) => {
    if (!business.team || business.team.length === 0) {
        return null;
    }

    return (
        <section id="team" className="py-20 lg:py-28 bg-background rounded-lg -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <p className="text-sm font-semibold uppercase text-primary tracking-widest">Đội ngũ</p>
                <h2 className="mt-2 text-3xl lg:text-4xl font-bold font-serif text-neutral-dark">
                    Gặp gỡ chuyên gia của chúng tôi
                </h2>
            </div>
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {business.team.map((member, index) => (
                    <div key={index} className="text-center">
                        {/* FIX: Changed 'imageUrl' to 'image_url' to match the TeamMember type. */}
                        <img src={getOptimizedSupabaseUrl(member.image_url, { width: 200, quality: 75 })} alt={member.name} className="w-40 h-40 rounded-full mx-auto object-cover shadow-md mb-4" />
                        <h4 className="font-bold text-xl text-neutral-dark">{member.name}</h4>
                        <p className="text-primary">{member.role}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default TeamSection;
