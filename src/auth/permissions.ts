/**
 * 双角色体系常量与工具
 *
 * 后端是权限的唯一事实源(getUserInfo 下发 permissions[]),
 * 本文件只提供角色/体系的展示映射与 hasPerm 判断,不做权限推导。
 *
 * 工作室体系 studio: super_admin(超级管理员/总编) studio_lead(工作室负责人) minister(部长) member(成员)
 * 教学体系 teaching:  teacher(授课老师/实验员) student(学生)
 */

export type RoleSystem = 'studio' | 'teaching';

export type RoleCode =
  | 'super_admin'
  | 'studio_lead'
  | 'minister'
  | 'member'
  | 'teacher'
  | 'student';

export const ROLE_LABELS: Record<RoleCode, string> = {
  super_admin: '超级管理员/总编',
  studio_lead: '工作室负责人',
  minister: '部长',
  member: '成员',
  teacher: '授课老师/实验员',
  student: '学生',
};

export const SYSTEM_LABELS: Record<RoleSystem, string> = {
  studio: '工作室',
  teaching: '教学',
};

/** 与后端 Responses::rolePermissions() 对应的功能权限键 */
export type Permission =
  | 'dashboard.view'
  | 'statistics.view'
  | 'clues.create'
  | 'tasks.view'
  | 'case.view'
  | 'case.review'
  | 'case.delete'
  | 'evidence.view'
  | 'history.view'
  | 'knowledge.view'
  | 'knowledge.edit'
  | 'knowledge.delete'
  | 'users.view'
  | 'users.manage'
  | 'students.import'
  | 'audit.view';

/** 后端超管通配权限 */
export const WILDCARD_PERMISSION = '*';

/** 是否拥有某权限(支持总编的 * 通配;未加载完权限时视为无) */
export function hasPerm(
  permissions: string[] | undefined | null,
  permission: Permission
): boolean {
  if (!permissions || permissions.length === 0) return false;
  return permissions.includes(WILDCARD_PERMISSION) || permissions.includes(permission);
}
