# CC Team Viewer

**Claude Code Agent Teams 实时监控工具**

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

当Agent Teams并行工作时，可以一目了然地查看每个代理的状态、任务进度和代理间消息的仪表板。

## 为什么需要？

Claude Code的Agent Teams功能强大，但监控手段有限：
- 使用`Shift+Down`在代理之间切换
- 使用`Ctrl+T`查看任务列表
- 手动查看tmux窗格

CC Team Viewer实时监控`~/.claude/teams/`和`~/.claude/tasks/`目录中的JSON文件，在单独的终端窗格或VS Code面板中显示整个团队状况。

## 功能

- **团队概览** — 活跃团队、成员数、整体进度
- **代理状态** — 每个代理当前的工作内容、模型（opus/sonnet/haiku）、后端类型
- **任务看板** — 状态（pending/in_progress/completed）、负责人、依赖关系、阻塞
- **消息日志** — 代理间通信的实时显示
- **依赖关系图** — 任务间阻塞关系可视化
- **进度统计** — 完成率、经过时间、每个代理的处理量

## 包结构

```
packages/
├── core/     # 文件监控 + JSON解析 + 事件（共享库）
├── tui/      # 终端UI（基于ink，兼容Windows Terminal/iTerm2/tmux）
└── vscode/   # VS Code扩展（侧边栏面板 + WebView仪表板）
```

## 快速开始

### 终端TUI

```bash
# 安装和构建
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install
npm run build

# 运行
npm run tui
```

### VS Code扩展

```bash
# 构建和安装
cd packages/vscode
npm run package
code --install-extension cc-team-viewer-*.vsix
```

## 兼容性

| 环境 | TUI | VS Code扩展 |
|------|-----|-------------|
| macOS (iTerm2/Terminal) | 支持 | 支持 |
| macOS (tmux窗格) | 支持 | - |
| Windows（原生） | 支持 | 支持 |
| Windows (WSL) | 支持 | 支持 (Remote WSL) |
| Linux | 支持 | 支持 |

> **注意**：Agent Teams本身以tmux（split-pane）或in-process模式运行。
> CC Team Viewer仅读取文件系统，因此在任何环境中都可以工作。

## 系统要求

- Node.js 20+
- Claude Code（启用Agent Teams）

## 开发

```bash
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install
npm run dev        # TUI开发模式（--watch）
npm run build      # 构建所有包
npm run test:run   # 运行测试
```

## 许可证

[MIT](LICENSE)
