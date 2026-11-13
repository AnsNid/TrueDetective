import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Info,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Search,
  Trash2,
} from 'lucide-react';
import { api } from '../../api/client';
import type { KnowledgeItemApi } from '../../api/client';
import { useApiData, LoadErrorBar, LoadingCards } from '../../api/hooks';

const CATEGORIES = ['全部条目', '核查规范', '核查方法', '信源分级', '典型案例'] as const;

interface KnowledgeFormState {
  id?: number;
  title: string;
  category: string;
  content: string;
  keyRule: string;
}

const emptyForm: KnowledgeFormState = { title: '', category: '核查规范', content: '', keyRule: '' };

export const KnowledgeView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('全部条目');
  const [searchKey, setSearchKey] = useState('');
  const [detailModalItem, setDetailModalItem] = useState<KnowledgeItemApi | null>(null);
  const [formModal, setFormModal] = useState<KnowledgeFormState | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // 后端知识库条目
  const knowledgeQuery = useApiData<{ list: KnowledgeItemApi[]; role: string }>(() => api.knowledge());
  const allItems = knowledgeQuery.data?.list ?? [];
  const myRole = knowledgeQuery.data?.role ?? '核查员';
  const canEdit = myRole === '管理员' || myRole === '审核员';
  const canDelete = myRole === '管理员';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
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
  }, [allItems, activeCategory, searchKey]);

  // 统计卡片(由后端数据计算)
  const totalItems = allItems.length;
  const categoryRows = CATEGORIES.map((name) => ({
    name,
    count: name === '全部条目' ? totalItems : allItems.filter((i) => i.category === name).length,
  }));
  const topCitations = allItems.reduce((max, i) => Math.max(max, i.citations), 0);
  const caseStudyCount = allItems.filter((i) => i.category === '典型案例').length;
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10).replace(/-/g, '');
  const staleCount = allItems.filter((i) => (i.updatedDate || '').replace(/-/g, '') < monthAgo).length;
  const latestUpdate = allItems.reduce((max, i) => (i.updatedDate > max ? i.updatedDate : max), '');

  const openCreate = () => setFormModal({ ...emptyForm });
  const openEdit = (item: KnowledgeItemApi) =>
    setFormModal({
      id: item.id,
      title: item.title,
      category: item.category,
      content: item.content,
      keyRule: item.keyRule,
    });

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formModal || formSaving) return;
    if (!formModal.title.trim()) {
      setFormError('条目标题不能为空');
      return;
    }
    setFormSaving(true);
    setFormError(null);
    try {
      const payload = {
        title: formModal.title.trim(),
        category: formModal.category,
        content: formModal.content,
        keyRule: formModal.keyRule,
      };
      const res = formModal.id
        ? await api.updateKnowledge(formModal.id, payload)
        : await api.createKnowledge(payload);
      if (res.code === 200) {
        setFormModal(null);
        showToast(formModal.id ? '知识条目已更新' : '知识条目已创建');
        knowledgeQuery.reload();
      } else {
        setFormError(res.message || '保存失败');
      }
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (item: KnowledgeItemApi) => {
    if (!window.confirm(`确定删除条目「${item.title}」吗？`)) return;
    const res = await api.deleteKnowledge(item.id);
    showToast(res.code === 200 ? '知识条目已删除' : res.message || '删除失败');
    if (res.code === 200) {
      setDetailModalItem(null);
      knowledgeQuery.reload();
    }
  };

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
        return 'bg-slate-100 text-slate-500 border border-slate-200';
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Toast */}
      {toast && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg flex items-center justify-between shadow-sm">
          <span>✓ {toast}</span>
          <button onClick={() => setToast(null)} className="text-blue-800 font-semibold underline cursor-pointer">
            知道了
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
            知识库
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            核查规范、核查方法、信源分级与历史案例沉淀
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-400">
          条目 {totalItems} · 最近更新 {latestUpdate || '—'} · 仅审核员可编辑
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">知识条目</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{totalItems}</span>
            <span className="text-[10px] text-slate-400">{CATEGORIES.length - 1} 个分类</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">最高引用条目</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#2563EB] tabular-nums">
              {topCitations}
              <span className="text-sm font-normal text-slate-500">次</span>
            </span>
            <span className="text-[10px] text-slate-400">核查环节自动呼出</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#2563EB] h-full rounded-full" style={{ width: '82%' }}></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">教学案例</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">{caseStudyCount}</span>
            <span className="text-[10px] text-slate-400">来自已结案案件</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, caseStudyCount * 14)}%` }}></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">待复核条目</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 tabular-nums">{staleCount}</span>
            <span className="text-[10px] text-slate-400">超 30 天未更新</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalItems ? Math.round((staleCount / totalItems) * 100) : 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column (4 cols) */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Categories Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                知识分类
              </div>
              <span className="text-[10px] text-slate-400">共 {totalItems} 条</span>
            </div>

            <div className="space-y-1 text-[12px]">
              {categoryRows.map((cat) => (
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
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      activeCategory === cat.name ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A] border-b border-slate-100 pb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              条目维护
            </div>
            <button
              onClick={openCreate}
              disabled={!canEdit}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[12px] font-medium cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {canEdit ? '新建条目' : '新建(需审核员/管理员)'}
            </button>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              {canEdit
                ? '当前角色可新增与编辑条目;删除仅管理员可操作。'
                : `当前角色「${myRole}」仅可浏览,新增/编辑需要审核员或管理员。`}
            </p>
          </div>
        </div>

        {/* Right Column (8 cols): Items List */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
          {/* List Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                placeholder="搜索标题 / 内容 / 分类"
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-[11.5px] w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <span className="text-[11px] text-slate-400">{filteredItems.length} 条结果</span>
          </div>

          {/* Items */}
          <div className="divide-y divide-slate-100">
            {knowledgeQuery.error && !knowledgeQuery.loading ? (
              <div className="px-4 py-3">
                <LoadErrorBar message={knowledgeQuery.error} onRetry={knowledgeQuery.reload} />
              </div>
            ) : knowledgeQuery.loading ? (
              <div className="p-4">
                <LoadingCards rows={3} />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12px] text-slate-400">
                暂无符合条件的知识条目
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  onClick={() => setDetailModalItem(item)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getCategoryBadgeClass(item.category)}`}>
                          {item.category}
                        </span>
                        {item.caseNo && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-600 border border-emerald-200">
                            沉淀自 {item.caseNo}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">更新 {item.updatedDate}</span>
                      </div>
                      <div className="text-[13px] font-bold text-[#0F172A] mb-1">{item.title}</div>
                      <p className="text-[11.5px] text-slate-500 leading-relaxed line-clamp-2">{item.content}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Info className="w-3 h-3" /> {item.citations} 次引用
                      </span>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {canEdit && (
                          <button
                            onClick={() => openEdit(item)}
                            className="flex items-center gap-0.5 px-2 py-1 rounded text-[10.5px] text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" /> 编辑
                          </button>
                        )}
                        <button
                          onClick={() => setDetailModalItem(item)}
                          className="flex items-center gap-0.5 px-2 py-1 rounded text-[10.5px] text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> 详情
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mb-2 ${getCategoryBadgeClass(detailModalItem.category)}`}>
                  {detailModalItem.category}
                </span>
                <h3 className="font-bold text-slate-900 text-[15px] leading-snug">{detailModalItem.title}</h3>
              </div>
              <button
                onClick={() => setDetailModalItem(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-1">条目内容</div>
              <p className="text-[12px] text-slate-700 leading-relaxed">{detailModalItem.content}</p>
            </div>

            {detailModalItem.keyRule && (
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1">关键规则</div>
                <pre className="text-[11.5px] text-slate-600 whitespace-pre-wrap font-sans bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {detailModalItem.keyRule}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
              <span>更新于 {detailModalItem.updatedDate} · {detailModalItem.citations} 次引用</span>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={() => {
                      openEdit(detailModalItem);
                      setDetailModalItem(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-[11.5px] font-medium cursor-pointer"
                  >
                    编辑
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(detailModalItem)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11.5px] font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 删除
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {formModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">
                {formModal.id ? '编辑知识条目' : '新建知识条目'}
              </h3>
              <button
                onClick={() => setFormModal(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
              {formError && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px]">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">标题 *</label>
                <input
                  type="text"
                  required
                  value={formModal.title}
                  onChange={(e) => setFormModal({ ...formModal, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">分类</label>
                <select
                  value={formModal.category}
                  onChange={(e) => setFormModal({ ...formModal, category: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {CATEGORIES.filter((c) => c !== '全部条目').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">条目内容</label>
                <textarea
                  rows={4}
                  value={formModal.content}
                  onChange={(e) => setFormModal({ ...formModal, content: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  关键规则 <span className="text-slate-400 font-normal">(每行一条)</span>
                </label>
                <textarea
                  rows={3}
                  value={formModal.keyRule}
                  onChange={(e) => setFormModal({ ...formModal, keyRule: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="pt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormModal(null)}
                  className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 cursor-pointer disabled:cursor-not-allowed"
                >
                  {formSaving ? '正在保存…' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
