# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2026-03-05

### Added

- **VS Code Extension**: Task detail panel — inline accordion on row/card/node click showing description, owner, blockedBy/blocks
- **VS Code Extension**: Message filter buttons (All/Conversation/System) with thread grouping by sender→receiver pair
- **VS Code Extension**: Deps tab DAG graph visualization — CSS Grid layout with SVG Bezier edge overlay and topological sort
- **VS Code Extension**: Overview agent detail panel — click agent card to see assigned tasks with status dots
- **VS Code Extension**: Real-time notifications for task:completed, agent:joined, agent:left events
- **Core**: 10 new i18n keys across 4 locales (ko, en, ja, zh)

### Fixed

- **Core**: TeamWatcher now skips `snapshot:updated` event when data hasn't changed (eliminates unnecessary re-renders)
- **VS Code Extension**: Render optimization — only active tab renders, others marked dirty; tab switch re-renders if dirty
- **VS Code Extension**: Message thread expand/collapse state preserved across re-renders via `state.expandedThreads`

## [0.1.1] - 2025-03-03

### Added

- **VS Code Extension**: Kanban board view for Tasks tab (table/kanban toggle)
- **VS Code Extension**: Language switching (Settings + dashboard button)
- **Core**: i18n keys for kanban view labels

## [0.1.0] - 2025-03-03

### Added

- **Core** (`@cc-team-viewer/core`)
  - `TeamWatcher` — polling-based file change detection for `~/.claude/teams/` and `~/.claude/tasks/`
  - `ConfigParser` — parse `config.json` into `TeamConfig` type
  - `TaskParser` — parse `tasks/*.json` into `Task[]`
  - `InboxParser` — parse `inboxes/*.json` into `Message[]`
  - `EventEmitter`-based state change events (`team:updated`, `task:completed`, `agent:joined`, `message:received`)
  - i18n support for 4 languages (ko, en, ja, zh)
- **TUI** (`@cc-team-viewer/tui`)
  - ink-based terminal UI with agent panel, task board, message log
  - Real-time team monitoring with keyboard navigation
  - Language switching (`L` key) and CLI `--lang` flag
- **VS Code Extension** (`cc-team-viewer-vscode`)
  - WebView dashboard with Overview, Tasks, Messages, Dependencies tabs
  - Tree view sidebar (Team > Agent > Task hierarchy)
  - Status bar with task completion progress
  - Team pill switcher for multi-team support
  - Agent pulse animation for active agents
