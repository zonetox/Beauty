// C2.5 - SEO Head Component (Enhanced)
// Tuân thủ ARCHITECTURE.md, chuẩn SEO cơ bản
// 100% hoàn thiện, không placeholder

import { useEffect } from 'react';

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
    reviewCount?: number;
  };
  openingHoursSpecification?: Array<{
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'business';
  articleSchema?: ArticleSchema;
  businessSchema?: LocalBusinessSchema;
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
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
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
    updateMetaTag('og:type', type === 'article' ? 'article' : type === 'business' ? 'website' : 'website', true);
    updateMetaTag('og:site_name', '1Beauty.asia', true);
    updateMetaTag('og:locale', 'vi_VN', true);

    // Additional OG tags for articles
    if (type === 'article' && articleSchema) {
      if (articleSchema.datePublished) {
        updateMetaTag('og:published_time', articleSchema.datePublished, true);
      }
      if (articleSchema.dateModified) {
        updateMetaTag('og:modified_time', articleSchema.dateModified, true);
      }
      if (articleSchema.author?.name) {
        updateMetaTag('article:author', articleSchema.author.name, true);
      }
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Schema.org JSON-LD
    const schemaScript = document.getElementById('schema-org-json');
    if (schemaScript) {
      schemaScript.remove();
    }

    let schema: any = {
      '@context': 'https://schema.org',
    };

    if (type === 'website') {
      schema['@type'] = 'WebSite';
      schema.name = '1Beauty.asia';
      schema.description = description;
      schema.url = url;
      schema.potentialAction = {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: typeof window !== 'undefined' 
            ? `${window.location.origin}/directory?keyword={search_term_string}`
            : `${url.split('/')[0]}//${url.split('/')[2]}/directory?keyword={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      };
    } else if (type === 'article' && articleSchema) {
      schema['@type'] = 'Article';
      schema.headline = articleSchema.headline || title;
      schema.description = description;
      schema.image = articleSchema.image || [image];
      schema.url = url;
      if (articleSchema.author) {
        schema.author = {
          '@type': 'Person',
          name: articleSchema.author.name,
          ...(articleSchema.author.url && { url: articleSchema.author.url }),
        };
      }
      if (articleSchema.datePublished) {
        schema.datePublished = articleSchema.datePublished;
      }
      if (articleSchema.dateModified) {
        schema.dateModified = articleSchema.dateModified;
      }
      schema.publisher = articleSchema.publisher || {
        '@type': 'Organization',
        name: '1Beauty.asia',
        logo: {
          '@type': 'ImageObject',
          url: typeof window !== 'undefined' 
            ? `${window.location.origin}/favicon.svg`
            : '',
        },
      };
    } else if (type === 'business' && businessSchema) {
      schema['@type'] = 'LocalBusiness';
      schema.name = businessSchema.name || title;
      schema.description = description;
      schema.image = businessSchema.image || [image];
      schema.url = url;
      if (businessSchema.address) {
        schema.address = {
          '@type': 'PostalAddress',
          ...businessSchema.address,
        };
      }
      if (businessSchema.geo) {
        schema.geo = {
          '@type': 'GeoCoordinates',
          ...businessSchema.geo,
        };
      }
      if (businessSchema.telephone) {
        schema.telephone = businessSchema.telephone;
      }
      if (businessSchema.priceRange) {
        schema.priceRange = businessSchema.priceRange;
      }
      if (businessSchema.aggregateRating) {
        schema.aggregateRating = {
          '@type': 'AggregateRating',
          ...businessSchema.aggregateRating,
        };
      }
      if (businessSchema.openingHoursSpecification && businessSchema.openingHoursSpecification.length > 0) {
        schema.openingHoursSpecification = businessSchema.openingHoursSpecification.map(oh => ({
          '@type': 'OpeningHoursSpecification',
          ...oh,
        }));
      }
    }

    const script = document.createElement('script');
    script.id = 'schema-org-json';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }, [title, description, keywords, image, url, type, articleSchema, businessSchema]);

  return null;
};

export default SEOHead;

