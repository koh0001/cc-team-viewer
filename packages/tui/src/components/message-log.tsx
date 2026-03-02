/**
 * 메시지 로그 - 에이전트 간 통신 내역 표시
 */
import React from "react";
import { Text, Box } from "ink";
import type { InboxMessage, TeamMember } from "@cc-team-viewer/core";
import { timeAgo } from "./common.js";

/** 단일 메시지 */
function MessageRow({
  message,
  members,
}: {
  message: InboxMessage;
  members: TeamMember[];
}) {
  const sender = members.find((m) => m.name === message.from);
  const isSystem =
    message.type === "idle_notification" ||
    message.type === "shutdown_request" ||
    message.type === "shutdown_approved";

  if (isSystem) {
    return (
      <Text color="gray" italic>
        {"  "}[{message.type}] {message.from} → {message.to} ({timeAgo(message.timestamp)})
      </Text>
    );
  }

  return (
    <Box>
      <Box width={16}>
        <Text bold color="cyan">
          {message.from}
        </Text>
      </Box>
      <Text color="gray">→ </Text>
      <Box width={16}>
        <Text color="gray">{message.to}</Text>
      </Box>
      <Box flexGrow={1} flexShrink={1}>
        <Text wrap="truncate-end">{message.content}</Text>
      </Box>
      <Box width={8} justifyContent="flex-end">
        <Text color="gray">{timeAgo(message.timestamp)}</Text>
      </Box>
    </Box>
  );
}

/** 메시지 로그 */
export function MessageLog({
  messages,
  members,
  maxMessages = 20,
}: {
  messages: InboxMessage[];
  members: TeamMember[];
  maxMessages?: number;
}) {
  if (messages.length === 0) {
    return <Text color="gray">메시지 없음</Text>;
  }

  // 최근 메시지만 표시
  const recent = messages.slice(-maxMessages);

  return (
    <Box flexDirection="column">
      {/* 헤더 */}
      <Box>
        <Box width={16}><Text bold color="gray">발신</Text></Box>
        <Text color="gray">  </Text>
        <Box width={16}><Text bold color="gray">수신</Text></Box>
        <Box flexGrow={1}><Text bold color="gray">내용</Text></Box>
        <Box width={8} justifyContent="flex-end"><Text bold color="gray">시간</Text></Box>
      </Box>
      <Text color="gray">{"─".repeat(70)}</Text>

      {recent.map((msg, i) => (
        <MessageRow key={i} message={msg} members={members} />
      ))}

      {messages.length > maxMessages && (
        <Text color="gray" italic>
          {"  "}... {messages.length - maxMessages}개 이전 메시지 생략
        </Text>
      )}
    </Box>
  );
}
