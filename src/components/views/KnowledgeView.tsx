import React, { useState, useMemo } from 'react';
import {
  KNOWLEDGE_ITEMS,
  KnowledgeItem,
} from '../../data/viewsData';
import {
  BookOpen,
  Plus,
  Upload,
  Info,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Search,
} from 'lucide-react';

export const KnowledgeView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('全部条目');
  const [searchKey, setSearchKey] = useState('');
  const [detailModalItem, setDetailModalItem] = useState<KnowledgeItem | null>(null);

  const filteredItems = useMemo(() => {
    return KNOWLEDGE_ITEMS.filter((item) => {
      if (activeCategory !== '全部条目' && item.category !== activeCategory) {
        return false;
      }
      if (searchKey.trim()) {
        const q = searchKey.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeCategory, searchKey]);

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case '核查规范':
        return 'bg-blue-50 text-blue-600 border border-blue-200';
      case '核查方法':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case '信源分级':
        return 'bg-amber-50 text-amber-600 border border-amber-200';
      case '典型案例':
        return 'bg-purple-50 text-purple-600 border border-purple-200';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
            知识库
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            核查规范、核查方法、信源分级与历史案例沉淀 (已结案案例 7 个)
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-400">
          条目 16 · 最近更新 2026-10-28 · 仅审核员可编辑
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">知识条目</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">16</span>
            <span className="text-[10px] text-slate-400">4 个分类，各 4 条</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">本月引用</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#2563EB] tabular-nums">128<span className="text-sm font-normal text-slate-500">次</span></span>
            <span className="text-[10px] text-slate-400">核查环节自动呼出</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#2563EB] h-full rounded-full" style={{ width: '82%' }}></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">教学案例</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">7</span>
            <span className="text-[10px] text-slate-400">全部来自已结案案件</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">待复核条目</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 tabular-nums">2</span>
            <span className="text-[10px] text-slate-400">超 30 天未更新</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '20%' }}></div>
          </div>
        </div>
      </div>

      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column (3.5 cols) */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Categories Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                知识分类
              </div>
              <span className="text-[10px] text-slate-400">共 16 条</span>
            </div>

            <div className="space-y-1 text-[12px]">
              {[
                { name: '全部条目', count: 16 },
                { name: '核查规范', count: 4 },
                { name: '核查方法', count: 4 },
                { name: '信源分级', count: 4 },
                { name: '典型案例', count: 4 },
              ].map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    activeCategory === cat.name
                      ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[11px] tabular-nums ${
                      activeCategory === cat.name ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                新建条目
              </button>
              <button
                type="button"
                className="py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
              >
                批量导入
              </button>
            </div>
          </div>

          {/* Usage Principles Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A] border-b border-slate-100 pb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              使用原则
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              官方文件只支持事实层，不能单独支持对性质、意图或动机做出的“定性”或“定性结论”，不允反向倒推。
            </p>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              智能体 → 核查员提要素；成员核验与复核留痕；审核员最终定论；AI 不直接判定真假。
            </p>

            {/* Role Workflows */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                <span className="text-slate-500">智能体</span>
                <span className="font-semibold text-blue-600">提要素 · 检索</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                <span className="text-slate-500">核查员</span>
                <span className="font-semibold text-emerald-600">核验 · 留痕</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                <span className="text-slate-500">审核员</span>
                <span className="font-semibold text-amber-600">复核 · 定论</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                <span className="text-slate-500">管理员</span>
                <span className="font-semibold text-slate-700">账号 · 知识库</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>责任闭环 · 结论 8 类</span>
            </div>
          </div>
        </div>

        {/* Right Main Grid (8.5 cols) */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs flex flex-col justify-between space-y-2.5 hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${getCategoryBadgeClass(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      引用 {item.citations}次
                    </span>
                  </div>

                  <h3 className="text-[12px] font-bold text-slate-900 mt-1.5 line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                    {item.content}
                  </p>

                  <div className="mt-2 p-1.5 rounded bg-slate-50 border border-slate-100 text-[10px] text-slate-500 whitespace-pre-line leading-relaxed">
                    {item.keyRule}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10.5px] pt-2 border-t border-slate-100 text-slate-400">
                  <span>更新 {item.updatedDate}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDetailModalItem(item)}
                      className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      编辑 · 详情
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail / Edit Modal */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span
                className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${getCategoryBadgeClass(
                  detailModalItem.category
                )}`}
              >
                {detailModalItem.category}
              </span>
              <button
                onClick={() => setDetailModalItem(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-900">
              {detailModalItem.title}
            </h3>

            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              {detailModalItem.content}
            </div>

            <div className="text-xs text-slate-500 whitespace-pre-line bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <span className="font-bold text-blue-900 block mb-1">执行要点:</span>
              {detailModalItem.keyRule}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <span>引用统计: {detailModalItem.citations} 次</span>
              <span>最后更新: {detailModalItem.updatedDate}</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
