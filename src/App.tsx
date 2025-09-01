import React, { useState } from 'react';
import { Layout, Typography, message, Button, Form, Radio } from 'antd';
import JSZip from 'jszip';
import ControlPanel, { SeoData } from './components/ControlPanel';
import { getMetaTagContent, updateLinkTag, updateMetaTag } from './utils/domUtils';
import { generateSlug, extractSlugFromUrl } from './utils/stringUtils';
import { SettingOutlined } from '@ant-design/icons';
import SettingsModal from './components/SettingsModal';
import { callGeminiAPI, callOpenAICompatibleAPI } from './utils/api';
import {
  removeUnwantedCss,
  generateTableOfContents,
  injectTableOfContents,
  prepareForPreview,
  addReadingProgressBar,
  convertYouTubeLinksToEmbeds  // 添加这一行
} from './utils/domEnhancer';
import { batchCompressImages, getCompressionStats } from './utils/imageCompressor';

export interface ImageFile {
  originalPath: string;
  blobUrl: string;
  alt: string;
  compressedBlob?: Blob;  // 压缩后的Blob
  newPath?: string;       // 新的文件路径（WebP格式）
  originalSize?: number;  // 原始大小
  compressedSize?: number; // 压缩后大小
}

interface Preset {
    canonicalPrefix: string;
    brandName: string;  // 新增品牌名字段
    ogTitle: string;
    ogDescription: string;
    ogType: string;
  }

const presets: Record<string, Preset> = {
  preset1: {
    canonicalPrefix: 'https://www.glbgpt.com/resource/',
    brandName: 'GlobalGPT',  // 新增
    ogTitle: 'GlobalGPT Free AI Tools : All-in-One Access to ChatGPT',
    ogDescription: "Explore GlobalGPT's free AI models and tools. Enjoy ChatGPT and top models for coding, content creation, and multimedia generation—no account switching needed.",
    ogType: 'website'
  },
  preset2: {
    canonicalPrefix: 'https://penligent.ai/resources/blog/',
    brandName: 'Penligent AI',  // 新增
    ogTitle: 'Penligent AI: Cursor built for Cyber Security Engineers',
    ogDescription: 'PenligentAI is building the Cursor for Cyber Security professionals — an intelligent AI-powered penetration testing tool that streamlines the entire process from reconnaissance and vulnerability scanning to exploitation and report generation. By leveraging the power of large language models (LLMs), PenligentAI runs end-to-end tests autonomously, with every step clearly traceable and transparent. It\'s the secret weapon for professionals and a must-have tool for organizations conducting security assessments.',
    ogType: 'website'
  }
};

const { Header, Content, Sider } = Layout;
const { Title, Paragraph } = Typography;

type Device = 'desktop' | 'tablet' | 'mobile';

// 新增：生成 OG Title 的辅助函数
const generateOgTitle = (articleName: string, brandName: string, contentType: string): string => {
  return `${articleName} - ${brandName} | ${contentType}`;
};

// 新增：生成初始 OG Description 的函数
const generateInitialOgDescription = (doc: Document, articleTitle: string): string => {
  const text = doc.body?.textContent || '';
  const firstParagraph = doc.querySelector('p')?.textContent?.trim() || '';
  
  // 尝试从文章中提取关键信息
  let description = '';
  
  if (firstParagraph.length > 50) {
    // 如果第一段足够长，使用第一段的前100个字符
    description = firstParagraph.substring(0, 100).trim() + '...';
  } else {
    // 否则使用文章标题和简短描述
    description = `Learn about ${articleTitle}. `;
    if (text.includes('how to') || text.includes('guide')) {
      description += 'Step-by-step guide included.';
    } else if (text.includes('tips') || text.includes('best practices')) {
      description += 'Expert tips and best practices.';
    } else {
      description += 'Read more →';
    }
  }
  
  // 确保长度不超过125字符
  if (description.length > 125) {
    description = description.substring(0, 122) + '...';
  }
  
  return description;
};

