/**
 * DashboardProvider — WebviewPanel 기반 실시간 대시보드
 *
 * WatcherService로부터 스냅샷을 수신하여 WebView에 postMessage로 전달한다.
 * WebView에서 ready 신호를 받은 후 데이터를 전송하여 메시지 유실을 방지한다.
 */
import * as vscode from "vscode";
import type { TeamSnapshot, TranslationKey, Locale } from "@cc-team-viewer/core";
import type { WatcherService } from "../services/watcher-service";
import type {
  ExtToWebMessage,
  WebToExtMessage,
  SnapshotPayload,
  AgentPayload,
  TaskPayload,
  MessagePayload,
} from "../types/messages";
import { getDashboardHtml } from "../views/dashboard-html";

/** WebView에 전달할 번역 키 목록 */
const WEBVIEW_TRANSLATION_KEYS: TranslationKey[] = [
  "status.completed", "status.inProgress", "status.pending",
  "stats.tasks", "stats.active", "stats.messages", "stats.elapsed",
  "agent.sectionTitle", "agent.taskProgress", "agent.noAgents",
  "task.headerId", "task.headerTask", "task.headerOwner", "task.headerStatus",
  "task.unassigned", "task.noTasks",
  "task.viewTable", "task.viewKanban",
  "task.columnPending", "task.columnInProgress", "task.columnCompleted",
  "task.blockedByLabel",
  "message.headerFrom", "message.headerTo", "message.headerContent",
  "message.headerTime", "message.noMessages",
  "view.overview", "view.tasks", "view.messages", "view.deps",
];

