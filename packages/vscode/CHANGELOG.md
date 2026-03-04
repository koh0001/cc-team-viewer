# Changelog

All notable changes to the CC Team Viewer VS Code extension will be documented in this file.

## [0.1.5] - 2026-03-05

### Added

- Task detail panel (inline accordion)
  - Table: click row to expand detail `<tr>` below with description, owner, status, blockedBy/blocks links
  - Kanban: click card to expand detail section inside card
  - Deps graph: click node to show detail panel below graph
  - Cross-linking: click blockedBy/blocks task IDs to navigate to that task
- Message filter buttons (All / Conversation / System) at top of Messages tab
- Message thread grouping — consecutive messages from same sender→receiver pair collapsed into expandable threads
- Deps tab DAG graph visualization
  - Topological sort to compute layer depths from `blockedBy` relations
  - CSS Grid layout with nodes positioned by layer (column) and index (row)
  - SVG overlay with Bezier curve edges and arrow markers
  - Status-colored nodes (pending/in_progress/completed)
- Overview agent detail panel — click agent card to see all assigned tasks with status dots
- Real-time VS Code notification popups for task completion and agent join/leave events
- Render optimization: dirty tab tracking, only active tab re-renders

### Fixed

- Message thread expand/collapse state lost on re-render (now persisted in `state.expandedThreads`)
- Snapshot update causing continuous re-renders even when data unchanged

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
