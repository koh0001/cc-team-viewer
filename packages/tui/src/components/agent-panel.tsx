/**
 * 에이전트 상태 패널 - 각 팀원의 현재 작업, 모델, 완료율 표시
 */
import React from "react";
import { Text, Box } from "ink";
import type { AgentStatus, Task, TranslateFn } from "@cc-team-viewer/core";
import { StatusBadge, ProgressBar } from "./common.js";

/** 상태 아이콘 */
function taskStatusIcon(status: string): string {
  return status === "completed" ? "✓" : status === "in_progress" ? "●" : "○";
}

/** 단일 에이전트 카드 */
function AgentCard({
  agent,
  agentTasks,
  t,
  isHighlighted,
  isExpanded,
}: {
  agent: AgentStatus;
  agentTasks: Task[];
  t: TranslateFn;
  isHighlighted: boolean;
  isExpanded: boolean;
}) {
  const { member, activeTasks, completedTasks, allTasks, isIdle } = agent;
  const isLead = member.agentType === "team-lead";
  const icon = isLead ? "👑" : isIdle ? "💤" : "⚡";
  const nameColor = isLead ? "magenta" : isIdle ? "gray" : "green";

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={isHighlighted ? "cyan" : isIdle ? "gray" : "cyan"} paddingX={1} marginBottom={0} width="100%">
      {/* 헤더: 이름 + 모델 */}
      <Box justifyContent="space-between">
        <Text>
          {isHighlighted ? "▸ " : "  "}
          {icon} <Text bold color={nameColor} inverse={isHighlighted}>{member.name}</Text>
          <Text color="gray"> ({member.agentType})</Text>
        </Text>
        <Text color="gray">
          {member.model ?? "opus"} · {member.backendType}
        </Text>
      </Box>

      {/* 진행 중인 태스크 */}
      {activeTasks.length > 0 && (
        <Box flexDirection="column" marginTop={0}>
          {activeTasks.map((task) => (
            <Text key={task.id} color="yellow">
              {"  "}● {task.subject}
            </Text>
          ))}
        </Box>
      )}

      {/* 태스크 진행률 */}
      <Box marginTop={0}>
        <Text color="gray">
          {"  "}{t("agent.taskProgress", { completed: completedTasks.length, total: allTasks.length })}
        </Text>
      </Box>

      {/* 확장: 담당 태스크 목록 */}
      {isExpanded && agentTasks.length > 0 && (
        <Box flexDirection="column" marginTop={0} borderStyle="single" borderColor="gray" borderTop paddingX={1}>
          {agentTasks.map((task) => {
            const color = task.status === "completed" ? "green" : task.status === "in_progress" ? "yellow" : "white";
            return (
              <Text key={task.id} color={color}>
                {"  "}{taskStatusIcon(task.status)} #{task.id} {task.subject}
              </Text>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

/** 에이전트 목록 패널 */
export function AgentPanel({
  agents,
  tasks = [],
  t,
  cursorIndex = 0,
  expandedItem = null,
  isActive = false,
}: {
  agents: AgentStatus[];
  tasks?: Task[];
  t: TranslateFn;
  cursorIndex?: number;
  expandedItem?: string | null;
  isActive?: boolean;
}) {
  if (agents.length === 0) {
    return <Text color="gray">{t("agent.noAgents")}</Text>;
  }

  return (
    <Box flexDirection="column">
      {agents.map((agent, idx) => {
        const agentTasks = tasks.filter((tk) => tk.owner === agent.member.name);
        return (
          <AgentCard
            key={agent.member.name}
            agent={agent}
            agentTasks={agentTasks}
            t={t}
            isHighlighted={isActive && idx === cursorIndex}
            isExpanded={expandedItem === agent.member.name}
          />
        );
      })}
    </Box>
  );
}
