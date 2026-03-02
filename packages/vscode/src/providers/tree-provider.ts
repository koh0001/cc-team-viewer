/**
 * TeamTreeProvider — 팀 → 에이전트 → 태스크 계층 트리뷰
 *
 * 구조:
 *   team-name (67% · 2 active)
 *     ├─ team-lead (idle)
 *     ├─ backend-dev (working)
 *     │  └─ #3 API 구현
 *     └─ [미할당]
 *        └─ #5 테스트
 */
import * as vscode from "vscode";
import type { TeamSnapshot, AgentStatus, Task, TranslateFn } from "@cc-team-viewer/core";
import type { WatcherService } from "../services/watcher-service";

/** 트리 아이템 종류 구분 */
type TreeItemType = "team" | "agent" | "task" | "group";

interface TreeItemData {
  type: TreeItemType;
  teamName: string;
  agentName?: string;
  task?: Task;
  label: string;
}

export class TeamTreeProvider implements vscode.TreeDataProvider<TreeItemData> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeItemData | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private t: TranslateFn;

  constructor(private readonly watcherService: WatcherService) {
    this.t = watcherService.getI18n().t;

    // 스냅샷 변경 시 트리 갱신
    watcherService.onUpdate(() => this.refresh());
    watcherService.onRemove(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TreeItemData): vscode.TreeItem {
    switch (element.type) {
      case "team":
        return this.createTeamItem(element);
      case "agent":
        return this.createAgentItem(element);
      case "task":
        return this.createTaskItem(element);
      case "group":
        return this.createGroupItem(element);
    }
  }

  getChildren(element?: TreeItemData): TreeItemData[] {
    if (!element) {
      return this.getTeamItems();
    }

    const snapshot = this.watcherService.getSnapshot(element.teamName);
    if (!snapshot) return [];

    switch (element.type) {
      case "team":
        return this.getAgentAndGroupItems(element.teamName, snapshot);
      case "agent":
        return this.getAgentTasks(element.teamName, element.agentName!, snapshot);
      case "group":
        return this.getUnassignedTasks(element.teamName, snapshot);
      default:
        return [];
    }
  }

  // ─── 루트: 팀 목록 ────────────────────────

  private getTeamItems(): TreeItemData[] {
    const snapshots = this.watcherService.getSnapshots();
    return [...snapshots.entries()].map(([teamName]) => ({
      type: "team" as const,
      teamName,
      label: teamName,
    }));
  }

  // ─── 2단계: 에이전트 + 미할당 그룹 ──────────

  private getAgentAndGroupItems(teamName: string, snapshot: TeamSnapshot): TreeItemData[] {
    const items: TreeItemData[] = snapshot.agents.map((agent) => ({
      type: "agent" as const,
      teamName,
      agentName: agent.member.name,
      label: agent.member.name,
    }));

    // 미할당 태스크가 있으면 그룹 추가
    const unassigned = snapshot.tasks.filter((t) => !t.owner);
    if (unassigned.length > 0) {
      items.push({
        type: "group",
        teamName,
        label: this.t("task.unassigned"),
      });
    }

    return items;
  }

  // ─── 3단계: 에이전트의 태스크 ───────────────

  private getAgentTasks(teamName: string, agentName: string, snapshot: TeamSnapshot): TreeItemData[] {
    return snapshot.tasks
      .filter((task) => task.owner === agentName)
      .map((task) => ({
        type: "task" as const,
        teamName,
        task,
        label: `#${task.id} ${task.subject}`,
      }));
  }

  // ─── 3단계: 미할당 태스크 ──────────────────

  private getUnassignedTasks(teamName: string, snapshot: TeamSnapshot): TreeItemData[] {
    return snapshot.tasks
      .filter((task) => !task.owner)
      .map((task) => ({
        type: "task" as const,
        teamName,
        task,
        label: `#${task.id} ${task.subject}`,
      }));
  }

  // ─── TreeItem 생성 ────────────────────────

  private createTeamItem(data: TreeItemData): vscode.TreeItem {
    const snapshot = this.watcherService.getSnapshot(data.teamName);
    const stats = snapshot?.stats;
    const desc = stats
      ? `${stats.completionRate}% · ${stats.activeAgents} ${this.t("stats.active")}`
      : "";

    const item = new vscode.TreeItem(data.teamName, vscode.TreeItemCollapsibleState.Expanded);
    item.description = desc;
    item.iconPath = new vscode.ThemeIcon("telescope");
    item.contextValue = "team";
    item.command = {
      command: "ccTeamViewer.selectTeam",
      title: "Select Team",
      arguments: [data.teamName],
    };
    return item;
  }

  private createAgentItem(data: TreeItemData): vscode.TreeItem {
    const snapshot = this.watcherService.getSnapshot(data.teamName);
    const agent = snapshot?.agents.find((a) => a.member.name === data.agentName);
    if (!agent) {
      return new vscode.TreeItem(data.label);
    }

    const hasTasks = agent.allTasks.length > 0;
    const collapsible = hasTasks
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;

    const item = new vscode.TreeItem(data.label, collapsible);
    item.description = this.getAgentDescription(agent);
    item.iconPath = this.getAgentIcon(agent);
    item.contextValue = "agent";
    return item;
  }

  private createTaskItem(data: TreeItemData): vscode.TreeItem {
    const task = data.task!;
    const item = new vscode.TreeItem(data.label, vscode.TreeItemCollapsibleState.None);
    item.description = this.t(`status.${task.status === "in_progress" ? "inProgress" : task.status}` as any);
    item.iconPath = this.getTaskIcon(task);
    item.contextValue = "task";
    return item;
  }

  private createGroupItem(data: TreeItemData): vscode.TreeItem {
    const item = new vscode.TreeItem(data.label, vscode.TreeItemCollapsibleState.Collapsed);
    item.iconPath = new vscode.ThemeIcon("inbox");
    item.contextValue = "group";
    return item;
  }

  // ─── 유틸리티 ─────────────────────────────

  private getAgentDescription(agent: AgentStatus): string {
    const { isIdle, completedTasks, allTasks, member } = agent;
    const status = isIdle ? "idle" : "working";
    const progress = allTasks.length > 0 ? ` ${completedTasks.length}/${allTasks.length}` : "";
    return `${member.model ?? "opus"} · ${status}${progress}`;
  }

  private getAgentIcon(agent: AgentStatus): vscode.ThemeIcon {
    const isLead = agent.member.agentType === "team-lead";
    if (isLead) return new vscode.ThemeIcon("crown", new vscode.ThemeColor("charts.purple"));
    if (agent.isIdle) return new vscode.ThemeIcon("circle-outline", new vscode.ThemeColor("disabledForeground"));
    return new vscode.ThemeIcon("zap", new vscode.ThemeColor("charts.green"));
  }

  private getTaskIcon(task: Task): vscode.ThemeIcon {
    switch (task.status) {
      case "completed":
        return new vscode.ThemeIcon("check", new vscode.ThemeColor("charts.green"));
      case "in_progress":
        return new vscode.ThemeIcon("circle-filled", new vscode.ThemeColor("charts.yellow"));
      default:
        return new vscode.ThemeIcon("circle-outline", new vscode.ThemeColor("disabledForeground"));
    }
  }
}
