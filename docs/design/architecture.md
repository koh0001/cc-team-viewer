# CC Team Viewer 아키텍처 설계

## 1. 시스템 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                    Claude Code Agent Teams                       │
│                                                                  │
│  Team Lead ──spawn──▶ Agent A ◀──inbox──▶ Agent B               │
│      │                   ▲          ▲                            │
│      │                   └──task queue──┘                        │
│      └──── config.json + inboxes/ + tasks/ ─────                │
└─────────────────┬───────────────────────────────────────────────┘
                  │ (파일 시스템)
                  │
    ~/.claude/teams/{team}/config.json
    ~/.claude/teams/{team}/inboxes/{agent}.json
    ~/.claude/tasks/{team}/{id}.json
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    @cc-team-viewer/core                           │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐        │
│  │ TeamWatcher  │  │  Parsers     │  │  Types          │        │
│  │ (fs.watch)   │──│  - config    │──│  - TeamConfig   │        │
│  │              │  │  - tasks     │  │  - Task         │        │
│  │ EventEmitter │  │  - inbox     │  │  - InboxMessage │        │
│  └──────┬───────┘  └──────────────┘  │  - TeamSnapshot │        │
│         │                             └─────────────────┘        │
│         │ events: team:*, task:*, message:*, snapshot:*          │
└─────────┼───────────────────────────────────────────────────────┘
          │
    ┌─────┼──────────┬──────────────────┐
    │     │          │                  │
    ▼     ▼          ▼                  ▼
┌────────────┐ ┌───────────┐ ┌──────────────────┐
│  TUI (ink) │ │  VS Code  │ │  Web (선택)      │
│            │ │  Extension│ │  Express+WS+React │
│ 터미널 UI  │ │  WebView  │ │  Docker 호스팅    │
└────────────┘ └───────────┘ └──────────────────┘
```

## 2. Core 라이브러리 설계

### TeamWatcher 동작 흐름

```
start()
  ├─ 1. ~/.claude/teams/ 존재 확인
  ├─ 2. 초기 스캔 (scanAll)
  │     ├─ 팀 목록 나열
  │     └─ 각 팀의 스냅샷 생성 → snapshot:updated 이벤트
  ├─ 3. fs.watch 설정 (recursive, 가능한 경우)
  └─ 4. 폴링 타이머 시작 (1초 간격 폴백)

파일 변경 감지
  ├─ debounce (100ms)
  ├─ scanAll()
  │     ├─ 이전 스냅샷과 비교
  │     ├─ 새 팀 → team:created
  │     ├─ 삭제된 팀 → team:removed
  │     ├─ 새 태스크 → task:created
  │     ├─ 상태 변경 → task:updated
  │     ├─ 완료 → task:completed
  │     ├─ 새 메시지 → message:received
  │     ├─ 새 멤버 → agent:joined
  │     └─ 이탈 멤버 → agent:left
  └─ emit("snapshot:updated", teamName, snapshot)
```

### 에러 처리 전략

Agent가 파일을 쓰는 도중에 읽으면 불완전한 JSON이 될 수 있음.
→ `safeReadJson()`으로 파싱 실패 시 null 반환, 다음 폴링에서 재시도.

### OS별 경로 처리

| OS | Claude 디렉토리 | 비고 |
|----|----------------|------|
| macOS | `~/.claude/` | 직접 접근 |
| Linux | `~/.claude/` | 직접 접근 |
| WSL | `~/.claude/` | WSL 내부 경로 |
| Windows (네이티브) | `%USERPROFILE%\.claude\` | 향후 지원 |

환경변수 `CC_TEAM_VIEWER_CLAUDE_DIR`로 오버라이드 가능.

## 3. TUI 설계

### 화면 구성

```
┌──────────────────────────────────────────────────────────┐
│ 🔭 CC Team Viewer — Claude Code Agent Teams Monitor       │
├────────────┬─────────────────────────────────────────────┤
│ 팀 목록    │ dashboard-build                             │
│ (↑↓ 선택)  │ 대시보드 기능 구현 팀 — 8분 경과            │
│            │                                             │
│▸ dashboard │ ██████████░░░░░░░░░░ 33%  2/6 태스크        │
│  auth-ref  │                                             │
│            │ [1] 개요  [2] 태스크  [3] 메시지  [4] 의존성 │
│            │─────────────────────────────────────────────│
│            │                                             │
│            │ ▸ 에이전트 (4)                               │
│            │ ┌─────────────────────────────────────────┐ │
│            │ │ 👑 team-lead (team-lead)    opus · tmux │ │
│            │ └─────────────────────────────────────────┘ │
│            │ ┌─────────────────────────────────────────┐ │
│            │ │ ⚡ backend-dev (Backend Developer)       │ │
│            │ │   ● API 엔드포인트 구현                   │ │
│            │ │   태스크: 1/2 완료                        │ │
│            │ └─────────────────────────────────────────┘ │
│            │ ┌─────────────────────────────────────────┐ │
│            │ │ ⚡ frontend-dev (Frontend Developer)     │ │
│            │ │   ● 차트 컴포넌트 구현                    │ │
│            │ │   태스크: 1/2 완료                        │ │
│            │ └─────────────────────────────────────────┘ │
│            │ ┌─────────────────────────────────────────┐ │
│            │ │ 💤 test-engineer (Test Engineer)         │ │
│            │ │   태스크: 0/2 완료                        │ │
│            │ └─────────────────────────────────────────┘ │
└────────────┴─────────────────────────────────────────────┘
```

### 키보드 단축키

| 키 | 동작 |
|----|------|
| Tab | 뷰 전환 (개요 → 태스크 → 메시지 → 의존성) |
| 1-4 | 뷰 직접 선택 |
| ↑/↓ | 팀 선택 |
| q | 종료 |

## 4. VS Code 확장 설계

### 컴포넌트

1. **Activity Bar** — 망원경 아이콘으로 사이드바 활성화
2. **WebView Panel** — HTML/CSS/JS 기반 대시보드 (React 번들 또는 vanilla)
3. **Status Bar** — "🔭 팀명 67%" 형태의 요약 표시
4. **TreeView** (선택) — 팀 → 에이전트 → 태스크 계층 트리

### Extension ↔ WebView 통신

```
Extension                        WebView
    │                               │
    │── postMessage(snapshot) ──▶   │  (상태 업데이트)
    │                               │
    │◀── postMessage(selectTeam) ── │  (팀 선택)
    │◀── postMessage(refresh) ───── │  (새로고침 요청)
```

## 5. 향후 확장

### MCP 서버 래퍼
Mac Mini의 MCP Jungle에 등록하여 Claude가 직접 팀 상태 조회.

```
도구: get_team_status
입력: { team_name: "dashboard-build" }
출력: TeamSnapshot JSON
```

### 알림 시스템
- 태스크 완료 시 데스크톱 알림
- 에이전트 에러/유휴 시 경고
- Slack/Discord 웹훅 연동
