// Physics and scoring have their own clock. Visibility only affects the preview.
import { Policy, Sim } from './simulation.js';
import { GauntletRunner } from './gauntlet.js';
import { runtimeFor, evaluationCommandLimits } from './runtime-profile.js';
import { fingerprintAssets } from './results.js';
import { previewSnapshot } from './worker-messages.js';

let sim, runner, paused=false, pace=1, timer=null, queued=false, cancelled=false;
let lastClock=0, credit=0, lastPreview=-Infinity, lastUpdate=-Infinity, reported=0, paceSample;
const channel=new MessageChannel();
function schedule(delay=0){
  if(queued||paused||!runner?.running)return;
  queued=true;
  if(delay)timer=setTimeout(()=>{timer=null;channel.port2.postMessage(null);},delay);
  else channel.port2.postMessage(null);
}
function resetClock(){lastClock=performance.now();credit=0;paceSample=null;}
function publish(snapshot,force=false){
  const now=performance.now();
  if(force||now-lastPreview>=1000/30){
    lastPreview=now;
    postMessage({type:'preview',round:snapshot.current?.id,
      telemetry:{...sim.telemetry(),pose:Array.from(sim.data.qpos)},time:sim.time,substeps:sim.substeps});
  }
  if(!force&&now-lastUpdate<100)return;
  let achievedPace=null;
  if(!paceSample)paceSample={wall:now,sim:runner.elapsed};
  else if(now-paceSample.wall>=500){
    achievedPace=(runner.elapsed-paceSample.sim)/((now-paceSample.wall)/1000);
    paceSample={wall:now,sim:runner.elapsed};
  }
  const attempts=runner.attempts.slice(reported).map(({id,passed,status})=>({id,passed,status}));
  reported=runner.attempts.length;lastUpdate=now;
  // The full scorecard is sent once by onComplete, not in every UI snapshot.
  // Keep telemetry on progress messages for clients using the earlier proxy.
  postMessage({type:'update',snapshot:previewSnapshot(snapshot),attempts,achievedPace,
    telemetry:{...sim.telemetry(),pose:Array.from(sim.data.qpos)},time:sim.time,substeps:sim.substeps});
}
function fail(error){
  if(timer!==null)clearTimeout(timer);
  paused=true;
  postMessage({type:'error',error:error.message||String(error)});
}
channel.port1.onmessage=()=>{
  queued=false;
  if(paused||!runner?.running)return;
  try{
    const now=performance.now();
    if(pace!=='max')credit+=Math.min(1,(now-lastClock)/1000)*pace;
    lastClock=now;
    const deadline=now+12,dt=sim.scene.sim_dt;
    // Pace changes only how many fixed substeps fit in a wall-clock interval.
    while(runner.running&&!paused&&(pace==='max'||credit>=dt)&&performance.now()<deadline){
      sim.substep();runner.step(dt);
      if(pace!=='max')credit-=dt;
    }
    if(runner.running){publish(runner.snapshot());schedule(pace==='max'||credit>=dt?0:8);}
  }catch(error){fail(error);}
};
self.onmessage=async({data})=>{
  try{
    if(data.type==='pause'){paused=data.paused;resetClock();if(!paused)schedule();else if(runner)publish(runner.snapshot(),true);return;}
    if(data.type==='pace'){pace=data.pace;resetClock();schedule();return;}
    if(data.type==='cancel'){cancelled=true;if(runner)runner.cancel();return;}
    if(data.type!=='start'||sim)return;
    pace=data.pace;
    const assets=new Map(data.assets);
    if(await fingerprintAssets(assets)!==data.fingerprint)throw Error('Background evaluator package fingerprint mismatch.');
    const scene=JSON.parse(new TextDecoder().decode(assets.get('scene.json')));
    const runtime=runtimeFor(scene),{default:loadMujoco}=await import(runtime.base+'mujoco.js');
    const mujoco=await loadMujoco({locateFile:path=>runtime.base+path});
    if(mujoco.mj_versionString()!==runtime.version)throw Error('Background evaluator MuJoCo version mismatch.');
    const policy=new Policy(scene.policy,new Float32Array(assets.get(scene.policy.file)));policy.assets=assets;
    sim=await Sim.load(mujoco,'',scene,policy);
    runner=new GauntletRunner({
      reset:()=>sim.reset(),read:()=>sim.telemetry(),setCommand:command=>{sim.command=command;},
      push:force=>{const base=scene.trunk_body_id*6;sim.data.xfrc_applied.fill(0);force.forEach((f,i)=>{sim.data.xfrc_applied[base+i]=f;});},
      onUpdate:snapshot=>publish(snapshot),
      onComplete:result=>{publish(runner.snapshot(),true);postMessage({type:'complete',result});},
    },{suite:data.suite,commandLimits:evaluationCommandLimits(scene)});
    runner.start();
    if(cancelled)runner.cancel();
    else{resetClock();schedule();}
  }catch(error){fail(error);}
};
