# CC Team Viewer 기능 업데이트 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** VS Code 확장에 4가지 기능(렌더 최적화, 태스크 상세 패널, 메시지 개선, Deps 그래프, 실시간 알림)을 추가한다.

**Architecture:** WebView 클라이언트 JS(`dashboard-js.ts`)에 lazy render 패턴을 적용하고, 태스크/메시지/Deps 렌더러를 각각 리팩토링한다. 알림은 `watcher-service.ts`에서 core TeamWatcher 이벤트를 구독하여 VS Code notification API로 전달한다.

**Tech Stack:** TypeScript, VS Code WebView API, CSS Grid, SVG (인라인), DOM API

---

## Task 1: 렌더 최적화 — dirty tab 패턴

현재 `renderAll()`이 4개 탭 전부를 매번 재렌더링한다. 활성 탭만 렌더링하고, 나머지는 dirty로 마킹하여 탭 전환 시 렌더링한다.

**Files:**
- Modify: `packages/vscode/src/views/dashboard-js.ts:18-25` (state에 dirtyTabs 추가)
- Modify: `packages/vscode/src/views/dashboard-js.ts:82-109` (renderAll 수정)
- Modify: `packages/vscode/src/views/dashboard-js.ts:525-535` (switchTab 수정)

**Step 1: state에 dirtyTabs 추가**

`packages/vscode/src/views/dashboard-js.ts:18-25`의 state 객체를 수정:

```javascript
let state = {
  teams: {},
  selectedTeam: '',
  currentTab: 'overview',
  taskViewMode: 'table',
  translations: {},
  locale: 'ko',
  dirtyTabs: new Set(),
  expandedTaskId: null,
  messageFilter: 'all'
};
```

> 참고: `expandedTaskId`와 `messageFilter`는 후속 태스크에서 사용할 상태를 미리 추가.

**Step 2: renderAll()을 활성 탭만 렌더링하도록 수정**

`packages/vscode/src/views/dashboard-js.ts:82-109`의 `renderAll()` 함수를 교체:

```javascript
function renderAll() {
  const teamNames = Object.keys(state.teams);
  const hasTeams = teamNames.length > 0;

  const dashboard = document.getElementById('dashboard');
  const emptyState = document.getElementById('empty-state');
  if (hasTeams) {
    dashboard.classList.remove('dashboard-hidden');
    emptyState.classList.add('dashboard-hidden');
  } else {
    dashboard.classList.add('dashboard-hidden');
    emptyState.classList.remove('dashboard-hidden');
  }

  if (!hasTeams) return;

  renderLanguageButton();
  renderTeamSelector(teamNames);
  const snap = state.teams[state.selectedTeam];
  if (!snap) return;

  renderStatsBar(snap);
  renderTabs();

  // 활성 탭만 렌더링, 나머지는 dirty 마킹
  renderCurrentTab(snap);
  ['overview', 'tasks', 'messages', 'deps'].forEach(function(tab) {
    if (tab !== state.currentTab) state.dirtyTabs.add(tab);
  });
}

function renderCurrentTab(snap) {
  state.dirtyTabs.delete(state.currentTab);
  if (state.currentTab === 'overview') renderOverview(snap);
  else if (state.currentTab === 'tasks') renderTasks(snap);
  else if (state.currentTab === 'messages') renderMessages(snap);
  else if (state.currentTab === 'deps') renderDeps(snap);
}
```

**Step 3: switchTab()에서 dirty 탭만 렌더링**

`packages/vscode/src/views/dashboard-js.ts:525-535`의 `switchTab()` 함수를 교체:

```javascript
function switchTab(tab) {
  state.currentTab = tab;
  vscode.postMessage({ command: 'changeTab', tab: tab });
  renderTabs();
  const snap = state.teams[state.selectedTeam];
  if (!snap) return;
  renderCurrentTab(snap);
}
```

**Step 4: 빌드 확인**

Run: `npm run build:vscode`
Expected: Build success

**Step 5: 커밋**

```bash
git add packages/vscode/src/views/dashboard-js.ts
git commit -m "perf: render only active tab, dirty-mark others for lazy render"
```

---

## Task 2: i18n 키 추가 (태스크 상세 + 메시지 필터 + 알림)

후속 태스크에서 사용할 모든 i18n 키를 한 번에 추가한다.

**Files:**
- Modify: `packages/core/src/i18n/types.ts:76-78` (새 키 추가)
- Modify: `packages/core/src/i18n/locales/ko.ts` (한국어 번역)
- Modify: `packages/core/src/i18n/locales/en.ts` (영어 번역)
- Modify: `packages/core/src/i18n/locales/ja.ts` (일본어 번역)
- Modify: `packages/core/src/i18n/locales/zh.ts` (중국어 번역)
- Modify: `packages/vscode/src/providers/dashboard-provider.ts:21-33` (WEBVIEW_TRANSLATION_KEYS)

