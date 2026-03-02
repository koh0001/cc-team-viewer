# CC Team Viewer - Claude Code Project Context

## 프로젝트 개요
Claude Code Agent Teams의 실시간 모니터링 도구. `~/.claude/teams/`와 `~/.claude/tasks/` 디렉토리의 JSON 파일을 감시하여 팀원별 작업 상태, 태스크 진행률, 에이전트 간 메시지를 시각화한다.

## 커맨드

```bash
npm run build          # 전체 빌드 (core → tui → vscode)
npm run build:core     # core 패키지만 빌드
npm run build:vscode   # vscode 확장만 빌드
npm run dev            # TUI 개발 모드 (watch)
npm run tui            # TUI 실행
npm test               # vitest watch 모드
npm run test:run       # vitest 1회 실행 (CI용)
npm run lint           # eslint 전체 검사
npm run clean          # dist/ 전체 삭제
```

VS Code 확장 디버깅: `F5` (Extension Host 실행)
VS Code 패키징: `cd packages/vscode && npm run package`

## 아키텍처
모노레포 구조. 핵심 로직은 `@cc-team-viewer/core`에 집중하고, UI 레이어(TUI, VS Code)는 코어를 소비한다.

```
packages/
├── core/     → 파일 감시, JSON 파싱, 이벤트 발행 (순수 Node.js, 외부 의존성 최소)
├── tui/      → 터미널 UI (ink - React for CLI)
└── vscode/   → VS Code 확장프로그램 (WebView 패널)
```

## 개발 페이즈

### Phase 1: Core + TUI (완료)
- [x] core: TeamWatcher - 폴링 기반 파일 변경 감지
- [x] core: ConfigParser - config.json → TeamConfig 타입 변환
- [x] core: TaskParser - tasks/*.json → Task[] 변환
- [x] core: InboxParser - inboxes/*.json → Message[] 변환
- [x] core: EventEmitter 기반 상태 변경 이벤트
- [x] tui: 팀 목록 사이드바
- [x] tui: 에이전트 상태 패널
- [x] tui: 태스크 진행률 뷰
- [x] tui: 메시지 로그 뷰
- [ ] tui: 의존성 그래프 (ASCII)

### Phase 2: VS Code 확장 (진행 중)
- [x] vscode: WebView 패널 (HTML 기반 대시보드)
- [x] vscode: FileSystemWatcher 연동
- [x] vscode: 상태 바 표시 (진행률 요약)
- [x] vscode: 트리뷰 (팀 → 에이전트 → 태스크 계층)

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

## VS Code 확장 구조

```
packages/vscode/src/
├── extension.ts              → 진입점 (activate/deactivate)
├── services/watcher-service.ts → core TeamWatcher 래핑 (VS Code lifecycle)
├── providers/
│   ├── dashboard-provider.ts → WebView 패널 (TeamSnapshot → HTML)
│   └── tree-provider.ts      → 사이드바 트리뷰 (팀→에이전트→태스크)
└── views/
    ├── dashboard-html.ts     → HTML 템플릿 (정적 구조)
    ├── dashboard-css.ts      → CSS (VS Code 테마 변수 활용)
    └── dashboard-js.ts       → 클라이언트 JS (DOM 조작, 상태 관리)
```

### WebView 보안 컨벤션
- CSP: `script-src 'nonce-{nonce}'`만 허용 (인라인 스크립트 차단)
- DOM 조작: `innerHTML` 금지, `textContent` + DOM API 사용
- 사용자 입력(메시지, 태스크명): `escapeHtml()`로 이스케이프 필수
- 이벤트: `onclick` 속성 대신 `addEventListener` 사용 (CSP 호환)

## 코딩 컨벤션
- 모든 주석과 문서는 한국어
- 타입 정의는 `packages/core/src/types/`에 집중
- 에러 핸들링: JSON 파싱 실패 시 graceful skip (에이전트가 파일 쓰는 중일 수 있음)
- 파일 감시: debounce 100ms (빠른 연속 변경 대응)
- OS 경로: `~/.claude/`가 기본이되 환경변수 `CC_TEAM_VIEWER_CLAUDE_DIR`로 오버라이드 가능

## 다국어(i18n) 지원

4개 언어 지원: 한국어(ko), 영어(en), 일본어(ja), 중국어(zh). 외부 라이브러리 없이 자체 구현.

### 구조
- **Core**: `packages/core/src/i18n/` — 타입, 팩토리, 로케일 파일
- **TUI**: `packages/tui/src/i18n/context.tsx` — React 컨텍스트(LocaleProvider, useI18n)

### 사용법
```ts
// Core (순수 함수)
import { createI18n } from "@cc-team-viewer/core";
const i18n = createI18n("en");
i18n.t("status.completed");                    // "Completed"
i18n.t("duration.seconds", { count: 30 });     // "30s"

// TUI (React 훅)
const { t, locale, cycleLocale } = useI18n();
```

### 컨벤션
- 번역 키는 `packages/core/src/i18n/types.ts`의 `TranslationMap`에 정의
- 새 키 추가 시 4개 로케일 파일 모두 업데이트 (TypeScript가 누락 검출)
- 한국어(ko.ts)가 기준 로케일, 폴백 체인: 현재 로케일 → ko → 키 자체
- 보간 형식: `{key}` (예: `"{count}초 전"` + `{ count: 5 }` → `"5초 전"`)
- `formatDuration`, `timeAgo` 등 순수 함수는 `t: TranslateFn` 파라미터를 받음
- CLI: `--lang` 플래그, TUI: `L` 키로 실시간 전환
- 로케일 감지 우선순위: `CC_TEAM_VIEWER_LANG` → `LANG` → `Intl API` → `ko`

## 참고 자료
- Agent Teams 공식 문서: https://code.claude.com/docs/en/agent-teams
- 파일 프로토콜 분석: https://www.claudecodecamp.com/p/claude-code-agent-teams-how-they-work-under-the-hood
- claude-code-teams-mcp (참고 구현): https://github.com/cs50victor/claude-code-teams-mcp
