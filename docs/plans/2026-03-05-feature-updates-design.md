# CC Team Viewer 기능 업데이트 디자인

> 작성일: 2026-03-05

## 개요

VS Code 확장의 4가지 기능을 업데이트한다.

1. Deps 탭 그래프 시각화 (CSS Grid DAG)
2. 태스크 상세 패널 (인라인 확장)
3. 메시지 탭 개선 (필터 + 스레드 그룹핑)
4. 실시간 알림 + 렌더 최적화

---

## 1. Deps 그래프 시각화

### 방식: CSS Grid DAG

외부 라이브러리 없이 순수 CSS+DOM+SVG로 태스크 의존성 그래프를 시각화한다.

### 구현

- `renderDeps(snap)` 함수를 교체
- `blockedBy` 관계로 위상 정렬(topological sort) 수행하여 레이어(depth) 분리
- 레이어별로 CSS Grid 열에 배치 (의존성 없는 태스크 = 0열)
- 노드: `div` 요소, 상태별 색상 (기존 `.task-status` CSS 재사용)
- 엣지: SVG 오버레이, 노드 위치 계산 후 `<path>` Bezier 곡선 연결
- 노드 hover → subject, owner 툴팁 표시
- 노드 클릭 → 태스크 상세 패널(기능 2)과 연동

### 파일 변경

| 파일 | 변경 내용 |
|------|----------|
| `dashboard-js.ts` | `renderDeps()` 재작성, `topoSort()` 유틸 함수 추가 |
| `dashboard-css.ts` | `.dep-graph`, `.dep-node`, `.dep-edge` 스타일 추가 |

### 스코프 제한

- 순환 의존성 없다고 가정 (Agent Teams 프로토콜이 DAG 보장)
- 태스크 50개 이상은 스크롤 처리

---

## 2. 태스크 상세 패널

### 방식: 인라인 확장 (아코디언)

태스크를 클릭하면 바로 아래에 상세 영역이 펼쳐진다.

### 동작

- **테이블 뷰**: 행 클릭 → 아래에 상세 `<tr>` 삽입 (colspan 전체). 재클릭 시 접힘
- **칸반 뷰**: 카드 클릭 → 카드 내부에 상세 영역 expand
- **Deps 그래프**: 노드 클릭 → 그래프 하단에 상세 패널 표시

### 상세 패널 내용

- `description` (없으면 i18n `task.noDescription`)
- Owner (에이전트 색상 포함)
- Status (상태 dot + 레이블)
- Blocked by: `#id subject` 형태 (클릭 시 해당 태스크로 이동)
- Blocks: 이 태스크가 차단하는 태스크 목록

### 상태 관리

- `state.expandedTaskId`에 열린 태스크 ID 저장 (하나만 열림)
- 렌더 시 이전에 열린 태스크 자동 복원

### 파일 변경

| 파일 | 변경 내용 |
|------|----------|
| `dashboard-js.ts` | `renderTaskDetail(task, snap)` 함수 추가, 각 렌더러에 클릭 이벤트 |
| `dashboard-css.ts` | `.task-detail-panel` 스타일 |
| `dashboard-provider.ts` | description 필드가 WebView에 전달되는지 확인 (이미 TaskSnapshot에 포함) |

### i18n 키 추가

- `task.noDescription`
- `task.blocks` (이 태스크가 차단하는 목록 레이블)

---

## 3. 메시지 탭 개선

### 방식: 필터 버튼 + 스레드 그룹핑

### 필터 버튼

상단에 토글 바 (기존 `createViewModeButton` 패턴 재사용):

| 필터 | 포함 타입 |
|------|----------|
| 전체 | 모든 메시지 |
| 대화 | `text`, `task_assignment`, `permission_request`, `plan_approval_request` |
| 시스템 | `idle_notification`, `shutdown_request`, `shutdown_approved` |

- `state.messageFilter`로 상태 관리 (`'all' | 'conversation' | 'system'`)

### 스레드 그룹핑

- 동일 `from→to` 쌍의 연속 메시지를 스레드로 묶음
- 스레드 헤더: `agentA → agentB (3)` + 시간 범위
- 접기/펼치기 (기본: 최신 3개 스레드만 펼침)
- 스레드 내부는 기존 메시지 행 형태 유지

### 파일 변경

| 파일 | 변경 내용 |
|------|----------|
| `dashboard-js.ts` | `renderMessages()` 리팩토링, 필터 바, `groupIntoThreads()` 유틸 |
| `dashboard-css.ts` | `.msg-filter-toggle`, `.msg-thread`, `.msg-thread-header` 스타일 |

### i18n 키 추가

- `message.filterAll`
- `message.filterConversation`
- `message.filterSystem`
- `message.threadCount` (예: `"{count}개 메시지"`)

---

## 4. 실시간 알림 + 렌더 최적화

### 실시간 알림

**트리거 이벤트:**

| 이벤트 | 알림 내용 | 레벨 |
|--------|----------|------|
| `task:completed` | `"✓ #{id} {subject} 완료"` | information |
| `agent:joined` | `"⚡ {name} 합류"` | information |
| `agent:left` | `"💤 {name} 이탈"` | information |

**구현:**
- `watcher-service.ts`에서 개별 이벤트(`task:completed`, `agent:joined`, `agent:left`) 구독
- `vscode.window.showInformationMessage()`로 알림

### 렌더 최적화

**문제:** `renderAll()`이 호출될 때마다 4개 탭 전부 DOM 재구성

**개선:**
- `renderAll()` → 현재 활성 탭만 렌더링
- `state.dirtyTabs` Set 추가: snapshot 업데이트 시 모든 탭을 dirty로 마킹
- 탭 전환 시 dirty면 렌더링 후 클리어

### 파일 변경

| 파일 | 변경 내용 |
|------|----------|
| `watcher-service.ts` | 개별 이벤트 구독 + `showInformationMessage` 호출 |
| `dashboard-js.ts` | `renderAll()` 조건부 렌더링 |
| i18n 4개 로케일 | `notification.taskCompleted`, `notification.agentJoined`, `notification.agentLeft` |

---

## 구현 순서 (권장)

1. **렌더 최적화** — 다른 기능 추가 전에 기반 성능 개선
2. **태스크 상세 패널** — description 노출은 단독 가치가 높음
3. **메시지 탭 개선** — 필터 + 스레드로 가독성 향상
4. **Deps 그래프 시각화** — 위상 정렬 + SVG 오버레이로 가장 구현량 많음
5. **실시간 알림** — watcher-service 변경으로 독립적 구현 가능

## 영향 범위 요약

| 파일 | 기능 1 | 기능 2 | 기능 3 | 기능 4 |
|------|--------|--------|--------|--------|
| `dashboard-js.ts` | ● | ● | ● | ● |
| `dashboard-css.ts` | ● | ● | ● | |
| `dashboard-provider.ts` | | ● | | |
| `watcher-service.ts` | | | | ● |
| i18n 4개 로케일 | | ● | ● | ● |
| i18n `types.ts` | | ● | ● | ● |
