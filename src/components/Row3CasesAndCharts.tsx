import React from 'react';
import {
  CONCLUSION_DISTRIBUTION,
  IMAGE_AUTH_SEGMENTS,
  OngoingCaseItem,
} from '../data/dashboardData';

interface Row3CasesAndChartsProps {
  ongoingCases: OngoingCaseItem[];
  onSelectCase: (item: OngoingCaseItem) => void;
  onViewAllCases: () => void;
  conclusionDistribution?: typeof CONCLUSION_DISTRIBUTION;
  imageAuthSegments?: typeof IMAGE_AUTH_SEGMENTS;
}

export const Row3CasesAndCharts: React.FC<Row3CasesAndChartsProps> = ({
  ongoingCases,
  onSelectCase,
  onViewAllCases,
  conclusionDistribution = CONCLUSION_DISTRIBUTION,
  imageAuthSegments = IMAGE_AUTH_SEGMENTS,
}) => {
  const maxBarVal = Math.max(...conclusionDistribution.map((d) => d.value), 1);

  // Donut chart geometry driven by backend segments:
  // Green (真实现场图) on right-bottom, Blue (疑似AI生成) on bottom-left, Orange (疑似旧图新用) on top-left
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segPct = (idx: number) =>
    imageAuthSegments[idx]?.percentage ?? [41, 37, 23][idx] ?? 0;
  const greenLen = (segPct(0) / 100) * circumference;
  const blueLen = (segPct(1) / 100) * circumference;
  const orangeLen = (segPct(2) / 100) * circumference;

  const getConclusionBadgeClass = (conclusion: OngoingCaseItem['conclusion']) => {
    switch (conclusion) {
      case '误导':
        return 'bg-orange-50 text-[#EA580C]';
      case '疑似AI生成':
        return 'bg-indigo-50 text-[#4F46E5]';
      case '无法核查':
      case '无法判断':
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="grid grid-cols-12 lg:grid-cols-[31fr_46fr_23fr] gap-3 items-stretch">
      {/* Left: 结论分布 */}
      <section
        aria-label="结论分布"
        className="col-span-12 md:col-span-7 lg:col-span-1 bg-white rounded-xl border border-slate-200/75 px-3.5 sm:px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <h2 className="text-[13px] font-bold text-[#0F172A]">结论分布</h2>
          </div>
          <span className="text-[11px] text-slate-400 tabular-nums">14 已定论</span>
        </div>

        {/* Vertical Bar Chart */}
        <div className="pt-3 pb-1">
          <div className="h-[104px] flex items-end justify-between gap-1.5 border-b border-slate-100 px-0.5">
            {conclusionDistribution.map((item) => {
              const barHeightPx = Math.round((item.value / maxBarVal) * 82);
              return (
                <div
                  key={item.label}
                  className="flex-1 flex flex-col items-center justify-end"
                >
                  <span className="text-[10.5px] font-bold text-slate-700 tabular-nums mb-1">
                    {item.value}
                  </span>
                  <div
                    style={{
                      height: `${barHeightPx}px`,
                      backgroundColor: item.color,
                    }}
                    className="w-full max-w-[32px] rounded-t-[3.5px] transition-opacity hover:opacity-90"
                  />
                </div>
              );
            })}
          </div>

          {/* X-Axis Category Labels */}
          <div className="flex items-center justify-between gap-0.5 pt-1.5">
            {conclusionDistribution.map((item) => (
              <span
                key={item.label}
                className="flex-1 text-center text-[9.5px] text-slate-400 whitespace-nowrap truncate"
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Insight Bar */}
        <div className="mt-1.5 bg-[#F8FAFC] rounded-lg px-3 py-1 flex items-center justify-between gap-2">
          <span className="text-[10.5px] text-slate-400 truncate">
            误导类占比最高 · 需加强语境补证
          </span>
          <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#D97706] font-semibold text-[10.5px] whitespace-nowrap tabular-nums">
            误导 33%
          </span>
        </div>
      </section>

      {/* Middle: 进行中案件 */}
      <section
        aria-label="进行中案件"
        className="col-span-12 md:col-span-12 lg:col-span-1 order-3 lg:order-2 bg-white rounded-xl border border-slate-200/75 px-3.5 sm:px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)] min-w-0"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <h2 className="text-[13px] font-bold text-[#0F172A]">进行中案件</h2>
            </div>
            <button
              type="button"
              onClick={onViewAllCases}
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              查看全部 ›
            </button>
          </div>

          {/* Cases Table - responsive overflow-x-auto on mobile, fixed layout on desktop */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] sm:min-w-0 text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-100 text-[10.5px] text-slate-400 font-normal">
                  <th className="pb-1.5 font-normal w-[88px]">案件编号</th>
                  <th className="pb-1.5 font-normal">标题</th>
                  <th className="pb-1.5 font-normal w-[88px]">进度</th>
                  <th className="pb-1.5 font-normal w-[42px]">优先级</th>
                  <th className="pb-1.5 font-normal w-[46px]">负责人</th>
                  <th className="pb-1.5 font-normal w-[68px] text-right">结论</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-[11.5px]">
                {ongoingCases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                      未找到匹配的进行中案件
                    </td>
                  </tr>
                ) : (
                  ongoingCases.map((item) => (
                    <tr
                      key={item.caseId}
                      onClick={() => onSelectCase(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-2 pr-1.5 font-mono text-[10.5px] text-slate-500 tabular-nums whitespace-nowrap">
                        {item.caseId}
                      </td>
                      <td className="py-2 pr-2 text-slate-700 font-medium truncate">
                        {item.title}
                      </td>
                      <td className="py-2 pr-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-[2px]">
                            {Array.from({ length: item.progressTotal }).map((_, i) => (
                              <span
                                key={i}
                                className={`w-[5px] h-[5px] rounded-full ${
                                  i < item.progressCurrent
                                    ? 'bg-[#2563EB]'
                                    : 'bg-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            {item.progressCurrent}/{item.progressTotal}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 pr-1 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            item.priority === '高'
                              ? 'bg-red-50 text-[#EF4444]'
                              : 'bg-blue-50 text-[#2563EB]'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-2 pr-1 text-slate-600 text-[11px] whitespace-nowrap">
                        {item.owner}
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getConclusionBadgeClass(
                            item.conclusion
                          )}`}
                        >
                          {item.conclusion}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Right: 图片真伪判定 */}
      <section
        aria-label="图片真伪判定"
        className="col-span-12 md:col-span-5 lg:col-span-1 order-2 lg:order-3 bg-white rounded-xl border border-slate-200/75 px-3.5 sm:px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <h2 className="text-[13px] font-bold text-[#0F172A]">图片真伪判定</h2>
          </div>
          <span className="text-[11px] text-slate-400 tabular-nums">1,024 张</span>
        </div>

        {/* Center Donut Chart */}
        <div className="flex items-center justify-center my-1.5 relative">
          <svg
            viewBox="0 0 112 112"
            className="w-[108px] h-[108px] -rotate-65"
            role="img"
            aria-label="图片真伪判定占比环图"
          >
            {/* Segment 1: Green (真实现场图 41%) */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              fill="transparent"
              stroke="#10B981"
              strokeWidth="14"
              strokeDasharray={`${greenLen} ${circumference}`}
              strokeDashoffset={0}
            />
            {/* Segment 2: Blue (疑似AI生成 37%) */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              fill="transparent"
              stroke="#2563EB"
              strokeWidth="14"
              strokeDasharray={`${blueLen} ${circumference}`}
              strokeDashoffset={-greenLen}
            />
            {/* Segment 3: Orange (疑似旧图新用 23%) */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              fill="transparent"
              stroke="#F59E0B"
              strokeWidth="14"
              strokeDasharray={`${orangeLen} ${circumference}`}
              strokeDashoffset={-(greenLen + blueLen)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[15px] font-extrabold text-[#0F172A] tabular-nums leading-tight">
              1,024
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">张图片</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="divide-y divide-slate-100 text-[11.5px]">
          {imageAuthSegments.map((seg) => (
            <div
              key={seg.label}
              className="py-1 first:pt-0 last:pb-0 flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5">
                <span
                  style={{ backgroundColor: seg.color }}
                  className="w-2 h-2 rounded-full shrink-0"
                />
                <span className="text-slate-600 text-[11px]">{seg.label}</span>
              </div>
              <span className="font-bold text-[#0F172A] text-[11.5px] tabular-nums">
                {seg.percentage}%
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
