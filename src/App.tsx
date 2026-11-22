/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useState, useMemo, useEffect, useRef } from 'react';
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ScrollToTop } from './components/ScrollToTop';
import { LoginPage, AuthenticatedUser } from './components/LoginPage';
import { api, getSavedToken, setSavedToken, clearSavedToken, AUTH_EXPIRED_EVENT } from './api/client';
import type { TaskItemApi } from './api/client';
import { useApiData } from './api/hooks';
import type {
  DashboardMetricsPayload,
  DashboardOverviewPayload,
  DashboardChartsPayload,
} from './api/client';
import { hasPerm, Permission } from './auth/permissions';

// Route-level code splitting: each view loads on demand via its own chunk.
const WorkbenchView = lazy(() =>
  import('./components/views/WorkbenchView').then((m) => ({
    default: m.WorkbenchView,
  }))
);
const CluesView = lazy(() =>
  import('./components/views/CluesView').then((m) => ({ default: m.CluesView }))
);
const TasksView = lazy(() =>
  import('./components/views/TasksView').then((m) => ({ default: m.TasksView }))
);
const EvidenceView = lazy(() =>
  import('./components/views/EvidenceView').then((m) => ({
    default: m.EvidenceView,
  }))
);
const HistoryView = lazy(() =>
  import('./components/views/HistoryView').then((m) => ({
    default: m.HistoryView,
  }))
);
const KnowledgeView = lazy(() =>
  import('./components/views/KnowledgeView').then((m) => ({
    default: m.KnowledgeView,
  }))
);
const StatisticsView = lazy(() =>
  import('./components/views/StatisticsView').then((m) => ({
    default: m.StatisticsView,
  }))
);
const UsersView = lazy(() =>
  import('./components/views/UsersView').then((m) => ({
    default: m.UsersView,
  }))
);
const CaseDetailWorkbench = lazy(() =>
  import('./components/views/CaseDetailWorkbench').then((m) => ({
    default: m.CaseDetailWorkbench,
  }))
);
import { TimeRangeKey } from './data/dashboardData';
import {
  filterOngoingCases,
  filterPendingReviews,
} from './utils/dashboardLogic';

type LocationState = { from?: string } | null;

/** Placeholder shown while a lazily-loaded view chunk is fetching. */
function RouteFallback() {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-24 text-slate-400">
      <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-[#2563EB] animate-spin" />
      <span className="text-[12px]">加载中…</span>
    </div>
  );
}

/** 默认演示账号(与后端种子数据一致),供 ?autostart=1 快速进入 */
const DEMO_ACCOUNT = { username: 'zhangming@zhentan.org', password: 'Zt@2026Admin' };

export default function App() {
  // Router mode: hash by default (works on any static host without SPA fallback);
  // set VITE_ROUTER_MODE=history for clean URLs when the host supports it.
  const RouterImpl =
    import.meta.env.VITE_ROUTER_MODE === 'history' ? BrowserRouter : HashRouter;

  return (
    <RouterImpl>
      <ScrollToTop />
      <AppShell />
    </RouterImpl>
  );
}

