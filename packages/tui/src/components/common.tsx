/**
 * 공통 UI 컴포넌트: 상태 배지, 프로그레스 바, 시간 포맷 등
 */
import React from "react";
import { Text, Box } from "ink";
import type { TaskStatus } from "@cc-team-viewer/core";

/** 태스크 상태별 색상과 라벨 */
const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  completed: { label: "완료", color: "green" },
  in_progress: { label: "진행중", color: "yellow" },
  pending: { label: "대기", color: "gray" },
};

/** 상태 뱃지 */
export function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Text color={cfg.color}>
      {status === "in_progress" ? "●" : status === "completed" ? "✓" : "○"}{" "}
      {cfg.label}
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
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}초`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const remainMin = minutes % 60;
  return `${hours}시간 ${remainMin}분`;
}

/** 상대 시간 포맷 */
export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return `${Math.floor(diff / 1000)}초 전`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  return `${Math.floor(diff / 3600000)}시간 전`;
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
