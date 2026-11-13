import React, { useState, useMemo } from 'react';
import {
  EvidenceItem,
} from '../../data/viewsData';
import {
  Search,
  Filter,
  Download,
  Share2,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { api } from '../../api/client';
import type { EvidenceSummary } from '../../api/client';
import { useApiData, LoadErrorBar, LoadingCards } from '../../api/hooks';

interface EvidenceViewProps {
  onSelectCase?: (caseId: string) => void;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ onSelectCase }) => {
  const [relationFilter, setRelationFilter] = useState<'全部' | '支持' | '反驳' | '背景' | '待确认'>('全部');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('全部信源');
  const [searchKey, setSearchKey] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  // 后端证据库(列表 + 服务端汇总)
  const evidenceQuery = useApiData<{ list: EvidenceItem[]; summary: EvidenceSummary }>(() => api.evidence());
  const allEvidence = evidenceQuery.data?.list ?? [];
  const summary = evidenceQuery.data?.summary;

  // 统计卡片(由后端数据计算)
  const evidenceTotal = allEvidence.length;
  const evidenceCaseCount = summary?.caseCount ?? new Set(allEvidence.map((e) => e.caseId)).size;
  const relationCount = (rel: string) => allEvidence.filter((e) => e.relation === rel).length;
  const relationPct = (rel: string) => (evidenceTotal ? Math.round((relationCount(rel) / evidenceTotal) * 100) : 0);

  // 争议对比:取最有代表性的支持 vs 反驳/待确认证据
  const supportPick = allEvidence.find((e) => e.relation === '支持' && e.credibility === '高')
    ?? allEvidence.find((e) => e.relation === '支持');
  const disputePick = allEvidence.find((e) => e.relation === '待确认')
    ?? allEvidence.find((e) => e.relation === '反驳');

  // 每案证据构成(完整性 = 已定性证据占比)
  const caseStats = Object.entries(
    allEvidence.reduce<Record<string, { total: number; settled: number }>>((acc, e) => {
      const s = (acc[e.caseId] ??= { total: 0, settled: 0 });
      s.total++;
      if (e.relation === '支持' || e.relation === '反驳') s.settled++;
      return acc;
    }, {})
  )
    .map(([caseId, s]) => ({
      caseId,
      pct: s.total ? Math.round((s.settled / s.total) * 100) : 0,
      total: s.total,
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);

  const filteredEvidence = useMemo(() => {
    return allEvidence.filter((item) => {
      if (relationFilter !== '全部' && item.relation !== relationFilter) return false;
      if (sourceTypeFilter !== '全部信源' && item.sourceType !== sourceTypeFilter) return false;
      if (searchKey.trim()) {
        const q = searchKey.toLowerCase();
        return (
          item.caseId.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.sourceOrg.toLowerCase().includes(q) ||
          item.sourceType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allEvidence, relationFilter, sourceTypeFilter, searchKey]);

  const handleExport = () => {
    const header = ['案件编号', '证据名称', '来源机构', '信源类型', '发布日期', '关系', '可信度'];
    const rows = filteredEvidence.map((e) => [
      e.caseId, e.name, e.sourceOrg, e.sourceType, e.date, e.relation, e.credibility,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `核查平台证据表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const getRelationColor = (relation: string) => {
    switch (relation) {
      case '支持':
        return 'text-emerald-600 font-semibold';
      case '反驳':
        return 'text-blue-600 font-semibold';
      case '背景':
        return 'text-slate-500 font-medium';
      case '待确认':
        return 'text-amber-600 font-semibold';
      default:
        return 'text-slate-600';
    }
  };

  const getCredibilityBadge = (credibility: string) => {
    switch (credibility) {
      case '高':
        return <span className="text-emerald-600 font-bold">高</span>;
      case '较高':
        return <span className="text-blue-600 font-bold">较高</span>;
      case '中':
        return <span className="text-amber-600 font-bold">中</span>;
      case '低':
        return <span className="text-rose-600 font-bold">低</span>;
      default:
        return <span>{credibility}</span>;
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Toast */}
      {copiedToast && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg flex items-center justify-between shadow-sm">
          <span>✓ 证据表已成功生成并导出为 CSV 格式</span>
          <button
            onClick={() => setCopiedToast(false)}
            className="text-blue-800 font-semibold underline cursor-pointer"
          >
            知道了
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
            证据库
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            全部核查案件的证据条目，共 {evidenceTotal} 条 · 支持 / 反驳 / 背景 / 待确认四类关系
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-400 tabular-nums">
          最近同步 {new Date().toLocaleDateString('zh-CN')} · 信源评级每日刷新
        </div>
      </div>

      {/* 5 Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">证据条目</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{evidenceTotal}</span>
            <span className="text-[10px] text-slate-400">覆盖 {evidenceCaseCount} 个案件</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#2563EB] h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">支持证据</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">{relationCount('支持')}</span>
            <span className="text-[10px] text-slate-400">占比 {relationPct('支持')}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${relationPct('支持')}%` }}></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">反驳证据</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#2563EB] tabular-nums">{relationCount('反驳')}</span>
            <span className="text-[10px] text-slate-400">主动检索，防确认偏误</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#2563EB] h-full rounded-full" style={{ width: `${relationPct('反驳')}%` }}></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">背景证据</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-800 tabular-nums">{relationCount('背景')}</span>
            <span className="text-[10px] text-slate-400">不可单独替代直接证据</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-slate-400 h-full rounded-full" style={{ width: `${relationPct('背景')}%` }}></div>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] text-slate-500 font-medium">待确认</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-amber-600 tabular-nums">{relationCount('待确认')}</span>
            <span className="text-[10px] text-slate-400">需补充一手材料</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${relationPct('待确认')}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left 8 Cols */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* Card: 证据条目 Table */}
          <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
            {/* Table Header Controls */}
            <div className="p-3.5 border-b border-slate-100 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                  <span className="font-bold text-[#0F172A] text-[13px]">证据条目</span>
                </div>

                {/* Relation Filter Pills */}
                <div className="flex items-center gap-1 text-[11px]">
                  {(['全部', '支持', '反驳', '背景', '待确认'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRelationFilter(r)}
                      className={`px-2.5 py-0.5 rounded transition-colors cursor-pointer ${
                        relationFilter === r
                          ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {r === '全部' ? '全部关系' : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Type Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1 border-t border-slate-50">
                {[
                  '全部信源',
                  '中方官方',
                  '中方媒体',
                  '国际媒体',
                  '外媒官方喉舌',
                  '事实核查机构',
                  '国际组织',
                ].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSourceTypeFilter(type)}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      sourceTypeFilter === type
                        ? 'bg-slate-800 text-white font-medium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11.5px] text-slate-600">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-500 font-semibold select-none">
                  <tr>
                    <th className="py-2.5 pl-4 pr-2 whitespace-nowrap">案件</th>
                    <th className="py-2.5 px-3 min-w-[200px]">证据名称</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">来源机构</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">日期</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">关系</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">类型</th>
                    <th className="py-2.5 pr-4 pl-3 whitespace-nowrap">可信度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evidenceQuery.error && !evidenceQuery.loading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-2">
                        <LoadErrorBar message={evidenceQuery.error} onRetry={evidenceQuery.reload} />
                      </td>
                    </tr>
                  ) : evidenceQuery.loading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-2">
                        <LoadingCards rows={3} />
                      </td>
                    </tr>
                  ) : filteredEvidence.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-[12px] text-slate-400">
                        暂无符合条件的证据材料
                      </td>
                    </tr>
                  ) : filteredEvidence.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 pl-4 pr-2 font-mono tabular-nums text-slate-600 whitespace-nowrap text-[11px]">
                        {onSelectCase ? (
                          <button
                            onClick={() => onSelectCase(item.caseId)}
                            className="hover:text-blue-600 hover:underline font-bold text-slate-700 cursor-pointer text-left"
                            title="点击查看案件详情工作台"
                          >
                            {item.caseId}
                          </button>
                        ) : (
                          item.caseId
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {item.sourceOrg}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 tabular-nums whitespace-nowrap text-[11px]">
                        {item.date}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={getRelationColor(item.relation)}>
                          {item.relation}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-slate-600">
                          {item.sourceType}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 pl-3 whitespace-nowrap">
                        {getCredibilityBadge(item.credibility)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 py-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div>
                共 {evidenceTotal} 条证据 · 4 类关系 · 6 类信源 · 转载不计独立证据
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  导出证据表
                </button>
                {/* 证据链图生成暂未开放(需图形渲染服务),仅保留 CSV 导出 */}
              </div>
            </div>
          </div>

          {/* Card: 争议证据对比(真实数据: 最强支持 vs 待确认/反驳) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                争议证据对比
              </div>
              <span className="text-[10px] text-slate-400">支持与待确认/反驳并列</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11.5px]">
              {/* Support Card */}
              <button
                type="button"
                onClick={() => supportPick && onSelectCase?.(supportPick.caseId)}
                className="text-left bg-emerald-50/40 border border-emerald-200/80 rounded-lg p-3 space-y-1.5 hover:border-emerald-400 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 text-[11px]">支持</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                    {supportPick?.credibility ?? '—'} 可信
                  </span>
                </div>
                <div className="font-bold text-slate-800 line-clamp-1">
                  {supportPick?.name ?? '暂无支持证据'}
                </div>
                <p className="text-[10.5px] text-slate-600 leading-relaxed">
                  {supportPick ? `${supportPick.sourceOrg} · ${supportPick.date || '未注明日期'} · ${supportPick.caseId}` : '完成环节 6 交叉验证后自动汇入。'}
                </p>
              </button>

              {/* Pending / Dispute Card */}
              <button
                type="button"
                onClick={() => disputePick && onSelectCase?.(disputePick.caseId)}
                className="text-left bg-amber-50/40 border border-amber-200/80 rounded-lg p-3 space-y-1.5 hover:border-amber-400 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-800 text-[11px]">{disputePick?.relation ?? '待确认'}</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                    {disputePick?.sourceType ?? '—'}
                  </span>
                </div>
                <div className="font-bold text-slate-800 line-clamp-1">
                  {disputePick?.name ?? '暂无争议证据'}
                </div>
                <p className="text-[10.5px] text-slate-600 leading-relaxed">
                  {disputePick ? `${disputePick.sourceOrg} · ${disputePick.date || '未注明日期'} · ${disputePick.caseId}` : '检索反驳证据后自动汇入。'}
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Cols */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Card 1: 证据链构成(真实: 每案已定性证据占比) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                证据链构成(最低在前)
              </div>
              <span className="text-[10px] text-slate-400">{caseStats.length} 个案件</span>
            </div>

            <div className="space-y-3 text-[11px]">
              {caseStats.length === 0 ? (
                <div className="text-slate-400 py-2 text-center">暂无证据数据</div>
              ) : (
                caseStats.map((cs) => (
                  <div key={cs.caseId}>
                    <div className="flex items-center justify-between text-slate-700 mb-1">
                      <button
                        onClick={() => onSelectCase?.(cs.caseId)}
                        className="font-medium hover:text-blue-600 cursor-pointer font-mono"
                      >
                        {cs.caseId}
                      </button>
                      <span className={`font-bold tabular-nums ${cs.pct >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {cs.pct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cs.pct >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${cs.pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 leading-relaxed">
              构成比 = (支持+反驳)/该案证据总数;低于 70% 的案件按规范不得进入报告生成。
            </p>
          </div>

          {/* Card 2: 信源等级分布(服务端汇总) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                信源等级分布
              </div>
              <span className="text-[10px] text-slate-400">按可信度</span>
            </div>

            <div className="space-y-2.5 text-[11px]">
              {[
                { label: '高可信', count: summary?.credibility?.['高'] ?? 0, color: 'bg-emerald-500', text: 'text-emerald-600' },
                { label: '较高 / 中可信', count: (summary?.credibility?.['较高'] ?? 0) + (summary?.credibility?.['中'] ?? 0), color: 'bg-blue-600', text: 'text-blue-600' },
                { label: '低可信', count: summary?.credibility?.['低'] ?? 0, color: 'bg-amber-500', text: 'text-amber-600' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-slate-700 mb-1">
                    <span>{row.label}</span>
                    <span className={`font-bold tabular-nums ${row.text}`}>{row.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`${row.color} h-full rounded-full`}
                      style={{ width: `${evidenceTotal ? Math.round((row.count / evidenceTotal) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: 信源类型分布(服务端汇总) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                信源类型分布
              </div>
              <span className="text-[10px] text-slate-400">按证据条目</span>
            </div>

            <div className="space-y-2 text-[11px]">
              {Object.keys(summary?.sourceTypes ?? {}).length === 0 ? (
                <div className="text-slate-400 py-2 text-center">暂无数据</div>
              ) : (
                Object.entries(summary?.sourceTypes ?? {}).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-slate-600">{type}</span>
                    <span className="font-bold tabular-nums text-slate-800">
                      {count}
                      <span className="text-slate-400 font-normal ml-1">
                        {evidenceTotal ? Math.round((count / evidenceTotal) * 100) : 0}%
                      </span>
                    </span>
                  </div>
                ))
              )}
            </div>

            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 leading-relaxed">
              外媒官方喉舌涉华表述需标红提示，引用时须附反驳或独立佐证。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
