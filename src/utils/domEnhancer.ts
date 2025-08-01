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
      max-width: 720px;
      margin: 0 auto;
      position: relative;
  }
  
  .main-content { 
      min-width: 0;
  }
  
  .toc-container { 
      position: fixed;
      top: 150px;
      left: calc(50% - 360px - 60px - 260px);
      width: 260px; 
      max-height: calc(100vh - 180px); 
      overflow-y: auto; 
      z-index: 1000;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
  }
  
  /* 简化滚动条 */
  .toc-container::-webkit-scrollbar {
      width: 4px;
  }
  
  .toc-container::-webkit-scrollbar-track {
      background: transparent;
  }
  
  .toc-container::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
  }
  
  @media (max-width: 1080px) {
      .toc-container {
          display: none;
      }
  }
  
  .toc-title { 
      margin: 0 0 20px 0; 
      font-size: 13px; 
      font-weight: 600; 
      letter-spacing: 0.05em; 
      text-transform: uppercase; 
      color: #6b7280;
  }
  
  .toc-list { 
      list-style: none; 
      padding: 0; 
      margin: 0; 
  }
  
  /* 移除所有伪元素和列表样式 */
  .toc-list::before,
  .toc-list::after {
      display: none !important;
  }
  
  .toc-list li { 
      margin: 0;
      padding: 0;
      position: relative;
      list-style: none !important;
  }
  
  .toc-list li::before,
  .toc-list li::after {
      display: none !important;
  }
  
  .toc-link { 
    display: block; 
    color: #4b5563; 
    text-decoration: none; 
    padding: 10px 8px;
    margin: 0 -8px;
    font-size: 14px; 
    line-height: 1.6;
    transition: all 0.15s ease;
    /* 允许自然换行 */
    word-wrap: break-word;
    word-break: break-word;
    white-space: normal;
    cursor: pointer;
    border-radius: 6px;
}

/* 悬停效果 */
.toc-link:hover { 
    color: #111827;
    background-color: rgba(0, 0, 0, 0.04);
}

/* 点击效果 */
.toc-link:active {
    background-color: rgba(37, 99, 235, 0.1);
    color: #2563eb;
}

/* 当前阅读位置 - 用户点击后保持的状态 */
.toc-link.current {
    background-color: rgba(37, 99, 235, 0.1);
    color: #2563eb;
    font-weight: 500;
}
  
  /* 章节标题样式 */
  h2[id^="section-"] { 
      scroll-margin-top: 80px; 
      position: relative;
  }
  
  /* 阅读进度条 */
  .reading-progress { 
      position: fixed; 
      top: 0; 
      left: 0; 
      height: 2px; 
      background: #2563eb;
      z-index: 1000; 
      transition: width 0.2s ease-out;
  }
    `;
    doc.head.appendChild(style);
  }

  function injectTOCScript(doc: Document) {
    const script = doc.createElement('script');
    script.textContent = `
      (function() {
          // 平滑滚动功能
          document.querySelectorAll('.toc-link').forEach(link => {
              link.addEventListener('click', function(e) {
                  e.preventDefault();
                  
                  // 移除所有当前标记
                  document.querySelectorAll('.toc-link').forEach(l => {
                      l.classList.remove('current');
                  });
                  
                  // 给点击的链接添加当前标记
                  this.classList.add('current');
                  
                  // 滚动到对应位置
                  document.getElementById(this.getAttribute('href').substring(1))?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                  });
              });
          });
          
          const sections = Array.from(document.querySelectorAll('h2[id^="section-"]'));
          const tocContainer = document.querySelector('.toc-container');
          
          // 查找 Relevant Resources 部分
          function findRelevantResourcesSection() {
              const h2Elements = document.querySelectorAll('h2');
              for (let h2 of h2Elements) {
                  const text = h2.textContent.toLowerCase();
                  if (text.includes('relevant resources') || 
                      text.includes('related resources') || 
                      text.includes('相关资源')) {
                      return h2;
                  }
              }
              return sections[sections.length - 1];
          }
          
          // 动态定位目录
          function adjustTocPosition() {
              if (!tocContainer) return;
              
              const relevantResourcesSection = findRelevantResourcesSection();
              if (!relevantResourcesSection) return;
              
              const scrollY = window.scrollY;
              const windowHeight = window.innerHeight;
              const tocHeight = tocContainer.offsetHeight;
              const articleWrapper = document.querySelector('.article-wrapper');
              
              const sectionRect = relevantResourcesSection.getBoundingClientRect();
              const sectionBottom = sectionRect.bottom + scrollY;
              const stopPosition = sectionBottom - tocHeight;
              
              if (scrollY + 150 + tocHeight > stopPosition) {
                  tocContainer.classList.add('pinned-to-bottom');
                  if (articleWrapper) {
                      tocContainer.style.position = 'absolute';
                      tocContainer.style.top = (stopPosition - articleWrapper.offsetTop) + 'px';
                      tocContainer.style.left = '-320px';
                  }
              } else {
                  tocContainer.classList.remove('pinned-to-bottom');
                  tocContainer.style.position = 'fixed';
                  tocContainer.style.top = '150px';
                  tocContainer.style.left = 'calc(50% - 360px - 60px - 260px)';
              }
          }
          
          // 更新阅读进度
          function updateReadingProgress() {
              const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
              const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
              const progressBar = document.querySelector('.reading-progress');
              if(progressBar) progressBar.style.width = scrolled + '%';
          }
          
          // 综合滚动处理
          let scrollTimer;
          function handleScroll() {
              if (scrollTimer) clearTimeout(scrollTimer);
              scrollTimer = setTimeout(() => {
                  adjustTocPosition();
                  updateReadingProgress();
              }, 50);
          }
          
          // 监听滚动事件
          window.addEventListener('scroll', handleScroll, { passive: true });
          window.addEventListener('resize', adjustTocPosition, { passive: true });
          
          // 初始化
          setTimeout(() => {
              adjustTocPosition();
          }, 100);
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

