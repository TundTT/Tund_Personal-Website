// Deterministic, simulator-independent locomotion benchmark. All commands and
// velocities are body-frame [forward m/s, left m/s, counterclockwise rad/s].
// Positions, headings, and external forces use the simulation's world frame.
export const GAUNTLET_VERSION = '1.2.0';

const ZERO = [0, 0, 0];
const TAU = 2 * Math.PI;
const TRACKING_TAU = 0.2;
const DEPENDABILITY_WEIGHTS = Object.freeze({ standstill: 0.3, tracking: 0.25, braking: 0.3, recovery: 0.15 });
const DIRECTIONS = [
  ['forward', 'Forward', 1, 0], ['forward-left', 'Forward left', Math.SQRT1_2, Math.SQRT1_2],
  ['left', 'Left', 0, 1], ['backward-left', 'Backward left', -Math.SQRT1_2, Math.SQRT1_2],
  ['backward', 'Backward', -1, 0], ['backward-right', 'Backward right', -Math.SQRT1_2, -Math.SQRT1_2],
  ['right', 'Right', 0, -1], ['forward-right', 'Forward right', Math.SQRT1_2, -Math.SQRT1_2],
];
const THRESHOLDS = Object.freeze({
  stopLinear: 0.08, stopYaw: 0.12, holdSeconds: 0.75,
  standDrift: 0.15, standTravel: 0.35, standHeading: 0.2,
  linearAbsolute: 0.12, linearRelative: 0.15,
  yawAbsolute: 0.15, yawRelative: 0.15,
});
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mean = values => values.length ? values.reduce((sum, x) => sum + x, 0) / values.length : 0;
const maximum = values => values.length ? Math.max(...values) : null;
const round = value => Number.isFinite(value) ? Math.round(value * 10000) / 10000 : null;
const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const speed = v => Math.hypot(v[0], v[1]);
const cloneState = state => ({ position: Array.from(state.position), yaw: state.yaw,
  velocity: Array.from(state.velocity), fallen: !!state.fallen,
  ...(state.deliveredCommand ? { deliveredCommand: Array.from(state.deliveredCommand) } : {}),
  // Retain the optional qpos view; copy it only when writing a 10 Hz replay frame.
  ...(state.pose ? { pose: state.pose } : {}) });
const validState = state => state && state.position?.length >= 3 && state.velocity?.length >= 3 &&
  [...state.position, ...state.velocity, state.yaw].every(Number.isFinite) &&
  (state.deliveredCommand === undefined || state.deliveredCommand?.length === 3 && Array.from(state.deliveredCommand).every(Number.isFinite));
const phase = (id, duration, command = ZERO, push) => ({ id, duration, command: [...command], ...(push ? { push } : {}) });

/** Classify the full command schedule against the supplied evaluation limits. This is
 * evidence about a declared envelope, never proof of matching training physics.
 * Missing/malformed constraints cannot establish that a command is in range.
 */
export function classifyCommandRange(attempt, limits) {
  const axes = ['vx', 'vy', 'wz'];
  const ranges = axes.map(axis => limits?.[axis]);
  const valid = ranges.map(range => Array.isArray(range) && range.length === 2 &&
    range.every(Number.isFinite) && range[0] <= range[1]);
  const missing = axes.filter((axis, index) => !valid[index]);
  const hasPlanar = limits != null && Object.hasOwn(limits, 'planar_max');
  const validPlanar = Number.isFinite(limits?.planar_max) && limits.planar_max >= 0;
  if (hasPlanar && !validPlanar) missing.push('planar_max');
  const violations = [];
  const phases = attempt.phases || [];
  if (!phases.length) missing.push('phase commands');
  for (const phase of phases) {
    const command = phase.command;
    if (!Array.isArray(command) || command.length !== 3 || !command.every(Number.isFinite)) {
      missing.push(`${phase.id || 'unknown'} command`); continue;
    }
    ranges.forEach((range, index) => {
      if (valid[index] && (command[index] < range[0] - 1e-9 || command[index] > range[1] + 1e-9)) {
        violations.push({ phase: phase.id, axis: axes[index], value: command[index], limit: [...range] });
      }
    });
    const planar = speed(command);
    if (hasPlanar && validPlanar && planar > limits.planar_max + 1e-9) {
      violations.push({ phase: phase.id, axis: 'planar_max', value: planar, limit: limits.planar_max });
    }
  }
  const status = violations.length ? 'stress' : missing.length ? 'unknown' : 'within';
  return { status, label: { within: 'Within declared command range', stress: 'Stress test · outside declared command range',
    unknown: 'Command range unverified' }[status], violations, missing };
}

/** A full shared protocol, independent of policy-declared command limits.
 * Optional push support is tested at runtime; unsupported attempts score zero.
 * The short smoke protocol is explicitly excluded from the leaderboard.
 */
