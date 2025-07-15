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
    const aiOptimizeBtn = document.getElementById('ai-optimize-btn');
    const settingsModal = document.getElementById('settings-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const cancelApiKeyBtn = document.getElementById('cancel-api-key-btn');
    const spinner = aiOptimizeBtn.querySelector('.spinner');

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
        apiKeyInput.value = localStorage.getItem('deepseek_api_key') || '';
    });
    cancelApiKeyBtn.addEventListener('click', () => settingsModal.style.display = 'none');
    saveApiKeyBtn.addEventListener('click', () => {
        localStorage.setItem('deepseek_api_key', apiKeyInput.value);
        settingsModal.style.display = 'none';
        alert('API Key已保存。');
    });

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
        const apiKey = localStorage.getItem('deepseek_api_key');
        if (!apiKey) {
            alert('请先在设置中输入您的DeepSeek API Key。');
            settingsModal.style.display = 'flex';
            return;
        }

        if (!processedDoc || !processedDoc.body) {
            alert('请先上传一个ZIP文件。');
            return;
        }

        toggleLoading(true);

        const articleText = processedDoc.body.innerText.trim().substring(0, 4000);

        // Build the image part of the prompt using original paths
        // const imageSrcs = Array.from(imageFiles.keys());
        // const imagePrompts = imageSrcs.map(src => `{"src": "${src}", "alt": "为这张图片生成的描述性alt文本"}`).join(',\n');

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
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ "role": "user", "content": prompt }],
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
            metaDescriptionInput.value = (seoData.meta_description || '').slice(0, 160);
            keywordsInput.value = seoData.keywords || '';
            
            // Image alt texts are no longer generated by AI, they default to filename instead.
            // if (seoData.image_alts && Array.isArray(seoData.image_alts)) {
            //     seoData.image_alts.forEach(imgData => {
            //         const originalPath = imgData.src;
            //         const altInput = document.querySelector(`input[data-original-path="${originalPath}"]`);
            //         if (altInput) {
            //             altInput.value = imgData.alt;
            //         }
            //         // Also update the alt attribute in the processed document directly
            //         const blobUrl = imageFiles.get(originalPath);
            //         if (blobUrl) {
            //             const imgElement = processedDoc.querySelector(`img[src="${blobUrl}"]`);
            //             if(imgElement) {
            //                 imgElement.setAttribute('alt', imgData.alt);
            //             }
            //         }
            //     });
            // }

            // Trigger updates to reflect changes in character counters and preview
            metaDescriptionInput.dispatchEvent(new Event('input'));
            keywordsInput.dispatchEvent(new Event('input'));
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
        newZip.file(`${finalSlug}.html`, finalHtml);

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

    // Hide AI-related elements as they are not used in this workflow
    // const aiButton = document.getElementById('ai-optimize-btn');
    // const settingsButton = document.getElementById('settings-btn');
    // if(aiButton) aiButton.style.display = 'none';
    // if(settingsButton) settingsButton.style.display = 'none';
}); 
