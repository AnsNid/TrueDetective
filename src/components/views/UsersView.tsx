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
  Upload,
} from 'lucide-react';
import { api } from '../../api/client';
import type { MemberItemApi } from '../../api/client';
import { useApiData, LoadErrorBar, LoadingCards } from '../../api/hooks';
import type { AuthenticatedUser } from '../LoginPage';
import { hasPerm } from '../../auth/permissions';
import type { RoleCode, RoleSystem } from '../../auth/permissions';

/** 工作室体系角色选项 */
const STUDIO_ROLES: { code: RoleCode; label: string; hint: string }[] = [
  { code: 'super_admin', label: '超级管理员/总编', hint: '全部功能 · 双体系数据' },
  { code: 'studio_lead', label: '工作室负责人', hint: '全部功能 · 工作室数据' },
  { code: 'minister', label: '部长', hint: '无用户管理 · 可审核' },
  { code: 'member', label: '成员', hint: '无统计看板 · 执行核查' },
];

/** 教学体系角色选项 */
const TEACHING_ROLES: { code: RoleCode; label: string; hint: string }[] = [
  { code: 'teacher', label: '授课老师/实验员', hint: '教学实训 · 全部教学任务' },
  { code: 'student', label: '学生', hint: '仅本人新建任务' },
];

const roleOptions = (system: RoleSystem) =>
  system === 'teaching' ? TEACHING_ROLES : STUDIO_ROLES;

interface EditFormState {
  id: number;
  name: string;
  title: string;
  handle: string;
  roleSystem: RoleSystem;
  role: string;
  department: string;
  email: string;
}

interface AddFormState {
  name: string;
  roleSystem: RoleSystem;
  role: string;
  email: string;
  account: string;
  password: string;
}

interface ImportResult {
  created: { no: string; name: string; username: string; password: string }[];
  skipped: { no: string; name: string; reason: string }[];
}

interface UsersViewProps {
  currentUser?: AuthenticatedUser | null;
}

