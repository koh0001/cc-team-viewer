# CC Team Viewer

**Claude Code Agent Teams リアルタイムモニタリングツール**

[![npm core](https://img.shields.io/npm/v/@cc-team-viewer/core?label=core)](https://www.npmjs.com/package/@cc-team-viewer/core)
[![npm tui](https://img.shields.io/npm/v/@cc-team-viewer/tui?label=tui)](https://www.npmjs.com/package/@cc-team-viewer/tui)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/koh-dev.cc-team-viewer-vscode?label=vscode)](https://marketplace.visualstudio.com/items?itemName=koh-dev.cc-team-viewer-vscode)

[English](README.md) | [한국어](README.ko.md) | [中文](README.zh.md)

![ダッシュボード概要](packages/vscode/images/screenshot-overview.png)

> **これは何？** [Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams)をリアルタイムで監視するVS Code拡張およびターミナルUIです。各エージェントのステータス、タスクの進捗、エージェント間のメッセージを一目で確認できます — 追加設定なしですぐに動作します。

## なぜ必要？

Claude CodeのAgent Teamsは強力ですが、モニタリング方法が限られています：
- `Shift+Down`でエージェント間を循環
- `Ctrl+T`でタスクリストを表示
- tmux paneを目視で確認

CC Team Viewerは`~/.claude/teams/`と`~/.claude/tasks/`ディレクトリのJSONファイルをリアルタイムで監視し、別のターミナルpaneやVS Codeパネルでチーム全体の状況を一目で表示します。

## 機能

- **チーム概要** — アクティブチーム、メンバー数、全体進捗
- **エージェントステータス** — 各エージェントの作業内容、モデル(opus/sonnet/haiku)、バックエンドタイプ
- **タスクボード** — テーブル/カンバンボード切替、ステータス、担当者、依存関係、ブロッキング
- **メッセージログ** — エージェント間通信のリアルタイム表示
- **依存関係グラフ** — タスク間のブロッキング関係を可視化
- **進捗統計** — 完了率、経過時間、エージェント別スループット
- **多言語サポート** — English、한국어、日本語、中文

| タスク | カンバン | メッセージ |
|--------|----------|-----------|
| ![タスク](packages/vscode/images/screenshot-tasks.png) | ![カンバン](packages/vscode/images/screenshot-kanban.png) | ![メッセージ](packages/vscode/images/screenshot-messages.png) |

## パッケージ構造

```
packages/
├── core/     # ファイル監視 + JSONパース + イベント（共有ライブラリ）
├── tui/      # ターミナルUI（ink基盤、Windows Terminal/iTerm2/tmux互換）
└── vscode/   # VS Code拡張（サイドバーパネル + WebViewダッシュボード）
```

## クイックスタート

### VS Code拡張（推奨）

[VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=koh-dev.cc-team-viewer-vscode)からインストール：

```
ext install koh-dev.cc-team-viewer-vscode
```

### ターミナルTUI

```bash
npm install -g @cc-team-viewer/tui
cc-team-viewer
```

### ライブラリとして使用

```bash
npm install @cc-team-viewer/core
```

```typescript
import { TeamWatcher } from "@cc-team-viewer/core";

const watcher = new TeamWatcher();
watcher.on("snapshot:updated", (teamName, snapshot) => {
  console.log(`${teamName}: ${snapshot.stats.completionRate}% 完了`);
});
await watcher.start();
```

### ソースからビルド

```bash
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install && npm run build
npm run tui
```

## 互換性

| 環境 | TUI | VS Code拡張 |
|------|-----|-------------|
| macOS (iTerm2/Terminal) | 対応 | 対応 |
| macOS (tmux pane) | 対応 | - |
| Windows (ネイティブ) | 対応 | 対応 |
| Windows (WSL) | 対応 | 対応 (Remote WSL) |
| Linux | 対応 | 対応 |

> **注意**: Agent Teams自体はtmux（split-pane）またはin-processモードで動作します。
> CC Team Viewerはファイルシステムのみ読み取るため、どの環境でも動作します。

## 必要条件

- Node.js 20+
- Claude Code（Agent Teams有効化）

## 開発

```bash
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install
npm run dev        # TUI開発モード（--watch）
npm run build      # 全パッケージビルド
npm run test:run   # テスト実行
npm run lint       # ESLintチェック
```

## ライセンス

[MIT](LICENSE)