**Step 1: types.ts에 새 키 추가**

`packages/core/src/i18n/types.ts`의 `TranslationMap`에 아래 키를 추가 — `"task.blockedByLabel"` 뒤, `// 메시지` 앞:

```typescript
  "task.noDescription": string;
  "task.blocksLabel": string;
```

`// 메시지` 섹션의 `"message.olderOmitted"` 뒤:

```typescript
  "message.filterAll": string;
  "message.filterConversation": string;
  "message.filterSystem": string;
  "message.threadCount": string;
```

`// 의존성 그래프` 섹션의 `"deps.sectionTitle"` 뒤:

```typescript
  "deps.noTasks": string;
```

`// 에러` 섹션의 `"error.startFailed"` 뒤:

```typescript
  "notification.taskCompleted": string;
  "notification.agentJoined": string;
  "notification.agentLeft": string;
```

**Step 2: ko.ts에 한국어 번역 추가**

태스크 섹션 (`"task.blockedByLabel"` 뒤):
```typescript
  "task.noDescription": "설명 없음",
  "task.blocksLabel": "차단 중",
```

메시지 섹션 (`"message.olderOmitted"` 뒤):
```typescript
  "message.filterAll": "전체",
  "message.filterConversation": "대화",
  "message.filterSystem": "시스템",
  "message.threadCount": "{count}개 메시지",
```

의존성 섹션 (`"deps.sectionTitle"` 뒤):
```typescript
  "deps.noTasks": "태스크 없음",
```

에러 섹션 (`"error.startFailed"` 뒤):
```typescript
  "notification.taskCompleted": "✓ #{id} {subject} 완료",
  "notification.agentJoined": "⚡ {name} 합류",
  "notification.agentLeft": "💤 {name} 이탈",
```

**Step 3: en.ts에 영어 번역 추가**

같은 위치에:
```typescript
  "task.noDescription": "No description",
  "task.blocksLabel": "Blocks",

  "message.filterAll": "All",
  "message.filterConversation": "Chat",
  "message.filterSystem": "System",
  "message.threadCount": "{count} messages",

  "deps.noTasks": "No tasks",

  "notification.taskCompleted": "✓ #{id} {subject} completed",
  "notification.agentJoined": "⚡ {name} joined",
  "notification.agentLeft": "💤 {name} left",
```

**Step 4: ja.ts에 일본어 번역 추가**

```typescript
  "task.noDescription": "説明なし",
  "task.blocksLabel": "ブロック中",

  "message.filterAll": "すべて",
  "message.filterConversation": "会話",
  "message.filterSystem": "システム",
  "message.threadCount": "{count}件",

  "deps.noTasks": "タスクなし",

  "notification.taskCompleted": "✓ #{id} {subject} 完了",
  "notification.agentJoined": "⚡ {name} 参加",
  "notification.agentLeft": "💤 {name} 離脱",
```

**Step 5: zh.ts에 중국어 번역 추가**

```typescript
  "task.noDescription": "无描述",
  "task.blocksLabel": "阻塞中",

  "message.filterAll": "全部",
  "message.filterConversation": "对话",
  "message.filterSystem": "系统",
  "message.threadCount": "{count}条消息",

  "deps.noTasks": "无任务",

  "notification.taskCompleted": "✓ #{id} {subject} 已完成",
  "notification.agentJoined": "⚡ {name} 加入",
  "notification.agentLeft": "💤 {name} 离开",
```

**Step 6: dashboard-provider.ts의 WEBVIEW_TRANSLATION_KEYS에 새 키 추가**

`packages/vscode/src/providers/dashboard-provider.ts:21-33` 배열에 추가:

```typescript
const WEBVIEW_TRANSLATION_KEYS: TranslationKey[] = [
  "status.completed", "status.inProgress", "status.pending",
  "stats.tasks", "stats.active", "stats.messages", "stats.elapsed",
  "agent.sectionTitle", "agent.taskProgress", "agent.noAgents",
  "task.headerId", "task.headerTask", "task.headerOwner", "task.headerStatus",
  "task.unassigned", "task.noTasks",
  "task.viewTable", "task.viewKanban",
  "task.columnPending", "task.columnInProgress", "task.columnCompleted",
  "task.blockedByLabel",
  "task.noDescription", "task.blocksLabel",
  "message.headerFrom", "message.headerTo", "message.headerContent",
  "message.headerTime", "message.noMessages",
  "message.filterAll", "message.filterConversation", "message.filterSystem",
  "message.threadCount",
  "view.overview", "view.tasks", "view.messages", "view.deps",
  "deps.noTasks",
];
```

