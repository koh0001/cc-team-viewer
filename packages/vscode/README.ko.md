# CC Team Viewer for VS Code

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/koh-dev.cc-team-viewer-vscode?label=VS%20Code%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=koh-dev.cc-team-viewer-vscode)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/koh-dev.cc-team-viewer-vscode)](https://marketplace.visualstudio.com/items?itemName=koh-dev.cc-team-viewer-vscode)

**Claude Code Agent Teams 실시간 모니터링 대시보드**

[English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

![개요](https://raw.githubusercontent.com/koh0001/cc-team-viewer/main/packages/vscode/images/screenshot-overview.png)

## CC Team Viewer란?

[Claude Code Agent Teams](https://docs.anthropic.com/en/docs/claude-code/agent-teams)를 실행하면 여러 AI 에이전트가 태스크를 병렬로 처리합니다. CC Team Viewer는 에이전트들의 진행 상황을 실시간으로 모니터링할 수 있는 대시보드를 제공합니다 — 어떤 에이전트가 활성 상태인지, 어떤 태스크를 진행 중인지, 에이전트 간 어떤 대화가 오가는지 한눈에 파악할 수 있습니다.

## 기능

### WebView 대시보드
4개 탭으로 구성된 인터랙티브 대시보드:

| 탭 | 설명 |
|----|------|
| **Overview** | 에이전트 카드 — 상태, 진행 중인 태스크, 진행률. 클릭 시 담당 태스크 목록 펼침 |
| **Tasks** | 태스크 테이블/칸반 보드 — 클릭 시 인라인 상세 패널 (설명, blockedBy/blocks 링크) |
| **Messages** | 메시지 로그 — 필터 버튼(전체/대화/시스템) + 스레드 그룹핑 |
| **Deps** | DAG 그래프 — CSS Grid 레이아웃 + SVG Bezier 곡선 엣지로 의존성 시각화 |

![태스크](https://raw.githubusercontent.com/koh0001/cc-team-viewer/main/packages/vscode/images/screenshot-tasks.png)

![메시지](https://raw.githubusercontent.com/koh0001/cc-team-viewer/main/packages/vscode/images/screenshot-messages.png)

### 트리뷰 사이드바
활동 바에서 **팀 > 에이전트 > 태스크** 계층 구조로 탐색. 항목 클릭 시 바로 이동.

### 상태 바
항상 표시되는 진행률 요약: `refactor-auth 62% (5/8)` — 클릭하면 대시보드 열기.

### 다국어 지원
대시보드 UI를 4개 언어로 제공: 한국어, English, 日本語, 中文
- `설정 > CC Team Viewer > Language`에서 변경
- 또는 대시보드 헤더의 언어 버튼을 클릭하여 순환 전환

### 추가 기능
- **태스크 상세 패널** — 태스크 클릭 시 인라인으로 설명, 상태, 담당자, 의존성 링크 표시
- **메시지 스레드** — 동일 발신→수신 연속 메시지를 접을 수 있는 스레드로 그룹핑
- **실시간 알림** — 태스크 완료, 에이전트 합류/이탈 시 VS Code 알림 팝업
- **팀 pill 전환** — 여러 팀 동시 모니터링 시 빠른 전환
- **에이전트 펄스 애니메이션** — 작업 중인 에이전트 시각적 표시
- **렌더 최적화** — 활성 탭만 렌더링, 데이터 미변경 시 재렌더링 스킵
- **테마 통합** — VS Code 테마에 맞게 자동 적용 (라이트/다크/하이 콘트라스트)

## 설치

### VS Code 마켓플레이스에서 설치

**[마켓플레이스에서 설치](https://marketplace.visualstudio.com/items?itemName=koh-dev.cc-team-viewer-vscode)**

또는 확장 패널에서 **"CC Team Viewer"** 검색, 또는:

```
ext install koh-dev.cc-team-viewer-vscode
```

### .vsix 파일로 설치

```bash
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install && npm run build
cd packages/vscode && npm run package
code --install-extension cc-team-viewer-vscode-*.vsix
```

## 사용법

1. 터미널에서 Claude Code Agent Team 시작
2. VS Code를 열면 `~/.claude/` 감지 시 확장 자동 활성화
3. 활동 바의 **망원경 아이콘**을 클릭하여 트리뷰 열기
4. **대시보드 아이콘**을 클릭하여 WebView 대시보드 열기

> `~/.claude/teams/`와 `~/.claude/tasks/` 디렉토리의 변경을 자동 감시합니다. 별도 설정 불필요.

## 커맨드

| 커맨드 | 설명 |
|--------|------|
| `CC Team Viewer: Open Dashboard` | WebView 대시보드 패널 열기 |
| `CC Team Viewer: Refresh` | 팀 데이터 수동 새로고침 |
| `CC Team Viewer: Select Team` | 활성 팀 전환 |

커맨드 팔레트(`Ctrl+Shift+P` / `Cmd+Shift+P`)에서 접근 가능.

## 설정

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `ccTeamViewer.language` | `auto` | 대시보드 언어 (`auto`, `ko`, `en`, `ja`, `zh`) |

## 요구 사항

- VS Code 1.90+
- Claude Code (Agent Teams 활성화)

## 라이선스

[MIT](../../LICENSE)