export class DashboardProvider implements vscode.Disposable {
  private panel?: vscode.WebviewPanel;
  private selectedTeam = "";
  private isReady = false;
  private pendingMessages: ExtToWebMessage[] = [];
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly watcherService: WatcherService,
  ) {}

  /** 대시보드 패널 열기 (이미 열려있으면 포커스) */
  show(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "ccTeamViewerDashboard",
      "CC Team Viewer",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [],
      },
    );

    this.panel.iconPath = new vscode.ThemeIcon("telescope");
    this.isReady = false;
    this.pendingMessages = [];

    // HTML 설정
    const nonce = this.generateNonce();
    const cspSource = this.panel.webview.cspSource;
    this.panel.webview.html = getDashboardHtml(nonce, cspSource);

    // WebView 메시지 수신
    this.disposables.push(
      this.panel.webview.onDidReceiveMessage((message: WebToExtMessage) => {
        this.handleWebviewMessage(message);
      }),
    );

    // Watcher 이벤트 구독
    this.disposables.push(
      this.watcherService.onUpdate(({ teamName, snapshot }) => {
        this.onWatcherUpdate(teamName, snapshot);
      }),
    );

    this.disposables.push(
      this.watcherService.onRemove((teamName) => {
        this.postMessage({ type: "teamRemoved", teamName });
      }),
    );

    // 패널 닫힐 때 정리
    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this.isReady = false;
      this.disposables.forEach((d) => d.dispose());
      this.disposables = [];
    });
  }

  /** 팀 선택 (TreeView에서 호출) */
  selectTeam(teamName: string): void {
    this.selectedTeam = teamName;
    const snapshot = this.watcherService.getSnapshot(teamName);
    if (snapshot) {
      this.postMessage({
        type: "snapshotUpdate",
        teamName,
        data: this.toSnapshotPayload(snapshot),
      });
    }
  }

  /** 외부에서 로케일 변경 (Settings UI → extension.ts → 여기) */
  changeLocale(locale: Locale): void {
    this.watcherService.setLocale(locale);
    this.sendTranslationsUpdate();
  }

  /** 새로고침 */
  refresh(): void {
    if (!this.panel) return;
    this.sendInitMessage();
  }

  dispose(): void {
    this.panel?.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }

  // ─── 내부 메서드 ──────────────────────────

  private handleWebviewMessage(message: WebToExtMessage): void {
    switch (message.command) {
      case "ready":
        this.isReady = true;
        this.sendInitMessage();
        this.flushPendingMessages();
        break;
      case "selectTeam":
        this.selectedTeam = message.teamName;
        break;
      case "refresh":
        this.refresh();
        break;
      case "changeLanguage": {
        // 대시보드 버튼 클릭 → 다음 언어로 순환
        const nextI18n = this.watcherService.getI18n().cycleLocale();
        this.watcherService.setLocale(nextI18n.locale);
        this.sendTranslationsUpdate();
        // VS Code 설정과 동기화
        vscode.workspace.getConfiguration("ccTeamViewer")
          .update("language", nextI18n.locale, vscode.ConfigurationTarget.Global);
        break;
      }
    }
  }

  private onWatcherUpdate(teamName: string, snapshot: TeamSnapshot): void {
    if (!this.selectedTeam) this.selectedTeam = teamName;
    this.postMessage({
      type: "snapshotUpdate",
      teamName,
      data: this.toSnapshotPayload(snapshot),
    });
  }

  private sendInitMessage(): void {
    const snapshots = this.watcherService.getSnapshots();
    const teams: Record<string, SnapshotPayload> = {};
    for (const [name, snap] of snapshots) {
      teams[name] = this.toSnapshotPayload(snap);
    }

    if (!this.selectedTeam && snapshots.size > 0) {
      this.selectedTeam = [...snapshots.keys()][0];
    }

    this.postMessage({
      type: "init",
      data: {
        teams,
        selectedTeam: this.selectedTeam,
        translations: this.getTranslationsForWebview(),
        locale: this.watcherService.getI18n().locale,
      },
    });
  }

  private postMessage(message: ExtToWebMessage): void {
    if (!this.panel) return;
    if (!this.isReady) {
      this.pendingMessages.push(message);
      return;
    }
    this.panel.webview.postMessage(message);
  }

  private flushPendingMessages(): void {
    const messages = [...this.pendingMessages];
    this.pendingMessages = [];
    for (const msg of messages) {
      this.postMessage(msg);
    }
  }

  /** TeamSnapshot → 직렬화 가능한 SnapshotPayload 변환 (불변) */
  private toSnapshotPayload(snapshot: TeamSnapshot): SnapshotPayload {
    return {
      name: snapshot.config.name,
      description: snapshot.config.description,
      stats: { ...snapshot.stats },
      agents: snapshot.agents.map((agent): AgentPayload => ({
        name: agent.member.name,
        agentType: agent.member.agentType,
        model: agent.member.model ?? "opus",
        color: agent.member.color,
        backendType: agent.member.backendType,
        isLead: agent.member.agentType === "team-lead",
        isIdle: agent.isIdle,
        activeTasks: agent.activeTasks.map((t) => ({ id: t.id, subject: t.subject })),
        completedCount: agent.completedTasks.length,
        totalCount: agent.allTasks.length,
      })),
      tasks: snapshot.tasks.map((task): TaskPayload => ({
        id: task.id,
        subject: task.subject,
        status: task.status,
        owner: task.owner,
        blockedBy: [...task.blockedBy],
        blocks: [...task.blocks],
      })),
      messages: snapshot.messages.slice(-50).map((msg): MessagePayload => ({
        from: msg.from,
        to: msg.to,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
    };
  }

  /** 현재 번역 + 로케일을 WebView에 전송 */
  private sendTranslationsUpdate(): void {
    const i18n = this.watcherService.getI18n();
    this.postMessage({
      type: "translationsUpdate",
      translations: this.getTranslationsForWebview(),
      locale: i18n.locale,
    });
  }

  /** WebView에 전달할 번역 맵 생성 */
  private getTranslationsForWebview(): Record<string, string> {
    const { t } = this.watcherService.getI18n();
    const translations: Record<string, string> = {};
    for (const key of WEBVIEW_TRANSLATION_KEYS) {
      translations[key] = t(key);
    }
    return translations;
  }

  /** CSP nonce 생성 */
  private generateNonce(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let nonce = "";
    for (let i = 0; i < 32; i++) {
      nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
  }
}
