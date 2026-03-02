#!/bin/bash
# mock-team.sh - 개발/테스트용 가짜 Agent Team 데이터 생성
#
# 사용법: ./scripts/mock-team.sh [team-name]
# ~/.claude/teams/ 와 ~/.claude/tasks/ 에 mock 데이터를 생성합니다.

set -e

TEAM_NAME="${1:-test-team}"
CLAUDE_DIR="${HOME}/.claude"
TEAMS_DIR="${CLAUDE_DIR}/teams/${TEAM_NAME}"
TASKS_DIR="${CLAUDE_DIR}/tasks/${TEAM_NAME}"

echo "🔧 Mock Agent Team 생성: ${TEAM_NAME}"
echo "   경로: ${TEAMS_DIR}"

# 디렉토리 생성
mkdir -p "${TEAMS_DIR}/inboxes"
mkdir -p "${TASKS_DIR}"

# config.json
NOW_MS=$(python3 -c "import time; print(int(time.time() * 1000))" 2>/dev/null || echo "$(date +%s)000")

cat > "${TEAMS_DIR}/config.json" << EOF
{
  "name": "${TEAM_NAME}",
  "description": "테스트용 Agent Team",
  "leadAgentId": "team-lead@${TEAM_NAME}",
  "createdAt": ${NOW_MS},
  "members": [
    {
      "agentId": "team-lead@${TEAM_NAME}",
      "name": "team-lead",
      "agentType": "team-lead",
      "color": "#6366f1",
      "joinedAt": ${NOW_MS},
      "backendType": "in-process",
      "model": "opus"
    },
    {
      "agentId": "backend@${TEAM_NAME}",
      "name": "backend",
      "agentType": "Backend Developer",
      "color": "#10b981",
      "joinedAt": ${NOW_MS},
      "backendType": "in-process",
      "model": "sonnet",
      "prompt": "API 구현 담당"
    },
    {
      "agentId": "frontend@${TEAM_NAME}",
      "name": "frontend",
      "agentType": "Frontend Developer",
      "color": "#f59e0b",
      "joinedAt": ${NOW_MS},
      "backendType": "in-process",
      "model": "sonnet",
      "prompt": "UI 구현 담당"
    }
  ]
}
EOF

# 태스크
cat > "${TASKS_DIR}/1.json" << EOF
{"id":"1","subject":"API 설계","description":"REST API 스키마 설계","status":"completed","owner":"backend","blocks":[],"blockedBy":[],"metadata":{}}
EOF

cat > "${TASKS_DIR}/2.json" << EOF
{"id":"2","subject":"컴포넌트 설계","description":"React 컴포넌트 구조 설계","status":"completed","owner":"frontend","blocks":[],"blockedBy":[],"metadata":{}}
EOF

cat > "${TASKS_DIR}/3.json" << EOF
{"id":"3","subject":"API 구현","description":"엔드포인트 구현","status":"in_progress","owner":"backend","blocks":[],"blockedBy":["1"],"metadata":{}}
EOF

cat > "${TASKS_DIR}/4.json" << EOF
{"id":"4","subject":"UI 구현","description":"대시보드 UI","status":"in_progress","owner":"frontend","blocks":[],"blockedBy":["2"],"metadata":{}}
EOF

cat > "${TASKS_DIR}/5.json" << EOF
{"id":"5","subject":"테스트","description":"통합 테스트","status":"pending","owner":"","blocks":[],"blockedBy":["3","4"],"metadata":{}}
EOF

# 메시지 inbox
cat > "${TEAMS_DIR}/inboxes/team-lead.json" << EOF
[
  {"from":"backend","to":"team-lead","type":"text","content":"API 설계 완료","timestamp":${NOW_MS},"read":true},
  {"from":"frontend","to":"team-lead","type":"text","content":"컴포넌트 설계 완료","timestamp":${NOW_MS},"read":true}
]
EOF

cat > "${TEAMS_DIR}/inboxes/frontend.json" << EOF
[
  {"from":"backend","to":"frontend","type":"text","content":"API 타입 정의: src/types/api.ts 확인","timestamp":${NOW_MS},"read":true}
]
EOF

echo ""
echo "✅ Mock 데이터 생성 완료!"
echo ""
echo "확인:"
echo "  cat ${TEAMS_DIR}/config.json | python3 -m json.tool"
echo "  ls ${TASKS_DIR}/"
echo ""
echo "정리:"
echo "  rm -rf ${TEAMS_DIR} ${TASKS_DIR}"
