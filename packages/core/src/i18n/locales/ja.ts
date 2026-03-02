/**
 * 日本語翻訳
 */
import type { TranslationMap } from "../types.js";

export const ja: TranslationMap = {
  // ステータス
  "status.completed": "完了",
  "status.inProgress": "進行中",
  "status.pending": "待機",

  // 経過時間
  "duration.seconds": "{count}秒",
  "duration.minutes": "{count}分",
  "duration.hours": "{count}時間",
  "duration.hoursMinutes": "{hours}時間{minutes}分",

  // 相対時間
  "timeAgo.seconds": "{count}秒前",
  "timeAgo.minutes": "{count}分前",
  "timeAgo.hours": "{count}時間前",

  // アプリ全般
  "app.title": "CC Team Viewer",
  "app.subtitle": "Claude Code Agent Teams Monitor",
  "app.quit": "終了",
  "app.watching": "Agent Teamsを監視中...",
  "app.watchingHint": "Claude CodeでAgent Teamを作成するとここに表示されます。",
  "app.watchingPath": "監視パス: {path}/teams/",

  // ビュータブ
  "view.overview": "概要",
  "view.tasks": "タスク",
  "view.messages": "メッセージ",
  "view.deps": "依存関係",
  "view.tabHint": "(Tabで切替)",

  // サイドバー
  "sidebar.teamList": "チーム (↑↓)",

  // 統計
  "stats.tasks": "タスク",
  "stats.active": "稼働",
  "stats.messages": "メッセージ",
  "stats.elapsed": "経過",

  // エージェント
  "agent.sectionTitle": "エージェント ({count})",
  "agent.taskProgress": "タスク: {completed}/{total} 完了",
  "agent.noAgents": "エージェントなし",

  // タスク
  "task.headerId": "ID",
  "task.headerTask": "タスク",
  "task.headerOwner": "担当",
  "task.headerStatus": "状態",
  "task.unassigned": "未割当",
  "task.noTasks": "タスクなし",

  // メッセージ
  "message.headerFrom": "送信",
  "message.headerTo": "受信",
  "message.headerContent": "内容",
  "message.headerTime": "時間",
  "message.noMessages": "メッセージなし",
  "message.olderOmitted": "... {count}件の古いメッセージを省略",

  // 依存関係グラフ
  "deps.sectionTitle": "タスク依存関係グラフ",

  // エラー
  "error.claudeDirNotFound": "Claudeディレクトリが見つかりません: {path}",
  "error.agentTeamsNotActive": "Agent Teamsが有効か確認してください。",
  "error.startFailed": "起動失敗: {message}",

  // CLI
  "cli.usage": "使い方",
  "cli.options": "オプション",
  "cli.teamDesc": "監視するチーム名 (複数指定可)",
  "cli.dirDesc": "Claudeディレクトリパス (デフォルト: ~/.claude)",
  "cli.langDesc": "UI言語 (ko, en, ja, zh)",
  "cli.helpDesc": "ヘルプを表示",
  "cli.versionDesc": "バージョンを表示",
  "cli.example": "例",
};
