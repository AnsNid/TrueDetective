/**
 * 海外涉华信息智能核查平台后端 API 客户端
 *
 * - 开发环境 base_uri: http://127.0.0.1:9602/api(detective 独立服务)
 * - 构建/生产 base_uri: /api(经网关反代)
 * - 鉴权: x-token: Bearer ${token},token 由本地/会话存储管理,URL token 仅临时导入
 * - 信封: { code, message, data },200 成功 / 201 业务失败 / 401 凭证失效 / 403 无权限
 */

const isProd = Boolean(import.meta.env?.PROD);

const configuredBase = (import.meta.env?.VITE_API_BASE as string | undefined)?.trim();

export const BASE_URI =
  configuredBase && configuredBase.length > 0
    ? configuredBase.replace(/\/$/, '')
    : isProd
      ? '/api'
      : 'http://127.0.0.1:9602/api';

export const TOKEN_KEY = 'x-token';

function scrubTokenFromUrl() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete(TOKEN_KEY);
    if (url.hash.includes('?')) {
      const hashPath = url.hash.slice(1);
      const [path, query = ''] = hashPath.split('?');
      const params = new URLSearchParams(query);
      params.delete(TOKEN_KEY);
      const cleanQuery = params.toString();
      url.hash = `${path}${cleanQuery ? `?${cleanQuery}` : ''}`;
    }
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // 历史 API 不可用时不影响本次认证
  }
}

export function getSavedToken(): string {
  if (typeof window === 'undefined') return '';
  const urlToken = (() => {
    try {
      const fromQuery = new URLSearchParams(window.location.search).get(TOKEN_KEY);
      const fromHashQuery = window.location.hash.includes('?')
        ? new URLSearchParams(window.location.hash.split('?')[1]).get(TOKEN_KEY)
        : null;
      return fromQuery || fromHashQuery || '';
    } catch {
      return '';
    }
  })();
  if (urlToken) {
    scrubTokenFromUrl();
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
    sessionStorage.setItem(TOKEN_KEY, urlToken);
    return urlToken;
  }
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY) ||
    (document.cookie.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`))?.[1] || '')
  );
}

export function setSavedToken(token: string, remember = true) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  // 服务端 Set-Cookie 仅作为兼容来源,前端会话统一由所选存储管理
  document.cookie = `${TOKEN_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearSavedToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
  scrubTokenFromUrl();
}

/** 401 凭证失效的全局广播事件(App 监听后统一登出回登录页) */
export const AUTH_EXPIRED_EVENT = 'td:auth-expired';

function notifyAuthExpired(message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: { message } }));
}

export interface ApiEnvelope<T = any> {
  code: number;
  message: string;
  data: T;
}

/** 全局请求函数,统一处理信封与 401 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  const token = getSavedToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('x-token', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${BASE_URI}${endpoint}`, { ...options, headers });
    const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

    if (response.status === 401) {
      clearSavedToken();
      const message = json?.message || '您的登录凭据已失效，请重新登录。';
      notifyAuthExpired(message);
      return {
        code: 401,
        message,
        data: null as T,
      };
    }
    if (!json) {
      return { code: 500, message: `接口响应异常(${response.status})`, data: null as T };
    }
    if (json.code === 401) {
      clearSavedToken();
      notifyAuthExpired(json.message || '您的登录凭据已失效，请重新登录。');
    }
    return json;
  } catch (error) {
    console.error(`API Request to ${endpoint} failed:`, error);
    return {
      code: 201,
      message: `网络连接错误,无法连接核查服务(${BASE_URI}),请确认后端已启动`,
      data: null as T,
    };
  }
}

/* ============ 数据类型(与后端契约对应) ============ */

export interface BackendUser {
  uid: number;
  username: string;
  nickname: string;
  /** 角色代码(super_admin/studio_lead/minister/member/teacher/student) */
  role?: string;
  roleLabel?: string;
  /** 角色体系: studio=工作室 / teaching=教学 */
  roleSystem?: 'studio' | 'teaching';
  systemLabel?: string;
  mobile?: string;
  email?: string;
  groupid?: number;
  avatar?: string;
  permissions?: string[];
}

