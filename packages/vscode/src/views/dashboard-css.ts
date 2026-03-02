/**
 * Dashboard CSS — VS Code 테마 변수 활용
 */
export function getDashboardCss(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 16px 20px;
      line-height: 1.5;
      --overlay-subtle: var(--overlay-subtle);
      --overlay-light: var(--overlay-light);
      --overlay-medium: var(--overlay-medium);
      --overlay-strong: var(--overlay-strong);
    }

    /* 애니메이션 */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-border {
      0%, 100% { border-left-color: var(--agent-color, var(--vscode-focusBorder)); }
      50% { border-left-color: transparent; }
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes gentle-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    /* 헤더 */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--vscode-widget-border);
      margin-bottom: 14px;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: bold;
      font-size: 1.1em;
    }
    .header.no-border {
      border-bottom: none;
      margin-bottom: 0;
    }
    .lang-btn {
      background: var(--vscode-editorWidget-background);
      color: var(--vscode-descriptionForeground);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      padding: 3px 10px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .lang-btn:hover {
      background: var(--overlay-strong);
      color: var(--vscode-foreground);
      border-color: var(--vscode-focusBorder);
    }

    /* 팀 pill 바 */
    .team-pills {
      display: none;
      gap: 6px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--vscode-widget-border);
      margin-bottom: 4px;
      overflow-x: auto;
      scrollbar-width: thin;
    }
    .team-pills.visible {
      display: flex;
    }
    .team-pill {
      flex-shrink: 0;
      background: var(--vscode-editorWidget-background);
      color: var(--vscode-descriptionForeground);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 14px;
      padding: 4px 14px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .team-pill:hover {
      background: var(--overlay-strong);
      color: var(--vscode-foreground);
      border-color: var(--vscode-focusBorder);
    }
    .team-pill.active {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-color: var(--vscode-badge-background);
      font-weight: 600;
    }

    /* 통계 바 */
    .stats-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .progress-container {
      flex: 1;
      max-width: 150px;
      height: 6px;
      background: var(--vscode-editorWidget-background);
      border-radius: 3px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.15);
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--vscode-progressBar-background), var(--vscode-charts-green));
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    .stat-badge {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 500;
    }

    /* 탭 바 */
    .tab-bar {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--vscode-widget-border);
      margin: 10px 0;
    }
    .tab-btn {
      background: none;
      border: none;
      color: var(--vscode-descriptionForeground);
      padding: 8px 16px;
      cursor: pointer;
      font-size: 12px;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      color: var(--vscode-foreground);
      background: var(--overlay-light);
    }
    .tab-btn.active {
      color: var(--vscode-foreground);
      border-bottom-color: var(--vscode-focusBorder);
      font-weight: bold;
    }

    /* 탭 콘텐츠 */
    .tab-content { display: none; }
    .tab-content.active {
      display: block;
      animation: fadeIn 0.15s ease-out;
    }

    /* 에이전트 카드 */
    .agent-card {
      border: 1px solid var(--vscode-widget-border);
      border-left: 3px solid var(--agent-color, var(--vscode-focusBorder));
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      transition: all 0.15s ease;
    }
    .agent-card:hover {
      box-shadow: 0 3px 8px rgba(0,0,0,0.2);
      transform: translateY(-1px);
      border-color: var(--vscode-focusBorder);
      border-left-color: var(--agent-color, var(--vscode-focusBorder));
    }
    .agent-card.agent-active {
      animation: pulse-border 2s ease-in-out infinite;
    }
    .agent-card.agent-active:hover {
      animation: none;
      border-left-color: var(--agent-color, var(--vscode-focusBorder));
    }
    .agent-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .agent-name { font-weight: bold; font-size: 13px; }
    .agent-meta { font-size: 11px; color: var(--vscode-descriptionForeground); }
    .agent-task {
      font-size: 12px;
      color: var(--vscode-charts-yellow);
      padding-left: 16px;
      margin-top: 4px;
    }
    .agent-progress {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      padding-left: 16px;
      margin-top: 4px;
    }

    /* 태스크 테이블 */
    .task-table { width: 100%; font-size: 12px; border-collapse: collapse; }
    .task-table th {
      text-align: left;
      color: var(--vscode-descriptionForeground);
      padding: 6px 10px;
      border-bottom: 1px solid var(--vscode-widget-border);
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      background: var(--overlay-subtle);
    }
    .task-table td { padding: 6px 10px; }
    .task-table tbody tr {
      transition: background 0.15s ease;
    }
    .task-table tbody tr:nth-child(even) {
      background: var(--overlay-subtle);
    }
    .task-table tbody tr:hover {
      background: var(--overlay-medium);
    }
    .task-table tr.completed td { opacity: 0.5; text-decoration: line-through; }
    .task-status {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 4px;
    }
    .task-status.completed {
      background: var(--vscode-charts-green);
      box-shadow: 0 0 4px var(--vscode-charts-green);
    }
    .task-status.in_progress {
      background: var(--vscode-charts-yellow);
      box-shadow: 0 0 4px var(--vscode-charts-yellow);
    }
    .task-status.pending { background: var(--vscode-descriptionForeground); opacity: 0.4; }
    .task-owner { color: var(--vscode-textLink-foreground); }
    .task-unassigned { color: var(--vscode-descriptionForeground); font-style: italic; }

    /* 태스크 뷰 토글 */
    .task-view-toggle {
      display: flex;
      gap: 0;
      margin-bottom: 12px;
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      overflow: hidden;
      width: fit-content;
    }
    .task-view-btn {
      background: var(--vscode-editorWidget-background);
      color: var(--vscode-descriptionForeground);
      border: none;
      padding: 4px 12px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s ease;
      border-right: 1px solid var(--vscode-widget-border);
    }
    .task-view-btn:last-child { border-right: none; }
    .task-view-btn:hover {
      background: var(--overlay-medium);
      color: var(--vscode-foreground);
    }
    .task-view-btn.active {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      font-weight: 600;
    }

    /* 칸반 보드 */
    .kanban-board {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .kanban-column {
      flex: 1;
      min-width: 180px;
      background: var(--overlay-subtle);
      border-radius: 6px;
      padding: 8px;
    }
    .kanban-column-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 6px 8px;
      border-bottom: 1px solid var(--vscode-widget-border);
      margin-bottom: 8px;
    }
    .kanban-column-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: var(--vscode-descriptionForeground);
    }
    .kanban-column-count {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 8px;
      margin-left: auto;
    }
    .kanban-cards {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kanban-card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      padding: 8px 10px;
      transition: all 0.15s ease;
      cursor: default;
    }
    .kanban-card:hover {
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      border-color: var(--vscode-focusBorder);
      transform: translateY(-1px);
    }
    .kanban-card-completed { opacity: 0.5; }
    .kanban-card-completed .kanban-card-subject { text-decoration: line-through; }
    .kanban-card-id {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      font-weight: 600;
    }
    .kanban-card-subject {
      font-size: 12px;
      margin: 4px 0;
      line-height: 1.4;
      word-break: break-word;
    }
    .kanban-card-blocked {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin: 4px 0;
    }
    .kanban-blocked-badge {
      background: rgba(255,165,0,0.15);
      color: var(--vscode-charts-orange, #cc8800);
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 3px;
      font-weight: 500;
    }
    .kanban-card-footer {
      margin-top: 6px;
      font-size: 11px;
      border-top: 1px solid var(--vscode-widget-border);
      padding-top: 4px;
    }
    .kanban-empty {
      text-align: center;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      padding: 16px 0;
      opacity: 0.5;
    }

    /* 메시지 로그 */
    .message-row {
      display: flex;
      gap: 8px;
      font-size: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--vscode-widget-border);
      transition: background 0.15s ease;
      border-radius: 3px;
    }
    .message-row:hover {
      background: var(--overlay-light);
    }
    .message-row:last-child { border-bottom: none; }
    .msg-from {
      color: var(--vscode-textLink-foreground);
      font-weight: bold;
      min-width: 80px;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .msg-arrow { color: var(--vscode-descriptionForeground); }
    .msg-to {
      color: var(--vscode-descriptionForeground);
      min-width: 80px;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .msg-content { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .msg-time { color: var(--vscode-descriptionForeground); font-size: 11px; min-width: 50px; text-align: right; }
    .msg-system {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
      font-size: 11px;
      padding: 4px 0 4px 8px;
      border-left: 2px solid var(--vscode-widget-border);
      margin: 2px 0;
    }

    /* 의존성 그래프 */
    .dep-line {
      font-family: monospace;
      font-size: 12px;
      padding: 2px 0;
      border-radius: 3px;
    }
    .dep-completed {
      color: var(--vscode-charts-green);
      padding-left: 6px;
      border-left: 2px solid var(--vscode-charts-green);
    }
    .dep-in-progress {
      color: var(--vscode-charts-yellow);
      padding-left: 6px;
      border-left: 2px solid var(--vscode-charts-yellow);
    }
    .dep-arrow {
      color: var(--vscode-descriptionForeground);
      padding-left: 16px;
    }

    /* 빈 상태 */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--vscode-descriptionForeground);
    }
    .empty-state .icon {
      font-size: 40px;
      margin-bottom: 12px;
      animation: gentle-bounce 2s ease-in-out infinite;
    }
    .empty-state p { margin: 4px 0; font-size: 12px; }
    .empty-hint {
      font-size: 11px;
      opacity: 0.6;
      margin-top: 14px;
    }
    .empty-hint code {
      background: var(--overlay-strong);
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 11px;
    }

    /* 섹션 */
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
      margin: 16px 0 8px;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    /* 에러 바 */
    .error-bar {
      display: none;
      background: var(--vscode-inputValidation-errorBackground);
      color: var(--vscode-inputValidation-errorForeground);
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 10px;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .error-bar.visible {
      display: block;
      animation: slideDown 0.2s ease-out;
    }

    /* 대시보드 표시/숨김 */
    .dashboard-hidden { display: none; }
  `;
}
