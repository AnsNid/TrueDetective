import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Check, Minus, Menu, KeyRound, LogOut, ChevronDown, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import {
  TIME_RANGE_OPTIONS,
  TimeRangeKey,
  SYSTEM_STATUS_ITEMS,
} from '../data/dashboardData';
import { AuthenticatedUser } from './LoginPage';
import { api, clearSavedToken } from '../api/client';
import type { SiteConfig } from '../api/client';
import { useApiData } from '../api/hooks';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeTimeRange: TimeRangeKey;
  onTimeRangeChange: (key: TimeRangeKey) => void;
  onOpenNotifications: () => void;
  onLogoutClick: () => void;
  onOpenMobileMenu: () => void;
  currentUser: AuthenticatedUser;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  activeTimeRange,
  onTimeRangeChange,
  onOpenNotifications,
  onLogoutClick,
  onOpenMobileMenu,
  currentUser,
}) => {
  // 用户菜单(修改密码/退出)
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // 服务能力状态灯(消费 getConfig 真实开关,未加载完显示中性灰)
  const configQ = useApiData<SiteConfig>(() => api.getConfig(), []);
  const aiFlags = configQ.data?.ai;
  const statusOf = (id: string): boolean | undefined => {
    if (!aiFlags) return undefined;
    switch (id) {
      case 'ark':
        return aiFlags.llm;
      case 'google':
        return aiFlags.search;
      case 'reverse-img':
        return aiFlags.reverseImage;
      case 'github-bed':
        return aiFlags.githubBed;
      default:
        return undefined;
    }
  };

  // 点击外部关闭下拉(桌面/移动两处菜单共用 data-user-menu 标记)
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element)?.closest?.('[data-user-menu]')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  /** 用户区 pill + 下拉菜单(桌面/移动复用,compact 控制字号) */
  const renderUserMenu = (compact = false) => (
    <div className="relative" data-user-menu>
      <button
        type="button"
        aria-label="用户菜单"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full border border-slate-200/90 bg-white whitespace-nowrap hover:border-blue-300 transition-colors cursor-pointer ${
          compact ? 'text-[12px] text-slate-700' : 'text-[11.5px] text-slate-700'
        }`}
      >
        <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] font-semibold text-[10.5px] flex items-center justify-center shrink-0">
          {currentUser.avatarChar}
        </span>
        <span className={`font-medium text-slate-700 max-w-[96px] truncate ${compact ? '' : 'text-[11.5px]'}`}>
          {currentUser.displayName} · {currentUser.roleLabel}
        </span>
        {currentUser.roleSystem ? (
          <span
            title={`角色体系：${currentUser.roleSystem === 'teaching' ? '教学' : '工作室'}`}
            className={`px-1.5 py-0.5 rounded font-bold shrink-0 ${
              compact ? 'text-[10px]' : 'text-[9.5px]'
            } ${
              currentUser.roleSystem === 'teaching'
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}
          >
            {currentUser.roleSystem === 'teaching' ? '教学' : '工作室'}
          </span>
        ) : null}
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-[150px] bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-[12px]">
          <button
            type="button"
            onClick={openPwdModal}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-[#2563EB] transition-colors cursor-pointer text-left"
          >
            <KeyRound className="w-3.5 h-3.5" />
            修改密码
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onLogoutClick();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            退出登录
          </button>
        </div>
      ) : null}
    </div>
  );

  const openPwdModal = () => {
    setMenuOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwdError(null);
    setPwdModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdSaving) return;
    if (!oldPassword || !newPassword) {
      setPwdError('请填写旧密码与新密码');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('新密码长度不能少于 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('两次输入的新密码不一致');
      return;
    }
    setPwdError(null);
    setPwdSaving(true);
    try {
      const res = await api.changePassword(oldPassword, newPassword);
      if (res.code === 200) {
        // 修改成功:先在弹窗内提示,再清理会话回登录页,避免无提示直接消失
        setPwdSuccess(true);
        setTimeout(() => {
          setPwdModal(false);
          clearSavedToken();
          onLogoutClick();
        }, 1600);
        return;
      }
      setPwdError(res.message || '修改失败,请稍后重试');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-3.5 sm:px-5 py-2 lg:py-0 lg:h-[52px] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-4 shrink-0">
      {/* Row 1 on Mobile / Left & Center on Desktop */}
      <div className="flex items-center justify-between lg:justify-start gap-2.5 sm:gap-4 min-w-0 w-full lg:w-auto">
        {/* Mobile Hamburger Button + Mini Brand */}
        <div className="flex items-center gap-2 lg:hidden shrink-0">
          <button
            type="button"
            aria-label="打开导航菜单"
            onClick={onOpenMobileMenu}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200/70 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 sm:hidden">
            <span className="w-6 h-6 rounded-[6px] bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center">
              核
            </span>
            <span className="font-bold text-[13px] text-[#0F172A] whitespace-nowrap">海外涉华信息智能核查平台</span>
          </div>
        </div>

        {/* Search Input (desktop & tablet inline, hidden on <sm and shown on second row below) */}
        <div className="hidden sm:block relative w-[200px] md:w-[230px] lg:w-[265px] shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            aria-label="搜索线索、案件、关键词或链接"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索线索、案件、关键词或链接..."
            className="w-full h-[30px] pl-9 pr-3 rounded-full bg-[#F4F6F9] border border-slate-200/70 text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Time Range Selector (visible on md+ inline) */}
        <div
          role="group"
          aria-label="时间范围筛选"
          className="hidden md:flex items-center gap-1 shrink-0"
        >
          {TIME_RANGE_OPTIONS.map((option) => {
            const isActive = activeTimeRange === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onTimeRangeChange(option.key)}
                className={`px-2.5 py-1 rounded-[6px] text-[12px] transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2563EB] text-white font-medium shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* System Status Indicators (visible on xl+, 消费 getConfig 真实开关) */}
        <div className="hidden xl:flex items-center gap-4 pl-1 shrink-0">
          {SYSTEM_STATUS_ITEMS.map((item) => {
            const on = statusOf(item.id);
            return (
              <div
                key={item.id}
                className="flex items-center gap-1.5 text-[11.5px] text-slate-500 whitespace-nowrap"
                title={on === undefined ? '状态加载中' : on ? '已启用' : '未启用/未配置'}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    on === undefined
                      ? 'bg-slate-50 border-slate-200 text-slate-300'
                      : on
                        ? 'bg-emerald-50 border-emerald-200 text-[#10B981]'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {on === false ? <Minus className="w-2.5 h-2.5 stroke-[3]" /> : <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Right User & Action Controls (on mobile stays right-aligned in top row) */}
        <div className="flex lg:hidden items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            aria-label="系统通知"
            onClick={onOpenNotifications}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200/70 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          </button>

          {/* 用户区:点击展开 修改密码/退出 菜单 */}
          {renderUserMenu()}
        </div>
      </div>

      {/* 修改密码弹窗 */}
      {pwdModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-[#2563EB]" /> 修改密码
              </h3>
              <button
                type="button"
                onClick={() => setPwdModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              {pwdSuccess ? (
                <div className="px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11.5px] flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>密码修改成功,即将退出登录,请使用新密码重新登录…</span>
                </div>
              ) : (
                <>
              {pwdError ? (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pwdError}</span>
                </div>
              ) : null}
              <div>
                <label htmlFor="pwd-old" className="block text-slate-700 font-semibold mb-1">
                  旧密码
                </label>
                <input
                  id="pwd-old"
                  type={showPwd ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                    if (pwdError) setPwdError(null);
                  }}
                  placeholder="请输入当前密码"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pwd-new" className="block text-slate-700 font-semibold mb-1">
                  新密码
                </label>
                <input
                  id="pwd-new"
                  type={showPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (pwdError) setPwdError(null);
                  }}
                  placeholder="不少于 6 位"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pwd-confirm" className="block text-slate-700 font-semibold mb-1">
                  确认新密码
                </label>
                <div className="relative">
                  <input
                    id="pwd-confirm"
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (pwdError) setPwdError(null);
                    }}
                    placeholder="再次输入新密码"
                    className="w-full px-3 py-1.5 pr-9 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    aria-label={showPwd ? '隐藏密码' : '显示密码'}
                    onClick={() => setShowPwd((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                修改成功后将自动退出,请使用新密码重新登录。
              </p>
              <div className="pt-1.5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPwdModal(false)}
                  disabled={pwdSuccess}
                  className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={pwdSaving || pwdSuccess}
                  className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {pwdSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> 保存中…
                    </>
                  ) : (
                    '确认修改'
                  )}
                </button>
              </div>
                </>
              )}
            </form>
          </div>
        </div>
      ) : null}

      {/* Second Compact Row on Small Screens (< md): Search + Time Range */}
      <div className="flex md:hidden items-center justify-between gap-2 w-full">
        <div className="sm:hidden relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            aria-label="移动端搜索线索或案件"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索线索、案件..."
            className="w-full h-[30px] pl-8 pr-2.5 rounded-full bg-[#F4F6F9] border border-slate-200/70 text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div
          role="group"
          aria-label="移动端时间范围筛选"
          className="flex items-center gap-1 shrink-0 ml-auto"
        >
          {TIME_RANGE_OPTIONS.map((option) => {
            const isActive = activeTimeRange === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onTimeRangeChange(option.key)}
                className={`px-2 py-1 rounded-[6px] text-[11.5px] transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2563EB] text-white font-medium shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Right User & Action Controls (lg+) */}
      <div className="hidden lg:flex items-center gap-2.5 shrink-0">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="系统通知"
          onClick={onOpenNotifications}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200/70 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
        </button>

        {/* 用户区:点击展开 修改密码/退出 菜单(移动端紧凑版) */}
        {renderUserMenu(true)}
      </div>
    </header>
  );
};
