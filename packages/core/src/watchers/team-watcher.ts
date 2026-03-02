/**
 * TeamWatcher - Agent Teams 파일 시스템 실시간 감시
 *
 * ~/.claude/teams/ 와 ~/.claude/tasks/ 디렉토리를 watch하여
 * 파일 변경 시 이벤트를 발행합니다.
 *
 * 동작 방식:
 * 1. 팀 디렉토리 감시 → config.json 변경 감지 → team:* 이벤트
 * 2. 태스크 디렉토리 감시 → {id}.json 변경 감지 → task:* 이벤트
 * 3. inbox 디렉토리 감시 → {agent}.json 변경 감지 → message:* 이벤트
 * 4. 주기적 스냅샷 생성 → snapshot:updated 이벤트
 */

import { EventEmitter } from "node:events";
import { watch, type FSWatcher } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type {
  WatcherOptions,
  TeamConfig,
  Task,
  TeamSnapshot,
  TeamWatcherEvents,
} from "../types/index.js";
import {
  buildTeamSnapshot,
  parseTeamConfig,
  parseTeamTasks,
  parseTeamMessages,
  directoryExists,
  listActiveTeams,
} from "../parsers/team-parser.js";

/** 기본 설정 */
const DEFAULTS: Required<WatcherOptions> = {
  claudeDir: join(homedir(), ".claude"),
  debounceMs: 100,
  pollIntervalMs: 1000,
  filterInternalTasks: true,
  teamFilter: [],
};

/**
 * Agent Teams 실시간 감시자
 *
 * 사용법:
 * ```ts
 * const watcher = new TeamWatcher();
 * watcher.on("task:completed", (team, task) => { ... });
 * watcher.on("snapshot:updated", (team, snapshot) => { ... });
 * await watcher.start();
 * ```
 */
export class TeamWatcher extends EventEmitter {
  private options: Required<WatcherOptions>;
  private teamsDir: string;
  private tasksDir: string;
  private watchers: FSWatcher[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private running = false;

  // 이전 상태 캐시 (변경 감지용)
  private prevSnapshots: Map<string, TeamSnapshot> = new Map();
  private prevTaskMap: Map<string, Map<string, Task>> = new Map();

  constructor(options?: WatcherOptions) {
    super();
    // undefined 값이 기본값을 덮어쓰지 않도록 필터링
    const filtered = Object.fromEntries(
      Object.entries(options ?? {}).filter(([, v]) => v !== undefined),
    );
    this.options = { ...DEFAULTS, ...filtered };
    this.teamsDir = join(this.options.claudeDir, "teams");
    this.tasksDir = join(this.options.claudeDir, "tasks");
  }

  /** 감시 시작 */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // 디렉토리 존재 확인
    const teamsExists = await directoryExists(this.teamsDir);
    const tasksExists = await directoryExists(this.tasksDir);

    if (!teamsExists && !tasksExists) {
      const i18n = await import("../i18n/index.js");
      const { t } = i18n.createI18n();
      this.emit(
        "error",
        new Error(
          `${t("error.claudeDirNotFound", { path: this.options.claudeDir })}\n` +
            t("error.agentTeamsNotActive"),
        ),
        "start",
      );
    }

    // 초기 스캔
    await this.scanAll();

    // fs.watch 설정 (가능한 경우)
    await this.setupWatchers();

    // 폴링 폴백 (fs.watch가 모든 변경을 잡지 못할 수 있음)
    this.pollTimer = setInterval(() => {
      this.scanAll().catch((err) => {
        this.emit("error", err as Error, "poll");
      });
    }, this.options.pollIntervalMs);
  }

  /** 감시 중지 */
  async stop(): Promise<void> {
    this.running = false;

    // fs.watch 정리
    for (const w of this.watchers) {
      try {
        w.close();
      } catch {
        // 무시
      }
    }
    this.watchers = [];

    // 폴링 정리
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    // debounce 타이머 정리
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    this.prevSnapshots.clear();
    this.prevTaskMap.clear();
  }

  /** 현재 활성 팀 목록 */
  async getActiveTeams(): Promise<string[]> {
    return listActiveTeams(this.teamsDir);
  }

  /** 특정 팀의 현재 스냅샷 */
  async getTeamSnapshot(teamName: string): Promise<TeamSnapshot | null> {
    return buildTeamSnapshot(
      this.teamsDir,
      this.tasksDir,
      teamName,
      this.options.filterInternalTasks,
    );
  }

  /** 모든 활성 팀의 스냅샷 */
  async getAllSnapshots(): Promise<Map<string, TeamSnapshot>> {
    const teams = await this.getActiveTeams();
    const snapshots = new Map<string, TeamSnapshot>();

    for (const teamName of teams) {
      if (this.shouldFilterTeam(teamName)) continue;
      const snapshot = await this.getTeamSnapshot(teamName);
      if (snapshot) {
        snapshots.set(teamName, snapshot);
      }
    }

    return snapshots;
  }

  // ────────────────────────────────────────────────
  // 내부 메서드
  // ────────────────────────────────────────────────

