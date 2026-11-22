import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  RefreshCw,
  FileDown,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Layers,
  Search,
  FileText,
  Check,
  AlertTriangle,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Sparkles,
  Plus,
  Eye,
  Info,
} from 'lucide-react';
import {
  FullCaseDetail,
} from '../../data/caseDetailsData';
import { api, clearSavedToken } from '../../api/client';
import { AuthenticatedUser } from '../LoginPage';
import { hasPerm } from '../../auth/permissions';

interface CaseDetailWorkbenchProps {
  caseId: string;
  currentUser: AuthenticatedUser;
  onBack: () => void;
  onDeleteCase?: (caseId: string) => void;
  onUpdateCaseStatus?: (caseId: string, status: string, conclusion: string) => void;
}

export const CaseDetailWorkbench: React.FC<CaseDetailWorkbenchProps> = ({
  caseId,
  currentUser,
  onBack,
  onDeleteCase,
  onUpdateCaseStatus,
}) => {
  // 案件全量详情:从后端加载;失败展示错误态(不再编造占位数据)
  const [loadedCase, setLoadedCase] = useState<FullCaseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  // 请求序号守卫:caseId 切换后旧响应直接丢弃,避免竞态串案
  const detailSeq = React.useRef(0);
  const loadCaseDetail = React.useCallback(() => {
    const seq = ++detailSeq.current;
    setDetailLoading(true);
    setDetailError(null);
    api
      .caseDetail(caseId)
      .then((res) => {
        if (seq !== detailSeq.current) return;
        if (res.code === 200 && res.data) {
          setLoadedCase(res.data as FullCaseDetail);
        } else {
          setDetailError(res.message || '案件加载失败');
        }
      })
      .finally(() => {
        if (seq === detailSeq.current) setDetailLoading(false);
      });
  }, [caseId]);

  useEffect(() => {
    setLoadedCase(null);
    loadCaseDetail();
  }, [loadCaseDetail]);

  // State for interactive execution
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runningStepMsg, setRunningStepMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLogDrawer, setShowLogDrawer] = useState(false);

  // Review Form States
  const [reviewerName, setReviewerName] = useState(currentUser.displayName || '张明');
  const [reviewAction, setReviewAction] = useState<'approved' | 'revised' | 'returned'>('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [revisedConclusion, setRevisedConclusion] = useState('');
  const [revisedConfidence, setRevisedConfidence] = useState('');
  const [checkItems, setCheckItems] = useState<{ [key: string]: boolean }>({});
  // 审核清单由后端下发,加载后初始化勾选;清单为空时清空勾选,避免跨案件残留
  useEffect(() => {
    const checklist: string[] = (loadedCase as any)?.review_checklist || [];
    setCheckItems(checklist.length ? Object.fromEntries(checklist.map((item) => [item, true])) : {});
  }, [loadedCase]);

  // Trigger feedback toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Pipeline step definitions
  const STAGES = [
    { num: 1, name: '线索接收' },
    { num: 2, name: '价值初筛' },
    { num: 3, name: '主张拆解' },
    { num: 4, name: '多语种检索' },
    { num: 5, name: '出处追踪' },
    { num: 6, name: '交叉验证' },
    { num: 7, name: '信源评价' },
    { num: 8, name: '报告生成' },
    { num: 9, name: '人工审核' },
  ];

  // One-click Auto Verification (Steps 2-8, 逐环节调用后端流水线)
  const handleRunAutoPipeline = async () => {
    if (isRunningAll) return;
    setIsRunningAll(true);
    triggerToast('开始执行全流程自动核查（环节 2-8）...');

    const stepNames: Record<number, string> = {
      2: '价值初筛',
      3: '主张拆解',
      4: '多语种检索',
      5: '出处追踪',
      6: '交叉验证',
      7: '信源评价',
      8: '报告生成',
    };
    const from = Math.max(2, caseData.stage + 1);

    try {
      let allDone = true;
      for (let step = from; step <= 8; step++) {
        setRunningStepMsg(`正在执行: 环节 ${step} · ${stepNames[step]}...`);
        const res = await api.runPipeline(caseData.case_no, step);
        if (res.code === 200 && res.data?.detail) {
          setLoadedCase(res.data.detail as FullCaseDetail);
        } else if (res.code === 401) {
          clearSavedToken();
          triggerToast('登录凭证已失效,请重新登录后操作');
          allDone = false;
          break;
        } else {
          triggerToast(res.message || `环节 ${step} 执行失败`);
          allDone = false;
          break;
        }
      }
      if (allDone) {
        triggerToast('自动核查完成！已生成报告，等待环节 9 人工审核终审。');
      }
    } finally {
      setRunningStepMsg(null);
      setIsRunningAll(false);
    }
  };

  // 单环节重算进行中的环节号(防连点/可视化)
  const [rerunningStep, setRerunningStep] = useState<number | null>(null);

  // Re-run single step (调用后端重算并持久化)
  const handleRerunStep = async (stepNum: number, stepName: string) => {
    if (rerunningStep !== null || isRunningAll) return;
    setRerunningStep(stepNum);
    triggerToast(`正在重新执行环节 ${stepNum}：${stepName}...`);
    try {
      const res = await api.runPipeline(caseData.case_no, stepNum);
      if (res.code === 200 && res.data?.detail) {
        setLoadedCase(res.data.detail as FullCaseDetail);
        triggerToast(`环节 ${stepNum} (${stepName}) 重新计算完成！`);
      } else {
        triggerToast(res.message || `环节 ${stepNum} 重新计算失败`);
      }
    } finally {
      setRerunningStep(null);
    }
  };

  // Submit Human Review (Stage 9, 持久化到后端)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      triggerToast('请填写审核意见');
      return;
    }

    const selectedCheckItems = Object.entries(checkItems)
      .filter(([_, checked]) => checked)
      .map(([key]) => key);

    setSubmittingReview(true);
    try {
      const res = await api.submitReview(caseData.case_no, {
        action: reviewAction,
        comment: reviewComment.trim(),
        checkItems: selectedCheckItems,
        conclusion: revisedConclusion,
        confidence: revisedConfidence,
      });
      if (res.code === 200 && res.data?.detail) {
        const detail = res.data.detail as FullCaseDetail;
        setLoadedCase(detail);
        setReviewComment('');
        // 是否结案以后端返回状态为准: 四级审核流中 level<4 通过只是流转下一级,并非结案
        const done = detail.status === 'done';
        triggerToast(done ? '终审通过！案件已结案归档。' : res.message || '审核记录已保存。');
        if (onUpdateCaseStatus) {
          onUpdateCaseStatus(
            caseData.case_no,
            done ? '已结案' : '进行中',
            detail.final_conclusion ?? caseData.final_conclusion
          );
        }
      } else {
        triggerToast(res.message || '审核提交失败');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  // Copy text helper
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast('已复制到剪贴板');
  };

  // ===== 报告导出(PDF / Word,后端文件流) =====
  const [exporting, setExporting] = useState<'' | 'pdf' | 'docx'>('');
  const handleExport = async (format: 'pdf' | 'docx') => {
    if (exporting) return;
    setExporting(format);
    try {
      const ok = await api.exportReport(caseId, format);
      triggerToast(ok ? `已导出${format === 'pdf' ? ' PDF' : ' Word'}版核查报告` : '导出失败,请稍后重试');
    } finally {
      setExporting('');
    }
  };

  // ===== 报告人工编辑(驳回修改中 / 未进入审核时) =====
  const [reportEditing, setReportEditing] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportDraft, setReportDraft] = useState({
    preliminary_conclusion: '',
    summary: '',
    conclusion: '',
    confidence: '',
  });

  const openReportEditor = () => {
    if (!caseData.report) return;
    setReportDraft({
      preliminary_conclusion: caseData.report.preliminary_conclusion,
      summary: caseData.report.summary,
      conclusion: caseData.report.conclusion,
      confidence: caseData.report.confidence,
    });
    setReportEditing(true);
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingReport) return;
    setSavingReport(true);
    try {
      const res = await api.updateReport(caseId, reportDraft);
      if (res.code === 200 && res.data?.detail) {
        setLoadedCase(res.data.detail);
        setReportEditing(false);
        triggerToast('报告已保存');
      } else {
        triggerToast(res.message || '保存失败');
      }
    } finally {
      setSavingReport(false);
    }
  };

  /** 报告修改完成 -> 重新提交人工审核(工作室案件从头逐级重审) */
  const handleSubmitReport = async () => {
    if (submittingReport) return;
    setSubmittingReport(true);
    try {
      const res = await api.submitReport(caseId);
      if (res.code === 200 && res.data?.detail) {
        setLoadedCase(res.data.detail);
        triggerToast('已重新提交人工审核,从「成员」级重新逐级审核');
      } else {
        triggerToast(res.message || '提交失败');
      }
    } finally {
      setSubmittingReport(false);
    }
  };

  // 沉淀为教学案例(已结案;二次确认 + 防连点)
  const [depositing, setDepositing] = useState(false);
  const handleDeposit = async () => {
    if (depositing) return;
    if (!window.confirm(`确定将案件 ${caseData.case_no} 沉淀为知识库教学案例吗？`)) return;
    setDepositing(true);
    try {
      const res = await api.depositCase(caseData.case_no);
      triggerToast(res.code === 200 ? '已沉淀为知识库教学案例' : res.message || '沉淀失败');
      if (res.code === 200) {
        loadCaseDetail();
      }
    } finally {
      setDepositing(false);
    }
  };

  // 删除案件(管理员)
  const handleDelete = async () => {
    if (!window.confirm(`确定删除案件 ${caseData.case_no} 吗？`)) return;
    const res = await api.deleteCase(caseData.case_no);
    if (res.code === 200) {
      if (onDeleteCase) onDeleteCase(caseData.case_no);
      onBack();
    } else {
      triggerToast(res.message || '删除失败');
    }
  };

  // 加载失败:错误态(所有 hooks 之后)
  if (!loadedCase) {
    if (detailError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-[14px] font-bold text-slate-700">案件加载失败</div>
          <div className="text-[12px] text-slate-400 max-w-md text-center">{detailError}</div>
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={loadCaseDetail}
              className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-[12px] font-semibold cursor-pointer"
            >
              重新加载
            </button>
            <button
              type="button"
              onClick={onBack}
              className="text-[12px] text-slate-500 hover:text-slate-700 underline cursor-pointer"
            >
              返回列表
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs animate-pulse space-y-3">
            <div className="h-3.5 w-48 bg-slate-100 rounded" />
            <div className="h-3 w-3/4 bg-slate-50 rounded" />
            <div className="h-3 w-2/3 bg-slate-50 rounded" />
          </div>
        ))}
        <div className="flex items-center justify-center gap-2 py-4 text-slate-400 text-[12px]">
          <RefreshCw className="w-4 h-4 animate-spin" />
          正在加载案件 {caseId}…
        </div>
      </div>
    );
  }

  const caseData = loadedCase;
  // 四级审核流:当前账号级别(工作室 1-4;教学/未知 0)
  const myReviewLevel =
    { member: 1, minister: 2, studio_lead: 3, super_admin: 4 }[currentUser.role ?? ''] ?? 0;
  const isStudioCase = (caseData.system ?? 'studio') === 'studio';
  const currentReviewLevel = caseData.review_level ?? 1;
  const isSuper = currentUser.role === 'super_admin';
  // 可执行当前审核:有审核权限 && 未结案 && 非驳回修改中 && (教学单级 || 级别匹配 || 超管越级)
  const canReview =
    hasPerm(currentUser.permissions, 'case.review') &&
    caseData.status !== 'done' &&
    caseData.report_editing !== true &&
    (!isStudioCase || isSuper || myReviewLevel === currentReviewLevel);
  const canManage = hasPerm(currentUser.permissions, 'case.delete');
  const isImageClue = caseData.clue.content_type === 'image';
  const lastReturnedReview = (caseData.reviews ?? []).find((r) => r.action === 'returned');
  const canEditReport =
    !!caseData.report &&
    caseData.status !== 'done' &&
    (caseData.report_editing === true || (caseData.reviews ?? []).length === 0);

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-6 z-50 px-4 py-2.5 rounded-lg bg-[#0F172A] text-white text-[12px] shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-3 text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 详情刷新失败提示(仍展示上次成功数据) */}
      {detailError && loadedCase ? (
        <div className="px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-700 flex items-center justify-between">
          <span>⚠ {detailError}(当前展示上次加载的数据)</span>
          <button
            type="button"
            onClick={loadCaseDetail}
            className="text-xs font-medium underline ml-4 cursor-pointer shrink-0"
          >
            重新加载
          </button>
        </div>
      ) : null}

      {/* Top Breadcrumb & Action Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回列表
          </button>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <span className="text-[12px] text-slate-400">核查任务</span>
          <span className="text-[12px] text-slate-300">/</span>
          <span className="text-[12px] text-slate-500">案件详情</span>
          <span className="text-[12px] text-slate-300">/</span>
          <span className="font-mono text-[12px] font-bold text-[#2563EB]">
            {caseData.case_no}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunAutoPipeline}
            disabled={isRunningAll}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white shadow-xs transition-colors cursor-pointer ${
              isRunningAll
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-[#2563EB] hover:bg-blue-700'
            }`}
          >
            {isRunningAll ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            一键自动核查 (环节 2-8)
          </button>

          {/* 报告导出: PDF / Word 双版本(报告已生成即可导出) */}
          {caseData.report && (
            <>
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting !== ''}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FileDown className={`w-3.5 h-3.5 text-slate-500 ${exporting === 'pdf' ? 'animate-pulse' : ''}`} />
                {exporting === 'pdf' ? '导出中…' : '导出 PDF'}
              </button>
              <button
                onClick={() => handleExport('docx')}
                disabled={exporting !== ''}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FileDown className={`w-3.5 h-3.5 text-slate-500 ${exporting === 'docx' ? 'animate-pulse' : ''}`} />
                {exporting === 'docx' ? '导出中…' : '导出 Word'}
              </button>
            </>
          )}

          {caseData.status === 'done' && hasPerm(currentUser.permissions, 'case.review') && (
            <button
              onClick={handleDeposit}
              disabled={depositing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Layers className="w-3.5 h-3.5" />
              {depositing ? '沉淀中…' : '沉淀为教学案例'}
            </button>
          )}

          {onDeleteCase && canManage && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-[12px] transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除
            </button>
          )}
        </div>
      </div>

      {/* Case Header Meta Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-[280px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] font-bold text-slate-500">
                {caseData.case_no}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                  caseData.priority === '高'
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}
              >
                优先级: {caseData.priority}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                负责人: {caseData.assignee || '未指派'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                  caseData.status === 'done'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {caseData.status === 'done' ? '已结案' : `进行中 · 环节 ${caseData.stage}/9`}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-white shadow-xs">
                结论: {caseData.final_conclusion}
              </span>
            </div>
            <h1 className="text-[17px] sm:text-[19px] font-extrabold text-[#0F172A] leading-snug">
              {caseData.title}
            </h1>
          </div>

          {/* Quick Rerun Individual Steps */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-medium mr-1">
              {rerunningStep !== null ? `环节 ${rerunningStep} 重算中…` : '单环节重算:'}
            </span>
            {([[2, '初筛'], [3, '拆解'], [4, '检索'], [5, '出处'], [6, '交叉'], [7, '信源'], [8, '报告']] as [number, string][]).map(([n, label]) => (
              <button
                key={n}
                onClick={() => handleRerunStep(n, STAGES.find((s) => s.num === n)?.name ?? '')}
                disabled={rerunningStep !== null || isRunningAll}
                className={`px-2 py-1 bg-white rounded border border-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  rerunningStep === n ? 'text-blue-600 border-blue-300 animate-pulse' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {n}.{label}
              </button>
            ))}
          </div>
        </div>

        {/* 9-Node Pipeline Step Indicator */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 mb-2.5 flex items-center justify-between">
            <span>9 环节推进全流程</span>
            {runningStepMsg && (
              <span className="text-blue-600 font-bold flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                {runningStepMsg}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 sm:gap-2">
            {STAGES.map((s) => {
              const isPast = caseData.stage > s.num;
              const isCurrent = caseData.stage === s.num;
              return (
                <div
                  key={s.num}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                      : isPast
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-white border-dashed border-slate-200 text-slate-400 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    ) : isCurrent ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                        {s.num}
                      </span>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 text-[9px] font-bold flex items-center justify-center">
                        {s.num}
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[11px] truncate font-medium ${
                      isCurrent ? 'text-blue-700 font-bold' : isPast ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {s.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Running Log Drawer Toggle */}
        <div className="pt-2">
          <button
            onClick={() => setShowLogDrawer(!showLogDrawer)}
            className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
          >
            <span>流水日志 ({caseData.running_log.length} 条)</span>
            {showLogDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showLogDrawer && (
            <div className="mt-2.5 p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] space-y-1.5 max-h-48 overflow-y-auto">
              {caseData.running_log.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400">✓ [环节{log.stage} · {log.name}]</span>
                  <span className="text-slate-300">{log.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Main Investigation Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (8 cols): Evidence, Claims, Report */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card 1: 待核查材料 */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-[13px] font-bold text-[#0F172A] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                待核查原始材料
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>{caseData.clue.source_platform || '外网来源'}</span>
                {caseData.clue.source_account && (
                  <span className="font-mono text-slate-600">{caseData.clue.source_account}</span>
                )}
                {caseData.clue.source_link && (
                  <a
                    href={caseData.clue.source_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    原文链接 <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Clue Image (image/video 线索) */}
            {caseData.clue.image_url && (
              <div className="space-y-1.5">
                <div className="text-[11px] text-slate-500 font-medium">线索图片</div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-center">
                  <img
                    src={caseData.clue.image_url}
                    alt={caseData.clue.title}
                    referrerPolicy="no-referrer"
                    className="max-h-72 rounded border border-slate-200 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Raw Text Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>原文内容 ({caseData.clue.content_type === 'image' ? '图片线索说明' : '外文原文'})</span>
                <button
                  onClick={() => handleCopyText(caseData.clue.raw_text)}
                  className="flex items-center gap-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> 复制
                </button>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[12px] leading-relaxed text-slate-800 font-serif whitespace-pre-wrap max-h-64 overflow-y-auto">
                {caseData.clue.raw_text}
              </div>
            </div>

            {/* Translated Text Box (if text) */}
            {caseData.clue.translated_text && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>中文对照翻译 (LLM 自动译文)</span>
                  <button
                    onClick={() => handleCopyText(caseData.clue.translated_text)}
                    className="flex items-center gap-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> 复制
                  </button>
                </div>
                <div className="p-3 bg-blue-50/40 rounded-lg border border-blue-100 text-[12px] leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {caseData.clue.translated_text}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: 价值初筛 & 图片真实性核查 */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-[13px] font-bold text-[#0F172A] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                环节 2 · 价值初筛结论
              </h2>
              {caseData.screening_result && caseData.screening_result.score !== undefined ? (
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    caseData.screening_result.method === 'llm'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  初筛得分: {caseData.screening_result.score}/100 ·{' '}
                  {caseData.screening_result.passed ? '通过' : '未通过'} ·{' '}
                  {caseData.screening_result.method === 'llm' ? 'LLM' : '模板'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                  未执行
                </span>
              )}
            </div>

            {!caseData.screening_result || caseData.screening_result.score === undefined ? (
              <div className="py-5 text-center text-[12px] text-slate-400">
                尚未执行价值初筛，请点击上方「2.初筛」或一键自动核查。
              </div>
            ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11.5px]">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                <div className="text-slate-400 text-[10.5px]">关注领域</div>
                <div className="font-bold text-slate-800">{caseData.screening_result.focus}</div>
                <div className="text-slate-500 text-[10.5px] mt-1">
                  评定方式:{' '}
                  {caseData.screening_result.method === 'llm'
                    ? 'LLM 智能初筛'
                    : '关键词模板初筛(LLM 未启用时降级)'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                <div className="text-slate-400 text-[10.5px]">命中敏感关键词</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {caseData.screening_result.hit_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-[12px] text-slate-700 bg-slate-50/70 p-3 rounded-lg border border-slate-200/60 leading-relaxed">
              <span className="font-bold text-slate-800">初筛理由: </span>
              {caseData.screening_result.reason}
            </div>
            </>
            )}

            {/* If Image Clue: Image Authenticity Analysis */}
            {caseData.screening_result?.image_analysis && (
              <div className="mt-3 p-3.5 bg-purple-50/50 rounded-xl border border-purple-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 text-[12px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    多模态图片真实性检测
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-bold text-[10.5px]">
                    判定: {
                      ({
                        real_scene: '真实现场图',
                        ai_generated: '疑似AI生成',
                        ps_edited: '疑似旧图篡改',
                        old_image_reuse: '疑似旧图新用',
                        unclear: '待人工判定',
                      } as Record<string, string>)[caseData.screening_result.image_analysis.suspected] ?? '待人工判定'
                    }
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-800">画面场景: </span>
                  {caseData.screening_result.image_analysis.scene_description}
                </p>
                <div className="text-[11.5px] text-slate-700">
                  <span className="font-semibold text-slate-800">可疑特征点:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600">
                    {caseData.screening_result.image_analysis.authenticity_clues.map((clue, idx) => (
                      <li key={idx}>{clue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: 事实主张拆解 (Stage 3) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                <h2 className="text-[13px] font-bold text-[#0F172A]">
                  环节 3 · 事实主张拆解 ({caseData.claims.length} 项)
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 font-medium">
                  指控表述 ★
                </span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-medium">
                  事实主张
                </span>
                <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200 font-medium">
                  观点表达
                </span>
              </div>
            </div>

            {caseData.claims.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-slate-400">
                当前线索为纯图片溯源，无文字主张拆解。
              </div>
            ) : (
              <div className="space-y-3">
                {caseData.claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          #{claim.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                            claim.type === 'allegation'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {claim.type === 'allegation' ? '指控表述 ★' : '事实主张'}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-slate-400">自动要素抽取</span>
                    </div>

                    <div className="text-[12px] font-medium text-slate-800 leading-relaxed">
                      {claim.text}
                    </div>

                    {/* Decomposed 5W1H Elements */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                      {Object.entries(claim.elements).map(([key, val]) => (
                        <div key={key} className="bg-white p-2 rounded border border-slate-200/70">
                          <span className="text-slate-400 text-[10px] block">{key}</span>
                          <span className="font-medium text-slate-700 mt-0.5 block truncate">
                            {val || '——'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: 多语种检索结果 (Stage 4) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                <h2 className="text-[13px] font-bold text-[#0F172A]">
                  环节 4 · 多语种检索结果 ({caseData.search_results.length} 条)
                </h2>
              </div>
              {(caseData as any).pipeline_meta?.search === 'search' ? (
                <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                  Tavily 联网检索
                </span>
              ) : (caseData as any).pipeline_meta?.search === 'skip' ? (
                <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                  纯图片线索 · 跳过
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                  联网搜索未启用
                </span>
              )}
            </div>

            {/* Keywords */}
            {Object.keys(caseData.keywords ?? {}).length > 0 && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                <div className="text-[10.5px] text-slate-400 font-medium">检索关键词</div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(caseData.keywords)
                    .filter(([, v]) => v)
                    .map(([lang, kw]) => (
                      <span
                        key={lang}
                        className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10.5px] text-slate-600"
                      >
                        <span className="text-slate-400 font-bold uppercase mr-1">{lang}</span>
                        {kw}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {caseData.search_results.length === 0 ? (
              <div className="py-5 text-center text-[12px] text-slate-400">
                {(caseData as any).pipeline_meta?.search === 'skip'
                  ? '纯图片线索，跳过文本检索。'
                  : '暂无检索结果。联网搜索由 TAVILY_API_KEY 启用，未配置时本环节不产出数据。'}
              </div>
            ) : (
              <div className="space-y-2">
                {caseData.search_results.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[12px] text-blue-600 hover:underline font-medium leading-snug"
                        >
                          {r.title || r.url}
                        </a>
                      ) : (
                        <span className="text-[12px] font-medium text-slate-700">{r.title}</span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-500 whitespace-nowrap shrink-0">
                        {r.source}
                        {r.date ? ` · ${r.date}` : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{r.snippet}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: 出处追踪 (Stage 5) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                <h2 className="text-[13px] font-bold text-[#0F172A]">
                  环节 5 · 出处追踪 ({caseData.trace_results.length} 条)
                </h2>
              </div>
              {(caseData as any).pipeline_meta?.trace === 'search' ? (
                <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                  标题精确检索
                </span>
              ) : (caseData as any).pipeline_meta?.trace === 'unavailable' ? (
                <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                  {isImageClue ? '反向搜图未启用' : '联网搜索未启用'}
                </span>
              ) : null}
            </div>

            {caseData.trace_results.length === 0 ? (
              <div className="py-5 text-center text-[12px] text-slate-400">尚未执行出处追踪。</div>
            ) : (
              <div className="space-y-2">
                {caseData.trace_results.map((t, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border space-y-1 ${
                      t.warning
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {t.url ? (
                          <a
                            href={t.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[12px] text-blue-600 hover:underline font-medium leading-snug"
                          >
                            {t.matched_title || t.url}
                          </a>
                        ) : (
                          <span className="text-[12px] font-medium text-slate-700">
                            {t.matched_title}
                          </span>
                        )}
                        <div className="text-[10.5px] text-slate-400 mt-0.5">
                          {t.matched_site}
                          {t.published_date ? ` · 最早 ${t.published_date}` : ''}
                        </div>
                      </div>
                      {t.url && (
                        <a
                          href={t.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-[11px] flex items-center gap-0.5 shrink-0"
                        >
                          打开 <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {t.note && (
                      <p className="text-[11px] text-slate-500 leading-relaxed">{t.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: 证据矩阵与交叉验证 (Stage 6) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                <h2 className="text-[13px] font-bold text-[#0F172A]">
                  环节 6 · 证据矩阵与交叉验证 ({caseData.evidence.length} 条)
                </h2>
              </div>
              <div className="text-[11px] text-slate-500">
                {Object.entries(caseData.verification_results?.relation_stats ?? {}).map(
                  ([rel, n], i) => (
                    <span key={rel}>
                      {i > 0 && ' · '}
                      {rel}:{' '}
                      <span
                        className={`font-bold ${
                          rel === '支持'
                            ? 'text-emerald-600'
                            : rel === '反驳'
                              ? 'text-rose-600'
                              : 'text-slate-600'
                        }`}
                      >
                        {n}
                      </span>
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Evidence Matrix Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-[11.5px] text-slate-600">
                <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">信源机构</th>
                    <th className="py-2.5 px-3 min-w-[220px]">证据标题 / 链接</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">信源类型</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">关系</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">可信度</th>
                    <th className="py-2.5 px-3 min-w-[160px]">摘要核心</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {caseData.evidence.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                        {ev.source_org}
                      </td>
                      <td className="py-2.5 px-3">
                        {ev.url ? (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 font-medium line-clamp-1"
                          >
                            {ev.name} <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="font-medium text-slate-700">{ev.name}</span>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {ev.publish_date || '未注明发布日期'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          {ev.source_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            ev.relation === '支持'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ev.relation === '反驳'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ev.relation}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-emerald-600">
                        {ev.reliability}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] line-clamp-2">
                        {ev.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 5: 智能核查报告 (Stage 8) */}
          {caseData.report && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                  <h2 className="text-[13px] font-bold text-[#0F172A]">
                    环节 8 · 智能事实核查报告
                  </h2>
                  {caseData.report_editing ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                      驳回 · 报告修改中
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    初步结论: {caseData.report.conclusion}
                  </span>
                  <span className="text-slate-400">置信度: {caseData.report.confidence}</span>
                  {!reportEditing && (
                    <button
                      type="button"
                      onClick={openReportEditor}
                      disabled={!canEditReport}
                      title={canEditReport ? '人工修改 AI 生成文本' : '报告已进入审核流程,编辑需先由审核人驳回'}
                      className="px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      编辑报告
                    </button>
                  )}
                </div>
              </div>

              {/* 驳回提示: 最近一条驳回意见 + 重新提交入口 */}
              {caseData.report_editing === true && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-2">
                  <div className="text-[11.5px] text-rose-700 leading-relaxed">
                    <b>{lastReturnedReview ? `${lastReturnedReview.reviewer}(${lastReturnedReview.levelLabel ?? '终审'})驳回: ` : '审核驳回: '}</b>
                    {lastReturnedReview?.comment ?? '请修改报告后重新提交。'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSubmitReport}
                      disabled={submittingReport}
                      className="px-3 py-1 rounded bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-[11.5px] transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {submittingReport ? '提交中…' : '修改完成,重新提交人工审核'}
                    </button>
                    <span className="text-[10.5px] text-rose-400">
                      重新提交后{isStudioCase ? '将从「成员」级从头逐级重审' : '将重新进入终审'}
                    </span>
                  </div>
                </div>
              )}

              {reportEditing ? (
                <form onSubmit={handleSaveReport} className="space-y-3 text-[12px]">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">结论</label>
                      <select
                        value={reportDraft.conclusion}
                        onChange={(e) => setReportDraft({ ...reportDraft, conclusion: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {['真实', '基本真实', '缺乏语境', '误导', '基本错误', '虚假', '尚待核实', '无法核查', '疑似AI生成', '无法判断'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">置信度</label>
                      <select
                        value={reportDraft.confidence}
                        onChange={(e) => setReportDraft({ ...reportDraft, confidence: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {['高', '较高', '中', '低'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">核查综述</label>
                    <textarea
                      rows={4}
                      value={reportDraft.summary}
                      onChange={(e) => setReportDraft({ ...reportDraft, summary: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">判定依据</label>
                    <textarea
                      rows={3}
                      value={reportDraft.preliminary_conclusion}
                      onChange={(e) => setReportDraft({ ...reportDraft, preliminary_conclusion: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReportEditing(false)}
                      className="px-3 py-1 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-[11.5px] cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={savingReport}
                      className="px-3 py-1 bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-[11.5px] cursor-pointer disabled:cursor-not-allowed"
                    >
                      {savingReport ? '保存中…' : '保存修改'}
                    </button>
                  </div>
                </form>
              ) : (
              <div>
              {/* Preliminary Conclusion Banner */}
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-[12px] leading-relaxed text-slate-800 space-y-1.5">
                <div className="font-bold text-[#2563EB] flex items-center gap-1.5 text-[12.5px]">
                  <FileText className="w-3.5 h-3.5" />
                  核查综述与结论定性
                </div>
                <p className="text-slate-700">{caseData.report.summary}</p>
                <div className="text-[11.5px] text-slate-600 pt-1 border-t border-blue-100/80">
                  <span className="font-semibold text-slate-800">判定依据: </span>
                  {caseData.report.preliminary_conclusion}
                </div>
              </div>
              </div>
              )}

              {/* Evidence Gaps & Pending Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11.5px]">
                <div className="p-3 bg-amber-50/40 rounded-lg border border-amber-200/60">
                  <div className="font-bold text-amber-800 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    证据缺失项 (Gaps)
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    {caseData.report.gaps.map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-blue-50/40 rounded-lg border border-blue-200/60">
                  <div className="font-bold text-blue-800 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    建议人工复核事项
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    {caseData.report.pending_items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Source Evaluation, Human Review Form & History */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card: 信源六维评价 (Stage 7) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-[12.5px] font-bold text-[#0F172A] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                环节 7 · 信源六维评级
              </h3>
              <span className="text-[10px] text-slate-400">A/B/C 三级</span>
            </div>

            {caseData.source_evals.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-slate-400">
                引用官方中方信源，自动评定为 A 级信源。
              </div>
            ) : (
              <div className="space-y-3">
                {caseData.source_evals.map((se) => (
                  <div
                    key={se.evidence_id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate max-w-[180px]">
                        {se.source_org}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          se.grade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : se.grade === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {se.grade} 级信源
                      </span>
                    </div>

                    {/* 6 dimensions mini grid */}
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500">
                      <div>接近度: <b className="text-slate-700">{se.dimensions.接近事件程度}</b></div>
                      <div>专业性: <b className="text-slate-700">{se.dimensions.专业性}</b></div>
                      <div>透明度: <b className="text-slate-700">{se.dimensions.透明度}</b></div>
                      <div>时效性: <b className="text-slate-700">{se.dimensions.时效性}</b></div>
                      <div>立场: <b className="text-slate-700">{se.dimensions.立场与倾向性}</b></div>
                      <div>准确性: <b className="text-slate-700">{se.dimensions.涉华表述准确性}</b></div>
                    </div>

                    <p className="text-[10.5px] text-slate-500 leading-snug pt-1 border-t border-slate-200/50">
                      {se.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: 人工审核（环节 9 · 四级串行审核流） */}
          <div className="bg-white border-2 border-blue-500/30 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <h3 className="text-[13px] font-bold text-[#0F172A]">
                  环节 9 · 人工审核
                </h3>
              </div>
              <span className="text-[11px] text-blue-600 font-semibold">
                {caseData.status === 'done'
                  ? '✓ 已结案归档'
                  : caseData.report_editing
                  ? '报告修改中'
                  : caseData.review_level_label ?? '待审核'}
              </span>
            </div>

            {/* 四级审核进度: 成员 → 部长 → 负责人 → 超管(教学案件单级终审) */}
            {isStudioCase ? (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((lv) => {
                  const labels = ['', '成员', '部长', '负责人', '超管'] as const;
                  const done = caseData.status === 'done' || lv < currentReviewLevel;
                  const active = caseData.status !== 'done' && !caseData.report_editing && lv === currentReviewLevel;
                  return (
                    <div key={lv} className="flex-1 flex items-center gap-1">
                      <div
                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10.5px] font-bold border ${
                          done
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : active
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        {done ? '✓' : active ? '●' : lv}
                        {labels[lv]}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5">
                教学实训案件 · 单级终审
              </div>
            )}

            {/* 驳回修改中提示 */}
            {caseData.report_editing === true && caseData.status !== 'done' && (
              <div className="py-2 px-3 rounded-lg bg-rose-50 border border-rose-200 text-[11.5px] text-rose-600 text-center">
                报告被驳回修改中 —— 请在「环节 8 · 报告」修改并重新提交后继续审核。
              </div>
            )}

            {!canReview ? (
              caseData.status === 'done' ? (
                <div className="py-3 px-3 rounded-lg bg-slate-50 border border-slate-200 text-[12px] text-slate-500 text-center">
                  案件已结案,审核流程完成。
                </div>
              ) : !hasPerm(currentUser.permissions, 'case.review') ? (
                <div className="py-3 px-3 rounded-lg bg-slate-50 border border-slate-200 text-[12px] text-slate-500 text-center">
                  审核需工作室体系账号,当前账号为「{currentUser.roleLabel}」,仅可查看审核记录。
                </div>
              ) : (
                <div className="py-3 px-3 rounded-lg bg-slate-50 border border-slate-200 text-[12px] text-slate-500 text-center">
                  当前待「{isStudioCase ? ['', '成员', '部长', '工作室负责人', '超级管理员/总编'][currentReviewLevel] : '终审'}」审核
                  {isStudioCase && myReviewLevel !== currentReviewLevel ? `,您的审核级别(「${currentUser.roleLabel}」)不匹配${isSuper ? '(可越级,但当前状态不可审)' : ''}` : ''}。
                </div>
              )
            ) : (
            <form onSubmit={handleSubmitReview} className="space-y-3.5 text-[12px]">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  审核员 <span className="text-slate-400 font-normal">(服务端身份,不可修改)</span>
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  readOnly
                  className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-[11.5px] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  审核决定 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReviewAction('approved')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                      reviewAction === 'approved'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isStudioCase && currentReviewLevel < 4 ? '审核通过(流转下一级)' : '终审通过并结案'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('revised')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                      reviewAction === 'revised'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    修正结论后通过
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('returned')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                      reviewAction === 'returned'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    退回重做
                  </button>
                </div>
              </div>

              {/* Mandatory Checklist Items */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  核查工作规范勾选项 (必检)
                </label>
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  {Object.entries(checkItems).map(([item, checked]) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setCheckItems((prev) => ({
                            ...prev,
                            [item]: e.target.checked,
                          }))
                        }
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 修改结论 (仅 revised) */}
              {reviewAction === 'revised' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      修正结论
                    </label>
                    <select
                      value={revisedConclusion}
                      onChange={(e) => setRevisedConclusion(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">保持不变</option>
                      {['真实', '基本真实', '缺乏语境', '误导', '基本错误', '虚假', '尚待核实', '无法核查', '疑似AI生成', '无法判断'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      修正置信度
                    </label>
                    <select
                      value={revisedConfidence}
                      onChange={(e) => setRevisedConfidence(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">保持不变</option>
                      {['高', '较高', '中', '低'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Comment Textarea */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  审核意见 (必填) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="请输入终审意见，明确说明事实层与指控层核查是否严密、证据链条是否充分..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2 bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-[12px] shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {submittingReview
                  ? '正在提交审核…'
                  : isStudioCase && currentReviewLevel < 4
                  ? `提交「${['', '成员', '部长', '工作室负责人', '超级管理员/总编'][currentReviewLevel]}」审核意见`
                  : '提交终审意见并结案'}
              </button>
            </form>
            )}

            {/* Historical Audit Trail */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                历史审核记录 ({caseData.reviews.length} 条)
              </span>
              {caseData.reviews.length === 0 ? (
                <div className="text-[11px] text-slate-400 py-1">暂无审核记录</div>
              ) : (
                <div className="space-y-2">
                  {caseData.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className={`p-2.5 rounded-lg border text-[11px] space-y-1 ${
                        rev.action === 'returned'
                          ? 'bg-rose-50 border-rose-200/80'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {rev.reviewer}
                          {rev.level && rev.level > 0 ? (
                            <span className="ml-1.5 px-1 py-0.5 rounded text-[9.5px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                              {rev.levelLabel ?? `L${rev.level}`}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            rev.action === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rev.action === 'returned'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {rev.action === 'approved' ? '审核通过' : rev.action === 'returned' ? '驳回' : '修正通过'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[10.5px] leading-snug">{rev.comment}</p>
                      <div className="text-slate-400 text-[10px]">{rev.reviewed_at}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