export interface SiteConfig {
  site_name: string;
  site_slogan: string;
  stats?: { totalClues: number; totalCases: number; closedCases: number; closeRate: number };
  ai?: { llm: boolean; search: boolean; reverseImage: boolean; githubBed: boolean };
  stages?: { num: number; name: string }[];
}

export type StageMethod = 'llm' | 'search' | 'rule' | 'template' | 'skip' | 'unavailable' | 'pending' | 'review';

/* 工作台按区块拆分的三个并行接口载荷(原单一 /dashboard 已移除) */

/** KPI 指标区(随时间区间变化) */
export interface DashboardMetricsPayload {
  metrics: import('../data/dashboardData').TimeRangeMetrics;
}

/** 列表区:待人工审核 + 进行中案件 */
export interface DashboardOverviewPayload {
  pendingReviews: import('../data/dashboardData').PendingReviewItem[];
  pendingCount: number;
  ongoingCases: import('../data/dashboardData').OngoingCaseItem[];
}

/** 图表区:漏斗/信源雷达/结论分布/图片判定/周趋势/热力图 */
export interface DashboardChartsPayload {
  funnelSteps: import('../data/dashboardData').FunnelStep[];
  credibilityAxes: { label: string; value: number }[];
  credibilityTiers: { label: string; percentage: number; color: string }[];
  conclusionDistribution: { label: string; value: number; color: string }[];
  imageAuthSegments: { label: string; percentage: number; color: string }[];
  imageClueCount: number;
  weeklyTrends: { labels: string[]; clues: number[]; closed: number[] };
  heatmap: { days: string[]; matrix: number[][] };
}

export interface TaskItemApi {
  id: string;
  title: string;
  stageProgress: string;
  stageProgressNum: number;
  priority: '高' | '中' | '低';
  assignee: string;
  assigneeInitial: string;
  conclusion: string;
  status: '报告生成' | '已结案' | '进行中';
  createdAt: string;
  /** 所属体系: studio=工作室 / teaching=教学(总编混排视图区分) */
  system?: 'studio' | 'teaching';
}

