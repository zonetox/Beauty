import React, { useMemo } from 'react';

interface SafeHtmlRendererProps {
  html: string;
}

// Whitelist of allowed tags and their attributes
const ALLOWED_TAGS: { [key: string]: string[] } = {
  'H2': [],
  'H3': [],
  'H4': [],
  'P': [],
  'STRONG': [],
  'B': [],
  'EM': [],
  'I': [],
  'U': [],
  'S': [],
  'BLOCKQUOTE': [],
  'UL': [],
  'OL': [],
  'LI': [],
  'A': ['href', 'title', 'target'],
  'IMG': ['src', 'alt', 'title', 'style'],
};

const sanitizeNode = (node: Node): Node | null => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.cloneNode(false);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toUpperCase();

  if (!ALLOWED_TAGS[tagName]) {
    // If the tag is not allowed, just process its children
    const fragment = document.createDocumentFragment();
    for (const childNode of Array.from(element.childNodes)) {
        const sanitizedChild = sanitizeNode(childNode);
        if (sanitizedChild) {
            fragment.appendChild(sanitizedChild);
        }
    }
    return fragment;
  }

  const newElement = document.createElement(tagName);
  const allowedAttributes = ALLOWED_TAGS[tagName];

  for (const attr of Array.from(element.attributes)) {
    if (allowedAttributes.includes(attr.name.toLowerCase())) {
        if (attr.name.toLowerCase() === 'href') {
            // SECURITY: Only allow safe URL schemes (block javascript:, data:, vbscript:, etc.)
            const hrefValue = attr.value.trim().toLowerCase();
            const safeSchemes = ['http:', 'https:', 'mailto:', '#', '/'];
            const isSafeUrl = safeSchemes.some(scheme => hrefValue.startsWith(scheme));
            
            // Also allow relative URLs (starting with / or #)
            if (isSafeUrl && !hrefValue.startsWith('javascript:') && !hrefValue.startsWith('data:') && !hrefValue.startsWith('vbscript:')) {
                newElement.setAttribute(attr.name, attr.value);
            }
        } else if (attr.name.toLowerCase() === 'style' && tagName === 'IMG') {
            // Only allow specific safe styles for images
            const safeStyles: string[] = [];
            if (element.style.width) safeStyles.push(`width: ${element.style.width}`);
            if (element.style.height) safeStyles.push(`height: ${element.style.height}`);
            if (element.style.borderRadius) safeStyles.push(`border-radius: ${element.style.borderRadius}`);
            if (element.style.margin) safeStyles.push(`margin: ${element.style.margin}`);
            if (safeStyles.length > 0) {
                 newElement.setAttribute('style', safeStyles.join('; '));
            }
        }
        else {
            newElement.setAttribute(attr.name, attr.value);
        }
    }
  }

  for (const childNode of Array.from(element.childNodes)) {
    const sanitizedChild = sanitizeNode(childNode);
    if (sanitizedChild) {
      newElement.appendChild(sanitizedChild);
    }
  }

  return newElement;
};

const sanitizeHtml = (dirtyHtml: string): string => {
  if (typeof DOMParser === 'undefined') {
    return dirtyHtml; // Fallback for environments without DOMParser (e.g., some SSR)
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(dirtyHtml, 'text/html');
  const sanitizedBody = document.createElement('body');
  
  for (const node of Array.from(doc.body.childNodes)) {
      const sanitizedNode = sanitizeNode(node);
      if(sanitizedNode) {
          sanitizedBody.appendChild(sanitizedNode);
      }
  }

  return sanitizedBody.innerHTML;
};

const SafeHtmlRenderer: React.FC<SafeHtmlRendererProps> = ({ html }) => {
  const sanitizedHtml = useMemo(() => sanitizeHtml(html), [html]);

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};

export default SafeHtmlRenderer;