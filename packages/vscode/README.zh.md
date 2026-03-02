# CC Team Viewer for VS Code

**Claude Code Agent Teams 实时监控仪表板**

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

![概览](https://raw.githubusercontent.com/koh0001/cc-team-viewer/main/packages/vscode/images/screenshot-overview.png)

## 什么是 CC Team Viewer？

运行 [Claude Code Agent Teams](https://docs.anthropic.com/en/docs/claude-code/agent-teams) 时，多个 AI 代理并行协作处理任务。CC Team Viewer 提供实时仪表板来监控代理的进度 — 哪些代理正在活跃、正在处理什么任务、代理之间如何通信，一目了然。

## 功能

### WebView 仪表板
由4个标签页组成的交互式仪表板：

| 标签页 | 说明 |
|--------|------|
| **Overview** | 代理卡片 — 状态、活跃任务、进度 |
| **Tasks** | 完整任务表格 — 状态指示器、负责人 |
| **Messages** | 代理间实时消息日志 |
| **Deps** | 任务依赖关系图可视化 |

![任务](https://raw.githubusercontent.com/koh0001/cc-team-viewer/main/packages/vscode/images/screenshot-tasks.png)

![消息](https://raw.githubusercontent.com/koh0001/cc-team-viewer/main/packages/vscode/images/screenshot-messages.png)

### 树视图侧边栏
在活动栏中以**团队 > 代理 > 任务**层级结构导航。

### 状态栏
始终可见的进度摘要：`refactor-auth 62% (5/8)` — 点击打开仪表板。

### 多语言支持
仪表板 UI 支持4种语言：English、한국어、日本語、中文
- 在`设置 > CC Team Viewer > Language`中更改
- 或点击仪表板头部的语言按钮循环切换

### 其他功能
- **团队 pill 切换** — 监控多个团队时快速切换
- **代理脉冲动画** — 工作中代理的视觉指示
- **实时更新** — 1秒间隔自动轮询，无需手动刷新
- **主题集成** — 自动适配 VS Code 主题（浅色/深色/高对比度）

## 安装

### 从 VS Code Marketplace

在扩展面板中搜索 **"CC Team Viewer"**，或：

```
ext install koh-dev.cc-team-viewer-vscode
```

### 从 .vsix 文件

```bash
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install && npm run build
cd packages/vscode && npm run package
code --install-extension cc-team-viewer-vscode-*.vsix
```

## 使用方法

1. 在终端中启动 Claude Code Agent Team
2. 打开 VS Code — 检测到 `~/.claude/` 时扩展自动激活
3. 点击活动栏的**望远镜图标**打开树视图
4. 点击**仪表板图标**打开 WebView 仪表板

> 自动监视 `~/.claude/teams/` 和 `~/.claude/tasks/` 目录的变更。无需额外配置。

## 命令

| 命令 | 说明 |
|------|------|
| `CC Team Viewer: Open Dashboard` | 打开 WebView 仪表板面板 |
| `CC Team Viewer: Refresh` | 手动刷新团队数据 |
| `CC Team Viewer: Select Team` | 切换活跃团队 |

通过命令面板（`Ctrl+Shift+P` / `Cmd+Shift+P`）访问。

## 设置

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `ccTeamViewer.language` | `auto` | 仪表板语言（`auto`、`ko`、`en`、`ja`、`zh`） |

## 系统要求

- VS Code 1.90+
- Claude Code（启用 Agent Teams）

## 许可证

[MIT](../../LICENSE)
