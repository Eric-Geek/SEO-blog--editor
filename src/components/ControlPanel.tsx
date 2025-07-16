import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Upload, message, Select, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd/es/upload/interface';
import type { FormInstance } from 'antd/es/form';
import type { ImageFile } from '../App';

const { TextArea } = Input;

export interface SeoData {
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string; // Add this line
  coreKeyword: string;
  presetScheme: string;
}

interface ControlPanelProps {
  initialData?: SeoData;
  imageFiles: ImageFile[];
  onFileSelect: (file: File) => void;
  onValuesChange: (changedValues: any, allValues: any) => void;
  onDownload: () => void;
  form: FormInstance;
  onAiOptimize: (provider: string, coreKeyword: string) => void;
  onPresetChange: (presetKey: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  initialData, 
  imageFiles,
  onFileSelect,
  onValuesChange,
  onDownload,
  form,
  onAiOptimize,
  onPresetChange,
}) => {
  const [aiProvider, setAiProvider] = useState('deepseek');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [ogImageSource, setOgImageSource] = useState('preset');

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
    }
  }, [initialData, form]);

  useEffect(() => {
    // Check initial value of ogImage to set the initial state of ogImageSource
    const ogImageValue = form.getFieldValue('ogImage');
    if (ogImageValue && !['glbgpt.webp', 'penligent.webp'].includes(ogImageValue)) {
      setOgImageSource('custom');
    } else {
      setOgImageSource('preset');
    }
  }, [form]);

  const handleOgImageSourceChange = (value: string) => {
    setOgImageSource(value);
    if (value === 'preset') {
      // When switching back to presets, we might want to set a default
      // Here, we check the current presetScheme and set the corresponding image.
      const currentPreset = form.getFieldValue('presetScheme');
      form.setFieldsValue({ ogImage: currentPreset === 'preset1' ? 'glbgpt.webp' : 'penligent.webp' });
    } else {
      // When switching to custom, clear the field
      form.setFieldsValue({ ogImage: '' });
    }
  };

  const handleOgImagePresetChange = (value: string) => {
    form.setFieldsValue({ ogImage: value });
  };


  const handleAiClick = async () => {
    setIsAiLoading(true);
    const coreKeyword = form.getFieldValue('coreKeyword') || '';
    await onAiOptimize(aiProvider, coreKeyword);
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

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="coreKeyword"
          label="核心关键词 (Core Keyword)"
          tooltip="输入本文最想优化的核心词，AI 将围绕它进行优化。"
        >
          <Input placeholder="例如: AI website builders" />
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
      </Card>

      <Form.Item
        name="metaDescription"
        label="2. Meta Description"
      >
        <TextArea rows={4} maxLength={160} showCount />
      </Form.Item>

      <Form.Item
        name="keywords"
        label="3. Keywords"
      >
        <Input maxLength={100} showCount />
      </Form.Item>

      <Form.Item
        name="presetScheme"
        label="统一预设方案"
        tooltip="切换此选项会自动更新下方的 Canonical URL 和 Open Graph 预设值"
      >
        <Select onChange={onPresetChange}>
          <Select.Option value="preset1">预设 01 (glbgpt.com)</Select.Option>
          <Select.Option value="preset2">预设 02 (penligent.ai)</Select.Option>
        </Select>
      </Form.Item>
      
      <Form.Item
        name="canonicalUrl"
        label="4. Canonical URL"
      >
        <Input />
      </Form.Item>

      <Card title="5. 社交媒体 Meta 标签 (Open Graph)" size="small">
        <Form.Item name="ogTitle" label="OG Title">
          <Input />
        </Form.Item>
        <Form.Item name="ogDescription" label="OG Description">
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item label="OG Image"
        tooltip="可选择预设图片或自定义图片链接。预设图片将包含在最终下载的 ZIP 包中。">
          <Select value={ogImageSource} onChange={handleOgImageSourceChange} style={{ width: 120, marginRight: 8 }}>
            <Select.Option value="preset">预设图片</Select.Option>
            <Select.Option value="custom">自定义链接</Select.Option>
          </Select>
          {ogImageSource === 'preset' ? (
            <Form.Item name="ogImage" noStyle>
              <Select style={{ width: 'calc(100% - 128px)' }} onChange={handleOgImagePresetChange}>
                <Select.Option value="glbgpt.webp">预设 01 (glbgpt.webp)</Select.Option>
                <Select.Option value="penligent.webp">预设 02 (penligent.webp)</Select.Option>
              </Select>
            </Form.Item>
          ) : (
            <Form.Item name="ogImage" noStyle>
              <Input style={{ width: 'calc(100% - 128px)' }} placeholder="输入图片链接" />
            </Form.Item>
          )}
        </Form.Item>
        <Form.Item name="ogType" label="OG Type" tooltip="建议使用 article 或 website">
          <Input />
        </Form.Item>
      </Card>

      <Form.Item label="6. 图片 Alt 文本">
        {imageFiles.length > 0 ? (
          imageFiles.map((image) => (
            <div key={image.originalPath} style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
              <img src={image.blobUrl} alt="preview" style={{ width: 40, height: 40, objectFit: 'cover', marginRight: 12, borderRadius: 4 }} />
              <Form.Item
                name={image.originalPath}
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