/**
 * 공통 UI 컴포넌트: 상태 배지, 프로그레스 바, 시간 포맷 등
 */
import React from "react";
import { Text, Box } from "ink";
import type { TaskStatus, TranslateFn } from "@cc-team-viewer/core";

/** 상태별 색상 매핑 */
const STATUS_COLORS: Record<TaskStatus, string> = {
  completed: "green",
  in_progress: "yellow",
  pending: "gray",
};

/** 상태별 번역 키 매핑 */
const STATUS_KEYS: Record<TaskStatus, "status.completed" | "status.inProgress" | "status.pending"> = {
  completed: "status.completed",
  in_progress: "status.inProgress",
  pending: "status.pending",
};

/** 상태 뱃지 */
export function StatusBadge({ status, t }: { status: TaskStatus; t: TranslateFn }) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  const label = t(STATUS_KEYS[status] ?? STATUS_KEYS.pending);
  return (
    <Text color={color}>
      {status === "in_progress" ? "●" : status === "completed" ? "✓" : "○"}{" "}
      {label}
    </Text>
  );
}

/** ASCII 프로그레스 바 */
export function ProgressBar({
  current,
  total,
  width = 20,
}: {
  current: number;
  total: number;
  width?: number;
}) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const color = pct === 100 ? "green" : pct > 50 ? "yellow" : "white";

  return (
    <Text>
      <Text color={color}>{bar}</Text>
      <Text color="gray"> {pct}%</Text>
    </Text>
  );
}

/** 경과 시간 포맷 */
export function formatDuration(ms: number, t: TranslateFn): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return t("duration.seconds", { count: seconds });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("duration.minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  const remainMin = minutes % 60;
  return t("duration.hoursMinutes", { hours, minutes: remainMin });
}

/** 상대 시간 포맷 */
export function timeAgo(timestamp: number, t: TranslateFn): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return t("timeAgo.seconds", { count: Math.floor(diff / 1000) });
  if (diff < 3600000) return t("timeAgo.minutes", { count: Math.floor(diff / 60000) });
  return t("timeAgo.hours", { count: Math.floor(diff / 3600000) });
}

/** 구분선 */
export function Divider({ width = 60 }: { width?: number }) {
  return <Text color="gray">{"─".repeat(width)}</Text>;
}

/** 섹션 헤더 */
export function SectionHeader({ title }: { title: string }) {
  return (
    <Box marginTop={1} marginBottom={0}>
      <Text bold color="cyan">
        ▸ {title}
      </Text>
    </Box>
  );
}
