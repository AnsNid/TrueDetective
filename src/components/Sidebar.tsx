import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  FileText,
  Folder,
  Clock,
  BookOpen,
  BarChart2,
  User,
  X,
} from 'lucide-react';

export type NavKey =
  | 'workbench'
  | 'clues'
  | 'tasks'
  | 'evidence'
  | 'history'
  | 'knowledge'
  | 'statistics'
  | 'users';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS: { key: NavKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'workbench', label: '工作台', icon: Home },
  { key: 'clues', label: '线索中心', icon: Search },
  { key: 'tasks', label: '核查任务', icon: FileText },
  { key: 'evidence', label: '证据库', icon: Folder },
  { key: 'history', label: '历史案例', icon: Clock },
  { key: 'knowledge', label: '知识库', icon: BookOpen },
  { key: 'statistics', label: '数据统计', icon: BarChart2 },
  { key: 'users', label: '用户管理', icon: User },
];

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onCloseMobile,
}) => {
  const renderNavContent = (isMobileDrawer: boolean) => (
    <>
      {/* Top Brand + Nav */}
      <div>
        {/* Brand Header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#2563EB] flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
              核
            </div>
            <div className="text-white font-bold text-[13px] leading-[1.3] tracking-tight">
              <div>海外涉华信息</div>
              <div>智能核查平台</div>
            </div>
          </div>

          {isMobileDrawer && onCloseMobile ? (
            <button
              type="button"
              aria-label="关闭导航菜单"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Navigation Links */}
        <nav className="px-2.5 mt-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.key}
                to={`/${item.key}`}
                end={item.key === 'workbench'}
                onClick={() => {
                  if (isMobileDrawer && onCloseMobile) {
                    onCloseMobile();
                  }
                }}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#2563EB] text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-normal'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white stroke-[2.2]' : 'text-slate-400 stroke-[1.75]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Studio Signature */}
      <div className="px-5 py-4 text-[11px] text-slate-500 leading-relaxed">
        <div className="font-medium text-slate-400/80">海外涉华信息智能核查平台</div>
        <div className="mt-0.5 tracking-wider text-slate-500">求真 · 求证 · 求实</div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar (lg and up) */}
      <aside
        aria-label="主导航栏"
        className="hidden lg:flex w-[200px] xl:w-[210px] shrink-0 bg-[#0F172A] text-slate-300 flex-col justify-between select-none lg:sticky lg:top-0 lg:h-screen"
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile & Tablet Slide-Over Drawer (< lg) */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            aria-hidden="true"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
          />
          <aside
            aria-label="移动端主导航栏"
            className="relative z-10 w-[230px] max-w-[80vw] bg-[#0F172A] text-slate-300 flex flex-col justify-between select-none h-full shadow-2xl"
          >
            {renderNavContent(true)}
          </aside>
        </div>
      ) : null}
    </>
  );
};