export function buildPlan(options = {}) {
  const suite = options.suite || 'full';
  if (!['full', 'smoke'].includes(suite)) throw new Error(`Unknown gauntlet suite: ${suite}`);
  const repetitions = options.repetitions ?? (suite === 'smoke' ? 1 : 2);
  if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 10) throw new Error('Repetitions must be an integer from 1 to 10.');
  const rounds = [];
  const add = (key, label, kind, direction, command, phases) => rounds.push({ key, label, kind, direction, command, phases });
  const movement = (key, label, kind, direction, command, duration = 1.3) => add(key, label, kind, direction, command,
    [phase('warmup', 0.5), phase('accelerate', 0.8, command), phase('measure', duration, command)]);
  add('standstill', 'Standstill from rest', 'standstill', null, ZERO, [phase('warmup', 0.5), phase('measure', 3)]);
  for (const [id, label, x, y] of DIRECTIONS) {
    for (const target of [0.5, 1]) movement(`track-${id}-${target}`, `${label} tracking · ${target} m/s`, 'tracking', id, [x * target, y * target, 0]);
    for (const target of [1, 2, 3]) movement(`capacity-${id}-${target}`, `${label} speed · ${target} m/s`, 'capacity', id, [x * target, y * target, 0]);
    for (const target of [0.5, 1, 2]) {
      const command = [x * target, y * target, 0];
      add(`brake-${id}-${target}`, `${label} stop · ${target} m/s`, 'braking', id, command,
        [phase('warmup', 0.5), phase('accelerate', 0.8, command), phase('approach', 1.2, command), phase('brake', 3.2)]);
    }
  }
  for (const [id, label, sign] of [['cw', 'Clockwise', -1], ['ccw', 'Counterclockwise', 1]]) {
    movement(`full-turn-${id}`, `${label} full 360° turn`, 'tracking', id, [0, 0, sign], TAU);
    for (const target of [0.5, 1]) movement(`track-${id}-${target}`, `${label} tracking · ${target} rad/s`, 'tracking', id, [0, 0, sign * target]);
    for (const target of [1, 2]) movement(`capacity-${id}-${target}`, `${label} rotation · ${target} rad/s`, 'capacity', id, [0, 0, sign * target]);
    for (const target of [1, 2]) {
      const command = [0, 0, sign * target];
      add(`brake-${id}-${target}`, `${label} rotational stop · ${target} rad/s`, 'braking', id, command,
        [phase('warmup', 0.5), phase('accelerate', 0.8, command), phase('approach', 1.2, command), phase('brake', 3.2)]);
    }
    // Body lateral sign changes when facing into rather than out of a circle.
    for (const facing of ['inward', 'outward']) {
      for (const [linear, angular] of [[1, 1], [0.5, 1], [1, 2], [1, 0.5]]) {
        const suffix = linear === 1 && angular === 1 ? '' : `-${linear}-${angular}`;
        movement(`circle-${id}-${facing}${suffix}`, `${label} circle · facing ${facing} · ${linear / angular} m radius at ${linear} m/s`,
          'mixed', `${id}-${facing}`, [0, (facing === 'inward' ? -sign : sign) * linear, sign * angular], TAU / angular);
      }
    }
    for (const forward of [1, -1]) {
      const direction = `${forward > 0 ? 'forward' : 'backward'}-${id}`;
      const name = `${forward > 0 ? 'Forward' : 'Backward'} ${label.toLowerCase()}`;
      const command = [forward, 0, sign];
      movement(`turn-${id}-${forward}`, `${name} turn`, 'mixed', direction, command, 2);
      movement(`turn-${id}-${forward}-2`, `${name} tight turn · 0.5 m radius`, 'mixed', direction, [forward, 0, sign * 2], 2);
      add(`brake-turn-${id}-${forward}`, `${name} combined stop`, 'braking', direction, command,
        [phase('warmup', 0.5), phase('accelerate', 0.8, command), phase('approach', 1.2, command), phase('brake', 3.2)]);
    }
  }
  for (const [id, label, from, to, direction] of [
    ['forward-backward', 'Forward → backward reversal', [1, 0, 0], [-1, 0, 0], 'backward'],
    ['left-right', 'Left → right reversal', [0, 1, 0], [0, -1, 0], 'right'],
    ['cw-ccw', 'Clockwise → counterclockwise reversal', [0, 0, -1], [0, 0, 1], 'ccw'],
  ]) {
    add(`reverse-${id}`, label, 'tracking', direction, to,
      [phase('warmup', 0.5), phase('accelerate', 0.8, from), phase('approach', 1.2, from),
        phase('reverse', 0.8, to), phase('measure', 1.3, to)]);
    rounds.at(-1).transitionFrom = from;
  }
  for (const [id, label, command, force] of [
    ['standing-left', 'Standing · left push', ZERO, [0, 35, 0]],
    ['standing-right', 'Standing · right push', ZERO, [0, -35, 0]],
    ['moving-left', 'Forward movement · left push', [1, 0, 0], [0, 35, 0]],
    ['moving-right', 'Forward movement · right push', [1, 0, 0], [0, -35, 0]],
  ]) add(`push-${id}`, label, 'recovery', id, command,
    [phase('warmup', 0.5), phase('accelerate', 0.8, command), phase('push', 0.15, command, force), phase('recover', 2.5, command)]);
  const selected = suite === 'smoke' ? rounds.filter(r => ['standstill', 'track-forward-1', 'brake-forward-1', 'track-cw-1', 'circle-ccw-inward'].includes(r.key)) : rounds;
  return Array.from({ length: repetitions }, (_, trial) => selected.map(r => ({ ...r, id: `${r.key}:r${trial + 1}`,
    trial: trial + 1, command: [...r.command], phases: r.phases.map(p => ({ ...p, command: [...p.command] })),
    duration: r.phases.reduce((sum, p) => sum + p.duration, 0),
  }))).flat();
}

function trackingAccept(metrics, command, requested = false) {
  return metrics.samples > 0 &&
    (requested ? metrics.requestedLinearRmse : metrics.linearRmse) <= THRESHOLDS.linearAbsolute + THRESHOLDS.linearRelative * speed(command) &&
    (requested ? metrics.requestedYawRmse : metrics.yawRmse) <= THRESHOLDS.yawAbsolute + THRESHOLDS.yawRelative * Math.abs(command[2]);
}