**Step 7: 빌드 확인**

Run: `npm run build`
Expected: Build success (TypeScript가 4개 로케일 파일 모두에 새 키가 있는지 검증)

**Step 8: 커밋**

```bash
git add packages/core/src/i18n/ packages/vscode/src/providers/dashboard-provider.ts
git commit -m "feat(i18n): add translation keys for task detail, message filter, deps, notifications"
```

---

## Task 3: TaskPayload에 description 필드 추가

WebView에 태스크 description을 전달하기 위해 메시지 프로토콜을 확장한다.

**Files:**
- Modify: `packages/vscode/src/types/messages.ts:20-27` (TaskPayload에 description 추가)
- Modify: `packages/vscode/src/providers/dashboard-provider.ts:228-235` (toSnapshotPayload에서 description 전달)

**Step 1: TaskPayload에 description 추가**

`packages/vscode/src/types/messages.ts:20-27`:

```typescript
export interface TaskPayload {
  id: string;
  subject: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  owner: string;
  blockedBy: string[];
  blocks: string[];
}
```

**Step 2: toSnapshotPayload에서 description 전달**

`packages/vscode/src/providers/dashboard-provider.ts:228-235`의 tasks.map 내부:

```typescript
tasks: snapshot.tasks.map((task): TaskPayload => ({
  id: task.id,
  subject: task.subject,
  description: task.description,
  status: task.status,
  owner: task.owner,
  blockedBy: [...task.blockedBy],
  blocks: [...task.blocks],
})),
```

**Step 3: 빌드 확인**

Run: `npm run build:vscode`
Expected: Build success

**Step 4: 커밋**

```bash
git add packages/vscode/src/types/messages.ts packages/vscode/src/providers/dashboard-provider.ts
git commit -m "feat: pass task description to WebView via TaskPayload"
```

---

## Task 4: 태스크 상세 패널 (인라인 확장)

태스크 행/카드 클릭 시 아래에 description, owner, deps 상세 패널이 펼쳐진다.

**Files:**
- Modify: `packages/vscode/src/views/dashboard-js.ts` (renderTaskDetail, 클릭 이벤트 추가)
- Modify: `packages/vscode/src/views/dashboard-css.ts` (상세 패널 스타일)

**Step 1: dashboard-css.ts에 상세 패널 스타일 추가**

`packages/vscode/src/views/dashboard-css.ts`의 `.kanban-empty` 블록 뒤에 추가:

```css
    /* 태스크 상세 패널 */
    .task-detail-panel {
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      padding: 12px 16px;
      margin: 4px 0 8px;
      animation: fadeIn 0.15s ease-out;
      font-size: 12px;
    }
    .task-detail-desc {
      margin-bottom: 8px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--vscode-foreground);
    }
    .task-detail-desc.empty {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }
    .task-detail-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      border-top: 1px solid var(--vscode-widget-border);
      padding-top: 8px;
    }
    .task-detail-meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .task-detail-meta-label {
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .task-detail-link {
      color: var(--vscode-textLink-foreground);
      cursor: pointer;
      text-decoration: none;
    }
    .task-detail-link:hover { text-decoration: underline; }
    .task-table tbody tr { cursor: pointer; }
    .kanban-card { cursor: pointer; }
```

**Step 2: dashboard-js.ts에 createTaskDetailPanel 함수 추가**

`dashboard-js.ts`의 `createOwnerElement` 함수 뒤에 추가:

