/**
 * i18n 코어 - 경량 자체 구현
 *
 * 사용법:
 * ```ts
 * const i18n = createI18n('en');
 * i18n.t('status.completed');              // "Completed"
 * i18n.t('duration.seconds', { count: 30 }); // "30s"
 *
 * const next = i18n.cycleLocale();         // → 'ja'
 * ```
 */

import type {
  Locale,
  TranslationMap,
  TranslationKey,
  InterpolationParams,
  I18nInstance,
} from "./types.js";
import { LOCALE_ORDER } from "./types.js";
import { ko } from "./locales/ko.js";
import { en } from "./locales/en.js";
import { ja } from "./locales/ja.js";
import { zh } from "./locales/zh.js";

/** 전체 번역 레지스트리 */
const TRANSLATIONS: Record<Locale, TranslationMap> = { ko, en, ja, zh };

/**
 * 보간 처리: `{key}` 형식의 플레이스홀더를 params 값으로 치환
 */
export function interpolate(template: string, params?: InterpolationParams): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );
}

/**
 * 시스템 로케일 자동 감지
 *
 * 우선순위: CC_TEAM_VIEWER_LANG → LANG 환경변수 → Intl API → ko
 */
export function detectLocale(): Locale {
  // 1. 전용 환경변수
  const ccLang = process.env.CC_TEAM_VIEWER_LANG;
  if (ccLang && isValidLocale(ccLang)) return ccLang;

  // 2. LANG 환경변수 (예: "en_US.UTF-8" → "en")
  const lang = process.env.LANG;
  if (lang) {
    const prefix = lang.split(/[_.\-]/)[0].toLowerCase();
    if (isValidLocale(prefix)) return prefix;
  }

  // 3. Intl API
  try {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    const prefix = intlLocale.split(/[_\-]/)[0].toLowerCase();
    if (isValidLocale(prefix)) return prefix;
  } catch {
    // Intl 미지원 환경 → 폴백
  }

  // 4. 기본값
  return "ko";
}

/** 유효 로케일 검증 */
function isValidLocale(value: string): value is Locale {
  return (LOCALE_ORDER as readonly string[]).includes(value);
}

/**
 * i18n 인스턴스 생성 (팩토리)
 *
 * 불변 패턴: setLocale/cycleLocale은 새 인스턴스를 반환
 */
export function createI18n(locale?: Locale): I18nInstance {
  const currentLocale = locale ?? detectLocale();
  const translations = TRANSLATIONS[currentLocale];
  const fallback = TRANSLATIONS.ko;

  const t = (key: TranslationKey, params?: InterpolationParams): string => {
    // 폴백 체인: 현재 로케일 → ko → 키 자체
    const template = translations[key] ?? fallback[key] ?? key;
    return interpolate(template, params);
  };

  const setLocale = (newLocale: Locale): I18nInstance => createI18n(newLocale);

  const cycleLocale = (): I18nInstance => {
    const idx = LOCALE_ORDER.indexOf(currentLocale);
    const nextLocale = LOCALE_ORDER[(idx + 1) % LOCALE_ORDER.length];
    return createI18n(nextLocale);
  };

  return { locale: currentLocale, t, setLocale, cycleLocale };
}

// 타입 재내보내기
export type {
  Locale,
  TranslationMap,
  TranslationKey,
  InterpolationParams,
  TranslateFn,
  I18nInstance,
} from "./types.js";
export { LOCALE_ORDER, LOCALE_NAMES } from "./types.js";
