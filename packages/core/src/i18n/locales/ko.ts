/**
 * 한국어 번역 (기준 로케일)
 */
import type { TranslationMap } from "../types.js";

export const ko: TranslationMap = {
  // 상태
  "status.completed": "완료",
  "status.inProgress": "진행중",
  "status.pending": "대기",

  // 경과 시간
  "duration.seconds": "{count}초",
  "duration.minutes": "{count}분",
  "duration.hours": "{count}시간",
  "duration.hoursMinutes": "{hours}시간 {minutes}분",

  // 상대 시간
  "timeAgo.seconds": "{count}초 전",
  "timeAgo.minutes": "{count}분 전",
  "timeAgo.hours": "{count}시간 전",

  // 앱 전반
  "app.title": "CC Team Viewer",
  "app.subtitle": "Claude Code Agent Teams Monitor",
  "app.quit": "종료",
  "app.watching": "Agent Teams를 감시 중...",
  "app.watchingHint": "Claude Code에서 Agent Team을 생성하면 여기에 표시됩니다.",
  "app.watchingPath": "감시 경로: {path}/teams/",

  // 뷰 탭
  "view.overview": "개요",
  "view.tasks": "태스크",
  "view.messages": "메시지",
  "view.deps": "의존성",
  "view.tabHint": "(Tab으로 전환)",

  // 사이드바
  "sidebar.teamList": "팀 목록 (↑↓)",

  // 통계
  "stats.tasks": "태스크",
  "stats.active": "활성",
  "stats.messages": "메시지",
  "stats.elapsed": "경과",

  // 에이전트
  "agent.sectionTitle": "에이전트 ({count})",
  "agent.taskProgress": "태스크: {completed}/{total} 완료",
  "agent.noAgents": "에이전트 없음",

  // 태스크
  "task.headerId": "ID",
  "task.headerTask": "태스크",
  "task.headerOwner": "담당",
  "task.headerStatus": "상태",
  "task.unassigned": "미할당",
  "task.noTasks": "태스크 없음",

  // 메시지
  "message.headerFrom": "발신",
  "message.headerTo": "수신",
  "message.headerContent": "내용",
  "message.headerTime": "시간",
  "message.noMessages": "메시지 없음",
  "message.olderOmitted": "... {count}개 이전 메시지 생략",

  // 의존성 그래프
  "deps.sectionTitle": "태스크 의존성 그래프",

  // 에러
  "error.claudeDirNotFound": "Claude 디렉토리를 찾을 수 없습니다: {path}",
  "error.agentTeamsNotActive": "Agent Teams가 활성화되어 있는지 확인해주세요.",
  "error.startFailed": "시작 실패: {message}",

  // CLI
  "cli.usage": "사용법",
  "cli.options": "옵션",
  "cli.teamDesc": "감시할 팀 이름 (여러 번 사용 가능)",
  "cli.dirDesc": "Claude 디렉토리 경로 (기본: ~/.claude)",
  "cli.langDesc": "UI 언어 (ko, en, ja, zh)",
  "cli.helpDesc": "도움말 표시",
  "cli.versionDesc": "버전 표시",
  "cli.example": "예시",
};