function newStats(state, trackingSignal) {
  return { samples: 0, time: 0, linearSquared: 0, yawSquared: 0, velocitySum: [0, 0, 0],
    filteredLinearSquared: 0, filteredYawSquared: 0, filteredVelocitySum: [0, 0, 0], trackingSignal,
    requestedLinearSquared: 0, requestedYawSquared: 0, filteredRequestedLinearSquared: 0, filteredRequestedYawSquared: 0,
    deliveredCommandSum: [0, 0, 0], endDeliveredCommand: null, deliveredZeroTime: 0,
    origin: cloneState(state), previous: cloneState(state), travel: 0, drift: 0, heading: 0,
    yawTravel: 0, signedYaw: 0, overshoot: 0, lateralDeviation: 0, yawOvershoot: 0,
    quietTime: 0, linearQuietTime: 0, yawQuietTime: 0, settledAt: null, peakSpeed: 0 };
}

function readStats(stats) {
  const count = Math.max(1, stats.samples);
  const rawLinearRmse = round(Math.sqrt(stats.linearSquared / count));
  const rawYawRmse = round(Math.sqrt(stats.yawSquared / count));
  const filteredLinearRmse = round(Math.sqrt(stats.filteredLinearSquared / count));
  const filteredYawRmse = round(Math.sqrt(stats.filteredYawSquared / count));
  const rawRequestedLinearRmse = round(Math.sqrt(stats.requestedLinearSquared / count));
  const rawRequestedYawRmse = round(Math.sqrt(stats.requestedYawSquared / count));
  const filteredRequestedLinearRmse = round(Math.sqrt(stats.filteredRequestedLinearSquared / count));
  const filteredRequestedYawRmse = round(Math.sqrt(stats.filteredRequestedYawSquared / count));
  const rawMeasuredVelocity = stats.velocitySum.map(v => round(v / count));
  return { samples: stats.samples, duration: round(stats.time),
    trackingSignal: stats.trackingSignal,
    linearRmse: stats.trackingSignal === 'filtered' ? filteredLinearRmse : rawLinearRmse,
    yawRmse: stats.trackingSignal === 'filtered' ? filteredYawRmse : rawYawRmse,
    rawLinearRmse, rawYawRmse, filteredLinearRmse, filteredYawRmse,
    requestedLinearRmse: stats.trackingSignal === 'filtered' ? filteredRequestedLinearRmse : rawRequestedLinearRmse,
    requestedYawRmse: stats.trackingSignal === 'filtered' ? filteredRequestedYawRmse : rawRequestedYawRmse,
    rawRequestedLinearRmse, rawRequestedYawRmse, filteredRequestedLinearRmse, filteredRequestedYawRmse,
    meanDeliveredCommand: stats.deliveredCommandSum.map(v => round(v / count)),
    endDeliveredCommand: stats.endDeliveredCommand?.map(round) || null, deliveredZeroDuration: round(stats.deliveredZeroTime),
    measuredVelocity: rawMeasuredVelocity, rawMeasuredVelocity,
    filteredMeasuredVelocity: stats.filteredVelocitySum.map(v => round(v / count)),
    drift: round(stats.drift), travel: round(stats.travel), headingDrift: round(stats.heading),
    yawTravel: round(stats.yawTravel), overshoot: round(stats.overshoot), lateralDeviation: round(stats.lateralDeviation),
    yawOvershoot: round(stats.yawOvershoot), peakSpeed: round(stats.peakSpeed),
    quietDuration: round(stats.quietTime), quietSince: round(stats.settledAt),
    linearQuietDuration: round(stats.linearQuietTime), yawQuietDuration: round(stats.yawQuietTime),
    requiredHoldDuration: THRESHOLDS.holdSeconds,
    settled: stats.quietTime + 1e-7 >= THRESHOLDS.holdSeconds,
    settleTime: stats.quietTime + 1e-7 >= THRESHOLDS.holdSeconds ? round(stats.settledAt) : null };
}

/** Synchronous runner; call step(dt) after EVERY simulation physics substep.
 * reset() must restore the exact same initial state. read() must not advance time.
 * The runner never changes XML, integrator settings, policy timing, or physics.
 * push(), when supplied, replaces the current applied force; [0,0,0] clears it.
 * read().deliveredCommand optionally reports the command actually fed to the
 * policy after a sender ramp. Without it, commands are assumed direct.
 */
export class GauntletRunner {
  constructor(adapter, options = {}) {
    for (const method of ['reset', 'read', 'setCommand']) if (typeof adapter[method] !== 'function') throw new Error(`Missing gauntlet adapter.${method}()`);
    this.adapter = adapter;
    this.options = { suite: options.suite || 'full', repetitions: options.repetitions ?? (options.suite === 'smoke' ? 1 : 2),
      commandLimits: options.commandLimits == null ? null : structuredClone(options.commandLimits) };
    this.plan = buildPlan(this.options).map(attempt => ({ ...attempt,
      commandRange: classifyCommandRange(attempt, this.options.commandLimits) }));
    this.totalDuration = this.plan.reduce((sum, attempt) => sum + attempt.duration, 0);
    this.running = false;
    this.current = null;
    this.result = null;
    this.attempts = [];
    this.command = [...ZERO];
    this.elapsed = 0;
    this.index = -1;
    this.latest = null;
  }

  get progress() { return this.result?.status === 'complete' ? 1 : clamp((this.index + (this.current ? this.attemptTime / this.current.duration : 0)) / this.plan.length); }

  snapshot() {
    return { running: this.running, current: this.current ? { ...this.current, phases: undefined,
      phase: this.activePhase.id, elapsed: round(this.attemptTime), command: [...this.command] } : null,
    progress: this.progress, completed: this.attempts.length, total: this.plan.length,
    elapsed: round(this.elapsed), totalDuration: round(this.totalDuration), command: [...this.command],
    trace: this.trace || [], latest: this.latest, result: this.result };
  }

