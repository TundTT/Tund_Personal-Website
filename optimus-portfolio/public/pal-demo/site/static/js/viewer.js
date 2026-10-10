// Interactive K1 gallery viewer: MuJoCo (WebAssembly) physics + an exported
// locomotion policy + three.js rendering, all in the browser. Assets come from
// gallery/policies/<slug>/ and gallery/scenes/<slug>/, produced by
// `scripts/export_policy.py` + `scripts/export_web_policy.py`.
//
// Ported from booster_mjlab's static/js/demo.js, with two K1-locomotion-task-
// specific differences (see export_web_policy.py for the full rationale):
//   1. No GLB/Draco baking -- the K1's visual meshes are already separate,
//      uncollided geoms in the source MJCF, so buildGeoms() draws them
//      straight from the compiled model (extended here to also exclude
//      collision geoms, which this task's renderer would otherwise double-draw).
//   2. A different, task-specific observation layout: this task's actor also
//      observes a "commands" term (vx, vy, wz) that booster_mjlab's task
//      doesn't have. See Sim.control() below.

import { EvaluationPanel } from './evaluation.js';
import { createBatchWorker } from './batch-worker.js';
import { Policy, Sim } from './simulation.js';
import { fingerprintAssets } from './results.js';
import { runtimeFor, compiledPhysics, checkReference } from './runtime-profile.js';

function policyDirFor(slug) {
  if (!/^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(slug)) throw new Error('Invalid policy identifier.');
  return `../policies/${slug}/`;
}

// ---------------------------------------------------------------------------
// Rendering: three.js meshes driven by interpolated MuJoCo body poses, drawn
// straight from the compiled model (no baked GLB -- see the file header).
// ---------------------------------------------------------------------------
class View {
  constructor(THREE, OrbitControls, canvas, sim) {
    this.THREE = THREE;
    this.sim = sim;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f7f7);
    scene.fog = new THREE.Fog(0xf7f7f7, 9, 22);
    this.scene = scene;

    // MuJoCo is z-up, three.js is y-up: everything simulated lives under this group.
    this.world = new THREE.Group();
    this.world.rotation.x = -Math.PI / 2;
    scene.add(this.world);

