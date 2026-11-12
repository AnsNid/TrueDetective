import { Row1Overview } from '../Row1Overview';
import { Row2FunnelAndCredibility } from '../Row2FunnelAndCredibility';
import { Row3CasesAndCharts } from '../Row3CasesAndCharts';
import { Row4TrendsAndHeatmap } from '../Row4TrendsAndHeatmap';
import { AuthenticatedUser } from '../LoginPage';
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
}: WorkbenchViewProps) {
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
          <div>2026年11月05日 09:41 星期四</div>
          <div>
            真探工作室 · {currentUser.displayName}
          </div>
        </div>
      </div>

      {/* Row 1: Cumulative Clues + 2x2 KPIs + Pending Manual Reviews */}
      <Row1Overview
        metrics={metrics}
        pendingReviews={pendingReviews}
        onSelectReview={onSelectReview}
        onViewAllReviews={onViewAllReviews}
      />

      {/* Row 2: 9-Step Funnel + Source Credibility Radar */}
      <Row2FunnelAndCredibility />

      {/* Row 3: Conclusion Distribution + Ongoing Cases + Image Authenticity */}
      <Row3CasesAndCharts
        ongoingCases={ongoingCases}
        onSelectCase={onSelectCase}
        onViewAllCases={onViewAllCases}
      />

      {/* Row 4: 12-Week Trend Chart + 24x7 Submission Heatmap */}
      <Row4TrendsAndHeatmap />
    </>
  );
}