export interface TasksPayload {
  list: TaskItemApi[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EvidenceSummary {
  total: number;
  caseCount: number;
  relations: Record<string, number>;
  sourceTypes: Record<string, number>;
  credibility: Record<string, number>;
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

export interface StatisticsPayload {
  overview: {
    totalCases: number;
    ongoing: number;
    closed: number;
    closeRate: number;
    totalEvidence: number;
    dateFrom: string;
    dateTo: string;
    concluded: number;
  };
  conclusionBars: { label: string; value: number; color: string }[];
  funnel: { name: string; count: number; w: string }[];
  weeklyTrends: { labels: string[]; clues: number[]; closed: number[] };
  memberOutput: {
    name: string;
    initial: string;
    submit: number;
    closed: number;
    rate: string;
    efficiency: string;
  }[];
  platforms: { platform: string; count: number }[];
  contentTypeBreakdown: { text: number; image: number; videoAudio: number };
}

export interface HistoryItemApi {
  id: string;
  conclusion: string;
  title: string;
  summary: string;
  evidenceCount: number;
  reviewRounds: number;
  confidence: string;
  closedDate: string;
  assignee: string;
  durationDays: number | null;
  deposited: boolean;
}

export interface KnowledgeItemApi {
  id: number;
  category: string;
  title: string;
  citations: number;
  content: string;
  keyRule: string;
  updatedDate: string;
  caseNo: string;
}

export interface MemberItemApi {
  id: number;
  uid: number;
  name: string;
  title: string;
  handle: string;
  /** 角色代码(super_admin/studio_lead/minister/member/teacher/student) */
  role: string;
  roleSystem: 'studio' | 'teaching';
  roleLabel: string;
  systemLabel: string;
  department: string;
  email: string;
  status: '启用' | '停用';
  lastActive: string;
  avatarChar: string;
  load?: number;
  hasAccount?: boolean;
}

/* ============ 接口列表 ============ */

export const api = {
  getConfig: () => apiRequest<SiteConfig>('/getConfig'),

  login: (username: string, password: string) =>
    apiRequest<{ token: string; user: BackendUser }>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getUserInfo: () => apiRequest<BackendUser>('/getUserInfo'),

  /** 发送密码找回验证码(工作室邮箱账号,免鉴权) */
  sendResetCode: (email: string) =>
    apiRequest<{ email: string }>('/sendResetCode', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** 邮箱验证码重置密码(免鉴权) */
  resetPassword: (email: string, code: string, password: string) =>
    apiRequest<{ email: string }>('/resetPassword', {
      method: 'POST',
      body: JSON.stringify({ email, code, password }),
    }),

  /** 修改自己的登录密码(验旧改新) */
  changePassword: (oldPassword: string, password: string) =>
    apiRequest<{ uid: number }>('/changePassword', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, password }),
    }),

  /** 管理员重置成员密码(留空随机,明文仅本次返回) */
  resetUserPassword: (id: number, password?: string) =>
    apiRequest<{ id: number; name: string; initial_password: string }>(
      `/users/${id}/resetPassword`,
      {
        method: 'POST',
        body: JSON.stringify(password ? { password } : {}),
      }
    ),

  dashboardMetrics: (range: string) =>
    apiRequest<DashboardMetricsPayload>(
      `/dashboardMetrics?range=${encodeURIComponent(range)}`
    ),

  dashboardOverview: () =>
    apiRequest<DashboardOverviewPayload>('/dashboardOverview'),

  dashboardCharts: () => apiRequest<DashboardChartsPayload>('/dashboardCharts'),

  statistics: () => apiRequest<StatisticsPayload>('/statistics'),

  tasks: (params?: { tab?: string; keyword?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.tab && params.tab !== 'all') q.set('tab', params.tab);
    if (params?.keyword) q.set('keyword', params.keyword);
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    const qs = q.toString();
    return apiRequest<TasksPayload>(`/tasks${qs ? `?${qs}` : ''}`);
  },

  createClue: (payload: Record<string, any>) =>
    apiRequest<{ caseNo: string; clueNo: string; title: string; stage: number; stageName: string }>(
      '/createClue',
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  translate: (text: string) =>
    apiRequest<{ text: string; method: string }>('/translateClue', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  clues: (limit = 20) => apiRequest<{ list: any[] }>(`/clues?limit=${limit}`),

  caseDetail: (caseNo: string) => apiRequest<any>(`/cases/${encodeURIComponent(caseNo)}`),

  runPipeline: (caseNo: string, step: number) =>
    apiRequest<{ executed: { step: number; name: string; detail: string; method: string }[]; detail: any }>(
      `/cases/${encodeURIComponent(caseNo)}/pipeline`,
      { method: 'POST', body: JSON.stringify({ step }) }
    ),

  submitReview: (caseNo: string, payload: Record<string, any>) =>
    apiRequest<{ detail: any }>(`/cases/${encodeURIComponent(caseNo)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** 编辑核查报告(AI 生成文本人工修改;驳回修改中或未进入审核时可编辑) */
  updateReport: (caseNo: string, payload: Record<string, any>) =>
    apiRequest<{ detail: any }>(`/cases/${encodeURIComponent(caseNo)}/report`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  /** 报告修改完成后重新提交人工审核 */
  submitReport: (caseNo: string) =>
    apiRequest<{ detail: any }>(`/cases/${encodeURIComponent(caseNo)}/submitReport`, {
      method: 'POST',
    }),

  /** 导出核查报告文件(pdf/docx),带鉴权头下载 blob 并触发保存 */
  exportReport: async (caseNo: string, format: 'pdf' | 'docx'): Promise<{ ok: boolean; message: string }> => {
    const token = getSavedToken();
    const headers: Record<string, string> = {};
    if (token) headers['x-token'] = `Bearer ${token}`;
    try {
      const res = await fetch(
        `${BASE_URI}/cases/${encodeURIComponent(caseNo)}/export?format=${format}`,
        { headers }
      );
      if (res.status === 401) {
        clearSavedToken();
        notifyAuthExpired('登录状态已失效，请重新登录。');
        return { ok: false, message: '登录状态已失效，请重新登录。' };
      }
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as ApiEnvelope<unknown> | null;
        return { ok: false, message: json?.message || `导出失败(${res.status})` };
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${caseNo}-核查报告.${format}`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      return { ok: true, message: `已导出${format === 'pdf' ? ' PDF' : ' Word'}版核查报告` };
    } catch {
      return { ok: false, message: '网络连接失败，请稍后重试' };
    }
  },

  depositCase: (caseNo: string) =>
    apiRequest<{ id: number; caseNo: string }>(`/cases/${encodeURIComponent(caseNo)}/deposit`, {
      method: 'POST',
    }),

  deleteCase: (caseNo: string) =>
    apiRequest<{ caseNo: string }>(`/cases/${encodeURIComponent(caseNo)}`, { method: 'DELETE' }),

  batchDeleteCases: (caseNos: string[]) =>
    apiRequest<{ deleted: number }>('/batchDeleteCases', {
      method: 'POST',
      body: JSON.stringify({ caseNos }),
    }),

  evidence: () => apiRequest<{ list: EvidenceItem[]; summary: EvidenceSummary; total?: number; truncated?: boolean }>('/evidence'),

  history: () => apiRequest<{ list: HistoryItemApi[] }>('/history'),

  knowledge: () => apiRequest<{ list: KnowledgeItemApi[]; role: string }>('/knowledge'),

  createKnowledge: (payload: Record<string, any>) =>
    apiRequest<{ id: number }>('/createKnowledge', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateKnowledge: (id: number, payload: Record<string, any>) =>
    apiRequest<{ id: number }>(`/knowledge/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteKnowledge: (id: number) =>
    apiRequest<{ id: number }>(`/knowledge/${id}`, { method: 'DELETE' }),

  users: (system?: 'studio' | 'teaching') =>
    apiRequest<{ list: MemberItemApi[]; role: string; permissions?: string[] }>(
      `/users${system ? `?system=${system}` : ''}`
    ),

  createUser: (payload: Record<string, any>) =>
    apiRequest<{ member: MemberItemApi; username: string; initial_password: string }>('/createUser', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** 教学体系自助注册(学号/工号 + 姓名 + 密码 + 邮箱验证码) */
  teachingRegister: (
    studentNo: string,
    name: string,
    password: string,
    email: string,
    code: string
  ) =>
    apiRequest<{ username: string; role: string; roleLabel: string; roleSystem: string }>(
      '/teachingRegister',
      {
        method: 'POST',
        body: JSON.stringify({ studentNo, name, password, email, code }),
      }
    ),

  /** 发送学生注册验证码(邮箱须未被注册) */
  sendRegisterCode: (email: string) =>
    apiRequest<{ email: string }>('/sendRegisterCode', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** 批量导入学生(学号+姓名,随机初始密码仅本次返回) */
  importStudents: (students: Array<{ no: string; name: string }> | string) =>
    apiRequest<{
      created: { no: string; name: string; username: string; password: string }[];
      skipped: { no: string; name: string; reason: string }[];
    }>('/importStudents', {
      method: 'POST',
      body: JSON.stringify({ students }),
    }),

  updateUser: (id: number, payload: Record<string, any>) =>
    apiRequest<MemberItemApi>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteUser: (id: number) =>
    apiRequest<{ id: number }>(`/users/${id}`, { method: 'DELETE' }),

  auditLogs: () => apiRequest<{ list: any[]; role: string }>('/auditLogs'),
};