```javascript
    function createTaskDetailPanel(task, allTasks) {
      var panel = document.createElement('div');
      panel.className = 'task-detail-panel';

      // description
      var desc = document.createElement('div');
      if (task.description) {
        desc.className = 'task-detail-desc';
        desc.textContent = task.description;
      } else {
        desc.className = 'task-detail-desc empty';
        desc.textContent = t('task.noDescription');
      }
      panel.appendChild(desc);

      // 메타 정보
      var meta = document.createElement('div');
      meta.className = 'task-detail-meta';

      // 상태
      var statusItem = document.createElement('span');
      statusItem.className = 'task-detail-meta-item';
      var statusDot = document.createElement('span');
      statusDot.className = 'task-status ' + task.status;
      var statusLabel = document.createElement('span');
      statusLabel.textContent = t('status.' + (task.status === 'in_progress' ? 'inProgress' : task.status));
      statusItem.appendChild(statusDot);
      statusItem.appendChild(statusLabel);
      meta.appendChild(statusItem);

      // 담당자
      var ownerItem = document.createElement('span');
      ownerItem.className = 'task-detail-meta-item';
      var ownerLabel = document.createElement('span');
      ownerLabel.className = 'task-detail-meta-label';
      ownerLabel.textContent = t('task.headerOwner') + ':';
      ownerItem.appendChild(ownerLabel);
      ownerItem.appendChild(createOwnerElement(task));
      meta.appendChild(ownerItem);

      // blockedBy
      if (task.blockedBy.length > 0) {
        var blockedItem = document.createElement('span');
        blockedItem.className = 'task-detail-meta-item';
        var blockedLabel = document.createElement('span');
        blockedLabel.className = 'task-detail-meta-label';
        blockedLabel.textContent = t('task.blockedByLabel') + ':';
        blockedItem.appendChild(blockedLabel);
        task.blockedBy.forEach(function(blockId, i) {
          if (i > 0) blockedItem.appendChild(document.createTextNode(', '));
          var link = document.createElement('span');
          link.className = 'task-detail-link';
          var linkedTask = allTasks.find(function(tk) { return tk.id === blockId; });
          link.textContent = '#' + blockId + (linkedTask ? ' ' + linkedTask.subject : '');
          link.addEventListener('click', function(e) {
            e.stopPropagation();
            state.expandedTaskId = blockId;
            var snap = state.teams[state.selectedTeam];
            if (snap) renderTasks(snap);
          });
          blockedItem.appendChild(link);
        });
        meta.appendChild(blockedItem);
      }

      // blocks
      var blockingTasks = allTasks.filter(function(tk) { return tk.blockedBy.includes(task.id); });
      if (blockingTasks.length > 0) {
        var blocksItem = document.createElement('span');
        blocksItem.className = 'task-detail-meta-item';
        var blocksLabel = document.createElement('span');
        blocksLabel.className = 'task-detail-meta-label';
        blocksLabel.textContent = t('task.blocksLabel') + ':';
        blocksItem.appendChild(blocksLabel);
        blockingTasks.forEach(function(bt, i) {
          if (i > 0) blocksItem.appendChild(document.createTextNode(', '));
          var link = document.createElement('span');
          link.className = 'task-detail-link';
          link.textContent = '#' + bt.id + ' ' + bt.subject;
          link.addEventListener('click', function(e) {
            e.stopPropagation();
            state.expandedTaskId = bt.id;
            var snap = state.teams[state.selectedTeam];
            if (snap) renderTasks(snap);
          });
          blocksItem.appendChild(link);
        });
        meta.appendChild(blocksItem);
      }

      panel.appendChild(meta);
      return panel;
    }

    function toggleTaskDetail(taskId) {
      state.expandedTaskId = (state.expandedTaskId === taskId) ? null : taskId;
      var snap = state.teams[state.selectedTeam];
      if (snap) renderTasks(snap);
    }
```

**Step 3: renderTaskTable에 클릭 이벤트 + 상세 패널 삽입**

`packages/vscode/src/views/dashboard-js.ts`의 `renderTaskTable` 함수 내부, `tbody.appendChild(tr);` 직전에 클릭 핸들러를 추가하고, 직후에 상세 패널 삽입 로직을 추가:

기존 `tbody.appendChild(tr);` 행을 아래로 교체:

```javascript
        tr.addEventListener('click', function() { toggleTaskDetail(task.id); });
        tbody.appendChild(tr);

        if (state.expandedTaskId === task.id) {
          var detailTr = document.createElement('tr');
          var detailTd = document.createElement('td');
          detailTd.setAttribute('colspan', '4');
          detailTd.appendChild(createTaskDetailPanel(task, tasks));
          detailTr.appendChild(detailTd);
          tbody.appendChild(detailTr);
        }
```

**Step 4: createKanbanCard에 클릭 이벤트 + 상세 패널 삽입**

`packages/vscode/src/views/dashboard-js.ts`의 `createKanbanCard` 함수를 수정하여 두 번째 파라미터 `allTasks`를 받고, `return card;` 직전에 상세 패널 삽입:

함수 시그니처 변경: `function createKanbanCard(task)` → `function createKanbanCard(task, allTasks)`

`return card;` 직전에 추가:
```javascript
      card.addEventListener('click', function() { toggleTaskDetail(task.id); });

      if (state.expandedTaskId === task.id) {
        card.appendChild(createTaskDetailPanel(task, allTasks));
      }
```

`renderTaskKanban`의 호출부도 수정: `createKanbanCard(task)` → `createKanbanCard(task, tasks)`

