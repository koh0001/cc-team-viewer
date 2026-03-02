/**
 * Extension ↔ WebView 메시지 프로토콜 타입 정의
 */

/** 에이전트 페이로드 (WebView 전송용) */
export interface AgentPayload {
  name: string;
  agentType: string;
  model: string;
  color: string;
  backendType: string;
  isLead: boolean;
  isIdle: boolean;
  activeTasks: { id: string; subject: string }[];
  completedCount: number;
  totalCount: number;
}

/** 태스크 페이로드 */
export interface TaskPayload {
  id: string;
  subject: string;
  status: "pending" | "in_progress" | "completed";
  owner: string;
  blockedBy: string[];
  blocks: string[];
}

/** 메시지 페이로드 */
export interface MessagePayload {
  from: string;
  to: string;
  type: string;
  content: string;
  timestamp: number;
}

/** 스냅샷 페이로드 (TeamSnapshot의 직렬화 가능 버전) */
export interface SnapshotPayload {
  name: string;
  description: string;
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    completionRate: number;
    activeAgents: number;
    totalAgents: number;
    uptime: number;
    totalMessages: number;
  };
  agents: AgentPayload[];
  tasks: TaskPayload[];
  messages: MessagePayload[];
}

/** 초기화 페이로드 */
export interface InitPayload {
  teams: Record<string, SnapshotPayload>;
  selectedTeam: string;
  translations: Record<string, string>;
}

/** Extension → WebView 메시지 */
export type ExtToWebMessage =
  | { type: "init"; data: InitPayload }
  | { type: "snapshotUpdate"; teamName: string; data: SnapshotPayload }
  | { type: "teamRemoved"; teamName: string }
  | { type: "error"; message: string };

/** WebView → Extension 메시지 */
export type WebToExtMessage =
  | { command: "ready" }
  | { command: "selectTeam"; teamName: string }
  | { command: "refresh" }
  | { command: "changeTab"; tab: string };
