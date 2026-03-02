/**
 * team-parser 유닛 테스트
 *
 * 임시 디렉토리에 mock JSON 파일을 생성하여
 * 파서 함수들의 동작을 검증합니다.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type {
  TeamConfig,
  Task,
  InboxMessage,
} from "../types/index.js";
import {
  safeReadJson,
  directoryExists,
  parseTeamConfig,
  parseTeamTasks,
  parseTeamMessages,
  calculateStats,
  aggregateAgentStatus,
  buildTeamSnapshot,
  listActiveTeams,
} from "./team-parser.js";

// ─── 테스트 픽스처 ────────────────────────────────

const MOCK_CONFIG: TeamConfig = {
  name: "test-team",
  description: "테스트용 팀",
  leadAgentId: "team-lead@test-team",
  createdAt: 1700000000000,
  members: [
    {
      agentId: "team-lead@test-team",
      name: "team-lead",
      agentType: "team-lead",
      color: "#6366f1",
      joinedAt: 1700000000000,
      backendType: "in-process",
      model: "opus",
    },
    {
      agentId: "backend@test-team",
      name: "backend",
      agentType: "Backend Developer",
      color: "#10b981",
      joinedAt: 1700000000000,
      backendType: "in-process",
      model: "sonnet",
    },
    {
      agentId: "frontend@test-team",
      name: "frontend",
      agentType: "Frontend Developer",
      color: "#f59e0b",
      joinedAt: 1700000000000,
      backendType: "in-process",
      model: "sonnet",
    },
  ],
};

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    subject: "API 설계",
    description: "REST API 스키마 설계",
    status: "completed",
    owner: "backend",
    blocks: [],
    blockedBy: [],
    metadata: {},
  },
  {
    id: "2",
    subject: "UI 구현",
    description: "대시보드 UI",
    status: "in_progress",
    owner: "frontend",
    blocks: [],
    blockedBy: ["1"],
    metadata: {},
  },
  {
    id: "3",
    subject: "테스트 작성",
    description: "통합 테스트",
    status: "pending",
    owner: "",
    blocks: [],
    blockedBy: ["1", "2"],
    metadata: {},
  },
];

const MOCK_INTERNAL_TASK: Task = {
  id: "99",
  subject: "내부 추적용",
  status: "completed",
  owner: "team-lead",
  blocks: [],
  blockedBy: [],
  metadata: { _internal: true },
};

const MOCK_MESSAGES: InboxMessage[] = [
  {
    from: "backend",
    to: "team-lead",
    type: "text",
    content: "API 설계 완료",
    timestamp: 1700000001000,
    read: true,
  },
  {
    from: "frontend",
    to: "team-lead",
    type: "text",
    content: "UI 작업 시작",
    timestamp: 1700000002000,
    read: false,
  },
];

// ─── 테스트 헬퍼 ──────────────────────────────────

let tempDir: string;
let teamsDir: string;
let tasksDir: string;

async function setupMockTeam(teamName: string): Promise<void> {
  const teamDir = join(teamsDir, teamName);
  const teamTasksDir = join(tasksDir, teamName);
  const inboxDir = join(teamDir, "inboxes");

  await mkdir(teamDir, { recursive: true });
  await mkdir(teamTasksDir, { recursive: true });
  await mkdir(inboxDir, { recursive: true });

  // config.json
  await writeFile(
    join(teamDir, "config.json"),
    JSON.stringify({ ...MOCK_CONFIG, name: teamName }),
  );

  // 태스크 파일
  for (const task of MOCK_TASKS) {
    await writeFile(
      join(teamTasksDir, `${task.id}.json`),
      JSON.stringify(task),
    );
  }

  // 내부 태스크
  await writeFile(
    join(teamTasksDir, `${MOCK_INTERNAL_TASK.id}.json`),
    JSON.stringify(MOCK_INTERNAL_TASK),
  );

  // inbox 파일
  await writeFile(
    join(inboxDir, "team-lead.json"),
    JSON.stringify(MOCK_MESSAGES),
  );
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "cc-test-"));
  teamsDir = join(tempDir, "teams");
  tasksDir = join(tempDir, "tasks");
  await mkdir(teamsDir, { recursive: true });
  await mkdir(tasksDir, { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// ─── safeReadJson ─────────────────────────────────

describe("safeReadJson", () => {
  it("유효한 JSON 파일을 파싱한다", async () => {
    const filePath = join(tempDir, "valid.json");
    await writeFile(filePath, JSON.stringify({ key: "value" }));

    const result = await safeReadJson<{ key: string }>(filePath);

    expect(result).toEqual({ key: "value" });
  });

  it("존재하지 않는 파일에 null을 반환한다", async () => {
    const result = await safeReadJson(join(tempDir, "missing.json"));

    expect(result).toBeNull();
  });

  it("잘못된 JSON에 null을 반환한다", async () => {
    const filePath = join(tempDir, "invalid.json");
    await writeFile(filePath, "{ broken json !!!");

    const result = await safeReadJson(filePath);

    expect(result).toBeNull();
  });

  it("빈 파일에 null을 반환한다", async () => {
    const filePath = join(tempDir, "empty.json");
    await writeFile(filePath, "");

    const result = await safeReadJson(filePath);

    expect(result).toBeNull();
  });
});

// ─── directoryExists ──────────────────────────────

describe("directoryExists", () => {
  it("존재하는 디렉토리에 true를 반환한다", async () => {
    const result = await directoryExists(tempDir);

    expect(result).toBe(true);
  });

  it("존재하지 않는 경로에 false를 반환한다", async () => {
    const result = await directoryExists(join(tempDir, "nonexistent"));

    expect(result).toBe(false);
  });

  it("파일 경로에도 true를 반환한다 (access 체크)", async () => {
    const filePath = join(tempDir, "file.txt");
    await writeFile(filePath, "test");

    const result = await directoryExists(filePath);

    expect(result).toBe(true);
  });
});

// ─── parseTeamConfig ──────────────────────────────

describe("parseTeamConfig", () => {
  it("팀 config.json을 올바르게 파싱한다", async () => {
    await setupMockTeam("test-team");

    const config = await parseTeamConfig(teamsDir, "test-team");

    expect(config).not.toBeNull();
    expect(config!.name).toBe("test-team");
    expect(config!.members).toHaveLength(3);
    expect(config!.leadAgentId).toBe("team-lead@test-team");
  });

  it("존재하지 않는 팀에 null을 반환한다", async () => {
    const config = await parseTeamConfig(teamsDir, "nonexistent");

    expect(config).toBeNull();
  });

  it("멤버 정보를 정확히 파싱한다", async () => {
    await setupMockTeam("test-team");

    const config = await parseTeamConfig(teamsDir, "test-team");
    const lead = config!.members.find((m) => m.name === "team-lead");

    expect(lead).toBeDefined();
    expect(lead!.agentType).toBe("team-lead");
    expect(lead!.model).toBe("opus");
    expect(lead!.backendType).toBe("in-process");
  });
});

// ─── parseTeamTasks ───────────────────────────────

describe("parseTeamTasks", () => {
  it("모든 일반 태스크를 파싱한다 (내부 태스크 제외)", async () => {
    await setupMockTeam("test-team");

    const tasks = await parseTeamTasks(tasksDir, "test-team");

    expect(tasks).toHaveLength(3);
    expect(tasks.map((t) => t.id)).toEqual(["1", "2", "3"]);
  });

  it("filterInternal=false이면 내부 태스크도 포함한다", async () => {
    await setupMockTeam("test-team");

    const tasks = await parseTeamTasks(tasksDir, "test-team", false);

    expect(tasks).toHaveLength(4);
    expect(tasks.find((t) => t.id === "99")).toBeDefined();
  });

  it("ID 기준 오름차순 정렬한다", async () => {
    await setupMockTeam("test-team");

    const tasks = await parseTeamTasks(tasksDir, "test-team", false);
    const ids = tasks.map((t) => Number(t.id));

    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  it("존재하지 않는 팀에 빈 배열을 반환한다", async () => {
    const tasks = await parseTeamTasks(tasksDir, "nonexistent");

    expect(tasks).toEqual([]);
  });

  it("태스크 상태를 올바르게 파싱한다", async () => {
    await setupMockTeam("test-team");

    const tasks = await parseTeamTasks(tasksDir, "test-team");

    expect(tasks.find((t) => t.id === "1")!.status).toBe("completed");
    expect(tasks.find((t) => t.id === "2")!.status).toBe("in_progress");
    expect(tasks.find((t) => t.id === "3")!.status).toBe("pending");
  });

  it("blockedBy 관계를 유지한다", async () => {
    await setupMockTeam("test-team");

    const tasks = await parseTeamTasks(tasksDir, "test-team");
    const pending = tasks.find((t) => t.id === "3");

    expect(pending!.blockedBy).toEqual(["1", "2"]);
  });

  it("깨진 JSON 태스크 파일을 건너뛴다", async () => {
    await setupMockTeam("test-team");
    await writeFile(join(tasksDir, "test-team", "broken.json"), "not json");

    const tasks = await parseTeamTasks(tasksDir, "test-team");

    // 깨진 파일 무시, 정상 파일 3개만 반환
    expect(tasks).toHaveLength(3);
  });
});

// ─── parseTeamMessages ────────────────────────────

describe("parseTeamMessages", () => {
  it("inbox 메시지를 시간순으로 파싱한다", async () => {
    await setupMockTeam("test-team");

    const messages = await parseTeamMessages(teamsDir, "test-team");

    expect(messages).toHaveLength(2);
    expect(messages[0].timestamp).toBeLessThanOrEqual(messages[1].timestamp);
  });

  it("메시지 필드를 올바르게 파싱한다", async () => {
    await setupMockTeam("test-team");

    const messages = await parseTeamMessages(teamsDir, "test-team");
    const first = messages[0];

    expect(first.from).toBe("backend");
    expect(first.to).toBe("team-lead");
    expect(first.type).toBe("text");
    expect(first.content).toBe("API 설계 완료");
    expect(first.read).toBe(true);
  });

  it("inbox가 없으면 빈 배열을 반환한다", async () => {
    const messages = await parseTeamMessages(teamsDir, "nonexistent");

    expect(messages).toEqual([]);
  });

  it("여러 에이전트의 inbox를 합산한다", async () => {
    await setupMockTeam("test-team");
    // frontend inbox 추가
    const frontendMsg: InboxMessage = {
      from: "backend",
      to: "frontend",
      type: "text",
      content: "API 타입 정의 확인",
      timestamp: 1700000003000,
      read: true,
    };
    await writeFile(
      join(teamsDir, "test-team", "inboxes", "frontend.json"),
      JSON.stringify([frontendMsg]),
    );

    const messages = await parseTeamMessages(teamsDir, "test-team");

    expect(messages).toHaveLength(3);
  });

  it("깨진 inbox 파일을 건너뛴다", async () => {
    await setupMockTeam("test-team");
    await writeFile(
      join(teamsDir, "test-team", "inboxes", "broken.json"),
      "invalid",
    );

    const messages = await parseTeamMessages(teamsDir, "test-team");

    expect(messages).toHaveLength(2);
  });
});

// ─── calculateStats ───────────────────────────────

describe("calculateStats", () => {
  it("태스크 상태별 카운트를 정확히 계산한다", () => {
    const stats = calculateStats(MOCK_CONFIG, MOCK_TASKS, MOCK_MESSAGES);

    expect(stats.totalTasks).toBe(3);
    expect(stats.completedTasks).toBe(1);
    expect(stats.inProgressTasks).toBe(1);
    expect(stats.pendingTasks).toBe(1);
  });

  it("완료율을 올바르게 계산한다", () => {
    const stats = calculateStats(MOCK_CONFIG, MOCK_TASKS, MOCK_MESSAGES);

    // 1/3 = 33%
    expect(stats.completionRate).toBe(33);
  });

  it("태스크가 없으면 완료율 0%이다", () => {
    const stats = calculateStats(MOCK_CONFIG, [], []);

    expect(stats.completionRate).toBe(0);
    expect(stats.totalTasks).toBe(0);
  });

  it("모든 태스크 완료 시 100%이다", () => {
    const allDone: Task[] = MOCK_TASKS.map((t) => ({
      ...t,
      status: "completed" as const,
    }));

    const stats = calculateStats(MOCK_CONFIG, allDone, []);

    expect(stats.completionRate).toBe(100);
  });

  it("활성 에이전트 수를 정확히 계산한다", () => {
    const stats = calculateStats(MOCK_CONFIG, MOCK_TASKS, MOCK_MESSAGES);

    // frontend만 in_progress 태스크 보유
    expect(stats.activeAgents).toBe(1);
  });

  it("전체 에이전트 수를 반환한다", () => {
    const stats = calculateStats(MOCK_CONFIG, MOCK_TASKS, MOCK_MESSAGES);

    expect(stats.totalAgents).toBe(3);
  });

  it("메시지 수를 반환한다", () => {
    const stats = calculateStats(MOCK_CONFIG, MOCK_TASKS, MOCK_MESSAGES);

    expect(stats.totalMessages).toBe(2);
  });

  it("uptime을 양수로 계산한다", () => {
    const stats = calculateStats(MOCK_CONFIG, MOCK_TASKS, MOCK_MESSAGES);

    expect(stats.uptime).toBeGreaterThan(0);
  });
});

// ─── aggregateAgentStatus ─────────────────────────

describe("aggregateAgentStatus", () => {
  it("각 멤버별 상태를 집계한다", () => {
    const agents = aggregateAgentStatus(MOCK_CONFIG, MOCK_TASKS, MOCK_MESSAGES);

    expect(agents).toHaveLength(3);
  });

  it("에이전트의 활성 태스크를 올바르게 연결한다", () => {
    const agents = aggregateAgentStatus(MOCK_CONFIG, MOCK_TASKS, MOCK_MESSAGES);
    const frontend = agents.find((a) => a.member.name === "frontend")!;

    expect(frontend.activeTasks).toHaveLength(1);
    expect(frontend.activeTasks[0].subject).toBe("UI 구현");
  });

  it("에이전트의 완료 태스크를 올바르게 연결한다", () => {
    const agents = aggregateAgentStatus(MOCK_CONFIG, MOCK_TASKS, MOCK_MESSAGES);
    const backend = agents.find((a) => a.member.name === "backend")!;

    expect(backend.completedTasks).toHaveLength(1);
    expect(backend.completedTasks[0].subject).toBe("API 설계");
  });

  it("태스크 없는 에이전트는 isIdle=true이다", () => {
    const noTasks: Task[] = [];
    const agents = aggregateAgentStatus(MOCK_CONFIG, noTasks, []);
    const frontend = agents.find((a) => a.member.name === "frontend")!;

    expect(frontend.isIdle).toBe(true);
  });

  it("team-lead는 태스크 없어도 isIdle=false이다", () => {
    const noTasks: Task[] = [];
    const agents = aggregateAgentStatus(MOCK_CONFIG, noTasks, []);
    const lead = agents.find((a) => a.member.name === "team-lead")!;

    expect(lead.isIdle).toBe(false);
  });

  it("마지막 메시지 시각을 추적한다", () => {
    const agents = aggregateAgentStatus(MOCK_CONFIG, MOCK_TASKS, MOCK_MESSAGES);
    const lead = agents.find((a) => a.member.name === "team-lead")!;

    // team-lead에게 보낸 메시지 중 가장 최근 timestamp
    expect(lead.lastMessageAt).toBe(1700000002000);
  });

  it("메시지 없는 에이전트는 lastMessageAt=undefined이다", () => {
    const agents = aggregateAgentStatus(MOCK_CONFIG, MOCK_TASKS, []);
    const frontend = agents.find((a) => a.member.name === "frontend")!;

    expect(frontend.lastMessageAt).toBeUndefined();
  });
});

// ─── buildTeamSnapshot ────────────────────────────

describe("buildTeamSnapshot", () => {
  it("전체 스냅샷을 올바르게 조합한다", async () => {
    await setupMockTeam("test-team");

    const snapshot = await buildTeamSnapshot(teamsDir, tasksDir, "test-team");

    expect(snapshot).not.toBeNull();
    expect(snapshot!.config.name).toBe("test-team");
    expect(snapshot!.tasks).toHaveLength(3);
    expect(snapshot!.agents).toHaveLength(3);
    expect(snapshot!.messages).toHaveLength(2);
    expect(snapshot!.stats.totalTasks).toBe(3);
    expect(snapshot!.timestamp).toBeGreaterThan(0);
  });

  it("존재하지 않는 팀에 null을 반환한다", async () => {
    const snapshot = await buildTeamSnapshot(teamsDir, tasksDir, "ghost");

    expect(snapshot).toBeNull();
  });

  it("기본적으로 내부 태스크를 제외한다", async () => {
    await setupMockTeam("test-team");

    const snapshot = await buildTeamSnapshot(teamsDir, tasksDir, "test-team");

    expect(snapshot!.tasks.find((t) => t.id === "99")).toBeUndefined();
  });

  it("filterInternal=false이면 내부 태스크를 포함한다", async () => {
    await setupMockTeam("test-team");

    const snapshot = await buildTeamSnapshot(
      teamsDir,
      tasksDir,
      "test-team",
      false,
    );

    expect(snapshot!.tasks.find((t) => t.id === "99")).toBeDefined();
  });
});

// ─── listActiveTeams ──────────────────────────────

describe("listActiveTeams", () => {
  it("config.json이 있는 팀만 반환한다", async () => {
    await setupMockTeam("alpha");
    await setupMockTeam("beta");
    // config.json 없는 빈 디렉토리
    await mkdir(join(teamsDir, "empty-dir"), { recursive: true });

    const teams = await listActiveTeams(teamsDir);

    expect(teams).toEqual(["alpha", "beta"]);
  });

  it("알파벳 순으로 정렬한다", async () => {
    await setupMockTeam("zebra");
    await setupMockTeam("alpha");

    const teams = await listActiveTeams(teamsDir);

    expect(teams).toEqual(["alpha", "zebra"]);
  });

  it("teams 디렉토리가 없으면 빈 배열을 반환한다", async () => {
    const teams = await listActiveTeams(join(tempDir, "nonexistent"));

    expect(teams).toEqual([]);
  });
});
