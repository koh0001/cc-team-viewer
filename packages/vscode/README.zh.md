# CC Team Viewer for VS Code

**Claude Code Agent Teams 实时监控仪表板**

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

## 功能

- **WebView仪表板** — 概览、任务、消息、依赖关系标签页
- **树视图侧边栏** — 活动栏中的团队 > 代理 > 任务层级结构
- **状态栏** — 一目了然的任务完成进度
- **团队pill切换** — 一键快速切换团队
- **代理脉冲动画** — 活跃代理的视觉指示
- **实时更新** — 团队文件变更时自动刷新
- **主题集成** — 适配VS Code主题（浅色/深色/高对比度）

## 安装

### 从.vsix文件安装

```bash
# 从源码构建
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install
npm run build
cd packages/vscode
npm run package
code --install-extension cc-team-viewer-*.vsix
```

### 从源码运行（开发用）

1. 在VS Code中打开monorepo
2. 按`F5`启动Extension Development Host
3. 活动栏中出现CC Team Viewer面板

## 使用方法

1. 在终端中启动Claude Code Agent Team
2. 打开VS Code — 检测到`~/.claude/`时扩展自动激活
3. 点击活动栏的望远镜图标打开树视图
4. 点击仪表板图标打开WebView仪表板

## 命令

| 命令 | 说明 |
|------|------|
| `CC Team Viewer: Open Dashboard` | 打开WebView仪表板面板 |
| `CC Team Viewer: Refresh` | 手动刷新团队数据 |
| `CC Team Viewer: Select Team` | 切换活跃团队 |

通过命令面板（`Ctrl+Shift+P` / `Cmd+Shift+P`）访问。

## 系统要求

- VS Code 1.90+
- Node.js 20+
- Claude Code（启用Agent Teams）

## 许可证

[MIT](../../LICENSE)
