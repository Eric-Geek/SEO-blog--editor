export function generateSlug(text: string): string {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

export function extractSlugFromUrl(url: string): string {
    if (!url) {
        return '';
    }
    try {
        const urlObject = new URL(url);
        const pathname = urlObject.pathname.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes
        if (pathname) {
            // Get the last part of the path
            return pathname.substring(pathname.lastIndexOf('/') + 1);
        }
    } catch (e) {
        // If it's not a full URL, treat it as a string path
        const urlString = url.replace(/\/$/g, ''); // remove trailing slash
        return urlString.substring(urlString.lastIndexOf('/') + 1);
    }
    return '';
} 