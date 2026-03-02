/**
 * CC Team Viewer TUI 메인 App
 *
 * 키보드 조작:
 *   Tab        → 뷰 전환 (개요/태스크/메시지/의존성)
 *   ↑/↓       → 팀 선택
 *   L          → 언어 전환 (ko → en → ja → zh)
 *   q / Ctrl+C → 종료
 */
import React, { useState, useEffect, useCallback } from "react";
import { Text, Box, useApp, useInput } from "ink";
import { TeamWatcher } from "@cc-team-viewer/core";
import type { TeamSnapshot, TranslationKey } from "@cc-team-viewer/core";
import { AgentPanel } from "../components/agent-panel.js";
import { TaskBoard, DependencyGraph } from "../components/task-board.js";
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

export function App({ claudeDir, teamFilter }: AppProps) {
  const { exit } = useApp();
  const { t, locale, cycleLocale, localeName } = useI18n();
  const [snapshots, setSnapshots] = useState<Map<string, TeamSnapshot>>(new Map());
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [error, setError] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

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

    // Tab → 뷰 전환
    if (key.tab) {
      setViewMode((prev) => {
        const idx = VIEW_ORDER.indexOf(prev);
        return VIEW_ORDER[(idx + 1) % VIEW_ORDER.length];
      });
      return;
    }

    // ↑/↓ → 팀 선택
    const teamNames = [...snapshots.keys()];
    if (key.upArrow || key.downArrow) {
      const currentIdx = teamNames.indexOf(selectedTeam);
      if (key.upArrow && currentIdx > 0) {
        setSelectedTeam(teamNames[currentIdx - 1]);
      } else if (key.downArrow && currentIdx < teamNames.length - 1) {
        setSelectedTeam(teamNames[currentIdx + 1]);
      }
    }

    // 숫자 키 → 뷰 직접 선택
    const num = parseInt(input, 10);
    if (num >= 1 && num <= VIEW_ORDER.length) {
      setViewMode(VIEW_ORDER[num - 1]);
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
            <Text bold color="gray">{t("sidebar.teamList")}</Text>
            <Text color="gray">{"─".repeat(26)}</Text>
            {[...snapshots.entries()].map(([name, snap]) => (
              <Box key={name}>
                <Text
                  color={name === selectedTeam ? "cyan" : "white"}
                  bold={name === selectedTeam}
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
                  </Text>
                ))}
                <Text color="gray" italic>
                  {"  "}{t("view.tabHint")}
                </Text>
              </Box>

              {/* 뷰 콘텐츠 */}
              <Box marginTop={1} flexDirection="column">
                {viewMode === "overview" && (
                  <>
                    <SectionHeader title={t("agent.sectionTitle", { count: snapshot.agents.length })} />
                    <AgentPanel agents={snapshot.agents} t={t} />
                  </>
                )}

                {viewMode === "tasks" && (
                  <TaskBoard
                    tasks={snapshot.tasks}
                    members={snapshot.config.members}
                    t={t}
                  />
                )}

                {viewMode === "messages" && (
                  <MessageLog
                    messages={snapshot.messages}
                    members={snapshot.config.members}
                    t={t}
                  />
                )}

                {viewMode === "deps" && (
                  <>
                    <SectionHeader title={t("deps.sectionTitle")} />
                    <DependencyGraph tasks={snapshot.tasks} />
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
