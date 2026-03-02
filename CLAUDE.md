# CC Team Viewer - Claude Code Project Context

## 프로젝트 개요
Claude Code Agent Teams의 실시간 모니터링 도구. `~/.claude/teams/`와 `~/.claude/tasks/` 디렉토리의 JSON 파일을 감시하여 팀원별 작업 상태, 태스크 진행률, 에이전트 간 메시지를 시각화한다.

## 아키텍처
모노레포 구조. 핵심 로직은 `@cc-team-viewer/core`에 집중하고, UI 레이어(TUI, VS Code, Web)는 코어를 소비한다.

```
packages/
├── core/     → 파일 감시, JSON 파싱, 이벤트 발행 (순수 Node.js, 외부 의존성 최소)
├── tui/      → 터미널 UI (ink - React for CLI)
├── vscode/   → VS Code 확장프로그램 (WebView 패널)
└── web/      → 웹 대시보드 (React + WebSocket, 선택적)
```

## 개발 페이즈

### Phase 1: Core + TUI (현재)
- [ ] core: TeamWatcher - fs.watch 기반 파일 변경 감지
- [ ] core: ConfigParser - config.json → TeamConfig 타입 변환
- [ ] core: TaskParser - tasks/*.json → Task[] 변환
- [ ] core: InboxParser - inboxes/*.json → Message[] 변환
- [ ] core: EventEmitter 기반 상태 변경 이벤트
- [ ] tui: 팀 목록 사이드바
- [ ] tui: 에이전트 상태 패널
- [ ] tui: 태스크 진행률 뷰
- [ ] tui: 메시지 로그 뷰
- [ ] tui: 의존성 그래프 (ASCII)

### Phase 2: VS Code 확장
- [ ] vscode: WebView 패널 (HTML 기반 대시보드)
- [ ] vscode: FileSystemWatcher 연동
- [ ] vscode: 상태 바 표시 (진행률 요약)
- [ ] vscode: 트리뷰 (팀 → 에이전트 → 태스크 계층)

### Phase 3: 웹 대시보드 (선택)
- [ ] web: Express + WebSocket 서버
- [ ] web: React 대시보드
- [ ] web: Docker 컨테이너화

## Agent Teams 파일 프로토콜

### 팀 설정: `~/.claude/teams/{team-name}/config.json`
```json
{
  "name": "team-name",
  "description": "팀 설명",
  "leadAgentId": "team-lead@team-name",
  "createdAt": 1706000000000,
  "members": [
    {
      "agentId": "team-lead@team-name",
      "name": "team-lead",
      "agentType": "team-lead",
      "color": "#4A90D9",
      "joinedAt": 1706000000000,
      "backendType": "in-process|tmux",
      "model": "opus|sonnet|haiku"
    }
  ]
}
```

### 태스크: `~/.claude/tasks/{team-name}/{id}.json`
```json
{
  "id": "1",
  "subject": "태스크 제목",
  "description": "상세 설명",
  "status": "pending|in_progress|completed",
  "owner": "agent-name 또는 빈 문자열",
  "blocks": [],
  "blockedBy": ["다른 태스크 ID"],
  "metadata": { "_internal": true }
}
```

### 메시지 inbox: `~/.claude/teams/{team-name}/inboxes/{agent-name}.json`
각 에이전트의 수신함. 메시지 배열 형태.

## 기술 스택
- **언어**: TypeScript (ESM)
- **런타임**: Node.js 20+
- **빌드**: tsup (각 패키지별)
- **패키지 관리**: npm workspaces
- **TUI**: ink (React for CLI) + ink-big-text
- **VS Code**: @types/vscode + WebView API
- **테스트**: vitest

## 코딩 컨벤션
- 모든 주석과 문서는 한국어
- 타입 정의는 `packages/core/src/types/`에 집중
- 에러 핸들링: JSON 파싱 실패 시 graceful skip (에이전트가 파일 쓰는 중일 수 있음)
- 파일 감시: debounce 100ms (빠른 연속 변경 대응)
- OS 경로: `~/.claude/`가 기본이되 환경변수 `CC_TEAM_VIEWER_CLAUDE_DIR`로 오버라이드 가능

## MCP Jungle 연동 (향후)
Mac Mini(192.168.0.150:3000)의 MCP Jungle에 등록하여 Claude가 직접 팀 상태를 조회할 수 있도록 MCP 서버 래퍼 추가 예정.

## 참고 자료
- Agent Teams 공식 문서: https://code.claude.com/docs/en/agent-teams
- 파일 프로토콜 분석: https://www.claudecodecamp.com/p/claude-code-agent-teams-how-they-work-under-the-hood
- claude-code-teams-mcp (참고 구현): https://github.com/cs50victor/claude-code-teams-mcp
