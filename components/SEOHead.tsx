// C2.5 - SEO Head Component (Enhanced for AEO)
import React, { useEffect } from 'react';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

interface ArticleSchema {
  headline?: string;
  author?: {
    name: string;
    url?: string;
  };
  datePublished?: string;
  dateModified?: string;
  image?: string[];
  publisher?: {
    name: string;
    logo?: {
      url: string;
    };
  };
}

interface LocalBusinessSchema {
  name?: string;
  image?: string[];
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  geo?: {
    latitude?: number;
    longitude?: number;
  };
  telephone?: string;
  priceRange?: string;
  aggregateRating?: {
    ratingValue?: number;
    review_count?: number;
  };
  openingHoursSpecification?: Array<{
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
}

interface ReviewSchema {
  '@type'?: 'Review';
  author?: {
    '@type'?: 'Person';
    name?: string;
  };
  datePublished?: string;
  reviewBody?: string;
  reviewRating?: {
    '@type'?: 'Rating';
    ratingValue?: number;
    bestRating?: number;
  };
  itemReviewed?: {
    '@type'?: 'LocalBusiness';
    name?: string;
  };
}

interface OrganizationSchema {
  '@type'?: 'Organization';
  name?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
  contactPoint?: {
    '@type'?: 'ContactPoint';
    telephone?: string;
    contactType?: string;
    areaServed?: string;
  };
}

interface ItemListSchema {
  name: string;
  itemListElement: Array<{
    position: number;
    url: string;
    name?: string;
  }>;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'business' | 'itemlist';
  articleSchema?: ArticleSchema;
  businessSchema?: LocalBusinessSchema;
  reviewSchema?: ReviewSchema[];
  organizationSchema?: OrganizationSchema;
  itemListSchema?: ItemListSchema;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = '1Beauty.asia - Khám phá Vẻ đẹp đích thực',
  description = 'Tìm kiếm hàng ngàn spa, salon, và clinic uy tín gần bạn. Đặt lịch hẹn chỉ trong vài cú nhấp chuột.',
  keywords = 'spa, salon, clinic, làm đẹp, đặt lịch, beauty, vietnam',
  image = 'https://picsum.photos/seed/beauty/1200/630',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  articleSchema,
  businessSchema,
  reviewSchema,
  organizationSchema,
  itemListSchema,
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.head.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type === 'article' ? 'article' : 'website', true);
    updateMetaTag('og:site_name', '1Beauty.asia', true);
    updateMetaTag('og:locale', 'vi_VN', true);

    // Additional OG tags for articles
    if (type === 'article' && articleSchema) {
      if (articleSchema.datePublished) updateMetaTag('og:published_time', articleSchema.datePublished, true);
      if (articleSchema.dateModified) updateMetaTag('og:modified_time', articleSchema.dateModified, true);
      if (articleSchema.author?.name) updateMetaTag('article:author', articleSchema.author.name, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Canonical URL
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Schema.org JSON-LD
    const existingSchemaScripts = document.head.querySelectorAll('script[id^="schema-org-json"]');
    existingSchemaScripts.forEach(script => script.remove());

    const schemas: any[] = []; // Using any for schema array to simplify complex nested types

    // Main schema based on type
    if (type === 'website') {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '1Beauty.asia',
        description,
        url,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: typeof window !== 'undefined'
              ? `${window.location.origin}/directory?keyword={search_term_string}`
              : `${url.split('/')[0]}//${url.split('/')[2]}/directory?keyword={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      });
    } else if (type === 'article' && articleSchema) {
      const articleObj: any = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: articleSchema.headline || title,
        description,
        image: articleSchema.image || [image],
        url,
        publisher: articleSchema.publisher || {
          '@type': 'Organization',
          name: '1Beauty.asia',
          logo: { '@type': 'ImageObject', url: typeof window !== 'undefined' ? `${window.location.origin}/favicon.svg` : '' }
        },
      };
      if (articleSchema.author) articleObj.author = { '@type': 'Person', name: articleSchema.author.name, url: articleSchema.author.url };
      if (articleSchema.datePublished) articleObj.datePublished = articleSchema.datePublished;
      if (articleSchema.dateModified) articleObj.dateModified = articleSchema.dateModified;
      schemas.push(articleObj);
    } else if (type === 'business' && businessSchema) {
      const bizObj: any = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: businessSchema.name || title,
        description,
        image: businessSchema.image || [image],
        url,
      };
      if (businessSchema.address) bizObj.address = { '@type': 'PostalAddress', ...businessSchema.address };
      if (businessSchema.geo) bizObj.geo = { '@type': 'GeoCoordinates', ...businessSchema.geo };
      if (businessSchema.telephone) bizObj.telephone = businessSchema.telephone;
      if (businessSchema.priceRange) bizObj.priceRange = businessSchema.priceRange;
      if (businessSchema.aggregateRating) bizObj.aggregateRating = { '@type': 'AggregateRating', ...businessSchema.aggregateRating };
      if (businessSchema.openingHoursSpecification) bizObj.openingHoursSpecification = businessSchema.openingHoursSpecification.map(oh => ({ '@type': 'OpeningHoursSpecification', ...oh }));
      schemas.push(bizObj);
    } else if (type === 'itemlist' && itemListSchema) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: itemListSchema.name,
        description,
        itemListElement: itemListSchema.itemListElement.map(item => ({
          '@type': 'ListItem',
          position: item.position,
          url: item.url,
          name: item.name
        }))
      });
    }

    if (organizationSchema) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: organizationSchema.name || '1Beauty.asia',
        url: organizationSchema.url,
        logo: organizationSchema.logo,
        sameAs: organizationSchema.sameAs,
        contactPoint: organizationSchema.contactPoint
      });
    }

    if (reviewSchema) {
      reviewSchema.forEach((review) => {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'Review',
          author: review.author,
          datePublished: review.datePublished,
          reviewBody: review.reviewBody,
          reviewRating: review.reviewRating,
          itemReviewed: review.itemReviewed
        });
      });
    }

    schemas.forEach((schema, index) => {
      const script = document.createElement('script');
      script.id = `schema-org-json-${index}`;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }, [title, description, keywords, image, url, type, articleSchema, businessSchema, reviewSchema, organizationSchema, itemListSchema]);

  return null;
};

export default SEOHead;
