/**
 * 태스크 보드 - 태스크 목록, 의존성, 진행률 표시
 */
import React from "react";
import { Text, Box } from "ink";
import type { Task, TeamMember, TranslateFn } from "@cc-team-viewer/core";
import { topoSortLayers } from "@cc-team-viewer/core";
import { StatusBadge } from "./common.js";

/** 상태 아이콘 */
function statusIcon(status: string): string {
  return status === "completed" ? "✓" : status === "in_progress" ? "●" : "○";
}

/** 태스크 상세 패널 */
export function TaskDetail({ task, allTasks, t }: { task: Task; allTasks: Task[]; t: TranslateFn }) {
  const blockedByTasks = (task.blockedBy ?? [])
    .map((id) => allTasks.find((tk) => tk.id === id))
    .filter(Boolean) as Task[];
  const blocksTasks = allTasks.filter((tk) => tk.blockedBy?.includes(task.id));

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1} marginLeft={2}>
      <Box gap={2}>
        <Text color="cyan">#{task.id}</Text>
        <StatusBadge status={task.status} t={t} />
        {task.owner && <Text color="yellow">{task.owner}</Text>}
      </Box>
      <Text color="gray">{task.description || t("task.noDescription")}</Text>
      {blockedByTasks.length > 0 && (
        <Text>
          <Text color="red">{t("task.blockedByLabel")}: </Text>
          <Text color="gray">{blockedByTasks.map((tk) => `#${tk.id} ${tk.subject}`).join(", ")}</Text>
        </Text>
      )}
      {blocksTasks.length > 0 && (
        <Text>
          <Text color="green">{t("task.blocksLabel")}: </Text>
          <Text color="gray">{blocksTasks.map((tk) => `#${tk.id} ${tk.subject}`).join(", ")}</Text>
        </Text>
      )}
    </Box>
  );
}

/** 태스크 한 줄 */
function TaskRow({ task, members, t, isHighlighted }: { task: Task; members: TeamMember[]; t: TranslateFn; isHighlighted: boolean }) {
  const owner = members.find((m) => m.name === task.owner);
  const blockedStr =
    task.blockedBy?.length > 0 && task.status === "pending"
      ? ` ← #${task.blockedBy.join(", #")}`
      : "";

  return (
    <Box>
      <Box width={2}>
        <Text color="cyan">{isHighlighted ? "▸" : " "}</Text>
      </Box>
      <Box width={4}>
        <Text color="gray">#{task.id}</Text>
      </Box>
      <Box width={3}>
        <Text>{statusIcon(task.status)}</Text>
      </Box>
      <Box flexGrow={1}>
        <Text
          color={task.status === "completed" ? "gray" : "white"}
          strikethrough={task.status === "completed"}
          inverse={isHighlighted}
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
            {t("task.unassigned")}
          </Text>
        )}
      </Box>
      <Box width={10} justifyContent="flex-end">
        <StatusBadge status={task.status} t={t} />
      </Box>
    </Box>
  );
}

/** 태스크 보드 */
export function TaskBoard({
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

  return (
    <Box flexDirection="column">
      {/* 헤더 */}
      <Box>
        <Box width={2} />
        <Box width={4}><Text bold color="gray">{t("task.headerId")}</Text></Box>
        <Box width={3} />
        <Box flexGrow={1}><Text bold color="gray">{t("task.headerTask")}</Text></Box>
        <Box width={16} justifyContent="flex-end"><Text bold color="gray">{t("task.headerOwner")}</Text></Box>
        <Box width={10} justifyContent="flex-end"><Text bold color="gray">{t("task.headerStatus")}</Text></Box>
      </Box>
      <Text color="gray">{"─".repeat(70)}</Text>

      {/* 태스크 목록 */}
      {tasks.map((task, idx) => (
        <React.Fragment key={task.id}>
          <TaskRow
            task={task}
            members={members}
            t={t}
            isHighlighted={isActive && idx === cursorIndex}
          />
          {expandedItem === task.id && (
            <TaskDetail task={task} allTasks={tasks} t={t} />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}

/** 의존성 그래프 노드 (박스 드로잉) */
function DepNode({ task, isHighlighted, isExpanded }: { task: Task; isHighlighted: boolean; isExpanded: boolean }) {
  const color = task.status === "completed" ? "green" : task.status === "in_progress" ? "yellow" : "white";
  const borderColor = isHighlighted ? "cyan" : color;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1} width={22} marginBottom={0}>
      <Box gap={1}>
        <Text color={color}>{statusIcon(task.status)}</Text>
        <Text color="gray">#{task.id}</Text>
      </Box>
      <Text color={color} wrap="truncate-end">{task.subject}</Text>
      {task.owner && <Text color="cyan" dimColor>{task.owner}</Text>}
    </Box>
  );
}

/** 의존성 그래프 (위상 정렬 레이어) */
export function DependencyGraph({
  tasks,
  t,
  cursorIndex = 0,
  expandedItem = null,
  isActive = false,
}: {
  tasks: Task[];
  t: TranslateFn;
  cursorIndex?: number;
  expandedItem?: string | null;
  isActive?: boolean;
}) {
  if (tasks.length === 0) {
    return <Text color="gray">{t("deps.noTasks")}</Text>;
  }

  // 의존성이 하나도 없으면 간단 리스트
  const hasDeps = tasks.some((task) => task.blockedBy.length > 0);
  if (!hasDeps) {
    return (
      <Box flexDirection="column">
        {tasks.map((task, idx) => (
          <Text key={task.id} color={task.status === "completed" ? "green" : "white"}>
            {isActive && idx === cursorIndex ? "▸ " : "  "}
            {statusIcon(task.status)} #{task.id} {task.subject}
            {task.owner ? ` (${task.owner})` : ""}
          </Text>
        ))}
      </Box>
    );
  }

  const { layers } = topoSortLayers(tasks);

  // 전체 태스크를 레이어 순으로 flat 배열 (커서용)
  const flatTasks = layers.flat();

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" gap={1}>
        {layers.map((layer, layerIdx) => (
          <Box key={layerIdx} flexDirection="column" gap={0}>
            <Text color="gray" bold>Layer {layerIdx}</Text>
            {layer.map((task) => {
              const flatIdx = flatTasks.indexOf(task);
              const highlighted = isActive && flatIdx === cursorIndex;
              return (
                <React.Fragment key={task.id}>
                  <DepNode task={task} isHighlighted={highlighted} isExpanded={expandedItem === task.id} />
                  {/* 화살표: 이 태스크가 다음 레이어의 태스크를 블로킹하는 경우 */}
                  {layerIdx < layers.length - 1 && tasks.some((t) => t.blockedBy?.includes(task.id)) && (
                    <Text color="gray">  ───▸</Text>
                  )}
                </React.Fragment>
              );
            })}
          </Box>
        ))}
      </Box>
      {/* 선택된 노드의 상세 */}
      {expandedItem && (
        <TaskDetail
          task={tasks.find((t) => t.id === expandedItem)!}
          allTasks={tasks}
          t={t}
        />
      )}
    </Box>
  );
}