    this.camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.05, 60);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 8;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
    this.controls.target.set(0, 0.45, 0);
    this.camera.position.set(1.7, 0.95, 2.0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d9d9, 1.35));
    const sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(2.5, 6, 3.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 20;
    const s = 3.2;
    sun.shadow.camera.left = -s; sun.shadow.camera.right = s; sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    scene.add(sun); scene.add(sun.target);
    this.sun = sun;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ map: this.gridTexture(renderer), roughness: 1, metalness: 0 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    this.ground = ground;

    this.geoms = this.buildGeoms();
    this.tmpMatrix = new THREE.Matrix4();
    this.tmpVec = new THREE.Vector3();
    this.tmpPos = new THREE.Vector3();
    this.tmpQuat = new THREE.Quaternion();
    this.qa = new THREE.Quaternion();
    this.qb = new THREE.Quaternion();
    this.unit = new THREE.Vector3(1, 1, 1);
  }

  gridTexture(renderer) {
    const { THREE } = this;
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#c4c4c4';
    ctx.fillRect(0, 0, size, 3);
    ctx.fillRect(0, 0, 3, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(200, 200);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  // Draw every non-collision, non-floor geom straight from the compiled
  // MjModel. Collision geoms (group>=3 by mjlab convention, or explicitly
  // contype/conaffinity != 0, or named "*_collision") are excluded so the
  // undecimated collision hulls this task ships (for physics only) don't
  // double-draw over the K1's real visual meshes.
  buildGeoms() {
    const { THREE, sim } = this;
    const m = sim.model;
    const type = m.geom_type, size = m.geom_size, dataid = m.geom_dataid, group = m.geom_group;
    const contype = m.geom_contype, conaffinity = m.geom_conaffinity;
    const rgba = m.geom_rgba, matid = m.geom_matid, matRgba = m.mat_rgba;
    const gpos = m.geom_pos, gquat = m.geom_quat;
    const vert = m.mesh_vert, face = m.mesh_face, vadr = m.mesh_vertadr, fadr = m.mesh_faceadr, vnum = m.mesh_vertnum, fnum = m.mesh_facenum;
    const PLANE = 0, SPHERE = 2, CAPSULE = 3, ELLIPSOID = 4, CYLINDER = 5, BOX = 6, MESH = 7;
    const meshCache = new Map();
    const materials = new Map();
    const out = [];
    for (let g = 0; g < m.ngeom; g++) {
      if (group[g] >= 3 || type[g] === PLANE) continue;
      if (contype[g] !== 0 || conaffinity[g] !== 0) continue; // collision-only geom
      let geometry;
      const sx = size[g * 3], sy = size[g * 3 + 1], sz = size[g * 3 + 2];
      switch (type[g]) {
        case SPHERE: geometry = new THREE.SphereGeometry(sx, 24, 16); break;
        case CAPSULE: geometry = new THREE.CapsuleGeometry(sx, 2 * sy, 8, 24).rotateX(Math.PI / 2); break;
        case ELLIPSOID: geometry = new THREE.SphereGeometry(1, 24, 16).scale(sx, sy, sz); break;
        case CYLINDER: geometry = new THREE.CylinderGeometry(sx, sx, 2 * sy, 32).rotateX(Math.PI / 2); break;
        case BOX: geometry = new THREE.BoxGeometry(2 * sx, 2 * sy, 2 * sz); break;
        case MESH: {
          const id = dataid[g];
          if (!meshCache.has(id)) {
            const positions = vert.subarray(vadr[id] * 3, (vadr[id] + vnum[id]) * 3);
            const indices = face.subarray(fadr[id] * 3, (fadr[id] + fnum[id]) * 3);
            const indexed = new THREE.BufferGeometry();
            indexed.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
            indexed.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
            const flat = indexed.toNonIndexed();
            flat.computeVertexNormals();
            indexed.dispose();
            meshCache.set(id, flat);
          }
          geometry = meshCache.get(id);
          break;
        }
        default: continue;
      }
      const c = matid[g] >= 0 ? matRgba.subarray(matid[g] * 4, matid[g] * 4 + 4) : rgba.subarray(g * 4, g * 4 + 4);
      const key = `${c[0]},${c[1]},${c[2]},${c[3]}`;
      if (!materials.has(key)) {
        materials.set(key, new THREE.MeshStandardMaterial({
          color: new THREE.Color(c[0], c[1], c[2]).convertSRGBToLinear(),
          roughness: 0.55, metalness: 0.15, transparent: c[3] < 1, opacity: c[3],
        }));
      }
      const mesh = new THREE.Mesh(geometry, materials.get(key));
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      mesh.matrixAutoUpdate = false;
      this.world.add(mesh);
      const local = new THREE.Matrix4().compose(
        new THREE.Vector3(gpos[g * 3], gpos[g * 3 + 1], gpos[g * 3 + 2]),
        new THREE.Quaternion(gquat[g * 4 + 1], gquat[g * 4 + 2], gquat[g * 4 + 3], gquat[g * 4]),
        new THREE.Vector3(1, 1, 1));
      out.push({ mesh, id: g, local });
    }
    return out;
  }

  resize(width, height) {
    if (width < 2 || height < 2) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  bodyPose(id, alpha, position, quaternion) {
    const { sim } = this;
    const p0 = sim.prevXpos, q0 = sim.prevXquat, p1 = sim.data.xpos, q1 = sim.data.xquat;
    const p = id * 3, q = id * 4;
    position.set(
      p0[p] + (p1[p] - p0[p]) * alpha,
      p0[p + 1] + (p1[p + 1] - p0[p + 1]) * alpha,
      p0[p + 2] + (p1[p + 2] - p0[p + 2]) * alpha);
    this.qa.set(q0[q + 1], q0[q + 2], q0[q + 3], q0[q]);
    this.qb.set(q1[q + 1], q1[q + 2], q1[q + 3], q1[q]);
    quaternion.copy(this.qa).slerp(this.qb, alpha);
  }

  render(dt, alpha = 1) {
    const { sim, tmpPos, tmpQuat, tmpMatrix } = this;
    for (const { mesh, id, local } of this.geoms) {
      this.bodyPose(sim.model.geom_bodyid[id], alpha, tmpPos, tmpQuat);
      tmpMatrix.compose(tmpPos, tmpQuat, this.unit).multiply(local);
      mesh.matrix.copy(tmpMatrix);
      mesh.matrixWorldNeedsUpdate = true;
    }

    this.bodyPose(sim.scene.trunk_body_id, alpha, tmpPos, tmpQuat);
    this.tmpVec.set(tmpPos.x, tmpPos.z - 0.1, -tmpPos.y);
    const follow = 1 - Math.exp(-dt * 6);
    const delta = this.tmpVec.sub(this.controls.target).multiplyScalar(follow);
    this.controls.target.add(delta);
    this.camera.position.add(delta);
    this.controls.update();

    this.sun.position.set(this.controls.target.x + 2.5, 6, this.controls.target.z + 3.5);
    this.sun.target.position.copy(this.controls.target);
    this.ground.position.x = Math.round(this.controls.target.x);
    this.ground.position.z = Math.round(this.controls.target.z);
    this.renderer.render(this.scene, this.camera);
  }
}

// ---------------------------------------------------------------------------
// Input: virtual sticks, keyboard, gamepad.
// ---------------------------------------------------------------------------
class Joystick {
  constructor(element) {
    this.element = element;
    this.knob = element.querySelector('.joystick-knob');
    this.x = 0; this.y = 0;
    this.active = false;
    element.addEventListener('pointerdown', e => { this.active = true; element.setPointerCapture(e.pointerId); this.move(e); element.classList.add('active'); });
    element.addEventListener('pointermove', e => { if (this.active) this.move(e); });
    const release = () => { this.active = false; this.set(0, 0); element.classList.remove('active'); };
    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', release);
    element.addEventListener('lostpointercapture', release);
  }
  move(e) {
    const r = this.element.getBoundingClientRect();
    const radius = r.width / 2;
    let dx = (e.clientX - (r.left + radius)) / (radius * 0.72);
    let dy = -(e.clientY - (r.top + radius)) / (radius * 0.72);
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    this.set(dx, dy);
  }
  set(x, y) {
    this.x = x; this.y = y;
    const r = this.element.getBoundingClientRect();
    const k = r.width * 0.36;
    this.knob.style.transform = `translate(${x * k}px, ${-y * k}px)`;
  }
}

class Input {
  constructor(root, limits) {
    this.limits = limits;
    this.keys = new Set();
    this.stick = new Joystick(root.querySelector('.joystick'));
    this.target = [0, 0, 0];
    this.command = [0, 0, 0];
    root.addEventListener('keydown', e => {
      if (e.target !== root && e.target.tagName === 'BUTTON') return;
      if (this.handled(e.code)) { this.keys.add(e.code); e.preventDefault(); }
    });
    root.addEventListener('keyup', e => this.keys.delete(e.code));
    root.addEventListener('blur', () => this.keys.clear());
    this.usedGamepad = false;
  }
  handled(code) {
    return ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code);
  }
  readSticks() {
    let fwd = this.stick.y, left = 0, turn = -this.stick.x;
    const k = this.keys;
    const kf = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    const kl = (k.has('KeyA') ? 1 : 0) - (k.has('KeyD') ? 1 : 0);
    const kt = (k.has('KeyQ') || k.has('ArrowLeft') ? 1 : 0) - (k.has('KeyE') || k.has('ArrowRight') ? 1 : 0);
    fwd += kf; left += kl; turn += kt;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad || !pad.connected) continue;
      const dz = v => (Math.abs(v) < 0.12 ? 0 : v);
      const gx = dz(pad.axes[0] || 0), gy = dz(pad.axes[1] || 0), rx = dz(pad.axes[2] || 0);
      if (gx || gy || rx) { this.usedGamepad = true; fwd += -gy; left += -gx; turn += -rx; }
    }
    const clamp = v => Math.max(-1, Math.min(1, v));
    return [clamp(fwd), clamp(left), clamp(turn)];
  }
  update(dt) {
    const [f, l, t] = this.readSticks();
    const L = this.limits;
    this.target[0] = f >= 0 ? f * L.vx[1] : -f * L.vx[0];
    this.target[1] = l >= 0 ? l * L.vy[1] : -l * L.vy[0];
    this.target[2] = t >= 0 ? t * L.wz[1] : -t * L.wz[0];
    if (L.planar_max) {
      const scale = Math.min(1, L.planar_max / (Math.hypot(this.target[0], this.target[1]) || 1));
      this.target[0] *= scale; this.target[1] *= scale;
    }
    // Sim applies any exported sender ramp identically in manual and benchmark
    // modes. Do not add a second wall-clock-dependent smoothing stage here.
    for (let i = 0; i < 3; i++) this.command[i] = this.target[i];
    return this.command;
  }
}

