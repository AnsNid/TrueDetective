import React from 'react';
import { X, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { OngoingCaseItem, PendingReviewItem } from '../data/dashboardData';

interface CaseDetailModalProps {
  selectedCase: OngoingCaseItem | null;
  selectedReview: PendingReviewItem | null;
  onClose: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  selectedCase,
  selectedReview,
  onClose,
}) => {
  if (!selectedCase && !selectedReview) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="案件核查详情"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <h3 className="text-[15px] font-bold text-[#0F172A]">
              {selectedCase ? '进行中案件核查详情' : '待人工审核案件详情'}
            </h3>
          </div>
          <button
            type="button"
            aria-label="关闭详情弹窗"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {selectedCase ? (
          <div className="mt-4 space-y-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">案件编号</span>
              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                {selectedCase.caseId}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">核查标题</span>
              <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                {selectedCase.title}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-[11px] text-slate-400 block">负责人</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {selectedCase.owner}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-[11px] text-slate-400 block">当前环节进度</span>
                <span className="font-semibold text-[#2563EB] mt-0.5 block tabular-nums">
                  {selectedCase.progressCurrent} / {selectedCase.progressTotal} (报告生成)
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-[11px] text-slate-400 block">初步判定结论</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {selectedCase.conclusion}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {selectedReview ? (
          <div className="mt-4 space-y-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">案件编号</span>
              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                {selectedReview.caseId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">提交人</span>
              <span className="font-semibold text-slate-800">
                {selectedReview.submitter}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">剩余审核时限</span>
              <span className="font-semibold text-[#EF4444] flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                {selectedReview.remainingTime}
              </span>
            </div>
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-3 text-[12px] text-amber-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>该案件已完成前八个自动化核查环节，请终审人员复核交叉验证证据链并签署人工审核意见。</span>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[12.5px] font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            关闭
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2563EB] text-white text-[12.5px] font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            进入核查工作流
          </button>
        </div>
      </div>
    </div>
  );
};
