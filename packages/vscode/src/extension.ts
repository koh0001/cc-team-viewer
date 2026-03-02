/**
 * CC Team Viewer — VS Code 확장 엔트리포인트
 *
 * 활성화 시:
 * 1. ~/.claude/teams/ 디렉토리 감시 시작
 * 2. 사이드바에 WebView 대시보드 등록
 * 3. 상태 바에 진행률 요약 표시
 */
import * as vscode from "vscode";
import { DashboardProvider } from "./panels/dashboard-provider";

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log("CC Team Viewer 확장 활성화");

  // WebView 패널 프로바이더 등록
  const dashboardProvider = new DashboardProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "ccTeamViewer.dashboard",
      dashboardProvider,
    ),
  );

  // 대시보드 열기 커맨드
  context.subscriptions.push(
    vscode.commands.registerCommand("ccTeamViewer.openDashboard", () => {
      vscode.commands.executeCommand("ccTeamViewer.dashboard.focus");
    }),
  );

  // 새로고침 커맨드
  context.subscriptions.push(
    vscode.commands.registerCommand("ccTeamViewer.refresh", () => {
      dashboardProvider.refresh();
    }),
  );

  // 상태 바 아이템
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "ccTeamViewer.openDashboard";
  statusBarItem.text = "$(telescope) CC Team Viewer";
  statusBarItem.tooltip = "Agent Teams 대시보드 열기";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

export function deactivate() {
  console.log("CC Team Viewer 확장 비활성화");
}
