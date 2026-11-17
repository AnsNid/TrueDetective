import { Row1Overview } from '../Row1Overview';
import { Row2FunnelAndCredibility } from '../Row2FunnelAndCredibility';
import { Row3CasesAndCharts } from '../Row3CasesAndCharts';
import { Row4TrendsAndHeatmap } from '../Row4TrendsAndHeatmap';
import { AuthenticatedUser } from '../LoginPage';
import { LoadErrorBar } from '../../api/hooks';
import type {
  DashboardOverviewPayload,
  DashboardChartsPayload,
} from '../../api/client';
import {
  OngoingCaseItem,
  PendingReviewItem,
  TimeRangeMetrics,
} from '../../data/dashboardData';

interface WorkbenchViewProps {
  /** KPI 指标;未就绪为 null(骨架占位,不使用本地默认数据) */
  metrics: TimeRangeMetrics | null;
  pendingReviews: PendingReviewItem[];
  onSelectReview: (item: PendingReviewItem) => void;
  onViewAllReviews: () => void;
  ongoingCases: OngoingCaseItem[];
  onSelectCase: (item: OngoingCaseItem) => void;
  onViewAllCases: () => void;
  currentUser: AuthenticatedUser;
  /** 列表区(待审核/进行中案件);未就绪为 null */
  overview: DashboardOverviewPayload | null;
  /** 图表区(漏斗/雷达/分布/趋势/热力图);未就绪为 null */
  charts: DashboardChartsPayload | null;
  /** 三个分区接口任一仍在加载 */
  sectionLoading: boolean;
  /** 分区接口的错误信息(已就绪区块照常展示) */
  sectionErrors: string[];
  onReloadDashboard: () => void;
}

/** 区块骨架:n 张卡占位 */
function SkeletonCards({ n, height }: { n: number; height: string }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200/90 rounded-xl shadow-xs animate-pulse p-5 space-y-3"
        >
          <div className="h-3.5 w-28 bg-slate-100 rounded" />
          <div className={`${height} w-full bg-slate-50 rounded-lg`} />
        </div>
      ))}
    </>
  );
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
  overview,
  charts,
  sectionLoading,
  sectionErrors,
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
            海外涉华信息智能核查平台 · {currentUser.displayName}
          </div>
        </div>
      </div>

      {/* 分区加载失败提示(已就绪区块照常展示) */}
      {sectionErrors.length > 0 && !sectionLoading ? (
        <LoadErrorBar
          message={`部分工作台数据加载失败:${sectionErrors.join('；')}`}
          onRetry={onReloadDashboard}
        />
      ) : null}

      {/* Row 1: Cumulative Clues + 2x2 KPIs + Pending Manual Reviews */}
      {metrics && overview ? (
        <Row1Overview
          metrics={metrics}
          pendingReviews={pendingReviews}
          onSelectReview={onSelectReview}
          onViewAllReviews={onViewAllReviews}
          weeklyClues={charts?.weeklyTrends?.clues}
          weeklyLabels={charts?.weeklyTrends?.labels}
        />
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <SkeletonCards n={4} height="h-16" />
        </div>
      )}

      {/* Row 2: 9-Step Funnel + Source Credibility Radar */}
      {charts ? (
        <Row2FunnelAndCredibility
          funnelSteps={charts.funnelSteps}
          credibilityAxes={charts.credibilityAxes}
          credibilityTiers={charts.credibilityTiers}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SkeletonCards n={2} height="h-[260px]" />
        </div>
      )}

      {/* Row 3: Conclusion Distribution + Ongoing Cases + Image Authenticity */}
      {charts && overview ? (
        <Row3CasesAndCharts
          ongoingCases={ongoingCases}
          onSelectCase={onSelectCase}
          onViewAllCases={onViewAllCases}
          conclusionDistribution={charts.conclusionDistribution}
          imageAuthSegments={charts.imageAuthSegments}
          imageClueCount={charts.imageClueCount}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <SkeletonCards n={3} height="h-[200px]" />
        </div>
      )}

      {/* Row 4: 12-Week Trend Chart + 24x7 Submission Heatmap */}
      {charts ? (
        <Row4TrendsAndHeatmap
          weeklyTrends={charts.weeklyTrends}
          heatmapDays={charts.heatmap?.days}
          heatmapMatrix={charts.heatmap?.matrix}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SkeletonCards n={2} height="h-[240px]" />
        </div>
      )}
    </>
  );
}
