import React from 'react';
import { LayoutItem } from '../types';

// Import all possible section components
import AboutHistory from './page-renderer/AboutHistory';
import AboutMission from './page-renderer/AboutMission';
import AboutTeam from './page-renderer/AboutTeam';
import WhyChooseUs from './page-renderer/WhyChooseUs';
import CtaSection from './page-renderer/CtaSection';
import ContactInfo from './page-renderer/ContactInfo';
import ContactForm from './page-renderer/ContactForm';

// Hero and Map components are now rendered directly by their pages for better layout control
// import AboutHero from './page-renderer/AboutHero';
// import ContactHero from './page-renderer/ContactHero';
// import ContactMap from './page-renderer/ContactMap';


interface PageData {
  layout: LayoutItem[];
  visibility: { [key: string]: boolean };
}

interface PageRendererProps {
  pageData: PageData;
}

const componentMap: { [key: string]: React.ComponentType<any> } = {
  // About Page sections
  'about-history': AboutHistory,
  'about-mission': AboutMission,
  'about-team': AboutTeam,
  'why-choose-us': WhyChooseUs,
  'cta-section': CtaSection,

  // Contact Page sections
  'contact-info': ContactInfo,
  'contact-form': ContactForm,
};

const PageRenderer: React.FC<PageRendererProps> = ({ pageData }) => {
  if (!pageData) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h2 className="text-2xl font-bold">Content not found</h2>
        <p className="text-gray-500">The content for this page could not be loaded.</p>
      </div>
    );
  }

  const { layout, visibility } = pageData;
  
  const renderItem = (item: LayoutItem) => {
    if (item.type === 'section') {
      if (!item.key || !visibility[item.key]) {
        return null;
      }
      const Component = componentMap[item.key];
      return Component ? <Component key={item.id} /> : null;
    }
    if (item.type === 'text') {
      return (
        <div key={item.id} className="container mx-auto py-8 text-center">
          <h2 className="text-2xl font-bold font-serif">{item.content}</h2>
        </div>
      );
    }
    if (item.type === 'rule') {
      return (
        <div key={item.id} className="container mx-auto">
          <hr className="my-8" />
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {layout.map(renderItem)}
    </div>
  );
};

export default PageRenderer;
