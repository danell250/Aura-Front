import { useEffect } from 'react';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export const useMetaTags = ({ 
  title = 'Aura', 
  description = 'Establish your professional frequency on Aura, the world\'s most elegant social network. Connect, radiate, and broadcast your professional pulse.',
  image = 'https://auraradiance.vercel.app/og-image.jpg',
  url = 'https://auraradiance.vercel.app',
  type = 'website'
}: MetaTagsProps = {}) => {
  
  useEffect(() => {
    // Update or create meta tags
    const updateMetaTag = (property: string, content: string) => {
      if (property.startsWith('og:')) {
        let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          document.head.appendChild(tag);
        }
        tag.content = content;
      } else if (property.startsWith('twitter:')) {
        let tag = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement;
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('name', property);
          document.head.appendChild(tag);
        }
        tag.content = content;
      } else {
        let tag = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement;
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('name', property);
          document.head.appendChild(tag);
        }
        tag.content = content;
      }
    };

    // Update basic meta tags
    document.title = title;
    updateMetaTag('description', description);

    // Update Open Graph tags
    updateMetaTag('og:type', type);
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:image:width', '1200');
    updateMetaTag('og:image:height', '630');
    updateMetaTag('og:image:alt', title);
    updateMetaTag('og:url', url);

    // Update Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:image:alt', title);

    // Update LinkedIn tags
    updateMetaTag('linkedin:title', title);
    updateMetaTag('linkedin:description', description);
    updateMetaTag('linkedin:image', image);

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = url;

  }, [title, description, image, url, type]);
};
