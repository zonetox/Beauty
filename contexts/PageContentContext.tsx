import { LayoutItem } from '../types';

type PageName = 'about' | 'contact';

interface PageData {
  layout: LayoutItem[];
  visibility: { [key: string]: boolean };
}

export const DEFAULT_PAGE_CONTENT: { [key in PageName]: PageData } = {
  about: {
    layout: [
      { id: 'ab-1', type: 'section', key: 'about-hero' },
      { id: 'ab-2', type: 'section', key: 'why-choose-us' },
      { id: 'ab-3', type: 'section', key: 'about-history' },
      { id: 'ab-4', type: 'section', key: 'about-mission' },
      { id: 'ab-5', type: 'section', key: 'about-team' },
      { id: 'ab-6', type: 'section', key: 'cta-section' },
    ],
    visibility: {
      'about-hero': true,
      'why-choose-us': true,
      'about-history': true,
      'about-mission': false, // Hidden by default
      'about-team': false, // Hidden by default
      'cta-section': true,
    },
  },
  contact: {
    layout: [
      { id: 'ct-1', type: 'section', key: 'contact-hero' },
      // These two will be placed in a grid by the ContactPage component
      { id: 'ct-2', type: 'section', key: 'contact-info' },
      { id: 'ct-3', type: 'section', key: 'contact-form' },
      { id: 'ct-4', type: 'section', key: 'contact-map' },
    ],
    visibility: {
      'contact-hero': true,
      'contact-info': true,
      'contact-form': true,
      'contact-map': true,
    },
  },
};
