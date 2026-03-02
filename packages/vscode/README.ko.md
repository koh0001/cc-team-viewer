# CC Team Viewer for VS Code

**Claude Code Agent Teams 실시간 모니터링 대시보드**

[English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

## 기능

- **WebView 대시보드** — 개요, 태스크, 메시지, 의존성 탭
- **트리뷰 사이드바** — 활동 바에서 팀 > 에이전트 > 태스크 계층 구조
- **상태 바** — 태스크 완료 진행률을 한눈에
- **팀 pill 전환** — 원클릭으로 빠른 팀 전환
- **에이전트 펄스 애니메이션** — 활성 에이전트 시각적 표시
- **실시간 업데이트** — 팀 파일 변경 시 자동 갱신
- **테마 통합** — VS Code 테마에 맞게 적용 (라이트/다크/하이 콘트라스트)

## 설치

### .vsix 파일로 설치

```bash
# 소스에서 빌드
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install
npm run build
cd packages/vscode
npm run package
code --install-extension cc-team-viewer-*.vsix
```

### 소스에서 실행 (개발용)

1. VS Code에서 모노레포를 열기
2. `F5`를 눌러 Extension Development Host 실행
3. 활동 바에 CC Team Viewer 패널이 나타남

## 사용법

1. 터미널에서 Claude Code Agent Team을 시작
2. VS Code를 열면 `~/.claude/` 감지 시 확장이 자동 활성화
3. 활동 바의 망원경 아이콘을 클릭하여 트리뷰 열기
4. 대시보드 아이콘을 클릭하여 WebView 대시보드 열기

## 커맨드

| 커맨드 | 설명 |
|--------|------|
| `CC Team Viewer: Open Dashboard` | WebView 대시보드 패널 열기 |
| `CC Team Viewer: Refresh` | 팀 데이터 수동 새로고침 |
| `CC Team Viewer: Select Team` | 활성 팀 전환 |

커맨드 팔레트(`Ctrl+Shift+P` / `Cmd+Shift+P`)에서 접근 가능.

## 요구 사항

- VS Code 1.90+
- Node.js 20+
- Claude Code (Agent Teams 활성화)

## 라이선스

[MIT](../../LICENSE)
