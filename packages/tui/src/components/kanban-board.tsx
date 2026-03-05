/**
 * 칸반 보드 - 태스크를 상태별 3열로 분류하여 표시
 */
import React from "react";
import { Text, Box } from "ink";
import type { Task, TaskStatus, TeamMember, TranslateFn } from "@cc-team-viewer/core";
import { StatusBadge } from "./common.js";
import { TaskDetail } from "./task-board.js";

/** 상태별 열 순서 */
const COLUMN_ORDER: TaskStatus[] = ["pending", "in_progress", "completed"];

/** 상태별 아이콘 */
const STATUS_ICONS: Record<TaskStatus, string> = {
  pending: "○",
  in_progress: "●",
  completed: "✓",
};

/** 상태별 열 제목 i18n 키 */
const COLUMN_KEYS: Record<TaskStatus, "task.columnPending" | "task.columnInProgress" | "task.columnCompleted"> = {
  pending: "task.columnPending",
  in_progress: "task.columnInProgress",
  completed: "task.columnCompleted",
};

/** 칸반 카드 */
function KanbanCard({
  task,
  members,
  t,
  isHighlighted,
}: {
  task: Task;
  members: TeamMember[];
  t: TranslateFn;
  isHighlighted: boolean;
}) {
  const owner = members.find((m) => m.name === task.owner);
  const color = task.status === "completed" ? "green" : task.status === "in_progress" ? "yellow" : "white";

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={isHighlighted ? "cyan" : "gray"}
      paddingX={1}
      marginBottom={0}
    >
      <Box gap={1}>
        <Text color="gray">#{task.id}</Text>
        <Text color={color} wrap="truncate-end" inverse={isHighlighted}>
          {task.subject}
        </Text>
      </Box>
      <Box justifyContent="space-between">
        {owner ? (
          <Text color="cyan" dimColor>{owner.name}</Text>
        ) : (
          <Text color="gray" italic>{t("task.unassigned")}</Text>
        )}
        {task.blockedBy?.length > 0 && (
          <Text color="red" dimColor>← #{task.blockedBy.join(", #")}</Text>
        )}
      </Box>
    </Box>
  );
}

/** 칸반 보드 */
export function KanbanBoard({
  tasks,
  members,
  t,
  cursorIndex = 0,
  expandedItem = null,
  isActive = false,
}: {
  tasks: Task[];
  members: TeamMember[];
  t: TranslateFn;
  cursorIndex?: number;
  expandedItem?: string | null;
  isActive?: boolean;
}) {
  if (tasks.length === 0) {
    return <Text color="gray">{t("task.noTasks")}</Text>;
  }

  // O(n) 단일 패스 분류
  const tasksByStatus: Record<TaskStatus, Task[]> = {
    pending: [],
    in_progress: [],
    completed: [],
  };
  for (const task of tasks) {
    const bucket = tasksByStatus[task.status];
    if (bucket) {
      bucket.push(task);
    }
  }

  // 커서용 flat 배열 (pending → in_progress → completed 순)
  const flatTasks = COLUMN_ORDER.flatMap((status) => tasksByStatus[status]);

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" gap={2}>
        {COLUMN_ORDER.map((status) => {
          const columnTasks = tasksByStatus[status];
          const color = status === "completed" ? "green" : status === "in_progress" ? "yellow" : "gray";

          return (
            <Box key={status} flexDirection="column" flexGrow={1} flexBasis={0}>
              {/* 열 헤더 */}
              <Box gap={1}>
                <Text color={color} bold>
                  {STATUS_ICONS[status]} {t(COLUMN_KEYS[status])} ({columnTasks.length})
                </Text>
              </Box>
              <Text color="gray">{"─".repeat(20)}</Text>

              {/* 카드 목록 */}
              {columnTasks.map((task) => {
                const flatIdx = flatTasks.indexOf(task);
                return (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    members={members}
                    t={t}
                    isHighlighted={isActive && flatIdx === cursorIndex}
                  />
                );
              })}

              {columnTasks.length === 0 && (
                <Text color="gray" italic>-</Text>
              )}
            </Box>
          );
        })}
      </Box>

      {/* 선택된 태스크 상세 */}
      {expandedItem && (
        <TaskDetail
          task={tasks.find((tk) => tk.id === expandedItem)!}
          allTasks={tasks}
          t={t}
        />
      )}
    </Box>
  );
}