// ---------------------------------------------------------------------------
// Page wiring.
// ---------------------------------------------------------------------------
function setupDemo(root) {
  const canvas = root.querySelector('canvas');
  const startOverlay = root.querySelector('.demo-start');
  const startButton = root.querySelector('.demo-start-button');
  const status = root.querySelector('.demo-status');
  const hud = root.querySelector('.demo-hud');
  const readout = root.querySelector('.demo-readout');
  const resetButton = root.querySelector('.demo-reset');
  const debug = { started: false, steps: 0, errors: [] };
  window.k1gallery = debug;

  const params = new URLSearchParams(window.location.search);
  // Portfolio adaptation: this bundle deliberately contains one featured policy.
  const slug = root.dataset.defaultPolicy;
  const batch = createBatchWorker(slug);
  let policyDir;
  try { policyDir = policyDirFor(slug); } catch (error) {
    status.textContent=error.message;startButton.disabled=true;batch?.fail(error);return;
  }
  const evaluation = new EvaluationPanel(slug,{batch});
  debug.evaluation = evaluation;

  const downloadLink = document.querySelector('.demo-download');
  if (downloadLink) {
    downloadLink.href = policyDir + 'policy.onnx';
    downloadLink.download = slug.replace(/\//g, '_') + '.onnx';
  }

  const policyTitle = document.querySelector('.policy-title');
  if (policyTitle) {
    fetch(policyDir + 'scene.json')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('scene.json'))))
      .then(headerScene => {
        const meta = evaluation.sim?.scene || headerScene;
        const title = meta.title || slug.split('/').pop();
        policyTitle.textContent = meta.author ? `${title} · ${meta.author}` : title;
        policyTitle.hidden = false;
        document.title = `${title} – K1 gallery`;
        evaluation.describe(meta);
      })
      .catch(() => {
        policyTitle.textContent = slug.split('/').pop();
        policyTitle.hidden = false;
      });
  }

  const setStatus = (text, isError = false) => {
    status.textContent = text;
    status.classList.toggle('is-error', isError);
  };

  startButton.addEventListener('click', async () => {
    startButton.disabled = true;
    root.classList.add('loading');
    try {
      setStatus('Loading MuJoCo (WebAssembly)…');
      const [THREE, { OrbitControls }, sceneBytes] = await Promise.all([
        import('three'),
        import('three/addons/controls/OrbitControls.js'),
        fetch(policyDir + 'scene.json').then(r => { if (!r.ok) throw new Error('scene.json'); return r.arrayBuffer(); }),
      ]);
      const scene = JSON.parse(new TextDecoder().decode(sceneBytes));
      const runtime=runtimeFor(scene);
      const {default:loadMujoco}=await import(runtime.base+'mujoco.js');
      const supported = ['projected_gravity','base_ang_vel','commands','joint_pos','joint_vel','actions'];
      if (JSON.stringify(scene.observation_names) !== JSON.stringify(supported)
        || scene.policy.input_dim !== 9 + 2*scene.joints.length + scene.actions.length
        || scene.policy.output_dim !== scene.actions.length
        || Math.abs(scene.control_dt-scene.sim_dt*scene.decimation)>1e-8) {
        throw new Error('This export has an unsupported observation layout or inconsistent control timing. Export a compatible web package.');
      }
      const mujoco = await loadMujoco({ locateFile: path => runtime.base + path });
      const actualVersion=mujoco.mj_versionString();
      if(actualVersion!==runtime.version)throw Error('Loaded MuJoCo does not match the pinned profile version.');
      setStatus('Loading robot and policy…');
      const policy = await Policy.load(policyDir, scene.policy);
      policy.assets.set('scene.json', sceneBytes);
      const sim = await Sim.load(mujoco, policyDir, scene, policy);
      const metadataFiles = [];
      await Promise.all(['policy.meta.json'].map(async path => {
        const response = await fetch(policyDir + path);
        if (response.ok) { policy.assets.set(path,await response.arrayBuffer()); metadataFiles.push(path); }
      }));
      const fingerprint = await fingerprintAssets(policy.assets);
      const verification = await checkReference(scene,policy.assets,actualVersion);
      const policyInfo = { slug, title:scene.title || slug.split('/').pop(), author:scene.author || '', added:scene.added || null, fingerprint,
        verification,profile:scene.evaluation_profile||null,
        environment:{ xml:scene.xml, simDt:scene.sim_dt,controlDt:scene.control_dt,decimation:scene.decimation,
          actualTimestep:sim.model.opt.timestep, actionDelaySubsteps:scene.action_delay_substeps || 0,
          actuatorBusDelaySubsteps:sim.delays.bus,totalDelaySubsteps:sim.delay,physics:compiledPhysics(sim.model),
          torqueSpeedMotors:(scene.torque_speed || []).length,commandLimits:scene.command_limits,
          metadataFiles,engine:`MuJoCo WASM ${actualVersion}`, assetHashesIncluded:policy.assets.size,
          commandDelivery:scene.command_limits.accel?'Exported sender acceleration ramp, applied on the policy control clock; requested and delivered commands recorded.':'Direct commands on the policy control clock, shared by manual and benchmark modes.' } };
      const view = new View(THREE, OrbitControls, canvas, sim);
      const input = new Input(root, scene.command_limits);
      evaluation.attach(sim, policyInfo);
      debug.sim = sim;
      run({ sim, view, input, scene, THREE });
      startOverlay.hidden = true;
      hud.hidden = false;
      root.classList.remove('loading');
      root.classList.add('running');
      root.focus({ preventScroll: true });
      debug.view = view;
      debug.started = true;
      window.dispatchEvent(new CustomEvent('pal-policy-ready'));
    } catch (error) {
      console.error(error);
      debug.errors.push(String(error));
      window.dispatchEvent(new CustomEvent('pal-policy-error', { detail: error.message || String(error) }));
      setStatus(`Could not start the demo: ${error.message || error}`, true);
      evaluation.loadFailed(error);
      startButton.disabled = false;
      root.classList.remove('loading');
    }
  });

  function run(ctx) {
    const { sim, view, input, scene } = ctx;
    const observer = new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect();
      view.resize(Math.round(r.width * view.renderer.getPixelRatio()), Math.round(r.height * view.renderer.getPixelRatio()));
    });
    observer.observe(canvas);
    let visible = true;
    const visiblePanels=new Set();
    const visibilityObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){if(entry.isIntersecting)visiblePanels.add(entry.target);else visiblePanels.delete(entry.target);}
      visible=visiblePanels.size>0;
    },{threshold:0.05});
    visibilityObserver.observe(root);
    visibilityObserver.observe(document.getElementById('trace-panel'));

    resetButton.addEventListener('click', () => {
      if (evaluation.isRunning) return;
      evaluation.exitReplay(); input.command.fill(0);sim.reset();evaluation.beginLive();root.focus({ preventScroll: true });
    });
    canvas.addEventListener('pointerdown', () => root.focus({ preventScroll: true }));

    let last = performance.now();
    let accumulator = 0;
    let fallenSince = null;
    const achieved = [0, 0, 0];
    const dt = scene.sim_dt;
    let runtimeFailed=false;
    let lastPreview=-Infinity;
    const failRuntime=error=>{
      runtimeFailed=true;evaluation.runtimeFailed(error);debug.errors.push(String(error));
      startOverlay.hidden=false;startButton.hidden=true;
      setStatus(`Simulation stopped: ${error.message}. Reload this page after correcting the export.`,true);
    };
    // Rendering and manual input stay on the UI thread. A dedicated worker owns
    // all automatic physics/scoring, including when this page is hidden.
    const resetTiming=()=>{last=performance.now();accumulator=0;};
    document.addEventListener('visibilitychange',resetTiming);
    window.addEventListener('pagehide',()=>evaluation.runner?.dispose?.());
    const frame = now => {
      requestAnimationFrame(frame);
      if(runtimeFailed)return;
      const elapsed = Math.min((now - last) / 1000, 0.25);
      last = now;
      if (document.hidden || (!visible && !evaluation.isRunning)) { accumulator=0;return; }
      if (evaluation.traceMode==='replay') { accumulator=0;view.render(elapsed,evaluation.previewAlpha(now));return; }
      if (evaluation.paused) { accumulator=0;view.render(elapsed,1);return; }

      if(evaluation.isRunning){
        accumulator=0;
      }else{
        sim.command=input.update(elapsed);
        accumulator+=elapsed;
        const maxSteps=Math.max(4*scene.decimation,Math.ceil(.08/dt));
        let steps=0;
        while(accumulator>=dt&&steps<maxSteps){
          try{sim.substep();evaluation.step(dt);}
          catch(error){failRuntime(error);return;}
          accumulator-=dt;steps++;
        }
        if(steps===maxSteps)accumulator=0;
      }
      debug.steps = sim.substeps;
      // Render interpolated poses at display cadence, independently of worker
      // physics, recorded samples, and the slower chart/progress updates.
      const previewElapsed=Math.min((now-lastPreview)/1000,0.25);
      lastPreview=now;

      if (sim.fallen && !evaluation.isRunning) {
        if (fallenSince === null) fallenSince = now;
        if (now - fallenSince > 1200) { sim.reset();evaluation.beginLive();fallenSince = null; }
        setStatus('Fell over, resetting…');
      } else {
        fallenSince = null;
        setStatus(input.usedGamepad ? 'Gamepad connected' : '');
      }
      const command=sim.command;
      debug.trunk = sim.trunkPosition(); debug.command = command.slice(); debug.time = sim.time;
      // Average over ~0.5 s: the trunk speeds up and slows within every step.
      const actual = evaluation.isRunning && evaluation.workerTelemetry ? evaluation.workerTelemetry.velocity : sim.trunkVelocity(), k = 1 - Math.exp(-previewElapsed / 0.5);
      for (let i = 0; i < 3; i++) achieved[i] += (actual[i] - achieved[i]) * k;
      const row = (label, [vx, vy, wz]) =>
        `${label}  vx ${vx.toFixed(2).padStart(5)}  vy ${vy.toFixed(2).padStart(5)} m/s  yaw ${wz.toFixed(2).padStart(5)} rad/s`;
      readout.textContent = `${row('command', command)}\n${row('actual ', achieved)}`;
      evaluation.drawLive(now);
      view.render(previewElapsed, evaluation.isRunning?evaluation.previewAlpha(now):accumulator / dt);
    };
    requestAnimationFrame(frame);
  }
  if(params.get('evaluate')==='1')queueMicrotask(()=>evaluation.requestStart('full'));
}

document.querySelectorAll('.demo').forEach(setupDemo);
