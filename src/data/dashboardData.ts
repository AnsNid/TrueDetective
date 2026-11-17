export type TimeRangeKey = 'today' | '7d' | '30d' | 'year';

export interface PendingReviewItem {
  id: number;
  avatarChar: string;
  submitter: string;
  caseId: string;
  remainingTime: string;
}

export interface FunnelStep {
  label: string;
  count: number;
  percentage: string;
  bgColor: string;
  textColor: string;
  isCurrent?: boolean;
}

export interface OngoingCaseItem {
  caseId: string;
  title: string;
  progressCurrent: number;
  progressTotal: number;
  priority: '高' | '中' | '低';
  owner: string;
  conclusion: '误导' | '无法核查' | '疑似AI生成' | '无法判断' | '真实' | '虚假';
}

export interface ConclusionBarItem {
  label: string;
  value: number;
  color: string;
}

export interface SourceCredibilityAxis {
  label: string;
  value: number; // 0 to 100
}

export interface ImageAuthSegment {
  label: string;
  percentage: number;
  color: string;
}

export const TIME_RANGE_OPTIONS: { key: TimeRangeKey; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: '7d', label: '近 7 日' },
  { key: '30d', label: '近 30 日' },
  { key: 'year', label: '本年度' },
];

export const SYSTEM_STATUS_ITEMS = [
  { id: 'ark', label: 'Ark LLM 已启用' },
  { id: 'google', label: 'Google 联网搜索' },
  { id: 'reverse-img', label: '反向搜图' },
  { id: 'github-bed', label: 'GitHub 图床' },
];

export const PENDING_REVIEW_LIST: PendingReviewItem[] = [
  { id: 1, avatarChar: '王', submitter: '王思思', caseId: 'ZT-2026-0017', remainingTime: '2小时13分' },
  { id: 2, avatarChar: '李', submitter: '李明星', caseId: 'ZT-2026-0021', remainingTime: '5小时26分' },
  { id: 3, avatarChar: '陈', submitter: '陈雨', caseId: 'ZT-2026-0023', remainingTime: '11小时8分' },
  { id: 4, avatarChar: '赵', submitter: '张晓楠', caseId: 'ZT-2026-0025', remainingTime: '1天6小时' },
];

export const FUNNEL_STEPS: FunnelStep[] = [
  { label: '线索接收', count: 1284, percentage: '100%', bgColor: '#10B981', textColor: '#FFFFFF' },
  { label: '价值初筛', count: 612, percentage: '47.7%', bgColor: '#2563EB', textColor: '#FFFFFF' },
  { label: '主张拆解', count: 588, percentage: '45.8%', bgColor: '#3B76F6', textColor: '#FFFFFF' },
  { label: '多语种检索', count: 561, percentage: '43.7%', bgColor: '#4E86F7', textColor: '#FFFFFF' },
  { label: '出处追溯', count: 540, percentage: '42.1%', bgColor: '#6295F8', textColor: '#FFFFFF' },
  { label: '交叉验证', count: 512, percentage: '39.9%', bgColor: '#F59E0B', textColor: '#FFFFFF', isCurrent: true },
  { label: '信源评价', count: 498, percentage: '38.8%', bgColor: '#94A3B8', textColor: '#FFFFFF' },
  { label: '报告生成', count: 476, percentage: '37.1%', bgColor: '#AAB6C6', textColor: '#FFFFFF' },
  { label: '人工审核', count: 349, percentage: '27.2%', bgColor: '#C2CDD9', textColor: '#FFFFFF' },
];

export const SOURCE_CREDIBILITY_AXES: SourceCredibilityAxis[] = [
  { label: '时效性', value: 84 },
  { label: '专业性', value: 78 },
  { label: '涉华表述准确性', value: 66 },
  { label: '立场倾向', value: 88 },
  { label: '透明度', value: 75 },
  { label: '接近事件程度', value: 76 },
];

export const SOURCE_CREDIBILITY_TIERS = [
  { label: '高可信', percentage: 62, color: '#10B981', textClass: 'text-[#10B981]' },
  { label: '中可信', percentage: 27, color: '#2563EB', textClass: 'text-[#2563EB]' },
  { label: '低可信', percentage: 11, color: '#EF4444', textClass: 'text-[#EF4444]' },
];

