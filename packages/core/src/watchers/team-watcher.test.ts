/**
 * TeamWatcher 유닛 테스트
 *
 * 임시 디렉토리에 mock 파일을 생성/수정하여
 * 이벤트 발행 동작을 검증합니다.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, mkdir, writeFile, rm, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { TeamConfig, Task, TeamSnapshot } from "../types/index.js";
import { TeamWatcher } from "./team-watcher.js";

// ─── 테스트 픽스처 ────────────────────────────────

function createConfig(teamName: string, memberCount = 2): TeamConfig {
  const members = [
    {
      agentId: `team-lead@${teamName}`,
      name: "team-lead",
      agentType: "team-lead",
      color: "#6366f1",
      joinedAt: Date.now(),
      backendType: "in-process" as const,
      model: "opus",
    },
  ];
  for (let i = 1; i < memberCount; i++) {
    members.push({
      agentId: `agent-${i}@${teamName}`,
      name: `agent-${i}`,
      agentType: "general-purpose",
      color: "#10b981",
      joinedAt: Date.now(),
      backendType: "in-process" as const,
      model: "sonnet",
    });
  }
  return {
    name: teamName,
    description: `${teamName} 테스트 팀`,
    leadAgentId: `team-lead@${teamName}`,
    createdAt: Date.now(),
    members,
  };
}

function createTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    subject: `태스크 ${id}`,
    status: "pending",
    owner: "",
    blocks: [],
    blockedBy: [],
    metadata: {},
    ...overrides,
  };
}

// ─── 헬퍼 ─────────────────────────────────────────

let tempDir: string;
let teamsDir: string;
let tasksDir: string;

async function writeTeamConfig(teamName: string, config: TeamConfig) {
  const dir = join(teamsDir, teamName);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "config.json"), JSON.stringify(config));
}

async function writeTask(teamName: string, task: Task) {
  const dir = join(tasksDir, teamName);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${task.id}.json`), JSON.stringify(task));
}

async function writeInbox(
  teamName: string,
  agentName: string,
  messages: unknown[],
) {
  const dir = join(teamsDir, teamName, "inboxes");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${agentName}.json`), JSON.stringify(messages));
}

/** 이벤트를 Promise로 대기 */
function waitForEvent<T>(
  watcher: TeamWatcher,
  event: string,
  timeoutMs = 5000,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`이벤트 '${event}' 타임아웃 (${timeoutMs}ms)`)),
      timeoutMs,
    );
    watcher.once(event, (...args: unknown[]) => {
      clearTimeout(timer);
      resolve(args as T[]);
    });
  });
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "cc-watcher-test-"));
  teamsDir = join(tempDir, "teams");
  tasksDir = join(tempDir, "tasks");
  await mkdir(teamsDir, { recursive: true });
  await mkdir(tasksDir, { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// ─── 생성자 기본값 ────────────────────────────────

describe("TeamWatcher 생성자", () => {
  it("옵션 없이 생성할 수 있다", () => {
    const watcher = new TeamWatcher();
    expect(watcher).toBeInstanceOf(TeamWatcher);
  });

  it("claudeDir 옵션을 받는다", () => {
    const watcher = new TeamWatcher({ claudeDir: tempDir });
    expect(watcher).toBeInstanceOf(TeamWatcher);
  });

  it("undefined 옵션은 기본값을 덮어쓰지 않는다", () => {
    // 이전에 발견된 버그: undefined가 spread로 기본값 덮어씀
    const watcher = new TeamWatcher({
      claudeDir: undefined,
      debounceMs: undefined,
    });
    expect(watcher).toBeInstanceOf(TeamWatcher);
  });
});

// ─── start / stop ─────────────────────────────────

describe("TeamWatcher 라이프사이클", () => {
  it("start() 후 stop()이 정상 동작한다", async () => {
    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 100,
    });

    await watcher.start();
    await watcher.stop();
  });

  it("중복 start()를 무시한다", async () => {
    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 100,
    });

    await watcher.start();
    await watcher.start(); // 중복 호출
    await watcher.stop();
  });

  it("teams/tasks 디렉토리가 없으면 error 이벤트를 발행한다", async () => {
    const emptyDir = join(tempDir, "empty");
    await mkdir(emptyDir);

    const watcher = new TeamWatcher({
      claudeDir: emptyDir,
      pollIntervalMs: 50000,
    });

    const errorPromise = waitForEvent<[Error, string]>(watcher, "error", 3000);
    await watcher.start();

    const [err] = await errorPromise;
    expect((err as unknown as Error).message).toContain("찾을 수 없습니다");

    await watcher.stop();
  });
});

