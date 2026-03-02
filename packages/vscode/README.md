# CC Team Viewer for VS Code

**Real-time monitoring dashboard for Claude Code Agent Teams**

[한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

## Features

- **WebView Dashboard** — Overview, Tasks, Messages, Dependencies tabs
- **Tree View Sidebar** — Team > Agent > Task hierarchy in the activity bar
- **Status Bar** — Task completion progress at a glance
- **Team Pill Switcher** — Quick team switching with one click
- **Agent Pulse Animation** — Visual indicator for active agents
- **Real-time Updates** — Automatic refresh when team files change
- **Theme Integration** — Adapts to your VS Code theme (light/dark/high contrast)

## Installation

### From .vsix file

```bash
# Build from source
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install
npm run build
cd packages/vscode
npm run package
code --install-extension cc-team-viewer-*.vsix
```

### From source (development)

1. Open the monorepo in VS Code
2. Press `F5` to launch Extension Development Host
3. The CC Team Viewer panel appears in the activity bar

## Usage

1. Start a Claude Code Agent Team in your terminal
2. Open VS Code — the extension activates automatically when `~/.claude/` is detected
3. Click the telescope icon in the activity bar to open the tree view
4. Click the dashboard icon to open the WebView dashboard

## Commands

| Command | Description |
|---------|-------------|
| `CC Team Viewer: Open Dashboard` | Open the WebView dashboard panel |
| `CC Team Viewer: Refresh` | Manually refresh team data |
| `CC Team Viewer: Select Team` | Switch active team |

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).

## Requirements

- VS Code 1.90+
- Node.js 20+
- Claude Code with Agent Teams

## License

[MIT](../../LICENSE)
