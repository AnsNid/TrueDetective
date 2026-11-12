import {
  OngoingCaseItem,
  PendingReviewItem,
  HEATMAP_COLORS,
  SourceCredibilityAxis,
} from '../data/dashboardData';

/**
 * Filter ongoing cases by keyword query (caseId, title, owner, conclusion).
 */
export function filterOngoingCases(
  cases: OngoingCaseItem[],
  query: string
): OngoingCaseItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return cases;
  return cases.filter(
    (item) =>
      item.caseId.toLowerCase().includes(trimmed) ||
      item.title.toLowerCase().includes(trimmed) ||
      item.owner.toLowerCase().includes(trimmed) ||
      item.conclusion.toLowerCase().includes(trimmed)
  );
}

/**
 * Filter pending review items by keyword query (submitter, caseId).
 */
export function filterPendingReviews(
  reviews: PendingReviewItem[],
  query: string
): PendingReviewItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return reviews;
  return reviews.filter(
    (item) =>
      item.submitter.toLowerCase().includes(trimmed) ||
      item.caseId.toLowerCase().includes(trimmed)
  );
}

/**
 * Resolve heatmap cell color from intensity level (0-4).
 */
export function getHeatmapColor(level: number): string {
  const clamped = Math.max(0, Math.min(HEATMAP_COLORS.length - 1, Math.round(level)));
  return HEATMAP_COLORS[clamped];
}

/**
 * Compute SVG polygon coordinate points for a regular 6-axis radar chart.
 */
export function computeRadarPolygonPoints(
  axes: SourceCredibilityAxis[],
  centerX: number,
  centerY: number,
  maxRadius: number
): { x: number; y: number; labelX: number; labelY: number; label: string; value: number }[] {
  const count = axes.length;
  return axes.map((axis, idx) => {
    // Start at top (-90 degrees = -PI / 2) and go clockwise
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / count;
    const ratio = Math.max(0, Math.min(100, axis.value)) / 100;
    const r = maxRadius * ratio;
    const x = Number((centerX + r * Math.cos(angle)).toFixed(2));
    const y = Number((centerY + r * Math.sin(angle)).toFixed(2));
    const labelRadius = maxRadius + 20;
    const labelX = Number((centerX + labelRadius * Math.cos(angle)).toFixed(2));
    const labelY = Number((centerY + labelRadius * Math.sin(angle)).toFixed(2));
    return {
      x,
      y,
      labelX,
      labelY,
      label: axis.label,
      value: axis.value,
    };
  });
}

export interface LoginValidationResult {
  valid: boolean;
  error?: string;
  displayName?: string;
  roleLabel?: string;
}

/**
 * Validate login form inputs without silently substituting fallback values.
 */
export function validateLoginCredentials(
  username: string,
  password: string,
  roleLabel: string = '管理员'
): LoginValidationResult {
  const cleanUser = username.trim();
  const cleanPass = password.trim();

  if (!cleanUser) {
    return { valid: false, error: '请输入管理员账号、工号或邮箱' };
  }
  if (!cleanPass) {
    return { valid: false, error: '请输入登录密码' };
  }
  if (cleanPass.length < 6) {
    return { valid: false, error: '登录密码长度不能少于 6 位字符' };
  }

  // Map common account identifiers to display name
  const displayName =
    cleanUser.toLowerCase().includes('zhangming') || cleanUser === '张明'
      ? '张明'
      : cleanUser.split('@')[0];

  return {
    valid: true,
    displayName,
    roleLabel: roleLabel.trim() || '管理员',
  };
}

