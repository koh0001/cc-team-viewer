/**
 * 영어 번역
 */
import type { TranslationMap } from "../types.js";

export const en: TranslationMap = {
  // 상태
  "status.completed": "Completed",
  "status.inProgress": "In Progress",
  "status.pending": "Pending",

  // 경과 시간
  "duration.seconds": "{count}s",
  "duration.minutes": "{count}m",
  "duration.hours": "{count}h",
  "duration.hoursMinutes": "{hours}h {minutes}m",

  // 상대 시간
  "timeAgo.seconds": "{count}s ago",
  "timeAgo.minutes": "{count}m ago",
  "timeAgo.hours": "{count}h ago",

  // 앱 전반
  "app.title": "CC Team Viewer",
  "app.subtitle": "Claude Code Agent Teams Monitor",
  "app.quit": "quit",
  "app.watching": "Watching Agent Teams...",
  "app.watchingHint": "Create an Agent Team in Claude Code to see it here.",
  "app.watchingPath": "Watch path: {path}/teams/",

  // 뷰 탭
  "view.overview": "Overview",
  "view.tasks": "Tasks",
  "view.messages": "Messages",
  "view.deps": "Deps",
  "view.tabHint": "(Tab to switch)",

  // 사이드바
  "sidebar.teamList": "Teams (↑↓)",

  // 통계
  "stats.tasks": "tasks",
  "stats.active": "active",
  "stats.messages": "msgs",
  "stats.elapsed": "elapsed",

  // 에이전트
  "agent.sectionTitle": "Agents ({count})",
  "agent.taskProgress": "Tasks: {completed}/{total} done",
  "agent.noAgents": "No agents",

  // 태스크
  "task.headerId": "ID",
  "task.headerTask": "Task",
  "task.headerOwner": "Owner",
  "task.headerStatus": "Status",
  "task.unassigned": "Unassigned",
  "task.noTasks": "No tasks",
  "task.viewTable": "Table",
  "task.viewKanban": "Kanban",
  "task.columnPending": "Pending",
  "task.columnInProgress": "In Progress",
  "task.columnCompleted": "Completed",
  "task.blockedByLabel": "Blocked by",

  // 메시지
  "message.headerFrom": "From",
  "message.headerTo": "To",
  "message.headerContent": "Content",
  "message.headerTime": "Time",
  "message.noMessages": "No messages",
  "message.olderOmitted": "... {count} older messages omitted",

  // 의존성 그래프
  "deps.sectionTitle": "Task Dependency Graph",

  // 에러
  "error.claudeDirNotFound": "Claude directory not found: {path}",
  "error.agentTeamsNotActive": "Please check if Agent Teams is active.",
  "error.startFailed": "Start failed: {message}",

  // CLI
  "cli.usage": "Usage",
  "cli.options": "Options",
  "cli.teamDesc": "Team name to watch (can be used multiple times)",
  "cli.dirDesc": "Claude directory path (default: ~/.claude)",
  "cli.langDesc": "UI language (ko, en, ja, zh)",
  "cli.helpDesc": "Show help",
  "cli.versionDesc": "Show version",
  "cli.example": "Examples",
};
