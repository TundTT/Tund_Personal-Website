// Shared by the interactive viewer and the background evaluator.
import { applyPhysicsProfile, actuatorDelay, slewCommand } from './runtime-profile.js';

// ---------------------------------------------------------------------------
// Policy: sequential evaluation of the layer list written by export_web_policy.py.
// ---------------------------------------------------------------------------
class Policy {
  constructor(spec, blob) {
    this.layers = spec.layers;
    this.inputDim = spec.input_dim;
    this.outputDim = spec.output_dim;
    this.blob = blob;
    this.scratch = [new Float32Array(1024), new Float32Array(1024)];
  }

  static async load(policyDir, spec) {
    const response = await fetch(policyDir + spec.file);
    if (!response.ok) throw new Error(`Failed to fetch ${spec.file}`);
    const bytes = await response.arrayBuffer();
    const policy = new Policy(spec, new Float32Array(bytes));
    policy.assets = new Map([[spec.file, bytes]]);
    return policy;
  }

  run(obs) {
    let x = obs;
    let n = this.inputDim;
    let which = 0;
    for (const layer of this.layers) {
      const out = this.scratch[which];
      switch (layer.op) {
        case 'sub': case 'div': case 'add': case 'mul': {
          const c = this.blob;
          const o = layer.offset;
          for (let i = 0; i < n; i++) {
            const a = layer.tensor_first ? x[i] : c[o + i];
            const b = layer.tensor_first ? c[o + i] : x[i];
            out[i] = layer.op === 'sub' ? a - b : layer.op === 'div' ? a / b : layer.op === 'add' ? a + b : a * b;
          }
          break;
        }
        case 'gemm': {
          const w = this.blob;
          const rows = layer.out;
          const cols = layer.in;
          for (let r = 0; r < rows; r++) {
            let acc = w[layer.b_offset + r];
            const base = layer.w_offset + r * cols;
            for (let c = 0; c < cols; c++) acc += w[base + c] * x[c];
            out[r] = acc;
          }
          n = rows;
          break;
        }
        case 'elu':
          for (let i = 0; i < n; i++) out[i] = x[i] > 0 ? x[i] : layer.alpha * (Math.exp(x[i]) - 1);
          break;
        case 'relu':
          for (let i = 0; i < n; i++) out[i] = Math.max(0, x[i]);
          break;
        case 'tanh':
          for (let i = 0; i < n; i++) out[i] = Math.tanh(x[i]);
          break;
        case 'sigmoid':
          for (let i = 0; i < n; i++) out[i] = 1 / (1 + Math.exp(-x[i]));
          break;
        default:
          throw new Error(`Unsupported exported policy operation: ${layer.op}`);
      }
      x = out;
      which ^= 1;
    }
    return x.subarray(0, this.outputDim);
  }
}

// ---------------------------------------------------------------------------
// Simulation: MuJoCo model + policy, stepped at the training control rate.
// ---------------------------------------------------------------------------
class Sim {
  constructor(mujoco, model, scene, policy) {
    this.mujoco = mujoco;
    this.model = model;
    this.scene = scene;
    this.policy = policy;
    this.data = new mujoco.MjData(model);
    const baseJoint = model.body_jntadr[scene.trunk_body_id];
    if (model.body_parentid[scene.trunk_body_id] !== 0 || model.jnt_type[baseJoint] !== 0) {
      throw new Error('The evaluator requires the exported trunk to have a world-parented free joint.');
    }
    this.baseQpos = model.jnt_qposadr[baseJoint];
    this.baseDof = model.jnt_dofadr[baseJoint];
    this.joints = scene.joints;     // observation order (qpos/qvel/default)
    this.actions = scene.actions;   // action order (ctrl_id/action_default/action_scale)
    this.obs = new Float32Array(policy.inputDim);
    this.lastAction = new Float32Array(this.actions.length);
    // The policy trained with each PD target applied this many physics steps
    // late (motor latency); a ring buffer of targets replays that here.
    this.delays = actuatorDelay(scene);
    this.delay = this.delays.total;
    this.targets = Array.from({ length: this.delay + 1 }, () => new Float64Array(this.actions.length));
    this.targetHead = 0;
    this.deliveredCommand = [0, 0, 0];
    this.command = [0, 0, 0];
    this.time = 0;
    this.fallen = false;
    this.reset();
  }

