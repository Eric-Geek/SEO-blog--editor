# Notion 文章 SEO 优化工具

一个帮助您快速优化从 Notion 导出的 HTML 文章并进行 SEO 强化的在线工具。

**在线访问**: [https://eric-geek.github.io/SEO-blog--editor/](https://eric-geek.github.io/SEO-blog--editor/)

---

我们一起将繁琐的手动 SEO 优化流程自动化，构建了一个强大、易用的 Web 工具。这个项目完美解决了 Notion 用户在文章发布前面临的 SEO 痛点。

## ✨ 核心功能

- **📦 ZIP 包处理**: 直接上传并解析从 Notion 导出的 `.zip` 压缩包，无需手动解压。
- **🤖 AI 一键优化**: 集成 DeepSeek API，一键自动为您的文章生成优化的 `Meta Description` 和 `Keywords`。
- **🖼️ 智能图片处理**:
  - 自动为所有图片生成以文件名作为默认值的 `Alt` 文本。
  - 在编辑器中实时预览所有图片，并支持手动修改 `Alt` 文本。
- **📝 全面的 SEO 标签编辑**:
  - 提供对 `Meta Description`, `Keywords`, `Canonical URL` 的完整编辑功能。
  - 为社交媒体分享（Open Graph）自动填充可编辑的默认 `og:title`, `og:description` 和 `og:image` 标签。
- **🔗 智能命名与打包**:
  - 根据您设置的 `Canonical URL` 自动生成符合 URL 规范的文件名。
  - 将优化后的 HTML 文件和所有图片资源重新打包成一个新的 `.zip` 文件供您下载。
- **✒️ 作者署名**: 在页面底部添加了您的署名和 GitHub 链接。

## 🚀 如何使用

1.  **上传文件**: 点击“上传 Notion 导出的 ZIP 包”按钮选择文件。
2.  **设置API Key (可选)**: 如果您想使用 AI 功能，请点击右上角的 ⚙️ 图标，输入您的 DeepSeek, Google, OpenAI, MoonShot API Key。
3.  **进行优化**:
    - 点击“✨ AI 一键优化”按钮，让 AI 为您生成描述和关键词。
    - 手动检查并调整所有 SEO 相关的输入框。
    - 检查并优化图片 `Alt` 文本。
4.  **下载**: 点击“生成并下载优化后的ZIP包”按钮，即可获得处理好的文件。

## 🛠️ 本地开发

如果您希望在本地运行或进行二次开发，请按以下步骤操作：

1.  克隆仓库:
    ```bash
    git clone https://github.com/Eric-Geek/SEO-blog--editor.git
    ```
2.  进入项目目录:
    ```bash
    cd SEO-blog--editor
    ```
3.  在浏览器中打开 `index.html` 文件即可开始使用。

## 📄 开源协议

该项目采用 **MIT License**。详情请参阅 [LICENSE](LICENSE) 文件。

---
由 [Eric Geek](https://github.com/eric-geek) 开发和设计 
