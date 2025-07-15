document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const fileInput = document.getElementById('file-input');
    const metaDescriptionInput = document.getElementById('meta-description');
    const descriptionCounter = document.getElementById('description-counter');
    const keywordsInput = document.getElementById('keywords');
    const keywordsCounter = document.getElementById('keywords-counter');
    const canonicalUrlInput = document.getElementById('canonical-url');
    const ogTitleInput = document.getElementById('og-title');
    const ogDescriptionInput = document.getElementById('og-description');
    const ogImageInput = document.getElementById('og-image');
    const imageListDiv = document.getElementById('image-list');
    const downloadBtn = document.getElementById('download-btn');
    const previewFrame = document.getElementById('preview-frame');
    
    // AI and Settings elements
    const settingsBtn = document.getElementById('settings-btn');
    const aiProviderSelect = document.getElementById('ai-provider-select');
    const aiOptimizeBtn = document.getElementById('ai-optimize-btn');
    const settingsModal = document.getElementById('settings-modal');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const cancelApiKeyBtn = document.getElementById('cancel-api-key-btn');
    const spinner = aiOptimizeBtn.querySelector('.spinner');

    const apiKeyInputs = {
        deepseek: document.getElementById('deepseek-api-key-input'),
        openai: document.getElementById('openai-api-key-input'),
        gemini: document.getElementById('gemini-api-key-input'),
        moonshot: document.getElementById('moonshot-api-key-input'),
    };
    
    // New modal elements
    const modalNavButtons = document.querySelectorAll('.modal-nav .nav-button');
    const apiKeyGroups = document.querySelectorAll('.modal-main-content .api-key-group');

    // --- App State ---
    let originalZip = null;
    let processedDoc = null;
    let htmlFileInfo = { name: '', content: '' };
    let imageFiles = new Map(); // Map<originalPath, blobUrl>
    let imageFolder = '';

    // --- Event Listeners ---
    fileInput.addEventListener('change', handleFileSelect);
    downloadBtn.addEventListener('click', handleDownload);

    // AI and Settings Listeners
    aiOptimizeBtn.addEventListener('click', handleAiOptimization);
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
        // Load saved keys into modal
        for (const provider in apiKeyInputs) {
            apiKeyInputs[provider].value = localStorage.getItem(`${provider}_api_key`) || '';
        }
        // Set the first tab as active by default
        showApiKeyGroup('deepseek'); 
    });
    
    cancelApiKeyBtn.addEventListener('click', () => settingsModal.style.display = 'none');
    
    saveApiKeyBtn.addEventListener('click', () => {
        // Save all keys from modal to localStorage
        for (const provider in apiKeyInputs) {
            if (apiKeyInputs[provider].value) { // Only save if there is a value
                localStorage.setItem(`${provider}_api_key`, apiKeyInputs[provider].value);
            } else {
                localStorage.removeItem(`${provider}_api_key`); // Remove if empty
            }
        }
        settingsModal.style.display = 'none';
        alert('API Keys 已更新。');
    });

    modalNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const provider = button.dataset.provider;
            showApiKeyGroup(provider);
        });
    });
    
    function showApiKeyGroup(provider) {
        modalNavButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.provider === provider);
        });
        apiKeyGroups.forEach(group => {
            group.classList.toggle('active', group.dataset.providerContent === provider);
        });
    }

    // Add listeners to SEO inputs to update the document and preview in real-time
    metaDescriptionInput.addEventListener('input', () => {
        updateCharacterCounter(metaDescriptionInput, descriptionCounter, 160);
        updateMetaTag('description', metaDescriptionInput.value);
        updatePreview();
    });
    keywordsInput.addEventListener('input', () => {
        updateCharacterCounter(keywordsInput, keywordsCounter, 100);
        updateMetaTag('keywords', keywordsInput.value);
        updatePreview();
    });
    canonicalUrlInput.addEventListener('input', () => {
        updateLinkTag('canonical', canonicalUrlInput.value);
        updatePreview();
    });
    ogTitleInput.addEventListener('input', () => {
        updateMetaTag('og:title', ogTitleInput.value, 'property');
        updatePreview();
    });
    ogDescriptionInput.addEventListener('input', () => {
        updateMetaTag('og:description', ogDescriptionInput.value, 'property');
        updatePreview();
    });
    ogImageInput.addEventListener('input', () => {
        updateMetaTag('og:image', ogImageInput.value, 'property');
        updatePreview();
    });

    // --- Main Functions ---

    function removeUnwantedCss(doc) {
        if (!doc) return;
        const styleTags = doc.querySelectorAll('style');
        styleTags.forEach(styleTag => {
            let cssText = styleTag.innerHTML;
            // This regex finds all `body {...}` blocks.
            const bodyRegex = /(body\s*\{)([\s\S]*?)(\})/g;
    
            cssText = cssText.replace(bodyRegex, (match, opening, content, closing) => {
                const lines = content.split('\n');
                const newLines = lines.filter(line => {
                    const trimmedLine = line.trim();
                    const isMarginLine = trimmedLine === 'margin: 2em auto;';
                    const isMaxWidthLine = trimmedLine === 'max-width: 900px;';
                    return !isMarginLine && !isMaxWidthLine;
                });
                let newContent = newLines.join('\n');
                return opening + newContent + closing;
            });
            styleTag.innerHTML = cssText;
        });
    }

    async function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file || !file.name.endsWith('.zip')) {
            alert('请选择一个有效的 ZIP 文件。');
            return;
        }

        resetState();
        
        try {
            originalZip = await JSZip.loadAsync(file);
            const filePromises = [];

            originalZip.forEach((relativePath, zipEntry) => {
                if (zipEntry.name.toLowerCase().endsWith('.html')) {
                    htmlFileInfo.name = zipEntry.name;
                    filePromises.push(zipEntry.async('string').then(content => {
                        htmlFileInfo.content = content;
                    }));
                } else if (!zipEntry.dir && (zipEntry.name.toLowerCase().includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(zipEntry.name))) {
                    if (!imageFolder) {
                        const pathParts = zipEntry.name.split('/');
                        if (pathParts.length > 1) {
                            imageFolder = pathParts[0] + '/';
                        }
                    }
                    filePromises.push(zipEntry.async('blob').then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        imageFiles.set(relativePath, blobUrl);
                    }));
                }
            });
            
            await Promise.all(filePromises);

            if (!htmlFileInfo.content) {
                throw new Error('ZIP包中未找到HTML文件。');
            }

            const parser = new DOMParser();
            processedDoc = parser.parseFromString(htmlFileInfo.content, 'text/html');
            
            // Remove specific CSS rules as requested
            removeUnwantedCss(processedDoc);

            // Replace relative image paths with blob URLs for preview
            processedDoc.querySelectorAll('img').forEach(img => {
                const originalSrc = decodeURIComponent(img.getAttribute('src'));
                if (imageFiles.has(originalSrc)) {
                    img.setAttribute('src', imageFiles.get(originalSrc));
                }
            });

            populateEditorFields();
            updatePreview();
            downloadBtn.disabled = false;
            aiOptimizeBtn.disabled = false; // Enable AI button

        } catch (error) {
            console.error('处理ZIP文件时出错:', error);
            alert(`处理ZIP文件失败: ${error.message}`);
            resetState();
        }
    }
    
    async function handleAiOptimization() {
        const provider = aiProviderSelect.value;
        const apiKey = localStorage.getItem(`${provider}_api_key`);

        if (!apiKey) {
            alert(`请先在设置中输入您的 ${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key。`);
            settingsModal.style.display = 'flex';
            return;
        }

        if (!processedDoc || !processedDoc.body) {
            alert('请先上传一个ZIP文件。');
            return;
        }

        toggleLoading(true);

        const articleText = processedDoc.body.innerText.trim().substring(0, 4000);
        const prompt = `
            请你扮演一位专业的SEO专家。基于以下HTML文章内容，请为我生成优化的SEO元数据。
            请严格按照以下JSON格式返回，不要包含任何额外的解释或代码块标记。

            {
              "meta_description": "一段140到160个字符的文章摘要，内容要吸引人点击。",
              "keywords": "一个包含5-7个最相关关键词的字符串，用英文逗号分隔。"
            }

            文章内容如下:
            ---
            ${articleText}
            ---
        `;

        try {
            let seoData;
            switch (provider) {
                case 'deepseek':
                case 'openai':
                case 'moonshot':
                    seoData = await callOpenAICompatibleAPI(provider, apiKey, prompt);
                    break;
                case 'gemini':
                    seoData = await callGeminiAPI(apiKey, prompt);
                    break;
                default:
                    throw new Error('不支持的AI提供商');
            }

            // Populate fields with AI data
            metaDescriptionInput.value = (seoData.meta_description || '').slice(0, 160);
            keywordsInput.value = seoData.keywords || '';
            
            // Trigger updates to reflect changes
            metaDescriptionInput.dispatchEvent(new Event('input'));
            keywordsInput.dispatchEvent(new Event('input'));
            updatePreview();

        } catch (error) {
            console.error(`${provider} AI优化失败:`, error);
            alert(`AI优化失败: ${error.message}`);
        } finally {
            toggleLoading(false);
        }
    }

    // --- API Call Functions ---

    async function callOpenAICompatibleAPI(provider, apiKey, prompt) {
        const apiDetails = {
            openai: {
                url: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-3.5-turbo'
            },
            deepseek: {
                url: 'https://api.deepseek.com/chat/completions',
                model: 'deepseek-chat'
            },
            moonshot: {
                url: 'https://api.moonshot.cn/v1/chat/completions',
                model: 'moonshot-v1-8k'
            }
        };

        const { url, model } = apiDetails[provider];

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ "role": "user", "content": prompt }],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API 请求失败: ${response.status} ${response.statusText}. 详情: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    }

    async function callGeminiAPI(apiKey, prompt) {
        // Gemini API has a different request structure
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                response_mime_type: "application/json",
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API 请求失败: ${response.status} ${response.statusText}. 详情: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        // The response structure for Gemini is also different
        const content = data.candidates[0].content.parts[0].text;
        return JSON.parse(content);
    }


    function populateEditorFields() {
        if (!processedDoc) return;

        // Meta Description
        metaDescriptionInput.value = getMetaTagContent('description');
        updateCharacterCounter(metaDescriptionInput, descriptionCounter, 160);
        
        // Keywords
        keywordsInput.value = getMetaTagContent('keywords');
        updateCharacterCounter(keywordsInput, keywordsCounter, 100);

        // Canonical URL
        canonicalUrlInput.value = getLinkTagHref('canonical') || '';

        // Social Media Meta Tags (Open Graph)
        const defaultOgData = {
            'og:title': 'GlobalGPT Free AI Tools : All-in-One Access to ChatGPT',
            'og:description': "Explore GlobalGPT's free AI models and tools. Enjoy ChatGPT and top models for coding, content creation, and multimedia generation—no account switching needed.",
            'og:image': 'https://www.glbgpt.com/home'
        };

        const ogInputs = {
            'og:title': ogTitleInput,
            'og:description': ogDescriptionInput,
            'og:image': ogImageInput
        };
        
        for (const [property, inputElement] of Object.entries(ogInputs)) {
            let content = getMetaTagContent(property, 'property');
            if (!content) {
                content = defaultOgData[property];
                updateMetaTag(property, content, 'property');
            }
            inputElement.value = content;
            inputElement.disabled = false;
        }

        // Image Alt Text
        processImages();
    }

    function processImages() {
        imageListDiv.innerHTML = '';
        if (imageFiles.size === 0) {
            imageListDiv.innerHTML = '<p class="placeholder">未在此ZIP包中找到图片。</p>';
            return;
        }

        let index = 0;
        for (const [originalPath, blobUrl] of imageFiles.entries()) {
            // Find corresponding img tag in the doc to get existing alt text
            const imgInDoc = processedDoc.querySelector(`img[src="${blobUrl}"]`);
            let altText = (imgInDoc ? imgInDoc.getAttribute('alt') : '') || generateAltText(originalPath);

            // Bug Fix: Immediately set the generated alt text back to the document model.
            if (imgInDoc) {
                imgInDoc.setAttribute('alt', altText);
            }

            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${blobUrl}" alt="preview">
                <div class="image-details">
                    <label for="alt-text-${index}"><code>${originalPath.split('/').pop()}</code></label>
                    <input type="text" id="alt-text-${index}" value="${altText}" data-original-path="${originalPath}">
                </div>
            `;
            imageListDiv.appendChild(imageItem);
            
            const altInput = imageItem.querySelector(`#alt-text-${index}`);
            altInput.addEventListener('input', () => {
                if (imgInDoc) {
                    imgInDoc.setAttribute('alt', altInput.value);
                    // No need to call updatePreview() here as alt text changes don't show in preview
                }
            });
            index++;
        }
    }
    
    async function handleDownload() {
        if (!processedDoc || !originalZip) return;

        // Final update for alt texts from inputs to the doc
        document.querySelectorAll('#image-list input[data-original-path]').forEach(input => {
            const blobUrl = input.closest('.image-item').querySelector('img').src;
            const imgInDoc = processedDoc.querySelector(`img[src="${blobUrl}"]`);
            if (imgInDoc) {
                imgInDoc.setAttribute('alt', input.value);
            }
        });

        // Revert blob URLs back to original relative paths before zipping
        processedDoc.querySelectorAll('img').forEach(img => {
            const blobSrc = img.getAttribute('src');
            for (const [originalPath, blobUrl] of imageFiles.entries()) {
                if (blobUrl === blobSrc) {
                    img.setAttribute('src', encodeURIComponent(originalPath).replace(/%2F/g, '/'));
                    break;
                }
            }
        });
        
        // --- Create New Zip ---
        const newZip = new JSZip();

        // Determine the filename from Canonical URL or fallback to OG Title
        let slugBase = '';
        const canonicalUrl = canonicalUrlInput.value.trim();

        if (canonicalUrl) {
            try {
                const url = new URL(canonicalUrl);
                // Get pathname and remove leading/trailing slashes
                const pathname = url.pathname.replace(/^\/|\/$/g, '');
                if (pathname) {
                    // Get the last part of the path
                    slugBase = pathname.substring(pathname.lastIndexOf('/') + 1);
                }
            } catch (e) {
                // The input might not be a full, valid URL, so treat as a string
                const urlString = canonicalUrl.replace(/\/$/g, ''); // remove trailing slash
                slugBase = urlString.substring(urlString.lastIndexOf('/') + 1);
            }
        }
        
        // Fallback to OG title if slug base is still empty
        if (!slugBase) {
            slugBase = ogTitleInput.value || 'untitled';
        }

        const finalSlug = generateSlug(slugBase);
        
        // 1. Add modified HTML
        const finalHtml = '<!DOCTYPE html>\n' + processedDoc.documentElement.outerHTML;
        newZip.file(`index.html`, finalHtml);

        // 2. Add images from original zip
        const imageAddPromises = [];
        for (const originalPath of imageFiles.keys()) {
            const file = originalZip.file(originalPath);
            if (file) {
                imageAddPromises.push(
                    file.async('uint8array').then(data => {
                        newZip.file(originalPath, data);
                    })
                );
            }
        }

        await Promise.all(imageAddPromises);

        // 3. Generate and Download
        const zipBlob = await newZip.generateAsync({ type: 'blob' });
        const downloadUrl = URL.createObjectURL(zipBlob);
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${finalSlug}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
    }

    // --- Helper & Utility Functions ---

    function resetState() {
        // Revoke old blob URLs
        for (const url of imageFiles.values()) {
            URL.revokeObjectURL(url);
        }
        originalZip = null;
        processedDoc = null;
        htmlFileInfo = { name: '', content: '' };
        imageFiles.clear();
        imageFolder = '';
        imageListDiv.innerHTML = '<p class="placeholder">上传 ZIP 包后，这里会显示图片列表以供编辑。</p>';
        previewFrame.srcdoc = '';
        downloadBtn.disabled = true;
        aiOptimizeBtn.disabled = true; // Disable AI button on reset
    }

    function generateSlug(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }

    function updateCharacterCounter(inputElement, counterElement, max) {
        const currentLength = inputElement.value.length;
        counterElement.textContent = `${currentLength} / ${max}`;
    }

    function updateMetaTag(name, content, attribute = 'name') {
        if (!processedDoc) return;
        let meta = processedDoc.head.querySelector(`meta[${attribute}="${name}"]`);
        if (!meta) {
            meta = processedDoc.createElement('meta');
            meta.setAttribute(attribute, name);
            processedDoc.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }
    
    function updateLinkTag(rel, href) {
        if (!processedDoc) return;
        let link = processedDoc.head.querySelector(`link[rel="${rel}"]`);
        if (!link) {
            link = processedDoc.createElement('link');
            link.setAttribute('rel', rel);
            processedDoc.head.appendChild(link);
        }
        link.setAttribute('href', href);
    }

    function updatePreview() {
        if (processedDoc) {
            const serializedHtml = new XMLSerializer().serializeToString(processedDoc);
            previewFrame.srcdoc = serializedHtml;
        }
    }

    function getMetaTagContent(name, attribute = 'name') {
        if (!processedDoc) return '';
        const meta = processedDoc.querySelector(`meta[${attribute}="${name}"]`);
        return meta ? meta.getAttribute('content') : '';
    }
    
    function getLinkTagHref(rel) {
        if (!processedDoc) return '';
        const link = processedDoc.querySelector(`link[rel="${rel}"]`);
        return link ? link.getAttribute('href') : '';
    }

    function generateAltText(src) {
        if (!src) return '';
        try {
            const fileName = decodeURIComponent(src).split('/').pop().split('.').slice(0, -1).join('.');
            return fileName.replace(/[-_]/g, ' ').trim();
        } catch (e) {
            return '';
        }
    }

    function toggleLoading(isLoading) {
        if (isLoading) {
            spinner.style.display = 'block';
            aiOptimizeBtn.disabled = true;
            aiOptimizeBtn.querySelector('.ai-icon').style.display = 'none';
        } else {
            spinner.style.display = 'none';
            aiOptimizeBtn.disabled = false;
            aiOptimizeBtn.querySelector('.ai-icon').style.display = 'inline-block';
        }
    }
}); 