/**
 * Converts YouTube embed URLs to iframe elements
 */
export function convertYouTubeLinksToEmbeds(doc: Document) {
    if (!doc) return;
    
    // 查找所有包含 YouTube embed 链接的文本节点
    const walker = document.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const nodesToReplace: { node: Node; parent: Node; embedUrl: string }[] = [];
    
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.textContent || '';
      
      // 匹配 YouTube embed URL 的正则表达式
      const youtubeEmbedRegex = /https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]+(\?[^\s]*)?/g;
      const matches = text.match(youtubeEmbedRegex);
      
      if (matches && node.parentNode) {
        matches.forEach(match => {
          nodesToReplace.push({
            node: node,
            parent: node.parentNode!,
            embedUrl: match
          });
        });
      }
    }
    
    // 替换找到的链接为 iframe
    nodesToReplace.forEach(({ node, parent, embedUrl }) => {
      const text = node.textContent || '';
      
      // 创建一个容器来处理混合内容
      const container = doc.createElement('div');
      
      // 分割文本，保留非链接部分
      const parts = text.split(embedUrl);
      
      // 添加第一部分文本
      if (parts[0]) {
        container.appendChild(doc.createTextNode(parts[0]));
      }
      
      // 创建 iframe 容器
      const iframeWrapper = doc.createElement('div');
      iframeWrapper.style.cssText = 'position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 20px 0;';
      
      // 创建 iframe
      const iframe = doc.createElement('iframe');
      iframe.src = embedUrl;
      iframe.setAttribute('title', 'YouTube video player');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
      
      iframeWrapper.appendChild(iframe);
      container.appendChild(iframeWrapper);
      
      // 添加剩余文本
      if (parts[1]) {
        container.appendChild(doc.createTextNode(parts[1]));
      }
      
      // 替换原始节点
      parent.replaceChild(container, node);
    });
    
    // 处理单独段落中的链接（更常见的情况）
    const paragraphs = doc.querySelectorAll('p');
    paragraphs.forEach(p => {
      const text = p.textContent || '';
      const youtubeEmbedRegex = /^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]+(\?[^\s]*)?$/;
      
      if (youtubeEmbedRegex.test(text.trim())) {
        const embedUrl = text.trim();
        
        // 创建响应式容器
        const iframeWrapper = doc.createElement('div');
        iframeWrapper.style.cssText = 'position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 20px 0;';
        
        // 创建 iframe
        const iframe = doc.createElement('iframe');
        iframe.src = embedUrl;
        iframe.setAttribute('title', 'YouTube video player');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
        
        iframeWrapper.appendChild(iframe);
        
        // 替换段落
        p.parentNode?.replaceChild(iframeWrapper, p);
      }
    });
  }