  static async load(mujoco, scenePolicyDir, scene, policy) {
    // MuJoCo reads the model from Emscripten's in-memory filesystem.
    const fs = mujoco.FS;
    try { fs.mkdir('/k1'); fs.mkdir('/k1/meshes'); } catch (_) { /* already there */ }
    const xmlBytes = policy.assets.get(scene.xml) || await fetch(scenePolicyDir + scene.xml).then(r => { if (!r.ok) throw new Error('xml'); return r.arrayBuffer(); });
    policy.assets.set(scene.xml, xmlBytes);
    const xml = new TextDecoder().decode(xmlBytes);
    fs.writeFile('/k1/' + scene.xml.split('/').pop(), xml);
    await Promise.all(scene.meshes.map(async path => {
      const bytes = policy.assets.get(path) || await fetch(scenePolicyDir + path).then(r => { if (!r.ok) throw new Error(path); return r.arrayBuffer(); });
      policy.assets.set(path, bytes);
      fs.writeFile('/k1/meshes/' + path.split('/').pop(), new Uint8Array(bytes));
    }));
    const model = mujoco.MjModel.from_xml_path('/k1/' + scene.xml.split('/').pop());
    if (Math.abs(model.opt.timestep - scene.sim_dt) > 1e-9) throw new Error('The XML timestep and exported sim_dt differ. Re-export the matching configuration before evaluation.');
    applyPhysicsProfile(model,scene);
    return new Sim(mujoco, model, scene, policy);
  }

  get command() { return this.deliveredCommand; }
  set command(value) { this.requestedCommand = [...value]; }

  reset() {
    const { mujoco, model, data, scene } = this;
    mujoco.mj_resetDataKeyframe(model, data, scene.keyframe_id);
    const ctrl = data.ctrl;
    for (const a of this.actions) ctrl[a.ctrl_id] = a.action_default;
    for (const t of this.targets) this.actions.forEach((a, i) => { t[i] = a.action_default; });
    // Actuated joints outside the policy (legs-only tasks) hold their default pose.
    for (const h of this.scene.held || []) ctrl[h.ctrl_id] = h.default;
    this.lastAction.fill(0);
    this.targetHead = 0;
    this.deliveredCommand = [0, 0, 0];
    this.command = [0, 0, 0];
    data.xfrc_applied.fill(0);
    mujoco.mj_forward(model, data);
    this.time = 0;
    this.substeps = 0;
    this.fallen = false;
    this.fallTime = 0;
    this.invalid = false;
    this.snapshot();
  }

  // Gravity direction (0, 0, -1) expressed in the trunk frame.
  projectedGravity(out) {
    const q = this.data.xquat;
    const b = this.scene.trunk_body_id * 4;
    const w = q[b], x = q[b + 1], y = q[b + 2], z = q[b + 3];
    out[0] = -2 * (x * z - w * y);
    out[1] = -2 * (y * z + w * x);
    out[2] = -(1 - 2 * (x * x + y * y));
    return out;
  }

