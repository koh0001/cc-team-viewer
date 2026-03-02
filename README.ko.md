# CC Team Viewer

**Claude Code Agent Teams 실시간 모니터링 도구**

[English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

Agent Teams가 병렬로 작업할 때 각 에이전트의 상태, 태스크 진행률, 에이전트 간 메시지를 한눈에 볼 수 있는 대시보드입니다.

## 왜 필요한가?

Claude Code의 Agent Teams는 강력하지만, 현재 모니터링 방법이 제한적입니다:
- `Shift+Down`으로 에이전트 사이를 순환하거나
- `Ctrl+T`로 태스크 목록을 보거나
- tmux pane을 직접 눈으로 확인해야 합니다

CC Team Viewer는 `~/.claude/teams/`와 `~/.claude/tasks/` 디렉토리의 JSON 파일을 실시간 감시하여, 별도의 터미널 pane이나 VS Code 패널에서 전체 팀 상황을 한눈에 보여줍니다.

## 기능

- **팀 개요** — 활성 팀, 멤버 수, 전체 진행률
- **에이전트 상태** — 각 에이전트가 현재 무슨 작업 중인지, 모델(opus/sonnet/haiku), 백엔드 타입
- **태스크 보드** — 상태(pending/in_progress/completed), 담당자, 의존성, 차단 관계
- **메시지 로그** — 에이전트 간 통신 내역 실시간 표시
- **의존성 그래프** — 태스크 간 블로킹 관계 시각화
- **진행률 통계** — 완료율, 경과 시간, 에이전트별 처리량

## 패키지 구조

```
packages/
├── core/     # 파일 감시 + JSON 파싱 + 이벤트 (공유 라이브러리)
├── tui/      # 터미널 UI (ink 기반, Windows Terminal/iTerm2/tmux 호환)
└── vscode/   # VS Code 확장프로그램 (사이드바 패널 + WebView 대시보드)
```

## 빠른 시작

### 터미널 TUI

```bash
# 설치 & 빌드
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install
npm run build

# 실행
npm run tui
```

### VS Code 확장

```bash
# 빌드 & 설치
cd packages/vscode
npm run package
code --install-extension cc-team-viewer-*.vsix
```

## 호환성

| 환경 | TUI | VS Code 확장 |
|------|-----|-------------|
| macOS (iTerm2/Terminal) | 지원 | 지원 |
| macOS (tmux pane) | 지원 | - |
| Windows (네이티브) | 지원 | 지원 |
| Windows (WSL) | 지원 | 지원 (Remote WSL) |
| Linux | 지원 | 지원 |

> **참고**: Agent Teams 자체는 tmux(split-pane) 또는 in-process 모드로 동작합니다.
> CC Team Viewer는 파일 시스템만 읽으므로 어떤 환경에서든 동작합니다.

## 요구 사항

- Node.js 20+
- Claude Code (Agent Teams 활성화)

## 개발

```bash
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install
npm run dev        # TUI 개발 모드 (--watch)
npm run build      # 전체 빌드
npm run test:run   # 테스트 실행
```

## 라이선스

[MIT](LICENSE)
