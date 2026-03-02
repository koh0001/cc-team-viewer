/**
 * 中文翻译
 */
import type { TranslationMap } from "../types.js";

export const zh: TranslationMap = {
  // 状态
  "status.completed": "已完成",
  "status.inProgress": "进行中",
  "status.pending": "等待中",

  // 经过时间
  "duration.seconds": "{count}秒",
  "duration.minutes": "{count}分钟",
  "duration.hours": "{count}小时",
  "duration.hoursMinutes": "{hours}小时{minutes}分钟",

  // 相对时间
  "timeAgo.seconds": "{count}秒前",
  "timeAgo.minutes": "{count}分钟前",
  "timeAgo.hours": "{count}小时前",

  // 应用
  "app.title": "CC Team Viewer",
  "app.subtitle": "Claude Code Agent Teams Monitor",
  "app.quit": "退出",
  "app.watching": "正在监视Agent Teams...",
  "app.watchingHint": "在Claude Code中创建Agent Team后将在此显示。",
  "app.watchingPath": "监视路径: {path}/teams/",

  // 视图标签
  "view.overview": "概览",
  "view.tasks": "任务",
  "view.messages": "消息",
  "view.deps": "依赖",
  "view.tabHint": "(Tab切换)",

  // 侧边栏
  "sidebar.teamList": "团队 (↑↓)",

  // 统计
  "stats.tasks": "任务",
  "stats.active": "活跃",
  "stats.messages": "消息",
  "stats.elapsed": "经过",

  // 代理
  "agent.sectionTitle": "代理 ({count})",
  "agent.taskProgress": "任务: {completed}/{total} 完成",
  "agent.noAgents": "无代理",

  // 任务
  "task.headerId": "ID",
  "task.headerTask": "任务",
  "task.headerOwner": "负责人",
  "task.headerStatus": "状态",
  "task.unassigned": "未分配",
  "task.noTasks": "无任务",

  // 消息
  "message.headerFrom": "发送",
  "message.headerTo": "接收",
  "message.headerContent": "内容",
  "message.headerTime": "时间",
  "message.noMessages": "无消息",
  "message.olderOmitted": "... 省略{count}条旧消息",

  // 依赖图
  "deps.sectionTitle": "任务依赖图",

  // 错误
  "error.claudeDirNotFound": "找不到Claude目录: {path}",
  "error.agentTeamsNotActive": "请确认Agent Teams是否已启用。",
  "error.startFailed": "启动失败: {message}",

  // CLI
  "cli.usage": "用法",
  "cli.options": "选项",
  "cli.teamDesc": "要监视的团队名称 (可多次使用)",
  "cli.dirDesc": "Claude目录路径 (默认: ~/.claude)",
  "cli.langDesc": "界面语言 (ko, en, ja, zh)",
  "cli.helpDesc": "显示帮助",
  "cli.versionDesc": "显示版本",
  "cli.example": "示例",
};
