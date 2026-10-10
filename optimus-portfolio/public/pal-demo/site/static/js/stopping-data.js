// Presentation of recorded braking outcomes. Failed travel is evidence, not a stop.
const finiteDistance = value => Number.isFinite(value) && value >= 0;
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const maximum = values => values.length ? Math.max(...values) : null;
const successful = attempt => attempt.passed === true && attempt.status === 'passed';
const commandSpeed = attempt => Array.isArray(attempt.command)
  ? Math.hypot(attempt.command[0], attempt.command[1]) || Math.abs(attempt.command[2]) : NaN;

export function stoppingFailure(attempt) {
  if (attempt.status === 'fallen') return 'Fell';
  if (attempt.status === 'cancelled') return 'Cancelled';
  if (attempt.status === 'invalid') return 'Invalid telemetry';
  if (attempt.status === 'unsupported') return 'Unsupported test';
  if (attempt.metrics?.attained === false || /approach velocity/i.test(attempt.reason || '')) return 'Approach tracking failed';
  if (attempt.metrics?.settled === false || attempt.metrics?.phases?.brake?.settled === false || /standstill|hold period/i.test(attempt.reason || '')) {
    const m = attempt.metrics || {};
    if ([m.requiredHoldDuration, m.linearQuietDuration, m.yawQuietDuration].every(Number.isFinite)) {
      const linear = m.linearQuietDuration + 1e-7 < m.requiredHoldDuration;
      const yaw = m.yawQuietDuration + 1e-7 < m.requiredHoldDuration;
      if (linear && yaw) return 'Translation and yaw did not hold still';
      if (yaw) return 'Yaw did not hold still';
      if (linear) return 'Translation did not hold still';
    }
    return 'Did not hold standstill';
  }
  return attempt.reason || 'Failed test';
}

export function getStoppingSample(result, directionId, speed) {
  const attempts = (result?.attempts || []).filter(attempt => attempt.kind === 'braking'
    && attempt.direction === directionId && Math.abs(commandSpeed(attempt) - speed) < 1e-4);
  if (attempts.length) {
    const good = attempts.filter(successful);
    const distances = good.map(attempt => attempt.metrics?.distance).filter(finiteDistance);
    const angles = good.map(attempt => attempt.metrics?.angularDistance).filter(finiteDistance);
    const failures = new Map();
    for (const attempt of attempts.filter(attempt => !successful(attempt))) {
      const label = stoppingFailure(attempt);
      failures.set(label, (failures.get(label) || 0) + 1);
    }
    return { attempts, passed: good.length, total: attempts.length, successRate: good.length / attempts.length,
      distance: mean(distances), angularDistance: mean(angles), worstDistance: maximum(distances), worstAngularDistance: maximum(angles),
      failures: [...failures].map(([label, count]) => ({ label, count })), tested: true, legacy: false };
  }
  const stop = [...(result?.directions || []), ...(result?.yaw || [])].find(direction => direction.id === directionId)
    ?.stopping?.find(item => Math.abs(item.speed - speed) < 1e-4);
  const rate = Number.isFinite(stop?.successRate) ? Math.max(0, Math.min(1, stop.successRate)) : null;
  // Older summary-only records don't identify which attempts contributed to the worst value.
  return { attempts: [], passed: null, total: null, successRate: rate,
    distance: rate > 0 && finiteDistance(stop.distance) ? stop.distance : null,
    angularDistance: rate > 0 && finiteDistance(stop.angularDistance) ? stop.angularDistance : null,
    worstDistance: null, worstAngularDistance: null,
    failures: stop && rate !== 1 ? [{ label: 'Failure details not recorded', count: null }] : [],
    tested: Boolean(stop), legacy: Boolean(stop) };
}

export function stoppingSummary(result) {
  const attempts = (result?.attempts || []).filter(attempt => attempt.kind === 'braking');
  const good = attempts.filter(successful);
  const distances = good.filter(attempt => !['cw', 'ccw'].includes(attempt.direction))
    .map(attempt => attempt.metrics?.distance).filter(finiteDistance);
  return { worstSuccessfulDistance: maximum(distances), successful: good.length, total: attempts.length,
    falls: attempts.filter(attempt => attempt.status === 'fallen').length };
}