export const UsersView: React.FC<UsersViewProps> = ({ currentUser }) => {
  const [systemFilter, setSystemFilter] = useState<'全部' | RoleSystem>('全部');
  const [members, setMembers] = useState<MemberItemApi[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [addUserModal, setAddUserModal] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>({
    name: '',
    roleSystem: 'studio',
    role: 'member',
    email: '',
    account: '',
    password: '',
  });
  const [editModal, setEditModal] = useState<EditFormState | null>(null);
  const [logsModal, setLogsModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MemberItemApi | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [createdAccount, setCreatedAccount] = useState<{ username: string; password: string } | null>(null);

  // 批量导入学生
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // 重置成员密码
  const [resetPwdTarget, setResetPwdTarget] = useState<MemberItemApi | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState('');
  const [resetPwdSaving, setResetPwdSaving] = useState(false);

  const handleResetPassword = async () => {
    if (!resetPwdTarget || resetPwdSaving) return;
    setResetPwdSaving(true);
    setModalError(null);
    try {
      const res = await api.resetUserPassword(
        resetPwdTarget.id,
        resetPwdValue.trim() || undefined
      );
      if (res.code === 200) {
        setResetPwdTarget(null);
        setResetPwdValue('');
        setCreatedAccount({
          username: resetPwdTarget.handle || resetPwdTarget.name,
          password: res.data?.initial_password ?? '',
        });
        showToast(`已重置 ${resetPwdTarget.name} 的密码(见下方提示,仅显示一次)`);
        logsQuery.reload();
      } else {
        setModalError(res.message || '重置失败');
      }
    } finally {
      setResetPwdSaving(false);
    }
  };

  // 后端成员与审计日志(权限以后端下发的 permissions 为准)
  const usersQuery = useApiData<{ list: MemberItemApi[]; role: string }>(() => api.users());
  const logsQuery = useApiData<{ list: any[]; role: string }>(() => api.auditLogs());
  const canManage = hasPerm(currentUser?.permissions, 'users.manage');
  const canImport = hasPerm(currentUser?.permissions, 'students.import');

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
    if (systemFilter === '全部') return members;
    return members.filter((m) => m.roleSystem === systemFilter);
  }, [systemFilter, members]);

  // 统计卡片(由后端数据计算)
  const systemCount = (system: RoleSystem) =>
    members.filter((m) => m.roleSystem === system).length;
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
    if (addForm.roleSystem === 'teaching' && !/^\d{4,20}$/.test(addForm.account.trim())) {
      setModalError('教学体系登录账号必须为 4-20 位纯数字工号');
      return;
    }
    setSaving(true);
    setModalError(null);
    try {
      const res = await api.createUser({
        name: addForm.name.trim(),
        roleSystem: addForm.roleSystem,
        role: addForm.role,
        account: addForm.roleSystem === 'teaching' ? addForm.account.trim() : undefined,
        email: addForm.roleSystem === 'studio' ? addForm.email.trim() : undefined,
        password: addForm.password.trim() || undefined,
        status: '启用',
      });
      if (res.code === 200) {
        setAddUserModal(false);
        setAddForm({ name: '', roleSystem: 'studio', role: 'member', email: '', account: '', password: '' });
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
        roleSystem: editModal.roleSystem,
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
    const header = ['姓名', '职务', '句柄', '体系', '角色', '部门', '邮箱', '状态', '在办负载', '最近活跃'];
    const rows = members.map((m) => [
      m.name, m.title, m.handle, m.systemLabel ?? (m.roleSystem === 'teaching' ? '教学' : '工作室'),
      m.roleLabel ?? m.role, m.department, m.email, m.status,
      String(m.load ?? 0), m.lastActive,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `核查平台成员表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('成员表已导出 CSV');
  };

  const getRoleBadge = (m: MemberItemApi) => {
    const studioBadge: Record<string, string> = {
      super_admin: 'bg-blue-50 text-blue-600 border-blue-200',
      studio_lead: 'bg-sky-50 text-sky-600 border-sky-200',
      minister: 'bg-amber-50 text-amber-600 border-amber-200',
      member: 'bg-slate-50 text-slate-500 border-slate-200',
    };
    const teachingBadge: Record<string, string> = {
      teacher: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      student: 'bg-violet-50 text-violet-600 border-violet-200',
    };
    const cls =
      m.roleSystem === 'teaching'
        ? teachingBadge[m.role] ?? teachingBadge.student
        : studioBadge[m.role] ?? studioBadge.member;
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${cls}`}>
          {m.roleLabel ?? m.role}
        </span>
        <span
          className={`px-1 py-0.5 rounded text-[9px] font-bold ${
            m.roleSystem === 'teaching'
              ? 'bg-indigo-50 text-indigo-500 border border-indigo-100'
              : 'bg-slate-50 text-slate-400 border border-slate-200'
          }`}
        >
          {m.systemLabel ?? (m.roleSystem === 'teaching' ? '教学' : '工作室')}
        </span>
      </span>
    );
  };

  /** 批量导入学生:提交「学号 姓名」文本,展示结果并支持导出密码 CSV */
  const handleImportStudents = async () => {
    if (importing) return;
    if (!importText.trim()) {
      setModalError('请粘贴「学号 姓名」名单,每行一条');
      return;
    }
    setImporting(true);
    setModalError(null);
    try {
      const res = await api.importStudents(importText);
      if (res.code === 200) {
        setImportResult(res.data);
        setImportText('');
        usersQuery.reload();
        logsQuery.reload();
        showToast(res.message || '导入完成');
      } else {
        setModalError(res.message || '导入失败');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleExportImported = () => {
    if (!importResult) return;
    const header = ['学号', '姓名', '初始密码'];
    const rows = importResult.created.map((c) => [c.no, c.name, c.password]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `学生账号初始密码_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <div className="text-[11px] text-slate-500 font-medium">工作室体系</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#2563EB] tabular-nums">{systemCount('studio')}</span>
            <span className="text-[10px] text-slate-400">总编/负责人/部长/成员</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#2563EB] h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">教学体系</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-600 tabular-nums">{systemCount('teaching')}</span>
            <span className="text-[10px] text-slate-400">老师 {members.filter((m) => m.role === 'teacher').length} · 学生 {members.filter((m) => m.role === 'student').length}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${members.length ? Math.round((systemCount('teaching') / members.length) * 100) : 0}%` }}></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">停用账号</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-600 tabular-nums">{disabledCount}</span>
            <span className="text-[10px] text-slate-400">停用后不可登录</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${members.length ? Math.round((disabledCount / members.length) * 100) : 0}%` }}></div>
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
              {(['全部', 'studio', 'teaching'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setSystemFilter(r)}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer text-[11.5px] ${
                    systemFilter === r
                      ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r === '全部' ? '全部体系' : r === 'studio' ? '工作室体系' : '教学体系'}
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
              {canImport && (
                <button
                  type="button"
                  onClick={() => {
                    setImportModal(true);
                    setImportResult(null);
                    setModalError(null);
                  }}
                  className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  批量导入学生
                </button>
              )}
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
                      <td className="py-2.5 px-3 whitespace-nowrap">{getRoleBadge(m)}</td>
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
                                    roleSystem: m.roleSystem ?? 'studio',
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
                                onClick={() => {
                                  setResetPwdTarget(m);
                                  setResetPwdValue('');
                                  setModalError(null);
                                }}
                                disabled={!m.hasAccount}
                                title={!m.hasAccount ? '该成员未绑定登录账号' : '重置该成员的登录密码'}
                                className="text-slate-500 hover:text-blue-600 cursor-pointer disabled:text-slate-300 disabled:cursor-not-allowed"
                              >
                                重置密码
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
                            <span className="text-slate-300">管理需总编/负责人</span>
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
                      <span className="text-slate-400">{m.roleLabel ?? m.role} · {m.load} 件</span>
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
            <table className="w-full text-left text-[10.5px] text-slate-600">
              <thead className="text-[9.5px] text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="pb-1.5 font-medium">功能</th>
                  <th className="pb-1.5 font-medium text-center">总编</th>
                  <th className="pb-1.5 font-medium text-center">负责人</th>
                  <th className="pb-1.5 font-medium text-center">部长</th>
                  <th className="pb-1.5 font-medium text-center">成员</th>
                  <th className="pb-1.5 font-medium text-center">老师</th>
                  <th className="pb-1.5 font-medium text-center">学生</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { op: '新建任务/推进环节', p: [true, true, true, true, true, true] },
                  { op: '工作台/证据库/知识库', p: [true, true, true, true, false, false] },
                  { op: '数据统计看板', p: [true, true, true, false, false, false] },
                  { op: '人工审核/案例沉淀', p: [true, true, true, false, false, false] },
                  { op: '知识库编辑', p: [true, true, true, false, false, false] },
                  { op: '删除案件/知识库', p: [true, true, false, false, false, false] },
                  { op: '用户管理/导入学生', p: [true, true, false, false, false, false] },
                ].map((row) => (
                  <tr key={row.op}>
                    <td className="py-1.5 pr-1">{row.op}</td>
                    {row.p.map((ok, i) => (
                      <td key={i} className="py-1.5 text-center">
                        {ok ? (
                          <Check className="w-3 h-3 text-emerald-500 inline" />
                        ) : (
                          <span className="text-slate-300 text-[9px]">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              数据可见范围:总编=双体系全部;负责人/部长/成员=工作室任务;老师=教学任务;学生=仅本人新建。两套体系数据互不可见(总编除外)。
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
                <label className="block text-slate-700 font-semibold mb-1">角色体系</label>
                <select
                  value={addForm.roleSystem}
                  onChange={(e) => {
                    const system = e.target.value as RoleSystem;
                    setAddForm({
                      ...addForm,
                      roleSystem: system,
                      role: system === 'teaching' ? 'teacher' : 'member',
                    });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="studio">工作室体系 (总编/负责人/部长/成员)</option>
                  <option value="teaching">教学体系 (授课老师/实验员)</option>
                </select>
              </div>
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
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {roleOptions(addForm.roleSystem).map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label} ({r.hint})
                    </option>
                  ))}
                </select>
              </div>
              {addForm.roleSystem === 'studio' ? (
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
              ) : (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    工号 <span className="text-slate-400 font-normal">(纯数字,作为登录账号)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={addForm.account}
                    onChange={(e) => setAddForm({ ...addForm, account: e.target.value })}
                    placeholder="如: 10086"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  初始密码{' '}
                  <span className="text-slate-400 font-normal">
                    (留空:{addForm.roleSystem === 'studio' ? '默认 Zt@2026' : '随机生成,仅本次显示'})
                  </span>
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
                <label className="block text-slate-700 font-semibold mb-1">角色体系 / 角色</label>
                <div className="flex gap-2">
                  <select
                    value={editModal.roleSystem}
                    onChange={(e) => {
                      const system = e.target.value as RoleSystem;
                      setEditModal({
                        ...editModal,
                        roleSystem: system,
                        role: system === 'teaching' ? 'teacher' : 'member',
                      });
                    }}
                    className="w-2/5 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="studio">工作室</option>
                    <option value="teaching">教学</option>
                  </select>
                  <select
                    value={editModal.role}
                    onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {roleOptions(editModal.roleSystem).map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
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

      {/* Reset Password Modal */}
      {resetPwdTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  重置 {resetPwdTarget.name} 的密码?
                </h3>
                <p className="text-[11.5px] text-slate-500 mt-1 leading-relaxed">
                  账号 <span className="font-mono">{resetPwdTarget.handle}</span>
                  的密码将立即失效。留空将随机生成 8 位密码(仅显示一次,可导出)。
                </p>
              </div>
            </div>
            {modalError && (
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px]">
                {modalError}
              </div>
            )}
            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">
                新密码 <span className="text-slate-400 font-normal">(留空随机生成)</span>
              </label>
              <input
                type="text"
                value={resetPwdValue}
                onChange={(e) => setResetPwdValue(e.target.value)}
                placeholder="不少于 6 位,留空随机"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetPwdTarget(null)}
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer text-xs"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetPwdSaving}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium cursor-pointer disabled:cursor-not-allowed text-xs"
              >
                {resetPwdSaving ? '重置中…' : '确认重置'}
              </button>
            </div>
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

      {/* Import Students Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-indigo-500" /> 批量导入学生(教学体系)
              </h3>
              <button
                onClick={() => setImportModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto -mx-1 px-1">
              {modalError && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px]">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  名单 <span className="text-slate-400 font-normal">每行一条:「学号 姓名」或「学号,姓名」</span>
                </label>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={'20261001 张三\n20261002,李四\n20261003 王五'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11.5px]"
                  disabled={importing}
                />
                <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                  学号须为 4-20 位纯数字;姓名仅展示不做系统校验;每个账号随机生成 8 位初始密码,仅导入结果中显示一次,请及时导出分发。
                </p>
              </div>

              {importResult && (
                <div className="space-y-2.5">
                  <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                    导入完成:成功 {importResult.created.length} 人,跳过 {importResult.skipped.length} 人
                  </div>
                  {importResult.created.length > 0 && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/60 border-b border-indigo-100">
                        <span className="font-semibold text-indigo-700 text-[11px]">
                          初始密码(仅本次显示)
                        </span>
                        <button
                          type="button"
                          onClick={handleExportImported}
                          className="px-2.5 py-1 rounded bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-medium text-[10.5px] cursor-pointer flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> 导出 CSV
                        </button>
                      </div>
                      <table className="w-full text-left text-[11px] text-slate-600">
                        <thead className="bg-slate-50/70 text-[10px] text-slate-400 border-b border-slate-100">
                          <tr>
                            <th className="py-1.5 px-3 font-medium">学号</th>
                            <th className="py-1.5 px-3 font-medium">姓名</th>
                            <th className="py-1.5 px-3 font-medium">初始密码</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {importResult.created.map((c) => (
                            <tr key={c.no}>
                              <td className="py-1.5 px-3 font-mono">{c.no}</td>
                              <td className="py-1.5 px-3">{c.name}</td>
                              <td className="py-1.5 px-3 font-mono font-bold text-indigo-600">{c.password}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {importResult.skipped.length > 0 && (
                    <div className="border border-amber-200 rounded-lg overflow-hidden">
                      <div className="px-3 py-1.5 bg-amber-50 text-amber-700 text-[10.5px] font-semibold border-b border-amber-100">
                        已跳过 {importResult.skipped.length} 条
                      </div>
                      <table className="w-full text-left text-[11px] text-slate-600">
                        <tbody className="divide-y divide-slate-50">
                          {importResult.skipped.map((s, i) => (
                            <tr key={i}>
                              <td className="py-1.5 px-3 font-mono">{s.no || '—'}</td>
                              <td className="py-1.5 px-3">{s.name || '—'}</td>
                              <td className="py-1.5 px-3 text-amber-600">{s.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImportModal(false)}
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={handleImportStudents}
                disabled={importing}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-300 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {importing ? '正在导入…' : '开始导入'}
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
