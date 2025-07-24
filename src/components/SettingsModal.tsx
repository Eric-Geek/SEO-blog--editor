import React from 'react';
import { Button, Form, Modal, Tabs, Input, message } from 'antd';
import type { TabsProps } from 'antd';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const providers = [
  { key: 'deepseek', label: 'DeepSeek' },
  { key: 'openai', label: 'OpenAI' },
  { key: 'gemini', label: 'Google' },
  { key: 'kimi', label: 'Kimi' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();

  const handleSave = () => {
    form.validateFields().then(values => {
      Object.entries(values).forEach(([key, value]) => {
        if (value) {
          localStorage.setItem(`${key}_api_key`, value as string);
        } else {
          localStorage.removeItem(`${key}_api_key`);
        }
      });
      message.success('API Keys 已更新。');
      onClose();
    });
  };

  const tabItems: TabsProps['items'] = providers.map(provider => ({
    key: provider.key,
    label: provider.label,
    children: (
      <Form.Item
        name={provider.key}
        label={`${provider.label} API Key:`}
        initialValue={localStorage.getItem(`${provider.key}_api_key`) || ''}
      >
        <Input.Password placeholder="sk-..." />
      </Form.Item>
    ),
  }));

  return (
    <Modal
      title="设置 API Keys"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSave}>
          保存全部
        </Button>,
      ]}
    >
      <p>选择服务商并输入您的API Key。密钥将仅保存在您的浏览器中。</p>
      <Form form={form} layout="vertical">
        <Tabs defaultActiveKey="deepseek" items={tabItems} />
      </Form>
    </Modal>
  );
};

export default SettingsModal; 