import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Upload, message, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd/es/upload/interface';
import type { FormInstance } from 'antd/es/form';
import type { ImageFile } from '../App'; // Import from App

const { TextArea } = Input;

export interface SeoData {
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

interface ControlPanelProps {
  initialData?: SeoData;
  imageFiles: ImageFile[];
  onFileSelect: (file: File) => void;
  onValuesChange: (changedValues: any, allValues: any) => void;
  onImageAltChange: (originalPath: string, newAlt: string) => void;
  onDownload: () => void;
  form: FormInstance; // Receive form instance from parent
  onAiOptimize: (provider: string) => void;
}

const ogPresets = {
    preset1: {
        ogTitle: 'GlobalGPT Free AI Tools : All-in-One Access to ChatGPT',
        ogDescription: "Explore GlobalGPT's free AI models and tools. Enjoy ChatGPT and top models for coding, content creation, and multimedia generation—no account switching needed.",
        ogImage: 'https://www.glbgpt.com/home'
    },
    preset2: {
        ogTitle: 'Penligent AI: CursorOS built for Security Engineers',
        ogDescription: 'PenligentAI is building the CursorOS for security professionals — an intelligent AI-powered penetration testing tool that streamlines the entire process from reconnaissance and vulnerability scanning to exploitation and report generation. By leveraging the power of large language models (LLMs), PenligentAI runs end-to-end tests autonomously, with every step clearly traceable and transparent. It’s the secret weapon for professionals and a must-have tool for organizations conducting security assessments.',
        ogImage: 'https://penligent.ai/'
    }
};

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  initialData, 
  imageFiles,
  onFileSelect,
  onValuesChange,
  onImageAltChange,
  onDownload,
  form,
  onAiOptimize,
}) => {
  const [aiProvider, setAiProvider] = useState('deepseek');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      // If OG fields are empty, populate with preset1 by default
      const ogDataToSet = {
        ...initialData,
        ogTitle: initialData.ogTitle || ogPresets.preset1.ogTitle,
        ogDescription: initialData.ogDescription || ogPresets.preset1.ogDescription,
        ogImage: initialData.ogImage || ogPresets.preset1.ogImage,
      };
      form.setFieldsValue(ogDataToSet);
    }
  }, [initialData, form]);

  const handlePresetChange = (value: string) => {
    const preset = value === 'preset1' ? ogPresets.preset1 : ogPresets.preset2;
    form.setFieldsValue({
      ogTitle: preset.ogTitle,
      ogDescription: preset.ogDescription,
      ogImage: preset.ogImage,
    });
    // Manually trigger onValuesChange to update the parent state
    onValuesChange({
      ogTitle: preset.ogTitle,
      ogDescription: preset.ogDescription,
      ogImage: preset.ogImage,
    }, form.getFieldsValue());
  };

  const handleAiClick = async () => {
    setIsAiLoading(true);
    await onAiOptimize(aiProvider);
    setIsAiLoading(false);
  };

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.zip',
    beforeUpload: (file) => {
      const isZip = file.type === 'application/zip' || file.name.endsWith('.zip');
      if (!isZip) {
        message.error(`${file.name} is not a zip file`);
      } else {
        onFileSelect(file);
      }
      return false;
    },
    maxCount: 1,
  };

  return (
    <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
      <Form.Item label="1. 上传 Notion 导出的 ZIP 包">
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>选择 ZIP 文件</Button>
        </Upload>
      </Form.Item>

      <Form.Item>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select value={aiProvider} onChange={setAiProvider} style={{ width: 120 }}>
            <Select.Option value="deepseek">DeepSeek</Select.Option>
            <Select.Option value="openai">OpenAI</Select.Option>
            <Select.Option value="gemini">Google</Select.Option>
            <Select.Option value="moonshot">月之暗面</Select.Option>
          </Select>
          <Button type="primary" block onClick={handleAiClick} loading={isAiLoading}>
            ✨ AI 一键优化
          </Button>
        </div>
      </Form.Item>

      <Form.Item
        name="metaDescription"
        label="2. Meta Description (140-160字符)"
      >
        <TextArea rows={4} maxLength={160} showCount />
      </Form.Item>

      <Form.Item
        name="keywords"
        label="3. Keywords (最多100字符)"
      >
        <Input maxLength={100} showCount />
      </Form.Item>

      <Form.Item
        name="canonicalUrl"
        label="4. Canonical URL"
      >
        <Input placeholder="例如: https://example.com/original-article" />
      </Form.Item>

      <Form.Item label="5. 社交媒体 Meta 标签 (Open Graph)">
        <Select defaultValue="preset1" onChange={handlePresetChange} style={{ marginBottom: 16 }}>
          <Select.Option value="preset1">预设 01</Select.Option>
          <Select.Option value="preset2">预设 02</Select.Option>
        </Select>
        <Form.Item name="ogTitle" label="OG Title">
          <Input />
        </Form.Item>
        <Form.Item name="ogDescription" label="OG Description">
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item name="ogImage" label="OG Image URL">
          <Input />
        </Form.Item>
      </Form.Item>

      <Form.Item label="6. 图片 Alt 文本">
        {imageFiles.length > 0 ? (
          imageFiles.map((image) => (
            <div key={image.originalPath} style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
              <img src={image.blobUrl} alt="preview" style={{ width: 40, height: 40, objectFit: 'cover', marginRight: 12, borderRadius: 4 }} />
              <Form.Item
                name={image.originalPath} // Use originalPath as a unique field name
                noStyle
                initialValue={image.alt}
              >
                <Input
                  placeholder={image.originalPath.split('/').pop()}
                />
              </Form.Item>
            </div>
          ))
        ) : (
          <p>上传 ZIP 包后，这里会显示图片列表以供编辑。</p>
        )}
      </Form.Item>

      <Form.Item>
        <Button type="primary" block onClick={onDownload}>
          生成并下载优化后的ZIP包
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ControlPanel; 