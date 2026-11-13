import { Row1Overview } from '../Row1Overview';
import { Row2FunnelAndCredibility } from '../Row2FunnelAndCredibility';
import { Row3CasesAndCharts } from '../Row3CasesAndCharts';
import { Row4TrendsAndHeatmap } from '../Row4TrendsAndHeatmap';
import { AuthenticatedUser } from '../LoginPage';
import { LoadErrorBar } from '../../api/hooks';
import type { DashboardPayload } from '../../api/client';
import {
  OngoingCaseItem,
  PendingReviewItem,
  TimeRangeMetrics,
} from '../../data/dashboardData';

interface WorkbenchViewProps {
  metrics: TimeRangeMetrics;
  pendingReviews: PendingReviewItem[];
  onSelectReview: (item: PendingReviewItem) => void;
  onViewAllReviews: () => void;
  ongoingCases: OngoingCaseItem[];
  onSelectCase: (item: OngoingCaseItem) => void;
  onViewAllCases: () => void;
  currentUser: AuthenticatedUser;
  dashboard: DashboardPayload | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
  onReloadDashboard: () => void;
}

export function WorkbenchView({
  metrics,
  pendingReviews,
  onSelectReview,
  onViewAllReviews,
  ongoingCases,
  onSelectCase,
  onViewAllCases,
  currentUser,
  dashboard,
  dashboardLoading,
  dashboardError,
  onReloadDashboard,
}: WorkbenchViewProps) {
  const now = new Date();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}年${pad(now.getMonth() + 1)}月${pad(now.getDate())}日 ${pad(now.getHours())}:${pad(now.getMinutes())} ${weekdays[now.getDay()]}`;

  return (
    <>
      {/* Page Title & Timestamp Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
            工作台
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            快速发起核查，追踪进行中的任务
          </p>
        </div>

        <div className="text-right text-[10.5px] text-slate-400 leading-snug tabular-nums ml-auto">
          <div>{timestamp}</div>
          <div>
            真探工作室 · {currentUser.displayName}
          </div>
        </div>
      </div>

      {/* 后端数据加载异常提示(保留页面其余区块) */}
      {dashboardError && !dashboardLoading ? (
        <LoadErrorBar message={`工作台数据加载失败:${dashboardError}`} onRetry={onReloadDashboard} />
      ) : null}

      {/* Row 1: Cumulative Clues + 2x2 KPIs + Pending Manual Reviews */}
      <Row1Overview
        metrics={metrics}
        pendingReviews={pendingReviews}
        onSelectReview={onSelectReview}
        onViewAllReviews={onViewAllReviews}
        weeklyClues={dashboard?.weeklyTrends?.clues}
        weeklyLabels={dashboard?.weeklyTrends?.labels}
      />

      {/* Row 2: 9-Step Funnel + Source Credibility Radar */}
      <Row2FunnelAndCredibility
        funnelSteps={dashboard?.funnelSteps}
        credibilityAxes={dashboard?.credibilityAxes}
        credibilityTiers={dashboard?.credibilityTiers}
      />

      {/* Row 3: Conclusion Distribution + Ongoing Cases + Image Authenticity */}
      <Row3CasesAndCharts
        ongoingCases={ongoingCases}
        onSelectCase={onSelectCase}
        onViewAllCases={onViewAllCases}
        conclusionDistribution={dashboard?.conclusionDistribution}
        imageAuthSegments={dashboard?.imageAuthSegments}
        imageClueCount={dashboard?.imageClueCount}
      />

      {/* Row 4: 12-Week Trend Chart + 24x7 Submission Heatmap */}
      <Row4TrendsAndHeatmap
        weeklyTrends={dashboard?.weeklyTrends}
        heatmapDays={dashboard?.heatmap?.days}
        heatmapMatrix={dashboard?.heatmap?.matrix}
      />
    </>
  );
}
