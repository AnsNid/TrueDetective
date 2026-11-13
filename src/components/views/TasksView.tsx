import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Layers,
} from 'lucide-react';
import { api } from '../../api/client';
import type { TaskItemApi, TasksPayload } from '../../api/client';
import { LoadErrorBar, LoadingCards } from '../../api/hooks';

interface TasksViewProps {
  onOpenNewClue?: () => void;
  onSelectTask?: (task: TaskItemApi) => void;
  currentUserRole?: string;
}

const PAGE_SIZE = 12;

export const TasksView: React.FC<TasksViewProps> = ({
  onOpenNewClue,
  onSelectTask,
  currentUserRole = '管理员',
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'ongoing' | 'closed' | 'high_priority'>('all');
  const [searchKey, setSearchKey] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<TasksPayload | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canManage = currentUserRole === '管理员';
  const canDeposit = currentUserRole === '管理员' || currentUserRole === '审核员';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = React.useCallback(
    (page = currentPage) => {
      setLoading(true);
      setError(null);
      api
        .tasks({ tab: filterTab, keyword: searchKey.trim(), page, pageSize: PAGE_SIZE })
        .then((res) => {
          if (res.code === 200 && res.data) {
            setPayload(res.data);
          } else {
            setError(res.message || '加载失败');
          }
        })
        .finally(() => setLoading(false));
    },
    [filterTab, searchKey, currentPage]
  );

  useEffect(() => {
    load(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTab, currentPage]);

  useEffect(() => {
    // 搜索防抖
    const t = setTimeout(() => {
      setCurrentPage(1);
      load(1);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  const tasks = payload?.list ?? [];
  const total = payload?.total ?? 0;
  const totalPages = payload?.totalPages ?? 1;

  const toggleSelectAll = () => {
    if (selectedIds.length === tasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tasks.map((t) => t.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteRow = async (task: TaskItemApi) => {
    if (!window.confirm(`确定删除案件 ${task.id} 吗？`)) return;
    const res = await api.deleteCase(task.id);
    if (res.code === 200) {
      showToast(`案件 ${task.id} 已删除`);
      setSelectedIds((prev) => prev.filter((i) => i !== task.id));
      load();
    } else {
      showToast(res.message || '删除失败');
    }
  };

  const handleDepositRow = async (task: TaskItemApi) => {
    const res = await api.depositCase(task.id);
    showToast(res.code === 200 ? `案件 ${task.id} 已沉淀为教学案例` : res.message || '沉淀失败');
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`确定批量删除 ${selectedIds.length} 个案件吗？`)) return;
    const res = await api.batchDeleteCases(selectedIds);
    if (res.code === 200) {
      showToast(`已删除 ${res.data?.deleted ?? 0} 个案件`);
      setSelectedIds([]);
      load();
    } else {
      showToast(res.message || '批量删除失败');
    }
  };

  // Render 9-dot stage progress indicator
  const renderStageDots = (current: number) => {
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i < current ? 'bg-[#2563EB]' : i === current - 1 ? 'bg-blue-300' : 'bg-slate-200'
              }`}
            ></span>
          ))}
        </div>
      </div>
    );
  };

  const priorityBadge = (p: string) => {
    if (p === '高')
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
          高
        </span>
      );
    if (p === '低')
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
          低
        </span>
      );
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
        中
      </span>
    );
  };

  const filterTabs = [
    { key: 'all' as const, label: '全部' },
    { key: 'ongoing' as const, label: '进行中' },
    { key: 'closed' as const, label: '已结案' },
    { key: 'high_priority' as const, label: '优先级: 高' },
  ];

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
            核查任务
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            所有核查案件，按 9 环节进度推进
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-400 tabular-nums">
          共 {total} 个案件 · {filterTab === 'closed' ? total : total - (payload?.list.filter((t) => t.status === '已结案').length ?? 0)} 进行中
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">案件总数</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{total}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">进行中</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#2563EB] tabular-nums">
              {tasks.filter((t) => t.status !== '已结案').length || 0}
            </span>
            <span className="text-[10px] text-slate-400">本页</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#2563EB] h-full rounded-full" style={{ width: '56%' }}></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">已结案</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">
              {tasks.filter((t) => t.status === '已结案').length || 0}
            </span>
            <span className="text-[10px] text-slate-400">本页</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '44%' }}></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">已选</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{selectedIds.length}</span>
            <span className="text-[10px] text-slate-400">
              {canManage ? '可批量删除' : '批量操作需管理员'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '68%' }}></div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setFilterTab(tab.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer text-[11.5px] ${
                  filterTab === tab.key
                    ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                placeholder="搜索案件编号 / 标题 / 负责人"
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-[11.5px] w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {selectedIds.length > 0 && canManage && (
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11.5px] font-medium cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                批量删除 ({selectedIds.length})
              </button>
            )}
            <button
              onClick={() => onOpenNewClue && onOpenNewClue()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-[11.5px] font-medium cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              新建线索
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11.5px] text-slate-600">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-500 font-semibold select-none">
              <tr>
                <th className="py-2.5 pl-4 pr-2">
                  <input
                    type="checkbox"
                    checked={tasks.length > 0 && selectedIds.length === tasks.length}
                    onChange={toggleSelectAll}
                    className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">案件编号</th>
                <th className="py-2.5 px-3 whitespace-nowrap">标题</th>
                <th className="py-2.5 px-3 whitespace-nowrap">环节进度</th>
                <th className="py-2.5 px-3 whitespace-nowrap">优先级</th>
                <th className="py-2.5 px-3 whitespace-nowrap">负责人</th>
                <th className="py-2.5 px-3 whitespace-nowrap">结论</th>
                <th className="py-2.5 px-3 whitespace-nowrap">状态</th>
                <th className="py-2.5 pr-4 pl-3 whitespace-nowrap text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {error && !loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-2">
                    <LoadErrorBar message={error} onRetry={() => load()} />
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-2">
                    <LoadingCards rows={3} />
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-[12px] text-slate-400">
                    没有符合条件的核查任务
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${
                      selectedIds.includes(task.id) ? 'bg-blue-50/40' : ''
                    }`}
                    onClick={() => onSelectTask && onSelectTask(task)}
                  >
                    <td className="py-3 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(task.id)}
                        onChange={() => toggleSelectRow(task.id)}
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#2563EB] whitespace-nowrap">
                      {task.id}
                    </td>
                    <td className="py-3 px-3 min-w-[260px]">
                      <div className="font-medium text-slate-800 line-clamp-1">{task.title}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] text-slate-500 tabular-nums">
                          {task.stageProgress}
                        </span>
                        {renderStageDots(task.stageProgressNum)}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">{priorityBadge(task.priority)}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {task.assignee === '——' ? (
                        <span className="text-slate-300">——</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                            {task.assigneeInitial}
                          </span>
                          <span className="text-slate-600">{task.assignee}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          ['虚假', '基本错误'].includes(task.conclusion)
                            ? 'bg-rose-50 text-rose-600'
                            : task.conclusion === '误导'
                            ? 'bg-orange-50 text-orange-600'
                            : ['真实', '基本真实'].includes(task.conclusion)
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {task.conclusion}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {task.status === '已结案' ? (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          已结案
                        </span>
                      ) : task.stageProgressNum >= 8 ? (
                        <span className="text-blue-600 font-medium text-[11px]">报告生成</span>
                      ) : (
                        <span className="text-amber-600 font-medium text-[11px]">进行中</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 text-[11px]">
                        <button
                          onClick={() => onSelectTask && onSelectTask(task)}
                          className="text-slate-600 hover:text-blue-600 cursor-pointer"
                        >
                          查看
                        </button>
                        <span className="text-slate-300">·</span>
                        {task.status === '已结案' ? (
                          canDeposit ? (
                            <button
                              onClick={() => handleDepositRow(task)}
                              className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            >
                              沉淀
                            </button>
                          ) : (
                            <span className="text-slate-300">沉淀</span>
                          )
                        ) : canManage ? (
                          <button
                            onClick={() => handleDeleteRow(task)}
                            className="text-rose-500 hover:text-rose-600 cursor-pointer"
                          >
                            删除
                          </button>
                        ) : (
                          <span className="text-slate-300">删除</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-slate-100 text-[11px] text-slate-500">
          <span>
            已选 {selectedIds.length} 项 · 第 {currentPage}/{totalPages} 页 · 共 {total} 条
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-0.5">…</span>}
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[11px] cursor-pointer ${
                      currentPage === p
                        ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