**Step 5: 빌드 확인**

Run: `npm run build:vscode`
Expected: Build success

**Step 6: 커밋**

```bash
git add packages/vscode/src/views/dashboard-js.ts packages/vscode/src/views/dashboard-css.ts
git commit -m "feat: add inline task detail panel with description, deps, and cross-linking"
```

---

## Task 5: 메시지 탭 개선 (필터 + 스레드 그룹핑)

**Files:**
- Modify: `packages/vscode/src/views/dashboard-js.ts:430-480` (renderMessages 재작성)
- Modify: `packages/vscode/src/views/dashboard-css.ts` (필터, 스레드 스타일)

**Step 1: dashboard-css.ts에 메시지 필터/스레드 스타일 추가**

`packages/vscode/src/views/dashboard-css.ts`의 `.msg-system` 블록 뒤에 추가:

```css
    /* 메시지 필터 토글 */
    .msg-filter-toggle {
      display: flex;
      gap: 0;
      margin-bottom: 12px;
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      overflow: hidden;
      width: fit-content;
    }
    .msg-filter-btn {
      background: var(--vscode-editorWidget-background);
      color: var(--vscode-descriptionForeground);
      border: none;
      padding: 4px 12px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s ease;
      border-right: 1px solid var(--vscode-widget-border);
    }
    .msg-filter-btn:last-child { border-right: none; }
    .msg-filter-btn:hover {
      background: var(--overlay-medium);
      color: var(--vscode-foreground);
    }
    .msg-filter-btn.active {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      font-weight: 600;
    }

    /* 메시지 스레드 */
    .msg-thread {
      margin-bottom: 8px;
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      overflow: hidden;
    }
    .msg-thread-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      background: var(--overlay-subtle);
      cursor: pointer;
      font-size: 12px;
      transition: background 0.15s ease;
    }
    .msg-thread-header:hover { background: var(--overlay-medium); }
    .msg-thread-agents {
      font-weight: 600;
      color: var(--vscode-textLink-foreground);
    }
    .msg-thread-count {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 8px;
      margin-left: auto;
    }
    .msg-thread-time {
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
    }
    .msg-thread-toggle {
      color: var(--vscode-descriptionForeground);
      font-size: 10px;
      transition: transform 0.15s ease;
    }
    .msg-thread-toggle.expanded { transform: rotate(90deg); }
    .msg-thread-body {
      display: none;
      padding: 4px 0;
    }
    .msg-thread-body.expanded { display: block; }
```

**Step 2: dashboard-js.ts에 메시지 유틸 함수 추가**

`renderMessages` 함수 직전에 추가:

```javascript
    var SYSTEM_MSG_TYPES = ['idle_notification', 'shutdown_request', 'shutdown_approved'];

    function createMessageFilterButton(mode, labelKey) {
      var btn = document.createElement('button');
      btn.className = 'msg-filter-btn' + (state.messageFilter === mode ? ' active' : '');
      btn.textContent = t(labelKey);
      btn.addEventListener('click', function() {
        state.messageFilter = mode;
        var snap = state.teams[state.selectedTeam];
        if (snap) renderMessages(snap);
      });
      return btn;
    }

    function groupIntoThreads(messages) {
      var threads = [];
      var current = null;

      messages.forEach(function(msg) {
        var pairKey = msg.from + '>' + msg.to;
        var isSystem = SYSTEM_MSG_TYPES.includes(msg.type);
        var threadType = isSystem ? 'system' : 'conversation';

        if (current && current.pairKey === pairKey && current.threadType === threadType) {
          current.messages.push(msg);
          current.endTime = msg.timestamp;
        } else {
          current = {
            pairKey: pairKey,
            from: msg.from,
            to: msg.to,
            threadType: threadType,
            messages: [msg],
            startTime: msg.timestamp,
            endTime: msg.timestamp
          };
          threads.push(current);
        }
      });

      return threads;
    }
```

**Step 3: renderMessages를 재작성**

기존 `renderMessages` 함수를 통째로 교체:

