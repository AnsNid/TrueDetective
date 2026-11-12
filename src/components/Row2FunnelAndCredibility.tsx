import React from 'react';
import {
  FUNNEL_STEPS,
  SOURCE_CREDIBILITY_AXES,
  SOURCE_CREDIBILITY_TIERS,
} from '../data/dashboardData';
import { computeRadarPolygonPoints } from '../utils/dashboardLogic';

interface Row2Props {
  funnelSteps?: typeof FUNNEL_STEPS;
  credibilityAxes?: typeof SOURCE_CREDIBILITY_AXES;
  credibilityTiers?: { label: string; percentage: number; color: string; textClass?: string }[];
}

export const Row2FunnelAndCredibility: React.FC<Row2Props> = ({
  funnelSteps = FUNNEL_STEPS,
  credibilityAxes = SOURCE_CREDIBILITY_AXES,
  credibilityTiers = SOURCE_CREDIBILITY_TIERS,
}) => {
  const centerX = 135;
  const centerY = 92;
  const maxRadius = 62;

  const radarVertices = computeRadarPolygonPoints(
    credibilityAxes,
    centerX,
    centerY,
    maxRadius
  );
  const dataPolygonString = radarVertices.map((v) => `${v.x},${v.y}`).join(' ');

  // Concentric hexagon rings at 33%, 66%, 100%
  const ringRatios = [0.33, 0.66, 1];
  const getHexagonRingPoints = (ratio: number) => {
    return credibilityAxes.map((_, idx) => {
      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 6;
      const r = maxRadius * ratio;
      const x = (centerX + r * Math.cos(angle)).toFixed(2);
      const y = (centerY + r * Math.sin(angle)).toFixed(2);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="grid grid-cols-12 lg:grid-cols-[53fr_47fr] gap-3 items-stretch">
      {/* Left: 九环节漏斗 */}
      <section
        aria-label="九环节漏斗"
        className="col-span-12 lg:col-span-1 bg-white rounded-xl border border-slate-200/75 px-3.5 sm:px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
      >
        <div>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-1 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <h2 className="text-[13px] font-bold text-[#0F172A]">九环节漏斗</h2>
            </div>
            <span className="text-[11px] text-slate-400 tabular-nums">
              总线索 1,284 · 当前：交叉验证
            </span>
          </div>

          {/* 9 Funnel Steps (3x3 grid on mobile <md, 9-column chevron bar on md+) */}
          <div className="grid grid-cols-3 md:grid-cols-9 gap-2.5 md:gap-[2px]">
            {funnelSteps.map((step, index) => {
              const isFirst = index === 0;
              const clipPath = isFirst
                ? 'polygon(0% 0%, calc(100% - 7px) 0%, 100% 50%, calc(100% - 7px) 100%, 0% 100%)'
                : 'polygon(0% 0%, calc(100% - 7px) 0%, 100% 50%, calc(100% - 7px) 100%, 0% 100%, 7px 50%)';

              return (
                <div key={step.label} className="flex flex-col">
                  {/* Step Label */}
                  <span className="text-[10.5px] text-slate-400 whitespace-nowrap truncate">
                    {step.label}
                  </span>

                  {/* Step Count */}
                  <span
                    className={`text-[14.5px] font-extrabold tabular-nums mt-0.5 mb-1.5 ${
                      step.isCurrent ? 'text-[#EF4444]' : 'text-[#0F172A]'
                    }`}
                  >
                    {step.count.toLocaleString()}
                  </span>

                  {/* Chevron Bar */}
                  <div
                    style={{
                      backgroundColor: step.bgColor,
                      color: step.textColor,
                      clipPath,
                    }}
                    className={`h-[26px] flex items-center text-[10.5px] font-bold tabular-nums select-none ${
                      isFirst ? 'pl-2 pr-2.5' : 'pl-3 pr-2.5'
                    }`}
                  >
                    {step.percentage}
                  </div>

                  {/* Bottom Small Percentage */}
                  <span className="text-[10px] text-slate-400 tabular-nums mt-1">
                    {step.percentage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Timing & Target Progress Bar */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center flex-wrap gap-x-3.5 gap-y-1">
            <span className="text-slate-400">环节平均耗时</span>
            <span className="text-slate-600">
              提单 → 拆解 <strong className="text-[#0F172A] font-bold tabular-nums ml-0.5">1.2h</strong>
            </span>
            <span className="text-slate-600">
              检索 → 验证 <strong className="text-[#0F172A] font-bold tabular-nums ml-0.5">6.5h</strong>
            </span>
            <span className="text-slate-600">
              报告 → 人工 <strong className="text-[#0F172A] font-bold tabular-nums ml-0.5">3.1h</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-[79%] bg-[#2563EB] rounded-full" />
            </div>
            <span className="text-[10.5px] text-slate-400 tabular-nums whitespace-nowrap">
              目标达成度 79%
            </span>
          </div>
        </div>
      </section>

      {/* Right: 信源可信度 */}
      <section
        aria-label="信源可信度"
        className="col-span-12 lg:col-span-1 bg-white rounded-xl border border-slate-200/75 px-3.5 sm:px-4 py-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <h2 className="text-[13px] font-bold text-[#0F172A]">信源可信度</h2>
          </div>
          <span className="text-[11px] text-slate-400">六维评分 · 近 30 日</span>
        </div>

        {/* Body: Radar Chart + Right Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 sm:gap-2 my-auto pt-2 sm:pt-0">
          {/* Radar SVG (7 cols on sm+) */}
          <div className="sm:col-span-7 flex items-center justify-center">
            <svg
              viewBox="0 0 270 176"
              className="w-full max-w-[245px] h-[142px] overflow-visible"
              role="img"
              aria-label="信源可信度六维雷达图"
            >
              {/* Concentric Hexagon Grid Rings */}
              {ringRatios.map((r) => (
                <polygon
                  key={r}
                  points={getHexagonRingPoints(r)}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
              ))}

              {/* Radial Axis Spokes */}
              {credibilityAxes.map((_, idx) => {
                const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 6;
                const x2 = (centerX + maxRadius * Math.cos(angle)).toFixed(2);
                const y2 = (centerY + maxRadius * Math.sin(angle)).toFixed(2);
                return (
                  <line
                    key={idx}
                    x1={centerX}
                    y1={centerY}
                    x2={x2}
                    y2={y2}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Filled Data Polygon */}
              <polygon
                points={dataPolygonString}
                fill="#2563EB"
                fillOpacity="0.16"
                stroke="#2563EB"
                strokeWidth="1.8"
              />

              {/* Data Vertex Dots & Axis Labels */}
              {radarVertices.map((vertex, idx) => {
                let textAnchor: 'middle' | 'start' | 'end' = 'middle';
                let dx = 0;
                let dy = 3;
                if (idx === 0) {
                  textAnchor = 'middle';
                  dy = -2;
                } else if (idx === 1 || idx === 2) {
                  textAnchor = 'start';
                  dx = 2;
                } else if (idx === 3) {
                  textAnchor = 'middle';
                  dy = 8;
                } else {
                  textAnchor = 'end';
                  dx = -2;
                }

                return (
                  <g key={vertex.label}>
                    <circle
                      cx={vertex.x}
                      cy={vertex.y}
                      r="2.4"
                      fill="#2563EB"
                    />
                    <text
                      x={vertex.labelX + dx}
                      y={vertex.labelY + dy}
                      textAnchor={textAnchor}
                      className="fill-slate-400 text-[10px]"
                    >
                      {vertex.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right Bars (5 cols on sm+) */}
          <div className="sm:col-span-5 flex flex-col justify-center space-y-2.5 pr-1">
            {credibilityTiers.map((tier) => (
              <div key={tier.label}>
                <div className="flex items-center justify-between text-[11.5px] mb-1">
                  <span className="text-slate-600 font-medium">{tier.label}</span>
                  <span
                    className="font-bold tabular-nums"
                    style={{ color: tier.color }}
                  >
                    {tier.percentage}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{
                      width: `${tier.percentage}%`,
                      backgroundColor: tier.color,
                    }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            ))}

            <p className="text-[10px] text-slate-400 pt-0.5 leading-snug">
              低可信信源禁止作为唯一结论依据
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