function AppShell() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' && Boolean(getSavedToken());
  });
  const [authChecking, setAuthChecking] = useState<boolean>(isAuthenticated);
  // 身份加载失败(网络瞬断等,非 401/403): 保留登录态并提供重试,避免无限骨架
  const [authError, setAuthError] = useState<string | null>(null);
  const [authRetry, setAuthRetry] = useState(0);

  const [currentUser, setCurrentUser] = useState<AuthenticatedUser>({
    displayName: '加载中',
    roleLabel: '成员',
    avatarChar: '核',
    // permissions 为 undefined 表示身份尚未从 getUserInfo 加载完成,
    // 此时守卫先显示加载态,避免用空权限把总编误重定向到 /tasks
    role: undefined,
    roleSystem: undefined,
    permissions: undefined,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRangeKey>('today');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  // 401 全局广播携带的提示文案,回登录页时透出
  const [authExpiredMsg, setAuthExpiredMsg] = useState<string | null>(null);
  // 顶栏全局检索建议(防抖调任务接口,正式结果页在 /tasks)
  const [headerSuggestions, setHeaderSuggestions] = useState<TaskItemApi[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestSeq = useRef(0);

  const navigate = useNavigate();
  const location = useLocation();

  // 顶栏检索建议:输入防抖 300ms 后取前 6 条案件(竞态守卫,旧响应丢弃)
  useEffect(() => {
    const kw = searchQuery.trim();
    if (!kw) {
      setHeaderSuggestions([]);
      setSuggestLoading(false);
      return;
    }
    const t = setTimeout(() => {
      const seq = ++suggestSeq.current;
      setSuggestLoading(true);
      api
        .tasks({ tab: 'all', keyword: kw, page: 1, pageSize: 6 })
        .then((res) => {
          if (seq !== suggestSeq.current) return;
          setHeaderSuggestions(res.code === 200 && res.data ? res.data.list : []);
        })
        .finally(() => {
          if (seq === suggestSeq.current) setSuggestLoading(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // 任一接口返回 401 时统一清登录态回登录页(client.ts apiRequest 广播),
  // 避免用户停留在已失效会话的空态页面里继续操作
  useEffect(() => {
    const onAuthExpired = (e: Event) => {
      const message =
        (e as CustomEvent<{ message?: string }>).detail?.message ||
        '登录状态已失效,请重新登录';
      clearSavedToken();
      setIsAuthenticated(false);
      setAuthExpiredMsg(message);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
  }, []);

  // 工作台数据按区块拆分三路并行请求(KPI / 列表 / 图表),
  // 教学体系无工作台权限时不发起请求,直接置空由骨架占位
  const canDashboard = hasPerm(currentUser.permissions, 'dashboard.view');
  const emptyResolved = <T,>() =>
    Promise.resolve({ code: 200, message: 'success', data: null as unknown as T });
  const metricsQ = useApiData<DashboardMetricsPayload>(
    () => (canDashboard ? api.dashboardMetrics(activeTimeRange) : emptyResolved<DashboardMetricsPayload>()),
    [activeTimeRange, isAuthenticated, canDashboard]
  );
  const overviewQ = useApiData<DashboardOverviewPayload>(
    () => (canDashboard ? api.dashboardOverview() : emptyResolved<DashboardOverviewPayload>()),
    [isAuthenticated, canDashboard]
  );
  const chartsQ = useApiData<DashboardChartsPayload>(
    () => (canDashboard ? api.dashboardCharts() : emptyResolved<DashboardChartsPayload>()),
    [isAuthenticated, canDashboard]
  );
  const reloadDashboard = () => {
    metricsQ.reload();
    overviewQ.reload();
    chartsQ.reload();
  };

  // 启动时校验已存 token,并加载用户身份(角色/体系/权限以后端为准)
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setAuthChecking(true);
    setAuthError(null);
    api.getUserInfo().then((res) => {
      if (cancelled) return;
      setAuthChecking(false);
      if (res.code === 200 && res.data) {
        const nickname = res.data.nickname || res.data.username || '成员';
        setCurrentUser({
          displayName: nickname,
          roleLabel: res.data.roleLabel || '成员',
          avatarChar: nickname.charAt(0) || '核',
          role: res.data.role,
          roleSystem: res.data.roleSystem,
          permissions: res.data.permissions ?? [],
        });
      } else if (res.code === 401 || res.code === 403) {
        // 401 凭证失效 / 403 账号未接入或被停用:清理会话回登录页
        clearSavedToken();
        setIsAuthenticated(false);
      } else {
        // 其余错误(网络瞬断等)保留登录态,显示错误态等待手动重试
        setAuthError(res.message || '身份信息加载失败,请确认核查服务已启动');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authRetry]);

  // ?autostart=1 自动用演示账号登录(保持旧的免登录直达体验)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') !== '1') return;
    if (getSavedToken()) {
      setIsAuthenticated(true);
      return;
    }
    api.login(DEMO_ACCOUNT.username, DEMO_ACCOUNT.password).then((res) => {
      if (res.code === 200 && res.data?.token) {
        setSavedToken(res.data.token);
        setIsAuthenticated(true);
        if (res.data.user) {
          const nickname = res.data.user.nickname || res.data.user.username || '张明';
          setCurrentUser({
            displayName: nickname,
            roleLabel: res.data.user.roleLabel || '管理员',
            avatarChar: nickname.charAt(0) || '张',
          });
        }
      }
    });
  }, []);

  // 工作台指标只认后端数据,无本地默认兜底;未就绪时工作台显示 loading 骨架
  const currentMetrics = metricsQ.data?.metrics ?? null;

  // 登录后落地页: 有工作台权限进工作台,教学体系落核查任务列表
  const landing = useMemo(
    () => (hasPerm(currentUser.permissions, 'dashboard.view') ? '/workbench' : '/tasks'),
    [currentUser.permissions]
  );

  /** 路由守卫:身份加载失败显示错误态+重试;权限未加载完成先显示加载态,无对应权限时重定向到落地页(后端同权限拦截为最终防线) */
  const guard = (perm: Permission, element: React.ReactNode) => {
    if (authError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <span className="text-[13px] text-amber-700">⚠ {authError}</span>
          <button
            type="button"
            onClick={() => setAuthRetry((n) => n + 1)}
            className="px-4 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-[12px] font-medium cursor-pointer"
          >
            重新加载
          </button>
        </div>
      );
    }
    if (currentUser.permissions === undefined) {
      return <RouteFallback />;
    }
    return hasPerm(currentUser.permissions, perm) ? (
      element
    ) : (
      <Navigate to={landing} replace />
    );
  };

  const filteredOngoingCases = useMemo(
    () => filterOngoingCases(overviewQ.data?.ongoingCases ?? [], searchQuery),
    [overviewQ.data, searchQuery]
  );

  const filteredPendingReviews = useMemo(
    () => filterPendingReviews(overviewQ.data?.pendingReviews ?? [], searchQuery),
    [overviewQ.data, searchQuery]
  );

  const handleTriggerBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => {
      setBannerMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  /** Jump into a case workbench, remembering the list page we came from. */
  const openCase = (caseId: string) => {
    navigate(`/cases/${caseId}`, { state: { from: location.pathname } });
  };

  /** "返回列表": go back to the list we came from (fallback: /tasks). */
  const closeCase = () => {
    const from = (location.state as LocationState)?.from;
    navigate(from ?? '/tasks');
  };

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              sessionMessage={authExpiredMsg}
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                setIsAuthenticated(true);
                setAuthExpiredMsg(null);
              }}
            />
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
              state={{ from: location.pathname }}
            />
          }
        />
      </Routes>
    );
  }

  if (authChecking) {
    return <RouteFallback />;
  }

  return (
    <div className="min-h-screen flex bg-[#F4F6F9] text-[#0F172A] overflow-x-clip">
      {/* Left Dark Sidebar (Fixed on lg+, Slide-over Drawer on <lg) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        permissions={currentUser.permissions}
      />

      {/* Right Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchSuggestions={headerSuggestions}
          suggestLoading={suggestLoading}
          onSearchSubmit={() => navigate('/tasks')}
          onOpenCase={openCase}
          showTimeRange={location.pathname === '/workbench'}
          activeTimeRange={activeTimeRange}
          onTimeRangeChange={setActiveTimeRange}
          onOpenNotifications={() => {
            const pending = overviewQ.data?.pendingCount ?? 0;
            const latest = overviewQ.data?.pendingReviews?.[0];
            handleTriggerBanner(
              pending > 0
                ? `当前有 ${pending} 条待人工审核案件提醒${latest ? `，最近一条来自 ${latest.submitter} (${latest.caseId})` : ''}`
                : '当前没有待人工审核案件'
            );
          }}
          onLogoutClick={() => {
            clearSavedToken();
            setIsAuthenticated(false);
            setBannerMessage(null);
          }}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          currentUser={currentUser}
        />

        {/* Optional Transient Notification Toast */}
        {bannerMessage ? (
          <div
            role="status"
            className="mx-3.5 sm:mx-5 mt-2 px-3.5 py-2 rounded-lg bg-blue-50 border border-blue-200 text-[12px] text-[#2563EB] flex items-center justify-between"
          >
            <span>{bannerMessage}</span>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="text-xs font-medium underline ml-4 cursor-pointer shrink-0"
            >
              知道了
            </button>
          </div>
        ) : null}

        {/* Main Content Viewport - Full fluid width without max-w constraint */}
        <main className="flex-1 px-3.5 sm:px-5 py-3 space-y-3 w-full">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            <Route
              path="/"
              element={
                currentUser.permissions === undefined ? (
                  <RouteFallback />
                ) : (
                  <Navigate to={landing} replace />
                )
              }
            />

            {/* Already logged in: /login just lands back on the app (where we came from, if known).
                权限未加载完成前先显示加载态,避免误跳到无权限页面 */}
            <Route
              path="/login"
              element={
                currentUser.permissions === undefined ? (
                  <RouteFallback />
                ) : (
                  <Navigate
                    to={(location.state as LocationState)?.from ?? landing}
                    replace
                  />
                )
              }
            />

            {/* Workbench View (工作室体系) */}
            <Route
              path="/workbench"
              element={guard('dashboard.view',
                <WorkbenchView
                  metrics={currentMetrics}
                  pendingReviews={filteredPendingReviews}
                  onSelectReview={(item) => openCase(item.caseId)}
                  onViewAllReviews={() => navigate('/tasks')}
                  ongoingCases={filteredOngoingCases}
                  onSelectCase={(item) => openCase(item.caseId)}
                  onViewAllCases={() => navigate('/tasks')}
                  currentUser={currentUser}
                  overview={overviewQ.data}
                  charts={chartsQ.data}
                  sectionLoading={metricsQ.loading || overviewQ.loading || chartsQ.loading}
                  sectionErrors={[
                    metricsQ.error,
                    overviewQ.error,
                    chartsQ.error,
                  ].filter((e): e is string => Boolean(e))}
                  onReloadDashboard={reloadDashboard}
                />
              )}
            />

            {/* Clues View (线索中心 · 新建任务) */}
            <Route
              path="/clues"
              element={guard('clues.create',
                <CluesView
                  currentUser={currentUser}
                  onSuccessSubmit={(newCaseId, caseTitle) => {
                    handleTriggerBanner(`线索已创建并生成任务: "${caseTitle}"`);
                    openCase(newCaseId);
                  }}
                />
              )}
            />

            {/* Tasks View (核查任务) */}
            <Route
              path="/tasks"
              element={guard('tasks.view',
                <TasksView
                  onOpenNewClue={() => navigate('/clues')}
                  onSelectTask={(task) => openCase(task.id)}
                  currentUser={currentUser}
                  searchInitial={searchQuery}
                />
              )}
            />

            {/* Evidence View (证据库,工作室体系) */}
            <Route
              path="/evidence"
              element={guard('evidence.view',
                <EvidenceView onSelectCase={openCase} />
              )}
            />

            {/* History Cases View (历史案例 · 已核查的案例) */}
            <Route
              path="/history"
              element={guard('history.view',
                <HistoryView
                  onSelectCaseDetail={openCase}
                  currentUser={currentUser}
                />
              )}
            />

            {/* Knowledge Base View (知识库,工作室体系) */}
            <Route
              path="/knowledge"
              element={guard('knowledge.view',
                <KnowledgeView currentUser={currentUser} />
              )}
            />

            {/* Data Statistics View (数据统计,工作室体系 · 无成员权限) */}
            <Route
              path="/statistics"
              element={guard('statistics.view', <StatisticsView />)}
            />

            {/* User Management View (用户管理,总编/负责人) */}
            <Route
              path="/users"
              element={guard('users.manage', <UsersView currentUser={currentUser} />)}
            />

            {/* Case Detail Workbench, addressable as /cases/:caseId */}
            <Route
              path="/cases/:caseId"
              element={guard('case.view',
                <CaseDetailRoute
                  currentUser={currentUser}
                  onBack={closeCase}
                  onDeleteCase={(id) =>
                    handleTriggerBanner(`案件 ${id} 已成功删除`)
                  }
                  onUpdateCaseStatus={(id, status, conclusion) => {
                    handleTriggerBanner(
                      `案件 ${id} 状态已更新为：${status} (${conclusion})`
                    );
                    reloadDashboard();
                  }}
                />
              )}
            />

            {/* Unknown paths fall back to the landing page */}
            <Route path="*" element={<Navigate to={landing} replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

interface CaseDetailRouteProps {
  currentUser: AuthenticatedUser;
  onBack: () => void;
  onDeleteCase?: (caseId: string) => void;
  onUpdateCaseStatus?: (
    caseId: string,
    status: string,
    conclusion: string
  ) => void;
}

/** Reads :caseId from the URL and renders the case detail workbench. */
function CaseDetailRoute({
  currentUser,
  onBack,
  onDeleteCase,
  onUpdateCaseStatus,
}: CaseDetailRouteProps) {
  const { caseId } = useParams<{ caseId: string }>();

  if (!caseId) {
    return <Navigate to="/tasks" replace />;
  }

  return (
    <CaseDetailWorkbench
      caseId={caseId}
      currentUser={currentUser}
      onBack={onBack}
      onDeleteCase={onDeleteCase}
      onUpdateCaseStatus={onUpdateCaseStatus}
    />
  );
}