  // Observe, run the policy and write PD targets. Runs every `decimation` physics
  // steps. Term order/dims come from scene.observation_term_dims (see
  // export_web_policy.py's OBS_TERM_DIMS -- this task's own layout, not
  // booster_mjlab's): projected_gravity(3), base_ang_vel(3), commands(3),
  // joint_pos(N), joint_vel(N), actions(N). No gait-phase clock in this task.
  control() {
    const { data, scene, obs, joints, actions } = this;
    // The sender contract runs on the control clock, independent of UI pace.
    this.deliveredCommand = slewCommand(this.deliveredCommand,this.requestedCommand,scene.command_limits.accel,scene.control_dt);
    const qpos = data.qpos, qvel = data.qvel, sensordata = data.sensordata;
    const gyro = scene.gyro_adr;

    let k = 0;
    const g = this.projectedGravity(this._g || (this._g = new Float64Array(3)));
    obs[k++] = g[0]; obs[k++] = g[1]; obs[k++] = g[2];
    obs[k++] = sensordata[gyro]; obs[k++] = sensordata[gyro + 1]; obs[k++] = sensordata[gyro + 2];
    obs[k++] = this.command[0]; obs[k++] = this.command[1]; obs[k++] = this.command[2];
    for (const j of joints) obs[k++] = qpos[j.qpos_adr] - j.default;
    for (const j of joints) obs[k++] = qvel[j.dof_adr] * scene.joint_vel_scale;
    for (let i = 0; i < actions.length; i++) obs[k++] = this.lastAction[i];

    const action = this.policy.run(obs);
    const current = this.current || (this.current = new Float64Array(actions.length));
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      this.lastAction[i] = action[i];
      const target = a.action_default + action[i] * a.action_scale;
      current[i] = Math.max(a.action_lower ?? -Infinity,
        Math.min(a.action_upper ?? Infinity, target));
    }

  }

  // Store this substep's target and send the one from `delay` substeps ago.
  applyTarget() {
    const n = this.targets.length;
    this.targets[this.targetHead].set(this.current);
    const out = this.targets[(this.targetHead + 1) % n];
    this.targetHead = (this.targetHead + 1) % n;
    const ctrl = this.data.ctrl;
    this.actions.forEach((a, i) => { ctrl[a.ctrl_id] = out[i]; });
  }

  // One physics step (sim_dt). Keeps the previous body poses so the renderer can
  // interpolate between physics states instead of showing jumps.
  substep() {
    if (this.substeps % this.scene.decimation === 0) this.control();
    this.applyTarget();
    this.snapshot();
    for (const motor of this.scene.torque_speed || []) {
      const limit = motor.peak * Math.max(0, Math.min(1,
        (motor.no_load - Math.abs(this.data.qvel[motor.dof_adr])) / motor.width));
      this.model.actuator_forcerange[2 * motor.ctrl_id] = -limit;
      this.model.actuator_forcerange[2 * motor.ctrl_id + 1] = limit;
    }
    const previousTime=this.data.time;
    this.mujoco.mj_step(this.model, this.data);
    if(this.data.time<previousTime+this.scene.sim_dt*0.5)this.invalid=true;
    // Benchmark fall/collapse detector, independent of exported reward terms.
    const qp=this.data.qpos, q=this.baseQpos;
    const upright=1-2*(qp[q+4]**2+qp[q+5]**2);
    if (upright<0.5 || qp[q+2]<0.36) this.fallTime+=this.scene.sim_dt; else this.fallTime=0;
    this.fallen=this.fallTime>=0.4;
    this.substeps++;
    this.time += this.scene.sim_dt;
  }

  snapshot() {
    const nbody = this.model.nbody;
    if (!this.prevXpos) { this.prevXpos = new Float64Array(nbody * 3); this.prevXquat = new Float64Array(nbody * 4); }
    this.prevXpos.set(this.data.xpos.subarray(0, nbody * 3));
    this.prevXquat.set(this.data.xquat.subarray(0, nbody * 4));
  }

  trunkPosition() {
    const p = this.data.qpos, b = this.baseQpos;
    return [p[b], p[b + 1], p[b + 2]];
  }

  // Transform the free-base world linear velocity into the full trunk frame,
  // matching the policy's body-frame commands even when it leans.
  trunkVelocity() {
    const v = this.data.qvel.subarray(this.baseDof), q = this.data.qpos, b = this.baseQpos+3;
    const w = q[b], x = q[b + 1], y = q[b + 2], z = q[b + 3];
    return [(1-2*(y*y+z*z))*v[0]+2*(x*y+w*z)*v[1]+2*(x*z-w*y)*v[2],
      2*(x*y-w*z)*v[0]+(1-2*(x*x+z*z))*v[1]+2*(y*z+w*x)*v[2],
      v[5]];
  }

  telemetry() {
    const q = this.data.qpos, b = this.baseQpos+3;
    const w=q[b], x=q[b+1], y=q[b+2], z=q[b+3];
    return { position:this.trunkPosition(), yaw:Math.atan2(2*(w*z+x*y),1-2*(y*y+z*z)),
      velocity:this.invalid?[NaN,NaN,NaN]:this.trunkVelocity(), fallen:this.fallen, pose:this.data.qpos,
      deliveredCommand:this.command };
  }

  replayPose(pose, previousPose = null) {
    if (!pose || pose.length !== this.data.qpos.length || !pose.every(Number.isFinite)) return;
    if (previousPose && previousPose.length === pose.length && previousPose.every(Number.isFinite)) {
      this.data.qpos.set(previousPose);
      this.mujoco.mj_forward(this.model, this.data);
      this.snapshot();
    } else previousPose = null;
    this.data.qpos.set(pose);
    this.mujoco.mj_forward(this.model, this.data);
    if (!previousPose) this.snapshot();
  }
}

export { Policy, Sim };
