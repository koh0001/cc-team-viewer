/**
 * CC Team Viewer — VS Code 확장 엔트리포인트
 *
 * 활성화 시:
 * 1. WatcherService로 ~/.claude/teams/ 감시 시작
 * 2. TreeView에 팀 → 에이전트 → 태스크 계층 표시
 * 3. WebviewPanel 대시보드 (커맨드로 열기)
 * 4. 상태 바에 진행률 요약 표시
 */
import * as vscode from "vscode";
import { WatcherService } from "./services/watcher-service";
import { TeamTreeProvider } from "./providers/tree-provider";
import { DashboardProvider } from "./providers/dashboard-provider";

export function activate(context: vscode.ExtensionContext) {
  // 1. WatcherService (단일 인스턴스, 공유 상태)
  const watcherService = new WatcherService();
  context.subscriptions.push(watcherService);

  // 2. TreeView 등록
  const treeProvider = new TeamTreeProvider(watcherService);
  const treeView = vscode.window.createTreeView("ccTeamViewer.treeView", {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // 3. WebviewPanel Dashboard (에디터 탭으로 열기)
  const dashboardProvider = new DashboardProvider(
    context.extensionUri,
    watcherService,
  );
  context.subscriptions.push(dashboardProvider);

  // 4. 상태 바
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "ccTeamViewer.openDashboard";
  statusBarItem.text = "$(telescope) CC Team Viewer";
  statusBarItem.tooltip = "Agent Teams 대시보드 열기";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // 상태 바 실시간 업데이트
  context.subscriptions.push(
    watcherService.onUpdate(({ teamName, snapshot }) => {
      const s = snapshot.stats;
      statusBarItem.text = `$(telescope) ${teamName} ${s.completionRate}% (${s.completedTasks}/${s.totalTasks})`;
      statusBarItem.tooltip = `${snapshot.config.description}\n${s.activeAgents} active agents · ${s.totalMessages} messages`;
    }),
  );

  context.subscriptions.push(
    watcherService.onRemove(() => {
      const snapshots = watcherService.getSnapshots();
      if (snapshots.size === 0) {
        statusBarItem.text = "$(telescope) CC Team Viewer";
        statusBarItem.tooltip = "Agent Teams 대시보드 열기";
      }
    }),
  );

  // 5. 커맨드 등록
  context.subscriptions.push(
    vscode.commands.registerCommand("ccTeamViewer.openDashboard", () => {
      dashboardProvider.show();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("ccTeamViewer.refresh", () => {
      dashboardProvider.refresh();
      treeProvider.refresh();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("ccTeamViewer.selectTeam", (teamName: string) => {
      dashboardProvider.selectTeam(teamName);
    }),
  );

  // 6. 에러 처리
  context.subscriptions.push(
    watcherService.onError(({ error, context: ctx }) => {
      vscode.window.showWarningMessage(`CC Team Viewer [${ctx}]: ${error.message}`);
    }),
  );

  // 7. 감시 시작
  watcherService.start().catch((err) => {
    vscode.window.showWarningMessage(
      `CC Team Viewer: ${(err as Error).message}`,
    );
  });
}

export function deactivate() {
  // WatcherService.dispose()가 context.subscriptions을 통해 자동 호출됨
}