  /** 팀 필터 확인 */
  private shouldFilterTeam(teamName: string): boolean {
    if (this.options.teamFilter.length === 0) return false;
    return !this.options.teamFilter.includes(teamName);
  }

  /** 전체 스캔 및 이벤트 발행 */
  private async scanAll(): Promise<void> {
    try {
      const teams = await this.getActiveTeams();

      for (const teamName of teams) {
        if (this.shouldFilterTeam(teamName)) continue;
        await this.scanTeam(teamName);
      }

      // 삭제된 팀 감지
      for (const prevTeam of this.prevSnapshots.keys()) {
        if (!teams.includes(prevTeam)) {
          this.prevSnapshots.delete(prevTeam);
          this.prevTaskMap.delete(prevTeam);
          this.emit("team:removed", prevTeam);
        }
      }
    } catch (err) {
      this.emit("error", err as Error, "scanAll");
    }
  }

  /** 개별 팀 스캔 */
  private async scanTeam(teamName: string): Promise<void> {
    const snapshot = await this.getTeamSnapshot(teamName);
    if (!snapshot) return;

    const prevSnapshot = this.prevSnapshots.get(teamName);

    // 새 팀 감지
    if (!prevSnapshot) {
      this.emit("team:created", teamName, snapshot.config);
    }

    // 태스크 변경 감지
    this.detectTaskChanges(teamName, snapshot);

    // 메시지 변경 감지
    if (prevSnapshot) {
      const newMsgCount = snapshot.messages.length;
      const prevMsgCount = prevSnapshot.messages.length;
      if (newMsgCount > prevMsgCount) {
        const newMessages = snapshot.messages.slice(prevMsgCount);
        for (const msg of newMessages) {
          this.emit("message:received", teamName, msg);
        }
      }
    }

    // 멤버 변경 감지
    if (prevSnapshot) {
      this.detectMemberChanges(teamName, prevSnapshot.config, snapshot.config);
    }

    // 스냅샷 갱신 이벤트
    this.emit("snapshot:updated", teamName, snapshot);
    this.prevSnapshots.set(teamName, snapshot);
  }

  /** 태스크 변경 감지 */
  private detectTaskChanges(teamName: string, snapshot: TeamSnapshot): void {
    const prevTasks = this.prevTaskMap.get(teamName) || new Map();
    const currentTasks = new Map(snapshot.tasks.map((t) => [t.id, t]));

    // 새 태스크 또는 변경된 태스크
    for (const [id, task] of currentTasks) {
      const prevTask = prevTasks.get(id);
      if (!prevTask) {
        this.emit("task:created", teamName, task);
      } else if (
        prevTask.status !== task.status ||
        prevTask.owner !== task.owner
      ) {
        this.emit("task:updated", teamName, task, prevTask);
        if (task.status === "completed" && prevTask.status !== "completed") {
          this.emit("task:completed", teamName, task);
        }
      }
    }

    this.prevTaskMap.set(teamName, currentTasks);
  }

  /** 멤버 변경 감지 */
  private detectMemberChanges(
    teamName: string,
    prevConfig: TeamConfig,
    newConfig: TeamConfig,
  ): void {
    const prevNames = new Set(prevConfig.members.map((m) => m.name));
    const newNames = new Set(newConfig.members.map((m) => m.name));

    // 새 멤버
    for (const member of newConfig.members) {
      if (!prevNames.has(member.name)) {
        this.emit("agent:joined", teamName, member);
      }
    }

    // 이탈 멤버
    for (const name of prevNames) {
      if (!newNames.has(name)) {
        this.emit("agent:left", teamName, name);
      }
    }

    // 설정 변경
    if (JSON.stringify(prevConfig) !== JSON.stringify(newConfig)) {
      this.emit("team:updated", teamName, newConfig);
    }
  }

  /** fs.watch 설정 */
  private async setupWatchers(): Promise<void> {
    // teams 디렉토리 감시 (recursive)
    if (await directoryExists(this.teamsDir)) {
      try {
        const w = watch(
          this.teamsDir,
          { recursive: true },
          (_event, filename) => {
            if (filename) {
              this.handleFileChange("teams", filename);
            }
          },
        );
        this.watchers.push(w);
      } catch {
        // recursive watch 미지원 환경 → 폴링으로 폴백
      }
    }

    // tasks 디렉토리 감시 (recursive)
    if (await directoryExists(this.tasksDir)) {
      try {
        const w = watch(
          this.tasksDir,
          { recursive: true },
          (_event, filename) => {
            if (filename) {
              this.handleFileChange("tasks", filename);
            }
          },
        );
        this.watchers.push(w);
      } catch {
        // recursive watch 미지원 환경 → 폴링으로 폴백
      }
    }
  }

  /** 파일 변경 핸들러 (debounce 적용) */
  private handleFileChange(source: "teams" | "tasks", filename: string): void {
    const key = `${source}:${filename}`;
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);

    this.debounceTimers.set(
      key,
      setTimeout(() => {
        this.debounceTimers.delete(key);
        this.scanAll().catch((err) => {
          this.emit("error", err as Error, `fileChange:${key}`);
        });
      }, this.options.debounceMs),
    );
  }
}
