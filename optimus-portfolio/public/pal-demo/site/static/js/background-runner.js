import { buildPlan, classifyCommandRange } from './gauntlet.js';
import { evaluationCommandLimits } from './runtime-profile.js';

// A small UI-thread proxy; the worker owns every physics and scoring step.
export class BackgroundRunner {
  constructor(sim,policyInfo,{suite='full',pace=1,onUpdate,onPreview,onComplete,onError,onCancelled}={}){
    this.sim=sim;this.policyInfo=policyInfo;this.suite=suite;this.pace=pace;
    const commandLimits=evaluationCommandLimits(sim.scene);
    this.plan=buildPlan({suite}).map(attempt=>({...attempt,commandRange:classifyCommandRange(attempt,commandLimits)}));
    this.attempts=[];this.elapsed=0;this.running=false;
    this.onPreview=onPreview;this.onUpdate=onUpdate;this.onComplete=onComplete;this.onError=onError;this.onCancelled=onCancelled;
  }
  start(){
    this.running=true;
    try{
      this.worker=new Worker(new URL('./evaluation-worker.js',import.meta.url),{type:'module',name:'K1 evaluation'});
      this.worker.onerror=event=>{event.preventDefault();this.fail(Error(event.message||'Background evaluation failed.'));};
      this.worker.onmessage=({data})=>{
        if(!this.running)return;
        if(data.type==='error'){this.fail(Error(data.error));return;}
        if(data.type==='preview'){this.onPreview?.(data);return;}
        if(data.type==='update'){
          this.ready=true;
          this.attempts.push(...data.attempts);this.elapsed=data.snapshot.elapsed;this.latest=data.snapshot;
          this.onUpdate?.(data.snapshot,data);return;
        }
        if(data.type==='complete'){
          this.running=false;this.result=data.result;this.attempts=data.result.attempts;
          this.worker.terminate();this.sim.reset();this.onComplete?.(data.result);
        }
      };
      // Copy the exact, already verified assets. Never refetch a potentially
      // changed XML/actor after the UI has established this package's identity.
      this.worker.postMessage({type:'start',assets:[...this.sim.policy.assets],fingerprint:this.policyInfo.fingerprint,suite:this.suite,pace:this.pace});
    }catch(error){this.fail(error);}
  }
  pause(paused){this.worker?.postMessage({type:'pause',paused});}
  setPace(pace){this.pace=pace;this.worker?.postMessage({type:'pace',pace});}
  cancel(){
    if(!this.running)return;
    if(!this.ready){this.dispose();this.sim.reset();this.onCancelled?.();return;}
    this.worker?.postMessage({type:'cancel'});
  }
  snapshot(){return this.latest;}
  fail(error){if(!this.running)return;this.dispose();this.sim.reset();this.onError?.(error);}
  dispose(){this.running=false;this.worker?.terminate();}
}
