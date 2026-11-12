/**
 * 列表视图数据类型定义。
 *
 * 数据现全部由后端 detective 服务提供(见 src/api/client.ts),
 * 此文件仅保留与后端契约对应的类型声明。
 */

export interface TaskItem {
  id: string;
  title: string;
  stageProgress: string; // "8/9" or "9/9"
  stageProgressNum: number;
  priority: '高' | '中' | '低';
  assignee: string; // "王思思" or "——"
  assigneeInitial: string;
  conclusion: '误导' | '无法核查' | '疑似AI生成' | '无法判断' | '基本真实' | '尚待核实' | '虚假' | '真实';
  status: '报告生成' | '已结案' | '进行中';
}

export interface EvidenceItem {
  id: number;
  caseId: string;
  name: string;
  sourceOrg: string;
  date: string;
  relation: '支持' | '反驳' | '背景' | '待确认';
  sourceType: '中方官方' | '中方媒体' | '国际媒体' | '外媒官方喉舌' | '事实核查机构' | '国际组织';
  credibility: '高' | '较高' | '中' | '低';
}

export interface HistoryCase {
  id: string;
  conclusion: '误导' | '基本真实' | '尚待核实' | '虚假' | '真实';
  title: string;
  summary: string;
  evidenceCount: number;
  reviewRounds: number;
  confidence: '高' | '较高' | '中' | '低';
  closedDate: string;
}

export interface KnowledgeItem {
  id: number;
  category: '核查规范' | '核查方法' | '信源分级' | '典型案例';
  title: string;
  citations: number;
  content: string;
  keyRule: string;
  updatedDate: string;
}

export interface TeamMember {
  id: number;
  name: string;
  title: string;
  handle: string;
  role: '管理员' | '审核员' | '核查员';
  department: string;
  email: string;
  status: '启用' | '停用';
  lastActive: string;
  avatarChar: string;
}

export interface AuditLogItem {
  id: number;
  time: string;
  member: string;
  action: string;
  target: string;
  result: '成功' | '需复核';
}
