/**
 * 에이전트 상태 패널 - 각 팀원의 현재 작업, 모델, 완료율 표시
 */
import React from "react";
import { Text, Box } from "ink";
import type { AgentStatus } from "@cc-team-viewer/core";
import { StatusBadge, ProgressBar } from "./common.js";

/** 단일 에이전트 카드 */
function AgentCard({ agent }: { agent: AgentStatus }) {
  const { member, activeTasks, completedTasks, allTasks, isIdle } = agent;
  const isLead = member.agentType === "team-lead";
  const icon = isLead ? "👑" : isIdle ? "💤" : "⚡";
  const nameColor = isLead ? "magenta" : isIdle ? "gray" : "green";

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={isIdle ? "gray" : "cyan"} paddingX={1} marginBottom={0} width="100%">
      {/* 헤더: 이름 + 모델 */}
      <Box justifyContent="space-between">
        <Text>
          {icon} <Text bold color={nameColor}>{member.name}</Text>
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
          {"  "}태스크: {completedTasks.length}/{allTasks.length} 완료
        </Text>
      </Box>
    </Box>
  );
}

/** 에이전트 목록 패널 */
export function AgentPanel({ agents }: { agents: AgentStatus[] }) {
  if (agents.length === 0) {
    return <Text color="gray">에이전트 없음</Text>;
  }

  return (
    <Box flexDirection="column">
      {agents.map((agent) => (
        <AgentCard key={agent.member.name} agent={agent} />
      ))}
    </Box>
  );
}
