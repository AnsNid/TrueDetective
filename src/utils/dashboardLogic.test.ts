import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterOngoingCases,
  filterPendingReviews,
  getHeatmapColor,
  computeRadarPolygonPoints,
  validateLoginCredentials,
} from './dashboardLogic';
import {
  ONGOING_CASES,
  PENDING_REVIEW_LIST,
  SOURCE_CREDIBILITY_AXES,
  HEATMAP_COLORS,
} from '../data/dashboardData';

test('filterOngoingCases returns all cases when query is empty', () => {
  const result = filterOngoingCases(ONGOING_CASES, '   ');
  assert.equal(result.length, 5);
});

test('filterOngoingCases filters by caseId, title, or owner', () => {
  const byId = filterOngoingCases(ONGOING_CASES, '0014');
  assert.equal(byId.length, 1);
  assert.equal(byId[0].owner, '张明');

  const byTitle = filterOngoingCases(ONGOING_CASES, '无人机');
  assert.equal(byTitle.length, 1);
  assert.equal(byTitle[0].caseId, 'ZT-2026-0011');
});

test('filterPendingReviews filters by submitter or caseId', () => {
  const bySubmitter = filterPendingReviews(PENDING_REVIEW_LIST, '王思思');
  assert.equal(bySubmitter.length, 1);
  assert.equal(bySubmitter[0].caseId, 'ZT-2026-0017');
});

test('getHeatmapColor clamps out-of-range levels to valid palette colors', () => {
  assert.equal(getHeatmapColor(0), HEATMAP_COLORS[0]);
  assert.equal(getHeatmapColor(4), HEATMAP_COLORS[4]);
  assert.equal(getHeatmapColor(-3), HEATMAP_COLORS[0]);
  assert.equal(getHeatmapColor(99), HEATMAP_COLORS[4]);
});

test('computeRadarPolygonPoints computes 6 vertices with top vertex on centerX', () => {
  const points = computeRadarPolygonPoints(SOURCE_CREDIBILITY_AXES, 100, 100, 60);
  assert.equal(points.length, 6);
  // First vertex is at -90 deg (top), so x should be 100 and y < 100
  assert.equal(points[0].x, 100);
  assert.ok(points[0].y < 100);
});

test('validateLoginCredentials rejects empty username or short password and accepts valid input', () => {
  const emptyUser = validateLoginCredentials('   ', 'Zt@2026Admin');
  assert.equal(emptyUser.valid, false);
  assert.ok(emptyUser.error?.includes('账号'));

  const shortPass = validateLoginCredentials('zhangming', '123');
  assert.equal(shortPass.valid, false);
  assert.ok(shortPass.error?.includes('6 位'));

  const validAdmin = validateLoginCredentials('zhangming@zhentan.org', 'Zt@2026Admin', '管理员');
  assert.equal(validAdmin.valid, true);
  assert.equal(validAdmin.displayName, '张明');
  assert.equal(validAdmin.roleLabel, '管理员');
});

