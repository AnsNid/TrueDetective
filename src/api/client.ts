/**
 * 真探后端 API 客户端
 *
 * - 开发环境 base_uri: http://127.0.0.1:9602/api(detective 独立服务)
 * - 构建/生产 base_uri: /api(经网关反代)
 * - 鉴权: x-token: Bearer ${token},token 全局唯一存储于 localStorage `x-token`
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

export function getSavedToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    const fromQuery = new URLSearchParams(window.location.search).get(TOKEN_KEY);
    const fromHashQuery = window.location.hash.includes('?')
      ? new URLSearchParams(window.location.hash.split('?')[1]).get(TOKEN_KEY)
      : null;
    const urlToken = fromQuery || fromHashQuery;
    if (urlToken) {
      localStorage.setItem(TOKEN_KEY, urlToken);
      return urlToken;
    }
  } catch {
    // ignore parse errors
  }
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY) ||
    (document.cookie.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`))?.[1] || '')
  );
}

export function setSavedToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSavedToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
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
      return {
        code: 401,
        message: json?.message || '您的登录凭据已失效，请重新登录。',
        data: null as T,
      };
    }
    if (!json) {
      return { code: 500, message: `接口响应异常(${response.status})`, data: null as T };
    }
    if (json.code === 401) {
      clearSavedToken();
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
  roleLabel?: string;
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

export interface DashboardPayload {
  metrics: import('../data/dashboardData').TimeRangeMetrics;
  funnelSteps: import('../data/dashboardData').FunnelStep[];
  credibilityAxes: { label: string; value: number }[];
  credibilityTiers: { label: string; percentage: number; color: string }[];
  conclusionDistribution: { label: string; value: number; color: string }[];
  imageAuthSegments: { label: string; percentage: number; color: string }[];
  imageClueCount: number;
  weeklyTrends: { labels: string[]; clues: number[]; closed: number[] };
  heatmap: { days: string[]; matrix: number[][] };
  reviewChecklist: string[];
  ai: { llm: boolean; search: boolean };
  pendingReviews: import('../data/dashboardData').PendingReviewItem[];
  pendingCount: number;
  ongoingCases: import('../data/dashboardData').OngoingCaseItem[];
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
  conclusionBars: { label: string; val: number; color: string }[];
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
  role: '管理员' | '审核员' | '核查员';
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

  dashboard: (range: string) =>
    apiRequest<DashboardPayload>(`/dashboard?range=${encodeURIComponent(range)}`),

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

  evidence: () => apiRequest<{ list: any[]; summary: EvidenceSummary }>('/evidence'),

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

  users: () => apiRequest<{ list: MemberItemApi[]; role: string }>('/users'),

  createUser: (payload: Record<string, any>) =>
    apiRequest<{ member: MemberItemApi; username: string; initial_password: string }>('/createUser', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUser: (id: number, payload: Record<string, any>) =>
    apiRequest<MemberItemApi>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteUser: (id: number) =>
    apiRequest<{ id: number }>(`/users/${id}`, { method: 'DELETE' }),

  auditLogs: () => apiRequest<{ list: any[]; role: string }>('/auditLogs'),
};
