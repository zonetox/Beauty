import React from 'react';

const ContactMap: React.FC = () => {
    // A simple embed from OpenStreetMap.
    const latitude = 10.7769; // Example: Ho Chi Minh City center
    const longitude = 106.7009;
    const delta = 0.01;
    const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
    const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;

    return (
        <div className="bg-white">
            <iframe 
                src={mapEmbedUrl}
                width="100%" 
                height="450" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Office Location Map"
            ></iframe>
        </div>
    );
};

export default ContactMap;
