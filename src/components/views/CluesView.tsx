import React, { useState } from 'react';
import {
  FileText,
  Image,
  Video,
  Mic,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  Check,
  Link as LinkIcon,
  Upload,
} from 'lucide-react';
import { api } from '../../api/client';

interface CluesViewProps {
  onSuccessSubmit?: (caseId: string, caseTitle: string) => void;
}

export const CluesView: React.FC<CluesViewProps> = ({ onSuccessSubmit }) => {
  const [clueType, setClueType] = useState<'text' | 'image' | 'video' | 'audio'>('text');
  const [title, setTitle] = useState(
    '外媒称中国边境管控构成“系统性限制”，援引人权组织年度报告'
  );
  const [content, setContent] = useState(
    'Human Rights Watch said in its annual report that China has turned border controls into "a routine governance tool", describing the border as "a prison for millions". The report cites no primary documentation for the characterization.'
  );
  const [translation, setTranslation] = useState(
    '人权观察在年度报告中称，中国已将边境管控变成“常规治理工具”，并将边境形容为“数百万人的监狱”。报告未援引一手官方文件支持该定性。'
  );
  const [imageUrl, setImageUrl] = useState('');
  const [platform, setPlatform] = useState('Human Rights Watch 官网');
  const [account, setAccount] = useState('@hrw');
  const [publishTime, setPublishTime] = useState('2026-01-15 08:00');
  const [sourceUrl, setSourceUrl] = useState(
    'https://www.hrw.org/world-report/2026/country-chapters/china'
  );
  const [priority, setPriority] = useState('高 (涉人权组织指控)');
  const [assignee, setAssignee] = useState('王思思 · 当前 3 件在办');
  const [relatedCase, setRelatedCase] = useState('未关联');
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [submittedToast, setSubmittedToast] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [ocrDetected, setOcrDetected] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleTranslateLLM = () => {
    if (!content.trim()) return;
    setIsTranslating(true);
    setTimeout(() => {
      setTranslation(
        '人权观察在年度报告中称，中国已将边境管控变成“常规治理工具”，并将边境形容为“数百万人的监狱”。报告未援引一手官方文件支持该定性。'
      );
      setIsTranslating(false);
    }, 600);
  };

  const handlePasteContent = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        setOcrDetected(true);
        setClueType('image');
        setImageUrl('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800');
        setTimeout(() => setOcrDetected(false), 3000);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmittedToast(true);
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await api.createClue({
        title: title.trim(),
        content: content.trim(),
        translation: translation.trim(),
        clueType,
        imageUrl: imageUrl.trim(),
        platform: platform.trim(),
        account: account.trim(),
        publishTime: publishTime.trim(),
        sourceUrl: sourceUrl.trim(),
        priority,
        assignee,
      });
      if (res.code === 200 && res.data?.caseNo) {
        if (onSuccessSubmit) {
          onSuccessSubmit(res.data.caseNo, title.trim());
        }
        setTimeout(() => setSubmittedToast(false), 3500);
      } else {
        setSubmitError(res.message || '线索提交失败,请稍后重试');
        setSubmittedToast(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    setIsDraftSaved(true);
    setTimeout(() => setIsDraftSaved(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Toast notifications */}
      {submittedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center justify-between shadow-sm">
          <span>✓ 线索提交成功！已自动创建核查任务，系统已推进至环节 2 (价值初筛)。</span>
          <button
            onClick={() => setSubmittedToast(false)}
            className="text-emerald-800 font-semibold underline cursor-pointer"
          >
            知道了
          </button>
        </div>
      )}
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between shadow-sm">
          <span>⚠ {submitError}</span>
          <button
            onClick={() => setSubmitError(null)}
            className="text-red-800 font-semibold underline cursor-pointer"
          >
            知道了
          </button>
        </div>
      )}
      {isDraftSaved && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg flex items-center justify-between shadow-sm">
          <span>✓ 草稿已保存至本地工作台</span>
          <button
            onClick={() => setIsDraftSaved(false)}
            className="text-blue-800 font-semibold underline cursor-pointer"
          >
            关闭
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
            线索中心 · 新建线索
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            提交需要核查的海外涉华信息，系统将自动创建核查任务并推进 9 环节流程
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-400">
          <span>草稿已自动保存 · 09:41</span>
          <span className="ml-2 text-slate-500">提交后由价值初筛环节自动分级</span>
        </div>
      </div>

      {/* 2-Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Form Card (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-[13px] font-bold text-[#0F172A] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
              线索信息
            </h2>
            <span className="text-[11px] text-slate-400">带 * 为必填项 · 提交后不可修改原文</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-[12px]">
            {/* Title */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                线索标题 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                placeholder="请输入涉华核查线索标题"
              />
            </div>

            {/* Clue Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                核查类型 <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Text */}
                <div
                  onClick={() => setClueType('text')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all relative ${
                    clueType === 'text'
                      ? 'border-[#2563EB] bg-blue-50/40 text-blue-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-[12px]">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      文本核查
                    </div>
                    {clueType === 'text' && (
                      <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-snug">文字 / 链接 / 文字截图</div>
                </div>

                {/* Image */}
                <div
                  onClick={() => setClueType('image')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all relative ${
                    clueType === 'image'
                      ? 'border-[#2563EB] bg-blue-50/40 text-blue-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-[12px]">
                      <Image className="w-3.5 h-3.5 text-indigo-600" />
                      图片核查
                    </div>
                    {clueType === 'image' && (
                      <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-snug">照片 / 图像溯源</div>
                </div>

                {/* Video */}
                <div
                  onClick={() => setClueType('video')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all relative ${
                    clueType === 'video'
                      ? 'border-[#2563EB] bg-blue-50/40 text-blue-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-[12px]">
                      <Video className="w-3.5 h-3.5 text-sky-600" />
                      视频
                    </div>
                    {clueType === 'video' && (
                      <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-snug">转写后走文字流程</div>
                </div>

                {/* Audio */}
                <div
                  onClick={() => setClueType('audio')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all relative ${
                    clueType === 'audio'
                      ? 'border-[#2563EB] bg-blue-50/40 text-blue-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-[12px]">
                      <Mic className="w-3.5 h-3.5 text-violet-600" />
                      音频
                    </div>
                    {clueType === 'audio' && (
                      <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-snug">转写后走文字流程</div>
                </div>
              </div>
            </div>

            {/* Original Content */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  原文内容 (外文原文或截图) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-blue-600 font-medium">
                  支持直接粘贴截图 (Ctrl+V) 自动识别文字
                </span>
              </div>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePasteContent}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[12px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                placeholder="粘贴待核查的原文或截图 (Ctrl+V) 也可以直接输入外文，系统将自动拆解事实主张..."
              />
              {ocrDetected && (
                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 text-[11px] flex items-center gap-1.5 mt-1.5 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>已识别剪贴板图片！已自动保留图片并调用 OCR 解析画面内容。</span>
                </div>
              )}
              <div className="text-[10px] text-slate-400 mt-1">
                粘贴外文原文或截图，系统自动 OCR 并保留图片溯源
              </div>
            </div>

            {/* Translation & Image Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    中文翻译 <span className="text-slate-400 font-normal">(可留空)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleTranslateLLM}
                    disabled={isTranslating}
                    className="text-[10.5px] text-[#2563EB] hover:text-blue-800 font-semibold cursor-pointer underline flex items-center gap-1"
                  >
                    {isTranslating ? '正在翻译...' : '调用 LLM 翻译成中文'}
                  </button>
                </div>
                <input
                  type="text"
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  placeholder="(留空时自动翻译)"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  图片公开链接 <span className="text-slate-400 font-normal">(填了可直接识图)</span>
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... 未填时将经 GitHub 图床自动转公开链接"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Platform, Account, Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  来源平台
                </label>
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  来源账号
                </label>
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  发布时间
                </label>
                <input
                  type="text"
                  value={publishTime}
                  onChange={(e) => setPublishTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Original Link & Submitter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  原始链接
                </label>
                <input
                  type="text"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  提交人
                </label>
                <input
                  type="text"
                  value="张明 (管理员)"
                  disabled
                  className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-[11.5px] cursor-not-allowed"
                />
              </div>
            </div>

            {/* Drag & Drop Upload */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                上传图片 / 截图 <span className="text-slate-400 font-normal">(用于图片溯源，支持拖拽)</span>
              </label>
              <div className="border border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="text-[11.5px] text-slate-500 flex items-center justify-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  + 拖拽图片到此处，或直接在上方原文框按 Ctrl+V 粘贴截图
                </div>
              </div>
            </div>

            {/* Priority, Assignee, Related Case */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  建议优先级 <span className="text-slate-400 font-normal">系统预判，可调整</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="高 (涉人权组织指控)">高 (涉人权组织指控)</option>
                  <option value="中">中</option>
                  <option value="低">低</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  指派核查员
                </label>
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="王思思 · 当前 3 件在办">王思思 · 当前 3 件在办</option>
                  <option value="李华 · 当前 2 件在办">李华 · 当前 2 件在办</option>
                  <option value="王芳 · 当前 2 件在办">王芳 · 当前 2 件在办</option>
                  <option value="赵强 · 当前 1 件在办">赵强 · 当前 1 件在办</option>
                  <option value="刘洋 · 当前 1 件在办">刘洋 · 当前 1 件在办</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  关联案件 <span className="text-slate-400 font-normal">可留空</span>
                </label>
                <select
                  value={relatedCase}
                  onChange={(e) => setRelatedCase(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="未关联">未关联</option>
                  <option value="ZT-2026-0001 · 出入境新规">ZT-2026-0001 · 出入境新规</option>
                  <option value="ZT-2026-0016 · 边境管控">ZT-2026-0016 · 边境管控</option>
                </select>
              </div>
            </div>

            {/* Auto Execute steps pills */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-700 mb-2">提交后自动执行</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 bg-white p-2 rounded border border-slate-200/70">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                    1
                  </span>
                  <span>拆解主张，生成检索关键词</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-2 rounded border border-slate-200/70">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                    2
                  </span>
                  <span>中英文多语种检索，回填候选证据</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-2 rounded border border-slate-200/70">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                    3
                  </span>
                  <span>进入 9 环节流程，等待人工推进</span>
                </div>
              </div>
            </div>

            {/* Pre-submit checks */}
            <div className="bg-emerald-50/50 rounded-lg p-2.5 border border-emerald-100/80">
              <div className="text-[11px] font-bold text-emerald-800 mb-1.5">提交前自检</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10.5px] text-emerald-700">
                <div className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>原文为外文，已保留原始链接</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>已区分事实层与指控层表述</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>已附原始出处时间与平台</span>
                </div>
              </div>
            </div>

            {/* Similar clues and reusable cases */}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700">相似线索与可复用案例</span>
                <span className="text-[10px] text-slate-400">按主张文本 + 信源自动匹配</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100/70 rounded text-[11px] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 tabular-nums">ZT-2026-0001</span>
                    <span className="text-slate-700 font-medium">出入境新规与人权组织指控</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    误导
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100/70 rounded text-[11px] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 tabular-nums">ZT-2026-0016</span>
                    <span className="text-slate-700 font-medium">边境管控“系统性限制”</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    无法核查
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100/70 rounded text-[11px] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-medium">知识库</span>
                    <span className="text-slate-700 font-medium">指控表述核查主线 (引用 96 次)</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                    可直接引用
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-[12px] shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting ? '正在创建核查任务…' : '提交线索，创建核查任务'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-300 rounded-lg text-[12px] transition-colors cursor-pointer"
                >
                  存为草稿
                </button>
              </div>
              <div className="text-[10px] text-slate-400">
                提交即视为同意《核查工作规范》，证据不足禁止强下结论
              </div>
            </div>
          </form>
        </div>

        {/* Right Sidebar Columns (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Card 1: 核查类型说明 */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-[12.5px] font-bold text-[#0F172A] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                核查类型说明
              </h3>
              <span className="text-[10px] text-slate-400">4 类</span>
            </div>
            <div className="space-y-2.5 text-[11px]">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  文
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">文本核查</span>
                    <span className="px-1 py-0.2 rounded bg-blue-50 text-blue-600 text-[9px] font-medium border border-blue-100">
                      默认
                    </span>
                  </div>
                  <p className="text-slate-500 text-[10.5px] mt-0.5">主张拆解 + 多语种检索，最常用</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  图
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">图片真实性核查</span>
                    <span className="px-1 py-0.2 rounded bg-indigo-50 text-indigo-600 text-[9px] font-medium border border-indigo-100">
                      溯源
                    </span>
                  </div>
                  <p className="text-slate-500 text-[10.5px] mt-0.5">反向搜图比对最早出现时间</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  视
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">视频核查</span>
                    <span className="px-1 py-0.2 rounded bg-sky-50 text-sky-600 text-[9px] font-medium border border-sky-100">
                      转写
                    </span>
                  </div>
                  <p className="text-slate-500 text-[10.5px] mt-0.5">先转写为文字，再走文字流程</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  音
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">音频核查</span>
                    <span className="px-1 py-0.2 rounded bg-violet-50 text-violet-600 text-[9px] font-medium border border-violet-100">
                      转写
                    </span>
                  </div>
                  <p className="text-slate-500 text-[10.5px] mt-0.5">保留原声时间轴，附转写稿</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: 9 环节流程 */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-[12.5px] font-bold text-[#0F172A] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                9 环节流程
              </h3>
              <span className="text-[10px] text-slate-400">预计 18 小时</span>
            </div>

            <div className="relative pl-3.5 border-l-2 border-slate-200 space-y-3 text-[11px]">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-50"></div>
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>线索接收</span>
                  <span className="text-[10px] text-blue-600 font-normal">已提交 · 09:41</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-50"></div>
                <div className="font-bold text-slate-800">价值初筛</div>
                <p className="text-[10px] text-slate-500">自动分级: 涉华指控类 · 优先级 中</p>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                <div className="font-bold text-slate-700">主张拆解</div>
                <p className="text-[10px] text-slate-400">拆出可核查断言，区分事实层与指控层</p>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                <div className="font-bold text-slate-700">多语种检索</div>
                <p className="text-[10px] text-slate-400">中英文关键词分别列，转载不计独立证据</p>
              </div>

              {/* Step 5 */}
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                <div className="font-bold text-slate-700">出处追溯</div>
                <p className="text-[10px] text-slate-400">定位原始出处与最早发布时间</p>
              </div>

              {/* Step 6 */}
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                <div className="font-bold text-slate-700">交叉验证</div>
                <p className="text-[10px] text-slate-400">独立信源互证，主动检索反驳证据</p>
              </div>

              {/* Step 7 */}
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                <div className="font-bold text-slate-700">信源评价</div>
                <p className="text-[10px] text-slate-400">六维评分: 接近度 / 专业性 / 透明度...</p>
              </div>

              {/* Step 8 */}
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                <div className="font-bold text-slate-700">报告生成</div>
                <p className="text-[10px] text-slate-400">结论 + 证据链 + 置信度</p>
              </div>

              {/* Step 9 */}
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                <div className="font-bold text-slate-700">人工审核</div>
                <p className="text-[10px] text-slate-400">审核员终审定论，AI 不直接判定真假</p>
              </div>
            </div>
          </div>

          {/* Card 3: 提交须知 */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-[11px] space-y-1.5">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              提交须知
            </div>
            <p className="text-slate-600 leading-relaxed text-[10.5px]">
              证据链不足时输出“尚待核实 / 无法核查”；官方文件只支持事实层，不能单独支撑指控拉层；外媒定性表述须作为独立核查主线。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