```javascript
    function renderMessages(snap) {
      var el = document.getElementById('messages-content');
      el.textContent = '';
      if (!snap.messages.length) {
        var p = document.createElement('p');
        p.style.color = 'var(--vscode-descriptionForeground)';
        p.textContent = t('message.noMessages');
        el.appendChild(p);
        return;
      }

      // 필터 바
      var filterBar = document.createElement('div');
      filterBar.className = 'msg-filter-toggle';
      filterBar.appendChild(createMessageFilterButton('all', 'message.filterAll'));
      filterBar.appendChild(createMessageFilterButton('conversation', 'message.filterConversation'));
      filterBar.appendChild(createMessageFilterButton('system', 'message.filterSystem'));
      el.appendChild(filterBar);

      // 필터 적용
      var recent = snap.messages.slice(-50);
      var filtered = recent;
      if (state.messageFilter === 'conversation') {
        filtered = recent.filter(function(msg) { return !SYSTEM_MSG_TYPES.includes(msg.type); });
      } else if (state.messageFilter === 'system') {
        filtered = recent.filter(function(msg) { return SYSTEM_MSG_TYPES.includes(msg.type); });
      }

      if (filtered.length === 0) {
        var empty = document.createElement('p');
        empty.style.color = 'var(--vscode-descriptionForeground)';
        empty.textContent = t('message.noMessages');
        el.appendChild(empty);
        return;
      }

      // 스레드 그룹핑
      var threads = groupIntoThreads(filtered);

      // 최신 3개 스레드만 펼침
      threads.forEach(function(thread, idx) {
        var threadEl = document.createElement('div');
        threadEl.className = 'msg-thread';
        var isExpanded = idx >= threads.length - 3;

        // 스레드 헤더
        var header = document.createElement('div');
        header.className = 'msg-thread-header';

        var toggle = document.createElement('span');
        toggle.className = 'msg-thread-toggle' + (isExpanded ? ' expanded' : '');
        toggle.textContent = '\\u25B6';
        header.appendChild(toggle);

        var agents = document.createElement('span');
        agents.className = 'msg-thread-agents';
        agents.textContent = thread.from + ' \\u2192 ' + thread.to;
        header.appendChild(agents);

        var time = document.createElement('span');
        time.className = 'msg-thread-time';
        time.textContent = timeAgo(thread.endTime);
        header.appendChild(time);

        var count = document.createElement('span');
        count.className = 'msg-thread-count';
        count.textContent = String(thread.messages.length);
        header.appendChild(count);

        threadEl.appendChild(header);

        // 스레드 본문
        var body = document.createElement('div');
        body.className = 'msg-thread-body' + (isExpanded ? ' expanded' : '');

        thread.messages.forEach(function(msg) {
          if (thread.threadType === 'system') {
            var div = document.createElement('div');
            div.className = 'msg-system';
            div.textContent = '[' + msg.type + '] ' + msg.from + ' \\u2192 ' + msg.to;
            body.appendChild(div);
          } else {
            var row = document.createElement('div');
            row.className = 'message-row';

            var content = document.createElement('span');
            content.className = 'msg-content';
            content.textContent = msg.content;

            var msgTime = document.createElement('span');
            msgTime.className = 'msg-time';
            msgTime.textContent = timeAgo(msg.timestamp);

            row.appendChild(content);
            row.appendChild(msgTime);
            body.appendChild(row);
          }
        });

        threadEl.appendChild(body);

        // 토글 클릭
        header.addEventListener('click', function() {
          var expanded = body.classList.toggle('expanded');
          toggle.className = 'msg-thread-toggle' + (expanded ? ' expanded' : '');
        });

        el.appendChild(threadEl);
      });
    }
```

**Step 4: 빌드 확인**

Run: `npm run build:vscode`
Expected: Build success

**Step 5: 커밋**

```bash
git add packages/vscode/src/views/dashboard-js.ts packages/vscode/src/views/dashboard-css.ts
git commit -m "feat: add message filter (all/conversation/system) and thread grouping"
```

---

## Task 6: Deps 그래프 시각화 (CSS Grid DAG + SVG 엣지)

**Files:**
- Modify: `packages/vscode/src/views/dashboard-js.ts:482-510` (renderDeps 재작성)
- Modify: `packages/vscode/src/views/dashboard-css.ts` (그래프 스타일)

**Step 1: dashboard-css.ts에 그래프 스타일 추가**

기존 `.dep-line`, `.dep-completed`, `.dep-in-progress`, `.dep-arrow` 블록을 아래로 교체:

