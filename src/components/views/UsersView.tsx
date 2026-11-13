import React, { useState, useMemo, useEffect } from 'react';
import {
  UserPlus,
  Shield,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Check,
  Trash2,
  ScrollText,
} from 'lucide-react';
import { api } from '../../api/client';
import type { MemberItemApi } from '../../api/client';
import { useApiData, LoadErrorBar, LoadingCards } from '../../api/hooks';

interface EditFormState {
  id: number;
  name: string;
  title: string;
  handle: string;
  role: MemberItemApi['role'];
  department: string;
  email: string;
}

interface AddFormState {
  name: string;
  role: MemberItemApi['role'];
  email: string;
  password: string;
}

export const UsersView: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<'全部' | '管理员' | '审核员' | '核查员'>('全部');
  const [members, setMembers] = useState<MemberItemApi[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [addUserModal, setAddUserModal] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>({ name: '', role: '核查员', email: '', password: '' });
  const [editModal, setEditModal] = useState<EditFormState | null>(null);
  const [logsModal, setLogsModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MemberItemApi | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [createdAccount, setCreatedAccount] = useState<{ username: string; password: string } | null>(null);

  // 后端成员与审计日志
  const usersQuery = useApiData<{ list: MemberItemApi[]; role: string }>(() => api.users());
  const logsQuery = useApiData<{ list: any[]; role: string }>(() => api.auditLogs());
  const myRole = usersQuery.data?.role ?? '核查员';
  const canManage = myRole === '管理员';

  useEffect(() => {
    if (usersQuery.data?.list) setMembers(usersQuery.data.list);
  }, [usersQuery.data]);
  useEffect(() => {
    if (logsQuery.data?.list) setAuditLogs(logsQuery.data.list);
  }, [logsQuery.data]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const filteredMembers = useMemo(() => {
    if (roleFilter === '全部') return members;
    return members.filter((m) => m.role === roleFilter);
  }, [roleFilter, members]);

  // 统计卡片(由后端数据计算)
  const roleCount = (role: string) => members.filter((m) => m.role === role).length;
  const activeCount = members.filter((m) => m.status === '启用').length;
  const disabledCount = members.length - activeCount;
  const maxLoad = Math.max(...members.map((m) => m.load ?? 0), 1);

  const toggleStatus = async (id: number) => {
    const target = members.find((m) => m.id === id);
    if (!target) return;
    const next = target.status === '启用' ? '停用' : '启用';
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
    if (!addForm.name.trim() || saving) return;
    setSaving(true);
    setModalError(null);
    try {
      const res = await api.createUser({
        name: addForm.name.trim(),
        title: addForm.role === '审核员' ? '终审定论' : '核查专员',
        role: addForm.role,
        department: addForm.role === '审核员' ? '审核组' : '分析组',
        email: addForm.email.trim(),
        password: addForm.password.trim() || undefined,
        status: '启用',
      });
      if (res.code === 200) {
        setAddUserModal(false);
        setAddForm({ name: '', role: '核查员', email: '', password: '' });
        showToast(
          `已添加成员 ${res.data?.member?.name ?? ''},登录账号已创建(初始密码见提示)`
        );
        setCreatedAccount({
          username: res.data?.username ?? '',
          password: res.data?.initial_password ?? '',
        });
        usersQuery.reload();
        logsQuery.reload();
      } else {
        setModalError(res.message || '新增成员失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal || saving) return;
    setSaving(true);
    setModalError(null);
    try {
      const res = await api.updateUser(editModal.id, {
        name: editModal.name,
        title: editModal.title,
        handle: editModal.handle,
        role: editModal.role,
        department: editModal.department,
        email: editModal.email,
      });
      if (res.code === 200) {
        setEditModal(null);
        showToast('成员信息已更新');
        usersQuery.reload();
        logsQuery.reload();
      } else {
        setModalError(res.message || '更新失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || saving) return;
    setSaving(true);
    try {
      const res = await api.deleteUser(deleteTarget.id);
      if (res.code === 200) {
        setDeleteTarget(null);
        showToast('成员已删除,登录账号已停用');
        usersQuery.reload();
        logsQuery.reload();
      } else {
        setDeleteTarget(null);
        showToast(res.message || '删除失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const header = ['姓名', '职务', '句柄', '角色', '部门', '邮箱', '状态', '在办负载', '最近活跃'];
    const rows = members.map((m) => [
      m.name, m.title, m.handle, m.role, m.department, m.email, m.status,
      String(m.load ?? 0), m.lastActive,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `真探成员表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('成员表已导出 CSV');
  };

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
          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            审核员
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
            核查员
          </span>
        );
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Toast */}
      {toastMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg flex items-center justify-between shadow-sm">
          <span>✓ {toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-blue-800 font-semibold underline cursor-pointer">
            知道了
          </button>
        </div>
      )}

      {/* 新建账号凭据提示(初始密码仅显示一次) */}
      {createdAccount && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg space-y-1.5 shadow-sm">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> 登录账号已创建(初始密码仅本次显示)
          </div>
          <div className="font-mono bg-white/70 rounded px-2.5 py-1.5 border border-emerald-100 inline-block">
            账号: {createdAccount.username} · 初始密码: {createdAccount.password}
          </div>
          <button
            onClick={() => setCreatedAccount(null)}
            className="text-emerald-700 font-semibold underline cursor-pointer ml-2"
          >
            我已保存,关闭
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

      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left 8 Cols: Members Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
          {/* Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              {(['全部', '管理员', '审核员', '核查员'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer text-[11.5px] ${
                    roleFilter === r
                      ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r === '全部' ? '全部角色' : r}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer text-[11px]"
              >
                导出成员表
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogsModal(true);
                  logsQuery.reload();
                }}
                className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium transition-colors cursor-pointer text-[11px]"
              >
                查看操作日志
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setAddUserModal(true)}
                  className="px-2.5 py-1 rounded bg-[#2563EB] hover:bg-blue-700 text-white font-medium flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  新增用户
                </button>
              )}
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
                  <th className="py-2.5 px-3 whitespace-nowrap">在办</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">状态</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">最近活跃</th>
                  <th className="py-2.5 pr-4 pl-3 whitespace-nowrap text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersQuery.loading && members.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-3">
                      <LoadingCards rows={3} />
                    </td>
                  </tr>
                ) : usersQuery.error && members.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-2">
                      <LoadErrorBar message={usersQuery.error} onRetry={usersQuery.reload} />
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-[12px] text-slate-400">
                      暂无成员
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
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
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-slate-500">{m.handle}</span>
                        {!m.hasAccount && (
                          <span className="ml-1.5 px-1 py-0.5 rounded text-[9px] bg-amber-50 text-amber-600 border border-amber-200">
                            无登录账号
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{getRoleBadge(m.role)}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{m.department}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">{m.email || '—'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`font-bold tabular-nums ${(m.load ?? 0) >= 4 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {m.load ?? 0} 件
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.status === '启用'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 tabular-nums">{m.lastActive}</td>
                      <td className="py-2.5 pr-4 pl-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 text-[11px]">
                          {canManage ? (
                            <>
                              <button
                                onClick={() =>
                                  setEditModal({
                                    id: m.id,
                                    name: m.name,
                                    title: m.title,
                                    handle: m.handle,
                                    role: m.role,
                                    department: m.department,
                                    email: m.email,
                                  })
                                }
                                className="text-slate-500 hover:text-blue-600 cursor-pointer"
                              >
                                编辑
                              </button>
                              <span className="text-slate-300">·</span>
                              <button
                                onClick={() => toggleStatus(m.id)}
                                className="text-slate-500 hover:text-amber-600 cursor-pointer"
                              >
                                {m.status === '启用' ? '停用' : '启用'}
                              </button>
                              <span className="text-slate-300">·</span>
                              <button
                                onClick={() => setDeleteTarget(m)}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                删除
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-300">管理需管理员</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Cols: Load & Permissions */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Workload */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                任务负载 (在办案件)
              </div>
              <span className="text-[10px] text-slate-400">实时统计</span>
            </div>
            <div className="space-y-2.5">
              {members
                .filter((m) => (m.load ?? 0) > 0)
                .sort((a, b) => (b.load ?? 0) - (a.load ?? 0))
                .slice(0, 5)
                .map((m) => (
                  <div key={m.id}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-600 font-medium">{m.name}</span>
                      <span className="text-slate-400">{m.role} · {m.load} 件</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${(m.load ?? 0) >= 4 ? 'bg-rose-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.round(((m.load ?? 0) / maxLoad) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              {members.filter((m) => (m.load ?? 0) > 0).length === 0 && (
                <div className="text-[11px] text-slate-400 py-2 text-center">当前无在办任务</div>
              )}
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400">单人上限 4 件</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 font-medium">
                {members.filter((m) => (m.load ?? 0) > 4).length === 0 ? '负载正常' : `${members.filter((m) => (m.load ?? 0) > 4).length} 人超载`}
              </span>
            </div>
          </div>

          {/* Permissions matrix */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#0F172A]">
                <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
                权限矩阵
              </div>
              <span className="text-[10px] text-slate-400">接口级 RBAC</span>
            </div>
            <table className="w-full text-left text-[11px] text-slate-600">
              <thead className="text-[10px] text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="pb-1.5 font-medium">操作</th>
                  <th className="pb-1.5 font-medium text-center">管理员</th>
                  <th className="pb-1.5 font-medium text-center">审核员</th>
                  <th className="pb-1.5 font-medium text-center">核查员</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { op: '提交线索/推进环节', p: [true, true, true] },
                  { op: '终审结案', p: [true, true, false] },
                  { op: '案例沉淀', p: [true, true, false] },
                  { op: '知识库编辑', p: [true, true, false] },
                  { op: '知识库删除', p: [true, false, false] },
                  { op: '成员管理/删除案件', p: [true, false, false] },
                ].map((row) => (
                  <tr key={row.op}>
                    <td className="py-1.5">{row.op}</td>
                    {row.p.map((ok, i) => (
                      <td key={i} className="py-1.5 text-center">
                        {ok ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 inline" />
                        ) : (
                          <span className="text-slate-300 text-[10px]">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              当前登录角色「{myRole}」。操作人与审核人由服务端会话身份确定,不可伪造。
            </p>
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
              {modalError && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px]">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">成员姓名 *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="如: 陈晓明"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">系统角色</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value as MemberItemApi['role'] })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="核查员">核查员 (提交线索 · 推进 9 环节)</option>
                  <option value="审核员">审核员 (终审定论)</option>
                  <option value="管理员">管理员 (系统全权限)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  登录邮箱 <span className="text-slate-400 font-normal">(作为登录账号)</span>
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="如: chenxm@zhentan.org"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  初始密码 <span className="text-slate-400 font-normal">(留空默认 Zt@2026)</span>
                </label>
                <input
                  type="text"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="不少于 6 位"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddUserModal(false)}
                  className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? '正在创建…' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">编辑成员 · {editModal.name}</h3>
              <button
                onClick={() => setEditModal(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              {modalError && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px]">
                  {modalError}
                </div>
              )}
              {(
                [
                  ['name', '姓名'],
                  ['title', '职务'],
                  ['handle', '句柄'],
                  ['department', '部门'],
                  ['email', '邮箱'],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-slate-700 font-semibold mb-1">{label}</label>
                  <input
                    type="text"
                    value={editModal[field]}
                    onChange={(e) => setEditModal({ ...editModal, [field]: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">角色</label>
                <select
                  value={editModal.role}
                  onChange={(e) => setEditModal({ ...editModal, role: e.target.value as MemberItemApi['role'] })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="核查员">核查员</option>
                  <option value="审核员">审核员</option>
                  <option value="管理员">管理员</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? '正在保存…' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">删除成员 {deleteTarget.name}?</h3>
                <p className="text-[11.5px] text-slate-500 mt-1 leading-relaxed">
                  成员将从花名册移除,关联登录账号将同步停用(不可再登录)。该操作会记录审计日志。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer text-xs"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-lg font-medium cursor-pointer text-xs"
              >
                {saving ? '删除中…' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {logsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-5 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ScrollText className="w-4 h-4 text-[#2563EB]" /> 操作审计日志
              </h3>
              <button
                onClick={() => setLogsModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto -mx-1 px-1">
              <table className="w-full text-left text-[11px] text-slate-600">
                <thead className="text-[10px] text-slate-400 border-b border-slate-100 sticky top-0 bg-white">
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
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2 font-mono text-slate-400 tabular-nums whitespace-nowrap">{log.time}</td>
                        <td className="py-2 whitespace-nowrap font-medium text-slate-700">{log.member}</td>
                        <td className="py-2 whitespace-nowrap">{log.action}</td>
                        <td className="py-2 text-slate-500">{log.target}</td>
                        <td className="py-2 text-right">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              log.result === '成功'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {log.result}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
