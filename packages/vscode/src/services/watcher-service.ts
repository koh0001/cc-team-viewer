/**
 * WatcherService — TeamWatcher를 VS Code 이벤트 패턴으로 래핑
 *
 * 단일 TeamWatcher 인스턴스를 관리하며,
 * TreeView/Dashboard/StatusBar가 공유하는 스냅샷 캐시를 제공한다.
 */
import * as vscode from "vscode";
import {
  TeamWatcher,
  createI18n,
  type TeamSnapshot,
  type I18nInstance,
  type Locale,
} from "@cc-team-viewer/core";

interface UpdateEvent {
  teamName: string;
  snapshot: TeamSnapshot;
}

export class WatcherService implements vscode.Disposable {
  private watcher: TeamWatcher;
  private snapshots = new Map<string, TeamSnapshot>();
  private i18n: I18nInstance;

  private readonly _onUpdate = new vscode.EventEmitter<UpdateEvent>();
  private readonly _onRemove = new vscode.EventEmitter<string>();
  private readonly _onError = new vscode.EventEmitter<{ error: Error; context: string }>();

  /** 스냅샷 갱신 이벤트 */
  readonly onUpdate = this._onUpdate.event;
  /** 팀 삭제 이벤트 */
  readonly onRemove = this._onRemove.event;
  /** 에러 이벤트 */
  readonly onError = this._onError.event;

  constructor(options?: { claudeDir?: string; teamFilter?: string[] }) {
    this.i18n = createI18n();
    this.watcher = new TeamWatcher({
      claudeDir: options?.claudeDir,
      teamFilter: options?.teamFilter,
      pollIntervalMs: 1000,
    });

    // TeamWatcher 이벤트 → VS Code 이벤트 브릿지
    this.watcher.on("snapshot:updated", (teamName: string, snapshot: TeamSnapshot) => {
      // 불변 패턴: 새 Map 생성
      this.snapshots = new Map(this.snapshots);
      this.snapshots.set(teamName, snapshot);
      this._onUpdate.fire({ teamName, snapshot });
    });

    this.watcher.on("team:removed", (teamName: string) => {
      this.snapshots = new Map(this.snapshots);
      this.snapshots.delete(teamName);
      this._onRemove.fire(teamName);
    });

    this.watcher.on("error", (error: Error, context: string) => {
      this._onError.fire({ error, context });
    });
  }

  /** 감시 시작 */
  async start(): Promise<void> {
    await this.watcher.start();
  }

  /** 현재 모든 스냅샷 (읽기 전용) */
  getSnapshots(): ReadonlyMap<string, TeamSnapshot> {
    return this.snapshots;
  }

  /** 특정 팀 스냅샷 */
  getSnapshot(teamName: string): TeamSnapshot | undefined {
    return this.snapshots.get(teamName);
  }

  /** i18n 인스턴스 */
  getI18n(): I18nInstance {
    return this.i18n;
  }

  /** 로케일 변경 (불변 패턴: 새 I18nInstance 생성) */
  setLocale(locale: Locale): void {
    this.i18n = createI18n(locale);
  }

  /** 리소스 정리 */
  dispose(): void {
    this.watcher.stop();
    this._onUpdate.dispose();
    this._onRemove.dispose();
    this._onError.dispose();
  }
}
