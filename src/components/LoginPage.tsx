import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
} from 'lucide-react';
import { validateLoginCredentials } from '../utils/dashboardLogic';
import { api, setSavedToken, TOKEN_KEY } from '../api/client';
import loginBgUrl from '../assets/images/login_verification_bg_1794044224066.jpg';

export interface AuthenticatedUser {
  displayName: string;
  roleLabel: string;
  avatarChar: string;
}

interface LoginPageProps {
  onLoginSuccess: (user: AuthenticatedUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('zhangming@zhentan.org');
  const [password, setPassword] = useState('Zt@2026Admin');
  const [roleLabel, setRoleLabel] = useState('管理员');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [siteStats, setSiteStats] = useState<{
    totalClues: number;
    closeRate: number;
  } | null>(null);
  const [aiFlags, setAiFlags] = useState<{ llm: boolean; search: boolean } | null>(null);

  // 公开配置:宣传数字与 AI 能力开关(真实值)
  React.useEffect(() => {
    api.getConfig().then((res) => {
      if (res.code === 200 && res.data) {
        if (res.data.stats) {
          setSiteStats({
            totalClues: res.data.stats.totalClues,
            closeRate: res.data.stats.closeRate,
          });
        }
        if (res.data.ai) {
          setAiFlags({ llm: res.data.ai.llm, search: res.data.ai.search });
        }
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const validation = validateLoginCredentials(username, password, roleLabel);
    if (!validation.valid) {
      setErrorMessage(validation.error || '登录信息校验未通过');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);
    try {
      const res = await api.login(username.trim(), password);
      if (res.code === 200 && res.data?.token) {
        if (rememberMe) {
          setSavedToken(res.data.token);
        } else {
          sessionStorage.setItem(TOKEN_KEY, res.data.token);
        }
        const backend = res.data.user;
        const displayName =
          backend?.nickname || validation.displayName || '核查员';
        onLoginSuccess({
          displayName,
          roleLabel: backend?.roleLabel || validation.roleLabel || '管理员',
          avatarChar: displayName.charAt(0) || '核',
        });
        return;
      }
      setErrorMessage(res.message || '登录失败,请检查账号或密码');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (
    presetUser: string,
    presetPass: string,
    presetRole: string
  ) => {
    setUsername(presetUser);
    setPassword(presetPass);
    setRoleLabel(presetRole);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-white text-[#0F172A] flex flex-col lg:grid lg:grid-cols-12">
      {/* Left Visual Hero Panel (Visible on Desktop lg+, Hidden on Small Screens so Mobile only shows Login Form in 1st screen) */}
      <aside className="hidden lg:flex lg:col-span-7 relative bg-[#0B1120] text-white flex-col justify-between p-12 xl:p-14 overflow-hidden select-none">
        {/* Background Photography + Fallback */}
        {!imgError ? (
          <img
            src={loginBgUrl}
            alt="真探全球涉华信息智能核查中心"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover object-center scale-[1.01]"
          />
        ) : null}

        {/* Measured Contrast Scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#080D1A]/95 via-[#0F172A]/60 to-[#0F172A]/45"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#0B1120]/60 via-transparent to-transparent"
        />

        {/* Top Brand Identity */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[9px] bg-[#2563EB] flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
              真
            </div>
            <div>
              <div className="text-white font-bold text-[21px] tracking-tight leading-none">
                真探
              </div>
              <div className="text-[11.5px] text-slate-300/90 mt-1 tracking-wide">
                海外涉华信息智能核查平台
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[12px] text-slate-300/90">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  aiFlags?.llm
                    ? 'bg-emerald-500/20 border border-emerald-400/40 text-[#10B981]'
                    : 'bg-slate-500/20 border border-slate-400/40 text-slate-300'
                }`}
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>LLM 智能核查{aiFlags?.llm ? '已启用' : '未配置'}</span>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span>{aiFlags?.search ? '联网搜索已启用' : '联网搜索未配置'}</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span>反向搜图未接入</span>
          </div>
        </div>

        {/* Bottom Editorial Copy & Key Metrics */}
        <div className="relative z-10 max-w-xl">
          <div className="text-[12px] font-medium text-blue-400 tracking-wider mb-2">
            求真 · 求证 · 求实
          </div>
          <h1 className="text-[30px] xl:text-[34px] font-extrabold tracking-tight leading-[1.25] text-white">
            全链路多语种涉华信息
            <br />
            智能溯源与交叉验证工作台
          </h1>
          <p className="mt-3.5 text-[14px] text-slate-300/90 leading-relaxed">
            融合九环节标准化核查漏斗、六维信源可信度评级模型与多模态影像真伪判定技术，为每一份核查结论提供扎实、透明的证据链支撑。
          </p>

          {/* Unboxed Proof Metrics Row */}
          <div className="mt-8 pt-6 border-t border-white/15 flex items-center gap-8 text-[13px] text-slate-300 tabular-nums">
            <div>
              <span className="text-white font-extrabold text-[22px] block leading-tight tabular-nums">
                {(siteStats?.totalClues ?? 0).toLocaleString()}
              </span>
              <span className="text-[11.5px] text-slate-400">累计接入线索</span>
            </div>
            <span aria-hidden="true" className="text-white/20 text-lg">
              /
            </span>
            <div>
              <span className="text-[#10B981] font-extrabold text-[22px] block leading-tight tabular-nums">
                {siteStats ? `${siteStats.closeRate}%` : '—'}
              </span>
              <span className="text-[11.5px] text-slate-400">综合核查结案率</span>
            </div>
            <span aria-hidden="true" className="text-white/20 text-lg">
              /
            </span>
            <div>
              <span className="text-white font-extrabold text-[22px] block leading-tight">
                9 环节
              </span>
              <span className="text-[11.5px] text-slate-400">全流程证据闭环</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Login Column (Full first-screen on mobile/tablet, 5 cols on desktop) */}
      <main className="lg:col-span-5 flex-1 flex flex-col justify-between px-6 py-6 sm:px-12 sm:py-10 lg:px-12 xl:px-16 bg-white">
        {/* Mobile/Tablet Compact Top Brand Bar (Hidden on lg+ since left hero has brand) */}
        <div className="flex lg:hidden items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[7px] bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
              真
            </div>
            <span className="font-bold text-[17px] tracking-tight text-[#0F172A]">
              真探
            </span>
            <span aria-hidden="true" className="text-slate-300 text-xs">
              ·
            </span>
            <span className="text-[12px] text-slate-500 truncate">
              海外涉华信息智能核查平台
            </span>
          </div>
        </div>

        {/* Desktop top spacer */}
        <div className="hidden lg:block" />

        {/* Centered Login Form Container */}
        <div className="w-full max-w-[380px] mx-auto my-auto py-4">
          {/* Form Heading */}
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <h2 className="text-[22px] font-extrabold text-[#0F172A] tracking-tight">
                账号登录
              </h2>
            </div>
            <p className="text-[13px] text-slate-400 mt-1.5">
              请输入真探工作室授权账号与密码进入核查工作台
            </p>
          </div>

          {/* Validation Error Alert */}
          {errorMessage ? (
            <div
              role="alert"
              className="mt-5 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-[#EF4444] text-[12.5px] flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {/* Username */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-[12.5px] font-semibold text-slate-700 mb-1.5"
              >
                核查员账号 / 工号
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="请输入工号或邮箱，如 zhangming@zhentan.org"
                  className="w-full h-10 pl-10 pr-3.5 rounded-lg bg-[#F8FAFC] border border-slate-200/90 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-[12.5px] font-semibold text-slate-700"
                >
                  登录密码
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill(
                      'zhangming@zhentan.org',
                      'Zt@2026Admin',
                      '管理员'
                    )
                  }
                  className="text-[11.5px] text-[#2563EB] hover:underline cursor-pointer"
                >
                  重置默认凭证
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="请输入不少于 6 位登录密码"
                  className="w-full h-10 pl-10 pr-10 rounded-lg bg-[#F8FAFC] border border-slate-200/90 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me (角色由服务端账号决定,登录页不再提供装饰性角色选择) */}
            <div className="flex justify-end pt-0.5">
              <label className="flex items-center gap-2 text-[12.5px] text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>保持登录状态</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-[13.5px] shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在登录…</span>
                </>
              ) : (
                <>
                  <span>登录进入工作台</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Account Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2 text-[11.5px]">
              <span className="text-slate-400 shrink-0">快捷演示账号：</span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill(
                      'zhangming@zhentan.org',
                      'Zt@2026Admin',
                      '管理员'
                    )
                  }
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-[#2563EB] text-slate-600 font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  张明 · 管理员
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill(
                      'wangsisi@zhentan.org',
                      'Zt@2026Verify',
                      '高级核查员'
                    )
                  }
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-[#2563EB] text-slate-600 font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  王思思 · 核查员
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('', '', '管理员')}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-500 transition-colors cursor-pointer whitespace-nowrap"
                >
                  清空表单
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Studio Footer */}
        <footer className="text-center lg:text-left text-[11.5px] text-slate-400 flex items-center justify-center lg:justify-between gap-2">
          <span>真探工作室 · 海外涉华信息智能核查平台</span>
          <span className="hidden sm:inline text-slate-300">求真 · 求证 · 求实</span>
        </footer>
      </main>
    </div>
  );
};
