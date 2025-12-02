import React from 'react';
import { usePageContent } from '../contexts/AdminPlatformContext';
import ContactHero from '../components/page-renderer/ContactHero';
import ContactInfo from '../components/page-renderer/ContactInfo';
import ContactForm from '../components/page-renderer/ContactForm';
import ContactMap from '../components/page-renderer/ContactMap';

const ContactPage: React.FC = () => {
  const { getPageContent } = usePageContent();
  const pageData = getPageContent('contact');

  if (!pageData) {
    return <div>Loading page content...</div>;
  }

  const { visibility } = pageData;

  const isVisible = (key: string) => visibility[key] ?? false;

  return (
    <div className="bg-background">
      {isVisible('contact-hero') && <ContactHero />}
      
      <div className="py-16">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-start">
          {isVisible('contact-info') && <ContactInfo />}
          {isVisible('contact-form') && <ContactForm />}
        </div>
      </div>

      {isVisible('contact-map') && <ContactMap />}
    </div>
  );
};

export default ContactPage;
