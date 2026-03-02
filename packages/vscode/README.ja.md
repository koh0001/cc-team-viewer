# CC Team Viewer for VS Code

**Claude Code Agent Teamsリアルタイムモニタリングダッシュボード**

[English](README.md) | [한국어](README.ko.md) | [中文](README.zh.md)

![概要](images/screenshot-overview.png)

## CC Team Viewerとは？

[Claude Code Agent Teams](https://docs.anthropic.com/en/docs/claude-code/agent-teams)を実行すると、複数のAIエージェントがタスクを並列処理します。CC Team Viewerは、エージェントの進捗をリアルタイムで監視できるダッシュボードを提供します — どのエージェントがアクティブか、どのタスクに取り組んでいるか、エージェント間のコミュニケーションを一目で把握できます。

## 機能

### WebViewダッシュボード
4つのタブで構成されたインタラクティブダッシュボード：

| タブ | 説明 |
|------|------|
| **Overview** | エージェントカード — ステータス、実行中タスク、進捗率 |
| **Tasks** | タスク一覧テーブル — ステータスインジケーター、担当者 |
| **Messages** | エージェント間のリアルタイムメッセージログ |
| **Deps** | タスク依存関係グラフの可視化 |

![タスク](images/screenshot-tasks.png)

![メッセージ](images/screenshot-messages.png)

### ツリービューサイドバー
アクティビティバーで**チーム > エージェント > タスク**の階層構造をナビゲート。

### ステータスバー
常時表示の進捗サマリー：`refactor-auth 62% (5/8)` — クリックでダッシュボードを開く。

### 多言語サポート
ダッシュボードUIを4言語で提供：English、한국어、日本語、中文
- `設定 > CC Team Viewer > Language`で変更
- またはダッシュボードヘッダーの言語ボタンをクリックして切り替え

### その他の機能
- **チームpill切り替え** — 複数チーム監視時のクイック切り替え
- **エージェントパルスアニメーション** — 作業中エージェントの視覚的表示
- **リアルタイム更新** — 1秒間隔の自動ポーリング、手動更新不要
- **テーマ統合** — VS Codeテーマに自動対応（ライト/ダーク/ハイコントラスト）

## インストール

### VS Code Marketplaceから

拡張パネルで**「CC Team Viewer」**を検索、または：

```
ext install koh-dev.cc-team-viewer-vscode
```

### .vsixファイルから

```bash
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install && npm run build
cd packages/vscode && npm run package
code --install-extension cc-team-viewer-vscode-*.vsix
```

## 使い方

1. ターミナルでClaude Code Agent Teamを開始
2. VS Codeを開くと`~/.claude/`検出時に拡張が自動アクティベート
3. アクティビティバーの**望遠鏡アイコン**をクリックしてツリービューを開く
4. **ダッシュボードアイコン**をクリックしてWebViewダッシュボードを開く

> `~/.claude/teams/`と`~/.claude/tasks/`ディレクトリの変更を自動監視します。設定不要。

## コマンド

| コマンド | 説明 |
|----------|------|
| `CC Team Viewer: Open Dashboard` | WebViewダッシュボードパネルを開く |
| `CC Team Viewer: Refresh` | チームデータを手動更新 |
| `CC Team Viewer: Select Team` | アクティブチームを切り替え |

コマンドパレット（`Ctrl+Shift+P` / `Cmd+Shift+P`）からアクセス可能。

## 設定

| 設定 | デフォルト | 説明 |
|------|-----------|------|
| `ccTeamViewer.language` | `auto` | ダッシュボード言語（`auto`、`ko`、`en`、`ja`、`zh`） |

## 必要条件

- VS Code 1.90+
- Claude Code（Agent Teams有効化）

## ライセンス

[MIT](../../LICENSE)
