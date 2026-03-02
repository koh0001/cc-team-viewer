/**
 * i18n React 컨텍스트 - LocaleProvider 및 useI18n 훅
 *
 * 사용법:
 * ```tsx
 * <LocaleProvider initialLocale="en">
 *   <App />
 * </LocaleProvider>
 *
 * // 컴포넌트 내부
 * const { t, locale, cycleLocale } = useI18n();
 * ```
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { Locale, TranslateFn } from "@cc-team-viewer/core";
import { createI18n, LOCALE_NAMES } from "@cc-team-viewer/core";

interface I18nContextValue {
  /** 현재 로케일 */
  locale: Locale;
  /** 번역 함수 */
  t: TranslateFn;
  /** 다음 로케일로 순환 */
  cycleLocale: () => void;
  /** 로케일 표시 이름 */
  localeName: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface LocaleProviderProps {
  initialLocale?: Locale;
  children: React.ReactNode;
}

/** i18n 컨텍스트 프로바이더 */
export function LocaleProvider({ initialLocale, children }: LocaleProviderProps) {
  const [i18n, setI18n] = useState(() => createI18n(initialLocale));

  const cycleLocale = useCallback(() => {
    setI18n((prev) => prev.cycleLocale());
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: i18n.locale,
      t: i18n.t,
      cycleLocale,
      localeName: LOCALE_NAMES[i18n.locale],
    }),
    [i18n, cycleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** i18n 훅 */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n은 LocaleProvider 내부에서 사용해야 합니다.");
  }
  return ctx;
}
