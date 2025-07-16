import React, { useState } from 'react';
import { Layout, Typography, message, Button, Form, Radio } from 'antd';
import JSZip from 'jszip';
import ControlPanel, { SeoData } from './components/ControlPanel';
import { getLinkTagHref, getMetaTagContent, updateLinkTag, updateMetaTag } from './utils/domUtils';
import { generateSlug, extractSlugFromUrl } from './utils/stringUtils';
import { SettingOutlined } from '@ant-design/icons';
import SettingsModal from './components/SettingsModal';
import { callGeminiAPI, callOpenAICompatibleAPI } from './utils/api';
import {
  removeUnwantedCss,
  generateTableOfContents,
  injectTableOfContents,
  prepareForPreview,
  addReadingProgressBar
} from './utils/domEnhancer';

export interface ImageFile {
  originalPath: string;
  blobUrl: string;
  alt: string;
}

const { Header, Content, Sider } = Layout;
const { Title, Paragraph } = Typography;

type Device = 'desktop' | 'tablet' | 'mobile';

const App: React.FC = () => {
    const [processedDoc, setProcessedDoc] = useState<Document | null>(null);
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
    const [seoData, setSeoData] = useState<SeoData | undefined>(undefined);
    const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
    const [originalZip, setOriginalZip] = useState<JSZip | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [previewDevice, setPreviewDevice] = useState<Device>('desktop');

    const deviceDimensions = {
      desktop: { width: '100%', height: '100%' },
      tablet: { width: '768px', height: '1024px' },
      mobile: { width: '375px', height: '667px' },
    };

    const handleFileSelect = async (file: File) => {
        try {
            const zip = await JSZip.loadAsync(file);
            setOriginalZip(zip);
            let htmlContent = '';
            const images: ImageFile[] = [];

            const filePromises: Promise<void>[] = [];
            zip.forEach((relativePath, zipEntry) => {
                if (zipEntry.name.toLowerCase().endsWith('.html')) {
                    filePromises.push(zipEntry.async('string').then(content => { htmlContent = content; }));
                } else if (!zipEntry.dir && (zipEntry.name.toLowerCase().includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(zipEntry.name))) {
                    filePromises.push(
                        zipEntry.async('blob').then(blob => {
                            images.push({
                                originalPath: relativePath,
                                blobUrl: URL.createObjectURL(blob),
                                alt: '',
                            });
                        })
                    );
                }
            });
            await Promise.all(filePromises);

            if (!htmlContent) throw new Error('ZIP包中未找到HTML文件。');

            const parser = new DOMParser();
            let doc = parser.parseFromString(htmlContent, 'text/html');

            // --- ALL DOM MANIPULATIONS MUST HAPPEN HERE ---
            // 1. Clean up Notion's default styles
            removeUnwantedCss(doc);
            
            // 2. Generate and inject the Table of Contents and its assets
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
            
            // Prepare a separate version for preview with blob URLs
            const docForPreview = prepareForPreview(doc, images);
            setPreviewDoc(docForPreview);

            images.forEach(imgData => {
                const imgElement = doc.querySelector(`img[src="${imgData.originalPath}"]`);
                const fileName = imgData.originalPath.split('/').pop() || '';
                const altBase = fileName.split('.').slice(0, -1).join('.');
                imgData.alt = imgElement?.getAttribute('alt') || altBase.replace(/[-_]/g, ' ').trim();
            });
            setImageFiles(images);
            
            const initialSeoData: SeoData = {
                metaDescription: getMetaTagContent(doc, 'description'),
                keywords: getMetaTagContent(doc, 'keywords'),
                canonicalUrl: getLinkTagHref(doc, 'canonical') || '',
                ogTitle: getMetaTagContent(doc, 'og:title', 'property'),
                ogDescription: getMetaTagContent(doc, 'og:description', 'property'),
                ogImage: getMetaTagContent(doc, 'og:image', 'property'),
            };

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
        const newDoc = processedDoc.cloneNode(true) as Document;

        Object.entries(changedValues).forEach(([key, value]) => {
            switch (key) {
                case 'metaDescription': updateMetaTag(newDoc, 'description', value as string); break;
                case 'keywords': updateMetaTag(newDoc, 'keywords', value as string); break;
                case 'canonicalUrl': updateLinkTag(newDoc, 'canonical', value as string); break;
                case 'ogTitle': updateMetaTag(newDoc, 'og:title', value as string, 'property'); break;
                case 'ogDescription': updateMetaTag(newDoc, 'og:description', value as string, 'property'); break;
                case 'ogImage': updateMetaTag(newDoc, 'og:image', value as string, 'property'); break;
            }
        });
        
        setProcessedDoc(newDoc);
        const newPreviewDoc = prepareForPreview(newDoc, imageFiles);
        setPreviewDoc(newPreviewDoc);
    };

    const handleDownload = async () => {
        if (!processedDoc || !originalZip) {
            message.error('没有可下载的文件。请先上传一个ZIP包。');
            return;
        }

        const newZip = new JSZip();
        const currentValues = form.getFieldsValue(true); // Get all fields
        const finalSlug = generateSlug(extractSlugFromUrl(currentValues.canonicalUrl) || currentValues.ogTitle || 'untitled');
        const imageFolderName = `${finalSlug}-img`;

        const docClone = processedDoc.cloneNode(true) as Document;

        // --- Final, definitive Alt Text Sync ---
        imageFiles.forEach(imageFile => {
            const altValue = currentValues[imageFile.originalPath];
            if (altValue !== undefined) {
                const imgElement = Array.from(docClone.querySelectorAll('img')).find(img => 
                    img.getAttribute('src')?.endsWith(imageFile.originalPath.split('/').pop() || '')
                );
                if (imgElement) {
                    imgElement.setAttribute('alt', altValue);
                }
            }
        });
        
        docClone.querySelectorAll('img').forEach(img => {
            const originalSrc = img.getAttribute('src');
            if (originalSrc) {
                const fileName = originalSrc.split('/').pop() || '';
                const newPath = `${imageFolderName}/${fileName}`;
                img.setAttribute('src', newPath);
                const parentLink = img.closest('a');
                if (parentLink) {
                    const originalHref = parentLink.getAttribute('href');
                    if (originalHref?.split('/').pop() === fileName) {
                        parentLink.setAttribute('href', newPath);
                    }
                }
            }
        });

        const finalHtml = '<!DOCTYPE html>\n' + docClone.documentElement.outerHTML;
        newZip.file(`index.html`, finalHtml);

        const imageAddPromises = imageFiles.map(async (imageFile) => {
            const file = originalZip.file(imageFile.originalPath);
            if (file) {
                const data = await file.async('uint8array');
                const fileName = imageFile.originalPath.split('/').pop() || '';
                newZip.file(`${imageFolderName}/${fileName}`, data);
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

    const handleAiOptimization = async (provider: string) => {
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
            if (provider === 'gemini') {
                seoData = await callGeminiAPI(apiKey, prompt);
            } else {
                seoData = await callOpenAICompatibleAPI(provider, apiKey, prompt);
            }
            const newValues = {
                metaDescription: seoData.meta_description,
                keywords: seoData.keywords,
            };
            form.setFieldsValue(newValues);
            handleFormChange(newValues);
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
        </Layout>
    );
};

export default App; 