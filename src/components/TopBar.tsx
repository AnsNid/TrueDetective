import React from 'react';
import { Search, Bell, Check, Menu } from 'lucide-react';
import {
  TIME_RANGE_OPTIONS,
  TimeRangeKey,
  SYSTEM_STATUS_ITEMS,
} from '../data/dashboardData';
import { AuthenticatedUser } from './LoginPage';

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
              真
            </span>
            <span className="font-bold text-[15px] text-[#0F172A]">真探</span>
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

        {/* System Status Indicators (visible on xl+) */}
        <div className="hidden xl:flex items-center gap-4 pl-1 shrink-0">
          {SYSTEM_STATUS_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 text-[11.5px] text-slate-500 whitespace-nowrap"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#10B981] shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>{item.label}</span>
            </div>
          ))}
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

          <div className="flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full border border-slate-200/90 bg-white text-[11.5px] text-slate-700 whitespace-nowrap">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] font-semibold text-[10.5px] flex items-center justify-center shrink-0">
              {currentUser.avatarChar}
            </span>
            <span className="font-medium text-slate-700 max-w-[96px] truncate">
              {currentUser.displayName} · {currentUser.roleLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogoutClick}
            className="px-2 py-1 rounded-[6px] border border-red-200 bg-red-50/40 hover:bg-red-50 text-[#EF4444] text-[11.5px] font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            退出
          </button>
        </div>
      </div>

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

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border border-slate-200/90 bg-white text-[12px] text-slate-700 whitespace-nowrap">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] font-semibold text-[11px] flex items-center justify-center shrink-0">
            {currentUser.avatarChar}
          </span>
          <span className="font-medium text-slate-700">
            {currentUser.displayName} · {currentUser.roleLabel}
          </span>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogoutClick}
          className="px-2.5 py-1 rounded-[6px] border border-red-200 bg-red-50/40 hover:bg-red-50 text-[#EF4444] text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap"
        >
          退出
        </button>
      </div>
    </header>
  );
};
