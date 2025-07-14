// SEO Editor - Enhanced Version
class SEOEditor {
    constructor() {
        this.processedDoc = null;
        this.originalFileName = 'optimized-page.html';
        this.isDragging = false;
        this.previewMode = 'desktop';
        
        this.initElements();
        this.initEventListeners();
        this.loadSavedApiKey();
    }

    initElements() {
        // File handling
        this.fileInput = document.getElementById('file-input');
        this.fileDisplay = document.querySelector('.file-input-display');
        this.fileName = document.getElementById('file-name');
        
        // SEO inputs
        this.metaDescriptionInput = document.getElementById('meta-description');
        this.descriptionCounter = document.getElementById('description-counter');
        this.keywordsInput = document.getElementById('keywords');
        this.keywordsCounter = document.getElementById('keywords-counter');
        this.canonicalUrlInput = document.getElementById('canonical-url');
        
        // Image handling
        this.imageListDiv = document.getElementById('image-list');
        
        // Buttons
        this.downloadBtn = document.getElementById('download-btn');
        this.aiOptimizeBtn = document.getElementById('ai-optimize-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        
        // Preview
        this.previewFrame = document.getElementById('preview-frame');
        this.previewMobileBtn = document.getElementById('preview-mobile');
        this.previewDesktopBtn = document.getElementById('preview-desktop');
        
        // OG Preview
        this.ogPreviewImage = document.querySelector('.og-preview-image');
        this.ogPreviewTitle = document.querySelector('.og-title');
        this.ogPreviewDescription = document.querySelector('.og-description');
        
        // Modal
        this.settingsModal = document.getElementById('settings-modal');
        this.apiKeyInput = document.getElementById('api-key-input');
        this.saveApiKeyBtn = document.getElementById('save-api-key-btn');
        this.cancelApiKeyBtn = document.getElementById('cancel-api-key-btn');
        this.toggleApiKeyBtn = document.getElementById('toggle-api-key');
        
        // AI Status
        this.aiStatus = document.getElementById('ai-status');
        this.spinner = this.aiOptimizeBtn.querySelector('.spinner');
        this.buttonText = this.aiOptimizeBtn.querySelector('.button-text');
    }

    initEventListeners() {
        // File handling
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.setupDragAndDrop();
        
        // SEO inputs
        this.metaDescriptionInput.addEventListener('input', () => this.handleMetaDescriptionInput());
        this.keywordsInput.addEventListener('input', () => this.handleKeywordsInput());
        this.canonicalUrlInput.addEventListener('input', () => this.handleCanonicalUrlInput());
        
        // Buttons
        this.downloadBtn.addEventListener('click', () => this.handleDownload());
        this.aiOptimizeBtn.addEventListener('click', () => this.handleAiOptimization());
        this.settingsBtn.addEventListener('click', () => this.showSettingsModal());
        
        // Preview toggles
        this.previewMobileBtn.addEventListener('click', () => this.setPreviewMode('mobile'));
        this.previewDesktopBtn.addEventListener('click', () => this.setPreviewMode('desktop'));
        
        // Modal
        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.cancelApiKeyBtn.addEventListener('click', () => this.hideSettingsModal());
        this.toggleApiKeyBtn.addEventListener('click', () => this.toggleApiKeyVisibility());
        
        // Close modal on outside click
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.hideSettingsModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    if (!this.downloadBtn.disabled) {
                        this.handleDownload();
                    }
                }
            }
        });
    }

    setupDragAndDrop() {
        const dropZone = this.fileDisplay.parentElement;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            });
        });
        
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('text/html')) {
                this.fileInput.files = files;
                this.handleFileSelect({ target: { files } });
            }
        });
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('text/html')) {
            this.showToast('请选择一个有效的HTML文件', 'error');
            return;
        }
        
        this.originalFileName = file.name;
        this.fileName.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const fileContent = e.target.result;
                const parser = new DOMParser();
                this.processedDoc = parser.parseFromString(fileContent, 'text/html');
                
                this.populateEditorFields();
                this.updatePreview();
                
                this.downloadBtn.disabled = false;
                this.aiOptimizeBtn.disabled = false;
                
                this.showToast('文件加载成功', 'success');
            } catch (error) {
                this.showToast('文件解析失败', 'error');
                console.error('File parsing error:', error);
            }
        };
        reader.readAsText(file);
    }

    async handleAiOptimization() {
        const apiKey = localStorage.getItem('deepseek_api_key');
        if (!apiKey) {
            this.showToast('请先设置API Key', 'warning');
            return;
        }

        if (!this.processedDoc || !this.processedDoc.body) {
            this.showToast('请先上传HTML文件', 'warning');
            return;
        }

        this.setLoadingState(true);
        this.updateAiStatus('正在分析文档内容...');

        try {
            const articleText = this.extractArticleText();
            
            const prompt = this.buildAiPrompt(articleText);
            
            this.updateAiStatus('正在生成SEO优化建议...');
            
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
            }

            const data = await response.json();
            const seoData = JSON.parse(data.choices[0].message.content);
            
            this.applyAiOptimizations(seoData);
            this.showToast('AI优化完成', 'success');
            this.updateAiStatus('优化完成！', 'success');
            
        } catch (error) {
            console.error('AI optimization error:', error);
            this.showToast(`AI优化失败: ${error.message}`, 'error');
            this.updateAiStatus('优化失败，请重试', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    extractArticleText() {
        const textElements = this.processedDoc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
        let text = '';
        
        for (const element of textElements) {
            const elementText = element.textContent.trim();
            if (elementText) {
                text += elementText + ' ';
                if (text.length > 3000) break;
            }
        }
        
        return text.trim();
    }

    buildAiPrompt(articleText) {
        return `作为一名专业的SEO内容优化师，请根据以下文章内容，为我生成精准的SEO元数据。

文章核心内容摘要:
${articleText}

任务要求:
请严格按照以下JSON格式和字符数限制进行输出。不要添加任何额外的注释或解释。

{
  "meta_description": "一个精准、吸引人的描述，严格控制在140到160个字符之间。",
  "keywords": "一个关键词列表，以英文逗号分隔，总长度严格控制在100个字符以内。"
}

请务必遵守以下规则:
1.  **Meta Description**: 长度必须在 140 到 160 个字符之间。内容需高度概括文章，并包含核心关键词。
2.  **Keywords**: 所有关键词加起来的总字符数（包括逗号和空格）绝对不能超过 100 个字符。
3.  **JSON格式**: 确保输出是严格有效的JSON对象，不包含任何其他文字。`;
    }

    getImageContext(img) {
        const parent = img.parentElement;
        const prevText = parent.previousElementSibling?.textContent?.trim() || '';
        const nextText = parent.nextElementSibling?.textContent?.trim() || '';
        return (prevText + ' ' + nextText).slice(0, 100);
    }

    smartTruncate(str, maxLength) {
        if (str.length <= maxLength) {
            return str;
        }
    
        let truncated = str.slice(0, maxLength);
        const lastSpaceIndex = truncated.lastIndexOf(' ');
    
        if (lastSpaceIndex > 0) {
            return truncated.slice(0, lastSpaceIndex);
        } else {
            return truncated;
        }
    }

    applyAiOptimizations(seoData) {
        if (seoData.meta_description) {
            this.metaDescriptionInput.value = this.smartTruncate(seoData.meta_description, 160);
            this.handleMetaDescriptionInput();
        }
        
        if (seoData.keywords) {
            this.keywordsInput.value = seoData.keywords.slice(0, 100);
            this.handleKeywordsInput();
        }
        
        this.updatePreview();
    }

    populateEditorFields() {
        if (!this.processedDoc) return;

        // Meta Description
        let description = this.getMetaTagContent('description');
        if (!description) {
            description = this.generateMetaDescription();
            this.updateMetaTag('description', description);
        }
        this.metaDescriptionInput.value = description;
        this.updateCharacterCounter(this.metaDescriptionInput, this.descriptionCounter);
        
        // Keywords
        const keywords = this.getMetaTagContent('keywords');
        this.keywordsInput.value = keywords;
        this.updateCharacterCounter(this.keywordsInput, this.keywordsCounter);

        // Canonical URL
        this.canonicalUrlInput.value = this.getLinkTagHref('canonical') || '';

        // Process images
        this.processImages();

        // Set OG tags as fallback and update preview
        this.ensureOgTagsExist();
        this.updateOgPreview();
        
        // Enable AI button
        this.aiOptimizeBtn.disabled = false;
    }

    processImages() {
        const images = this.processedDoc.querySelectorAll('img');
        this.imageListDiv.innerHTML = '';

        if (images.length === 0) {
            this.imageListDiv.innerHTML = '<p class="placeholder">未在此文件中找到图片</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        
        images.forEach((img, index) => {
            const imgSrc = img.getAttribute('src') || '';
            let altText = img.getAttribute('alt') || '';

            if (!altText.trim()) {
                altText = this.generateAltText(imgSrc);
                img.setAttribute('alt', altText);
            }
            
            const imageItem = this.createImageItem(img, index, imgSrc, altText);
            fragment.appendChild(imageItem);
        });
        
        this.imageListDiv.appendChild(fragment);
    }

    createImageItem(img, index, imgSrc, altText) {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        
        const thumbnail = document.createElement('img');
        thumbnail.src = imgSrc;
        thumbnail.alt = 'preview';
        thumbnail.loading = 'lazy';
        
        const details = document.createElement('div');
        details.className = 'image-details';
        
        const label = document.createElement('label');
        label.htmlFor = `alt-text-${index}`;
        label.innerHTML = `<code>${imgSrc.split('/').pop() || 'image'}</code>`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `alt-text-${index}`;
        input.value = altText;
        input.placeholder = '请输入描述性Alt文本';
        
        input.addEventListener('input', () => {
            img.setAttribute('alt', input.value);
            this.updatePreview();
        });
        
        details.appendChild(label);
        details.appendChild(input);
        imageItem.appendChild(thumbnail);
        imageItem.appendChild(details);
        
        return imageItem;
    }

    generateAltText(src) {
        if (!src) return '';
        const fileName = src.split('/').pop().split('.')[0];
        return fileName.replace(/[-_]/g, ' ').trim();
    }

    generateMetaDescription() {
        const textElements = this.processedDoc.body.querySelectorAll('p, h1, h2');
        let description = '';
        
        for (const element of textElements) {
            const text = element.textContent.trim();
            if (text && text.length > 20) {
                description = text;
                break;
            }
        }
        
        return description.slice(0, 160);
    }

    ensureOgTagsExist() {
        const ogTags = {
            'og:title': 'GlobalGPT Free AI Tools : All-in-One Access to ChatGPT',
            'og:description': 'Explore GlobalGPT\'s free AI models and tools. Enjoy ChatGPT and top models for coding, content creation, and multimedia generation—no account switching needed.',
            'og:image': 'https://www.glbgpt.com/og-image.jpg',
            'og:type': 'website'
        };

        Object.entries(ogTags).forEach(([property, content]) => {
            if (!this.getMetaTagContent(property, 'property')) {
                this.updateMetaTag(property, content, 'property');
            }
        });
    }

    updateOgPreview() {
        if (!this.processedDoc) return;

        const title = this.getMetaTagContent('og:title', 'property');
        const description = this.getMetaTagContent('og:description', 'property');
        const imageUrl = this.getMetaTagContent('og:image', 'property');

        if (this.ogPreviewTitle) {
            this.ogPreviewTitle.textContent = title || 'OG Title not found';
        }
        if (this.ogPreviewDescription) {
            this.ogPreviewDescription.textContent = description || 'OG Description not found';
        }
        if (this.ogPreviewImage) {
            this.ogPreviewImage.src = imageUrl || 'https://via.placeholder.com/1200x630/cccccc/ffffff?text=Image+not+found';
            this.ogPreviewImage.alt = title ? `OG Preview for ${title}` : 'OG Preview Image';
        }
    }

    handleMetaDescriptionInput() {
        this.updateCharacterCounter(this.metaDescriptionInput, this.descriptionCounter);
        this.updateMetaTag('description', this.metaDescriptionInput.value);
        this.updatePreview();
    }

    handleKeywordsInput() {
        this.updateCharacterCounter(this.keywordsInput, this.keywordsCounter);
        this.updateMetaTag('keywords', this.keywordsInput.value);
        this.updatePreview();
    }

    handleCanonicalUrlInput() {
        const url = this.canonicalUrlInput.value;
        if (url) {
            this.updateLinkTag('canonical', url);
            this.updatePreview();
        }
    }

    updateMetaTag(name, content, attribute = 'name') {
        if (!this.processedDoc) return;
        
        let meta = this.processedDoc.querySelector(`meta[${attribute}="${name}"]`);
        if (!meta) {
            meta = this.processedDoc.createElement('meta');
            meta.setAttribute(attribute, name);
            this.processedDoc.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

    updateLinkTag(rel, href) {
        if (!this.processedDoc) return;
        
        let link = this.processedDoc.querySelector(`link[rel="${rel}"]`);
        if (!link) {
            link = this.processedDoc.createElement('link');
            link.setAttribute('rel', rel);
            this.processedDoc.head.appendChild(link);
        }
        link.setAttribute('href', href);
    }

    getMetaTagContent(name, attribute = 'name') {
        const meta = this.processedDoc?.querySelector(`meta[${attribute}="${name}"]`);
        return meta ? meta.getAttribute('content') : '';
    }

    getLinkTagHref(rel) {
        const link = this.processedDoc?.querySelector(`link[rel="${rel}"]`);
        return link ? link.getAttribute('href') : '';
    }

    updatePreview() {
        if (!this.processedDoc) return;
        
        // Add viewport meta for mobile preview
        if (!this.processedDoc.querySelector('meta[name="viewport"]')) {
            const viewport = this.processedDoc.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0';
            this.processedDoc.head.appendChild(viewport);
        }
        
        const serializedHtml = new XMLSerializer().serializeToString(this.processedDoc);
        this.previewFrame.srcdoc = serializedHtml;
    }

    setPreviewMode(mode) {
        this.previewMode = mode;
        
        // Update button states
        this.previewMobileBtn.classList.toggle('active', mode === 'mobile');
        this.previewDesktopBtn.classList.toggle('active', mode === 'desktop');
        
        // Update preview frame class
        this.previewFrame.parentElement.className = `preview-container ${mode}-preview`;
    }

    handleDownload() {
        if (!this.processedDoc) return;
        
        // Ensure all changes are applied
        this.ensureOgTagsExist();
        
        // Clean up any editor-specific additions
        const editorStyles = this.processedDoc.getElementById('seo-editor-styles');
        if (editorStyles) {
            editorStyles.remove();
        }
        
        const finalHtml = '<!DOCTYPE html>\n' + this.processedDoc.documentElement.outerHTML;
        const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.originalFileName.replace(/(\.[\w\d_-]+)$/i, '_seo_optimized$1');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('文件下载成功', 'success');
    }

    updateCharacterCounter(inputElement, counterElement) {
        const current = inputElement.value.length;
        const max = parseInt(inputElement.maxLength);
        const currentSpan = counterElement.querySelector('.current');
        const maxSpan = counterElement.querySelector('.max');
        
        currentSpan.textContent = current;
        
        // Add warning color when approaching limit
        if (current > max * 0.9) {
            counterElement.classList.add('warning');
        } else {
            counterElement.classList.remove('warning');
        }
    }

    // Settings Modal Methods
    showSettingsModal() {
        this.settingsModal.style.display = 'flex';
        this.apiKeyInput.value = localStorage.getItem('deepseek_api_key') || '';
        this.apiKeyInput.focus();
    }

    hideSettingsModal() {
        this.settingsModal.style.display = 'none';
    }

    saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('deepseek_api_key', apiKey);
            this.showToast('API Key 保存成功', 'success');
            this.hideSettingsModal();
        } else {
            this.showToast('请输入有效的API Key', 'error');
        }
    }

    loadSavedApiKey() {
        const savedKey = localStorage.getItem('deepseek_api_key');
        if (savedKey) {
            this.apiKeyInput.value = savedKey;
        }
    }

    toggleApiKeyVisibility() {
        const type = this.apiKeyInput.type === 'password' ? 'text' : 'password';
        this.apiKeyInput.type = type;
        this.toggleApiKeyBtn.classList.toggle('show-password');
    }

    // Loading States
    setLoadingState(isLoading) {
        this.aiOptimizeBtn.disabled = isLoading;
        this.aiOptimizeBtn.setAttribute('aria-busy', isLoading);
        this.spinner.hidden = !isLoading;
        this.buttonText.textContent = isLoading ? 'AI 优化中...' : 'AI 一键优化';
        
        if (!isLoading) {
            setTimeout(() => {
                this.aiStatus.hidden = true;
            }, 3000);
        }
    }

    updateAiStatus(message, type = 'info') {
        this.aiStatus.textContent = message;
        this.aiStatus.className = `status-message status-${type}`;
        this.aiStatus.hidden = false;
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toast-container');
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize the editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.seoEditor = new SEOEditor();
});

// Service Worker Registration (for PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            console.log('Service Worker registration failed');
        });
    });
}