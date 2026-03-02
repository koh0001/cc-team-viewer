# Changelog

All notable changes to the CC Team Viewer VS Code extension will be documented in this file.

## [0.1.1] - 2025-03-03

### Added

- Kanban board view as alternative to task table
  - Toggle button group (Table / Kanban) at top of Tasks tab
  - Three-column layout: Pending, In Progress, Completed
  - Task cards with ID, subject, owner, dependency badges
- Language switching via Settings and dashboard button

## [0.1.0] - 2025-03-03

### Added

- WebView dashboard panel with 4 tabs: Overview, Tasks, Messages, Dependencies
- Tree view sidebar with Team > Agent > Task hierarchy
- Status bar showing task completion progress
- Team pill buttons for quick team switching
- Agent cards with color-coded status and pulse animation for active agents
- Task table with zebra striping, status dots with glow, hover highlights
- Message log with system message accents and hover effects
- Dependency graph with completion-colored left borders
- Real-time updates via `@cc-team-viewer/core` TeamWatcher
- VS Code theme integration (light/dark/high contrast)
- CSP-compliant WebView with nonce-based script loading