  start() {
    if (this.running) return this.snapshot();
    this.attempts = []; this.result = null; this.elapsed = 0; this.index = -1;
    this.startedAt = new Date().toISOString(); this.running = true;
    this.lastNotify = -Infinity; this.completionDelivered = false; this.callbackError = null;
    this._next();
    return this.snapshot();
  }

  cancel() {
    if (!this.running) return this.result;
    this._safeZero();
    this.running = false;
    this.result = this._result('cancelled');
    this._notify(true);
    this._complete();
    return this.result;
  }

  _safeZero() {
    this.command = [...ZERO];
    try { this.adapter.setCommand([...ZERO]); } catch (_) { /* best effort after an adapter error */ }
    try { this.adapter.push?.([...ZERO]); } catch (_) { /* best effort after an adapter error */ }
  }

  _next() {
    // Invalid initial states and unsupported hooks can finish synchronously.
    // Drain those attempts iteratively, so a bad export cannot overflow the stack.
    if (this.advancing) { this.advanceAgain = true; return; }
    this.advancing = true;
    try {
      do { this.advanceAgain = false; this._advance(); } while (this.advanceAgain && this.running);
    } finally { this.advancing = false; }
  }

  _advance() {
    this._safeZero();
    this.index++;
    if (this.index >= this.plan.length) {
      this.running = false; this.current = null;
      this.result = this._result('complete');
      this._notify(true); this._complete(); return;
    }
    this.current = this.plan[this.index];
    this.attemptTime = 0; this.phaseIndex = 0; this.trace = []; this.phaseStats = {};
    this.sampleTime = 0; this.traceTime = 0; this.updateTime = 0;
    this.activePhase = this.current.phases[0];
    if (this.current.kind === 'recovery' && !this.adapter.push) { this._finish('unsupported', 'External-force hook unavailable'); return; }
    try {
      this.adapter.reset();
      const state = this.adapter.read();
      if (!validState(state)) { this._finish('invalid', 'Non-finite or incomplete initial telemetry'); return; }
      this.latest = cloneState(state);
      this.filteredVelocity = [...this.latest.velocity];
      this._phaseStart();
      this._trace(); this._notify();
    } catch (error) { this._finish('invalid', String(error.message || error)); }
  }

  _phaseStart() {
    this.phaseTime = 0; this.sampleTime = 0;
    this.activePhase = this.current.phases[this.phaseIndex];
    this.phaseStats[this.activePhase.id] = newStats(this.latest, this.activePhase.command.some(v => v !== 0) ? 'filtered' : 'raw');
    this.command = [...this.activePhase.command];
    this.adapter.setCommand([...this.command]);
    this.adapter.push?.([...(this.activePhase.push || ZERO)]);
    if (this.activePhase.id === 'brake') {
      this.stopVelocity = [...this.latest.velocity];
      this.stopFilteredVelocity = [...this.filteredVelocity];
      this.stopDeliveredCommand = [...(this.latest.deliveredCommand || this.current.command)];
    }
  }

  step(dt) {
    if (!this.running) return;
    if (!Number.isFinite(dt) || dt <= 0) { this._finish('invalid', 'Invalid simulation timestep'); return; }
    // Large batched steps cannot resolve the benchmark's command transitions.
    if (dt > 0.05) { this._finish('invalid', 'Call step after physics substeps of 50 ms or less'); return; }
    try {
      const state = this.adapter.read();
      if (!validState(state)) { this._finish('invalid', 'Non-finite or incomplete telemetry'); return; }
      this.latest = cloneState(state);
      // A shared continuous-time filter removes gait-cycle oscillation from
      // moving-command tracking. Never reseed it at command or phase changes.
      const alpha = 1 - Math.exp(-dt / TRACKING_TAU);
      this.filteredVelocity = this.filteredVelocity.map((v, i) => v + alpha * (this.latest.velocity[i] - v));
      this.elapsed += dt; this.attemptTime += dt; this.phaseTime += dt;
      this.sampleTime += dt; this.traceTime += dt; this.updateTime += dt;
      if (this.latest.fallen) { this._trace(); this._finish('fallen', 'Fall detected'); return; }
      if (this.sampleTime + 1e-9 >= 0.02) { this._sample(this.sampleTime); this.sampleTime = 0; }
      if (this.traceTime + 1e-9 >= 0.1) { this._trace(); this.traceTime = 0; }
      if (this.phaseTime + 1e-9 >= this.activePhase.duration) {
        if (this.sampleTime > 1e-9) this._sample(this.sampleTime);
        this.phaseIndex++;
        if (this.phaseIndex >= this.current.phases.length) this._finish('measured');
        else { this._phaseStart(); this._notify(); }
      } else if (this.updateTime + 1e-9 >= 0.1) { this.updateTime = 0; this._notify(); }
    } catch (error) { this._finish('invalid', String(error.message || error)); }
  }

