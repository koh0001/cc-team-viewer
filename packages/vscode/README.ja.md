# CC Team Viewer for VS Code

**Claude Code Agent Teamsリアルタイムモニタリングダッシュボード**

[English](README.md) | [한국어](README.ko.md) | [中文](README.zh.md)

## 機能

- **WebViewダッシュボード** — 概要、タスク、メッセージ、依存関係タブ
- **ツリービューサイドバー** — アクティビティバーでチーム > エージェント > タスクの階層構造
- **ステータスバー** — タスク完了進捗を一目で確認
- **チームpill切り替え** — ワンクリックでチーム切り替え
- **エージェントパルスアニメーション** — アクティブエージェントの視覚的表示
- **リアルタイム更新** — チームファイル変更時に自動更新
- **テーマ統合** — VS Codeテーマに対応（ライト/ダーク/ハイコントラスト）

## インストール

### .vsixファイルからインストール

```bash
# ソースからビルド
git clone https://github.com/koh0001/cc-team-viewer.git
cd cc-team-viewer
npm install
npm run build
cd packages/vscode
npm run package
code --install-extension cc-team-viewer-*.vsix
```

### ソースから実行（開発用）

1. VS Codeでモノレポを開く
2. `F5`を押してExtension Development Hostを起動
3. アクティビティバーにCC Team Viewerパネルが表示される

## 使い方

1. ターミナルでClaude Code Agent Teamを開始
2. VS Codeを開くと`~/.claude/`検出時に拡張が自動アクティベート
3. アクティビティバーの望遠鏡アイコンをクリックしてツリービューを開く
4. ダッシュボードアイコンをクリックしてWebViewダッシュボードを開く

## コマンド

| コマンド | 説明 |
|----------|------|
| `CC Team Viewer: Open Dashboard` | WebViewダッシュボードパネルを開く |
| `CC Team Viewer: Refresh` | チームデータを手動更新 |
| `CC Team Viewer: Select Team` | アクティブチームを切り替え |

コマンドパレット（`Ctrl+Shift+P` / `Cmd+Shift+P`）からアクセス可能。

## 必要条件

- VS Code 1.90+
- Node.js 20+
- Claude Code（Agent Teams有効化）

## ライセンス

[MIT](../../LICENSE)