// ─── getActiveTeams / getTeamSnapshot ─────────────

describe("TeamWatcher 조회", () => {
  it("getActiveTeams()로 팀 목록을 조회한다", async () => {
    await writeTeamConfig("alpha", createConfig("alpha"));
    await writeTeamConfig("beta", createConfig("beta"));

    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 50000,
    });
    await watcher.start();

    const teams = await watcher.getActiveTeams();
    expect(teams).toEqual(["alpha", "beta"]);

    await watcher.stop();
  });

  it("getTeamSnapshot()으로 팀 스냅샷을 조회한다", async () => {
    const config = createConfig("my-team");
    await writeTeamConfig("my-team", config);

    const task = createTask("1", { status: "in_progress", owner: "agent-1" });
    await writeTask("my-team", task);

    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 50000,
    });
    await watcher.start();

    const snapshot = await watcher.getTeamSnapshot("my-team");
    expect(snapshot).not.toBeNull();
    expect(snapshot!.config.name).toBe("my-team");
    expect(snapshot!.tasks).toHaveLength(1);

    await watcher.stop();
  });

  it("존재하지 않는 팀의 스냅샷은 null이다", async () => {
    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 50000,
    });
    await watcher.start();

    const snapshot = await watcher.getTeamSnapshot("ghost");
    expect(snapshot).toBeNull();

    await watcher.stop();
  });
});

// ─── getAllSnapshots ───────────────────────────────

describe("TeamWatcher.getAllSnapshots", () => {
  it("모든 팀의 스냅샷을 반환한다", async () => {
    await writeTeamConfig("a", createConfig("a"));
    await writeTeamConfig("b", createConfig("b"));

    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 50000,
    });
    await watcher.start();

    const snapshots = await watcher.getAllSnapshots();
    expect(snapshots.size).toBe(2);
    expect(snapshots.has("a")).toBe(true);
    expect(snapshots.has("b")).toBe(true);

    await watcher.stop();
  });

  it("teamFilter가 설정되면 해당 팀만 반환한다", async () => {
    await writeTeamConfig("a", createConfig("a"));
    await writeTeamConfig("b", createConfig("b"));
    await writeTeamConfig("c", createConfig("c"));

    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      teamFilter: ["a", "c"],
      pollIntervalMs: 50000,
    });
    await watcher.start();

    const snapshots = await watcher.getAllSnapshots();
    expect(snapshots.size).toBe(2);
    expect(snapshots.has("a")).toBe(true);
    expect(snapshots.has("b")).toBe(false);
    expect(snapshots.has("c")).toBe(true);

    await watcher.stop();
  });
});

// ─── 이벤트 발행 ──────────────────────────────────