  _sample(dt) {
    const s = this.phaseStats[this.activePhase.id];
    const state = this.latest;
    const v = state.velocity;
    const delivered = state.deliveredCommand || this.command;
    const requestedZero = this.command.every(value => value === 0);
    // Moving tracking measures the policy's actual input. A requested stop
    // still measures raw motion relative to zero, retaining the sender's cost.
    const target = requestedZero ? this.command : delivered;
    const error = v.map((value, i) => value - target[i]);
    const filteredError = this.filteredVelocity.map((value, i) => value - target[i]);
    const requestedError = v.map((value, i) => value - this.command[i]);
    const filteredRequestedError = this.filteredVelocity.map((value, i) => value - this.command[i]);
    s.samples++; s.time += dt;
    s.linearSquared += error[0] ** 2 + error[1] ** 2; s.yawSquared += error[2] ** 2;
    s.filteredLinearSquared += filteredError[0] ** 2 + filteredError[1] ** 2;
    s.filteredYawSquared += filteredError[2] ** 2;
    s.requestedLinearSquared += requestedError[0] ** 2 + requestedError[1] ** 2;
    s.requestedYawSquared += requestedError[2] ** 2;
    s.filteredRequestedLinearSquared += filteredRequestedError[0] ** 2 + filteredRequestedError[1] ** 2;
    s.filteredRequestedYawSquared += filteredRequestedError[2] ** 2;
    delivered.forEach((value, i) => { s.deliveredCommandSum[i] += value; });
    s.endDeliveredCommand = [...delivered];
    const deliveredLinearZero = speed(delivered) <= 1e-9, deliveredYawZero = Math.abs(delivered[2]) <= 1e-9;
    s.deliveredZeroTime = deliveredLinearZero && deliveredYawZero ? s.deliveredZeroTime + dt : 0;
    v.forEach((value, i) => { s.velocitySum[i] += value; });
    this.filteredVelocity.forEach((value, i) => { s.filteredVelocitySum[i] += value; });
    const dx = state.position[0] - s.origin.position[0], dy = state.position[1] - s.origin.position[1];
    s.travel += Math.hypot(state.position[0] - s.previous.position[0], state.position[1] - s.previous.position[1]);
    s.drift = Math.max(s.drift, Math.hypot(dx, dy));
    const yawStep = angleDelta(state.yaw, s.previous.yaw);
    s.signedYaw += yawStep; s.yawTravel += Math.abs(yawStep); s.heading = Math.max(s.heading, Math.abs(s.signedYaw));
    s.peakSpeed = Math.max(s.peakSpeed, speed(v));
    if (this.activePhase.id === 'brake') {
      const c = this.current.command, magnitude = speed(c);
      if (magnitude > 0) {
        const localX = c[0] / magnitude, localY = c[1] / magnitude;
        const ux = localX * Math.cos(s.origin.yaw) - localY * Math.sin(s.origin.yaw);
        const uy = localX * Math.sin(s.origin.yaw) + localY * Math.cos(s.origin.yaw);
        s.overshoot = Math.max(s.overshoot, dx * ux + dy * uy);
        s.lateralDeviation = Math.max(s.lateralDeviation, Math.abs(-dx * uy + dy * ux));
      }
      s.yawOvershoot = Math.max(s.yawOvershoot, s.signedYaw * Math.sign(c[2]));
    }
    const quietError = s.trackingSignal === 'filtered' ? filteredError : error;
    // Separate terminal streaks explain a failed hold; the combined streak
    // remains the scoring criterion and uses the same signal and sample clock.
    const linearQuiet = speed(quietError) <= THRESHOLDS.stopLinear && (!requestedZero || deliveredLinearZero);
    const yawQuiet = Math.abs(quietError[2]) <= THRESHOLDS.stopYaw && (!requestedZero || deliveredYawZero);
    s.linearQuietTime = linearQuiet ? s.linearQuietTime + dt : 0;
    s.yawQuietTime = yawQuiet ? s.yawQuietTime + dt : 0;
    const quiet = linearQuiet && yawQuiet;
    if (quiet) { if (!s.quietTime) s.settledAt = Math.max(0, s.time - dt); s.quietTime += dt; }
    else { s.quietTime = 0; s.settledAt = null; }
    s.previous = cloneState(state);
  }

  _trace() {
    if (!this.latest || !this.current) return;
    const pose = this.latest.pose;
    this.trace.push({ t: round(this.attemptTime), phase: this.activePhase.id,
      position: this.latest.position.map(round), yaw: round(this.latest.yaw),
      velocity: this.latest.velocity.map(round), filteredVelocity: this.filteredVelocity?.map(round) || this.latest.velocity.map(round),
      command: [...(this.latest.deliveredCommand || this.command)], requestedCommand: [...this.command],
      ...(pose?.length && Array.from(pose).every(Number.isFinite) ? { pose: Array.from(pose, round) } : {}) });
  }

  _notify(force = false) {
    if (!force && this.elapsed - this.lastNotify + 1e-9 < 0.1) return;
    this.lastNotify = this.elapsed;
    this._callback('onUpdate', this.snapshot());
  }

  _callback(name, value) {
    // UI exceptions must not relabel valid physics data or trigger completion twice.
    try { this.adapter[name]?.(value); }
    catch (error) { this.callbackError = { callback: name, message: String(error.message || error) }; }
  }

  _complete() {
    if (this.completionDelivered) return;
    this.completionDelivered = true;
    this._callback('onComplete', this.result);
  }

