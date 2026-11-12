import React, { useState, useMemo, useEffect } from 'react';
import {
  TeamMember,
  AuditLogItem,
} from '../../data/viewsData';
import {
  UserPlus,
  Shield,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { api } from '../../api/client';
import { useApiData, LoadErrorBar, LoadingCards } from '../../api/hooks';

export const UsersView: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<'全部' | '管理员' | '审核员' | '核查员'>('全部');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [addUserModal, setAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'核查员' | '审核员' | '管理员'>('核查员');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // 后端成员与审计日志
  const usersQuery = useApiData<{ list: TeamMember[] }>(() => api.users());
  const logsQuery = useApiData<{ list: AuditLogItem[] }>(() => api.auditLogs());

  useEffect(() => {
    if (usersQuery.data?.list) setMembers(usersQuery.data.list);
  }, [usersQuery.data]);
  useEffect(() => {
    if (logsQuery.data?.list) setAuditLogs(logsQuery.data.list);
  }, [logsQuery.data]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const toggleStatus = async (id: number) => {
    const target = members.find((m) => m.id === id);
    if (!target) return;
    const next = target.status === '启用' ? '停用' : '启用';
    // 乐观更新,失败回滚
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: next } : m))
    );
    const res = await api.updateUser(id, { status: next });
    if (res.code !== 200) {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: target.status } : m))
      );
      showToast(res.message || '状态更新失败');
      return;
    }
    showToast(`成员 ${target.name} 已设置为${next}`);
    logsQuery.reload();
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || saving) return;
    setSaving(true);
    setModalError(null);
    try {
      const res = await api.createUser({
        name: newUserName.trim(),
        title: '核查专员',
        handle: `@${newUserName.trim().toLowerCase()}`,
        role: newUserRole,
        department: newUserRole === '审核员' ? '审核组' : '分析组',
        email: `${newUserName.trim().toLowerCase()}@zhentan.cn`,
        status: '启用',
      });
      if (res.code === 200) {
        setAddUserModal(false);
        setNewUserName('');
        showToast(`已成功添加成员 ${newUserName.trim()}`);
        usersQuery.reload();
        logsQuery.reload();
      } else {
        setModalError(res.message || '新增成员失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (roleFilter === '全部') return members;
    return members.filter((m) => m.role === roleFilter);
  }, [roleFilter, members]);

  // 统计卡片(由后端数据计算)
  const roleCount = (role: string) => members.filter((m) => m.role === role).length;
  const activeCount = members.filter((m) => m.status === '启用').length;
  const disabledCount = members.length - activeCount;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case '管理员':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
            管理员
          </span>
        );
      case '审核员':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            审核员
          </span>
        );
      case '核查员':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            核查员
          </span>
        );
      default:
        return <span>{role}</span>;
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg flex items-center justify-between shadow-sm">
          <span>✓ {toastMsg}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="text-blue-800 font-semibold underline cursor-pointer"
          >
            知道了
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
            用户管理
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            系统用户与权限管理，支持成员协作与操作留痕 (共 {members.length} 人)
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-400">
          在岗 {activeCount} 人 · 停用 {disabledCount} 人
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">成员总数</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{members.length}</span>
            <span className="text-[10px] text-slate-400">在岗 {activeCount} · 停用 {disabledCount}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${members.length ? Math.round((activeCount / members.length) * 100) : 0}%` }}></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">管理员</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#2563EB] tabular-nums">{roleCount('管理员')}</span>
            <span className="text-[10px] text-slate-400">全部权限 · 可编辑知识库</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#2563EB] h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">审核员</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 tabular-nums">{roleCount('审核员')}</span>
            <span className="text-[10px] text-slate-400">终审定论 · 不可删除证据</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${members.length ? Math.round((roleCount('审核员') / members.length) * 100) : 0}%` }}></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">核查员</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">{roleCount('核查员')}</span>
            <span className="text-[10px] text-slate-400">提交线索 · 参与 9 环节</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* 2-Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left 8 Cols */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* Card: 成员列表 Table */}
          <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                <span className="font-bold text-[#0F172A] text-[13px]">成员列表</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Role Filter Pills */}
                <div className="flex items-center gap-1 text-[11px]">
                  {(['全部', '管理员', '审核员', '核查员'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-2.5 py-0.5 rounded transition-colors cursor-pointer ${
                        roleFilter === r
                          ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {r === '全部' ? '全部角色' : r}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setAddUserModal(true)}
                  className="px-2.5 py-1 rounded bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  新增用户
                </button>
              </div>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11.5px] text-slate-600">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-500 font-semibold select-none">
                  <tr>
                    <th className="py-2.5 pl-4 pr-3 whitespace-nowrap">姓名</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">账号</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">角色</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">部门</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">邮箱</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">状态</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">最近活跃</th>
                    <th className="py-2.5 pr-4 pl-3 whitespace-nowrap text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersQuery.loading && members.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-3">
                        <LoadingCards rows={3} />
                      </td>
                    </tr>
                  ) : usersQuery.error && members.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-2">
                        <LoadErrorBar message={usersQuery.error} onRetry={usersQuery.reload} />
                      </td>
                    </tr>
                  ) : filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 pl-4 pr-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-[#2563EB] font-bold text-[11px] flex items-center justify-center shrink-0">
                            {m.avatarChar}
                          </span>
                          <div>
                            <div className="font-bold text-slate-800 text-[12px]">{m.name}</div>
                            <div className="text-[10px] text-slate-400">{m.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {m.handle}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {getRoleBadge(m.role)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {m.department}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {m.email}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {m.status === '启用' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            启用
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            停用
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 tabular-nums whitespace-nowrap text-[11px]">
                        {m.lastActive}
                      </td>
                      <td className="py-2.5 pr-4 pl-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => {}}
                            className="text-slate-600 hover:text-blue-600 cursor-pointer"
                          >
                            编辑
                          </button>
                          <span className="text-slate-300">·</span>
                          <button
                            type="button"
                            onClick={() => toggleStatus(m.id)}
                            className="text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            {m.status === '启用' ? '停用' : '启用'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div>所有操作留痕可追溯 · 删除账号需管理员二次确认</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  导出成员表
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium transition-colors cursor-pointer"
                >
                  查看操作日志
                </button>
              </div>
            </div>
          </div>

          {/* Card: 最近操作日志 */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                最近操作日志
              </div>
              <span className="text-[10px] text-slate-400">近 7 天 128 次</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] text-slate-600">
                <thead className="text-[10px] text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="pb-1.5 font-medium">时间</th>
                    <th className="pb-1.5 font-medium">成员</th>
                    <th className="pb-1.5 font-medium">动作</th>
                    <th className="pb-1.5 font-medium">对象</th>
                    <th className="pb-1.5 font-medium text-right">结果</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logsQuery.loading && auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-3">
                        <LoadingCards rows={2} />
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[11px] text-slate-400">
                        暂无操作日志
                      </td>
                    </tr>
                  ) : auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-2 font-mono text-slate-400 tabular-nums">
                        {log.time}
                      </td>
                      <td className="py-2 font-medium text-slate-800">{log.member}</td>
                      <td className="py-2 text-slate-600">{log.action}</td>
                      <td className="py-2 text-slate-600 max-w-xs truncate">{log.target}</td>
                      <td className="py-2 text-right">
                        {log.result === '成功' ? (
                          <span className="text-emerald-600 font-medium">成功</span>
                        ) : (
                          <span className="text-amber-600 font-medium">需复核</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Cols */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Card 1: 权限矩阵 */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                权限矩阵
              </div>
              <span className="text-[10px] text-slate-400">按角色</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="text-[10.5px] text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="pb-1.5 font-medium">权限</th>
                    <th className="pb-1.5 font-medium text-center">管理员</th>
                    <th className="pb-1.5 font-medium text-center">审核员</th>
                    <th className="pb-1.5 font-medium text-center">核查员</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  <tr>
                    <td className="py-1.5">提交线索</td>
                    <td className="py-1.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-1.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-1.5 text-center text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">推进 9 环节</td>
                    <td className="py-1.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-1.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-1.5 text-center text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">终审定论</td>
                    <td className="py-1.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-1.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-1.5 text-center text-slate-300">—</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">删除证据</td>
                    <td className="py-1.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-1.5 text-center text-slate-300">—</td>
                    <td className="py-1.5 text-center text-slate-300">—</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">编辑知识库</td>
                    <td className="py-1.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-1.5 text-center text-slate-300">—</td>
                    <td className="py-1.5 text-center text-slate-300">—</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">管理用户</td>
                    <td className="py-1.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-1.5 text-center text-slate-300">—</td>
                    <td className="py-1.5 text-center text-slate-300">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: 角色说明 */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3 text-[11px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                角色说明
              </div>
              <span className="text-[10px] text-slate-400">3 类</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  管
                </span>
                <div>
                  <div className="font-bold text-slate-800">管理员</div>
                  <div className="text-slate-500 text-[10.5px]">张明 · 全部权限，负责账号与知识库</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  审
                </span>
                <div>
                  <div className="font-bold text-slate-800">审核员</div>
                  <div className="text-slate-500 text-[10.5px]">赵强、刘洋 · 终审定论，AI 不直接判定真假</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded bg-teal-100 text-teal-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  核
                </span>
                <div>
                  <div className="font-bold text-slate-800">核查员</div>
                  <div className="text-slate-500 text-[10.5px]">李华、王芳、陈静 · 推进环节、搜集证据</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 成员任务负载 */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                成员任务负载
              </div>
              <span className="text-[10px] text-slate-400">进行中案件</span>
            </div>

            <div className="space-y-2 text-[11px]">
              {[
                { name: '王思思', count: 3, w: '75%' },
                { name: '李华', count: 2, w: '50%' },
                { name: '王芳', count: 2, w: '50%' },
                { name: '赵强', count: 1, w: '25%' },
                { name: '刘洋', count: 1, w: '25%' },
              ].map((m) => (
                <div key={m.name} className="flex items-center gap-2">
                  <span className="w-12 text-slate-600">{m.name}</span>
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: m.w }}
                    ></div>
                  </div>
                  <span className="w-6 text-right font-bold text-slate-800 tabular-nums">
                    {m.count} 件
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400">单人上限 4 件</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 font-medium">
                无异常登录
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {addUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">新增系统用户</h3>
              <button
                onClick={() => setAddUserModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              {modalError ? (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px]">
                  {modalError}
                </div>
              ) : null}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">成员姓名</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="如: 陈晓明"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">系统角色</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="核查员">核查员 (提交线索 · 推进 9 环节)</option>
                  <option value="审核员">审核员 (终审定论)</option>
                  <option value="管理员">管理员 (系统全权限)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddUserModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? '正在添加…' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