```css
    /* 의존성 DAG 그래프 */
    .dep-graph-container {
      position: relative;
      overflow-x: auto;
      padding-bottom: 8px;
    }
    .dep-graph {
      display: grid;
      gap: 16px 40px;
      padding: 16px;
      min-width: fit-content;
      position: relative;
    }
    .dep-node {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
      z-index: 1;
      min-width: 140px;
      max-width: 220px;
    }
    .dep-node:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      border-color: var(--vscode-focusBorder);
      transform: translateY(-1px);
    }
    .dep-node.completed {
      border-left: 3px solid var(--vscode-charts-green);
      opacity: 0.6;
    }
    .dep-node.in_progress {
      border-left: 3px solid var(--vscode-charts-yellow);
    }
    .dep-node.pending {
      border-left: 3px solid var(--vscode-descriptionForeground);
      opacity: 0.8;
    }
    .dep-node-id {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      font-weight: 600;
    }
    .dep-node-subject {
      font-size: 12px;
      margin: 2px 0;
      line-height: 1.3;
      word-break: break-word;
    }
    .dep-node-owner {
      font-size: 10px;
      color: var(--vscode-textLink-foreground);
    }
    .dep-svg-overlay {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 0;
    }
    .dep-edge {
      fill: none;
      stroke: var(--vscode-widget-border);
      stroke-width: 1.5;
    }
    .dep-edge-arrow {
      fill: var(--vscode-widget-border);
    }
    .dep-no-deps {
      text-align: center;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      padding: 16px 0;
      opacity: 0.5;
    }
```

**Step 2: dashboard-js.ts에 위상 정렬 유틸 추가**

`renderDeps` 함수 직전에 추가:

```javascript
    function topoSortLayers(tasks) {
      // 태스크 ID → depth 맵 계산
      var taskMap = {};
      tasks.forEach(function(task) { taskMap[task.id] = task; });

      var depths = {};
      var visited = {};

      function getDepth(id) {
        if (depths[id] !== undefined) return depths[id];
        if (visited[id]) return 0; // 순환 방지
        visited[id] = true;

        var task = taskMap[id];
        if (!task || task.blockedBy.length === 0) {
          depths[id] = 0;
          return 0;
        }

        var maxParentDepth = 0;
        task.blockedBy.forEach(function(parentId) {
          if (taskMap[parentId]) {
            var d = getDepth(parentId);
            if (d + 1 > maxParentDepth) maxParentDepth = d + 1;
          }
        });

        depths[id] = maxParentDepth;
        return maxParentDepth;
      }

      tasks.forEach(function(task) { getDepth(task.id); });

      // depth별 그룹핑
      var layers = [];
      tasks.forEach(function(task) {
        var d = depths[task.id] || 0;
        if (!layers[d]) layers[d] = [];
        layers[d].push(task);
      });

      return { layers: layers.filter(Boolean), depths: depths };
    }
```

**Step 3: renderDeps 재작성**

기존 `renderDeps` 함수를 통째로 교체:

```javascript
    function renderDeps(snap) {
      var el = document.getElementById('deps-content');
      el.textContent = '';
      if (!snap.tasks.length) {
        var p = document.createElement('p');
        p.style.color = 'var(--vscode-descriptionForeground)';
        p.textContent = t('deps.noTasks');
        el.appendChild(p);
        return;
      }

      // 의존성이 하나도 없으면 간단 리스트 표시
      var hasDeps = snap.tasks.some(function(task) { return task.blockedBy.length > 0; });
      if (!hasDeps) {
        var noDeps = document.createElement('div');
        noDeps.className = 'dep-no-deps';
        noDeps.textContent = '-';
        el.appendChild(noDeps);
        return;
      }

      var result = topoSortLayers(snap.tasks);
      var layers = result.layers;
      var maxCols = layers.length;
      var maxRows = 0;
      layers.forEach(function(layer) {
        if (layer.length > maxRows) maxRows = layer.length;
      });

      var container = document.createElement('div');
      container.className = 'dep-graph-container';

      var graph = document.createElement('div');
      graph.className = 'dep-graph';
      graph.style.gridTemplateColumns = 'repeat(' + maxCols + ', 1fr)';

      // 노드 배치 및 위치 기록
      var nodePositions = {};
      var nodeElements = {};

      layers.forEach(function(layer, colIdx) {
        layer.forEach(function(task, rowIdx) {
          var node = document.createElement('div');
          node.className = 'dep-node ' + task.status;
          node.style.gridColumn = String(colIdx + 1);
          node.style.gridRow = String(rowIdx + 1);
          node.dataset.taskId = task.id;

          var idSpan = document.createElement('span');
          idSpan.className = 'dep-node-id';
          idSpan.textContent = '#' + task.id;
          node.appendChild(idSpan);

          var subject = document.createElement('div');
          subject.className = 'dep-node-subject';
          subject.textContent = task.subject;
          node.appendChild(subject);

          if (task.owner) {
            var owner = document.createElement('div');
            owner.className = 'dep-node-owner';
            owner.textContent = task.owner;
            node.appendChild(owner);
          }

          node.addEventListener('click', function() { toggleTaskDetail(task.id); });

          graph.appendChild(node);
          nodeElements[task.id] = node;
          nodePositions[task.id] = { col: colIdx, row: rowIdx };
        });
      });

      container.appendChild(graph);
      el.appendChild(container);

      // SVG 엣지 (레이아웃 후 그리기)
      requestAnimationFrame(function() {
        var containerRect = container.getBoundingClientRect();
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'dep-svg-overlay');
        svg.setAttribute('width', String(container.scrollWidth));
        svg.setAttribute('height', String(container.scrollHeight));

        snap.tasks.forEach(function(task) {
          task.blockedBy.forEach(function(parentId) {
            var fromEl = nodeElements[parentId];
            var toEl = nodeElements[task.id];
            if (!fromEl || !toEl) return;

            var fromRect = fromEl.getBoundingClientRect();
            var toRect = toEl.getBoundingClientRect();

            var x1 = fromRect.right - containerRect.left;
            var y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
            var x2 = toRect.left - containerRect.left;
            var y2 = toRect.top + toRect.height / 2 - containerRect.top;

            var midX = (x1 + x2) / 2;

            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'dep-edge');
            path.setAttribute('d', 'M' + x1 + ',' + y1 + ' C' + midX + ',' + y1 + ' ' + midX + ',' + y2 + ' ' + x2 + ',' + y2);
            svg.appendChild(path);

            // 화살표
            var arrowSize = 5;
            var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            arrow.setAttribute('class', 'dep-edge-arrow');
            arrow.setAttribute('points',
              (x2 - arrowSize) + ',' + (y2 - arrowSize) + ' ' +
              x2 + ',' + y2 + ' ' +
              (x2 - arrowSize) + ',' + (y2 + arrowSize)
            );
            svg.appendChild(arrow);
          });
        });

        container.insertBefore(svg, graph);
      });

      // 상세 패널 (그래프 하단)
      if (state.expandedTaskId) {
        var expandedTask = snap.tasks.find(function(tk) { return tk.id === state.expandedTaskId; });
        if (expandedTask) {
          el.appendChild(createTaskDetailPanel(expandedTask, snap.tasks));
        }
      }
    }
```

