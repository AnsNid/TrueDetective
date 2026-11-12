import React, { useState, useMemo } from 'react';
import {
  ALL_TASKS,
  TaskItem,
} from '../../data/viewsData';
import {
  Search,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface TasksViewProps {
  onOpenNewClue?: () => void;
  onSelectTask?: (task: TaskItem) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  onOpenNewClue,
  onSelectTask,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'ongoing' | 'closed' | 'high_priority'>('all');
  const [searchKey, setSearchKey] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const filteredTasks = useMemo(() => {
    return ALL_TASKS.filter((t) => {
      if (filterTab === 'ongoing' && t.status === '已结案') return false;
      if (filterTab === 'closed' && t.status !== '已结案') return false;
      if (filterTab === 'high_priority' && t.priority !== '高') return false;

      if (searchKey.trim()) {
        const query = searchKey.toLowerCase();
        return (
          t.id.toLowerCase().includes(query) ||
          t.title.toLowerCase().includes(query) ||
          t.assignee.toLowerCase().includes(query) ||
          t.conclusion.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [filterTab, searchKey]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage]);

  const totalPages = Math.ceil(filteredTasks.length / pageSize) || 1;

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedTasks.map((t) => t.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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
                i < current ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] text-slate-500 tabular-nums ml-1">
          {current}/9
        </span>
      </div>
    );
  };

  const getConclusionBadge = (conclusion: string) => {
    switch (conclusion) {
      case '误导':
        return <span className="text-amber-600 font-semibold text-[11px]">误导</span>;
      case '疑似AI生成':
        return <span className="text-purple-600 font-semibold text-[11px]">疑似AI生成</span>;
      case '基本真实':
      case '真实':
        return <span className="text-emerald-600 font-semibold text-[11px]">{conclusion}</span>;
      case '虚假':
        return <span className="text-rose-600 font-semibold text-[11px]">虚假</span>;
      case '尚待核实':
        return <span className="text-blue-600 font-semibold text-[11px]">尚待核实</span>;
      default:
        return <span className="text-slate-500 font-medium text-[11px]">{conclusion}</span>;
    }
  };

  return (
    <div className="space-y-3.5">
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
          共 16 个案件 · 9 进行中 / 7 已结案 &nbsp;&nbsp;数据更新 2026-11-05 09:41
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">案件总数</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">16</span>
            <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1 py-0.2 rounded">
              本月新增 +8
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
            <span className="text-2xl font-extrabold text-[#2563EB] tabular-nums">9</span>
            <span className="text-[10px] text-slate-400">其中 6 个处于第 8 环节</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#2563EB] h-full rounded-full" style={{ width: '56%' }}></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">已结案</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">7</span>
            <span className="text-[10px] text-slate-400">结案率 44%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '44%' }}></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">平均环节耗时</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">2.4<span className="text-sm font-normal text-slate-500">h</span></span>
            <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1 py-0.2 rounded">
              较上月 -0.6h
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '68%' }}></div>
          </div>
        </div>
      </div>

      {/* Filter Bar & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-xs">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
          <button
            onClick={() => { setFilterTab('all'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterTab === 'all'
                ? 'bg-blue-50 text-[#2563EB] font-bold border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            全部 16
          </button>
          <button
            onClick={() => { setFilterTab('ongoing'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterTab === 'ongoing'
                ? 'bg-blue-50 text-[#2563EB] font-bold border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            进行中 9
          </button>
          <button
            onClick={() => { setFilterTab('closed'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterTab === 'closed'
                ? 'bg-blue-50 text-[#2563EB] font-bold border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            已结案 7
          </button>
          <button
            onClick={() => { setFilterTab('high_priority'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              filterTab === 'high_priority'
                ? 'bg-blue-50 text-[#2563EB] font-bold border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            优先级: 高 4
          </button>
          <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
          <span className="text-[11px] text-slate-400 hidden md:inline">负责人: 全部</span>
          <span className="text-[11px] text-slate-400 hidden md:inline ml-2">结论: 全部</span>
          <span className="text-[11px] text-slate-400 hidden md:inline ml-2">环节: 8/9</span>
        </div>

        {/* Right Search and New Clue Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKey}
              onChange={(e) => { setSearchKey(e.target.value); setCurrentPage(1); }}
              placeholder="搜索案件编号 / 标题"
              className="w-full pl-8 pr-3 py-1.5 text-[11.5px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-700"
            />
          </div>
          <button
            onClick={onOpenNewClue}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-[11.5px] font-medium rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            新建线索
          </button>
        </div>
      </div>

      {/* Case List Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
            <span className="font-bold text-[#0F172A] text-[12.5px]">案件列表</span>
          </div>
          <div className="text-slate-400">
            已选 {selectedIds.length} 项 · 按创建时间倒序
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11.5px] text-slate-600">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-500 font-semibold select-none">
              <tr>
                <th className="py-2.5 pl-4 pr-2 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedTasks.length && paginatedTasks.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-600 whitespace-nowrap">案件编号</th>
                <th className="py-2.5 px-3 font-semibold text-slate-600 min-w-[280px]">标题</th>
                <th className="py-2.5 px-3 font-semibold text-slate-600 whitespace-nowrap">环节进度</th>
                <th className="py-2.5 px-3 font-semibold text-slate-600 whitespace-nowrap">优先级</th>
                <th className="py-2.5 px-3 font-semibold text-slate-600 whitespace-nowrap">负责人</th>
                <th className="py-2.5 px-3 font-semibold text-slate-600 whitespace-nowrap">结论</th>
                <th className="py-2.5 px-3 font-semibold text-slate-600 whitespace-nowrap">状态</th>
                <th className="py-2.5 pr-4 pl-3 font-semibold text-slate-600 whitespace-nowrap text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTasks.map((task) => {
                const isSelected = selectedIds.includes(task.id);
                return (
                  <tr
                    key={task.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="py-3 pl-4 pr-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(task.id)}
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 tabular-nums font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {task.id}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 line-clamp-1">
                      {task.title}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {renderStageDots(task.stageProgressNum)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {task.priority === '高' ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          高
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                          中
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {task.assignee === '——' ? (
                        <span className="text-slate-300">——</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {task.assigneeInitial}
                          </span>
                          <span className="text-slate-700 text-[11px]">{task.assignee}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getConclusionBadge(task.conclusion)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {task.status === '已结案' ? (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          已结案
                        </span>
                      ) : (
                        <span className="text-blue-600 font-medium text-[11px]">
                          报告生成
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 text-[11px]">
                        <button
                          onClick={() => onSelectTask && onSelectTask(task)}
                          className="text-slate-600 hover:text-blue-600 cursor-pointer"
                        >
                          查看
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          onClick={() => {}}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {task.status === '已结案' ? '沉淀' : '删除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        <div className="px-4 py-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div>
            共 16 条 · 每页 12 条 · 支持批量推进与批量结案
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(1)}
              className={`w-6 h-6 rounded flex items-center justify-center text-[11px] ${
                currentPage === 1
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                  : 'hover:bg-slate-100'
              }`}
            >
              1
            </button>
            <button
              onClick={() => setCurrentPage(2)}
              className={`w-6 h-6 rounded flex items-center justify-center text-[11px] ${
                currentPage === 2
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                  : 'hover:bg-slate-100'
              }`}
            >
              2
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 3 Summary Cards (Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Card 1: 近 7 日新增与结案 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-[12px] text-[#0F172A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              近 7 日新增与结案
            </div>
            <span className="text-[10px] text-slate-400">日均 2.3 件</span>
          </div>

          <div className="mt-4 flex items-end justify-between gap-2 h-28 px-2">
            {[
              { day: '周一', val: 3, h: '50%' },
              { day: '周二', val: 5, h: '83%' },
              { day: '周三', val: 4, h: '66%' },
              { day: '周四', val: 6, h: '100%' },
              { day: '周五', val: 3, h: '50%' },
              { day: '周六', val: 2, h: '33%' },
              { day: '周日', val: 2, h: '33%' },
            ].map((col) => (
              <div key={col.day} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-slate-500 tabular-nums">{col.val}</span>
                <div className="w-full bg-blue-100/50 rounded-t-sm flex items-end h-20">
                  <div
                    className="w-full bg-[#3B82F6] rounded-t-sm transition-all"
                    style={{ height: col.h }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400">{col.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: 结论分布 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-[12px] text-[#0F172A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              结论分布
            </div>
            <span className="text-[10px] text-slate-400">16 个案件</span>
          </div>

          <div className="mt-3 space-y-2.5 text-[11px]">
            <div>
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <span>误导</span>
                <span className="font-bold tabular-nums text-amber-700">7</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#F97316] h-full rounded-full" style={{ width: '44%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <span>疑似 AI 生成</span>
                <span className="font-bold tabular-nums text-purple-700">3</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#A855F7] h-full rounded-full" style={{ width: '19%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <span>真实 / 基本真实</span>
                <span className="font-bold tabular-nums text-emerald-700">2</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#10B981] h-full rounded-full" style={{ width: '13%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <span>虚假 / 尚待核实 / 无法核查</span>
                <span className="font-bold tabular-nums text-slate-700">4</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: 待处理提醒 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-[12px] text-[#0F172A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              待处理提醒
            </div>
            <span className="text-[10px] text-slate-400">3 项</span>
          </div>

          <div className="mt-3 space-y-2 text-[11px]">
            <div className="flex items-center gap-2 p-2 rounded bg-rose-50/50 border border-rose-100">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white shrink-0">
                超时
              </span>
              <span className="text-slate-700 truncate">
                ZT-2026-0017 报告已超 4 小时未审核
              </span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded bg-amber-50/50 border border-amber-100">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shrink-0">
                待补证
              </span>
              <span className="text-slate-700 truncate">
                ZT-2026-0016 证据链完整度 62%
              </span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded bg-blue-50/50 border border-blue-100">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shrink-0">
                待分配
              </span>
              <span className="text-slate-700 truncate">
                ZT-2026-0021 尚未指派负责人
              </span>
            </div>

            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              超时案件自动升级至审核组，并记录在操作日志中。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