  _finish(status, reason = null) {
    const attempt = this.current;
    const phases = Object.fromEntries(Object.entries(this.phaseStats || {}).map(([key, stats]) => [key, readStats(stats)]));
    const metrics = { phases };
    let passed = false, score = 0;
    const m = phases.measure || phases.recover;
    if (status === 'measured' && m) {
      Object.assign(metrics, m);
      passed = trackingAccept(m, attempt.command);
      score = 100 * clamp(1 - m.linearRmse / 0.8 - m.yawRmse / 1.2);
      if (attempt.transitionFrom) {
        const transition = phases.reverse;
        const approachAttained = !!phases.approach && trackingAccept(phases.approach, attempt.transitionFrom, true);
        // Join the quiet streak across the transient/measurement phase boundary.
        const continuedQuiet = m.quietSince === 0;
        const responseTime = continuedQuiet && transition.quietSince !== null
          ? transition.quietSince : m.settleTime === null ? null : 0.8 + m.settleTime;
        Object.assign(metrics, { transitionFrom: [...attempt.transitionFrom], approachAttained,
          responseTime, transientLinearRmse: transition.linearRmse, transientYawRmse: transition.yawRmse });
        passed = passed && approachAttained && m.settled;
        score *= Math.exp(-0.25 * (responseTime ?? 2.1));
        if (!approachAttained) reason = 'Initial velocity was not attained before reversal';
      }
      if (attempt.kind === 'standstill') {
        passed = passed && m.settled && m.drift <= THRESHOLDS.standDrift && m.travel <= THRESHOLDS.standTravel && m.headingDrift <= THRESHOLDS.standHeading;
        score = 100 * clamp(1 - 0.45 * m.drift / THRESHOLDS.standDrift - 0.3 * m.travel / THRESHOLDS.standTravel - 0.25 * m.headingDrift / THRESHOLDS.standHeading);
      }
      if (attempt.kind === 'mixed') {
        metrics.nominalRadius = round(speed(attempt.command) / Math.abs(attempt.command[2]));
        metrics.measuredRadius = Math.abs(m.measuredVelocity[2]) > 0.05 ? round(speed(m.measuredVelocity) / Math.abs(m.measuredVelocity[2])) : null;
        metrics.radiusNote = 'Velocity-derived radius; tracking error includes body-frame commands, not a separate path controller.';
      }
      if (['capacity', 'mixed'].includes(attempt.kind)) {
        metrics.requestedTargetAttained = trackingAccept(m, attempt.command, true);
        passed = passed && metrics.requestedTargetAttained;
        if (!metrics.requestedTargetAttained) reason = 'Requested target velocity was not attained and sustained';
      }
      if (attempt.kind === 'recovery') passed = passed && m.settled;
    }
    if (status === 'measured' && attempt.kind === 'braking') {
      const approach = phases.approach, brake = phases.brake;
      const attained = approach && trackingAccept(approach, attempt.command, true) && this.stopFilteredVelocity &&
        speed(this.stopFilteredVelocity.map((v, i) => v - attempt.command[i])) <= THRESHOLDS.linearAbsolute + THRESHOLDS.linearRelative * speed(attempt.command) &&
        Math.abs(this.stopFilteredVelocity[2] - attempt.command[2]) <= THRESHOLDS.yawAbsolute + THRESHOLDS.yawRelative * Math.abs(attempt.command[2]);
      Object.assign(metrics, brake, { attained: !!attained, requestedSpeed: round(speed(attempt.command)),
        requestedYawRate: round(Math.abs(attempt.command[2])), measuredStartVelocity: this.stopVelocity?.map(round) || null,
        rawStartVelocity: this.stopVelocity?.map(round) || null, filteredStartVelocity: this.stopFilteredVelocity?.map(round) || null,
        deliveredStartCommand: this.stopDeliveredCommand?.map(round) || null,
        measuredStartSpeed: this.stopVelocity ? round(speed(this.stopVelocity)) : null,
        distance: brake?.travel ?? null, angularDistance: brake?.yawTravel ?? null });
      passed = !!attained && !!brake?.settled;
      if (brake) score = 100 * Math.exp(-0.7 * brake.travel / Math.max(0.2, speed(attempt.command) * 0.5)
        - 0.7 * brake.yawTravel / Math.max(0.2, Math.abs(attempt.command[2]) * 0.5) - 0.3 * (brake.settleTime ?? 3.2) / 1.5);
      if (!attained) reason = 'Requested approach velocity was not attained and sustained';
      else if (!brake?.settled) {
        const missingHolds = [['linear', brake?.linearQuietDuration], ['yaw', brake?.yawQuietDuration]]
          .filter(([, duration]) => Number.isFinite(duration) && duration + 1e-7 < THRESHOLDS.holdSeconds)
          .map(([axis, duration]) => `${axis} quiet hold ${duration} s / ${THRESHOLDS.holdSeconds} s`);
        reason = 'Did not maintain standstill for the required hold period' + (missingHolds.length ? `: ${missingHolds.join('; ')}` : '');
      }
    }
    if (status === 'measured') status = passed ? 'passed' : 'failed';
    if (!passed && !reason) reason = 'Fixed tracking, stability, or settling threshold exceeded';
    this.attempts.push({ id: attempt.id, key: attempt.key, label: attempt.label, kind: attempt.kind,
      direction: attempt.direction, trial: attempt.trial, command: [...attempt.command],
      commandRange: structuredClone(attempt.commandRange), status, passed,
      score: round(passed ? score : 0), reason: passed ? null : reason, duration: round(this.attemptTime), metrics, trace: this.trace || [] });
    this._next();
  }

