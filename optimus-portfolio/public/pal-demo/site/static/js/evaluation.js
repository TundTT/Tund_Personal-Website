import { GAUNTLET_VERSION, buildPlan, classifyCommandRange } from './gauntlet.js';
import { BackgroundRunner } from './background-runner.js';
import { evaluationCommandLimits } from './runtime-profile.js';
import { createGem } from './gem.js';
import { createBraking } from './braking.js';
import { getStoppingSample, stoppingSummary } from './stopping-data.js';
import { API_ROOT, getResults, saveResult, saveSharedResult, resultStorage, capabilities, downloadResult, element, format, timestamp } from './results.js';
import { renderTrace } from './traces.js';
import { LiveTraceBuffer } from './live-trace.js';

const byId=id=>document.getElementById(id);
const labels={standstill:'Standstill',tracking:'Tracking & transitions',capacity:'Speed limits',braking:'Directional braking',mixed:'Circles & combined movement',recovery:'Push recovery'};
const value=(v,unit='',digits=2)=>Number.isFinite(v)?`${format(v,digits)}${unit ? ` ${unit}` : ''}`:'—';

export class EvaluationPanel {
  constructor(slug,{batch=null}={}) {
    this.slug=slug;this.runner=null;this.sim=null;this.paused=false;this.replaying=false;this.result=null;
    this.batch=batch;
    if(batch){
      this.paused=batch.paused;
      batch.onPause=paused=>this.setPaused(paused);
      batch.onCancel=()=>this.cancelBatch();
      if(batch.pace)byId('run-pace').value=batch.pace;
    }
    this.lastDraw=0;this.lastTrace=[];this.traceMode='empty';this.liveTrace=new LiveTraceBuffer();this.lastLiveDraw=0;this.liveDirty=false;
    this.plan=buildPlan();this.roundButtons=new Map();
    this.gem=createGem(byId('motion-gem'),{points:[],onSelect:point=>{
      const attempt=this.result?.attempts.find(a=>point.attempts?.includes(a.id));
      if(attempt&&!this.isRunning)this.selectAttempt(attempt);
    }});
    this.braking=createBraking(byId('braking-footprint'));
    byId('policy-identity').textContent=slug;
    byId('plan-duration').textContent=`${this.plan.length} attempts · two repetitions · up to ${Math.ceil(this.plan.reduce((sum,a)=>sum+a.duration,0)/60)} sim min`;
    byId('run-gauntlet').addEventListener('click',()=>this.requestStart('full'));
    byId('rerun-gauntlet')?.addEventListener('click',()=>this.requestStart('full'));
    byId('save-evaluation')?.addEventListener('click',()=>this.saveShared());
    byId('run-pace').addEventListener('change',()=>{this.achievedPace=null;this.runner?.setPace?.(this.pace);});
    byId('run-smoke').addEventListener('click',()=>this.requestStart('smoke'));
    byId('pause-run').addEventListener('click',()=>this.setPaused(!this.paused));
    byId('cancel-run').addEventListener('click',()=>{this.paused=false;this.runner?.cancel();});
    byId('download-results').addEventListener('click',()=>{if(this.result)downloadResult(this.result);});
    byId('replay-scrub').addEventListener('input',event=>{this.playReplay=false;this.replayIndex=Number(event.target.value);this.replayElapsed=0;this.applyReplay();});
    byId('replay-play').addEventListener('click',()=>{
      if(this.replayIndex>=this.replayTrace.length-1){this.replayIndex=0;this.replayElapsed=0;}
      this.playReplay=!this.playReplay;this.applyReplay();
    });
    byId('replay-exit').addEventListener('click',()=>this.exitReplay());
    this.renderRounds();this.drawTrace();this.controls();
    capabilities().then(caps=>{this.saveAvailable=Boolean(caps.sharedEvaluations);this.saveControls();});
    new ResizeObserver(()=>this.drawTrace()).observe(byId('velocity-chart'));
    this.ready=Promise.all([getResults(),fetch(new URL('index.json',API_ROOT)).then(r=>r.ok?r.json():[]).catch(()=>[])]).then(([results,entries])=>{
      this.currentEntry=entries.find(entry=>entry.slug===slug);
      const result=results.get(slug);
      if(result&&!this.runner){this.result=result;this.showResult(result);}
    }).catch(()=>{});
    let replayLast=performance.now();
    const replayFrame=now=>{const dt=Math.min(.1,(now-replayLast)/1000);replayLast=now;if(this.playReplay&&!document.hidden)this.advanceReplay(dt);requestAnimationFrame(replayFrame);};
    requestAnimationFrame(replayFrame);
    window.addEventListener('beforeunload',event=>{if(this.isRunning&&!this.batch){event.preventDefault();event.returnValue='';}});
  }
  get isRunning(){return Boolean(this.runner?.running);}
  get pace(){const selected=byId('run-pace').value;return selected==='max'?'max':Number(selected)||1;}
  get paceLabel(){
    const actual=Number.isFinite(this.achievedPace)?` · ${format(this.achievedPace,1)}× actual`:'';
    return this.pace==='max'?`Max · hardware limited${actual}`:`${this.pace}× requested pace${actual}`;
  }
  describe(scene) {
    // A late header fetch must never replace the loaded simulation's contract.
    scene=this.sim?.scene||scene;
    this.scene=scene;
    const provenance=scene.evaluation_profile?.provenance;
    byId('policy-profile').textContent=`Trained by ${provenance?.trainer||'unknown'} · exported by ${provenance?.exporter||scene.author||'unknown'} · ${format(1/scene.control_dt,0)} Hz control · ${provenance?.training_match==='source-reconstructed'?'reconstructed nominal profile':'training recipe unresolved'}`;
    byId('policy-added').replaceChildren(timestamp(scene.added,'Added',''));
  }
  attach(sim,policyInfo) {
    this.sim=sim;this.policyInfo=policyInfo;this.describe(sim.scene);this.renderProvenance();
    if(this.result)this.showResult(this.result);
    if(this.batch?.cancelled||this.batch?.finished){this.paused=true;this.controls();return;}
    if(this.pendingRun){if(!this.paused){const suite=this.pendingRun;this.pendingRun=null;this.start(suite);}}
    else if(this.pendingReplay){const attempt=this.pendingReplay;this.pendingReplay=null;this.selectAttempt(attempt);}
    else this.beginLive();
  }
  loadFailed(error){this.pendingRun=null;this.pendingReplay=null;byId('evaluation-status').textContent=error.message||String(error);this.controls();this.batch?.fail(error);}
  runtimeFailed(error){this.batch?.fail(error);this.runner?.dispose?.();this.paused=false;this.workerTelemetry=null;this.setTraceMode('stopped');byId('evaluation-status').textContent=error.message||String(error);this.controls();}
  setPaused(paused) {
    this.paused=paused;this.runner?.pause?.(paused);
    if(this.batch)this.batch.paused=paused;
    if(!paused&&this.pendingRun&&this.sim){const suite=this.pendingRun;this.pendingRun=null;this.start(suite);}
    this.controls();
  }
  cancelBatch() {
    if(this.batch)this.batch.cancelled=true;
    this.pendingRun=null;this.pendingReplay=null;this.paused=true;
    this.runner?.cancel();this.controls();
  }
  requestStart(suite) {
    if(this.isRunning||this.batch&&(this.batch.cancelled||this.batch.finished||this.batch.started))return;
    if(!this.sim){this.pendingRun=suite;byId('evaluation-status').textContent='Loading the native package before evaluation…';document.querySelector('.demo-start-button').click();return;}
    if(this.batch?.paused){this.pendingRun=suite;return;}
    this.start(suite);
  }
  start(suite='full') {
    if(!this.sim||this.isRunning||this.batch&&(this.batch.cancelled||this.batch.finished||this.batch.started))return;
    if(this.batch?.paused){this.pendingRun=suite;return;}
    if(this.batch)this.batch.started=true;
    this.exitReplay();this.paused=false;this.achievedPace=null;
    const sim=this.sim;
    this.workerPreview=null;
    const runner=new BackgroundRunner(sim,this.policyInfo,{
      suite,pace:this.pace,
      onPreview:data=>{
        if(this.runner!==runner)return;
        this.applyWorkerPreview(data);
      },
      onUpdate:(snapshot,data)=>{
        if(this.runner!==runner)return;
        if(data.telemetry)this.applyWorkerPreview({...data,round:snapshot.current?.id});
        if(Number.isFinite(data.achievedPace))this.achievedPace=data.achievedPace;
        this.update(snapshot);
      },
      onError:error=>{if(this.runner===runner)this.runtimeFailed(error);},
      onCancelled:()=>{
        if(this.runner!==runner)return;
        this.paused=false;this.workerTelemetry=null;this.beginLive();this.controls();
        byId('result-state').textContent='Not evaluated';
        byId('evaluation-status').textContent='Cancelled before evaluation started. No saved results were replaced.';
      },
      onComplete:result=>{this.complete(result,runner).catch(error=>{
        if(this.runner!==runner||this.batch?.cancelled)return;
        byId('evaluation-status').textContent=error.message||String(error);this.batch?.fail(error,{result});
      });},
    });
    this.runner=runner;
    this.plan=this.runner.plan;this.result=null;this.renderRounds();this.gem.setPoints([]);this.braking.setResult(null);
    byId('download-results').disabled=true;byId('round-detail').hidden=true;
    byId('standstill-stats').querySelectorAll('.metric-value').forEach(node=>{node.textContent='—';});
    for(const [id,columns] of [['direction-results',8],['turning-results',4]]){
      const tbody=byId(id),row=element('tr'),cell=element('td','empty-state','Measurements will appear when this run finishes.');cell.colSpan=columns;row.append(cell);tbody.replaceChildren(row);
    }
    this.setTraceMode('evaluation');this.liveTrace.reset();this.liveDirty=false;
    this.lastTrace=[];this.drawTrace();
    byId('result-state').textContent=suite==='full'?'Evaluating':'Diagnostic';
    byId('dependability-score').textContent=byId('performance-score').textContent='—';
    byId('result-note').textContent='Measuring this package. Scores appear after the run completes.';
    byId('result-evaluated').hidden=true;
    byId('run-settings').open=false;
    byId('round-name').textContent='Preparing background evaluator…';
    byId('round-count').textContent=`0 / ${this.plan.length}`;
    byId('run-progress').value=0;
    byId('evaluation-status').textContent='Loading the verified simulation package in a background worker…';
    this.runner.start();this.controls();
  }
  step(dt){
    if(this.isRunning)return;
    if(!this.sim||this.traceMode==='replay')return;
    if(this.traceMode!=='live')this.beginLive();
    if(this.liveTrace.sample(this.sim.time,this.sim.telemetry(),this.sim.command,this.sim.requestedCommand))this.liveDirty=true;
  }
  setTraceMode(mode) {
    if(this.traceMode===mode)return;
    this.traceMode=mode;
    byId('trace-source').textContent={empty:'No telemetry yet',live:'Live playground · last 20 s',evaluation:'Live gauntlet',recorded:'Recorded round',replay:'Recorded replay',stopped:'Simulation stopped'}[mode];
    byId('trace-legend').textContent=mode==='live'
      ?'Dotted: requested · dashed: delivered · light: actual · solid: smoothed (0.2 s)'
      :'Dotted: requested · dashed: delivered · light: actual · solid: scored';
    byId('velocity-chart').setAttribute('aria-label',mode==='live'
      ?'Live commanded, raw, and smoothed actual forward, lateral and yaw velocities over the last 20 simulation seconds'
      :'Recorded commanded, raw, and scored forward, lateral and yaw velocities over time');
  }
  drawTrace() {
    renderTrace(this.lastTrace,this.traceMode==='replay'?this.replayIndex:null,{
      mode:this.traceMode==='live'?'live':'recorded',
      height:matchMedia('(min-width:1100px)').matches?210:270,
      emptyMessage:this.traceMode==='live'?'Waiting for motion…':'Load a policy or select a round.',
    });
  }
  beginLive() {
    this.liveTrace.reset();this.lastTrace=[];this.liveDirty=false;this.lastLiveDraw=0;
    this.setTraceMode(this.sim?'live':'empty');
    if(this.sim){this.liveTrace.sample(this.sim.time,this.sim.telemetry(),this.sim.command,this.sim.requestedCommand);this.lastTrace=this.liveTrace.trace;}
    this.drawTrace();
  }
  drawLive(now) {
    if(this.traceMode!=='live'||!this.liveDirty||now-this.lastLiveDraw<100)return;
    this.lastLiveDraw=now;this.liveDirty=false;this.lastTrace=this.liveTrace.trace;this.drawTrace();
  }
  controls() {
    const running=this.isRunning,completed=Boolean(this.result?.status==='complete');
    if(byId('evaluation-workspace'))byId('evaluation-workspace').dataset.runState=running?(this.paused?'paused':'running'):completed?'complete':'ready';
    if(byId('run-ready-controls'))byId('run-ready-controls').hidden=running;
    if(byId('run-active-controls'))byId('run-active-controls').hidden=!running;
    byId('run-gauntlet').hidden=completed;
    if(byId('rerun-gauntlet')){byId('rerun-gauntlet').hidden=!completed;byId('rerun-gauntlet').disabled=running;}
    byId('run-progress').hidden=!running;
    if(byId('run-progress-panel'))byId('run-progress-panel').hidden=!running;
    if(byId('result-actions'))byId('result-actions').hidden=!this.result||running;
    this.saveControls();
    byId('run-gauntlet').disabled=byId('run-smoke').disabled=running;
    byId('pause-run').disabled=byId('cancel-run').disabled=!running;
    byId('pause-run').textContent=this.paused?'Resume':'Pause';
    byId('run-mode').textContent=this.traceMode==='replay'?(this.replaying?'Recorded replay':'Recorded trace'):running?(this.paused?'Paused':'Gauntlet'):'Playground';
    document.querySelector('.demo-reset').disabled=running;
    document.querySelector('.demo').classList.toggle('evaluating',running||this.traceMode==='replay');
    this.roundButtons.forEach(button=>{button.disabled=running;});
  }
  update(snapshot) {
    this.batch?.progress(snapshot);
    if(performance.now()-this.lastDraw<100&&snapshot.running)return;
    this.lastDraw=performance.now();
    byId('run-progress').value=snapshot.progress;
    byId('round-count').textContent=`${snapshot.completed} / ${snapshot.total}`;
    if(snapshot.current){
      byId('round-name').textContent=`${snapshot.current.label} · ${snapshot.current.phase}`;
      byId('evaluation-status').textContent=`Rep ${snapshot.current.trial} · ${format(snapshot.elapsed,1)} sim s · ${this.paused?'Paused':`${this.paceLabel} · Keep this page open`}`;
      this.setTraceMode('evaluation');this.lastTrace=snapshot.trace;this.drawTrace();
    }
    const outcomes=new Map(this.runner.attempts.map(a=>[a.id,a]));
    this.roundButtons.forEach((button,id)=>{
      const outcome=outcomes.get(id),active=snapshot.current?.id===id;
      button.classList.toggle('is-active',active);
      button.classList.toggle('is-passed',Boolean(outcome?.passed));
      button.classList.toggle('is-failed',Boolean(outcome&&!outcome.passed));
      button.querySelector('.round-outcome').textContent=outcome?outcome.status:active?snapshot.current.phase:'Pending';
    });
  }
  async complete(result,runner=this.runner) {
    if(this.runner!==runner||this.batch&&(this.batch.cancelled||this.batch.finished))return;
    if(this.batch&&(result.status!=='complete'||result.suite!=='full')){
      this.batch.fail('The batch evaluation ended before a complete scorecard was produced.');return;
    }
    result.policy=structuredClone(this.policyInfo);
    result.rankable=result.rankable&&this.policyInfo.verification.eligible;
    result.unrankedReasons=[...this.policyInfo.verification.reasons,...(result.summary.dependabilityCoverage?.reason?[result.summary.dependabilityCoverage.reason]:[])];
    const limits=this.scene.command_limits;
    result.protocol.exportCommandLimits=limits;
    result.protocol.evaluationCommandLimits=evaluationCommandLimits(this.scene);
    const profile=this.scene.evaluation_profile;
    result.protocol.commandLimitSource=profile?.training_command_limits
      ?profile.provenance?.wandb?.curriculum_evidence?'Logged training configuration and curriculum at the exported checkpoint':'Logged initial range and reconstructed fixed-range task; original task source is incomplete'
      :'Exported command declaration; reached training curriculum unavailable';
    result.protocol.fallDetector={uprightCosineBelow:0.5,baseHeightBelowMeters:0.36,durationSeconds:0.4,note:'Shared K1 benchmark detector; not a reconstruction of training terminations.'};
    result.protocol.outsideExportLimits=this.plan.filter(a=>classifyCommandRange(a,limits).status==='stress').map(a=>a.id);
    result.protocol.outsideEvaluatedCommandLimits=this.plan.filter(a=>a.commandRange.status==='stress').map(a=>a.id);
    this.result=result;this.workerTelemetry=null;this.paused=false;this.showResult(result);this.controls();
    byId('round-name').textContent=result.status==='complete'?'Evaluation complete':'Run ended · partial results';
    const saveFull=result.status==='complete'&&result.suite==='full';
    byId('evaluation-status').textContent=saveFull?'Saving scorecard and recorded rollouts…':'Diagnostic or partial run. Inspect and download it; the saved full result has not been replaced.';
    if(saveFull){
      const saved=await saveResult(result);
      if(this.runner!==runner||this.result!==result||this.isRunning||this.batch?.cancelled)return;
      const qualification=result.rankable?'':' Unranked: '+result.unrankedReasons.join(' ');
      byId('evaluation-status').textContent=(saved.server?'Saved to this gallery and cached in this browser.':saved.local?`Saved in this browser. ${saved.error ? `Disk save failed: ${saved.error}` : 'Use the gallery helper server to also save results on disk.'}`:`Could not save: ${saved.error}. Download this scorecard to keep it.`)+qualification;
      this.batch?.complete(result,saved);
    }
  }
  saveControls(message=null) {
    const button=byId('save-evaluation'),status=byId('save-status');if(!button||!status)return;
    const complete=this.result?.status==='complete'&&this.result?.suite==='full';
    const storage=this.result?resultStorage(this.result):{};
    // Portfolio adaptation: original server upload UI is not relevant here.
    button.hidden=true;
    status.textContent=message||(!complete?'Diagnostic results':storage.shared?'Saved evaluation':storage.local?'Stored in this browser':'Download to keep');
    status.removeAttribute('title');
  }
  async saveShared() {
    const result=this.result;
    if(this.saving||this.isRunning||result?.status!=='complete'||result?.suite!=='full')return;
    this.saving=true;this.saveControls();
    try{
      await saveSharedResult(result);
      if(this.result===result){this.saving=false;this.saveControls();}
    }catch(error){if(this.result===result){this.saving=false;this.saveControls(`Could not save to the repository: ${error.message}`);}}
    finally{this.saving=false;}
  }
  showResult(result) {
    const fingerprint=this.policyInfo?.fingerprint||this.currentEntry?.fingerprint;
    const stale=fingerprint&&result.policy?.fingerprint!==fingerprint;
    const compatible=result.version===GAUNTLET_VERSION;
    byId('result-state').textContent=!fingerprint?'Stored · unverified':stale?'Package changed':!compatible?'Older protocol':result.rankable?'Native checked':result.status==='cancelled'?'Partial run':result.suite==='full'?'Unranked · unverified':'Diagnostic';
    byId('dependability-score').textContent=format(result.scores?.dependability,1);
    byId('performance-score').textContent=format(result.scores?.performance,1);
    const coverage=result.summary.dependabilityCoverage;
    byId('result-note').textContent=`${result.summary.passed}/${result.completedAttempts} attempts passed · ${result.summary.falls} falls. ${!fingerprint?'Current package identity is unverified.':stale?'Stored measurements belong to a different package; rerun to rank.':!compatible?'Rerun with the current protocol to rank.':result.unrankedReasons?.length?result.unrankedReasons.join(' '):result.policy?.profile?.provenance?.wandb?'Native reference checked; checkpoint linked to logged W&B training evidence.':'Native reference checked; historical source reconstructed, exact training checkout unrecorded.'}${coverage?` Dependability: ${coverage.included}/${coverage.completed} completed reliability attempts included; ${coverage.excludedStress} beyond-range and ${coverage.unverified} unverified excluded. Performance retains stress tests.`:''}`;
    byId('download-results').disabled=false;
    byId('result-evaluated').replaceChildren(timestamp(result.completedAt,'Evaluated',''));
    byId('result-evaluated').hidden=false;
    this.gem.setPoints(result.envelope||[]);
    this.braking.setResult(result);
    const stats=byId('standstill-stats');stats.replaceChildren();
    const stops=stoppingSummary(result);
    for(const [label,text] of [['Worst standstill drift',value(Number.isFinite(result.summary.standstill?.worstDrift)?result.summary.standstill.worstDrift*1000:null,'mm',1)],['Longest successful stop',stops.worstSuccessfulDistance===null?'No passed stops':value(stops.worstSuccessfulDistance,'m')],['Total falls',`${result.summary.falls} (${stops.falls} during braking)`]]){
      const metric=element('div','metric');metric.append(element('span','',label),element('strong','metric-value',text));stats.append(metric);
    }
    const tbody=byId('direction-results');tbody.replaceChildren();
    for(const dir of [...(result.directions||[]),...(result.yaw||[])]) {
      const yaw=dir.maxSustainedRate!==undefined;
      const testedTracking=result.attempts.some(a=>a.kind==='tracking'&&a.direction===dir.id);
      const testedCapacity=result.attempts.some(a=>a.kind==='capacity'&&a.direction===dir.id);
      for(const [i,stop] of (dir.stopping.length?dir.stopping:[null]).entries()){
        const row=element('tr');const ceiling=dir.ceilingReached?' · ceiling passed':'';
        const sample=stop?getStoppingSample(result,dir.id,stop.speed):null;
        const meanStop=sample?(yaw?sample.angularDistance:sample.distance):null;
        const worstStop=sample?(yaw?sample.worstAngularDistance:sample.worstDistance):null;
        const passes=sample?.total!==null&&sample?.total!==undefined?`${sample.passed}/${sample.total}`:sample?.successRate!=null?`${format(sample.successRate*100,0)}%`:'—';
        const failures=sample?.failures.map(failure=>`${failure.count===null?'':`${failure.count}× `}${failure.label}`).join(' · ')|| (sample?.tested?'None':'Not tested');
        const values=[i===0?dir.label:'',i===0?(testedTracking?format(dir.trackingScore,1):'Not tested'):'',i===0?(testedCapacity?`${value(yaw?dir.maxSustainedRate:dir.maxSustainedSpeed,yaw?'rad/s':'m/s')}${ceiling}`:'Not tested'):'',stop?value(stop.speed,yaw?'rad/s':'m/s'):'—',meanStop===null&&sample?.tested?'No valid stop':value(meanStop,yaw?'rad':'m'),value(worstStop,yaw?'rad':'m'),passes,failures];
        values.forEach(v=>row.append(element('td','',v)));tbody.append(row);
      }
    }
    const turning=byId('turning-results');turning.replaceChildren();
    for(const turn of result.turning||[]) {
      for(const test of (turn.atSpeeds?.length?turn.atSpeeds:[null])) {
        const row=element('tr');[turn.label,test?value(test.speed,'m/s'):'—',test?value(test.smallestPassedRadius,'m'):'No passing probe',test?value(test.measuredRadius,'m'):'—'].forEach(text=>row.append(element('td','',text)));turning.append(row);
      }
    }
    if(!turning.children.length){const row=element('tr'),cell=element('td','empty-state','No measured turning probes in this run.');cell.colSpan=4;row.append(cell);turning.append(row);}
    this.renderRounds(result.attempts);
    this.renderProvenance();this.controls();
    const first=result.attempts.find(a=>!a.passed)||result.attempts[0];
    if(first&&!['live','replay'].includes(this.traceMode)){this.setTraceMode('recorded');this.lastTrace=first.trace;this.drawTrace();}
  }
  renderRounds(attempts) {
    const root=byId('round-list');root.replaceChildren();this.roundButtons.clear();
    const list=attempts||this.plan;
    for(const [kind,title] of Object.entries(labels)) {
      const group=list.filter(a=>a.kind===kind);if(!group.length)continue;
      const details=element('details','round-group');details.open=kind==='standstill';
      details.append(element('summary','',`${title} · ${group.length} attempts${attempts?` · ${group.filter(a=>a.passed).length} passed`:''}`));
      for(const round of group){
        const button=element('button','round-row');button.type='button';button.dataset.round=round.id;
        const title=element('span','',`${round.label} · run ${round.trial}${round.commandRange?.status==='stress'?' · beyond-range stress test':round.commandRange?.status==='unknown'?' · range unverified':''}`);
        button.append(title,element('span','round-outcome',round.status||'Pending'));
        button.classList.toggle('is-passed',Boolean(round.passed));button.classList.toggle('is-failed',Boolean(round.status&&!round.passed));
        button.addEventListener('click',()=>{const attempt=(this.result?.attempts||this.runner?.attempts||[]).find(a=>a.id===round.id);if(attempt)this.selectAttempt(attempt);});
        details.append(button);this.roundButtons.set(round.id,button);
      }
      root.append(details);
    }
  }
  selectAttempt(attempt) {
    if(this.isRunning)return;
    const detail=byId('round-detail');detail.hidden=false;detail.replaceChildren();
    detail.append(element('h3','',attempt.label),element('p','',`${attempt.status}${attempt.reason?` · ${attempt.reason}`:''}`));
    if(attempt.commandRange)detail.append(element('p','',attempt.commandRange.status==='stress'?'Beyond the evaluated command range. Retained for performance testing; excluded from dependability.':attempt.commandRange.status==='within'?'Within the evaluated command range.':'Command range unverified; excluded from dependability.'));
    const grid=element('div','provenance-grid');
    const m=attempt.metrics;
    if(attempt.kind==='braking'){
      const limits=this.result?.protocol?.thresholds;
      if(limits)detail.append(element('p','',`Stop travel starts when zero is requested and includes the exported sender ramp. Hold requires a delivered zero command, raw planar speed ≤ ${limits.stopLinear} m/s and raw yaw speed ≤ ${limits.stopYaw} rad/s for the final ${limits.holdSeconds} s of the ${value(m.phases?.brake?.duration,'s')} window. Residual rotation can fail this check without a fall.`));
      for(const [name,measurement] of [['Required final hold',m.requiredHoldDuration],['Both limits held at end',m.quietDuration],['Translation limit held at end',m.linearQuietDuration],['Yaw limit held at end',m.yawQuietDuration]]){
        if(!Number.isFinite(measurement))continue;
        const item=element('div');item.append(element('span','muted small',name),element('strong','',value(measurement,'s')));grid.append(item);
      }
    }
    const travelLabel=attempt.kind==='braking'&&!attempt.passed?'Travel after zero command · failed attempt':'Travel after zero command';
    const fields=[[`Linear tracking RMSE (${m.trackingSignal||'raw'})`,value(m.linearRmse,'m/s')],[`Yaw tracking RMSE (${m.trackingSignal||'raw'})`,value(m.yawRmse,'rad/s')],['Raw linear RMSE',value(m.rawLinearRmse,'m/s')],['Raw yaw RMSE',value(m.rawYawRmse,'rad/s')],['Actual starting speed',value(m.measuredStartSpeed,'m/s')],[travelLabel,value(m.distance,'m')],['Forward overshoot',value(m.overshoot,'m')],['Sideways deviation',value(m.lateralDeviation,'m')],['Angular travel',value(m.angularDistance===undefined?undefined:m.angularDistance*180/Math.PI,'°')],['Settling time',value(m.settleTime,'s')],['Velocity-derived radius',value(m.measuredRadius,'m')]];
    for(const [name,text] of fields)if(text!=='—'){const item=element('div');item.append(element('span','muted small',name),element('strong','',text));grid.append(item);}
    detail.append(grid);
    this.setTraceMode(attempt.trace.length?'replay':'recorded');this.liveDirty=false;
    this.replayTrace=attempt.trace;this.replayIndex=0;this.replayElapsed=0;this.playReplay=false;
    this.lastTrace=attempt.trace;this.drawTrace();
    byId('replay-controls').hidden=!attempt.trace.length;
    byId('replay-scrub').max=Math.max(0,attempt.trace.length-1);byId('replay-scrub').value=0;
    const matching=!this.policyInfo||this.policyInfo.fingerprint===this.result?.policy?.fingerprint;
    if(!this.sim&&attempt.trace.some(p=>p.pose)){this.pendingReplay=attempt;document.querySelector('.demo-start-button').click();}
    this.replaying=Boolean(this.sim&&matching&&attempt.trace.some(p=>p.pose));
    if(!matching)byId('evaluation-status').textContent='Trace only: robot replay needs the matching package.';
    this.applyReplay();this.controls();
  }
  applyReplay() {
    const frame=this.replayTrace?.[this.replayIndex];if(!frame)return;
    const next=this.replayTrace[this.replayIndex+1];
    if(this.replaying)this.sim.replayPose(next?.pose||frame.pose,next?.pose&&frame.pose?frame.pose:null);
    byId('replay-scrub').value=this.replayIndex;
    byId('replay-time').textContent=`${format(frame.t,1)}s · ${frame.phase}`;
    byId('replay-play').textContent=this.playReplay?'Pause':'Play';
    this.lastTrace=this.replayTrace;this.drawTrace();
    if(this.replaying){
      document.querySelector('.demo-readout').textContent=`recorded command  ${frame.command.map(v=>format(v)).join(' / ')}\nrecorded actual     ${frame.velocity.map(v=>format(v)).join(' / ')}`;
    }
  }
  applyWorkerPreview(data) {
    // Progress messages also carry poses for older cached worker/proxy versions.
    // A duplicate must not restart interpolation at the same sample.
    if(this.workerPreview?.substeps===data.substeps&&this.workerPreview?.time===data.time)return;
    const now=performance.now(),previous=this.workerPreview;
    const continuous=previous&&previous.round===data.round&&data.time>previous.time&&now-previous.received<250;
    this.workerTelemetry=data.telemetry;
    this.sim.replayPose(data.telemetry.pose,continuous?previous.telemetry.pose:null);
    this.workerPreview={...data,received:now,duration:continuous?Math.max(1,now-previous.received):0};
    this.sim.deliveredCommand=[...data.telemetry.deliveredCommand];
    this.sim.time=data.time;this.sim.substeps=data.substeps;
  }
  previewAlpha(now=performance.now()) {
    if(this.traceMode==='replay'){
      const frame=this.replayTrace?.[this.replayIndex],next=this.replayTrace?.[this.replayIndex+1];
      return frame?.pose&&next?.pose?Math.min(1,this.replayElapsed/Math.max(.001,next.t-frame.t)):1;
    }
    const preview=this.workerPreview;
    return preview?.duration&&!this.paused?Math.min(1,(now-preview.received)/preview.duration):1;
  }
  advanceReplay(dt) {
    if(!this.playReplay)return;
    this.replayElapsed+=dt;const previous=this.replayIndex;
    while(this.replayIndex<this.replayTrace.length-1&&this.replayElapsed>=Math.max(.001,this.replayTrace[this.replayIndex+1].t-this.replayTrace[this.replayIndex].t)){
      this.replayElapsed-=Math.max(.001,this.replayTrace[this.replayIndex+1].t-this.replayTrace[this.replayIndex].t);this.replayIndex++;
    }
    if(this.replayIndex>=this.replayTrace.length-1)this.playReplay=false;
    if(previous!==this.replayIndex || !this.playReplay)this.applyReplay();
  }
  exitReplay() {
    const wasReplaying=this.replaying;this.replaying=false;this.playReplay=false;this.pendingReplay=null;
    byId('replay-controls').hidden=true;
    if(wasReplaying)this.sim?.reset();
    this.beginLive();
    this.controls();
  }
  renderProvenance() {
    const policy=this.result?.policy||this.policyInfo;if(!policy)return;
    const info=byId('provenance-details');info.replaceChildren();
    const env=policy.environment||{};
    const profile=policy.profile||this.scene?.evaluation_profile,provenance=profile?.provenance||{};
    for(const [name,text] of [['Checkpoint',policy.slug],['Validation',policy.verification?.label||'Not verified'],['Trainer',provenance.trainer],['Exporter',provenance.exporter||policy.author],['Historical branch',provenance.branch],['Source evidence revision',provenance.source_commit],['Checkpoint Git revision',provenance.checkpoint_commit||'Not recorded; source reconstruction is not an exact checkout match'],['Package SHA-256',policy.fingerprint],['Exported XML',env.xml],['Physics step',value(env.actualTimestep||env.simDt,'s',4)],['Control period',value(env.controlDt,'s',3)],['Action delay',`${env.actionDelaySubsteps||0} + ${env.actuatorBusDelaySubsteps||0} bus physics steps`],['Integrator',env.physics?.integrator===3?'implicitfast':env.physics?.integrator===0?'Euler':'Not recorded'],['Runtime',env.engine],['Training dependency',provenance.training_engine],['Command delivery',env.commandDelivery],['Torque-speed motors',env.torqueSpeedMotors],['Metadata',env.metadataFiles?.join(', ')||'No separate metadata file'],['Profile limitations',(profile?.limitations||[]).join(' ')]]){
      const item=element('div');item.append(element('span','muted small',name),element('strong','',String(text??'—')));info.append(item);
    }
    if(profile?.training_command_limits){
      const label=provenance.wandb?.curriculum_evidence?'Dependability command range · logged checkpoint curriculum':'Dependability command range · logged initial range and task reconstruction';
      const item=element('div');item.append(element('span','muted small',label),element('strong','',JSON.stringify(profile.training_command_limits)));info.append(item);
    }
    if(provenance.wandb){
      const evidence=provenance.wandb,item=element('div');
      item.append(element('span','muted small','Training run evidence'));
      if(typeof evidence.run_url==='string'&&/^https:\/\/wandb\.ai\/[A-Za-z0-9_/-]+$/.test(evidence.run_url)){
        const link=element('a','','Open matched W&B run');link.href=evidence.run_url;link.target='_blank';link.rel='noopener noreferrer';item.append(link);
      }
      item.append(element('p','',`Run Git revision: ${evidence.run_git_commit||'Not recorded'}. ${evidence.source_tree_note||''} Checkpoint actor and normalization parameters match the export.`));info.append(item);
    }
    byId('protocol-details').textContent=JSON.stringify(this.result?.protocol||{version:GAUNTLET_VERSION,note:'Scores are provisional. Full runs share command ladders and scoring thresholds; each export retains its own native XML and actuator settings. Diagnostic runs do not rank.'},null,2);
  }
}
