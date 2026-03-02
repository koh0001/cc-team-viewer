/**
 * CC Team Viewer TUI - 엔트리 포인트
 *
 * 사용법:
 *   cc-team-viewer                    # 전체 팀 감시
 *   cc-team-viewer --team my-team     # 특정 팀만 감시
 *   cc-team-viewer --dir ~/.claude    # 커스텀 Claude 디렉토리
 */
import React from "react";
import { render } from "ink";
import meow from "meow";
import { App } from "./screens/app.js";

const cli = meow(
  `
  사용법
    $ cc-team-viewer [옵션]

  옵션
    --team, -t    감시할 팀 이름 (여러 번 사용 가능)
    --dir, -d     Claude 디렉토리 경로 (기본: ~/.claude)
    --help        도움말 표시
    --version     버전 표시

  예시
    $ cc-team-viewer
    $ cc-team-viewer --team dashboard-build
    $ cc-team-viewer --team team-a --team team-b
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
    },
  },
);

const { team: teamFilter, dir: claudeDir } = cli.flags;

render(
  <App
    claudeDir={claudeDir || undefined}
    teamFilter={teamFilter.length > 0 ? teamFilter : undefined}
  />,
);
