/**
 * DashboardProvider — VS Code WebView 기반 대시보드
 *
 * Core의 TeamWatcher를 사용하여 파일 변경을 감지하고,
 * WebView에 HTML 대시보드를 렌더링합니다.
 *
 * TODO (Phase 2):
 * - TeamWatcher 연동으로 실시간 갱신
 * - WebView ↔ Extension 메시지 프로토콜
 * - 인터랙티브 태스크 보드
 */
import * as vscode from "vscode";
// import { TeamWatcher, type TeamSnapshot } from "@cc-team-viewer/core";

export class DashboardProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  // private watcher?: TeamWatcher;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent();

    // TODO: TeamWatcher 연동
    // this.startWatching();

    // WebView로부터 메시지 수신
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "refresh":
          this.refresh();
          break;
        case "selectTeam":
          // 팀 선택 처리
          break;
      }
    });
  }

  /** 수동 새로고침 */
  refresh() {
    if (this.view) {
      this.view.webview.html = this.getHtmlContent();
    }
  }

  /** 대시보드 HTML 생성 */
  private getHtmlContent(): string {
    // TODO: TeamWatcher 스냅샷 데이터로 동적 생성
    return /* html */ `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 12px;
            margin: 0;
          }
          .header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-widget-border);
          }
          .header h2 { margin: 0; font-size: 14px; }
          .status {
            padding: 24px;
            text-align: center;
            color: var(--vscode-descriptionForeground);
          }
          .status .icon { font-size: 32px; margin-bottom: 8px; }
          .status p { margin: 4px 0; font-size: 12px; }
          .team-card {
            padding: 12px;
            margin-bottom: 8px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 6px;
            cursor: pointer;
          }
          .team-card:hover {
            background: var(--vscode-list-hoverBackground);
          }
          .progress-bar {
            width: 100%;
            height: 4px;
            background: var(--vscode-progressBar-background);
            border-radius: 2px;
            margin-top: 8px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background: var(--vscode-progressBar-background);
            border-radius: 2px;
            transition: width 0.3s ease;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <span>🔭</span>
          <h2>CC Team Viewer</h2>
        </div>

        <div class="status">
          <div class="icon">⏳</div>
          <p><strong>Agent Teams 감시 중...</strong></p>
          <p>Claude Code에서 Agent Team을 생성하면</p>
          <p>여기에 실시간으로 표시됩니다.</p>
          <br>
          <p style="font-size: 11px; opacity: 0.6;">
            감시 경로: ~/.claude/teams/
          </p>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          // Extension으로부터 상태 업데이트 수신
          window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
              case 'snapshotUpdate':
                updateDashboard(message.snapshots);
                break;
            }
          });

          function updateDashboard(snapshots) {
            // TODO: 스냅샷 데이터로 대시보드 UI 업데이트
            console.log('대시보드 업데이트:', snapshots);
          }

          function selectTeam(teamName) {
            vscode.postMessage({ command: 'selectTeam', teamName });
          }
        </script>
      </body>
      </html>
    `;
  }
}
