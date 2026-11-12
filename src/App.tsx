/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useState, useMemo } from 'react';
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
import {
  METRICS_BY_TIME_RANGE,
  ONGOING_CASES,
  PENDING_REVIEW_LIST,
  TimeRangeKey,
} from './data/dashboardData';
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
  // Support ?autostart=1 to skip the login screen if specified
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return true;
    }
    return false;
  });

  const [currentUser, setCurrentUser] = useState<AuthenticatedUser>({
    displayName: '张明',
    roleLabel: '管理员',
    avatarChar: '张',
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRangeKey>('today');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const currentMetrics = METRICS_BY_TIME_RANGE[activeTimeRange];

  const filteredOngoingCases = useMemo(
    () => filterOngoingCases(ONGOING_CASES, searchQuery),
    [searchQuery]
  );

  const filteredPendingReviews = useMemo(
    () => filterPendingReviews(PENDING_REVIEW_LIST, searchQuery),
    [searchQuery]
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
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                setIsAuthenticated(true);
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

  return (
    <div className="min-h-screen flex bg-[#F4F6F9] text-[#0F172A] overflow-x-clip">
      {/* Left Dark Sidebar (Fixed on lg+, Slide-over Drawer on <lg) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Right Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTimeRange={activeTimeRange}
          onTimeRangeChange={setActiveTimeRange}
          onOpenNotifications={() =>
            handleTriggerBanner('当前有 12 条待人工审核案件提醒，最近一条来自王思思 (ZT-2026-0017)')
          }
          onLogoutClick={() => {
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
            <Route path="/" element={<Navigate to="/workbench" replace />} />

            {/* Already logged in: /login just lands back on the app (where we came from, if known) */}
            <Route
              path="/login"
              element={
                <Navigate
                  to={(location.state as LocationState)?.from ?? '/workbench'}
                  replace
                />
              }
            />

            {/* Workbench View */}
            <Route
              path="/workbench"
              element={
                <WorkbenchView
                  metrics={currentMetrics}
                  pendingReviews={filteredPendingReviews}
                  onSelectReview={(item) => openCase(item.caseId)}
                  onViewAllReviews={() => navigate('/tasks')}
                  ongoingCases={filteredOngoingCases}
                  onSelectCase={(item) => openCase(item.caseId)}
                  onViewAllCases={() => navigate('/tasks')}
                  currentUser={currentUser}
                />
              }
            />

            {/* Clues View (线索中心 · 新建线索) */}
            <Route
              path="/clues"
              element={
                <CluesView
                  onSuccessSubmit={(newCaseId, caseTitle) => {
                    handleTriggerBanner(`线索已创建并生成任务: "${caseTitle}"`);
                    openCase(newCaseId);
                  }}
                />
              }
            />

            {/* Tasks View (核查任务) */}
            <Route
              path="/tasks"
              element={
                <TasksView
                  onOpenNewClue={() => navigate('/clues')}
                  onSelectTask={(task) => openCase(task.id)}
                />
              }
            />

            {/* Evidence View (证据库) */}
            <Route
              path="/evidence"
              element={<EvidenceView onSelectCase={openCase} />}
            />

            {/* History Cases View (历史案例) */}
            <Route
              path="/history"
              element={<HistoryView onSelectCaseDetail={openCase} />}
            />

            {/* Knowledge Base View (知识库) */}
            <Route path="/knowledge" element={<KnowledgeView />} />

            {/* Data Statistics View (数据统计) */}
            <Route path="/statistics" element={<StatisticsView />} />

            {/* User Management View (用户管理) */}
            <Route path="/users" element={<UsersView />} />

            {/* Case Detail Workbench, addressable as /cases/:caseId */}
            <Route
              path="/cases/:caseId"
              element={
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
                  }}
                />
              }
            />

            {/* Unknown paths fall back to the workbench */}
            <Route path="*" element={<Navigate to="/workbench" replace />} />
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
