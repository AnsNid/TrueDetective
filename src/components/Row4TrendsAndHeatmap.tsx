import React, { useState } from 'react';
import {
  HEATMAP_COLORS,
  HEATMAP_DAYS,
  HEATMAP_MATRIX,
} from '../data/dashboardData';
import { getHeatmapColor } from '../utils/dashboardLogic';
import { useElementWidth } from '../utils/useElementWidth';

interface WeeklyTrendPoint {
  week: string;
  clues: number;
  closed: number;
  showMarker: boolean;
  showLabel: boolean;
}

interface Row4Props {
  weeklyTrends?: { labels?: string[]; clues: number[]; closed: number[] };
  heatmapDays?: string[];
  heatmapMatrix?: number[][];
}

/** 由后端 12 周序列构建图表数据点,标签回退为最近 12 周日期 */
function buildWeeklyData(trends?: {
  labels?: string[];
  clues: number[];
  closed: number[];
}): WeeklyTrendPoint[] {
  const clues = trends?.clues?.length ? trends.clues : [800, 900, 830, 1010, 1120, 1160, 1080, 1270, 1340, 1390, 1490, 1630];
  const closed = trends?.closed?.length
    ? trends.closed
    : [380, 410, 450, 490, 530, 570, 530, 670, 720, 750, 800, 870];
  const count = clues.length;
  // 日期标签: 以后端提供的为准; 若是 W1/W2 这类占位则按最近 12 周推算
  const rawLabels = trends?.labels?.length ? trends.labels : [];
  const dateLabels = rawLabels.length
    ? rawLabels
    : Array.from({ length: count }, (_, i) => {
        const d = new Date(Date.now() - (count - 1 - i) * 7 * 86400000);
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      });
  const looksLikePlaceholder = rawLabels.every((l) => /^W\d+$/.test(l)) && rawLabels.length > 0;
  const labels = looksLikePlaceholder
    ? Array.from({ length: count }, (_, i) => {
        const d = new Date(Date.now() - (count - 1 - i) * 7 * 86400000);
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    : dateLabels;

  const markerSet = new Set([0, 2, 7, 11]);
  const labelSet = new Set([0, 2, 4, 7, 9, 11]);
  return clues.map((cluesVal, i) => ({
    week: labels[i] ?? `W${i + 1}`,
    clues: cluesVal,
    closed: closed[i] ?? 0,
    showMarker: markerSet.has(i),
    showLabel: labelSet.has(i),
  }));
}

export const Row4TrendsAndHeatmap: React.FC<Row4Props> = ({
  weeklyTrends,
  heatmapDays = HEATMAP_DAYS,
  heatmapMatrix = HEATMAP_MATRIX,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    day: string;
    hour: number;
    level: number;
  } | null>(null);

  const [chartRef, measuredWidth] = useElementWidth<HTMLDivElement>();
  // Anchor the plot area to the measured container width so the chart
  // fills the card at any size instead of scaling a fixed 660-wide box.
  const chartLeft = 36;
  const chartRight = Math.max(measuredWidth - 10, chartLeft + 1);
  const chartTop = 12;
  const chartBottom = 132;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;
  const WEEKLY_DATA = buildWeeklyData(weeklyTrends);
  const peak = Math.max(...WEEKLY_DATA.map((d) => Math.max(d.clues, d.closed)), 1);
  const maxVal = Math.max(200, Math.ceil(peak / 500) * 500);

  const getCoord = (index: number, value: number) => {
    const x = chartLeft + (index / (WEEKLY_DATA.length - 1)) * chartWidth;
    const y = chartBottom - (value / maxVal) * chartHeight;
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  };

  const cluesPoints = WEEKLY_DATA.map((d, i) => getCoord(i, d.clues));
  const closedPoints = WEEKLY_DATA.map((d, i) => getCoord(i, d.closed));

  const cluesPolyline = cluesPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const closedPolyline = closedPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const cluesArea = `${chartLeft},${chartBottom} ${cluesPolyline} ${chartRight},${chartBottom}`;
  const closedArea = `${chartLeft},${chartBottom} ${closedPolyline} ${chartRight},${chartBottom}`;

  const yTickSteps = 4;
  const yTicks = Array.from({ length: yTickSteps + 1 }, (_, i) =>
    Math.round((maxVal / yTickSteps) * (yTickSteps - i))
  );

  return (
    <div className="grid grid-cols-12 lg:grid-cols-[58fr_42fr] gap-3 items-stretch">
      {/* Left: 近 12 周线索量与结案量 */}
      <section
        aria-label="近 12 周线索量与结案量"
        className="col-span-12 lg:col-span-1 bg-white rounded-xl border border-slate-200/75 px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <h2 className="text-[13px] font-bold text-[#0F172A]">
              近 12 周线索量与结案量
            </h2>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              线索量
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              结案量
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <div ref={chartRef} className="w-full">
          {measuredWidth > 0 && (
          <svg
            viewBox={`0 0 ${measuredWidth} 150`}
            preserveAspectRatio="none"
            className="w-full h-[132px] overflow-visible block"
            role="img"
            aria-label="近12周线索量与结案量折线图"
          >
            <defs>
              <linearGradient id="weeklyCluesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id="weeklyClosedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines + Y-Axis Labels */}
            {yTicks.map((tick) => {
              const y = chartBottom - (tick / maxVal) * chartHeight;
              return (
                <g key={tick}>
                  <line
                    x1={chartLeft}
                    y1={y}
                    x2={chartRight}
                    y2={y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                  <text
                    x={chartLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-400 text-[9.5px] tabular-nums"
                  >
                    {tick.toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Area Fills */}
            <polygon points={cluesArea} fill="url(#weeklyCluesGrad)" />
            <polygon points={closedArea} fill="url(#weeklyClosedGrad)" />

            {/* Lines */}
            <polyline
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={cluesPolyline}
            />
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={closedPolyline}
            />

            {/* Data Dots & X-Axis Labels */}
            {WEEKLY_DATA.map((d, i) => {
              const cPt = cluesPoints[i];
              const gPt = closedPoints[i];
              return (
                <g key={d.week}>
                  {d.showMarker && (
                    <>
                      <circle cx={cPt.x} cy={cPt.y} r="2.6" fill="#2563EB" />
                      <circle cx={gPt.x} cy={gPt.y} r="2.6" fill="#10B981" />
                    </>
                  )}
                  {d.showLabel && (
                    <text
                      x={cPt.x}
                      y={chartBottom + 15}
                      textAnchor="middle"
                      className="fill-slate-400 text-[9.5px] tabular-nums"
                    >
                      {d.week}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          )}
        </div>
      </section>

      {/* Right: 24 × 7 提交时段热力图 */}
      <section
        aria-label="24 × 7 提交时段热力图"
        className="col-span-12 lg:col-span-1 bg-white rounded-xl border border-slate-200/75 px-3.5 sm:px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <h2 className="text-[13px] font-bold text-[#0F172A]">
              24 × 7 提交时段热力图
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
            {hoveredCell ? (
              <span className="text-slate-600 font-medium tabular-nums mr-1">
                {hoveredCell.day} {hoveredCell.hour}:00
              </span>
            ) : null}
            <span>少</span>
            <div className="flex items-center gap-1">
              {HEATMAP_COLORS.map((c, idx) => (
                <span
                  key={idx}
                  style={{ backgroundColor: c }}
                  className="w-2.5 h-2.5 rounded-[2px]"
                />
              ))}
            </div>
            <span>多</span>
          </div>
        </div>

        {/* 7x24 Grid */}
        <div className="flex flex-col justify-between space-y-[2px] sm:space-y-[2.5px]">
          {heatmapDays.map((day, dIdx) => (
            <div key={day} className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-6 text-[10px] text-slate-400 shrink-0">
                {day}
              </span>
              <div className="flex-1 grid grid-cols-24 gap-[1.5px] sm:gap-[2.5px]">
                {(heatmapMatrix[dIdx] ?? []).map((level, hIdx) => (
                  <div
                    key={hIdx}
                    onMouseEnter={() =>
                      setHoveredCell({ day, hour: hIdx, level })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{ backgroundColor: getHeatmapColor(level) }}
                    className="h-[13.5px] rounded-[2px] transition-transform hover:scale-110"
                    title={`${day} ${hIdx}:00 - 活跃度等级 ${level + 1}`}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* X-Axis Hours Row (0, 2, 4, ... 22) */}
          <div className="flex items-center gap-1.5 sm:gap-2 pt-1">
            <span className="w-6 shrink-0" />
            <div className="flex-1 grid grid-cols-24 gap-[1.5px] sm:gap-[2.5px]">
              {Array.from({ length: 24 }).map((_, hIdx) => (
                <span
                  key={hIdx}
                  className="text-[8.5px] sm:text-[9px] text-slate-400 tabular-nums text-center leading-none"
                >
                  {hIdx % 2 === 0 ? hIdx : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
