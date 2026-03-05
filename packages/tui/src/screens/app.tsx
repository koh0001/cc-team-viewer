/**
 * CC Team Viewer TUI 메인 App
 *
 * 키보드 조작:
 *   Tab / 1-4  → 뷰 전환 (개요/태스크/메시지/의존성)
 *   Enter      → sidebar: 뷰 진입 / view: 아이템 상세 토글
 *   Escape     → view에서 sidebar로 복귀
 *   ↑/↓       → sidebar: 팀 선택 / view: 커서 이동
 *   K          → 태스크 뷰 모드 토글 (테이블 ↔ 칸반)
 *   F          → 메시지 필터 순환 (전체/대화/시스템)
 *   L          → 언어 전환 (ko → en → ja → zh)
 *   q / Ctrl+C → 종료
 */
import React, { useState, useEffect, useCallback } from "react";
import { Text, Box, useApp, useInput } from "ink";
import { TeamWatcher } from "@cc-team-viewer/core";
import type { TeamSnapshot, TranslationKey } from "@cc-team-viewer/core";
import { AgentPanel } from "../components/agent-panel.js";
import { TaskBoard, DependencyGraph } from "../components/task-board.js";
import { KanbanBoard } from "../components/kanban-board.js";
import { MessageLog } from "../components/message-log.js";
import {
  ProgressBar,
  SectionHeader,
  formatDuration,
} from "../components/common.js";
import { useI18n } from "../i18n/context.js";

type ViewMode = "overview" | "tasks" | "messages" | "deps";

const VIEW_KEYS: Record<ViewMode, TranslationKey> = {
  overview: "view.overview",
  tasks: "view.tasks",
  messages: "view.messages",
  deps: "view.deps",
};
const VIEW_ORDER: ViewMode[] = ["overview", "tasks", "messages", "deps"];

interface AppProps {
  claudeDir?: string;
  teamFilter?: string[];
}

export type FocusMode = "sidebar" | "view";
export type MessageFilter = "all" | "conversation" | "system";
const MESSAGE_FILTERS: MessageFilter[] = ["all", "conversation", "system"];

