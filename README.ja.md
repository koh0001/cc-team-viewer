# CC Team Viewer

**Claude Code Agent Teamsリアルタイムモニタリングツール**

[English](README.md) | [한국어](README.ko.md) | [中文](README.zh.md)

Agent Teamsが並列で作業する際、各エージェントの状態、タスク進捗、エージェント間メッセージを一目で確認できるダッシュボードです。

## なぜ必要か？

Claude CodeのAgent Teamsは強力ですが、モニタリング方法が限られています：
- `Shift+Down`でエージェント間を切り替える
- `Ctrl+T`でタスク一覧を確認する
- tmuxペインを目視で確認する

CC Team Viewerは`~/.claude/teams/`と`~/.claude/tasks/`ディレクトリのJSONファイルをリアルタイムで監視し、別のターミナルペインやVS Codeパネルでチーム全体の状況を表示します。

## 機能

- **チーム概要** — アクティブチーム、メンバー数、全体進捗率
- **エージェント状態** — 各エージェントの現在のタスク、モデル（opus/sonnet/haiku）、バックエンドタイプ
- **タスクボード** — ステータス（pending/in_progress/completed）、担当者、依存関係、ブロッキング
- **メッセージログ** — エージェント間通信のリアルタイム表示
- **依存関係グラフ** — タスク間のブロッキング関係を視覚化
- **進捗統計** — 完了率、経過時間、エージェント別処理量

## パッケージ構成

```
packages/
├── core/     # ファイル監視 + JSON解析 + イベント（共有ライブラリ）
├── tui/      # ターミナルUI（ink基盤、Windows Terminal/iTerm2/tmux対応）
└── vscode/   # VS Code拡張機能（サイドバーパネル + WebViewダッシュボード）
```

## クイックスタート

### ターミナルTUI

```bash
# インストール＆ビルド
npm install
npm run build

# 実行
npm run tui

# またはグローバルインストール
npm install -g @cc-team-viewer/tui
cc-team-viewer
```

### VS Code拡張機能

```bash
# ビルド＆インストール
cd packages/vscode
npm run package
code --install-extension cc-team-viewer-*.vsix
```

## 互換性

| 環境 | TUI | VS Code拡張 |
|------|-----|-------------|
| macOS (iTerm2/Terminal) | 対応 | 対応 |
| macOS (tmuxペイン) | 対応 | - |
| Windows（ネイティブ） | 対応 | 対応 |
| Windows (WSL) | 対応 | 対応 (Remote WSL) |
| Linux | 対応 | 対応 |

> **注意**: Agent Teams自体はtmux（split-pane）またはin-processモードで動作します。
> CC Team Viewerはファイルシステムのみを読み取るため、どの環境でも動作します。

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
```

## ライセンス

[MIT](LICENSE)
