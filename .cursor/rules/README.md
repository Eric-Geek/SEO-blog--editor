# Cursor 规则文档

这个目录包含了 SEO 博客编辑器项目的所有 Cursor 规则，帮助 AI 助手更好地理解项目结构和开发规范。

## 规则文件概览

### 🏗️ 项目基础
- **[project-overview.mdc](project-overview.mdc)** - 项目整体概览和技术栈介绍
- **[react-typescript-conventions.mdc](react-typescript-conventions.mdc)** - React + TypeScript 开发规范

### 🔧 核心功能模块
- **[dom-manipulation-guidelines.mdc](dom-manipulation-guidelines.mdc)** - DOM 操作和文档处理指南
- **[ai-integration-patterns.mdc](ai-integration-patterns.mdc)** - AI 服务集成和 API 调用模式
- **[seo-optimization-standards.mdc](seo-optimization-standards.mdc)** - SEO 优化标准和最佳实践
- **[file-processing-patterns.mdc](file-processing-patterns.mdc)** - ZIP 文件处理和文件操作模式

### 🎨 用户界面
- **[ui-development-patterns.mdc](ui-development-patterns.mdc)** - UI 组件开发和 Ant Design 使用规范

### 🚀 开发和部署
- **[debugging-and-testing.mdc](debugging-and-testing.mdc)** - 调试和测试指南
- **[deployment-and-build.mdc](deployment-and-build.mdc)** - 构建和部署流程

## 规则应用策略

### 自动应用规则
- `project-overview.mdc` - 始终应用，提供项目基础信息

### 文件类型规则
- `react-typescript-conventions.mdc` - 应用于所有 `.tsx` 和 `.ts` 文件
- `ui-development-patterns.mdc` - 应用于所有 `.tsx` 文件

### 按需应用规则
其他规则通过描述字段按需应用，当 AI 需要了解特定领域的知识时会自动加载。

## 使用建议

1. **新功能开发**: 先查看相关的规则文件了解现有模式
2. **问题排查**: 参考 `debugging-and-testing.mdc` 中的调试策略
3. **代码审查**: 对照规范检查代码质量和一致性
4. **部署发布**: 遵循 `deployment-and-build.mdc` 中的流程

## 规则维护

当项目结构或开发模式发生变化时，请及时更新对应的规则文件，确保 AI 助手能够提供准确的帮助。
