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
      translations: {},
      locale: 'ko'
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
      renderOverview(snap);
      renderTasks(snap);
      renderMessages(snap);
      renderDeps(snap);
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
      const el = document.getElementById('tasks-content');
      el.textContent = '';
      if (!snap.tasks.length) {
        const p = document.createElement('p');
        p.style.color = 'var(--vscode-descriptionForeground)';
        p.textContent = t('task.noTasks');
        el.appendChild(p);
        return;
      }

      const table = document.createElement('table');
      table.className = 'task-table';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      [t('task.headerId'), '', t('task.headerTask'), t('task.headerOwner')].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      snap.tasks.forEach(task => {
        const tr = document.createElement('tr');
        if (task.status === 'completed') tr.className = 'completed';

        const tdId = document.createElement('td');
        tdId.textContent = '#' + task.id;
        tr.appendChild(tdId);

        const tdStatus = document.createElement('td');
        const dot = document.createElement('span');
        dot.className = 'task-status ' + task.status;
        tdStatus.appendChild(dot);
        tr.appendChild(tdStatus);

        const tdSubject = document.createElement('td');
        tdSubject.textContent = task.subject;
        if (task.blockedBy.length > 0 && task.status === 'pending') {
          const blockedSpan = document.createElement('span');
          blockedSpan.style.color = 'var(--vscode-descriptionForeground)';
          blockedSpan.textContent = ' \\u2190 #' + task.blockedBy.join(', #');
          tdSubject.appendChild(blockedSpan);
        }
        tr.appendChild(tdSubject);

        const tdOwner = document.createElement('td');
        if (task.owner) {
          const ownerSpan = document.createElement('span');
          ownerSpan.className = 'task-owner';
          ownerSpan.textContent = task.owner;
          tdOwner.appendChild(ownerSpan);
        } else {
          const unassigned = document.createElement('span');
          unassigned.className = 'task-unassigned';
          unassigned.textContent = t('task.unassigned');
          tdOwner.appendChild(unassigned);
        }
        tr.appendChild(tdOwner);

        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      el.appendChild(table);
    }

    function renderMessages(snap) {
      const el = document.getElementById('messages-content');
      el.textContent = '';
      if (!snap.messages.length) {
        const p = document.createElement('p');
        p.style.color = 'var(--vscode-descriptionForeground)';
        p.textContent = t('message.noMessages');
        el.appendChild(p);
        return;
      }
      const systemTypes = ['idle_notification', 'shutdown_request', 'shutdown_approved'];
      const recent = snap.messages.slice(-30);
      recent.forEach(msg => {
        if (systemTypes.includes(msg.type)) {
          const div = document.createElement('div');
          div.className = 'msg-system';
          div.textContent = '[' + msg.type + '] ' + msg.from + ' \\u2192 ' + msg.to;
          el.appendChild(div);
          return;
        }
        const row = document.createElement('div');
        row.className = 'message-row';

        const from = document.createElement('span');
        from.className = 'msg-from';
        from.textContent = msg.from;

        const arrow = document.createElement('span');
        arrow.className = 'msg-arrow';
        arrow.textContent = '\\u2192';

        const to = document.createElement('span');
        to.className = 'msg-to';
        to.textContent = msg.to;

        const content = document.createElement('span');
        content.className = 'msg-content';
        content.textContent = msg.content;

        const time = document.createElement('span');
        time.className = 'msg-time';
        time.textContent = timeAgo(msg.timestamp);

        row.appendChild(from);
        row.appendChild(arrow);
        row.appendChild(to);
        row.appendChild(content);
        row.appendChild(time);
        el.appendChild(row);
      });
    }

    function renderDeps(snap) {
      const el = document.getElementById('deps-content');
      el.textContent = '';
      if (!snap.tasks.length) {
        const p = document.createElement('p');
        p.style.color = 'var(--vscode-descriptionForeground)';
        p.textContent = '-';
        el.appendChild(p);
        return;
      }
      snap.tasks.forEach(task => {
        const icon = task.status === 'completed' ? '\\u2713' : task.status === 'in_progress' ? '\\u25CF' : '\\u25CB';
        const cls = task.status === 'completed' ? 'dep-completed' : task.status === 'in_progress' ? 'dep-in-progress' : '';
        const deps = task.blockedBy.length > 0 ? '  \\u2190 [#' + task.blockedBy.join(', #') + ']' : '';

        const line = document.createElement('div');
        line.className = 'dep-line ' + cls;
        line.textContent = icon + ' #' + task.id + ' ' + task.subject + deps;
        el.appendChild(line);

        const blocking = snap.tasks.filter(t => t.blockedBy.includes(task.id));
        blocking.forEach(b => {
          const arrow = document.createElement('div');
          arrow.className = 'dep-line dep-arrow';
          arrow.textContent = '     \\u2514\\u2500\\u25B6 #' + b.id + ' ' + b.subject;
          el.appendChild(arrow);
        });
      });
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
      if (tab === 'overview') renderOverview(snap);
      if (tab === 'tasks') renderTasks(snap);
      if (tab === 'messages') renderMessages(snap);
      if (tab === 'deps') renderDeps(snap);
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
