# Notion 文章 SEO 与阅读体验优化工具

一款强大且易用的在线编辑器，专为优化从 Notion 导出的 HTML 文章而设计。它不仅能一键完成繁琐的 SEO 设置，还能自动增强文章的阅读体验，使其更适合发布到博客或个人网站。

**在线体验**: [https://eric-geek.github.io/SEO-blog--editor/](https://eric-geek.github.io/SEO-blog--editor/)

---

![应用截图](https://raw.githubusercontent.com/Eric-Geek/SEO-blog--editor/main/img/Snipaste_2024-05-27_01-44-30.png)

## ✨ 核心功能

### SEO 强化
- **📦 ZIP 无缝处理**: 直接上传 Notion 导出的 `.zip` 包，工具会自动解析 HTML 和图片资源。
- **🤖 AI 一键优化**: 集成多种大语言模型 API，一键为文章生成高质量的 `Meta Description` 和 `Keywords`。
  - 支持 **DeepSeek**, **OpenAI (ChatGPT)**, **Google (Gemini)**, **月之暗面 (Kimi)**。
- **📝 全方位元标签编辑**:
  - 提供对 `Meta Description`, `Keywords`, `Canonical URL` 的完整编辑功能，并附带实时字数统计。
  - **高级 Open Graph (OG) 控制**:
    - **智能同步**: `og:url` 标签会自动与 `Canonical URL` 保持同步，确保社交分享链接的统一性。
    - **灵活的 OG 图片**: 可在两套预设的图片链接和自定义图片 URL 之间自由切换。
    - **OG 类型设置**: 支持自定义 `og:type` 标签（默认为 `website`）。
    - **预设方案**: 内置两套可切换的预设值，一键填充 `og:title`, `og:description` 等关键信息。
- **🖼️ 图片 Alt 文本优化**: 自动提取所有图片，生成默认 `Alt` 文本，并支持在编辑器中实时修改。
- **🔗 智能命名与打包**:
  - 根据 `Canonical URL` 自动生成符合 SEO 规范的 `.zip` 文件名和图片文件夹名。
  - 将优化后的 HTML 和所有图片资源重新打包成一个结构清晰的 `.zip` 文件。

### 阅读体验增强
- **📑 自动生成目录 (TOC)**: 分析文章中的 H2 标题，自动在文章侧边生成一个美观、可交互的悬浮目录。
- **🚀 平滑滚动与高亮**: 点击目录项可平滑滚动至对应章节，并实时高亮当前所在章节。
- **📊 阅读进度条**: 在页面顶部提供一个阅读进度条，直观地显示文章的阅读进度。
- **💅 CSS 样式净化**: 自动移除 Notion 导出时多余的页面居中和宽度限制样式。

## 🚀 快速上手

1.  **上传文件**: 点击“上传 Notion 导出的 ZIP 包”按钮选择文件。
2.  **设置 API Key (可选)**: 如果希望使用 AI 功能，点击右上角的 **⚙️** 图标，在弹出的模态框中选择服务商并输入您的 API Key。密钥仅保存在浏览器本地。
3.  **内容优化**:
    - **AI 优化**: 选择一个 AI 模型，点击“✨ AI 一键优化”。
    - **手动调整**: 检查并调整 Meta 标签、Canonical URL 等。
    - **OG 预设**: 在“社交媒体 Meta 标签”部分，通过下拉菜单选择最适合的预设。
    - **图片 Alt**: 为图片列表中的每一项填写或修改 `Alt` 文本。
4.  **预览与下载**: 在右侧实时预览所有改动。确认无误后，点击“生成并下载优化后的ZIP包”按钮，即可获得最终文件。

## 🛠️ 本地运行

1.  克隆本仓库到本地:
    ```bash
    git clone https://github.com/Eric-Geek/SEO-blog--editor.git
    ```
2.  进入项目目录:
    ```bash
    cd SEO-blog--editor
    ```
3.  直接在浏览器中打开 `index.html` 文件即可开始使用。

## 📄 开源协议

该项目采用 **MIT License**。详情请参阅 [LICENSE](LICENSE) 文件。

---
由 [Eric Geek](https://github.com/eric-geek) 开发和设计 