**Step 4: 빌드 확인**

Run: `npm run build:vscode`
Expected: Build success

**Step 5: 커밋**

```bash
git add packages/vscode/src/views/dashboard-js.ts packages/vscode/src/views/dashboard-css.ts
git commit -m "feat: add CSS Grid DAG visualization for task dependencies with SVG edges"
```

---

## Task 7: 실시간 알림 (VS Code notifications)

**Files:**
- Modify: `packages/vscode/src/services/watcher-service.ts` (이벤트 구독 + 알림)

**Step 1: WatcherService에 알림 이벤트 구독 추가**

`packages/vscode/src/services/watcher-service.ts`에서 import에 `type Task, type TeamMember`를 추가:

```typescript
import {
  TeamWatcher,
  createI18n,
  type TeamSnapshot,
  type Task,
  type TeamMember,
  type I18nInstance,
  type Locale,
} from "@cc-team-viewer/core";
```

constructor 내부, 기존 `this.watcher.on("error", ...)` 뒤에 알림 이벤트 구독을 추가:

```typescript
    // 실시간 알림
    this.watcher.on("task:completed", (teamName: string, task: Task) => {
      const msg = this.i18n.t("notification.taskCompleted", {
        id: task.id,
        subject: task.subject,
      });
      vscode.window.showInformationMessage(`[${teamName}] ${msg}`);
    });

    this.watcher.on("agent:joined", (teamName: string, member: TeamMember) => {
      const msg = this.i18n.t("notification.agentJoined", { name: member.name });
      vscode.window.showInformationMessage(`[${teamName}] ${msg}`);
    });

    this.watcher.on("agent:left", (teamName: string, memberName: string) => {
      const msg = this.i18n.t("notification.agentLeft", { name: memberName });
      vscode.window.showInformationMessage(`[${teamName}] ${msg}`);
    });
```

**Step 2: 빌드 확인**

Run: `npm run build:vscode`
Expected: Build success

**Step 3: 커밋**

```bash
git add packages/vscode/src/services/watcher-service.ts
git commit -m "feat: add VS Code notifications for task completion and agent join/leave"
```

---

## Task 8: 전체 빌드 + 테스트 검증

**Step 1: 전체 빌드**

Run: `npm run build`
Expected: All packages build successfully

**Step 2: 테스트 실행**

Run: `npm run test:run`
Expected: All tests pass

**Step 3: Lint**

Run: `npm run lint`
Expected: No lint errors

**Step 4: 최종 커밋 (필요 시)**

lint/build fix가 있으면 커밋:
```bash
git add -A
git commit -m "chore: fix build/lint issues from feature updates"
```
