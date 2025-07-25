import React from 'react';
import { Button, Form, Modal, Tabs, Input, message, Timeline, Tag } from 'antd';
import type { TabsProps } from 'antd';
import { changelog, ChangelogEntry } from '../data/changelog';

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
        }
      });
      message.success('API Keys 已更新。');
      onClose();
    });
  };

  // 渲染更新日志的函数
  const renderChangelog = () => {
    const getTypeColor = (type: ChangelogEntry['type']) => {
      switch (type) {
        case 'feature':
          return 'green';
        case 'bugfix':
          return 'red';
        case 'improvement':
          return 'blue';
        default:
          return 'default';
      }
    };

    const getTypeLabel = (type: ChangelogEntry['type']) => {
      switch (type) {
        case 'feature':
          return '新功能';
        case 'bugfix':
          return '修复';
        case 'improvement':
          return '改进';
        default:
          return type;
      }
    };

    return (
      <Timeline style={{ marginTop: 20 }}>
        {changelog.map((entry, index) => (
          <Timeline.Item
            key={entry.version}
            color={getTypeColor(entry.type)}
          >
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold', fontSize: 16 }}>
                v{entry.version}
              </span>
              {index === 0 && (
                <Tag color="red" style={{ marginLeft: 8 }}>
                  NEW
                </Tag>
              )}
              <Tag color={getTypeColor(entry.type)} style={{ marginLeft: 8 }}>
                {getTypeLabel(entry.type)}
              </Tag>
              <span style={{ color: '#999', marginLeft: 8 }}>
                {entry.date}
              </span>
            </div>
            <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
              {entry.changes.map((change, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  {change}
                </li>
              ))}
            </ul>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  const tabItems: TabsProps['items'] = [
    ...providers.map(provider => ({
    key: provider.key,
    label: provider.label,
    children: (
        <div>
          <p style={{ marginBottom: 16 }}>输入您的 {provider.label} API Key。密钥将仅保存在您的浏览器中。</p>
          <Form form={form} layout="vertical">
      <Form.Item
        name={provider.key}
        label={`${provider.label} API Key:`}
        initialValue={localStorage.getItem(`${provider.key}_api_key`) || ''}
      >
        <Input.Password placeholder="sk-..." />
      </Form.Item>
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          </Form>
        </div>
    ),
    })),
    {
      key: 'changelog',
      label: '更新日志',
      children: renderChangelog(),
    },
  ];

  return (
    <Modal
      title="设置"
      open={open}
      onCancel={onClose}
      width={600}
      footer={null}
    >
        <Tabs defaultActiveKey="deepseek" items={tabItems} />
    </Modal>
  );
};

export default SettingsModal;