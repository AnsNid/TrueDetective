import React, { useState } from 'react';
import {
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { api } from '../../api/client';
import type { HistoryItemApi } from '../../api/client';
import { useApiData, LoadErrorBar, LoadingCards } from '../../api/hooks';

interface HistoryViewProps {
  onSelectCaseDetail?: (caseId: string) => void;
  currentUserRole?: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onSelectCaseDetail,
  currentUserRole = '管理员',
}) => {
  const [selectedCaseModal, setSelectedCaseModal] = useState<HistoryItemApi | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [depositingId, setDepositingId] = useState<string | null>(null);

  const canDeposit = currentUserRole === '管理员' || currentUserRole === '审核员';

  // 后端已结案案例
  const historyQuery = useApiData<{ list: HistoryItemApi[] }>(() => api.history());
  const historyCases = historyQuery.data?.list ?? [];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleDeposit = async (caseNo: string) => {
    setDepositingId(caseNo);
    try {
      const res = await api.depositCase(caseNo);
      showToast(res.code === 200 ? `案件 ${caseNo} 已沉淀为教学案例` : res.message || '沉淀失败');
      if (res.code === 200) {
        historyQuery.reload();
      }
    } finally {
      setDepositingId(null);
    }
  };

  // 统计卡片(由后端数据计算)
  const closedCount = historyCases.length;
  const depositedCount = historyCases.filter((c) => c.deposited).length;
  const depositRate = closedCount ? Math.round((depositedCount / closedCount) * 100) : 0;
  const durations = historyCases.filter((c) => c.durationDays).map((c) => c.durationDays as number);
  const avgDuration = durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : '—';
  const misleadingLikeCount = historyCases.filter((c) => c.conclusion === '误导' || c.conclusion === '虚假').length;
  const misleadingPct = closedCount ? Math.round((misleadingLikeCount / closedCount) * 100) : 0;

  // 结论分布(环形图分段,由后端数据聚合)
  const DONUT_C = 251.3;
  const conclusionSegments = [
    { key: '误导', color: '#F97316', count: historyCases.filter((c) => c.conclusion === '误导').length },
    { key: '真实 / 基本真实', color: '#10B981', count: historyCases.filter((c) => c.conclusion === '真实' || c.conclusion === '基本真实').length },
    { key: '虚假', color: '#EF4444', count: historyCases.filter((c) => c.conclusion === '虚假').length },
    { key: '尚待核实', color: '#3B82F6', count: historyCases.filter((c) => c.conclusion === '尚待核实').length },
  ];
  let donutOffset = 0;
  const donutSegments = conclusionSegments
    .filter((s) => s.count > 0)
    .map((s) => {
      const len = (s.count / Math.max(closedCount, 1)) * DONUT_C;
      const seg = { ...s, len, offset: donutOffset };
      donutOffset += len;
      return seg;
    });

  // 结案时间线(按结案日期聚合,最近 5 个日期)
  const timelineMap = new Map<string, number>();
  for (const c of historyCases) {
    const d = c.closedDate?.slice(5) ?? '';
    if (d) timelineMap.set(d, (timelineMap.get(d) ?? 0) + 1);
  }
  const timelineRows = Array.from(timelineMap.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 5)
    .map(([date, count]) => ({ date, count, w: `${Math.round((count / Math.max(...timelineMap.values(), 1)) * 100)}%` }));

  const getConclusionBadge = (conclusion: string) => {
    switch (conclusion) {
      case '误导':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            误导
          </span>
        );
      case '基本真实':
      case '真实':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            {conclusion}
          </span>
        );
      case '虚假':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
            虚假
          </span>
        );
      case '尚待核实':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
            尚待核实
          </span>
        );
      default:
        return <span>{conclusion}</span>;
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
            历史案例
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            已结案案例，共 {closedCount} 个，可沉淀为知识库教学案例
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-400">
          本月结案 {closedCount} 个 · 沉淀率 {depositRate}% · 教学案例库已同步更新
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg flex items-center justify-between shadow-sm">
          <span>✓ {toast}</span>
          <button onClick={() => setToast(null)} className="text-blue-800 font-semibold underline cursor-pointer">
            知道了
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">已结案</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{closedCount}</span>
            <span className="text-[10px] text-slate-400">全部来自核查任务</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">已沉淀为教学案例</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#2563EB] tabular-nums">{depositedCount}</span>
            <span className="text-[10px] text-slate-400">沉淀率 {depositRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#2563EB] h-full rounded-full" style={{ width: `${depositRate}%` }}></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">平均结案时长</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {avgDuration}
              <span className="text-sm font-normal text-slate-500">天</span>
            </span>
            <span className="text-[10px] text-slate-400">{durations.length} 个案件有记录</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, (parseFloat(avgDuration) || 0) * 12)}%` }}></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">误导/虚假类占比</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-600 tabular-nums">{misleadingPct}%</span>
            <span className="text-[10px] text-slate-400">{misleadingLikeCount}/{closedCount} 个案件</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${misleadingPct}%` }}></div>
          </div>
        </div>
      </div>

      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left 8 Cols: Case Cards Grid */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3">
          {historyQuery.error && !historyQuery.loading ? (
            <LoadErrorBar message={historyQuery.error} onRetry={historyQuery.reload} />
          ) : historyQuery.loading ? (
            <LoadingCards rows={3} />
          ) : historyCases.length === 0 ? (
            <div className="px-3 py-8 text-center text-[12px] text-slate-400">
              暂无已结案案例
            </div>
          ) : historyCases.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs flex flex-col justify-between space-y-2.5 hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {c.id}
                  </span>
                  {getConclusionBadge(c.conclusion)}
                </div>
                <h3 className="text-[12px] font-bold text-slate-900 mt-1 line-clamp-1">
                  {c.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {c.summary}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 text-[10.5px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>证据 {c.evidenceCount}条</span>
                  <span>·</span>
                  <span>复核 {c.reviewRounds}轮</span>
                  <span>·</span>
                  <span>置信度 {c.confidence}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-50 text-slate-400">
                  <span>负责人 {c.assignee} · 结案 {c.closedDate}{c.durationDays ? ` · 用时 ${c.durationDays} 天` : ''}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectCaseDetail && onSelectCaseDetail(c.id)}
                      className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                    >
                      查看报告
                    </button>
                    <span>·</span>
                    {c.deposited ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                        <Layers className="w-3 h-3" /> 已沉淀
                      </span>
                    ) : canDeposit ? (
                      <button
                        onClick={() => handleDeposit(c.id)}
                        disabled={depositingId === c.id}
                        className="text-slate-400 hover:text-emerald-600 disabled:opacity-50 cursor-pointer font-medium"
                      >
                        {depositingId === c.id ? '沉淀中…' : '沉淀'}
                      </button>
                    ) : (
                      <span className="text-slate-300">沉淀</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Special 8th Card: 教学沉淀 */}
          <div className="bg-white border border-blue-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between space-y-2.5">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                  教学沉淀
                </span>
                <span className="text-[10px] text-slate-400">已引用 34 次</span>
              </div>
              <h3 className="text-[12px] font-bold text-slate-900 mt-1">
                案例: 旧图新用类谣言
              </h3>
              <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                某外媒将数年前旧照片配文为近期事件。反向识图比对最早发布时间后判定“虚假”，并附原始出处时间线，作为「旧图新用识别」的标准教学样例。
              </p>
              <div className="text-[10px] text-slate-400 mt-1">
                教学用法: 事实层与定性层分离 / 关联案件 ZT-2026-0001
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-[10.5px] font-medium transition-colors cursor-pointer"
                >
                  引用到培训
                </button>
                <button
                  type="button"
                  className="text-[10.5px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  查看全文
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-50 text-slate-400">
                <span>沉淀 2026-09-28</span>
                <span className="text-slate-500 font-medium">归入「核查方法」</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Analytics Sidebar */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Card 1: 结论分布 Donut */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                结论分布
              </div>
              <span className="text-[10px] text-slate-400">{closedCount} 个案例</span>
            </div>

            {/* Donut chart representation */}
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#E2E8F0"
                    strokeWidth="14"
                  />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.key}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeDasharray={`${seg.len.toFixed(1)} ${DONUT_C}`}
                      strokeDashoffset={(-seg.offset).toFixed(1)}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-slate-900 leading-none">{closedCount}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">已结案</span>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full mt-4 space-y-1.5 text-[11px]">
                {conclusionSegments.map((seg) => (
                  <div key={seg.key} className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }}></span>
                      <span>{seg.key}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-slate-800">{seg.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: 结案时间线 */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                结案时间线
              </div>
              <span className="text-[10px] text-slate-400">9-18 ~ 9-24</span>
            </div>

            <div className="space-y-2 text-[11px]">
              {timelineRows.map((row) => (
                <div key={row.date} className="flex items-center gap-2">
                  <span className="w-12 text-slate-400 tabular-nums">{row.date}</span>
                  <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: row.w }}
                    ></div>
                  </div>
                  <span className="w-8 text-right text-slate-600 tabular-nums font-medium">
                    {row.count} 件
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
              平均复核 2 轮 · 无返工案例
            </p>
          </div>

          {/* Card 3: 沉淀规则 */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-2 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-[12px] text-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              沉淀规则
            </div>
            <p className="text-slate-600 leading-relaxed text-[10.5px]">
              结案即沉淀: 案件报告、证据链与结论置信度一并归档，供培训与复用检索。
            </p>
            <p className="text-slate-600 leading-relaxed text-[10.5px]">
              全部 7 个案例已进入知识库「典型案例」，可一键引用到培训。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
