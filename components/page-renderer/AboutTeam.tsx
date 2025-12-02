
import React from 'react';

const AboutTeam: React.FC = () => (
    <div className="py-16">
        <h2 className="text-3xl font-bold font-serif text-center mb-8">Đội ngũ của chúng tôi</h2>
        <div className="flex justify-center gap-8">
            <div className="text-center">
                <img src="https://picsum.photos/seed/team-ceo/150/150" className="rounded-full mx-auto mb-2" alt="CEO" />
                <h3 className="font-bold">Jane Doe</h3>
                <p className="text-sm text-gray-500">CEO & Founder</p>
            </div>
             <div className="text-center">
                <img src="https://picsum.photos/seed/team-cto/150/150" className="rounded-full mx-auto mb-2" alt="CTO" />
                <h3 className="font-bold">John Smith</h3>
                <p className="text-sm text-gray-500">CTO</p>
            </div>
        </div>
    </div>
);

export default AboutTeam;
