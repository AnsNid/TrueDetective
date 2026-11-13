import React from 'react';
import { useElementWidth } from '../../utils/useElementWidth';
import { api } from '../../api/client';
import type { StatisticsPayload } from '../../api/client';
import { useApiData, LoadErrorBar, LoadingCards } from '../../api/hooks';

// 12-week trend fallback values when backend data is not yet loaded.
const FALLBACK_CLUES = [120, 110, 105, 95, 85, 75, 65, 60, 55, 45, 35, 28];
const FALLBACK_CLOSED = [135, 130, 125, 120, 112, 105, 100, 95, 92, 88, 84, 80];

const FUNNEL_COLORS = ['#3B82F6', '#60A5FA', '#60A5FA', '#93C5FD', '#F59E0B', '#94A3B8', '#10B981'];
const PLATFORM_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

export const StatisticsView: React.FC = () => {
  const [trendRef, trendWidth] = useElementWidth<HTMLDivElement>();

  // 后端统计聚合
  const statsQuery = useApiData<StatisticsPayload>(() => api.statistics());
  const stats = statsQuery.data;
  const overview = stats?.overview;

  // Plot area geometry mirrors the original 600-wide design (labels at x=15,
  // series starting at x=40, 20px right padding).
  const trendLeft = 40;
  const trendRight = Math.max(trendWidth - 20, trendLeft + 1);
  const trendClues = stats?.weeklyTrends?.clues?.length
    ? stats.weeklyTrends.clues
    : FALLBACK_CLUES;
  const trendClosed = stats?.weeklyTrends?.closed?.length
    ? stats.weeklyTrends.closed
    : FALLBACK_CLOSED;
  const seriesLen = Math.max(trendClues.length, trendClosed.length);
  const trendStep =
    seriesLen > 1 ? (trendRight - trendLeft) / (seriesLen - 1) : 0;
  // Baseline y=140, top y=20, values scaled to the series max.
  const trendMax = Math.max(...trendClues, ...trendClosed, 1);
  const toY = (v: number) => 140 - (v / trendMax) * 120;
  const trendPoints = (vals: number[]) =>
    vals
      .map((v, i) => `${(trendLeft + i * trendStep).toFixed(1)},${toY(v).toFixed(1)}`)
      .join(' ');
  const casesPolyline = trendPoints(trendClues);
  const closedPolyline = trendPoints(trendClosed);
  const lastIdx = seriesLen - 1;
  const midIdx = Math.floor(seriesLen / 2);
  // Gridlines at 25% intervals; y-axis labels show actual values.
  const gridYs = [20, 60, 100, 140];
  const gridLabels = gridYs.map((_, i) => {
    const ratio = 1 - i * 0.25;
    const v = trendMax * ratio;
    return v >= 100 ? Math.round(v).toString() : v.toFixed(v % 1 === 0 ? 0 : 1);
  });

  // 结案率 Donut
  const totalCases = overview?.totalCases ?? 16;
  const closedCount = overview?.closed ?? 7;
  const ongoingCount = overview?.ongoing ?? 9;
  const closeRate = overview?.closeRate ?? (totalCases ? Math.round((closedCount / totalCases) * 100) : 0);
  const closedDash = (closeRate / 100) * 238.7;

  // 结论分布
  const conclusionBars = stats?.conclusionBars?.length
    ? stats.conclusionBars
    : [
        { label: '真实', val: 1, color: '#10B981' },
        { label: '基本真实', val: 1, color: '#34D399' },
        { label: '缺乏语境', val: 0, color: '#E2E8F0' },
        { label: '误导', val: 7, color: '#F97316' },
        { label: '基本错误', val: 0, color: '#E2E8F0' },
        { label: '虚假', val: 1, color: '#EF4444' },
        { label: '尚待核实', val: 1, color: '#94A3B8' },
        { label: '无法核查', val: 1, color: '#CBD5E1' },
      ];
  const maxConclusionVal = Math.max(...conclusionBars.map((b) => b.val), 1);
  const misleadingCount = conclusionBars.find((b) => b.label === '误导')?.val ?? 0;
  // 已定论 = 总案件 - 尚待核实(与后端 overview.concluded 同口径)
  const concludedTotal =
    overview?.concluded ??
    conclusionBars.reduce((sum, b) => (b.label === '尚待核实' ? sum : sum + b.val), 0);

  // 环节流转
  const funnelSteps = stats?.funnel?.length
    ? stats.funnel
    : [
        { name: '线索接收', count: 16, w: '100%' },
        { name: '价值初筛', count: 12, w: '75%' },
        { name: '主张拆解', count: 10, w: '62%' },
        { name: '多语种检索', count: 9, w: '56%' },
        { name: '交叉验证', count: 8, w: '50%' },
        { name: '报告生成', count: 7, w: '44%' },
        { name: '人工审核', count: 7, w: '44%' },
      ];

  // 成员产出
  const memberRows = stats?.memberOutput?.length
    ? stats.memberOutput
    : [
        { name: '张明', initial: '张', submit: 6, closed: 3, rate: '92%', efficiency: '100%' },
        { name: '李华', initial: '李', submit: 4, closed: 2, rate: '86%', efficiency: '85%' },
        { name: '王芳', initial: '王', submit: 3, closed: 1, rate: '78%', efficiency: '75%' },
        { name: '赵强', initial: '赵', submit: 2, closed: 1, rate: '74%', efficiency: '68%' },
        { name: '刘洋', initial: '刘', submit: 1, closed: 0, rate: '60%', efficiency: '50%' },
      ];
  const efficiencyColor = (efficiency: string) => {
    const v = parseInt(efficiency, 10) || 0;
    return v >= 80 ? '#10B981' : v >= 60 ? '#3B82F6' : '#F97316';
  };

  // 核查类型构成
  const ct = stats?.contentTypeBreakdown ?? { text: 12, image: 4, videoAudio: 0 };
  const ctTotal = ct.text + ct.image + ct.videoAudio || 1;
  const ctTextPct = Math.round((ct.text / ctTotal) * 100);
  const ctImagePct = Math.round((ct.image / ctTotal) * 100);
  const ctVideoPct = Math.max(0, 100 - ctTextPct - ctImagePct);
  const C = 238.7;
  const textDash = (ctTextPct / 100) * C;
  const imageDash = (ctImagePct / 100) * C;

  // 来源平台
  const platforms = stats?.platforms?.length
    ? stats.platforms
    : [
        { platform: 'Human Rights Watch', count: 318 },
        { platform: 'X / Twitter', count: 276 },
        { platform: 'Facebook', count: 198 },
        { platform: 'YouTube', count: 156 },
        { platform: 'Reuters / AP', count: 132 },
      ];
  const maxPlatform = Math.max(...platforms.map((p) => p.count), 1);

  const totalEvidence = overview?.totalEvidence ?? 12;

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
            数据统计
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            核查工作概况与结论分布 · 统计区间 {overview?.dateFrom ?? '2026-01-01'} 至 {overview?.dateTo ?? '—'}
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-400">
          数据同步 {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} · 口径: 全工作室 &nbsp;&nbsp;共 {totalCases} 个案件 / {totalEvidence} 条证据
        </div>
      </div>

      {/* 加载/错误状态 */}
      {statsQuery.error && !statsQuery.loading ? (
        <LoadErrorBar message={statsQuery.error} onRetry={statsQuery.reload} />
      ) : null}
      {statsQuery.loading && !stats ? <LoadingCards rows={4} /> : null}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">案件总数</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{totalCases}</span>
            <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1 py-0.2 rounded">
              证据 {totalEvidence} 条
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">进行中</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#2563EB] tabular-nums">{ongoingCount}</span>
            <span className="text-[10px] text-slate-400">占比 {totalCases ? Math.round((ongoingCount / totalCases) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#2563EB] h-full rounded-full" style={{ width: `${totalCases ? (ongoingCount / totalCases) * 100 : 0}%` }}></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">已结案</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">{closedCount}</span>
            <span className="text-[10px] text-slate-400">占比 {closeRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${closeRate}%` }}></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">结案率</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{closeRate}%</span>
            <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-1 py-0.2 rounded">
              目标 60% · {closeRate >= 60 ? '已达标' : `还差 ${60 - closeRate}pt`}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#F97316] h-full rounded-full" style={{ width: `${closeRate}%` }}></div>
          </div>
        </div>
      </div>

      {/* Row 1: Conclusion Bar Chart (left) + Close Rate Donut (mid) + 9-Step Funnel (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left: 结论分布 (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              结论分布
            </div>
            <span className="text-[10px] text-slate-400">{concludedTotal} 条已定论 · {totalCases} 个案件</span>
          </div>

          {/* Bar Chart */}
          <div className="h-36 pt-4 flex items-end justify-between gap-1.5 px-1">
            {conclusionBars.map((bar) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-700 tabular-nums">
                  {bar.val}
                </span>
                <div className="w-full bg-slate-100 rounded-t h-24 flex items-end">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${Math.max(3, Math.round((bar.val / maxConclusionVal) * 100))}%`,
                      backgroundColor: bar.color,
                    }}
                  ></div>
                </div>
                <span className="text-[9.5px] text-slate-500 truncate w-full text-center">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              误导类 {misleadingCount} 条{concludedTotal ? `，占已定论 ${Math.round((misleadingCount / concludedTotal) * 100)}%` : ''}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              需加强语境补证
            </span>
          </div>
        </div>

        {/* Middle: 结案率 Donut (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              结案率
            </div>
            <span className="text-[10px] text-slate-400">目标 60%</span>
          </div>

          {/* SVG Donut */}
          <div className="flex flex-col items-center justify-center my-auto">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#2563EB"
                  strokeWidth="12"
                  strokeDasharray="238.7 238.7"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray={`${closedDash.toFixed(1)} 238.7`}
                  strokeDashoffset="0"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-extrabold text-slate-900 leading-none">{closeRate}%</span>
                <span className="text-[10px] text-slate-400 mt-0.5">结案率</span>
              </div>
            </div>

            <div className="w-full mt-3 space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                  <span>已结案 {closedCount}</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-800">{closeRate}%</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                  <span>进行中 {ongoingCount}</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-800">
                  {totalCases ? Math.round((ongoingCount / totalCases) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 环节流转 (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              环节流转
            </div>
            <span className="text-[10px] text-slate-400">9 环节</span>
          </div>

          <div className="space-y-2 text-[11px]">
            {funnelSteps.map((step, idx) => (
              <div key={step.name} className="flex items-center gap-2">
                <span className="w-18 text-slate-600">{step.name}</span>
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: step.w,
                      backgroundColor: FUNNEL_COLORS[idx % FUNNEL_COLORS.length],
                    }}
                  ></div>
                </div>
                <span className="w-5 text-right font-bold text-slate-700 tabular-nums">
                  {step.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: 近 12 周案件量与结案量 (8 cols) + 成员产出 (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left: 12-Week Trend Line Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              近 12 周案件量与结案量
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-[#2563EB]">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                案件量
              </span>
              <span className="flex items-center gap-1 text-[#10B981]">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                结案量
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div ref={trendRef} className="h-44 relative pt-2">
            {trendWidth > 0 && (
            <svg
              className="w-full h-full block"
              viewBox={`0 0 ${trendWidth} 160`}
              preserveAspectRatio="none"
            >
              {/* Horizontal Grid lines */}
              {gridYs.map((gy) => (
                <line
                  key={gy}
                  x1="30"
                  y1={gy}
                  x2={trendRight}
                  y2={gy}
                  stroke={gy === 140 ? '#E2E8F0' : '#F1F5F9'}
                  strokeWidth="1"
                />
              ))}

              {/* Y axis labels */}
              {gridYs.map((gy, i) => (
                <text key={`label-${gy}`} x="15" y={gy + 4} fill="#94A3B8" fontSize="10">
                  {gridLabels[i]}
                </text>
              ))}

              {/* Line 1: Case volume (blue) */}
              <polyline
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                points={casesPolyline}
              />
              <circle cx={trendLeft + lastIdx * trendStep} cy={toY(trendClues[lastIdx])} r="4" fill="#2563EB" />
              <circle cx={trendLeft + midIdx * trendStep} cy={toY(trendClues[midIdx])} r="3.5" fill="#2563EB" />

              {/* Line 2: Closed cases (green) */}
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                points={closedPolyline}
              />
              <circle cx={trendLeft + lastIdx * trendStep} cy={toY(trendClosed[lastIdx])} r="4" fill="#10B981" />
              <circle cx={trendLeft + midIdx * trendStep} cy={toY(trendClosed[midIdx])} r="3.5" fill="#10B981" />
            </svg>
            )}
          </div>
        </div>

        {/* Right: 成员产出 (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              成员产出
            </div>
            <span className="text-[10px] text-slate-400">全部案件</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] text-slate-600">
              <thead className="text-[10px] text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="pb-1.5 font-medium">成员</th>
                  <th className="pb-1.5 font-medium text-center">提交</th>
                  <th className="pb-1.5 font-medium text-center">结案</th>
                  <th className="pb-1.5 font-medium text-center">录用率</th>
                  <th className="pb-1.5 font-medium text-right">效率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {memberRows.map((m) => (
                  <tr key={m.name} className="hover:bg-slate-50/50">
                    <td className="py-2 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                        {m.initial}
                      </span>
                      <span className="font-medium text-slate-800">{m.name}</span>
                    </td>
                    <td className="py-2 text-center tabular-nums">{m.submit}</td>
                    <td className="py-2 text-center tabular-nums">{m.closed}</td>
                    <td className="py-2 text-center tabular-nums">{m.rate}</td>
                    <td className="py-2 text-right">
                      <div className="w-12 ml-auto bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: m.efficiency, backgroundColor: efficiencyColor(m.efficiency) }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: 核查类型构成 (4 cols) + 线索来源平台 (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left: 核查类型构成 (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              核查类型构成
            </div>
            <span className="text-[10px] text-slate-400">{ctTotal} 条线索</span>
          </div>

          <div className="flex flex-col items-center justify-center my-auto">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#E2E8F0"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#2563EB"
                  strokeWidth="12"
                  strokeDasharray={`${textDash.toFixed(1)} 238.7`}
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#60A5FA"
                  strokeWidth="12"
                  strokeDasharray={`${imageDash.toFixed(1)} 238.7`}
                  strokeDashoffset={(-textDash).toFixed(1)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-extrabold text-slate-900 leading-none">{ctTextPct}%</span>
                <span className="text-[10px] text-slate-400 mt-0.5">文本核查</span>
              </div>
            </div>

            <div className="w-full mt-3 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                  <span>文本核查</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-800">{ct.text} · {ctTextPct}%</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#60A5FA]"></span>
                  <span>图片核查</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-800">{ct.image} · {ctImagePct}%</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span>视频 / 音频</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-800">{ct.videoAudio} · {ctVideoPct}%</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            视频与音频均以转写后文字流程处理，故归入文本核查统计。
          </p>
        </div>

        {/* Right: 线索来源平台 (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              线索来源平台
            </div>
            <span className="text-[10px] text-slate-400">Top {platforms.length}</span>
          </div>

          <div className="space-y-3 text-[11px] pt-1">
            {platforms.map((p, idx) => (
              <div key={p.platform} className="space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium">{p.platform}</span>
                  <span className="font-bold tabular-nums text-slate-800">{p.count}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(4, Math.round((p.count / maxPlatform) * 100))}%`,
                      backgroundColor: PLATFORM_COLORS[idx % PLATFORM_COLORS.length],
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