// 新增：根据文章内容推测内容类型的函数
const inferContentType = (doc: Document): string => {
  const text = doc.body?.textContent?.toLowerCase() || '';
  
  // 简单的内容类型推断逻辑
  if (text.includes('教程') || text.includes('指南') || text.includes('如何') || text.includes('tutorial') || text.includes('guide') || text.includes('how to')) {
    return 'Tutorial';
  } else if (text.includes('新闻') || text.includes('发布') || text.includes('更新') || text.includes('news') || text.includes('release') || text.includes('update')) {
    return 'News';
  } else if (text.includes('评测') || text.includes('对比') || text.includes('测评') || text.includes('review') || text.includes('comparison')) {
    return 'Review';
  } else if (text.includes('案例') || text.includes('实践') || text.includes('经验') || text.includes('case study') || text.includes('practice')) {
    return 'Case Study';
  } else {
    return 'Article';  // 默认类型
  }
};

const App: React.FC = () => {
    const [processedDoc, setProcessedDoc] = useState<Document | null>(null);
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
    const [seoData, setSeoData] = useState<SeoData | undefined>(undefined);
    const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
    const [originalZip, setOriginalZip] = useState<JSZip | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [form] = Form.useForm<SeoData>();
    const [previewDevice, setPreviewDevice] = useState<Device>('desktop');

    const deviceDimensions = {
      desktop: { width: '100%', height: '100%' },
      tablet: { width: '768px', height: '1024px' },
      mobile: { width: '375px', height: '667px' },
    };
    
    const generateOgImageUrl = (canonicalUrl: string, images: ImageFile[]): string => {
        // 获取第二张图片（索引为1）
        if (images.length >= 2) {
            const secondImage = images[1];
            // 使用新的WebP文件名（如果有），否则使用原始文件名
            const fileName = secondImage.newPath?.split('/').pop() || secondImage.originalPath.split('/').pop() || '';
            return `${canonicalUrl}-img/${fileName}`;
        }
        // 如果没有第二张图片，返回空字符串
        return '';
    };

    const handleFileSelect = async (file: File) => {
        try {
            const zip = await JSZip.loadAsync(file);
            setOriginalZip(zip);
            let htmlContent = '';
            const images: ImageFile[] = [];
            const imageBlobs: Array<{ blob: Blob; originalPath: string }> = [];

            const filePromises: Promise<void>[] = [];
            zip.forEach((relativePath, zipEntry) => {
                if (zipEntry.name.toLowerCase().endsWith('.html')) {
                    filePromises.push(zipEntry.async('string').then(content => { htmlContent = content; }));
                } else if (!zipEntry.dir && (zipEntry.name.toLowerCase().includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(zipEntry.name))) {
                    filePromises.push(
                        zipEntry.async('blob').then(blob => {
                            imageBlobs.push({ blob, originalPath: relativePath });
                            images.push({
                                originalPath: relativePath,
                                blobUrl: URL.createObjectURL(blob),
                                alt: '',
                                originalSize: blob.size,
                            });
                        })
                    );
                }
            });
            await Promise.all(filePromises);

            if (!htmlContent) throw new Error('ZIP包中未找到HTML文件。');

            // 压缩图片（静默处理，不显示弹窗）
            const compressedImages = await batchCompressImages(
                imageBlobs,
                50 // 压缩到50KB以下
            );
            
            // 计算压缩统计
            let totalOriginalSize = 0;
            let totalCompressedSize = 0;
            
            // 更新images数组，添加压缩后的信息
            const pathMapping: Record<string, string> = {};
            for (let i = 0; i < compressedImages.length; i++) {
                const compressed = compressedImages[i];
                const original = images[i];
                
                // 释放原来的blob URL
                URL.revokeObjectURL(original.blobUrl);
                
                // 创建新的blob URL（压缩后的）
                const newBlobUrl = URL.createObjectURL(compressed.blob);
                
                // 更新图片信息
                images[i] = {
                    ...original,
                    blobUrl: newBlobUrl,
                    compressedBlob: compressed.blob,
                    newPath: compressed.newPath,
                    compressedSize: compressed.blob.size,
                };
                
                // 记录路径映射（从原始路径到新路径）
                pathMapping[compressed.originalPath] = compressed.newPath;
                
                totalOriginalSize += original.originalSize || 0;
                totalCompressedSize += compressed.blob.size;
            }
            
            // 生成压缩统计信息（可选：在控制台输出）
            const stats = getCompressionStats(totalOriginalSize, totalCompressedSize);
            console.log(`图片压缩完成：从 ${stats.originalSize} 压缩至 ${stats.compressedSize}（减少 ${stats.reductionPercentage}）`);

            const parser = new DOMParser();
            let doc = parser.parseFromString(htmlContent, 'text/html');
            
            // 更新HTML中的图片引用（使用新的WebP路径）
            doc.querySelectorAll('img').forEach(img => {
                const src = img.getAttribute('src');
                if (src && pathMapping[src]) {
                    // 将原始路径替换为新的WebP路径
                    const newPath = pathMapping[src];
                    const fileName = newPath.split('/').pop() || '';
                    img.setAttribute('src', fileName);
                    
                    // 如果图片被链接包围，也更新链接
                    const parentLink = img.closest('a');
                    if (parentLink) {
                        const href = parentLink.getAttribute('href');
                        if (href === src) {
                            parentLink.setAttribute('href', fileName);
                        }
                    }
                }
            });

            // --- ALL DOM MANIPULATIONS MUST HAPPEN HERE, ON THE SAME DOC OBJECT ---
            
            // 1. Clean up Notion's default styles
            removeUnwantedCss(doc);

            // 2. Convert YouTube links to embeds
            convertYouTubeLinksToEmbeds(doc);

            // 3. Generate and inject the Table of Contents and its assets
            const tocData = generateTableOfContents(doc);
            if (tocData.items.length > 0) {
                injectTableOfContents(doc, tocData);
            } else {
                // If there's no TOC, we still need a progress bar
                addReadingProgressBar(doc);
            }
            
            // NOW, the doc is fully enhanced.
            // This enhanced doc is the master version for everything.
            setProcessedDoc(doc);
            
            // Create a separate version for preview with blob URLs
            const docForPreview = prepareForPreview(doc, images);
            setPreviewDoc(docForPreview);

            images.forEach(imgData => {
                // 使用新的文件名查找img元素（如果有WebP转换）
                const searchFileName = imgData.newPath?.split('/').pop() || imgData.originalPath.split('/').pop() || '';
                const imgElement = doc.querySelector(`img[src="${searchFileName}"]`) || 
                                   doc.querySelector(`img[src="${imgData.originalPath}"]`);
                const fileName = imgData.originalPath.split('/').pop() || '';
                const altBase = fileName.split('.').slice(0, -1).join('.');
                imgData.alt = imgElement?.getAttribute('alt') || altBase.replace(/[-_]/g, ' ').trim();
            });
            const sortedImages: ImageFile[] = [];
            const allImgElements = doc.querySelectorAll('img');
            allImgElements.forEach(imgElement => {
                const imgSrc = imgElement.getAttribute('src');
                if (!imgSrc) return;
                const foundImage = images.find(imageFile => {
                    // 检查新的WebP文件名或原始文件名
                    const newFileName = imageFile.newPath?.split('/').pop() || '';
                    const originalFileName = imageFile.originalPath.split('/').pop() || '';
                    return imgSrc === newFileName || imgSrc === originalFileName || 
                           imgSrc.endsWith('/' + newFileName) || imgSrc.endsWith('/' + originalFileName);
                });
                if (foundImage && !sortedImages.includes(foundImage)) {
                    sortedImages.push(foundImage);
                }
            });
            setImageFiles(sortedImages);
            
            const h1 = doc.querySelector('h1')?.textContent?.trim() || 'untitled';
            const slug = generateSlug(h1);

            const canonicalUrl = presets.preset1.canonicalPrefix + slug;
            const ogImageUrl = generateOgImageUrl(canonicalUrl, sortedImages);
            
            // 生成 OG Title 的三个组成部分
            const articleName = h1;
            const brandName = presets.preset1.brandName;
            const contentType = inferContentType(doc);
            const ogTitle = generateOgTitle(articleName, brandName, contentType);
            
            const initialSeoData: SeoData = {
                metaDescription: getMetaTagContent(doc, 'description'), 
                keywords: getMetaTagContent(doc, 'keywords'),
                canonicalUrl: canonicalUrl,
                ogTitle: ogTitle,
                ogTitleArticleName: articleName,  // 新增
                ogTitleBrandName: brandName,      // 新增
                ogTitleContentType: contentType,  // 新增
                ogDescription: generateInitialOgDescription(doc, h1),
                ogImage: ogImageUrl,
                ogUrl: canonicalUrl,
                ogType: presets.preset1.ogType,
                coreKeyword: '', 
                presetScheme: 'preset1'
            };

            const tempDoc = doc.cloneNode(true) as Document;
            Object.entries(initialSeoData).forEach(([key, value]) => {
                switch (key) {
                    case 'metaDescription': updateMetaTag(tempDoc, 'description', value as string); break;
                    case 'keywords': updateMetaTag(tempDoc, 'keywords', value as string); break;
                    case 'canonicalUrl': updateLinkTag(tempDoc, 'canonical', value as string); break;
                    case 'ogTitle': updateMetaTag(tempDoc, 'og:title', value as string, 'property'); break;
                    case 'ogDescription': updateMetaTag(tempDoc, 'og:description', value as string, 'property'); break;
                    case 'ogImage': updateMetaTag(tempDoc, 'og:image', value as string, 'property'); break;
                    case 'ogUrl': updateMetaTag(tempDoc, 'og:url', value as string, 'property'); break;
                    case 'ogType': updateMetaTag(tempDoc, 'og:type', value as string, 'property'); break;
                }
            });
            setProcessedDoc(tempDoc);
            
            setSeoData(initialSeoData);
            form.setFieldsValue(initialSeoData);
            message.success('文件解析成功！');

        } catch (error) {
            console.error('处理ZIP文件时出错:', error);
            message.error(`处理ZIP文件失败: ${error instanceof Error ? error.message : String(error)}`);
            setProcessedDoc(null);
            setPreviewDoc(null);
            setSeoData(undefined);
            setImageFiles([]);
            setOriginalZip(null);
        }
    };

    const handleFormChange = (changedValues: any) => {
        if (!processedDoc) return;

        // 处理 OG Title 三个组成部分的变化
        if (changedValues.ogTitleArticleName || changedValues.ogTitleBrandName || changedValues.ogTitleContentType) {
            const currentValues = form.getFieldsValue();
            const newOgTitle = generateOgTitle(
                changedValues.ogTitleArticleName || currentValues.ogTitleArticleName,
                changedValues.ogTitleBrandName || currentValues.ogTitleBrandName,
                changedValues.ogTitleContentType || currentValues.ogTitleContentType
            );
            changedValues.ogTitle = newOgTitle;
            form.setFieldsValue({ ogTitle: newOgTitle });
        }

        if (changedValues.canonicalUrl) {
            const newOgImage = generateOgImageUrl(changedValues.canonicalUrl, imageFiles);
            changedValues.ogImage = newOgImage;
            changedValues.ogUrl = changedValues.canonicalUrl;
            // 同时更新表单
            form.setFieldsValue({ 
                ogImage: newOgImage,
                ogUrl: changedValues.canonicalUrl
            });
        }
        
        // Always work on a fresh clone of the master doc
        const newDoc = processedDoc.cloneNode(true) as Document;

        Object.entries(changedValues).forEach(([key, value]) => {
            if (value === undefined) return;
            switch (key) {
                case 'metaDescription': updateMetaTag(newDoc, 'description', value as string); break;
                case 'keywords': updateMetaTag(newDoc, 'keywords', value as string); break;
                case 'canonicalUrl': updateLinkTag(newDoc, 'canonical', value as string); break;
                case 'ogTitle': updateMetaTag(newDoc, 'og:title', value as string, 'property'); break;
                case 'ogDescription': updateMetaTag(newDoc, 'og:description', value as string, 'property'); break;
                case 'ogImage': updateMetaTag(newDoc, 'og:image', value as string, 'property'); break;
                case 'ogUrl': updateMetaTag(newDoc, 'og:url', value as string, 'property'); break;
                case 'ogType': updateMetaTag(newDoc, 'og:type', value as string, 'property'); break;
            }
        });
        
        // Update the master doc
        setProcessedDoc(newDoc);

        // Update the preview doc based on the new master doc
        const newPreviewDoc = prepareForPreview(newDoc, imageFiles);
        setPreviewDoc(newPreviewDoc);
    };

    const handlePresetChange = (presetKey: string) => {
        const selectedPreset = presets[presetKey];
        if (!selectedPreset || !processedDoc) return;

        const h1 = processedDoc.querySelector('h1')?.textContent?.trim() || 'untitled';
        const slug = generateSlug(h1);

        const canonicalUrl = selectedPreset.canonicalPrefix + slug;
        const ogImageUrl = generateOgImageUrl(canonicalUrl, imageFiles);
        
        // 获取当前的文章名和内容类型（保持不变），只更新品牌名
        const currentValues = form.getFieldsValue();
        const articleName = currentValues.ogTitleArticleName || h1;
        const brandName = selectedPreset.brandName;
        const contentType = currentValues.ogTitleContentType || inferContentType(processedDoc);
        const newOgTitle = generateOgTitle(articleName, brandName, contentType);
        
        const newValues = {
            canonicalUrl: canonicalUrl,
            ogTitle: newOgTitle,
            ogTitleBrandName: brandName,  // 更新品牌名
            // ogDescription 保持不变，继续使用基于文章内容的描述
            ogImage: ogImageUrl,
            ogType: selectedPreset.ogType,
            ogUrl: canonicalUrl,
        };

        form.setFieldsValue(newValues);
        handleFormChange(newValues);
    };

    const handleDownload = async () => {
        if (!processedDoc || !originalZip) {
            message.error('没有可下载的文件。请先上传一个ZIP包。');
            return;
        }

        const newZip = new JSZip();
        const currentValues = form.getFieldsValue(true);
        const finalSlug = generateSlug(extractSlugFromUrl(currentValues.canonicalUrl) || currentValues.ogTitle || 'untitled');
        const imageFolderName = `${finalSlug}-img`;

        const docClone = processedDoc.cloneNode(true) as Document;
        const finalOgImage = generateOgImageUrl(currentValues.canonicalUrl, imageFiles);
        if (finalOgImage) {
            updateMetaTag(docClone, 'og:image', finalOgImage, 'property');
        }

        imageFiles.forEach(imageFile => {
            const altValue = currentValues[imageFile.originalPath];
            if (altValue !== undefined) {
                // 使用新的WebP文件名查找img元素
                const newFileName = imageFile.newPath?.split('/').pop() || '';
                const originalFileName = imageFile.originalPath.split('/').pop() || '';
                const imgElement = Array.from(docClone.querySelectorAll('img')).find(img => {
                    const src = img.getAttribute('src') || '';
                    return src.endsWith(newFileName) || src.endsWith(originalFileName) || 
                           src === newFileName || src === originalFileName;
                });
                if (imgElement) {
                    imgElement.setAttribute('alt', altValue);
                }
            }
        });
        
        docClone.querySelectorAll('img').forEach(img => {
            const currentSrc = img.getAttribute('src');
            if (currentSrc) {
                // 查找对应的图片文件信息
                const currentFileName = currentSrc.split('/').pop() || '';
                const imageFile = imageFiles.find(imgFile => {
                    const webpFileName = imgFile.newPath?.split('/').pop() || '';
                    const originalFileName = imgFile.originalPath.split('/').pop() || '';
                    // 匹配当前src（可能是WebP或原始文件名）
                    return currentFileName === webpFileName || currentFileName === originalFileName;
                });
                
                // 使用正确的文件名（优先使用WebP）
                const finalFileName = imageFile?.newPath?.split('/').pop() || 
                                     imageFile?.originalPath.split('/').pop() || 
                                     currentFileName;
                const newPath = `${imageFolderName}/${finalFileName}`;
                img.setAttribute('src', newPath);
                
                // 更新父链接（如果存在）
                const parentLink = img.closest('a');
                if (parentLink) {
                    const originalHref = parentLink.getAttribute('href');
                    if (originalHref === currentSrc || originalHref?.split('/').pop() === currentFileName) {
                        parentLink.setAttribute('href', newPath);
                    }
                }
            }
        });

        const finalHtml = '<!DOCTYPE html>\n' + docClone.documentElement.outerHTML;
        newZip.file(`${finalSlug}/index.html`, finalHtml);

        const imageAddPromises = imageFiles.map(async (imageFile) => {
            // 使用压缩后的图片（如果有的话）
            if (imageFile.compressedBlob) {
                // 使用新的文件名（WebP格式）
                const fileName = imageFile.newPath?.split('/').pop() || imageFile.originalPath.split('/').pop() || '';
                const arrayBuffer = await imageFile.compressedBlob.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);
                newZip.file(`${imageFolderName}/${fileName}`, data);
            } else {
                // 如果没有压缩（比如SVG），使用原始文件
                const file = originalZip.file(imageFile.originalPath);
                if (file) {
                    const data = await file.async('uint8array');
                    const fileName = imageFile.originalPath.split('/').pop() || '';
                    newZip.file(`${imageFolderName}/${fileName}`, data);
                }
            }
        });

        await Promise.all(imageAddPromises);
        const zipBlob = await newZip.generateAsync({ type: 'blob' });
        const downloadUrl = URL.createObjectURL(zipBlob);
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${finalSlug}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        message.success('ZIP 包已开始下载！');
    };

    const handleAiOptimization = async (provider: string, coreKeyword: string) => {
        const apiKey = localStorage.getItem(`${provider}_api_key`);
        if (!apiKey) {
            message.error(`请先在设置中输入您的 ${provider} API Key。`);
            setIsSettingsModalOpen(true);
            return;
        }
        if (!processedDoc) {
            message.warning('请先上传一个ZIP文件。');
            return;
        }
        
        const articleText = processedDoc.body.innerText.trim().substring(0, 4000);
        const h1 = processedDoc.querySelector('h1')?.textContent?.trim() || 'untitled';
        const prompt = `
            You are a professional Google SEO expert. My core keyword is "${coreKeyword}".
            Based on the following HTML article content, please generate SEO-friendly metadata around my core keyword.

            IMPORTANT: ALL responses must be in ENGLISH only.

            Please strictly follow these requirements:
            1. **meta_description**: Must be between 140-160 characters. Should be search engine friendly and naturally include the core keyword.
            2. **keywords**: Total characters (including commas) must be less than 100. Return 3-4 keywords most relevant to the core keyword, separated by commas.
            3. **content_type**: Classify the article into ONE of these types: Tutorial, News, Review, Case Study, Guide, Analysis, or Article.
            4. **og_description**: Must be less than 125 characters. Follow this formula:
               - Address user pain point + solution
               - Include long-tail keywords
               - Add a call-to-action (CTA)
               - Example format: "X ways to [solve problem]: [specific benefits]. For [target audience] to [achieve result]. [CTA like 'Free Download' or 'Learn More'] →"

            Return ONLY the following JSON format without any additional explanation or code block markers:

            {
              "meta_description": "generate description here",
              "keywords": "generate keywords here",
              "content_type": "generate content type here",
              "og_description": "generate OG description here"
            }

            Article title: ${h1}
            Article content:
            ---
            ${articleText}
            ---
        `;
        
        try {
            let seoData;
            if (provider === 'gemini') {
                seoData = await callGeminiAPI(apiKey, prompt);
            } else {
                seoData = await callOpenAICompatibleAPI(provider, apiKey, prompt);
            }
            
            // 获取当前表单值
            const currentValues = form.getFieldsValue();
            
            // 如果 AI 返回了内容类型，更新 OG Title
            let updatedValues: any = {
                metaDescription: seoData.meta_description,
                keywords: seoData.keywords,
            };
            
            if (seoData.og_description) {
                updatedValues.ogDescription = seoData.og_description;
            }
            
            if (seoData.content_type) {
                updatedValues.ogTitleContentType = seoData.content_type;
                // 重新生成 OG Title
                const newOgTitle = generateOgTitle(
                    currentValues.ogTitleArticleName || h1,
                    currentValues.ogTitleBrandName,
                    seoData.content_type
                );
                updatedValues.ogTitle = newOgTitle;
            }
            
            form.setFieldsValue(updatedValues);
            handleFormChange(updatedValues);
            message.success('AI 优化成功！');
        } catch (error) {
            console.error(`${provider} AI优化失败:`, error);
            message.error(`AI优化失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
                <Title level={3} style={{ margin: 0 }}>Notion 文章 SEO 与阅读体验优化工具</Title>
                <Button icon={<SettingOutlined />} onClick={() => setIsSettingsModalOpen(true)} />
            </Header>
            <Layout>
                <Sider width={400} theme="light" style={{ padding: '24px', borderRight: '1px solid #f0f0f0', overflowY: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
                    <ControlPanel 
                        form={form}
                        initialData={seoData}
                        imageFiles={imageFiles}
                        onFileSelect={handleFileSelect} 
                        onValuesChange={handleFormChange}
                        onDownload={handleDownload}
                        onAiOptimize={handleAiOptimization}
                        onPresetChange={handlePresetChange}
                    />
                </Sider>
                <Content style={{ padding: '24px', backgroundColor: '#f0f2f5', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ marginBottom: 16 }}>
                        <Radio.Group value={previewDevice} onChange={(e) => setPreviewDevice(e.target.value)}>
                            <Radio.Button value="desktop">桌面</Radio.Button>
                            <Radio.Button value="tablet">平板</Radio.Button>
                            <Radio.Button value="mobile">手机</Radio.Button>
                        </Radio.Group>
                    </div>
                    <div style={{ 
                        width: deviceDimensions[previewDevice].width,
                        height: deviceDimensions[previewDevice].height,
                        backgroundColor: '#fff',
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        padding: '16px',
                        transition: 'all 0.4s ease',
                        overflow: 'hidden'
                    }}>
                        {previewDoc ? (
                            <iframe
                                srcDoc={new XMLSerializer().serializeToString(previewDoc)}
                                title="文章预览"
                                style={{ width: '100%', height: '100%', border: 'none' }}
                            />
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <Paragraph style={{ textAlign: 'center' }}>在这里将显示文章的实时预览。</Paragraph>
                            </div>
                        )}
                    </div>
                </Content>
            </Layout>
            <SettingsModal open={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
            <Layout.Footer style={{ textAlign: 'center', backgroundColor: '#f0f2f5', padding: '12px 24px' }}>
                Notion SEO Editor ©2025 Created by <a href="https://github.com/Eric-Geek" target="_blank" rel="noopener noreferrer">Eric Geek</a>
            </Layout.Footer>
        </Layout>
    );
};

export default App; 