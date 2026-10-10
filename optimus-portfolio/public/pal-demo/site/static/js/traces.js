// Show recorded evidence or a live rolling window without changing measurements.
const NS='http://www.w3.org/2000/svg';
function node(svg,tag,attributes,text) {
  const el=document.createElementNS(NS,tag);
  Object.entries(attributes).forEach(([key,value])=>el.setAttribute(key,value));
  if(text!==undefined)el.textContent=text;
  svg.append(el);return el;
}
function setup(svg,height) {
  const width=Math.max(260,svg.getBoundingClientRect().width || 420);
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.height=`${height}px`;svg.replaceChildren();
  return width;
}
const label=(svg,x,y,text,anchor='start')=>node(svg,'text',{x,y,'text-anchor':anchor,fill:'#687383','font-size':11},text);
function line(svg,points,color,dashed=false) {
  return node(svg,'polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...(dashed?{'stroke-dasharray':'4 3'}:{})});
}
export function renderTrace(trace=[],selected=null,options={}) {
  drawVelocities(document.getElementById('velocity-chart'),trace,selected,options);
  drawPath(document.getElementById('path-chart'),trace,selected,options);
}
function empty(svg,width,options) {label(svg,width/2,(options.height||270)/2,options.emptyMessage ?? 'Run or select a round to inspect its trace.','middle');}
function drawVelocities(svg,trace,selected,options) {
  const height=options.height||270,width=setup(svg,height),left=54,right=width-12;
  if(!trace.length)return empty(svg,width,options);
  const start=trace[0].t,end=trace.at(-1).t,duration=end-start;
  const x=t=>duration>0?left+(t-start)/duration*(right-left):(left+right)/2;
  for(let axis=0;axis<3;axis++) {
    const band=(height-39)/3,top=22+axis*band,bottom=top+band-25;
    const max=Math.max(.2,...trace.map(p=>Math.max(Math.abs(p.velocity[axis]),Math.abs(p.command[axis]),Math.abs((p.requestedCommand||p.command)[axis]),Math.abs((p.filteredVelocity||p.velocity)[axis]))))*1.12;
    const y=value=>bottom-(value+max)/(2*max)*(bottom-top);
    const color=['#087f73','#436bc4','#9753b8'][axis];
    label(svg,4,top+8,['vx · m/s','vy · m/s','yaw · rad/s'][axis]);
    for(const tick of [-max,0,max]){node(svg,'line',{x1:left,x2:right,y1:y(tick),y2:y(tick),stroke:'#e6e9ee','stroke-width':1});label(svg,left-4,y(tick)+3,tick.toFixed(1),'end');}
    if(trace.some(p=>p.requestedCommand&&Math.abs(p.requestedCommand[axis]-p.command[axis])>1e-8))line(svg,trace.map(p=>[x(p.t),y((p.requestedCommand||p.command)[axis])]),'#596359',true).setAttribute('stroke-dasharray','1 4');
    line(svg,trace.map(p=>[x(p.t),y(p.command[axis])]),color,true);
    line(svg,trace.map(p=>[x(p.t),y(p.velocity[axis])]),color).setAttribute('opacity','.3');
    // Live monitoring always shows the smoothed response, including after a
    // zero command. Recorded evidence retains its raw-at-zero scoring display.
    line(svg,trace.map(p=>[x(p.t),y((options.mode==='live'||p.command.some(v=>v!==0)?p.filteredVelocity||p.velocity:p.velocity)[axis])]),color);
    if(selected!==null && trace[selected])node(svg,'line',{x1:x(trace[selected].t),x2:x(trace[selected].t),y1:top,y2:bottom,stroke:'#273446','stroke-width':1});
  }
  if(duration>0)[0,.5,1].forEach(f=>{const time=start+duration*f;label(svg,x(time),height-16,`${time.toFixed(1)}s`,f===0?'start':f===1?'end':'middle');});
  else label(svg,x(start),height-16,`${start.toFixed(1)}s`,'middle');
}
function drawPath(svg,trace,selected,options) {
  const height=options.height||270,width=setup(svg,height);
  if(!trace.length)return empty(svg,width,options);
  const target=[[trace[0].position[0],trace[0].position[1]]];
  let yaw=trace[0].yaw;
  for(let i=1;i<trace.length;i++) {
    const dt=Math.max(0,trace[i].t-trace[i-1].t),cmd=trace[i-1].command,prev=target.at(-1);
    const middleYaw=yaw+cmd[2]*dt/2;
    target.push([prev[0]+(cmd[0]*Math.cos(middleYaw)-cmd[1]*Math.sin(middleYaw))*dt,prev[1]+(cmd[0]*Math.sin(middleYaw)+cmd[1]*Math.cos(middleYaw))*dt]);
    yaw+=cmd[2]*dt;
  }
  const actual=trace.map(p=>p.position.slice(0,2)),all=[...target,...actual];
  const minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2,span=Math.max(.5,maxX-minX,maxY-minY)*1.25;
  const size=Math.min(width-78,height-70),left=(width-size)/2,top=28;
  const x=v=>left+size/2+(v-cx)/span*size,y=v=>top+size/2-(v-cy)/span*size;
  node(svg,'rect',{x:left,y:top,width:size,height:size,fill:'none',stroke:'#e6e9ee'});
  for(const f of [-.5,0,.5]){
    const xx=x(cx+span*f),yy=y(cy+span*f);
    node(svg,'line',{x1:xx,x2:xx,y1:top,y2:top+size,stroke:'#eef0f3'});
    node(svg,'line',{x1:left,x2:left+size,y1:yy,y2:yy,stroke:'#eef0f3'});
    label(svg,xx,top+size+15,(cx+span*f).toFixed(1),'middle');
    label(svg,left-6,yy+3,(cy+span*f).toFixed(1),'end');
  }
  line(svg,target.map(p=>[x(p[0]),y(p[1])]),'#8d97a5',true);
  line(svg,actual.map(p=>[x(p[0]),y(p[1])]),'#087f73');
  const i=selected===null?actual.length-1:selected,p=actual[i];
  if(p)node(svg,'circle',{cx:x(p[0]),cy:y(p[1]),r:4,fill:'#087f73'});
  label(svg,width/2,height-6,'World x (m) · integrated command path','middle');
  label(svg,4,14,'World y (m)');
}
