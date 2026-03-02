/**
 * @cc-team-viewer/core
 *
 * Claude Code Agent Teams 실시간 모니터링 코어 라이브러리
 *
 * 사용법:
 * ```ts
 * import { TeamWatcher } from "@cc-team-viewer/core";
 *
 * const watcher = new TeamWatcher();
 *
 * watcher.on("snapshot:updated", (teamName, snapshot) => {
 *   console.log(`${teamName}: ${snapshot.stats.completionRate}% 완료`);
 * });
 *
 * watcher.on("task:completed", (teamName, task) => {
 *   console.log(`✅ [${teamName}] ${task.subject} 완료!`);
 * });
 *
 * await watcher.start();
 * ```
 */

// 타입 내보내기
export type {
  BackendType,
  TeamMember,
  TeamConfig,
  TaskStatus,
  TaskMetadata,
  Task,
  MessageType,
  InboxMessage,
  AgentStatus,
  TeamSnapshot,
  TeamStats,
  TeamWatcherEvents,
  WatcherOptions,
} from "./types/index.js";

// 파서 내보내기
export {
  safeReadJson,
  directoryExists,
  parseTeamConfig,
  parseTeamTasks,
  parseTeamMessages,
  calculateStats,
  aggregateAgentStatus,
  buildTeamSnapshot,
  listActiveTeams,
} from "./parsers/team-parser.js";

// 감시자 내보내기
export { TeamWatcher } from "./watchers/team-watcher.js";
