import React from 'react';
import { PendingReviewItem, TimeRangeMetrics } from '../data/dashboardData';
import { useElementWidth } from '../utils/useElementWidth';

interface Row1OverviewProps {
  metrics: TimeRangeMetrics;
  pendingReviews: PendingReviewItem[];
  onSelectReview: (item: PendingReviewItem) => void;
  onViewAllReviews: () => void;
}

const CLUES_CHART_POINTS = [
  { x: 0, y: 68 },
  { x: 46, y: 63 },
  { x: 92, y: 60 },
  { x: 138, y: 50 },
  { x: 184, y: 57 },
  { x: 230, y: 53 },
  { x: 276, y: 47 },
  { x: 322, y: 37 },
  { x: 368, y: 42 },
  { x: 414, y: 30 },
  { x: 460, y: 26 },
  { x: 506, y: 33 },
  { x: 552, y: 24 },
];

const CLUES_X_LABELS = [
  { label: '10-07', x: 10 },
  { label: '10-14', x: 116 },
  { label: '10-21', x: 224 },
  { label: '10-28', x: 332 },
  { label: '11-02', x: 440 },
  { label: '11-05', x: 544 },
];

export const Row1Overview: React.FC<Row1OverviewProps> = ({
  metrics,
  pendingReviews,
  onSelectReview,
  onViewAllReviews,
}) => {
  const [chartRef, chartWidth] = useElementWidth<HTMLDivElement>();
  // Scale the fixed 560-wide design coordinates to the measured container
  // width so the chart fills the card at any size (points/text stay 1:1).
  const cluesScale = chartWidth > 0 ? chartWidth / 560 : 0;
  const scaledPoints = CLUES_CHART_POINTS.map((p) => ({
    x: Math.round(p.x * cluesScale * 10) / 10,
    y: p.y,
  }));
  const polylinePoints = scaledPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `0,90 ${polylinePoints} ${chartWidth},90`;
  const lastPoint = scaledPoints[scaledPoints.length - 1];

  return (
    <div className="grid grid-cols-12 lg:grid-cols-[45fr_26fr_29fr] gap-3 items-stretch">
      {/* Card 1: 累计线索 */}
      <section
        aria-label="累计线索"
        className="col-span-12 lg:col-span-1 bg-white rounded-xl border border-slate-200/75 px-3.5 sm:px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <h2 className="text-[13px] font-bold text-[#0F172A]">累计线索</h2>
            </div>
            <button
              type="button"
              onClick={onViewAllReviews}
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              近 30 日 ›
            </button>
          </div>

          {/* KPI Value & Daily Avg */}
          <div className="flex items-end justify-between mt-1.5">
            <div>
              <div className="text-[30px] sm:text-[34px] font-extrabold text-[#0F172A] leading-none tracking-tight tabular-nums">
                {metrics.totalClues}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] tabular-nums">
                <span className="text-[#10B981] font-semibold flex items-center gap-0.5">
                  <span className="text-[8px]">▲</span> {metrics.growthRate}
                </span>
                <span className="text-slate-400">{metrics.lastPeriodComparison}</span>
              </div>
            </div>

            <div className="text-right pb-0.5">
              <div className="text-[10.5px] text-slate-400">日均新增</div>
              <div className="text-[16px] font-bold text-[#0F172A] tabular-nums leading-snug mt-0.5">
                {metrics.dailyAverage}
              </div>
            </div>
          </div>
        </div>

        {/* Line + Area Chart */}
        <div ref={chartRef} className="mt-2">
          {chartWidth > 0 && (
          <svg
            viewBox={`0 0 ${chartWidth} 104`}
            preserveAspectRatio="none"
            className="w-full h-[80px] overflow-visible block"
            role="img"
            aria-label="近30日累计线索趋势图"
          >
            <defs>
              <linearGradient id="cluesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal subtle grid lines */}
            <line x1="0" y1="22" x2={chartWidth} y2="22" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="0" y1="54" x2={chartWidth} y2="54" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="0" y1="86" x2={chartWidth} y2="86" stroke="#E2E8F0" strokeWidth="1" />

            {/* Area under curve */}
            <polygon points={areaPoints} fill="url(#cluesAreaGrad)" />

            {/* Blue trend line */}
            <polyline
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />

            {/* End point highlight */}
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="6.5"
              fill="#2563EB"
              fillOpacity="0.15"
            />
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="3.5"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="2.2"
            />

            {/* X-Axis Labels */}
            {CLUES_X_LABELS.map((item) => (
              <text
                key={item.label}
                x={Math.round(item.x * cluesScale * 10) / 10}
                y="101"
                textAnchor="middle"
                className="fill-slate-400 text-[9.5px] tabular-nums"
              >
                {item.label}
              </text>
            ))}
          </svg>
          )}
        </div>
      </section>

      {/* Card 2: 2x2 Mini KPI Grid */}
      <div className="col-span-12 md:col-span-5 lg:col-span-1 grid grid-cols-2 grid-rows-2 gap-3">
        {/* Mini Card 1: 核查案件 */}
        <div className="bg-white rounded-xl border border-slate-200/75 px-3.5 sm:px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <span className="text-[11.5px] text-slate-500 font-medium">核查案件</span>
          <div className="text-[24px] sm:text-[26px] font-extrabold text-[#0F172A] leading-none tracking-tight tabular-nums my-1">
            {metrics.verifiedCases}
          </div>
          <div className="text-[11px] text-slate-400 tabular-nums">
            较昨日 <span className="text-[#10B981] font-semibold ml-0.5">{metrics.verifiedDelta}</span>
          </div>
        </div>

        {/* Mini Card 2: 进行中 */}
        <div className="bg-white rounded-xl border border-slate-200/75 px-3.5 sm:px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <span className="text-[11.5px] text-slate-500 font-medium">进行中</span>
          <div className="text-[24px] sm:text-[26px] font-extrabold text-[#0F172A] leading-none tracking-tight tabular-nums my-1">
            {metrics.ongoingCount}
          </div>
          <div className="text-[11px] text-slate-400 tabular-nums">
            较昨日 <span className="text-[#10B981] font-semibold ml-0.5">{metrics.ongoingDelta}</span>
          </div>
        </div>

        {/* Mini Card 3: 已结案 */}
        <div className="bg-white rounded-xl border border-slate-200/75 px-3.5 sm:px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <span className="text-[11.5px] text-slate-500 font-medium">已结案</span>
          <div className="text-[24px] sm:text-[26px] font-extrabold text-[#0F172A] leading-none tracking-tight tabular-nums my-1">
            {metrics.closedCount}
          </div>
          <div className="text-[11px] text-slate-400 tabular-nums">
            较昨日 <span className="text-[#10B981] font-semibold ml-0.5">{metrics.closedDelta}</span>
          </div>
        </div>

        {/* Mini Card 4: 结案率 */}
        <div className="bg-white rounded-xl border border-slate-200/75 px-3.5 sm:px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <span className="text-[11.5px] text-slate-500 font-medium">结案率</span>
          <div className="text-[24px] sm:text-[26px] font-extrabold text-[#0F172A] leading-none tracking-tight tabular-nums my-1">
            {metrics.closeRate}
            <span className="text-[16px] font-bold ml-0.5">%</span>
          </div>
          <div className="text-[11px] text-slate-400 tabular-nums">
            较昨日 <span className="text-[#10B981] font-semibold ml-0.5">{metrics.closeRateDelta}</span>
          </div>
        </div>
      </div>

      {/* Card 3: 待人工审核 12 */}
      <section
        aria-label="待人工审核"
        className="col-span-12 md:col-span-7 lg:col-span-1 bg-white rounded-xl border border-slate-200/75 px-3.5 sm:px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <h2 className="text-[13px] font-bold text-[#0F172A]">
                待人工审核
                <span className="text-[#EF4444] font-bold ml-1.5 tabular-nums">12</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={onViewAllReviews}
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              查看全部 ›
            </button>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10.5px] text-slate-400 font-normal">
                <th className="pb-1 font-normal w-6">#</th>
                <th className="pb-1 font-normal">提交人</th>
                <th className="pb-1 font-normal">案件编号</th>
                <th className="pb-1 font-normal text-right">剩余时限</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-[11.5px]">
              {pendingReviews.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-5 text-center text-slate-400 text-xs">
                    暂无匹配的待审核案件
                  </td>
                </tr>
              ) : (
                pendingReviews.map((item) => (
                  <tr
                    key={item.caseId}
                    onClick={() => onSelectReview(item)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-1.5 text-slate-400 tabular-nums">{item.id}</td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4.5 h-4.5 rounded-full bg-blue-50 text-[#2563EB] text-[10px] font-semibold flex items-center justify-center shrink-0">
                          {item.avatarChar}
                        </span>
                        <span className="text-slate-700 font-medium whitespace-nowrap">
                          {item.submitter}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 text-slate-500 font-mono text-[11px] tabular-nums whitespace-nowrap">
                      {item.caseId}
                    </td>
                    <td className="py-1.5 text-right text-[#EF4444] font-semibold text-[11px] tabular-nums whitespace-nowrap">
                      {item.remainingTime}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Alert Bar */}
        <div className="mt-2 bg-[#F8FAFC] rounded-lg px-3 py-1 flex items-center justify-between gap-2">
          <span className="text-[10.5px] text-slate-400 truncate">
            超时未审核将自动升级至终审组
          </span>
          <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#EF4444] font-semibold text-[10.5px] whitespace-nowrap tabular-nums">
            平均 6.4 小时
          </span>
        </div>
      </section>
    </div>
  );
};