export function App({ claudeDir, teamFilter }: AppProps) {
  const { exit } = useApp();
  const { t, locale, cycleLocale, localeName } = useI18n();
  const [snapshots, setSnapshots] = useState<Map<string, TeamSnapshot>>(new Map());
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [error, setError] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // 내비게이션 상태
  const [focusMode, setFocusMode] = useState<FocusMode>("sidebar");
  const [viewCursor, setViewCursor] = useState(0);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [taskViewMode, setTaskViewMode] = useState<"table" | "kanban">("table");
  const [messageFilter, setMessageFilter] = useState<MessageFilter>("all");

  // Watcher 초기화 및 이벤트 구독
  useEffect(() => {
    const watcher = new TeamWatcher({
      claudeDir,
      teamFilter,
      pollIntervalMs: 1000,
    });

    watcher.on("snapshot:updated", (teamName, snapshot) => {
      setSnapshots((prev) => {
        const next = new Map(prev);
        next.set(teamName, snapshot);
        return next;
      });
      setLastUpdate(Date.now());
    });

    watcher.on("team:removed", (teamName) => {
      setSnapshots((prev) => {
        const next = new Map(prev);
        next.delete(teamName);
        return next;
      });
    });

    watcher.on("error", (err, context) => {
      setError(`[${context}] ${err.message}`);
    });

    watcher.start().catch((err) => {
      setError(t("error.startFailed", { message: (err as Error).message }));
    });

    return () => {
      watcher.stop();
    };
  }, [claudeDir, teamFilter]);

  // 첫 번째 팀 자동 선택
  useEffect(() => {
    if (!selectedTeam && snapshots.size > 0) {
      setSelectedTeam([...snapshots.keys()][0]);
    }
  }, [snapshots, selectedTeam]);

  // 뷰별 아이템 수 계산
  const getViewItemCount = useCallback((): number => {
    const snap = snapshots.get(selectedTeam);
    if (!snap) return 0;
    switch (viewMode) {
      case "overview": return snap.agents.length;
      case "tasks": return snap.tasks.length;
      case "messages": return snap.messages.length;
      case "deps": return snap.tasks.length;
      default: return 0;
    }
  }, [snapshots, selectedTeam, viewMode]);

  // 뷰 전환 시 커서 초기화
  const switchView = useCallback((newView: ViewMode) => {
    setViewMode(newView);
    setViewCursor(0);
    setExpandedItem(null);
  }, []);

  // 키보드 입력 처리
  useInput((input, key) => {
    if (input === "q") {
      exit();
      return;
    }

    // L → 언어 전환
    if (input === "L" || input === "l") {
      cycleLocale();
      return;
    }

    // Tab → 뷰 전환 (포커스 모드 무관)
    if (key.tab) {
      const idx = VIEW_ORDER.indexOf(viewMode);
      switchView(VIEW_ORDER[(idx + 1) % VIEW_ORDER.length]);
      return;
    }

    // 숫자 키 → 뷰 직접 선택 (포커스 모드 무관)
    const num = parseInt(input, 10);
    if (num >= 1 && num <= VIEW_ORDER.length) {
      switchView(VIEW_ORDER[num - 1]);
      return;
    }

    // K → 칸반 토글 (tasks 뷰에서만)
    if ((input === "K" || input === "k") && viewMode === "tasks") {
      setTaskViewMode((prev) => prev === "table" ? "kanban" : "table");
      setViewCursor(0);
      setExpandedItem(null);
      return;
    }

    // F → 메시지 필터 순환 (messages 뷰에서만)
    if ((input === "F" || input === "f") && viewMode === "messages") {
      setMessageFilter((prev) => {
        const idx = MESSAGE_FILTERS.indexOf(prev);
        return MESSAGE_FILTERS[(idx + 1) % MESSAGE_FILTERS.length];
      });
      setViewCursor(0);
      setExpandedItem(null);
      return;
    }

    // Escape → view 모드에서 sidebar로 복귀
    if (key.escape) {
      if (focusMode === "view") {
        setFocusMode("sidebar");
        setViewCursor(0);
        setExpandedItem(null);
      }
      return;
    }

    // Enter → sidebar: 뷰 진입 / view: 아이템 토글
    if (key.return) {
      if (focusMode === "sidebar") {
        setFocusMode("view");
        setViewCursor(0);
        setExpandedItem(null);
      } else {
        // 현재 커서 아이템 토글
        const snap = snapshots.get(selectedTeam);
        if (!snap) return;
        let itemId: string | null = null;
        if (viewMode === "overview" && snap.agents[viewCursor]) {
          itemId = snap.agents[viewCursor].member.name;
        } else if (viewMode === "tasks" && snap.tasks[viewCursor]) {
          itemId = snap.tasks[viewCursor].id;
        } else if (viewMode === "deps" && snap.tasks[viewCursor]) {
          itemId = snap.tasks[viewCursor].id;
        } else if (viewMode === "messages") {
          itemId = String(viewCursor);
        }
        setExpandedItem((prev) => prev === itemId ? null : itemId);
      }
      return;
    }

    // ↑/↓ 방향키
    if (key.upArrow || key.downArrow) {
      if (focusMode === "sidebar") {
        // 팀 선택
        const teamNames = [...snapshots.keys()];
        const currentIdx = teamNames.indexOf(selectedTeam);
        if (key.upArrow && currentIdx > 0) {
          setSelectedTeam(teamNames[currentIdx - 1]);
        } else if (key.downArrow && currentIdx < teamNames.length - 1) {
          setSelectedTeam(teamNames[currentIdx + 1]);
        }
      } else {
        // 뷰 커서 이동
        const maxItems = getViewItemCount();
        if (maxItems === 0) return;
        setViewCursor((prev) => {
          if (key.upArrow) return Math.max(0, prev - 1);
          return Math.min(maxItems - 1, prev + 1);
        });
      }
      return;
    }
  });

  const snapshot = snapshots.get(selectedTeam);

  // ─── 렌더링 ───────────────────────────────────

  return (
    <Box flexDirection="column" padding={1}>
      {/* 헤더 */}
      <Box justifyContent="space-between">
        <Text bold>
          🔭 <Text color="cyan">{t("app.title")}</Text>
          <Text color="gray"> — {t("app.subtitle")}</Text>
        </Text>
        <Text color="gray">
          {new Date(lastUpdate).toLocaleTimeString()} · {localeName} · q: {t("app.quit")}
        </Text>
      </Box>

      {/* 에러 표시 */}
      {error && (
        <Box marginTop={1}>
          <Text color="red">⚠ {error}</Text>
        </Box>
      )}

      {/* 팀이 없을 때 */}
      {snapshots.size === 0 && !error && (
        <Box flexDirection="column" marginTop={2} alignItems="center">
          <Text color="yellow">⏳ {t("app.watching")}</Text>
          <Text color="gray" italic>
            {"\n"}{t("app.watchingHint")}
          </Text>
          <Text color="gray" italic>
            {t("app.watchingPath", { path: claudeDir ?? "~/.claude" })}
          </Text>
        </Box>
      )}

      {snapshots.size > 0 && (
        <Box marginTop={1}>
          {/* 사이드바: 팀 목록 */}
          <Box flexDirection="column" width={28} marginRight={2}>
            <Text bold color={focusMode === "sidebar" ? "cyan" : "gray"}>{t("sidebar.teamList")}</Text>
            <Text color="gray">{"─".repeat(26)}</Text>
            {[...snapshots.entries()].map(([name, snap]) => (
              <Box key={name}>
                <Text
                  color={name === selectedTeam ? "cyan" : "white"}
                  bold={name === selectedTeam}
                  inverse={name === selectedTeam && focusMode === "sidebar"}
                >
                  {name === selectedTeam ? "▸ " : "  "}
                  {name}
                </Text>
                <Text color="gray">
                  {" "}
                  {snap.stats.completionRate}%
                </Text>
              </Box>
            ))}
          </Box>

          {/* 메인 콘텐츠 */}
          {snapshot && (
            <Box flexDirection="column" flexGrow={1}>
              {/* 팀 헤더 + 통계 */}
              <Box justifyContent="space-between">
                <Box>
                  <Text bold color="white">{snapshot.config.name}</Text>
                  <Text color="gray"> — {snapshot.config.description}</Text>
                </Box>
                <Text color="gray">{formatDuration(snapshot.stats.uptime, t)} {t("stats.elapsed")}</Text>
              </Box>

              {/* 진행률 바 */}
              <Box marginTop={0} gap={2}>
                <ProgressBar
                  current={snapshot.stats.completedTasks}
                  total={snapshot.stats.totalTasks}
                  width={30}
                />
                <Text color="green">{snapshot.stats.completedTasks}</Text>
                <Text color="gray">/</Text>
                <Text>{snapshot.stats.totalTasks} {t("stats.tasks")}</Text>
                <Text color="gray">·</Text>
                <Text color="cyan">{snapshot.stats.activeAgents}</Text>
                <Text color="gray">/{snapshot.stats.totalAgents} {t("stats.active")}</Text>
                <Text color="gray">·</Text>
                <Text color="gray">{snapshot.stats.totalMessages} {t("stats.messages")}</Text>
              </Box>

              {/* 탭 네비게이션 */}
              <Box marginTop={1} gap={1}>
                {VIEW_ORDER.map((v, i) => (
                  <Text
                    key={v}
                    color={viewMode === v ? "cyan" : "gray"}
                    bold={viewMode === v}
                    underline={viewMode === v}
                  >
                    [{i + 1}] {t(VIEW_KEYS[v])}
                    {v === "tasks" && viewMode === "tasks" ? ` (${t(taskViewMode === "table" ? "task.viewTable" : "task.viewKanban")})` : ""}
                  </Text>
                ))}
                <Text color="gray" italic>
                  {"  "}{focusMode === "sidebar" ? "Enter: view | " : "Esc: back | ↑↓ | "}
                  {viewMode === "tasks" ? "K: toggle | " : ""}
                  {viewMode === "messages" ? "F: filter | " : ""}
                  {t("view.tabHint")}
                </Text>
              </Box>

              {/* 뷰 콘텐츠 */}
              <Box marginTop={1} flexDirection="column">
                {viewMode === "overview" && (
                  <>
                    <SectionHeader title={t("agent.sectionTitle", { count: snapshot.agents.length })} />
                    <AgentPanel
                      agents={snapshot.agents}
                      tasks={snapshot.tasks}
                      t={t}
                      cursorIndex={viewCursor}
                      expandedItem={expandedItem}
                      isActive={focusMode === "view"}
                    />
                  </>
                )}

                {viewMode === "tasks" && (
                  taskViewMode === "kanban" ? (
                    <KanbanBoard
                      tasks={snapshot.tasks}
                      members={snapshot.config.members}
                      t={t}
                      cursorIndex={viewCursor}
                      expandedItem={expandedItem}
                      isActive={focusMode === "view"}
                    />
                  ) : (
                    <TaskBoard
                      tasks={snapshot.tasks}
                      members={snapshot.config.members}
                      t={t}
                      cursorIndex={viewCursor}
                      expandedItem={expandedItem}
                      isActive={focusMode === "view"}
                    />
                  )
                )}

                {viewMode === "messages" && (
                  <MessageLog
                    messages={snapshot.messages}
                    members={snapshot.config.members}
                    t={t}
                    filter={messageFilter}
                    cursorIndex={viewCursor}
                    expandedItem={expandedItem}
                    isActive={focusMode === "view"}
                  />
                )}

                {viewMode === "deps" && (
                  <>
                    <SectionHeader title={t("deps.sectionTitle")} />
                    <DependencyGraph
                      tasks={snapshot.tasks}
                      t={t}
                      cursorIndex={viewCursor}
                      expandedItem={expandedItem}
                      isActive={focusMode === "view"}
                    />
                  </>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
