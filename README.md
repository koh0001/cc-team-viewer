# CC Team Viewer

**Real-time monitoring tool for Claude Code Agent Teams**

[![npm core](https://img.shields.io/npm/v/@cc-team-viewer/core?label=core)](https://www.npmjs.com/package/@cc-team-viewer/core)
[![npm tui](https://img.shields.io/npm/v/@cc-team-viewer/tui?label=tui)](https://www.npmjs.com/package/@cc-team-viewer/tui)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/koh-dev.cc-team-viewer-vscode?label=vscode)](https://marketplace.visualstudio.com/items?itemName=koh-dev.cc-team-viewer-vscode)

[한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

![Dashboard Overview](packages/vscode/images/screenshot-overview.png)

A dashboard that lets you see each agent's status, task progress, and inter-agent messages at a glance when Agent Teams work in parallel.

## Why?

Claude Code's Agent Teams are powerful, but monitoring options are limited:
- Cycle between agents with `Shift+Down`
- View task list with `Ctrl+T`
- Manually check tmux panes

CC Team Viewer watches JSON files in `~/.claude/teams/` and `~/.claude/tasks/` in real-time, showing the full team overview in a separate terminal pane or VS Code panel.

## Features

- **Team Overview** — Active teams, member count, overall progress
- **Agent Status** — What each agent is working on, model (opus/sonnet/haiku), backend type
- **Task Board** — Status (pending/in_progress/completed), owner, dependencies, blocking
- **Message Log** — Real-time inter-agent communication
- **Dependency Graph** — Task blocking relationships
- **Progress Stats** — Completion rate, elapsed time, per-agent throughput
- **Multi-language** — UI in English, Korean, Japanese, Chinese

| Tasks | Messages |
|-------|----------|
| ![Tasks](packages/vscode/images/screenshot-tasks.png) | ![Messages](packages/vscode/images/screenshot-messages.png) |

## Package Structure

```
packages/
├── core/     # File watching + JSON parsing + events (shared library)
├── tui/      # Terminal UI (ink-based, Windows Terminal/iTerm2/tmux compatible)
└── vscode/   # VS Code extension (sidebar panel + WebView dashboard)
```

## Quick Start

### VS Code Extension (Recommended)

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=koh-dev.cc-team-viewer-vscode):

```
ext install koh-dev.cc-team-viewer-vscode
```

### Terminal TUI

```bash
npm install -g @cc-team-viewer/tui
cc-team-viewer
```

### As a Library

```bash
npm install @cc-team-viewer/core
```

```typescript
import { TeamWatcher } from "@cc-team-viewer/core";

const watcher = new TeamWatcher();
watcher.on("snapshot:updated", (teamName, snapshot) => {
  console.log(`${teamName}: ${snapshot.stats.completionRate}% complete`);
});
await watcher.start();
```

### From Source

```bash
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install && npm run build
npm run tui
```

## Compatibility

| Environment | TUI | VS Code Extension |
|-------------|-----|-------------------|
| macOS (iTerm2/Terminal) | Supported | Supported |
| macOS (tmux pane) | Supported | - |
| Windows (native) | Supported | Supported |
| Windows (WSL) | Supported | Supported (Remote WSL) |
| Linux | Supported | Supported |

> **Note**: Agent Teams run in tmux (split-pane) or in-process mode.
> CC Team Viewer only reads the filesystem, so it works in any environment.

## Requirements

- Node.js 20+
- Claude Code with Agent Teams

## Development

```bash
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install
npm run dev        # TUI dev mode (--watch)
npm run build      # Build all packages
npm run test:run   # Run tests
npm run lint       # ESLint check
```

## License

[MIT](LICENSE)
