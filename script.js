document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const fileInput = document.getElementById('file-input');
    const metaDescriptionInput = document.getElementById('meta-description');
    const descriptionCounter = document.getElementById('description-counter');
    const keywordsInput = document.getElementById('keywords');
    const keywordsCounter = document.getElementById('keywords-counter');
    const canonicalUrlInput = document.getElementById('canonical-url');
    const pageWidthInput = document.getElementById('page-width');
    const ogTitleInput = document.getElementById('og-title');
    const ogDescriptionInput = document.getElementById('og-description');
    const ogImageInput = document.getElementById('og-image');
    const imageListDiv = document.getElementById('image-list');
    const downloadBtn = document.getElementById('download-btn');
    const previewFrame = document.getElementById('preview-frame');

    // New AI and Settings elements
    const settingsBtn = document.getElementById('settings-btn');
    const aiOptimizeBtn = document.getElementById('ai-optimize-btn');
    const settingsModal = document.getElementById('settings-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const cancelApiKeyBtn = document.getElementById('cancel-api-key-btn');
    const spinner = aiOptimizeBtn.querySelector('.spinner');

    let processedDoc = null;
    let originalFileName = 'optimized-page.html';

    // --- Event Listeners ---
    fileInput.addEventListener('change', handleFileSelect);
    downloadBtn.addEventListener('click', handleDownload);
    
    // SEO input listeners
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
    pageWidthInput.addEventListener('input', () => {
        updateStyleTag(pageWidthInput.value);
        updatePreview();
    });
    ogTitleInput.addEventListener('input', () => updateMetaTag('og:title', ogTitleInput.value, 'property'));
    ogDescriptionInput.addEventListener('input', () => updateMetaTag('og:description', ogDescriptionInput.value, 'property'));
    ogImageInput.addEventListener('input', () => updateMetaTag('og:image', ogImageInput.value, 'property'));

    // Settings Modal Listeners
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
        apiKeyInput.value = localStorage.getItem('deepseek_api_key') || '';
    });
    cancelApiKeyBtn.addEventListener('click', () => settingsModal.style.display = 'none');
    saveApiKeyBtn.addEventListener('click', () => {
        localStorage.setItem('deepseek_api_key', apiKeyInput.value);
        settingsModal.style.display = 'none';
        alert('API Key已保存。');
    });

    // AI Optimize Button Listener
    aiOptimizeBtn.addEventListener('click', handleAiOptimization);


    // --- Main Functions ---

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('text/html')) {
            alert('请选择一个有效的HTML文件。');
            return;
        }
        originalFileName = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target.result;
            const parser = new DOMParser();
            processedDoc = parser.parseFromString(fileContent, 'text/html');
            
            populateEditorFields();
            updatePreview();

            downloadBtn.disabled = false;
            aiOptimizeBtn.disabled = false;
        };
        reader.readAsText(file);
    }

    async function handleAiOptimization() {
        const apiKey = localStorage.getItem('deepseek_api_key');
        if (!apiKey) {
            alert('请先在设置中输入您的DeepSeek API Key。');
            settingsModal.style.display = 'flex';
            return;
        }

        if (!processedDoc || !processedDoc.body) {
            alert('请先上传一个HTML文件。');
            return;
        }

        toggleLoading(true);

        // Extract meaningful text content for the prompt
        const articleText = processedDoc.body.innerText.trim().substring(0, 4000);

        const prompt = `
            请你扮演一位专业的SEO专家。基于以下HTML文章内容，请为我生成优化的SEO元数据。
            请严格按照以下JSON格式返回，不要包含任何额外的解释或代码块标记。

            {
              "meta_description": "一段140到160个字符的文章摘要，内容要吸引人点击。",
              "keywords": "一个包含5-7个最相关关键词的字符串，用英文逗号分隔。",
              "og_title": "一个适合在社交媒体分享的、引人注目的标题。",
              "og_description": "一段与meta_description类似但可以更具对话性的社交媒体描述。",
              "image_alts": [
                { "src": "图片的src属性值", "alt": "为这张图片生成的描述性alt文本" }
              ]
            }

            文章内容如下:
            ---
            ${articleText}
            ---
        `;

        const imageSrcs = Array.from(processedDoc.querySelectorAll('img')).map(img => img.src);
        const promptForAI = prompt.replace(
            '{"src": "图片的src属性值", "alt": "为这张图片生成的描述性alt文本"}',
            imageSrcs.map(src => `{"src": "${src}", "alt": "为这张图片生成的描述性alt文本"}`).join(',')
        );


        try {
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ "role": "user", "content": promptForAI }],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API 请求失败: ${response.status} ${response.statusText}. 详情: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            const seoData = JSON.parse(data.choices[0].message.content);

            // Populate fields with AI data
            metaDescriptionInput.value = seoData.meta_description || '';
            keywordsInput.value = seoData.keywords || '';
            ogTitleInput.value = seoData.og_title || '';
            ogDescriptionInput.value = seoData.og_description || '';
            
            if (seoData.image_alts && Array.isArray(seoData.image_alts)) {
                seoData.image_alts.forEach(imgData => {
                    // Find the corresponding image element in the document
                    const imgElement = processedDoc.querySelector(`img[src="${imgData.src}"]`);
                    if (imgElement) {
                        // Find its index to locate the correct input field
                        const allImages = Array.from(processedDoc.querySelectorAll('img'));
                        const imgIndex = allImages.indexOf(imgElement);
                        if (imgIndex > -1) {
                            const altInput = document.getElementById(`alt-text-${imgIndex}`);
                            if (altInput) {
                                altInput.value = imgData.alt;
                                // Also update the alt attribute in the processed document directly
                                imgElement.setAttribute('alt', imgData.alt);
                            }
                        }
                    }
                });
            }

            // Trigger updates to reflect changes in character counters and preview
            metaDescriptionInput.dispatchEvent(new Event('input'));
            keywordsInput.dispatchEvent(new Event('input'));
            ogTitleInput.dispatchEvent(new Event('input'));
            ogDescriptionInput.dispatchEvent(new Event('input'));
            updatePreview();


        } catch (error) {
            console.error('AI优化失败:', error);
            alert(`AI优化失败: ${error.message}`);
        } finally {
            toggleLoading(false);
        }
    }

    function populateEditorFields() {
        if (!processedDoc) return;

        // 1. Meta Description
        let description = getMetaTagContent('description');
        if (!description) {
            description = generateMetaDescription();
            updateMetaTag('description', description);
        }
        metaDescriptionInput.value = description;
        updateCharacterCounter(metaDescriptionInput, descriptionCounter, 160);
        
        // 2. Keywords
        keywordsInput.value = getMetaTagContent('keywords');
        updateCharacterCounter(keywordsInput, keywordsCounter, 100);

        // 3. Canonical URL
        canonicalUrlInput.value = getLinkTagHref('canonical') || '';

        // 4. Image Alt Text
        processImages();

        // 5. Social Media Tags
        ogTitleInput.value = getMetaTagContent('og:title', 'property') || processedDoc.title || '';
        ogDescriptionInput.value = getMetaTagContent('og:description', 'property') || metaDescriptionInput.value;
        ogImageInput.value = getMetaTagContent('og:image', 'property') || findFirstImageUrl();
        
        // 6. Page Width
        updateStyleTag(pageWidthInput.value);
        
        // Enable AI button if file is loaded
        aiOptimizeBtn.disabled = false;
    }

    // --- Extractor and Generator Functions ---

    function getMetaTagContent(name, attribute = 'name') {
        const meta = processedDoc.querySelector(`meta[${attribute}="${name}"]`);
        return meta ? meta.getAttribute('content') : '';
    }
    
    function getLinkTagHref(rel) {
        const link = processedDoc.querySelector(`link[rel="${rel}"]`);
        return link ? link.getAttribute('href') : '';
    }

    function generateMetaDescription() {
        const paragraphs = Array.from(processedDoc.body.querySelectorAll('p'));
        let text = '';
        for (const p of paragraphs) {
            if (p.textContent.trim().length > 0) {
                text += p.textContent.trim() + ' ';
            }
            if (text.length > 160) break;
        }
        return text.slice(0, 160).trim();
    }
    
    function findFirstImageUrl() {
        const firstImg = processedDoc.querySelector('img');
        return firstImg ? firstImg.src : '';
    }
    
    // --- Image Processing ---

    function processImages() {
        const images = processedDoc.querySelectorAll('img');
        imageListDiv.innerHTML = ''; // Clear previous list

        if (images.length === 0) {
            imageListDiv.innerHTML = '<p class="placeholder">未在此文件中找到图片。</p>';
            return;
        }

        images.forEach((img, index) => {
            const imgSrc = img.getAttribute('src');
            let altText = img.getAttribute('alt');

            if (!altText || altText.trim() === '') {
                altText = generateAltText(imgSrc);
                img.setAttribute('alt', altText); // Update doc
            }
            
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            
            imageItem.innerHTML = `
                <img src="${imgSrc}" alt="preview">
                <div class="image-details">
                    <label for="alt-text-${index}"><code>${imgSrc.split('/').pop()}</code></label>
                    <input type="text" id="alt-text-${index}" value="${altText}" data-src="${imgSrc}" placeholder="请输入描述性Alt文本">
                </div>
            `;
            
            imageListDiv.appendChild(imageItem);
            
            const altInput = imageItem.querySelector(`#alt-text-${index}`);
            altInput.addEventListener('input', () => {
                img.setAttribute('alt', altInput.value);
                updatePreview();
            });
        });
    }

    function generateAltText(src) {
        if (!src) return '';
        try {
            const fileName = src.split('/').pop().split('.').slice(0, -1).join('.');
            return fileName.replace(/[-_]/g, ' ').trim();
        } catch (e) {
            return '';
        }
    }

    // --- Updater Functions ---

    function updateMetaTag(name, content, attribute = 'name') {
        if (!processedDoc) return;
        let meta = processedDoc.querySelector(`meta[${attribute}="${name}"]`);
        if (!meta) {
            meta = processedDoc.createElement('meta');
            meta.setAttribute(attribute, name);
            processedDoc.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }
    
    function updateLinkTag(rel, href) {
        if (!processedDoc) return;
        let link = processedDoc.querySelector(`link[rel="${rel}"]`);
        if (!link) {
            link = processedDoc.createElement('link');
            link.setAttribute('rel', rel);
            processedDoc.head.appendChild(link);
        }
        link.setAttribute('href', href);
    }
    
    function updateStyleTag(maxWidth) {
        if (!processedDoc) return;
        const styleId = 'seo-editor-styles';
        let styleTag = processedDoc.getElementById(styleId);
        if (!styleTag) {
            styleTag = processedDoc.createElement('style');
            styleTag.id = styleId;
            processedDoc.head.appendChild(styleTag);
        }
        styleTag.textContent = `body { max-width: ${maxWidth}; margin: 0 auto; padding: 20px; }`;
    }

    function updatePreview() {
        if (processedDoc) {
            const serializedHtml = new XMLSerializer().serializeToString(processedDoc);
            previewFrame.srcdoc = serializedHtml;
        }
    }
    
    function handleDownload() {
        if (!processedDoc) return;
        
        // Quick fix to ensure all manual alt text edits are in the doc before downloading
        const altInputs = document.querySelectorAll('#image-list input[id^="alt-text-"]');
        altInputs.forEach((input, index) => {
            const imgEl = processedDoc.querySelectorAll('img')[index];
            if(imgEl) {
                imgEl.setAttribute('alt', input.value);
            }
        });

        updatePreview(); // Ensure preview is up to date before download

        const finalHtml = '<!DOCTYPE html>\n' + processedDoc.documentElement.outerHTML;
        const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = originalFileName.replace(/(\.[\w\d_-]+)$/i, '_optimized$1');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- Utility Functions ---

    function updateCharacterCounter(inputElement, counterElement, max) {
        const currentLength = inputElement.value.length;
        counterElement.textContent = `${currentLength} / ${max}`;
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