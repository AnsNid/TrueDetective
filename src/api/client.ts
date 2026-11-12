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
  // 1. URL query/hash 透传 token
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
  // 2. 本地存储 / 会话存储 / Cookie
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

    // HTTP 层 401:凭证失效,清理本地登录态
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

export interface DashboardPayload {
  metrics: import('../data/dashboardData').TimeRangeMetrics;
  funnelSteps: import('../data/dashboardData').FunnelStep[];
  credibilityAxes: { label: string; value: number }[];
  credibilityTiers: { label: string; percentage: number; color: string }[];
  conclusionDistribution: { label: string; value: number; color: string }[];
  imageAuthSegments: { label: string; percentage: number; color: string }[];
  weeklyTrends: { labels: string[]; clues: number[]; closed: number[] };
  heatmap: { days: string[]; matrix: number[][] };
  pendingReviews: import('../data/dashboardData').PendingReviewItem[];
  ongoingCases: import('../data/dashboardData').OngoingCaseItem[];
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

/* ============ 接口列表 ============ */

export const api = {
  getConfig: () => apiRequest('/getConfig'),

  login: (username: string, password: string) =>
    apiRequest<{ token: string; user: BackendUser }>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getUserInfo: () => apiRequest<BackendUser>('/getUserInfo'),

  dashboard: (range: string) =>
    apiRequest<DashboardPayload>(`/dashboard?range=${encodeURIComponent(range)}`),

  statistics: () => apiRequest<StatisticsPayload>('/statistics'),

  tasks: () => apiRequest<{ list: any[]; total: number }>('/tasks'),

  createClue: (payload: Record<string, any>) =>
    apiRequest<{ caseNo: string; clueNo: string; title: string; stage: number; stageName: string }>(
      '/createClue',
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  caseDetail: (caseNo: string) => apiRequest<any>(`/cases/${encodeURIComponent(caseNo)}`),

  runPipeline: (caseNo: string, step: number) =>
    apiRequest<{ executed: { step: number; name: string; detail: string }[]; detail: any }>(
      `/cases/${encodeURIComponent(caseNo)}/pipeline`,
      { method: 'POST', body: JSON.stringify({ step }) }
    ),

  submitReview: (caseNo: string, payload: Record<string, any>) =>
    apiRequest<{ detail: any }>(`/cases/${encodeURIComponent(caseNo)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteCase: (caseNo: string) =>
    apiRequest<{ caseNo: string }>(`/cases/${encodeURIComponent(caseNo)}`, { method: 'DELETE' }),

  evidence: () => apiRequest<{ list: any[] }>('/evidence'),

  history: () => apiRequest<{ list: any[] }>('/history'),

  knowledge: () => apiRequest<{ list: any[] }>('/knowledge'),

  users: () => apiRequest<{ list: any[] }>('/users'),

  createUser: (payload: Record<string, any>) =>
    apiRequest<any>('/createUser', { method: 'POST', body: JSON.stringify(payload) }),

  updateUser: (id: number, payload: Record<string, any>) =>
    apiRequest<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  auditLogs: () => apiRequest<{ list: any[] }>('/auditLogs'),
};
