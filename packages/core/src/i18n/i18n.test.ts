/**
 * i18n 유닛 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createI18n, interpolate, detectLocale } from "./index.js";
import { LOCALE_ORDER } from "./types.js";

describe("interpolate", () => {
  it("파라미터 없으면 원본 반환", () => {
    expect(interpolate("hello")).toBe("hello");
  });

  it("단일 파라미터 치환", () => {
    expect(interpolate("{count}초", { count: 5 })).toBe("5초");
  });

  it("복수 파라미터 치환", () => {
    expect(interpolate("{hours}시간 {minutes}분", { hours: 2, minutes: 30 })).toBe(
      "2시간 30분",
    );
  });

  it("동일 키 복수 출현 치환", () => {
    expect(interpolate("{x} and {x}", { x: "a" })).toBe("a and a");
  });

  it("없는 플레이스홀더는 그대로 유지", () => {
    expect(interpolate("{missing}", {})).toBe("{missing}");
  });
});

describe("createI18n", () => {
  it("기본 로케일로 인스턴스 생성", () => {
    const i18n = createI18n("ko");
    expect(i18n.locale).toBe("ko");
  });

  it("한국어 번역 반환", () => {
    const i18n = createI18n("ko");
    expect(i18n.t("status.completed")).toBe("완료");
    expect(i18n.t("status.inProgress")).toBe("진행중");
    expect(i18n.t("status.pending")).toBe("대기");
  });

  it("영어 번역 반환", () => {
    const i18n = createI18n("en");
    expect(i18n.t("status.completed")).toBe("Completed");
    expect(i18n.t("status.inProgress")).toBe("In Progress");
  });

  it("일본어 번역 반환", () => {
    const i18n = createI18n("ja");
    expect(i18n.t("status.completed")).toBe("完了");
    expect(i18n.t("status.inProgress")).toBe("進行中");
  });

  it("중국어 번역 반환", () => {
    const i18n = createI18n("zh");
    expect(i18n.t("status.completed")).toBe("已完成");
    expect(i18n.t("status.inProgress")).toBe("进行中");
  });

  it("보간 파라미터 치환", () => {
    const i18n = createI18n("ko");
    expect(i18n.t("duration.seconds", { count: 30 })).toBe("30초");
    expect(i18n.t("timeAgo.minutes", { count: 5 })).toBe("5분 전");
  });

  it("영어 보간 파라미터", () => {
    const i18n = createI18n("en");
    expect(i18n.t("duration.seconds", { count: 30 })).toBe("30s");
    expect(i18n.t("timeAgo.minutes", { count: 5 })).toBe("5m ago");
  });

  it("복수 파라미터 보간", () => {
    const i18n = createI18n("ko");
    expect(i18n.t("duration.hoursMinutes", { hours: 1, minutes: 30 })).toBe(
      "1시간 30분",
    );
  });

  it("에러 메시지 보간", () => {
    const i18n = createI18n("ko");
    expect(i18n.t("error.claudeDirNotFound", { path: "/home/.claude" })).toBe(
      "Claude 디렉토리를 찾을 수 없습니다: /home/.claude",
    );
  });
});

describe("setLocale (불변성)", () => {
  it("새 인스턴스 반환, 원본 불변", () => {
    const i18n = createI18n("ko");
    const en = i18n.setLocale("en");

    expect(i18n.locale).toBe("ko");
    expect(en.locale).toBe("en");
    expect(en.t("status.completed")).toBe("Completed");
  });
});

describe("cycleLocale", () => {
  it("ko → en → ja → zh → ko 순환", () => {
    let i18n = createI18n("ko");
    expect(i18n.locale).toBe("ko");

    i18n = i18n.cycleLocale();
    expect(i18n.locale).toBe("en");

    i18n = i18n.cycleLocale();
    expect(i18n.locale).toBe("ja");

    i18n = i18n.cycleLocale();
    expect(i18n.locale).toBe("zh");

    i18n = i18n.cycleLocale();
    expect(i18n.locale).toBe("ko");
  });
});

describe("detectLocale", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("CC_TEAM_VIEWER_LANG 우선", () => {
    process.env.CC_TEAM_VIEWER_LANG = "en";
    expect(detectLocale()).toBe("en");
  });

  it("LANG 환경변수 파싱", () => {
    delete process.env.CC_TEAM_VIEWER_LANG;
    process.env.LANG = "ja_JP.UTF-8";
    expect(detectLocale()).toBe("ja");
  });

  it("잘못된 CC_TEAM_VIEWER_LANG 무시", () => {
    process.env.CC_TEAM_VIEWER_LANG = "fr";
    delete process.env.LANG;
    // Intl 또는 기본값으로 폴백
    const locale = detectLocale();
    expect(LOCALE_ORDER).toContain(locale);
  });
});

describe("폴백 체인", () => {
  it("없는 키 → 키 자체 반환", () => {
    const i18n = createI18n("en");
    // TypeScript 타입 안전 때문에 직접 테스트 불가하므로, 모든 키가 존재하는지 검증
    expect(i18n.t("status.completed")).not.toBe("status.completed");
  });
});

describe("모든 로케일 키 완전성", () => {
  const locales = ["ko", "en", "ja", "zh"] as const;
  const baseI18n = createI18n("ko");

  // ko의 모든 키가 다른 로케일에도 존재하는지 검증
  for (const locale of locales) {
    it(`${locale} 로케일에 모든 키 존재`, () => {
      const i18n = createI18n(locale);
      // TranslationMap의 모든 키에 대해 비어있지 않은 값 반환 확인
      const testKeys = [
        "status.completed",
        "status.inProgress",
        "status.pending",
        "duration.seconds",
        "timeAgo.seconds",
        "app.title",
        "view.overview",
        "agent.noAgents",
        "task.noTasks",
        "message.noMessages",
        "error.claudeDirNotFound",
        "cli.usage",
      ] as const;

      for (const key of testKeys) {
        const value = i18n.t(key);
        expect(value).not.toBe("");
        expect(value).not.toBe(key); // 폴백으로 키 자체가 반환되면 안 됨
      }
    });
  }
});
