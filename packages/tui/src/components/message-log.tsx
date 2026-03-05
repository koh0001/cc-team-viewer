/**
 * 메시지 로그 - 에이전트 간 통신 내역 표시 (필터, 스레드 그룹핑)
 */
import React from "react";
import { Text, Box } from "ink";
import type { InboxMessage, TeamMember, TranslateFn } from "@cc-team-viewer/core";
import { timeAgo } from "./common.js";

/** 메시지 필터 타입 */
export type MessageFilter = "all" | "conversation" | "system";

/** 시스템 메시지 타입 */
const SYSTEM_TYPES = new Set(["idle_notification", "shutdown_request", "shutdown_approved"]);

/** 필터 i18n 키 매핑 */
const FILTER_KEYS: Record<MessageFilter, "message.filterAll" | "message.filterConversation" | "message.filterSystem"> = {
  all: "message.filterAll",
  conversation: "message.filterConversation",
  system: "message.filterSystem",
};

/** 메시지 스레드 (동일 from→to 연속 메시지 그룹) */
interface MessageThread {
  from: string;
  to: string;
  messages: InboxMessage[];
  latestTimestamp: number;
}

/** 연속 메시지를 스레드로 그룹핑 */
function groupIntoThreads(messages: InboxMessage[]): MessageThread[] {
  const threads: MessageThread[] = [];

  for (const msg of messages) {
    const last = threads[threads.length - 1];
    if (last && last.from === msg.from && last.to === msg.to) {
      last.messages.push(msg);
      last.latestTimestamp = msg.timestamp;
    } else {
      threads.push({
        from: msg.from,
        to: msg.to,
        messages: [msg],
        latestTimestamp: msg.timestamp,
      });
    }
  }

  return threads;
}

/** 단일 메시지 행 */
function MessageRow({
  message,
  t,
  prefix = "",
}: {
  message: InboxMessage;
  t: TranslateFn;
  prefix?: string;
}) {
  const isSystem = SYSTEM_TYPES.has(message.type);

  if (isSystem) {
    return (
      <Text color="gray" italic>
        {prefix}[{message.type}] {message.from} → {message.to} ({timeAgo(message.timestamp, t)})
      </Text>
    );
  }

  return (
    <Box>
      <Text color="gray">{prefix}</Text>
      <Box flexGrow={1} flexShrink={1}>
        <Text wrap="truncate-end">{message.content}</Text>
      </Box>
      <Box width={8} justifyContent="flex-end">
        <Text color="gray">{timeAgo(message.timestamp, t)}</Text>
      </Box>
    </Box>
  );
}

/** 스레드 헤더 */
function ThreadHeader({
  thread,
  t,
  isHighlighted,
  isExpanded,
}: {
  thread: MessageThread;
  t: TranslateFn;
  isHighlighted: boolean;
  isExpanded: boolean;
}) {
  return (
    <Box>
      <Text color="cyan">{isHighlighted ? "▸ " : "  "}</Text>
      <Box width={14}>
        <Text bold color="cyan" inverse={isHighlighted}>{thread.from}</Text>
      </Box>
      <Text color="gray">→ </Text>
      <Box width={14}>
        <Text color="gray">{thread.to}</Text>
      </Box>
      <Box flexGrow={1}>
        <Text color="gray">
          ({t("message.threadCount", { count: thread.messages.length })})
          {isExpanded ? " ▾" : " ▸"}
        </Text>
      </Box>
      <Box width={8} justifyContent="flex-end">
        <Text color="gray">{timeAgo(thread.latestTimestamp, t)}</Text>
      </Box>
    </Box>
  );
}

/** 필터 표시 바 */
function FilterBar({ filter, t }: { filter: MessageFilter; t: TranslateFn }) {
  const filters: MessageFilter[] = ["all", "conversation", "system"];
  return (
    <Box gap={1} marginBottom={0}>
      <Text color="gray">Filter:</Text>
      {filters.map((f) => (
        <Text
          key={f}
          color={f === filter ? "cyan" : "gray"}
          bold={f === filter}
        >
          [{t(FILTER_KEYS[f])}]
        </Text>
      ))}
      <Text color="gray" italic>  F: cycle</Text>
    </Box>
  );
}

/** 메시지 로그 */
export function MessageLog({
  messages,
  members,
  maxMessages = 50,
  t,
  filter = "all",
  cursorIndex = 0,
  expandedItem = null,
  isActive = false,
}: {
  messages: InboxMessage[];
  members: TeamMember[];
  maxMessages?: number;
  t: TranslateFn;
  filter?: MessageFilter;
  cursorIndex?: number;
  expandedItem?: string | null;
  isActive?: boolean;
}) {
  if (messages.length === 0) {
    return <Text color="gray">{t("message.noMessages")}</Text>;
  }

  // 필터 적용
  const filtered = filter === "all"
    ? messages
    : filter === "system"
      ? messages.filter((m) => SYSTEM_TYPES.has(m.type))
      : messages.filter((m) => !SYSTEM_TYPES.has(m.type));

  // 최근 메시지만
  const recent = filtered.slice(-maxMessages);

  // 스레드 그룹핑
  const threads = groupIntoThreads(recent);

  return (
    <Box flexDirection="column">
      {/* 필터 바 */}
      <FilterBar filter={filter} t={t} />

      {/* 헤더 */}
      <Box>
        <Box width={2} />
        <Box width={14}><Text bold color="gray">{t("message.headerFrom")}</Text></Box>
        <Text color="gray">  </Text>
        <Box width={14}><Text bold color="gray">{t("message.headerTo")}</Text></Box>
        <Box flexGrow={1}><Text bold color="gray">{t("message.headerContent")}</Text></Box>
        <Box width={8} justifyContent="flex-end"><Text bold color="gray">{t("message.headerTime")}</Text></Box>
      </Box>
      <Text color="gray">{"─".repeat(70)}</Text>

      {/* 스레드 목록 */}
      {threads.map((thread, idx) => {
        const highlighted = isActive && idx === cursorIndex;
        const expanded = expandedItem === String(idx);

        return (
          <Box key={idx} flexDirection="column">
            <ThreadHeader
              thread={thread}
              t={t}
              isHighlighted={highlighted}
              isExpanded={expanded}
            />
            {expanded && (
              <Box flexDirection="column" marginLeft={2}>
                {thread.messages.map((msg, msgIdx) => {
                  const isLast = msgIdx === thread.messages.length - 1;
                  const prefix = isLast ? "  └ " : "  ├ ";
                  return (
                    <MessageRow
                      key={msgIdx}
                      message={msg}
                      t={t}
                      prefix={prefix}
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        );
      })}

      {filtered.length > maxMessages && (
        <Text color="gray" italic>
          {"  "}{t("message.olderOmitted", { count: filtered.length - maxMessages })}
        </Text>
      )}
    </Box>
  );
}
