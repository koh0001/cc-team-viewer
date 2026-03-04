/**
 * Dashboard 클라이언트 JS — WebView 내부에서 실행되는 DOM 조작 코드
 *
 * 보안 참고: 이 코드는 VS Code WebView의 sandboxed iframe에서 실행된다.
 * 외부 입력은 escapeHtml()로 이스케이프한 후 렌더링한다.
 * innerHTML은 Extension이 제공하는 신뢰된 데이터(TeamSnapshot)에만 사용하며,
 * 사용자 입력(메시지 content, 태스크 subject)은 반드시 escapeHtml()을 거친다.
 */
export function getDashboardJs(): string {
  return `
    try {
    const vscode = acquireVsCodeApi();

    // 로케일 표시 이름
    const LOCALE_NAMES = { ko: '한국어', en: 'English', ja: '日本語', zh: '中文' };

    // 상태
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

    // 준비 완료 신호
    vscode.postMessage({ command: 'ready' });

    // Extension 메시지 수신
    window.addEventListener('message', event => {
      const msg = event.data;
      switch (msg.type) {
        case 'init':
          state.teams = msg.data.teams;
          state.selectedTeam = msg.data.selectedTeam;
          state.translations = msg.data.translations;
          state.locale = msg.data.locale || 'ko';
          renderAll();
          break;
        case 'translationsUpdate':
          state.translations = msg.translations;
          state.locale = msg.locale || state.locale;
          renderAll();
          break;
        case 'snapshotUpdate':
          state.teams[msg.teamName] = msg.data;
          if (!state.selectedTeam) state.selectedTeam = msg.teamName;
          renderAll();
          break;
        case 'teamRemoved':
          delete state.teams[msg.teamName];
          if (state.selectedTeam === msg.teamName) {
            state.selectedTeam = Object.keys(state.teams)[0] || '';
          }
          renderAll();
          break;
        case 'error':
          showError(msg.message);
          break;
      }
    });

    function t(key) { return state.translations[key] || key; }

    // 유틸리티: HTML 이스케이프 (XSS 방지)
    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = String(str).substring(0, 500);
      return div.innerHTML;
    }

    function timeAgo(ts) {
      const diff = Date.now() - ts;
      if (diff < 60000) return Math.floor(diff / 1000) + 's';
      if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
      return Math.floor(diff / 3600000) + 'h';
    }

    // ─── 렌더링 ──────────────────────────────

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

    function renderLanguageButton() {
      const header = document.getElementById('header');
      let btn = document.getElementById('lang-btn');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'lang-btn';
        btn.className = 'lang-btn';
        btn.addEventListener('click', function() {
          vscode.postMessage({ command: 'changeLanguage' });
        });
        header.appendChild(btn);
      }
      const name = LOCALE_NAMES[state.locale] || state.locale;
      btn.textContent = name + ' \\u25BE';
    }

    function renderTeamSelector(teamNames) {
      const header = document.getElementById('header');
      const pills = document.getElementById('team-pills');
      pills.textContent = '';

      if (teamNames.length >= 2) {
        header.classList.add('no-border');
        pills.classList.add('visible');
        teamNames.forEach(n => {
          const pill = document.createElement('button');
          pill.className = 'team-pill' + (n === state.selectedTeam ? ' active' : '');
          pill.textContent = n;
          pill.addEventListener('click', function() { selectTeam(n); });
          pills.appendChild(pill);
        });
      } else {
        header.classList.remove('no-border');
        pills.classList.remove('visible');
      }
    }

    function renderStatsBar(snap) {
      const s = snap.stats;
      document.getElementById('progress-fill').style.width = s.completionRate + '%';
      const el = document.getElementById('stats-text');
      el.textContent = '';
      const items = [
        s.completedTasks + '/' + s.totalTasks + ' ' + t('stats.tasks'),
        s.activeAgents + '/' + s.totalAgents + ' ' + t('stats.active'),
        s.totalMessages + ' ' + t('stats.messages'),
        s.completionRate + '%'
      ];
      items.forEach((text, i) => {
        if (i > 0) el.appendChild(document.createTextNode(' '));
        const badge = document.createElement('span');
        badge.className = 'stat-badge';
        badge.textContent = text;
        el.appendChild(badge);
      });
    }

    function renderTabs() {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === state.currentTab);
      });
      document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.toggle('active', el.id === 'tab-' + state.currentTab);
      });
    }

    function renderOverview(snap) {
      const el = document.getElementById('overview-content');
      el.textContent = '';
      if (!snap.agents.length) {
        const p = document.createElement('p');
        p.style.color = 'var(--vscode-descriptionForeground)';
        p.textContent = t('agent.noAgents');
        el.appendChild(p);
        return;
      }
      snap.agents.forEach(agent => {
        const card = document.createElement('div');
        card.className = 'agent-card' + (!agent.isIdle && !agent.isLead ? ' agent-active' : '');
        card.style.setProperty('--agent-color', agent.color);

        const icon = agent.isLead ? '\\u{1F451}' : agent.isIdle ? '\\u{1F4A4}' : '\\u26A1';
        const header = document.createElement('div');
        header.className = 'agent-header';

        const left = document.createElement('span');
        left.textContent = icon + ' ';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'agent-name';
        nameSpan.textContent = agent.name;
        const metaSpan = document.createElement('span');
        metaSpan.className = 'agent-meta';
        metaSpan.textContent = ' (' + agent.agentType + ')';
        left.appendChild(nameSpan);
        left.appendChild(metaSpan);

        const right = document.createElement('span');
        right.className = 'agent-meta';
        right.textContent = agent.model + ' \\u00B7 ' + agent.backendType;

        header.appendChild(left);
        header.appendChild(right);
        card.appendChild(header);

        agent.activeTasks.forEach(task => {
          const taskDiv = document.createElement('div');
          taskDiv.className = 'agent-task';
          taskDiv.textContent = '\\u25CF ' + task.subject;
          card.appendChild(taskDiv);
        });

        const progress = document.createElement('div');
        progress.className = 'agent-progress';
        progress.textContent = t('agent.taskProgress')
          .replace('{completed}', String(agent.completedCount))
          .replace('{total}', String(agent.totalCount));
        card.appendChild(progress);

        el.appendChild(card);
      });
    }

    function renderTasks(snap) {
      var el = document.getElementById('tasks-content');
      el.textContent = '';
      if (!snap.tasks.length) {
        var p = document.createElement('p');
        p.style.color = 'var(--vscode-descriptionForeground)';
        p.textContent = t('task.noTasks');
        el.appendChild(p);
        return;
      }

      renderTaskViewToggle(el);

      if (state.taskViewMode === 'kanban') {
        renderTaskKanban(el, snap.tasks);
      } else {
        renderTaskTable(el, snap.tasks);
      }
    }

    function createOwnerElement(task) {
      var span = document.createElement('span');
      if (task.owner) {
        span.className = 'task-owner';
        span.textContent = task.owner;
      } else {
        span.className = 'task-unassigned';
        span.textContent = t('task.unassigned');
      }
      return span;
    }

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

    function createViewModeButton(mode, labelKey) {
      var btn = document.createElement('button');
      btn.className = 'task-view-btn' + (state.taskViewMode === mode ? ' active' : '');
      btn.textContent = t(labelKey);
      btn.addEventListener('click', function() {
        state.taskViewMode = mode;
        var snap = state.teams[state.selectedTeam];
        if (snap) renderTasks(snap);
      });
      return btn;
    }

    function renderTaskViewToggle(container) {
      var toggleBar = document.createElement('div');
      toggleBar.className = 'task-view-toggle';
      toggleBar.appendChild(createViewModeButton('table', 'task.viewTable'));
      toggleBar.appendChild(createViewModeButton('kanban', 'task.viewKanban'));
      container.appendChild(toggleBar);
    }

    function renderTaskTable(container, tasks) {
      var table = document.createElement('table');
      table.className = 'task-table';

      var thead = document.createElement('thead');
      var headerRow = document.createElement('tr');
      [t('task.headerId'), '', t('task.headerTask'), t('task.headerOwner')].forEach(function(text) {
        var th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      var tbody = document.createElement('tbody');
      tasks.forEach(function(task) {
        var tr = document.createElement('tr');
        if (task.status === 'completed') tr.className = 'completed';

        var tdId = document.createElement('td');
        tdId.textContent = '#' + task.id;
        tr.appendChild(tdId);

        var tdStatus = document.createElement('td');
        var dot = document.createElement('span');
        dot.className = 'task-status ' + task.status;
        tdStatus.appendChild(dot);
        tr.appendChild(tdStatus);

        var tdSubject = document.createElement('td');
        tdSubject.textContent = task.subject;
        if (task.blockedBy.length > 0 && task.status === 'pending') {
          var blockedSpan = document.createElement('span');
          blockedSpan.style.color = 'var(--vscode-descriptionForeground)';
          blockedSpan.textContent = ' \\u2190 #' + task.blockedBy.join(', #');
          tdSubject.appendChild(blockedSpan);
        }
        tr.appendChild(tdSubject);

        var tdOwner = document.createElement('td');
        tdOwner.appendChild(createOwnerElement(task));
        tr.appendChild(tdOwner);

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
      });
      table.appendChild(tbody);
      container.appendChild(table);
    }

    function createKanbanCard(task, allTasks) {
      var card = document.createElement('div');
      card.className = 'kanban-card';
      if (task.status === 'completed') card.classList.add('kanban-card-completed');

      var cardId = document.createElement('span');
      cardId.className = 'kanban-card-id';
      cardId.textContent = '#' + task.id;
      card.appendChild(cardId);

      var cardSubject = document.createElement('div');
      cardSubject.className = 'kanban-card-subject';
      cardSubject.textContent = task.subject;
      card.appendChild(cardSubject);

      if (task.blockedBy.length > 0 && task.status === 'pending') {
        var blockedDiv = document.createElement('div');
        blockedDiv.className = 'kanban-card-blocked';
        task.blockedBy.forEach(function(blockId) {
          var badge = document.createElement('span');
          badge.className = 'kanban-blocked-badge';
          badge.textContent = '#' + blockId;
          blockedDiv.appendChild(badge);
        });
        card.appendChild(blockedDiv);
      }

      var cardFooter = document.createElement('div');
      cardFooter.className = 'kanban-card-footer';
      cardFooter.appendChild(createOwnerElement(task));
      card.appendChild(cardFooter);

      card.addEventListener('click', function() { toggleTaskDetail(task.id); });

      if (state.expandedTaskId === task.id) {
        card.appendChild(createTaskDetailPanel(task, allTasks));
      }

      return card;
    }

    function renderTaskKanban(container, tasks) {
      var board = document.createElement('div');
      board.className = 'kanban-board';

      // 단일 패스로 상태별 분류 (3회 filter 대신)
      var tasksByStatus = { pending: [], in_progress: [], completed: [] };
      tasks.forEach(function(tk) {
        if (tasksByStatus[tk.status]) tasksByStatus[tk.status].push(tk);
      });

      var columns = [
        { status: 'pending', label: t('task.columnPending') },
        { status: 'in_progress', label: t('task.columnInProgress') },
        { status: 'completed', label: t('task.columnCompleted') }
      ];

      columns.forEach(function(col) {
        var column = document.createElement('div');
        column.className = 'kanban-column';

        var header = document.createElement('div');
        header.className = 'kanban-column-header';

        var dot = document.createElement('span');
        dot.className = 'task-status ' + col.status;
        header.appendChild(dot);

        var title = document.createElement('span');
        title.className = 'kanban-column-title';
        title.textContent = col.label;
        header.appendChild(title);

        var colTasks = tasksByStatus[col.status];
        var count = document.createElement('span');
        count.className = 'kanban-column-count';
        count.textContent = String(colTasks.length);
        header.appendChild(count);

        column.appendChild(header);

        var cardContainer = document.createElement('div');
        cardContainer.className = 'kanban-cards';

        colTasks.forEach(function(task) {
          cardContainer.appendChild(createKanbanCard(task, tasks));
        });

        if (colTasks.length === 0) {
          var empty = document.createElement('div');
          empty.className = 'kanban-empty';
          empty.textContent = '-';
          cardContainer.appendChild(empty);
        }

        column.appendChild(cardContainer);
        board.appendChild(column);
      });

      container.appendChild(board);
    }

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

    function topoSortLayers(tasks) {
      // 태스크 ID -> depth 맵 계산
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

      // 의존성이 하나도 없으면 간단 표시
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

      var container = document.createElement('div');
      container.className = 'dep-graph-container';

      var graph = document.createElement('div');
      graph.className = 'dep-graph';
      graph.style.gridTemplateColumns = 'repeat(' + maxCols + ', 1fr)';

      // 노드 배치 및 위치 기록
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

    function showError(message) {
      const el = document.getElementById('error-bar');
      el.textContent = '\\u26A0 ' + message;
      el.classList.add('visible');
      setTimeout(() => { el.classList.remove('visible'); }, 5000);
    }

    function selectTeam(name) {
      state.selectedTeam = name;
      vscode.postMessage({ command: 'selectTeam', teamName: name });
      renderAll();
    }

    function switchTab(tab) {
      state.currentTab = tab;
      vscode.postMessage({ command: 'changeTab', tab: tab });
      renderTabs();
      const snap = state.teams[state.selectedTeam];
      if (!snap) return;
      renderCurrentTab(snap);
    }

    // DOM 이벤트 리스너 (CSP 호환 — onclick 속성 대신 addEventListener 사용)
    document.getElementById('tab-bar').addEventListener('click', function(e) {
      const btn = e.target.closest('.tab-btn');
      if (btn && btn.dataset.tab) {
        switchTab(btn.dataset.tab);
      }
    });
    } catch (err) {
      document.body.textContent = 'JS Error: ' + err.message;
    }
  `;
}
