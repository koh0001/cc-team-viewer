/**
 * Dashboard HTML 템플릿 생성
 *
 * 인라인 이벤트 핸들러(onclick) 대신 addEventListener를 사용한다.
 */
import { getDashboardCss } from "./dashboard-css";
import { getDashboardJs } from "./dashboard-js";

/** 대시보드 HTML 생성 */
export function getDashboardHtml(nonce: string, cspSource: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${cspSource}; img-src ${cspSource} https:; worker-src 'none';">
  <style nonce="${nonce}">${getDashboardCss()}</style>
</head>
<body>
  <div id="error-bar" class="error-bar"></div>

  <div id="dashboard" class="dashboard-hidden">
    <div id="header" class="header">
      <span class="header-title">&#x1F52D; CC Team Viewer</span>
    </div>
    <div id="team-pills" class="team-pills"></div>

    <div class="stats-bar">
      <div class="progress-container">
        <div class="progress-fill" id="progress-fill"></div>
      </div>
      <span id="stats-text"></span>
    </div>

    <div class="tab-bar" id="tab-bar">
      <button class="tab-btn active" data-tab="overview">Overview</button>
      <button class="tab-btn" data-tab="tasks">Tasks</button>
      <button class="tab-btn" data-tab="messages">Messages</button>
      <button class="tab-btn" data-tab="deps">Deps</button>
    </div>

    <div id="tab-overview" class="tab-content active">
      <div class="section-title">AGENTS</div>
      <div id="overview-content"></div>
    </div>
    <div id="tab-tasks" class="tab-content">
      <div id="tasks-content"></div>
    </div>
    <div id="tab-messages" class="tab-content">
      <div id="messages-content"></div>
    </div>
    <div id="tab-deps" class="tab-content">
      <div class="section-title">DEPENDENCIES</div>
      <div id="deps-content"></div>
    </div>
  </div>

  <div id="empty-state" class="empty-state">
    <div class="icon">&#x23F3;</div>
    <p><strong>Agent Teams 감시 중...</strong></p>
    <p>Claude Code에서 Agent Team을 생성하면</p>
    <p>여기에 실시간으로 표시됩니다.</p>
    <p class="empty-hint">감시 경로: ~/.claude/teams/</p>
  </div>

  <script nonce="${nonce}">${getDashboardJs()}</script>
</body>
</html>`;
}
