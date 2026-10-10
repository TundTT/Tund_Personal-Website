// A source reconstruction is not proof of the original checkpoint's Git tree.
// Ranking additionally requires a native-reference check of these exact assets
// and this runtime revision. Unknown imports remain usable for diagnostics.
export const RUNTIME_REVISION = 'native-nominal-v1';
const VERSIONS = new Set(['3.11.0', '3.13.0']);
const ENUMS = {
  integrator: { Euler: 0, implicitfast: 3 }, solver: { Newton: 2, CG: 1, PGS: 0 },
  cone: { pyramidal: 0, elliptic: 1 }, jacobian: { auto: 2, dense: 0, sparse: 1 },
};
const POSITIVE = ['timestep', 'iterations', 'ls_iterations', 'tolerance', 'ls_tolerance', 'ccd_iterations', 'impratio'];
export function runtimeFor(scene) {
  const profile=scene.evaluation_profile;
  if(!profile)return {version:'3.13.0',base:'https://cdn.jsdelivr.net/npm/@mujoco/mujoco@3.13.0/'};
  if(profile.schema!==1||profile.runtime?.package!=='@mujoco/mujoco'||!VERSIONS.has(profile.runtime.version))throw Error('Unsupported evaluation runtime profile.');
  return {version:profile.runtime.version,base:`https://cdn.jsdelivr.net/npm/@mujoco/mujoco@${profile.runtime.version}/`};
}
export function applyPhysicsProfile(model,scene) {
  const profile=scene.evaluation_profile;
  if(!profile)return;
  runtimeFor(scene);
  evaluationCommandLimits(scene);
  const physics=profile.physics;
  if(!physics||Math.abs(physics.timestep-scene.sim_dt)>1e-10)throw Error('Profile and scene physics timesteps disagree.');
  for(const [key,values] of Object.entries(ENUMS)){
    if(!Object.hasOwn(values,physics[key]))throw Error(`Unsupported profile ${key}.`);
    model.opt[key]=values[physics[key]];
  }
  for(const key of POSITIVE){
    if(!Number.isFinite(physics[key])||physics[key]<=0)throw Error(`Invalid profile ${key}.`);
    if(key.endsWith('iterations')&&!Number.isInteger(physics[key]))throw Error(`Invalid profile ${key}.`);
    model.opt[key]=physics[key];
  }
  if(!Array.isArray(physics.gravity)||physics.gravity.length!==3||!physics.gravity.every(Number.isFinite))throw Error('Invalid profile gravity.');
  model.opt.gravity.set(physics.gravity);
  const observation=profile.observations;
  if(observation?.sampling!=='pre-forward'||observation.noise!==false||observation.sensor_delay_control_steps!==0)throw Error('This observation profile needs an unsupported sensor pipeline.');
  const actual=compiledPhysics(model);
  if(actual.gravity.some((v,i)=>v!==physics.gravity[i]))throw Error('MuJoCo did not apply the declared gravity.');
  for(const key of [...POSITIVE,...Object.keys(ENUMS)]){
    const expected=ENUMS[key]?ENUMS[key][physics[key]]:physics[key];
    if(actual[key]!==expected)throw Error(`MuJoCo did not apply the declared ${key}.`);
  }
}
export function compiledPhysics(model) {
  const out={};
  for(const key of [...POSITIVE,...Object.keys(ENUMS)]){
    const value=model.opt[key];out[key]=typeof value==='object'?value.value:value;
  }
  out.gravity=Array.from(model.opt.gravity);return out;
}
export function actuatorDelay(scene) {
  const profile=scene.evaluation_profile;
  const explicit=profile?profile.actuation?.explicit_delay_substeps:(scene.action_delay_substeps||0);
  const bus=profile?profile.actuation?.bus_delay_substeps:0;
  if(![explicit,bus].every(n=>Number.isInteger(n)&&n>=0&&n<=10000))throw Error('Invalid actuator delay profile.');
  if(profile&&explicit!==(scene.action_delay_substeps||0))throw Error('Profile and exported action delay disagree.');
  return {explicit,bus,total:explicit+bus};
}
export function slewCommand(current,target,acceleration,dt) {
  if(!acceleration)return [...target];
  if(!Array.isArray(acceleration)||acceleration.length!==2||!acceleration.every(v=>Number.isFinite(v)&&v>0))throw Error('Invalid exported command acceleration.');
  const dx=target[0]-current[0],dy=target[1]-current[1],distance=Math.hypot(dx,dy);
  const ratio=distance?Math.min(1,acceleration[0]*dt/distance):1;
  return [current[0]+dx*ratio,current[1]+dy*ratio,current[2]+Math.max(-acceleration[1]*dt,Math.min(acceleration[1]*dt,target[2]-current[2]))];
}
// Evaluation scope can use limits recovered from the actual training run.
// Manual caps and sender acceleration continue to use scene.command_limits.
// An explicit malformed override is not permission to silently use export caps.
export function evaluationCommandLimits(scene) {
  const profile=scene.evaluation_profile;
  if(!profile||!Object.hasOwn(profile,'training_command_limits'))return scene.command_limits;
  const limits=profile.training_command_limits;
  if(!limits||typeof limits!=='object'||Array.isArray(limits))throw Error('Invalid training command limits.');
  for(const axis of ['vx','vy','wz']){
    const range=limits[axis];
    if(!Array.isArray(range)||range.length!==2||!Number.isFinite(range[0])||!Number.isFinite(range[1])||range[0]>range[1]){
      throw Error(`Invalid training command limits ${axis}.`);
    }
  }
  if(Object.hasOwn(limits,'planar_max')&&(!Number.isFinite(limits.planar_max)||limits.planar_max<=0))throw Error('Invalid training command limits planar_max.');
  return limits;
}
export function profileConfiguration(scene) {
  const copy=structuredClone(scene);
  for(const key of ['title','author','added'])delete copy[key];
  if(copy.evaluation_profile)delete copy.evaluation_profile.validation;
  return copy;
}
export function canonicalJSON(value) {
  if(Array.isArray(value))return `[${value.map(canonicalJSON).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonicalJSON(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export async function digest(bytes) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export async function checkReference(scene,assets,actualVersion) {
  const profile=scene.evaluation_profile,validation=profile?.validation;
  const reasons=[];
  if(!profile)reasons.push('No reconstructed evaluation profile.');
  else if(profile.provenance?.training_match!=='source-reconstructed')reasons.push('The historical training recipe is unresolved.');
  if(validation?.status!=='passed')reasons.push('This package has not passed its native reference check.');
  else {
    if(validation.runtime_revision!==RUNTIME_REVISION)reasons.push('The reference check used an older runtime implementation.');
    if(validation.runtime_version!==actualVersion||profile.runtime.version!==actualVersion)reasons.push('The reference check used a different MuJoCo version.');
    const configuration=await digest(new TextEncoder().encode(canonicalJSON(profileConfiguration(scene))));
    if(configuration!==validation.configuration_sha256)reasons.push('The configuration changed after the reference check.');
    const expected=validation.asset_hashes||{},paths=[...assets.keys()].filter(path=>path!=='scene.json').sort();
    const required=[scene.policy?.file,scene.xml,...(scene.meshes||[])];
    if(!scene.policy?.file||!scene.xml||required.some(path=>!assets.has(path)))reasons.push('Required simulation assets are missing.');
    if(JSON.stringify(paths)!==JSON.stringify(Object.keys(expected).sort()))reasons.push('The reference asset list does not match the loaded package.');
    else for(const path of paths)if(await digest(assets.get(path))!==expected[path]){reasons.push(`An asset changed after validation: ${path}`);break;}
  }
  return {eligible:reasons.length===0,label:reasons.length?'Unverified reconstruction':'Reconstructed · native checked',reasons,runtimeRevision:RUNTIME_REVISION,
    trainingMatch:profile?.provenance?.training_match||'unresolved',checkpointCommit:profile?.provenance?.checkpoint_commit||null};
}
