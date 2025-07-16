// src/utils/domEnhancer.ts

/**
 * Removes unwanted CSS rules from Notion's default export styles.
 * This function is designed to be safe and not break CSS structure.
 */
export function removeUnwantedCss(doc: Document) {
  if (!doc) return;
  const styleTags = doc.querySelectorAll('style');
  
  styleTags.forEach(styleTag => {
    let cssText = styleTag.innerHTML;

    // A list of exact or partial string matches for rules to be removed.
    // This is safer than complex regex replacements.
    const unwantedRuleSubstrings = [
      'margin: 2em auto',
      'max-width: 900px',
    ];

    // Split the CSS by lines and filter out the unwanted ones.
    const lines = cssText.split('\n');
    const cleanedLines = lines.filter(line => {
      const trimmedLine = line.trim();
      // Return false (remove line) if it contains any of the unwanted substrings.
      return !unwantedRuleSubstrings.some(unwanted => trimmedLine.includes(unwanted));
    });

    // Rejoin the cleaned lines.
    styleTag.innerHTML = cleanedLines.join('\n');
  });
}

/**
 * Generates Table of Contents data from H2 elements.
 */
export function generateTableOfContents(doc: Document) {
  const h2Elements = doc.querySelectorAll('h2');
  const tocItems: { id: string; text: string }[] = [];
  h2Elements.forEach((h2, index) => {
      const id = `section-${index + 1}`;
      h2.setAttribute('id', id);
      tocItems.push({ id: id, text: h2.textContent?.trim() || '' });
  });
  return { items: tocItems };
}

/**
 * Injects the Table of Contents, styles, and scripts into the document.
 */
export function injectTableOfContents(doc: Document, tocData: { items: { id: string, text: string }[] }) {
  const tocContainer = doc.createElement('div');
  tocContainer.className = 'toc-container';
  const tocTitle = doc.createElement('div');
  tocTitle.className = 'toc-title';
  tocTitle.textContent = 'CONTENTS';
  tocContainer.appendChild(tocTitle);
  const tocList = doc.createElement('ul');
  tocList.className = 'toc-list';
  tocData.items.forEach(item => {
      const li = doc.createElement('li');
      const a = doc.createElement('a');
      a.href = `#${item.id}`;
      a.textContent = item.text;
      a.className = 'toc-link';
      li.appendChild(a);
      tocList.appendChild(li);
  });
  tocContainer.appendChild(tocList);
  const wrapper = doc.createElement('div');
  wrapper.className = 'article-wrapper';
  const mainContent = doc.createElement('div');
  mainContent.className = 'main-content';
  while (doc.body.firstChild) {
      mainContent.appendChild(doc.body.firstChild);
  }
  wrapper.appendChild(tocContainer);
  wrapper.appendChild(mainContent);
  doc.body.appendChild(wrapper);
  injectTOCStyles(doc);
  injectTOCScript(doc);
  addReadingProgressBar(doc);
}

function injectTOCStyles(doc: Document) {
  const style = doc.createElement('style');
  style.textContent = `
    .article-wrapper { 
        max-width: 720px; /* This now only controls the content width */
        margin: 0 auto; /* This centers the content column */
        position: relative;
    }
    .main-content { 
        min-width: 0;
    }
    .toc-container { 
      position: fixed;
      top: 150px;
      /* Dynamic calculation for horizontal positioning */
      left: calc(50% - 360px - 60px - 260px); /* (50% viewport) - (half content width) - (gap) - (toc width) */
      width: 260px; 
      max-height: calc(100vh - 180px); 
      overflow-y: auto; 
      z-index: 1000;
    }
    
    /* Hide TOC on screens that are too narrow */
    @media (max-width: 1080px) {
      .toc-container {
        display: none;
      }
    }
    
    /* Keep other essential styles */
    .toc-title { margin: 0 0 24px 0; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #6b7280; padding-left: 16px; }
    .toc-list { list-style: none; padding: 0; margin: 0; }
    .toc-list li { margin: 0; position: relative; }
    .toc-link { display: block; color: #6b7280; text-decoration: none; padding: 10px 16px; margin: 4px 0; font-size: 14px; line-height: 1.6; border-left: 3px solid transparent; border-radius: 6px; transition: all 0.3s ease-in-out; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .toc-link:hover { color: #111827; background-color: #f3f4f6; transform: translateX(4px); }
    h2[id^="section-"] { scroll-margin-top: 80px; position: relative; }
    .reading-progress { position: fixed; top: 0; left: 0; height: 2px; background: linear-gradient(to right, #2563eb, #3b82f6); z-index: 1000; transition: width 0.3s ease; }
  `;
  doc.head.appendChild(style);
}

function injectTOCScript(doc: Document) {
    const script = doc.createElement('script');
    script.textContent = `
      (function() {
          document.querySelectorAll('.toc-link').forEach(link => {
              link.addEventListener('click', function(e) {
                  e.preventDefault();
                  document.getElementById(this.getAttribute('href').substring(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              });
          });
          const sections = Array.from(doc.querySelectorAll('h2[id^="section-"]'));
          const tocLinks = Array.from(doc.querySelectorAll('.toc-link'));
          function highlightCurrentSection() {
              const scrollPosition = window.scrollY + 100;
              let activeSection = sections.findLast(section => section.offsetTop <= scrollPosition);
              tocLinks.forEach(link => {
                  link.classList.remove('active');
                  if (activeSection && link.getAttribute('href') === '#' + activeSection.id) {
                      link.classList.add('active');
                  }
              });
          }
          let scrollTimer;
          window.addEventListener('scroll', () => {
              if (scrollTimer) clearTimeout(scrollTimer);
              scrollTimer = setTimeout(highlightCurrentSection, 50);
          }, { passive: true });
          setTimeout(highlightCurrentSection, 100);
          function updateReadingProgress() {
              const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
              const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
              const progressBar = document.querySelector('.reading-progress');
              if(progressBar) progressBar.style.width = scrolled + '%';
          }
          window.addEventListener('scroll', updateReadingProgress, { passive: true });
      })();
    `;
    doc.body.appendChild(script);
}

/**
 * Adds the reading progress bar to the document.
 */
export function addReadingProgressBar(doc: Document) {
  const progressBar = doc.createElement('div');
  progressBar.className = 'reading-progress';
  progressBar.style.width = '0%';
  doc.body.insertBefore(progressBar, doc.body.firstChild);
}

/**
 * Prepares a document for preview by replacing image paths with blob URLs.
 */
export function prepareForPreview(doc: Document, imageFiles: { originalPath: string; blobUrl: string }[]): Document {
  const previewDoc = doc.cloneNode(true) as Document;
  previewDoc.querySelectorAll('img').forEach(img => {
      const originalSrc = decodeURIComponent(img.getAttribute('src') || '');
      // Try to find a direct match first
      let imageFile = imageFiles.find(f => f.originalPath === originalSrc);
      // If not found, try to match by filename, which is more robust
      if (!imageFile) {
        const fileName = originalSrc.split('/').pop();
        imageFile = imageFiles.find(f => f.originalPath.endsWith(fileName || ''));
      }
      if (imageFile) {
          img.setAttribute('src', imageFile.blobUrl);
      }
  });
  return previewDoc;
} 