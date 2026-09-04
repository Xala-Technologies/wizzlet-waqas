import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  /** Path used for the canonical URL, e.g. "/pricing". Defaults to the current path. */
  canonicalPath?: string;
  noindex?: boolean;
  /** Optional JSON-LD structured data object. */
  jsonLd?: Record<string, unknown>;
}

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  return el;
}

/**
 * Sets per-page document title, meta description, canonical URL, Open Graph
 * and Twitter tags. Dependency-free so it works with the existing router setup.
 */
export function Seo({ title, description, canonicalPath, noindex, jsonLd }: SeoProps) {
  useEffect(() => {
    document.title = title;

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });

    const href = `${window.location.origin}${canonicalPath ?? window.location.pathname}`;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = href;
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: href });

    const robots = upsertMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' });

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      robots.setAttribute('content', 'index, follow');
      script?.remove();
    };
  }, [title, description, canonicalPath, noindex, jsonLd]);

  return null;
}

export default Seo;