describe("TeamWatcher 이벤트", () => {
  it("초기 스캔 시 team:created를 발행한다", async () => {
    await writeTeamConfig("new-team", createConfig("new-team"));

    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 50000,
    });

    const eventPromise = waitForEvent(watcher, "team:created", 3000);
    await watcher.start();

    const [teamName] = await eventPromise;
    expect(teamName).toBe("new-team");

    await watcher.stop();
  });

  it("초기 스캔 시 snapshot:updated를 발행한다", async () => {
    await writeTeamConfig("snap-team", createConfig("snap-team"));

    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 50000,
    });

    const eventPromise = waitForEvent(watcher, "snapshot:updated", 3000);
    await watcher.start();

    const [teamName, snapshot] = await eventPromise;
    expect(teamName).toBe("snap-team");
    expect((snapshot as TeamSnapshot).config.name).toBe("snap-team");

    await watcher.stop();
  });

  it("초기 스캔 시 task:created를 발행한다", async () => {
    await writeTeamConfig("task-team", createConfig("task-team"));
    await writeTask("task-team", createTask("1", { subject: "첫 태스크" }));

    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 50000,
    });

    const eventPromise = waitForEvent(watcher, "task:created", 3000);
    await watcher.start();

    const [teamName, task] = await eventPromise;
    expect(teamName).toBe("task-team");
    expect((task as Task).subject).toBe("첫 태스크");

    await watcher.stop();
  });

  it("폴링으로 태스크 상태 변경을 감지한다", async () => {
    await writeTeamConfig("poll-team", createConfig("poll-team"));
    await writeTask(
      "poll-team",
      createTask("1", { status: "pending", owner: "agent-1" }),
    );

    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 200,
    });
    await watcher.start();

    // 초기 스캔 대기
    await new Promise((r) => setTimeout(r, 300));

    // 태스크 상태 변경
    const updatedPromise = waitForEvent(watcher, "task:updated", 3000);
    await writeTask(
      "poll-team",
      createTask("1", { status: "in_progress", owner: "agent-1" }),
    );

    const [teamName, task] = await updatedPromise;
    expect(teamName).toBe("poll-team");
    expect((task as Task).status).toBe("in_progress");

    await watcher.stop();
  });

  it("태스크 완료 시 task:completed를 발행한다", async () => {
    await writeTeamConfig("done-team", createConfig("done-team"));
    await writeTask(
      "done-team",
      createTask("1", { status: "in_progress", owner: "agent-1" }),
    );

    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 200,
    });
    await watcher.start();

    await new Promise((r) => setTimeout(r, 300));

    const completedPromise = waitForEvent(watcher, "task:completed", 3000);
    await writeTask(
      "done-team",
      createTask("1", { status: "completed", owner: "agent-1" }),
    );

    const [teamName, task] = await completedPromise;
    expect(teamName).toBe("done-team");
    expect((task as Task).status).toBe("completed");

    await watcher.stop();
  });

  it("새 메시지 수신 시 message:received를 발행한다", async () => {
    await writeTeamConfig("msg-team", createConfig("msg-team"));
    await writeInbox("msg-team", "team-lead", []);

    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 200,
    });
    await watcher.start();

    await new Promise((r) => setTimeout(r, 300));

    const msgPromise = waitForEvent(watcher, "message:received", 3000);
    await writeInbox("msg-team", "team-lead", [
      {
        from: "agent-1",
        to: "team-lead",
        type: "text",
        content: "작업 완료",
        timestamp: Date.now(),
        read: false,
      },
    ]);

    const [teamName, message] = await msgPromise;
    expect(teamName).toBe("msg-team");
    expect((message as { content: string }).content).toBe("작업 완료");

    await watcher.stop();
  });

  it("새 멤버 합류 시 agent:joined를 발행한다", async () => {
    const config = createConfig("join-team", 2);
    await writeTeamConfig("join-team", config);

    const watcher = new TeamWatcher({
      claudeDir: tempDir,
      pollIntervalMs: 200,
    });
    await watcher.start();

    await new Promise((r) => setTimeout(r, 300));

    const joinPromise = waitForEvent(watcher, "agent:joined", 3000);
    const updated = createConfig("join-team", 3); // 멤버 추가
    await writeTeamConfig("join-team", updated);

    const [teamName, member] = await joinPromise;
    expect(teamName).toBe("join-team");
    expect((member as { name: string }).name).toBe("agent-2");

    await watcher.stop();
  });
});
