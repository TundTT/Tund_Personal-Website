// Rolling playground telemetry for presentation only. Never used for scoring.
const EPSILON = 1e-9;
const finiteVector = value => value?.length >= 3 &&
  Number.isFinite(value[0]) && Number.isFinite(value[1]) && Number.isFinite(value[2]);
const copyVector = value => [value[0], value[1], value[2]];

export class LiveTraceBuffer {
  constructor({ windowSeconds = 20, sampleHz = 10, tauSeconds = 0.2 } = {}) {
    if (!Number.isFinite(windowSeconds) || windowSeconds <= 0 ||
        !Number.isFinite(sampleHz) || sampleHz <= 0 ||
        !Number.isFinite(tauSeconds) || tauSeconds < 0) {
      throw new RangeError('Live trace window and sample rate must be positive; filter time must be nonnegative.');
    }
    this.windowSeconds = windowSeconds;
    this.sampleInterval = 1 / sampleHz;
    this.tauSeconds = tauSeconds;
    this.maxSamples = Math.ceil(windowSeconds * sampleHz) + 2;
    this.reset();
  }

  reset() {
    this.samples = [];
    this.lastTime = null;
    this.lastEmittedTime = null;
    this.filteredVelocity = null;
  }

  get trace() { return this.samples; }

  // Call after each physics step. Filter every valid step, emit at sampleHz,
  // and preserve simulation time so pause, playback pace, and wall time cannot
  // change the graph's measurements or the filter's response.
  sample(simTime, telemetry, command, requestedCommand = command) {
    if (!Number.isFinite(simTime)) return false;
    if (this.lastTime !== null && simTime < this.lastTime) this.reset();
    if (simTime === this.lastTime || !telemetry || !finiteVector(telemetry.position) ||
        !finiteVector(telemetry.velocity) || !finiteVector(command) || !finiteVector(requestedCommand) || !Number.isFinite(telemetry.yaw)) {
      return false;
    }
    const velocity = copyVector(telemetry.velocity);
    if (this.lastTime === null) {
      this.filteredVelocity = [...velocity];
    } else {
      const alpha = this.tauSeconds === 0 ? 1 : 1 - Math.exp(-(simTime - this.lastTime) / this.tauSeconds);
      this.filteredVelocity = this.filteredVelocity.map((value, i) => value + alpha * (velocity[i] - value));
    }
    this.lastTime = simTime;
    const cutoff = simTime - this.windowSeconds;
    while (this.samples.length && this.samples[0].t < cutoff - EPSILON) this.samples.shift();
    if (this.lastEmittedTime !== null && simTime - this.lastEmittedTime + EPSILON < this.sampleInterval) return false;

    this.samples.push({
      t: simTime, phase: 'playground', position: copyVector(telemetry.position), yaw: telemetry.yaw,
      velocity, filteredVelocity: [...this.filteredVelocity], command: copyVector(command),
      requestedCommand: copyVector(requestedCommand), fallen: Boolean(telemetry.fallen),
    });
    this.lastEmittedTime = simTime;
    if (this.samples.length > this.maxSamples) this.samples.splice(0, this.samples.length - this.maxSamples);
    return true;
  }
}
