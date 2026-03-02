/**
 * CC Team Viewer TUI - 엔트리 포인트
 *
 * 사용법:
 *   cc-team-viewer                    # 전체 팀 감시
 *   cc-team-viewer --team my-team     # 특정 팀만 감시
 *   cc-team-viewer --dir ~/.claude    # 커스텀 Claude 디렉토리
 *   cc-team-viewer --lang en          # 영어 UI
 */
import React from "react";
import { render } from "ink";
import meow from "meow";
import type { Locale } from "@cc-team-viewer/core";
import { LOCALE_ORDER } from "@cc-team-viewer/core";
import { App } from "./screens/app.js";
import { LocaleProvider } from "./i18n/context.js";

const cli = meow(
  `
  사용법 / Usage
    $ cc-team-viewer [옵션/options]

  옵션 / Options
    --team, -t    감시할 팀 이름 / Team name to watch (multiple)
    --dir, -d     Claude 디렉토리 / Claude directory path (default: ~/.claude)
    --lang, -l    UI 언어 / UI language (ko, en, ja, zh)
    --help        도움말 / Help
    --version     버전 / Version

  예시 / Examples
    $ cc-team-viewer
    $ cc-team-viewer --team dashboard-build
    $ cc-team-viewer --team team-a --team team-b
    $ cc-team-viewer --lang en
    $ cc-team-viewer --dir /home/user/.claude
`,
  {
    importMeta: import.meta,
    flags: {
      team: {
        type: "string",
        shortFlag: "t",
        isMultiple: true,
      },
      dir: {
        type: "string",
        shortFlag: "d",
      },
      lang: {
        type: "string",
        shortFlag: "l",
      },
    },
  },
);

const { team: teamFilter, dir: claudeDir, lang } = cli.flags;

// --lang 플래그 검증
const initialLocale: Locale | undefined =
  lang && (LOCALE_ORDER as readonly string[]).includes(lang)
    ? (lang as Locale)
    : undefined;

render(
  <LocaleProvider initialLocale={initialLocale}>
    <App
      claudeDir={claudeDir || undefined}
      teamFilter={teamFilter.length > 0 ? teamFilter : undefined}
    />
  </LocaleProvider>,
);
