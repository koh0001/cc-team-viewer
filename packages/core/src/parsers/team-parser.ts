/**
 * Agent Teams JSON 파일 파서
 *
 * ~/.claude/ 하위의 JSON 파일들을 안전하게 읽고 파싱합니다.
 * 에이전트가 파일을 쓰는 도중에 읽을 수 있으므로, 파싱 실패 시 graceful하게 처리합니다.
 */

import { readFile, readdir, access } from "node:fs/promises";
import { join, basename } from "node:path";
import { constants } from "node:fs";
import type {
  TeamConfig,
  Task,
  InboxMessage,
  TeamSnapshot,
  TeamStats,
  AgentStatus,
} from "../types/index.js";

/**
 * JSON 파일을 안전하게 읽고 파싱
 * 파일이 없거나 파싱 실패 시 null 반환
 */
export async function safeReadJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    // 파일 없음, 권한 부족, 파싱 실패 등 모두 null 반환
    return null;
  }
}

/**
 * 디렉토리 존재 여부 확인
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    await access(dirPath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * 팀 설정 파일 파싱
 * @param teamsDir ~/.claude/teams 경로
 * @param teamName 팀 이름
 */
export async function parseTeamConfig(
  teamsDir: string,
  teamName: string,
): Promise<TeamConfig | null> {
  const configPath = join(teamsDir, teamName, "config.json");
  return safeReadJson<TeamConfig>(configPath);
}

/**
 * 특정 팀의 모든 태스크 파싱
 * @param tasksDir ~/.claude/tasks 경로
 * @param teamName 팀 이름
 * @param filterInternal 내부 태스크 제외 여부
 */
export async function parseTeamTasks(
  tasksDir: string,
  teamName: string,
  filterInternal = true,
): Promise<Task[]> {
  const teamTasksDir = join(tasksDir, teamName);
  if (!(await directoryExists(teamTasksDir))) return [];

  try {
    const files = await readdir(teamTasksDir);
    const jsonFiles = files.filter(
      (f) => f.endsWith(".json") && f !== ".lock",
    );

    const tasks: Task[] = [];
    for (const file of jsonFiles) {
      const task = await safeReadJson<Task>(join(teamTasksDir, file));
      if (!task) continue;

      // 내부 태스크 필터링 (에이전트 라이프사이클 추적용)
      if (filterInternal && task.metadata?._internal) continue;

      tasks.push(task);
    }

    // ID 기준 정렬
    return tasks.sort((a, b) => Number(a.id) - Number(b.id));
  } catch {
    return [];
  }
}

/**
 * 특정 팀의 모든 에이전트 inbox 메시지 파싱
 * @param teamsDir ~/.claude/teams 경로
 * @param teamName 팀 이름
 */
export async function parseTeamMessages(
  teamsDir: string,
  teamName: string,
): Promise<InboxMessage[]> {
  const inboxDir = join(teamsDir, teamName, "inboxes");
  if (!(await directoryExists(inboxDir))) return [];

  try {
    const files = await readdir(inboxDir);
    const jsonFiles = files.filter(
      (f) => f.endsWith(".json") && f !== ".lock",
    );

    const allMessages: InboxMessage[] = [];
    for (const file of jsonFiles) {
      // inbox 파일은 메시지 배열 또는 단일 객체일 수 있음
      const raw = await safeReadJson<InboxMessage[] | InboxMessage>(
        join(inboxDir, file),
      );
      if (!raw) continue;

      if (Array.isArray(raw)) {
        allMessages.push(...raw);
      } else {
        allMessages.push(raw);
      }
    }

    // 시간순 정렬
    return allMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  } catch {
    return [];
  }
}

/**
 * 팀 통계 계산
 */
export function calculateStats(
  config: TeamConfig,
  tasks: Task[],
  messages: InboxMessage[],
): TeamStats {
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const total = tasks.length;

  // 활성 에이전트: 현재 in_progress 태스크를 가진 에이전트
  const activeOwners = new Set(
    tasks.filter((t) => t.status === "in_progress" && t.owner).map((t) => t.owner),
  );

  return {
    totalTasks: total,
    completedTasks: completed,
    inProgressTasks: inProgress,
    pendingTasks: pending,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
    activeAgents: activeOwners.size,
    totalAgents: config.members.length,
    uptime: Date.now() - config.createdAt,
    totalMessages: messages.length,
  };
}

/**
 * 에이전트별 상태 집계
 */
export function aggregateAgentStatus(
  config: TeamConfig,
  tasks: Task[],
  messages: InboxMessage[],
): AgentStatus[] {
  return config.members.map((member) => {
    const agentTasks = tasks.filter((t) => t.owner === member.name);
    const activeTasks = agentTasks.filter((t) => t.status === "in_progress");
    const completedTasks = agentTasks.filter((t) => t.status === "completed");

    // 해당 에이전트의 마지막 메시지 시각
    const agentMessages = messages.filter(
      (m) => m.from === member.name || m.to === member.name,
    );
    const lastMessageAt =
      agentMessages.length > 0
        ? Math.max(...agentMessages.map((m) => m.timestamp || 0))
        : undefined;

    return {
      member,
      activeTasks,
      completedTasks,
      allTasks: agentTasks,
      lastMessageAt,
      isIdle: activeTasks.length === 0 && member.agentType !== "team-lead",
    };
  });
}

/**
 * 팀 전체 스냅샷 생성
 */
export async function buildTeamSnapshot(
  teamsDir: string,
  tasksDir: string,
  teamName: string,
  filterInternal = true,
): Promise<TeamSnapshot | null> {
  const config = await parseTeamConfig(teamsDir, teamName);
  if (!config) return null;

  const tasks = await parseTeamTasks(tasksDir, teamName, filterInternal);
  const messages = await parseTeamMessages(teamsDir, teamName);
  const stats = calculateStats(config, tasks, messages);
  const agents = aggregateAgentStatus(config, tasks, messages);

  return {
    config,
    tasks,
    agents,
    messages,
    timestamp: Date.now(),
    stats,
  };
}

/**
 * 활성 팀 이름 목록 조회
 */
export async function listActiveTeams(teamsDir: string): Promise<string[]> {
  if (!(await directoryExists(teamsDir))) return [];

  try {
    const entries = await readdir(teamsDir, { withFileTypes: true });
    const teamNames: string[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      // config.json이 있는 디렉토리만 유효한 팀
      const configPath = join(teamsDir, entry.name, "config.json");
      if (await directoryExists(configPath)) {
        // directoryExists는 access 체크이므로 파일에도 동작
        teamNames.push(entry.name);
      }
    }

    return teamNames.sort();
  } catch {
    return [];
  }
}
