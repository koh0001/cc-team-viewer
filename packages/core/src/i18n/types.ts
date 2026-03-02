/**
 * i18n 타입 정의
 */

/** 지원 로케일 */
export type Locale = "ko" | "en" | "ja" | "zh";

/** 로케일 순환 순서 */
export const LOCALE_ORDER: readonly Locale[] = ["ko", "en", "ja", "zh"] as const;

/** 로케일 표시 이름 */
export const LOCALE_NAMES: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

/** 번역 맵 (중첩 구조를 평탄화한 dot-notation 키) */
export type TranslationMap = {
  // 상태
  "status.completed": string;
  "status.inProgress": string;
  "status.pending": string;

  // 경과 시간
  "duration.seconds": string;
  "duration.minutes": string;
  "duration.hours": string;
  "duration.hoursMinutes": string;

  // 상대 시간
  "timeAgo.seconds": string;
  "timeAgo.minutes": string;
  "timeAgo.hours": string;

  // 앱 전반
  "app.title": string;
  "app.subtitle": string;
  "app.quit": string;
  "app.watching": string;
  "app.watchingHint": string;
  "app.watchingPath": string;

  // 뷰 탭
  "view.overview": string;
  "view.tasks": string;
  "view.messages": string;
  "view.deps": string;
  "view.tabHint": string;

  // 사이드바
  "sidebar.teamList": string;

  // 통계
  "stats.tasks": string;
  "stats.active": string;
  "stats.messages": string;
  "stats.elapsed": string;

  // 에이전트
  "agent.sectionTitle": string;
  "agent.taskProgress": string;
  "agent.noAgents": string;

  // 태스크
  "task.headerId": string;
  "task.headerTask": string;
  "task.headerOwner": string;
  "task.headerStatus": string;
  "task.unassigned": string;
  "task.noTasks": string;

  // 메시지
  "message.headerFrom": string;
  "message.headerTo": string;
  "message.headerContent": string;
  "message.headerTime": string;
  "message.noMessages": string;
  "message.olderOmitted": string;

  // 의존성 그래프
  "deps.sectionTitle": string;

  // 에러
  "error.claudeDirNotFound": string;
  "error.agentTeamsNotActive": string;
  "error.startFailed": string;

  // CLI
  "cli.usage": string;
  "cli.options": string;
  "cli.teamDesc": string;
  "cli.dirDesc": string;
  "cli.langDesc": string;
  "cli.helpDesc": string;
  "cli.versionDesc": string;
  "cli.example": string;
};

/** 번역 키 */
export type TranslationKey = keyof TranslationMap;

/** 보간 파라미터 */
export type InterpolationParams = Record<string, string | number>;

/** 번역 함수 시그니처 */
export type TranslateFn = (key: TranslationKey, params?: InterpolationParams) => string;

/** i18n 인스턴스 */
export interface I18nInstance {
  /** 현재 로케일 */
  readonly locale: Locale;
  /** 번역 함수 */
  t: TranslateFn;
  /** 로케일 변경 (새 인스턴스 반환) */
  setLocale: (locale: Locale) => I18nInstance;
  /** 다음 로케일로 순환 (새 인스턴스 반환) */
  cycleLocale: () => I18nInstance;
}
