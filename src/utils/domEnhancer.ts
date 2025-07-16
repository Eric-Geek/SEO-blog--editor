// src/utils/domEnhancer.ts

/**
 * Removes unwanted CSS rules from Notion's default export styles.
 */
export function removeUnwantedCss(doc: Document) {
  if (!doc) return;
  const styleTags = doc.querySelectorAll('style');
  styleTags.forEach(styleTag => {
      let cssText = styleTag.innerHTML;
      
      // 要删除的CSS规则列表
      const unwantedRules = [
          'margin: 2em auto',
          'max-width: 900px',
          'color: rgb(55, 53, 47)'  // 可以根据需要添加更多规则
      ];
      
      // 处理所有 body 相关的样式
      // 使用更宽松的正则表达式来匹配各种 body 选择器格式
      const bodyPatterns = [
          /body\s*\{[^}]*\}/gs,           // 匹配 body { ... }
          /}body\s*\{[^}]*\}/gs,          // 匹配 }body { ... } (当body块紧跟在其他块后面)
          /@media[^{]*\{[^}]*body\s*\{[^}]*\}[^}]*\}/gs  // 匹配 @media 中的 body
      ];
      
      // 收集所有 body 规则（去重）
      const validBodyRules = new Set<string>();
      
      bodyPatterns.forEach(pattern => {
          const matches = cssText.match(pattern) || [];
          matches.forEach(match => {
              // 提取 body { ... } 中的内容
              const bodyContent = match.match(/body\s*\{([^}]*)\}/s)?.[1] || '';
              const rules = bodyContent.split(';');
              
              rules.forEach(rule => {
                  const trimmedRule = rule.trim();
                  if (trimmedRule) {
                      // 检查是否是不想要的规则
                      const isUnwanted = unwantedRules.some(unwanted => 
                          trimmedRule.includes(unwanted)
                      );
                      if (!isUnwanted) {
                          validBodyRules.add(trimmedRule);
                      }
                  }
              });
          });
      });
      
      // 删除所有原有的 body 块
      bodyPatterns.forEach(pattern => {
          cssText = cssText.replace(pattern, (match) => {
              // 如果是 @media 块，保留 @media 结构但清空 body 内容
              if (match.includes('@media')) {
                  return match.replace(/body\s*\{[^}]*\}/s, '');
              }
              return '';
          });
      });
      
      // 如果有有效的 body 规则，在开头插入一个干净的 body 块
      if (validBodyRules.size > 0) {
          const cleanBodyBlock = `body {\n\t${Array.from(validBodyRules).join(';\n\t')};\n}\n\n`;
          // 在第一个规则之前插入
          const firstRuleMatch = cssText.match(/^\s*([a-zA-Z\.\#\*\[]|@)/m);
          if (firstRuleMatch && firstRuleMatch.index !== undefined) {
              cssText = cssText.slice(0, firstRuleMatch.index) + cleanBodyBlock + cssText.slice(firstRuleMatch.index);
          } else {
              cssText = cleanBodyBlock + cssText;
          }
      }
      
      // 清理多余的空行和格式问题
      cssText = cssText
          .replace(/\n{3,}/g, '\n\n')  // 将连续3个或更多换行替换为2个
          .replace(/}\s*}/g, '}\n}')   // 修复紧贴的大括号
          .replace(/{\s*}/g, '{}')      // 清理空的样式块
          .trim();
      
      styleTag.innerHTML = cssText;
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
    .article-wrapper { display: flex; max-width: 1280px; margin: 0 auto; padding: 40px 20px; gap: 60px; position: relative; }
    .toc-container { position: sticky; top: 150px; width: 260px; max-width: 260px; min-width: 200px; height: fit-content; max-height: calc(100vh - 180px); overflow-y: auto; overflow-x: hidden; z-index: 10; }
    .toc-title { margin: 0 0 24px 0; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #6b7280; padding-left: 16px; }
    .toc-list { list-style: none; padding: 0; margin: 0; }
    .toc-list li { margin: 0; position: relative; }
    .toc-link { display: block; color: #6b7280; text-decoration: none; padding: 10px 16px; margin: 4px 0; font-size: 14px; line-height: 1.6; border-left: 3px solid transparent; border-radius: 6px; transition: all 0.3s ease-in-out; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .toc-link:hover { color: #111827; background-color: #f3f4f6; transform: translateX(4px); }
    .toc-link.active { /* No special styling */ }
    .main-content { flex: 1; min-width: 0; max-width: 720px; }
    h2[id^="section-"] { scroll-margin-top: 80px; position: relative; }
    h2[id^="section-"]:hover::before { content: '#'; position: absolute; left: -24px; color: #6b7280; font-weight: normal; }
    .toc-container::-webkit-scrollbar { width: 4px; }
    .toc-container::-webkit-scrollbar-track { background: transparent; }
    .toc-container::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
    .toc-container::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
    @keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
    .toc-container { animation: fadeIn 0.5s ease; }
    @media (max-width: 1024px) { .article-wrapper { gap: 40px; } .toc-container { width: 220px; min-width: 180px; } }
    @media (max-width: 768px) { .toc-container { display: none; } .article-wrapper { gap: 0; } .main-content { max-width: 100%; } }
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