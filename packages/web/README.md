# @cc-team-viewer/web

> 🚧 Phase 3 — 아직 구현되지 않음

Express + WebSocket 서버와 React 대시보드.
Mac Mini에 Docker로 호스팅하여 원격 모니터링 지원 예정.

## 계획된 구조

```
src/
├── api/
│   ├── server.ts          # Express + WebSocket 서버
│   └── routes.ts          # REST API (/api/teams, /api/tasks)
├── components/
│   ├── Dashboard.tsx       # 메인 대시보드 (React 아티팩트 기반)
│   ├── AgentPanel.tsx
│   ├── TaskBoard.tsx
│   └── MessageLog.tsx
└── hooks/
    └── useWebSocket.ts    # WebSocket 실시간 연결
```

## Docker 배포

```bash
docker build -t cc-team-viewer-web .
docker run -d -p 3040:3040 \
  -v ~/.claude:/root/.claude:ro \
  --name cc-team-viewer-web \
  cc-team-viewer-web
```
