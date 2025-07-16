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
  ogUrl: string;
  ogType: string;
  coreKeyword: string;
  presetScheme: string;
}

interface ControlPanelProps {
  initialData?: SeoData;
  onFileSelect: (file: File) => void;
  onDownload: () => void;
  onAiOptimize: (provider: string, coreKeyword: string) => void;
  onPresetChange: (presetKey: string) => void;
  onValuesChange: (changedValues: any, allValues: any) => void;
  imageFiles: ImageFile[];
  form: FormInstance<SeoData>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  initialData, 
  onFileSelect,
  onDownload,
  onAiOptimize,
  onPresetChange,
  onValuesChange,
  imageFiles,
  form,
}) => {
  const [ogImageSource, setOgImageSource] = useState('preset');
  const [aiProvider, setAiProvider] = useState('deepseek');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
      const ogImageValue = initialData.ogImage;
      if (ogImageValue && ![
          'https://static.futureshareai.com/glb_v3_bb/glbgpt.webp', 
          'https://static.futureshareai.com/glb_v3_bb/penligent.webp'
      ].includes(ogImageValue)) {
        setOgImageSource('custom');
      } else {
        setOgImageSource('preset');
      }
    }
  }, [initialData, form]);

  const handleOgImageSourceChange = (value: string) => {
    setOgImageSource(value);
    if (value === 'preset') {
      const currentPreset = form.getFieldValue('presetScheme');
      const newOgImage = currentPreset === 'preset1' 
        ? 'https://static.futureshareai.com/glb_v3_bb/glbgpt.webp' 
        : 'https://static.futureshareai.com/glb_v3_bb/penligent.webp';
      form.setFieldsValue({ ogImage: newOgImage });
      onValuesChange({ ogImage: newOgImage }, form.getFieldsValue());
    } else {
      form.setFieldsValue({ ogImage: '' });
      onValuesChange({ ogImage: '' }, form.getFieldsValue());
    }
  };

  const handleOgImagePresetChange = (value: string) => {
    form.setFieldsValue({ ogImage: value });
    onValuesChange({ ogImage: value }, form.getFieldsValue());
  };

  const handleAiClick = async () => {
    const coreKeyword = form.getFieldValue('coreKeyword');
    if (!coreKeyword) {
      message.warning('请输入核心关键词以进行 AI 优化。');
      return;
    }
    setIsAiLoading(true);
    await onAiOptimize(aiProvider, coreKeyword);
    setIsAiLoading(false);
  };

  const handleRemoveFile = () => {
    // This function should reset the state in the App component
    // For now, we can just clear the form, but a more robust solution
    // would involve calling a prop function to reset App's state.
    form.resetFields();
    // Maybe call a prop to clear other state like processedDoc, imageFiles etc.
    return true; // To confirm removal
  };

  const props: UploadProps = {
    name: 'file',
    accept: '.zip',
    showUploadList: true,
    maxCount: 1,
    onRemove: handleRemoveFile,
    beforeUpload: (file) => {
      onFileSelect(file);
      return false;
    },
  };

  return (
    <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
      <Form.Item>
        <Upload {...props}>
          <Button icon={<UploadOutlined />} block>
            上传 Notion 导出的 ZIP 包
          </Button>
        </Upload>
      </Form.Item>

      <Card title="1. 核心关键词" size="small">
        <Form.Item
          name="coreKeyword"
          tooltip="输入您文章最重要的核心关键词，用于 AI 生成 Description 和 Keywords"
        >
          <Input placeholder="例如：最佳 Notion 模板" />
        </Form.Item>
      </Card>
      
        <Form.Item>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select value={aiProvider} onChange={setAiProvider} style={{ flex: 1 }}>
              <Select.Option value="deepseek">DeepSeek</Select.Option>
              <Select.Option value="openai">OpenAI</Select.Option>
                <Select.Option value="gemini">Gemini</Select.Option>
                <Select.Option value="kimi">Kimi</Select.Option>
            </Select>
            <Button
                type="primary"
                onClick={handleAiClick}
                style={{ flex: 2 }}
                loading={isAiLoading}
            >
              ✨ AI 一键优化
            </Button>
          </div>
        </Form.Item>

      <Form.Item
        name="metaDescription"
        label="2. Meta Description"
        tooltip="长度建议在 140-160 个字符之间"
      >
        <TextArea rows={4} showCount maxLength={160} />
      </Form.Item>

      <Form.Item
        name="keywords"
        label="3. Keywords"
        tooltip="建议 3-4 个关键词，用英文逗号隔开"
      >
        <Input showCount maxLength={100} />
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
        <Form.Item name="ogUrl" label="OG URL" tooltip="此链接将自动与上方的 Canonical URL 保持一致">
          <Input disabled />
        </Form.Item>
        <Form.Item label="OG Image"
        tooltip="可选择预设的图片链接或自定义图片链接。">
          <Select value={ogImageSource} onChange={handleOgImageSourceChange} style={{ width: 120, marginRight: 8 }}>
            <Select.Option value="preset">预设链接</Select.Option>
            <Select.Option value="custom">自定义链接</Select.Option>
          </Select>
          {ogImageSource === 'preset' ? (
            <Form.Item name="ogImage" noStyle>
              <Select style={{ width: 'calc(100% - 128px)' }} onChange={handleOgImagePresetChange}>
                <Select.Option value="https://static.futureshareai.com/glb_v3_bb/glbgpt.webp">预设 01 (glbgpt)</Select.Option>
                <Select.Option value="https://static.futureshareai.com/glb_v3_bb/penligent.webp">预设 02 (penligent)</Select.Option>
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