  _result(status) {
    const attempts = this.attempts;
    const ofKind = kind => attempts.filter(a => a.kind === kind);
    const kindScore = kind => mean(ofKind(kind).map(a => a.score));
    const countCoverage = list => ({ completed: list.length,
      included: list.filter(a => a.commandRange.status === 'within').length,
      excludedStress: list.filter(a => a.commandRange.status === 'stress').length,
      unverified: list.filter(a => a.commandRange.status === 'unknown').length });
    const dependable = attempts.filter(a => Object.hasOwn(DEPENDABILITY_WEIGHTS, a.kind));
    const dependablePlan = this.plan.filter(a => Object.hasOwn(DEPENDABILITY_WEIGHTS, a.kind));
    const byKind = Object.fromEntries(Object.entries(DEPENDABILITY_WEIGHTS).map(([kind, weight]) => {
      const completed = ofKind(kind);
      const included = completed.filter(a => a.commandRange.status === 'within');
      return [kind, { weight, planned: this.plan.filter(a => a.kind === kind).length, ...countCoverage(completed),
        passed: included.filter(a => a.passed).length, score: included.length ? round(mean(included.map(a => a.score))) : null }];
    }));
    const appliedWeight = Object.values(byKind).reduce((sum, entry) => sum + (entry.included ? entry.weight : 0), 0);
    for (const entry of Object.values(byKind)) entry.appliedWeight = entry.included ? entry.weight : 0;
    const missingKinds = Object.entries(byKind).filter(([, entry]) => !entry.included).map(([kind]) => kind);
    const dependability = missingKinds.length ? null : round(Object.entries(byKind).reduce((sum, [kind, entry]) =>
      sum + mean(ofKind(kind).filter(a => a.commandRange.status === 'within').map(a => a.score)) * entry.weight, 0));
    const commandLimitsKnown = this.plan.every(a => !a.commandRange.missing.length);
    const dependabilityCoverage = { planned: dependablePlan.length, ...countCoverage(dependable),
      plannedIncluded: dependablePlan.filter(a => a.commandRange.status === 'within').length,
      plannedStress: dependablePlan.filter(a => a.commandRange.status === 'stress').length,
      plannedUnverified: dependablePlan.filter(a => a.commandRange.status === 'unknown').length,
      passed: dependable.filter(a => a.commandRange.status === 'within' && a.passed).length,
      appliedWeight: round(appliedWeight), missingKinds,
      reason: missingKinds.length ? `No completed within-range measurements for: ${missingKinds.join(', ')}.` : null, byKind };
    const groups = new Map();
    for (const a of attempts) { if (!groups.has(a.key)) groups.set(a.key, []); groups.get(a.key).push(a); }
    const stopping = list => [...new Set(list.map(a => speed(a.command) || Math.abs(a.command[2])))].sort((a, b) => a - b).map(target => {
      const group = list.filter(a => Math.abs((speed(a.command) || Math.abs(a.command[2])) - target) < 1e-6);
      const good = group.filter(a => a.passed);
      return { speed: round(target), distance: good.length ? round(mean(good.map(a => a.metrics.distance))) : null,
        worstDistance: maximum(group.map(a => a.metrics.distance).filter(Number.isFinite)),
        angularDistance: good.length ? round(mean(good.map(a => a.metrics.angularDistance))) : null,
        worstAngularDistance: maximum(group.map(a => a.metrics.angularDistance).filter(Number.isFinite)),
        settleTime: good.length ? round(mean(good.map(a => a.metrics.settleTime))) : null,
        successRate: round(good.length / this.options.repetitions), attempts: group.map(a => a.id) };
    });
    const capacity = (id, isYaw) => {
      const candidates = [...groups.values()].filter(g => g[0].kind === 'capacity' && g[0].direction === id &&
        g.length === this.options.repetitions && g.every(a => a.passed));
      return { value: candidates.length ? Math.max(...candidates.map(group => Math.min(...group.map(a => {
        const v = a.metrics.measuredVelocity;
        return isYaw ? Math.abs(v[2]) : (v[0] * a.command[0] + v[1] * a.command[1]) / speed(a.command);
      })))) : 0, ceilingReached: candidates.some(g => Math.abs((isYaw ? Math.abs(g[0].command[2]) : speed(g[0].command)) - (isYaw ? 2 : 3)) < 1e-6) };
    };
    const directions = DIRECTIONS.map(([id, label, x, y]) => {
      const cap = capacity(id, false);
      return { id, label, vector: [x, y], trackingScore: round(mean(attempts.filter(a => a.kind === 'tracking' && a.direction === id).map(a => a.score))),
        maxSustainedSpeed: round(cap.value), ceilingReached: cap.ceilingReached,
        stopping: stopping(attempts.filter(a => a.kind === 'braking' && a.direction === id)) };
    });
    const yaw = ['cw', 'ccw'].map(id => {
      const cap = capacity(id, true);
      return { id, label: id === 'cw' ? 'Clockwise' : 'Counterclockwise',
        trackingScore: round(mean(attempts.filter(a => a.kind === 'tracking' && a.direction === id).map(a => a.score))),
        maxSustainedRate: round(cap.value), ceilingReached: cap.ceilingReached,
        stopping: stopping(attempts.filter(a => a.kind === 'braking' && a.direction === id)) };
    });
    const envelope = [...groups.values()].filter(g => ['capacity', 'mixed'].includes(g[0].kind)).map(group => {
      const good = group.filter(a => a.passed);
      return { id: group[0].key, label: group[0].label, kind: group[0].kind, command: [...group[0].command],
        commandRange: structuredClone(group[0].commandRange),
        measured: good.length ? [0, 1, 2].map(i => round(mean(good.map(a => a.metrics.measuredVelocity[i])))) : null,
        passed: good.length === this.options.repetitions,
        successRate: round(good.length / this.options.repetitions), attempts: group.map(a => a.id) };
    });
    const mixedGroups = [...groups.values()].filter(g => g[0].kind === 'mixed');
    const turning = [...new Set(mixedGroups.map(g => g[0].direction))].map(id => {
      const related = mixedGroups.filter(g => g[0].direction === id);
      const atSpeeds = [...new Set(related.map(g => speed(g[0].command)))].sort((a, b) => a - b).map(target => {
        const good = related.filter(g => Math.abs(speed(g[0].command) - target) < 1e-6 &&
          g.length === this.options.repetitions && g.every(a => a.passed));
        good.sort((a, b) => a[0].metrics.nominalRadius - b[0].metrics.nominalRadius);
        const best = good[0];
        return { speed: round(target), smallestPassedRadius: best ? best[0].metrics.nominalRadius : null,
          measuredRadius: best ? maximum(best.map(a => a.metrics.measuredRadius).filter(Number.isFinite)) : null,
          command: best ? [...best[0].command] : null, attempts: best ? best.map(a => a.id) : [] };
      });
      const radii = atSpeeds.map(entry => entry.smallestPassedRadius).filter(Number.isFinite);
      return { id, label: id.replaceAll('-', ' '), smallestPassedRadius: radii.length ? Math.min(...radii) : null, atSpeeds };
    });
    const stand = ofKind('standstill'), brakes = ofKind('braking');
    const complete = status === 'complete' && attempts.length === this.plan.length;
    return { version: GAUNTLET_VERSION, suite: this.options.suite, status,
      rankable: complete && this.options.suite === 'full' && this.options.repetitions >= 2 && commandLimitsKnown && dependability !== null,
      startedAt: this.startedAt, completedAt: new Date().toISOString(), duration: round(this.elapsed),
      repetitions: this.options.repetitions, plannedAttempts: this.plan.length, completedAttempts: attempts.length,
      scores: { dependability,
        performance: round(70 * mean([...directions.map(d => clamp(d.maxSustainedSpeed / 3)), ...yaw.map(y => clamp(y.maxSustainedRate / 2))]) + 0.3 * kindScore('mixed')) },
      summary: { passed: attempts.filter(a => a.passed).length, failed: attempts.filter(a => !a.passed).length,
        dependabilityCoverage,
        falls: attempts.filter(a => a.status === 'fallen').length, invalid: attempts.filter(a => a.status === 'invalid').length,
        unsupported: attempts.filter(a => a.status === 'unsupported').length,
        standstill: { score: round(kindScore('standstill')), worstDrift: maximum(stand.map(a => a.metrics.drift).filter(Number.isFinite)),
          worstTravel: maximum(stand.map(a => a.metrics.travel).filter(Number.isFinite)), worstHeadingDrift: maximum(stand.map(a => a.metrics.headingDrift).filter(Number.isFinite)),
          successRate: stand.length ? round(stand.filter(a => a.passed).length / stand.length) : 0 },
        stopping: { score: round(kindScore('braking')), successRate: brakes.length ? round(brakes.filter(a => a.passed).length / brakes.length) : 0,
          worstDistance: maximum(brakes.map(a => a.metrics.distance).filter(Number.isFinite)) },
        yaw: { clockwise: yaw[0].maxSustainedRate, counterclockwise: yaw[1].maxSustainedRate } },
      directions, yaw, envelope, turning, attempts,
      protocol: { velocityFrame: 'body: forward, left, counterclockwise', metricHz: 50, traceHz: 10,
        commandLimits: structuredClone(this.options.commandLimits),
        commandRangeNote: 'Every phase is checked against all supplied axis limits and any planar cap. Commands are never clamped. Use logged checkpoint curriculum limits when available, otherwise exported declarations; the scorecard records which source was used. Missing or malformed limits remain unverified.',
        trackingFilter: { type: 'continuous exponential moving average', tauSeconds: TRACKING_TAU,
          formula: 'alpha = 1 - exp(-physicsDt / tau)', reset: 'Seed from measured initial velocity only at attempt reset; retain across phase and command changes.',
          movingCommands: 'Filtered velocity errors against delivered policy commands determine moving tracking. Capacity, mixed movement, and approach attainment additionally require tracking the requested target.',
          zeroCommands: 'Raw errors determine standstill, standing recovery, and braking hold. Position-based distance/drift and fall detection are always raw.',
          rawMetricsRetained: true },
        thresholds: { ...THRESHOLDS }, speedCeiling: 3, yawCeiling: 2,
        ceilingNote: 'Highest sustained tested value, not a proven physical maximum. Passing the ceiling is explicitly reported.',
        repeatsNote: 'Capacity/envelope points require every repetition to pass. A full leaderboard entry requires at least two repetitions.',
        turningNote: 'Smallest passing tested nominal radius at each shared speed; measured radius comes from speed/yaw and is not a proven physical minimum.',
        scoring: { provisional: true, fixedThresholdsAcrossPolicies: true, dependabilityWeights: { ...DEPENDABILITY_WEIGHTS },
          dependabilityScope: 'Only completed within-declared-command-range standstill, tracking, braking, and recovery attempts contribute. Stress and unverified attempts are excluded, not scored as failures.',
          dependabilityNormalization: 'Per-kind means use only included attempts, with fixed weights and no renormalization. If any required kind has no completed within-range measurement, dependability is null. Always compare scores alongside coverage and declared limits.',
          comparabilityNote: 'A smaller declared command envelope can yield a high conditional dependability score on fewer or easier probes. Scores alone do not establish equal capability across envelopes.',
          performanceWeights: { sustainedDirectionalCapacity: 0.7, mixedTracking: 0.3 }, failuresScoreZero: true },
        push: { frame: 'world', forceN: 35, durationSeconds: 0.15, optionalHook: true },
        commandDelivery: 'Trace command is the delivered policy input; requestedCommand is the high-level request. If the adapter omits deliveredCommand, direct delivery is assumed. Sender ramps are part of the evaluated contract, not silently removed.',
        stopNote: 'The high-level zero request starts the braking window after an attained and sustained approach. Distance/time include sender ramp travel. Settling requires delivered zero and raw velocity limits continuously throughout the final hold.',
      } };
  }
}
