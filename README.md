# Notion 文章 SEO 与阅读体验优化工具

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-blue?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.2.2-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-5.0.8-green?style=flat-square&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Ant%20Design-5.12.8-1890ff?style=flat-square&logo=antdesign" alt="Ant Design">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
</p>

一款强大且易用的在线编辑器，专为优化从 Notion 导出的 HTML 文章而设计。它不仅能一键完成繁琐的 SEO 设置，还能自动增强文章的阅读体验，使其更适合发布到博客或个人网站。

**🌟 在线体验**: [https://eric-geek.github.io/SEO-blog--editor/](https://eric-geek.github.io/SEO-blog--editor/)

---

![应用截图](https://raw.githubusercontent.com/Eric-Geek/SEO-blog--editor/main/img/Snipaste_2024-05-27_01-44-30.png)

## 📋 目录

- [核心功能](#-核心功能)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [详细使用指南](#-详细使用指南)
- [AI 集成](#-ai-集成)
- [项目架构](#-项目架构)
- [开发指南](#-开发指南)
- [部署](#-部署)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

## ✨ 核心功能

### 🔍 SEO 强化
- **📦 ZIP 无缝处理**: 直接上传 Notion 导出的 `.zip` 包，工具会自动解析 HTML 和图片资源
- **🤖 AI 一键优化**: 集成多种大语言模型 API，一键为文章生成高质量的 `Meta Description` 和 `Keywords`
  - ✅ **DeepSeek** - 高性价比中文优化
  - ✅ **OpenAI (ChatGPT)** - 业界标准
  - ✅ **Google (Gemini)** - 多模态AI
  - ✅ **月之暗面 (Kimi)** - 长文本处理
- **📝 全方位元标签编辑**:
  - 提供对 `Meta Description`, `Keywords`, `Canonical URL` 的完整编辑功能，并附带实时字数统计
  - **高级 Open Graph (OG) 控制**:
    - **智能同步**: `og:url` 标签会自动与 `Canonical URL` 保持同步
    - **灵活的 OG 图片**: 可在两套预设的图片链接和自定义图片 URL 之间自由切换
    - **OG 类型设置**: 支持自定义 `og:type` 标签（默认为 `website`）
    - **预设方案**: 内置两套可切换的预设值，一键填充关键信息
- **🖼️ 图片 Alt 文本优化**: 自动提取所有图片，生成默认 `Alt` 文本，并支持在编辑器中实时修改
- **🔗 智能命名与打包**: 根据 `Canonical URL` 自动生成符合 SEO 规范的文件名和图片文件夹名

### 📖 阅读体验增强
- **📑 自动生成目录 (TOC)**: 分析文章中的 H2 标题，自动在文章侧边生成一个美观、可交互的悬浮目录
- **🚀 平滑滚动与高亮**: 点击目录项可平滑滚动至对应章节，并实时高亮当前所在章节
- **📊 阅读进度条**: 在页面顶部提供一个阅读进度条，直观地显示文章的阅读进度
- **💅 CSS 样式净化**: 自动移除 Notion 导出时多余的页面居中和宽度限制样式
- **📱 响应式预览**: 支持桌面、平板、手机三种设备的实时预览

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18.2.0 | 前端框架 |
| **TypeScript** | 5.2.2 | 类型安全 |
| **Vite** | 5.0.8 | 构建工具 |
| **Ant Design** | 5.12.8 | UI 组件库 |
| **JSZip** | 3.10.1 | ZIP 文件处理 |

## 🚀 快速开始

### 在线使用
直接访问 [在线版本](https://eric-geek.github.io/SEO-blog--editor/) 即可开始使用，无需安装。

### 本地开发

```bash
# 克隆项目
git clone https://github.com/Eric-Geek/SEO-blog--editor.git

# 进入项目目录
cd SEO-blog--editor

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 📚 详细使用指南

### 1. 文件上传
- 点击 **"上传 Notion 导出的 ZIP 包"** 按钮
- 选择从 Notion 导出的 `.zip` 文件
- 系统将自动解析 HTML 内容和图片资源

### 2. SEO 优化流程

#### 手动优化
1. **核心关键词**: 输入文章的主要关键词
2. **Meta Description**: 编辑描述文本（建议 140-160 字符）
3. **Keywords**: 设置关键词（建议 3-4 个，逗号分隔）
4. **Canonical URL**: 设置规范链接
5. **Open Graph**: 配置社交媒体分享信息

#### AI 自动优化
1. 点击右上角 **⚙️** 设置 API Key
2. 输入核心关键词
3. 选择 AI 服务商（DeepSeek/OpenAI/Gemini/Kimi）
4. 点击 **"✨ AI 一键优化"** 按钮

### 3. 预设方案切换
- **预设 01 (glbgpt.com)**: 适用于 GlobalGPT 平台
- **预设 02 (penligent.ai)**: 适用于 Penligent AI 平台
- 支持一键切换 Canonical URL 和 Open Graph 设置

### 4. 图片优化
- 系统自动提取所有图片
- 为每张图片自动生成默认 Alt 文本
- 支持手动编辑 Alt 文本内容

### 5. 预览与下载
- **响应式预览**: 支持桌面/平板/手机三种设备视图
- **实时预览**: 所有修改立即在右侧预览区域显示
- **打包下载**: 点击下载按钮获取优化后的 ZIP 文件

## 🤖 AI 集成

### 支持的 AI 服务商

| 服务商 | 模型 | 特点 | API 端点 |
|--------|------|------|----------|
| **DeepSeek** | deepseek-chat | 高性价比，中文优化 | api.deepseek.com |
| **OpenAI** | gpt-3.5-turbo | 业界标准，稳定可靠 | api.openai.com |
| **Gemini** | gemini-pro | Google 多模态AI | generativelanguage.googleapis.com |
| **Kimi** | moonshot-v1-8k | 长文本处理能力强 | api.moonshot.cn |

### API Key 管理
- 所有 API Key 仅保存在浏览器本地存储
- 支持多个服务商同时配置
- 一键切换不同 AI 服务

### AI 优化策略
```typescript
// AI 提示词策略
const prompt = `
请你扮演一位专业的谷歌SEO专家。我的核心关键词是 "${coreKeyword}"。
基于以下HTML文章内容，请围绕我的核心关键词，为我生成对谷歌搜索引擎友好的SEO元数据。

要求：
1. meta_description: 140-160 字符，包含核心关键词
2. keywords: <100 字符，3-4 个相关关键词
`;
```

## 🏗️ 项目架构

```
src/
├── components/           # React 组件
│   ├── ControlPanel.tsx # 主控制面板
│   └── SettingsModal.tsx# 设置模态框
├── utils/               # 工具函数
│   ├── api.ts          # AI API 调用
│   ├── domEnhancer.ts  # DOM 增强功能
│   ├── domUtils.ts     # DOM 操作工具
│   └── stringUtils.ts  # 字符串处理
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

### 核心模块说明

#### 🎛️ ControlPanel 组件
- SEO 表单管理
- 文件上传处理
- AI 优化控制
- 预设方案切换

#### 🔧 domEnhancer 工具
- 自动生成目录 (TOC)
- 注入阅读进度条
- CSS 样式清理
- 响应式预览准备

#### 🌐 API 集成
- 统一的 AI API 调用接口
- 支持多种服务商
- 错误处理和重试机制

## 👨‍💻 开发指南

### 开发环境要求
- Node.js >= 16
- npm >= 7

### 代码规范
```bash
# 类型检查
npm run type-check

# 代码格式化（如果配置了）
npm run format

# 代码检查（如果配置了）
npm run lint
```

### 添加新的 AI 服务商

1. 在 `src/utils/api.ts` 中添加新的 API 配置
2. 在 `src/components/SettingsModal.tsx` 中添加新的设置选项
3. 在 `src/components/ControlPanel.tsx` 中添加选择器选项

```typescript
// 示例：添加新的 AI 服务商
const apiDetails = {
  // 现有服务商...
  newProvider: { 
    url: 'https://api.newprovider.com/v1/chat/completions', 
    model: 'new-model-v1' 
  }
};
```

### 自定义预设方案

在 `App.tsx` 中修改 `presets` 对象：

```typescript
const presets: Record<string, Preset> = {
  preset1: {
    canonicalPrefix: 'https://your-domain.com/blog/',
    ogTitle: 'Your Site Title',
    ogDescription: 'Your site description',
    ogImage: 'https://your-cdn.com/default-image.png',
    ogType: 'website'
  },
  // 添加更多预设...
};
```

## 🚀 部署

### GitHub Pages 部署

```bash
# 构建项目
npm run build

# 部署到 GitHub Pages（如果配置了）
npm run deploy
```

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 设置构建命令：`npm run build`
3. 设置输出目录：`dist`
4. 自动部署

### Netlify 部署

1. 拖拽 `dist` 文件夹到 Netlify
2. 或者连接 GitHub 仓库自动部署

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork** 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 **Pull Request**

### 贡献方向

- 🐛 Bug 修复
- ✨ 新功能开发
- 📖 文档改进
- 🎨 UI/UX 优化
- 🚀 性能优化
- 🌐 国际化支持
- 🧪 测试覆盖

### 问题反馈

如果您发现 bug 或有功能建议，请：

1. 搜索现有的 [Issues](https://github.com/Eric-Geek/SEO-blog--editor/issues)
2. 如果没有相关问题，创建新的 Issue
3. 提供详细的问题描述和复现步骤

## 📄 许可证

该项目采用 **MIT License**。详情请参阅 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [React](https://reactjs.org/) - 强大的前端框架
- [Ant Design](https://ant.design/) - 优秀的 React UI 库
- [Vite](https://vitejs.dev/) - 快速的构建工具
- [JSZip](https://stuk.github.io/jszip/) - ZIP 文件处理库

## 📞 联系方式

- **作者**: [Eric Geek](https://github.com/eric-geek)
- **项目地址**: [GitHub](https://github.com/Eric-Geek/SEO-blog--editor)
- **在线演示**: [Demo](https://eric-geek.github.io/SEO-blog--editor/)

---

<p align="center">
  如果这个项目对您有帮助，请给它一个 ⭐ Star！
</p> 
