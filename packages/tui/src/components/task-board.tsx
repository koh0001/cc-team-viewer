/**
 * 태스크 보드 - 태스크 목록, 의존성, 진행률 표시
 */
import React from "react";
import { Text, Box } from "ink";
import type { Task, TeamMember } from "@cc-team-viewer/core";
import { StatusBadge } from "./common.js";

/** 태스크 한 줄 */
function TaskRow({ task, members }: { task: Task; members: TeamMember[] }) {
  const owner = members.find((m) => m.name === task.owner);
  const blockedStr =
    task.blockedBy?.length > 0 && task.status === "pending"
      ? ` ← #${task.blockedBy.join(", #")}`
      : "";

  return (
    <Box>
      <Box width={4}>
        <Text color="gray">#{task.id}</Text>
      </Box>
      <Box width={3}>
        <Text>
          {task.status === "completed"
            ? "✓"
            : task.status === "in_progress"
              ? "●"
              : "○"}
        </Text>
      </Box>
      <Box flexGrow={1}>
        <Text
          color={task.status === "completed" ? "gray" : "white"}
          strikethrough={task.status === "completed"}
        >
          {task.subject}
        </Text>
        <Text color="gray">{blockedStr}</Text>
      </Box>
      <Box width={16} justifyContent="flex-end">
        {owner ? (
          <Text color="cyan">{owner.name}</Text>
        ) : (
          <Text color="gray" italic>
            미할당
          </Text>
        )}
      </Box>
      <Box width={10} justifyContent="flex-end">
        <StatusBadge status={task.status} />
      </Box>
    </Box>
  );
}

/** 태스크 보드 */
export function TaskBoard({
  tasks,
  members,
}: {
  tasks: Task[];
  members: TeamMember[];
}) {
  if (tasks.length === 0) {
    return <Text color="gray">태스크 없음</Text>;
  }

  return (
    <Box flexDirection="column">
      {/* 헤더 */}
      <Box>
        <Box width={4}><Text bold color="gray">ID</Text></Box>
        <Box width={3} />
        <Box flexGrow={1}><Text bold color="gray">태스크</Text></Box>
        <Box width={16} justifyContent="flex-end"><Text bold color="gray">담당</Text></Box>
        <Box width={10} justifyContent="flex-end"><Text bold color="gray">상태</Text></Box>
      </Box>
      <Text color="gray">{"─".repeat(70)}</Text>

      {/* 태스크 목록 */}
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} members={members} />
      ))}
    </Box>
  );
}

/** 의존성 그래프 (ASCII) */
export function DependencyGraph({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <Text color="gray">태스크 없음</Text>;
  }

  // 간단한 ASCII 의존성 표시
  const lines: string[] = [];
  for (const task of tasks) {
    const statusIcon =
      task.status === "completed" ? "✓" : task.status === "in_progress" ? "●" : "○";
    const deps = task.blockedBy ?? [];

    if (deps.length === 0) {
      lines.push(`  ${statusIcon} #${task.id} ${task.subject}`);
    } else {
      const depStr = deps.map((d) => `#${d}`).join(", ");
      lines.push(`  ${statusIcon} #${task.id} ${task.subject}  ← [${depStr}]`);
    }

    // 이 태스크가 다른 태스크를 블로킹하는 경우 화살표
    const blocking = tasks.filter((t) => t.blockedBy?.includes(task.id));
    for (const b of blocking) {
      lines.push(`     └─▶ #${b.id} ${b.subject}`);
    }
  }

  return (
    <Box flexDirection="column">
      {lines.map((line, i) => {
        const color = line.includes("✓")
          ? "green"
          : line.includes("●")
            ? "yellow"
            : line.includes("└")
              ? "gray"
              : "white";
        return (
          <Text key={i} color={color}>
            {line}
          </Text>
        );
      })}
    </Box>
  );
}
