// C2.6 - Contact Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React from 'react';
import { usePublicPageContent } from '../contexts/PublicPageContentContext';
import ContactHero from '../components/page-renderer/ContactHero';
import ContactInfo from '../components/page-renderer/ContactInfo';
import ContactForm from '../components/page-renderer/ContactForm';
import ContactMap from '../components/page-renderer/ContactMap';
import SEOHead from '../components/SEOHead.tsx';
import LoadingState from '../components/LoadingState.tsx';

const ContactPage: React.FC = () => {
  const { getPageContent, loading } = usePublicPageContent();
  const pageData = getPageContent('contact');

  // SEO metadata
  const seoTitle = 'Liên hệ | 1Beauty.asia';
  const seoDescription = 'Liên hệ với 1Beauty.asia - Chúng tôi luôn sẵn sàng hỗ trợ bạn. Gửi tin nhắn hoặc gọi điện cho chúng tôi ngay hôm nay.';
  const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/contact` : '';

  if (loading || !pageData) {
    return (
      <>
        <SEOHead title={seoTitle} description={seoDescription} url={seoUrl} />
        <LoadingState message="Đang tải trang liên hệ..." fullScreen={true} />
      </>
    );
  }

  const { visibility } = pageData;

  const isVisible = (key: string) => visibility[key] ?? false;

  return (
    <>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords="liên hệ, contact, hỗ trợ, customer service, 1beauty"
        url={seoUrl}
        type="website"
      />
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
    </>
  );
};

export default ContactPage;
