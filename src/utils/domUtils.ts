export function getMetaTagContent(doc: Document, name: string, attribute = 'name'): string {
  const meta = doc.querySelector(`meta[${attribute}="${name}"]`);
  return meta ? meta.getAttribute('content') || '' : '';
}

export function getLinkTagHref(doc: Document, rel: string): string {
  const link = doc.querySelector(`link[rel="${rel}"]`);
  return link ? link.getAttribute('href') || '' : '';
}

export function updateMetaTag(doc: Document, name: string, content: string, attribute = 'name') {
  if (!doc) return;
  let meta = doc.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!meta) {
    meta = doc.createElement('meta');
    meta.setAttribute(attribute, name);
    doc.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

export function updateLinkTag(doc: Document, rel: string, href: string) {
  if (!doc) return;
  let link = doc.head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = doc.createElement('link');
    link.setAttribute('rel', rel);
    doc.head.appendChild(link);
  }
  link.setAttribute('href', href);
} 