export const CONCLUSION_DISTRIBUTION: ConclusionBarItem[] = [
  { label: '真实', value: 62, color: '#68B99A' },
  { label: '基本真实', value: 48, color: '#8FD1B8' },
  { label: '缺乏语境', value: 37, color: '#D8DEE9' },
  { label: '误导', value: 55, color: '#F4A27E' },
  { label: '基本错误', value: 41, color: '#F6B89E' },
  { label: '虚假', value: 39, color: '#F29B9B' },
  { label: '尚待核实', value: 44, color: '#CBD5E1' },
  { label: '无法核查', value: 20, color: '#E2E8F0' },
];

export const ONGOING_CASES: OngoingCaseItem[] = [
  {
    caseId: 'ZT-2026-0017',
    title: '国防部发言人吴谦就加拿大炒作“中国战机拦截加侦察机”答记者问',
    progressCurrent: 8,
    progressTotal: 9,
    priority: '中',
    owner: '王思思',
    conclusion: '误导',
  },
  {
    caseId: 'ZT-2026-0016',
    title: '文本核查：外媒称中国边境管控构成“系统性限制”',
    progressCurrent: 8,
    progressTotal: 9,
    priority: '中',
    owner: '李华',
    conclusion: '无法核查',
  },
  {
    caseId: 'ZT-2026-0014',
    title: 'BRICS 峰会领导人“自拍”图片溯源',
    progressCurrent: 8,
    progressTotal: 9,
    priority: '高',
    owner: '张明',
    conclusion: '疑似AI生成',
  },
  {
    caseId: 'ZT-2026-0013',
    title: '加沙的童年：现场影像真实性核查',
    progressCurrent: 8,
    progressTotal: 9,
    priority: '中',
    owner: '王芳',
    conclusion: '疑似AI生成',
  },
  {
    caseId: 'ZT-2026-0011',
    title: '广西洪灾无人机“空中吊人”救援视频核查',
    progressCurrent: 8,
    progressTotal: 9,
    priority: '高',
    owner: '赵强',
    conclusion: '无法判断',
  },
];

export const IMAGE_AUTH_SEGMENTS: ImageAuthSegment[] = [
  { label: '真实现场图', percentage: 41, color: '#10B981' },
  { label: '疑似AI生成', percentage: 37, color: '#2563EB' },
  { label: '疑似旧图新用', percentage: 23, color: '#F59E0B' },
];

// 24x7 Heatmap matrix (7 days x 24 hours), values 0..4 corresponding to the 5 blue shades in the legend
export const HEATMAP_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const HEATMAP_MATRIX: number[][] = [
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
  [0, 0, 0, 0, 1, 1, 2, 2, 3, 4, 4, 4, 3, 3, 4, 4, 3, 2, 2, 1, 1, 0, 0, 0], // 周一
  [0, 0, 0, 0, 1, 1, 2, 3, 3, 4, 4, 3, 3, 4, 4, 4, 3, 3, 2, 2, 1, 0, 0, 0], // 周二
  [0, 0, 0, 0, 1, 1, 2, 3, 4, 4, 4, 4, 3, 4, 4, 4, 4, 3, 2, 1, 1, 0, 0, 0], // 周三
  [0, 0, 0, 0, 1, 1, 2, 3, 4, 4, 4, 4, 3, 4, 4, 4, 3, 3, 2, 2, 1, 0, 0, 0], // 周四
  [0, 0, 0, 0, 1, 1, 2, 2, 3, 4, 4, 3, 3, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, 0], // 周五
  [0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 2, 2, 3, 2, 2, 1, 1, 1, 0, 0, 0, 0], // 周六
  [0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0], // 周日
];

export const HEATMAP_COLORS = [
  '#DCE6F7', // level 0: lightest blue
  '#B6CCF4', // level 1: light blue
  '#7CA5F2', // level 2: medium blue
  '#4A80F0', // level 3: bright blue
  '#2563EB', // level 4: primary deep blue
];

export interface TimeRangeMetrics {
  totalClues: string;
  growthRate: string;
  lastPeriodComparison: string;
  dailyAverage: string;
  verifiedCases: number;
  verifiedDelta: string;
  ongoingCount: number;
  ongoingDelta: string;
  closedCount: number;
  closedDelta: string;
  closeRate: string;
  closeRateDelta: string;
}

// 说明: 本文件中的 PENDING_REVIEW_LIST / FUNNEL_STEPS / SOURCE_CREDIBILITY_* /
// CONCLUSION_DISTRIBUTION / ONGOING_CASES / IMAGE_AUTH_SEGMENTS /
// HEATMAP_DAYS / HEATMAP_MATRIX 为历史演示数据,现仅作组件 prop 的类型锚
// (typeof 引用)与单元测试 fixture 使用;工作台 UI 已不将其作为兜底数据,
// 后端数据未就绪时一律显示 loading 骨架。
