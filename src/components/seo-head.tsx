import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  jsonLd?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Semakin Pintar - Free Educational Games for Kids & Family Learning',
  description = 'Free educational games platform featuring mental arithmetic, multiplication tables, and brain training games. Perfect for kids learning math and families practicing together.',
  keywords = 'educational games, mental math, multiplication table, kids learning, brain training, math practice, cognitive skills, family learning, free educational apps',
  canonicalUrl = 'https://www.semakinpintar.com',
  ogTitle,
  ogDescription,
  ogImage = 'https://www.semakinpintar.com/logo.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  jsonLd
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update canonical link
    const updateCanonicalLink = (url: string) => {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', url);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    updateMetaTag('author', 'Semakin Pintar Team');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    // Open Graph tags
    updateMetaTag('og:title', ogTitle || title, true);
    updateMetaTag('og:description', ogDescription || description, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:site_name', 'Semakin Pintar', true);
    updateMetaTag('og:locale', 'en_US', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', twitterCard);
    updateMetaTag('twitter:title', ogTitle || title);
    updateMetaTag('twitter:description', ogDescription || description);
    updateMetaTag('twitter:image', ogImage);

    // Additional SEO tags
    updateMetaTag('theme-color', '#8B5CF6');
    updateMetaTag('msapplication-TileColor', '#8B5CF6');
    updateMetaTag('application-name', 'Semakin Pintar');

    // Canonical URL
    updateCanonicalLink(canonicalUrl);

    // JSON-LD structured data
    if (jsonLd) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }

  }, [title, description, keywords, canonicalUrl, ogTitle, ogDescription, ogImage, ogType, twitterCard, jsonLd]);

  return null; // This component doesn't render anything
};

export default SEOHead;