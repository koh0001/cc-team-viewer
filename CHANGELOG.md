# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
