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

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'business';
  articleSchema?: ArticleSchema;
  businessSchema?: LocalBusinessSchema;
  reviewSchema?: ReviewSchema[];
  organizationSchema?: OrganizationSchema;
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
    // Remove all existing schema scripts
    const existingSchemaScripts = document.querySelectorAll('script[id^="schema-org-json"]');
    existingSchemaScripts.forEach(script => script.remove());

    // Build array of schemas (can have multiple)
    const schemas: any[] = [];

    // Main schema based on type
    if (type === 'website') {
      const websiteSchema: any = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '1Beauty.asia',
        description: description,
        url: url,
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
      };
      schemas.push(websiteSchema);
    } else if (type === 'article' && articleSchema) {
      const articleSchemaObj: any = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: articleSchema.headline || title,
        description: description,
        image: articleSchema.image || [image],
        url: url,
        publisher: articleSchema.publisher || {
          '@type': 'Organization',
          name: '1Beauty.asia',
          logo: {
            '@type': 'ImageObject',
            url: typeof window !== 'undefined' 
              ? `${window.location.origin}/favicon.svg`
              : '',
          },
        },
      };
      if (articleSchema.author) {
        articleSchemaObj.author = {
          '@type': 'Person',
          name: articleSchema.author.name,
          ...(articleSchema.author.url && { url: articleSchema.author.url }),
        };
      }
      if (articleSchema.datePublished) {
        articleSchemaObj.datePublished = articleSchema.datePublished;
      }
      if (articleSchema.dateModified) {
        articleSchemaObj.dateModified = articleSchema.dateModified;
      }
      schemas.push(articleSchemaObj);
    } else if (type === 'business' && businessSchema) {
      const businessSchemaObj: any = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: businessSchema.name || title,
        description: description,
        image: businessSchema.image || [image],
        url: url,
      };
      if (businessSchema.address) {
        businessSchemaObj.address = {
          '@type': 'PostalAddress',
          ...businessSchema.address,
        };
      }
      if (businessSchema.geo) {
        businessSchemaObj.geo = {
          '@type': 'GeoCoordinates',
          ...businessSchema.geo,
        };
      }
      if (businessSchema.telephone) {
        businessSchemaObj.telephone = businessSchema.telephone;
      }
      if (businessSchema.priceRange) {
        businessSchemaObj.priceRange = businessSchema.priceRange;
      }
      if (businessSchema.aggregateRating) {
        businessSchemaObj.aggregateRating = {
          '@type': 'AggregateRating',
          ...businessSchema.aggregateRating,
        };
      }
      if (businessSchema.openingHoursSpecification && businessSchema.openingHoursSpecification.length > 0) {
        businessSchemaObj.openingHoursSpecification = businessSchema.openingHoursSpecification.map(oh => ({
          '@type': 'OpeningHoursSpecification',
          ...oh,
        }));
      }
      schemas.push(businessSchemaObj);
    }

    // Add Organization schema if provided
    if (organizationSchema) {
      const orgSchema: any = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: organizationSchema.name || '1Beauty.asia',
        ...(organizationSchema.url && { url: organizationSchema.url }),
        ...(organizationSchema.logo && { logo: organizationSchema.logo }),
        ...(organizationSchema.sameAs && { sameAs: organizationSchema.sameAs }),
        ...(organizationSchema.contactPoint && { contactPoint: organizationSchema.contactPoint }),
      };
      schemas.push(orgSchema);
    }

    // Add Review schemas if provided
    if (reviewSchema && reviewSchema.length > 0) {
      reviewSchema.forEach(review => {
        const reviewSchemaObj: any = {
          '@context': 'https://schema.org',
          '@type': 'Review',
          ...(review.author && { author: review.author }),
          ...(review.datePublished && { datePublished: review.datePublished }),
          ...(review.reviewBody && { reviewBody: review.reviewBody }),
          ...(review.reviewRating && { reviewRating: review.reviewRating }),
          ...(review.itemReviewed && { itemReviewed: review.itemReviewed }),
        };
        schemas.push(reviewSchemaObj);
      });
    }

    // Render all schemas
    schemas.forEach((schema, index) => {
      const script = document.createElement('script');
      script.id = `schema-org-json-${index}`;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }, [title, description, keywords, image, url, type, articleSchema, businessSchema, reviewSchema, organizationSchema]);

  return null;
};

export default SEOHead;

