/* Cute 3D genie guide: procedural toon-shaded character, scroll-driven. No dependencies. */
(function(){
const cv=document.getElementById('gc'),btn=document.getElementById('gbtn'),bub=document.getElementById('gb'),tog=document.getElementById('gtog');
if(!cv)return;
const gl=cv.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:true});
if(!gl){cv.remove();btn.remove();tog.remove();return}
const calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
/* ---------- matrices (column-major) ---------- */
const mul=(a,b)=>{const o=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o};
const X=(...m)=>m.reduce(mul);
const T=(x,y,z)=>[1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1];
const S=(x,y,z)=>[x,0,0,0,0,y,0,0,0,0,z===undefined?x:z,0,0,0,0,1];
const Rx=a=>{const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]};
const Ry=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]};
const Rz=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]};
/* ---------- geometry: interleaved pos(3) nrm(3) t(1) ---------- */
function build(P,I){ // auto-fix winding so triangles face along their vertex normals
  let sgn=0;for(let i=0;i<I.length;i+=3){const a=I[i]*7,b=I[i+1]*7,c=I[i+2]*7;
    const e1=[P[b]-P[a],P[b+1]-P[a+1],P[b+2]-P[a+2]],e2=[P[c]-P[a],P[c+1]-P[a+1],P[c+2]-P[a+2]];
    const n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
    sgn+=n[0]*P[a+3]+n[1]*P[a+4]+n[2]*P[a+5]}
  if(sgn<0)for(let i=0;i<I.length;i+=3){const t=I[i+1];I[i+1]=I[i+2];I[i+2]=t}
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(P),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,28,12);
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.FLOAT,false,28,24);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(I),gl.STATIC_DRAW);
  gl.bindVertexArray(null);return{vao,n:I.length}}
function grid(rows,cols,f){const P=[],I=[];for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++)P.push(...f(i/rows,j/cols));
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;I.push(a,a+1,b,b,a+1,b+1)}return build(P,I)}
const sphere=(la,lo)=>grid(la,lo,(u,v)=>{const t=u*Math.PI,a=v*6.2832,x=Math.sin(t)*Math.cos(a),y=Math.cos(t),z=Math.sin(t)*Math.sin(a);return[x,y,z,x,y,z,0]});
const torus=(n,m)=>grid(n,m,(u,v)=>{const a=u*6.2832,b=v*6.2832,r=.25,cx=Math.cos(a),sz=Math.sin(a);return[(1+r*Math.cos(b))*cx,r*Math.sin(b),(1+r*Math.cos(b))*sz,Math.cos(b)*cx,Math.sin(b),Math.cos(b)*sz,0]});
function tail(){const n=34,m=22,L=2.05,c=[],th=[];let x=0,y=0;
  for(let i=0;i<=n;i++){const t=i/n,a=-Math.PI/2+2.7*Math.pow(t,2.3);th.push(a);c.push([x,y]);x+=L/n*Math.cos(a);y+=L/n*Math.sin(a)}
  return grid(n,m,(u,v)=>{const i=Math.round(u*n),a=th[i],r=.36*Math.pow(1-u,.72)+.035,ph=v*6.2832,Nx=-Math.sin(a),Ny=Math.cos(a),cs=Math.cos(ph),sn=Math.sin(ph);
    return[c[i][0]+r*cs*Nx,c[i][1]+r*cs*Ny,r*sn,cs*Nx,cs*Ny,sn,u]})}
const G={s:sphere(18,28),sl:sphere(8,12),t:torus(28,12),tail:tail()};
/* ---------- shaders ---------- */
const mk=(t,s)=>{const h=gl.createShader(t);gl.shaderSource(h,s);gl.compileShader(h);if(!gl.getShaderParameter(h,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(h));return h};
const prog=(v,f)=>{const p=gl.createProgram();gl.attachShader(p,mk(gl.VERTEX_SHADER,v));gl.attachShader(p,mk(gl.FRAGMENT_SHADER,f));gl.bindAttribLocation(p,0,'a_p');gl.bindAttribLocation(p,1,'a_n');gl.bindAttribLocation(p,2,'a_t');gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p};
let pg,pp;
try{
pg=prog(`#version 300 es
in vec3 a_p;in vec3 a_n;in float a_t;uniform mat4 u_M,u_VP;uniform float u_out,u_time,u_tail,u_vel,u_curl;out vec3 v_n;out float v_t;
void main(){vec3 p=a_p;
 if(u_tail>.5){float t=a_t;p.x+=sin(t*4.2-u_time*2.6)*.15*t*(.55+u_curl);p.z+=cos(t*3.-u_time*2.1)*.08*t;p.x-=u_vel*t*t*.4;}
 vec4 w=u_M*vec4(p,1.);vec3 n=normalize(transpose(inverse(mat3(u_M)))*a_n);w.xyz+=n*u_out;v_n=n;v_t=a_t;gl_Position=u_VP*w;}`,
`#version 300 es
precision highp float;in vec3 v_n;in float v_t;uniform vec3 u_c,u_oc;uniform float u_mode,u_gloss,u_tail;out vec4 o;
void main(){if(u_mode>1.5){o=vec4(u_oc,1.);return;}
 vec3 base=u_c;if(u_tail>.5)base=mix(base,vec3(.82,.76,1.),v_t*v_t*.8);
 if(u_mode>.5){o=vec4(base,1.);return;}
 vec3 n=normalize(v_n),L=normalize(vec3(-.45,.7,.7));float d=dot(n,L);
 float b=d>.1?1.:.78;vec3 col=base*b;if(b<.9)col+=vec3(.06,.0,.14);
 col+=smoothstep(.6,.95,1.-n.z)*vec3(.55,.45,.9)*.18;
 vec3 h=normalize(L+vec3(0.,0.,1.));col=mix(col,vec3(1.),step(.94,pow(max(dot(n,h),0.),30.))*u_gloss*.8);
 o=vec4(col,1.);}`);
pp=prog(`#version 300 es
in vec3 a_p;in vec3 a_n;uniform vec2 u_res;uniform float u_dpr;out float v_l;out float v_h;
void main(){vec2 p=a_p.xy;gl_Position=vec4(p.x/u_res.x*2.-1.,1.-p.y/u_res.y*2.,0.,1.);gl_PointSize=a_n.x*u_dpr*a_n.y;v_l=a_n.y;v_h=a_n.z;}`,
`#version 300 es
precision highp float;in float v_l;in float v_h;out vec4 o;
void main(){vec2 q=gl_PointCoord*2.-1.;float s=exp(-abs(q.x*q.y)*28.)*(1.-length(q)*.85);s=max(s,0.)*v_l;
 vec3 c=v_h<.33?vec3(1.,.82,.3):v_h<.66?vec3(.78,.62,1.):vec3(1.);o=vec4(c*s,s);}`);
}catch(e){console.warn('genie disabled',e);cv.remove();btn.remove();tog.remove();return}
const U=(p,n)=>gl.getUniformLocation(p,n),u={};['u_M','u_VP','u_out','u_time','u_tail','u_vel','u_curl','u_c','u_oc','u_mode','u_gloss'].forEach(k=>u[k]=U(pg,k));
const pu={res:U(pp,'u_res'),dpr:U(pp,'u_dpr')};
const pbuf=gl.createBuffer(),pva=gl.createVertexArray();gl.bindVertexArray(pva);gl.bindBuffer(gl.ARRAY_BUFFER,pbuf);
gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);gl.bindVertexArray(null);
/* ---------- palette ---------- */
const SKIN=[.56,.5,1],SKIN2=[.72,.66,1],VEST=[.36,.13,.72],GOLD=[1,.78,.24],WHITE=[.97,.95,1],PINK=[1,.35,.65],CHEEK=[1,.55,.78],DARK=[.2,.09,.33],OUT=[.1,.05,.2];
/* ---------- state ---------- */
const st={cx:0,cy:0,x:-1,vel:0,hv:0,lastX:0,lastY:scrollY,spin:-1,wave:0,mx:0,my:0,lx:0,ly:0,blink:0,nextBlink:2,sec:-1,hid:false,on:true};
try{st.on=localStorage.getItem('genie')!=='off'}catch(e){}
const parts=[];
function P(g,M,c,o){parts.push({g,M,c,o:o||{}})}
function pose(t){
  parts.length=0;
  const sp=Math.min(1,Math.abs(st.vel)/1.2),yaw=st.yawAdd+(st.spin>=0?easeSpin(st.spin):0),root=X(Ry(yaw),Rz(st.roll),Rx(st.pitch));
  const R=X(T(0,Math.sin(t*1.8)*.05,0),root),mix=(a,b,k)=>a+(b-a)*k;
  P(G.tail,X(R,T(0,.1,0)),SKIN,{tail:1});
  P(G.s,X(R,T(0,.3,0),S(.46,.44,.4)),SKIN);
  // nub arms
  const waving=!calm&&sp<.1&&((t%7)>4.6),wv=waving?Math.sin(t*9)*.3:0;
  const arm=(s,a)=>{const M=X(R,T(s*.43,.42,0),Rz(s*a));P(G.s,X(M,T(0,-.17,0),S(.1,.2,.1)),SKIN);P(G.s,X(M,T(0,-.36,0),S(.11)),SKIN)};
  arm(1,mix(waving?2.4+wv:.5,1.1,sp));arm(-1,mix(.5,1.1,sp));
  // head
  const Hm=X(R,T(0,.72,0),Ry(st.lx*.4),Rx(-st.ly*.25),T(0,-.72,0));
  P(G.s,X(Hm,T(0,1.05,0),S(.66,.6,.6)),SKIN);
  const e=1-st.blink*.92,ex=st.lx*.03,ey=st.ly*.025;
  for(const s of[-1,1]){
    P(G.s,X(Hm,T(s*.22+ex,1.08-ey,.55),S(.085,.12*e,.05)),DARK,{noOut:1});
    P(G.s,X(Hm,T(s*.22+ex+.026,1.12-ey,.6),S(.028,.034*e,.02)),WHITE,{unlit:1,noOut:1});
    P(G.s,X(Hm,T(s*.38,.92,.47),S(.09,.055,.03)),CHEEK,{noOut:1});
  }
  P(G.s,X(Hm,T(0,.88,.575),S(.07,.035,.025)),DARK,{noOut:1});
  P(G.s,X(Hm,T(0,1.42,.5),S(.055,.075,.03)),GOLD,{gloss:1,noOut:1});
  P(G.s,X(Hm,T(0,1.72,0),S(.13,.16,.13)),SKIN);
}
const easeSpin=k=>{const x=Math.min(1,k);return(1-Math.pow(1-x,3))*6.2832};
/* ---------- particles ---------- */
const pts=[];
function emit(x,y,n,burst){for(let i=0;i<n&&pts.length<120;i++){const a=Math.random()*6.28,sp=burst?(40+Math.random()*160):(10+Math.random()*30);
  pts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(burst?0:10),l:1,d:.7+Math.random()*.8,s:7+Math.random()*10,h:Math.random()})}}
/* ---------- layout & scroll path ---------- */
let secs=[];const CFG=window.GENIE_CFG||{},ids=CFG.ids||['top','worlds','spaces','objects','origin','contact'];
const SAY=CFG.say||{worlds:'Psst! Drag the 360° view and look around.',spaces:'Pick a floor, any floor!',objects:'Ooh, shiny things!',origin:'Aww, my favourite: the donut.',contact:'Make a wish… then email Waseem!'};
function layout(){secs=ids.map(i=>document.getElementById(i)).filter(Boolean)}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sm=x=>x*x*(3-2*x);
let vw=innerWidth,vh=innerHeight,dpr=1;
function size(){vw=innerWidth;vh=innerHeight;dpr=Math.min(devicePixelRatio||1,2,Math.sqrt(2.6e6/(vw*vh)));cv.width=Math.round(vw*dpr);cv.height=Math.round(vh*dpr);layout()}
addEventListener('resize',size);size();
addEventListener('load',layout);
function targetX(S0){ // x as a smooth function of scroll: alternate sides per chapter
  const mid=scrollY+vh*.5,pad=S0*1.25,L=pad,Rr=vw-pad,sides=secs.map((_,i)=>i===secs.length-1||i%2===0?Rr:L);
  if(vw<700)return vw-pad*.9;
  const cs=secs.map(s=>{const r=s.getBoundingClientRect();return scrollY+r.top+r.height/2});
  if(!cs.length)return Rr;
  if(mid<=cs[0])return sides[0];if(mid>=cs[cs.length-1])return sides[cs.length-1];
  for(let i=0;i<cs.length-1;i++)if(mid<cs[i+1]){const k=sm((mid-cs[i])/(cs[i+1]-cs[i]));return sides[i]+(sides[i+1]-sides[i])*k}
  return Rr}
function activeSec(){const mid=vh*.5;for(const s of secs){const r=s.getBoundingClientRect();if(r.top<=mid&&r.bottom>mid)return s.id}return null}
/* ---------- speech ---------- */
let bt=0;function say(msg,ms){if(document.body.classList.contains('chat-open'))return;bub.textContent=msg;bub.classList.add('on');clearTimeout(bt);bt=setTimeout(()=>bub.classList.remove('on'),ms||3600)}
btn.onclick=()=>{st.spin=0;emit(st.cx,st.cy,22,true);bub.classList.remove('on');document.dispatchEvent(new CustomEvent('genie:open'))};
addEventListener('pointermove',e=>{st.mx=e.clientX;st.my=e.clientY});
function setOn(v){st.on=v;cv.style.display=btn.style.display=bub.style.display=v?'':'none';tog.textContent=v?'Genie: on':'Genie: off';tog.setAttribute('aria-pressed',v);try{localStorage.setItem('genie',v?'on':'off')}catch(e){}}
tog.onclick=()=>setOn(!st.on);setOn(st.on);
setTimeout(()=>st.on&&CFG.hi!==''&&say(CFG.hi||'Hi! I’m your genie guide. Scroll on!',4200),1600);
/* ---------- main loop ---------- */
let last=performance.now(),t0=last;st.yawAdd=0;st.roll=0;st.pitch=0;
function frame(now){requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-last)/1000||.016);last=now;const t=(now-t0)/1000;
  if(!st.on||document.body.classList.contains('nogenie')||document.hidden){return}
  const S0=vw<700?36:52;
  // scroll velocity (screens/sec, smoothed)
  const dy=scrollY-st.lastY;st.lastY=scrollY;st.vel+=((calm?0:dy/Math.max(dt,.001)/vh)-st.vel)*clamp(dt*7,0,1);
  const tx=calm?vw-S0*1.3:targetX(S0);if(st.x<0)st.x=tx;const px=st.x;st.x+=(tx-st.x)*clamp(dt*4.5,0,1);const hv=(st.x-px)/Math.max(dt,.001);
  st.hv+=(hv-st.hv)*clamp(dt*6,0,1);
  const cy0=vh*.56-clamp(st.vel,-1.5,1.5)*vh*.07+(calm?0:Math.sin(t*1.8)*7);
  st.cx=st.x;st.cy=cy0;
  st.yawAdd=clamp(st.hv/900,-.7,.7);st.roll=clamp(-st.hv/2400,-.25,.25)+clamp(st.vel*.04,-.1,.1);st.pitch=clamp(st.vel*.22,-.35,.45);
  if(st.spin>=0){st.spin+=dt/1.1;if(st.spin>1){st.spin=-1}}
  st.lx+=(clamp((st.mx-st.cx)/(vw*.4),-1,1)-st.lx)*clamp(dt*6,0,1);st.ly+=(clamp((st.my-st.cy)/(vh*.4),-1,1)-st.ly)*clamp(dt*6,0,1);
  st.nextBlink-=dt;if(st.nextBlink<0){st.blink=1;st.nextBlink=2.5+Math.random()*3}if(st.blink>0)st.blink=Math.max(0,st.blink-dt*7);
  const a=activeSec();if(a!==st.sec){st.sec=a;if(a&&SAY[a])say(SAY[a])}
  // particles
  if(!calm){const rate=1.2+Math.abs(st.vel)*16;if(Math.random()<rate*dt)emit(st.cx+(Math.random()-.5)*S0*.8,st.cy+S0*(.5+Math.random()*1.1),1,false)}
  for(let i=pts.length-1;i>=0;i--){const p=pts[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97;p.l-=dt/p.d;if(p.l<=0)pts.splice(i,1)}
  // draw
  gl.viewport(0,0,cv.width,cv.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const sc=S0*(1+(calm?0:Math.sin(t*3)*.008));
  const VP=[2*sc/vw,0,0,0,0,2*sc/vh,0,0,0,0,-.16,0,2*st.cx/vw-1,1-2*st.cy/vh,0,1];
  pose(t);
  gl.useProgram(pg);gl.uniformMatrix4fv(u.u_VP,false,VP);gl.uniform1f(u.u_time,t);gl.uniform1f(u.u_vel,clamp(st.hv/700+st.vel*.8,-1,1));gl.uniform1f(u.u_curl,Math.min(1,Math.abs(st.vel)));gl.uniform3fv(u.u_oc,OUT);
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.disable(gl.BLEND);
  for(const pass of[2,0]){gl.cullFace(pass===2?gl.FRONT:gl.BACK);
    for(const p of parts){if(pass===2&&p.o.noOut)continue;
      gl.uniformMatrix4fv(u.u_M,false,p.M);gl.uniform1f(u.u_out,pass===2?.022:0);gl.uniform1f(u.u_tail,p.o.tail?1:0);gl.uniform3fv(u.u_c,p.c);
      gl.uniform1f(u.u_mode,pass===2?2:(p.o.unlit?1:0));gl.uniform1f(u.u_gloss,p.o.gloss?1:0);
      gl.bindVertexArray(p.g.vao);gl.drawElements(gl.TRIANGLES,p.g.n,gl.UNSIGNED_SHORT,0)}}
  // sparkles
  if(pts.length){gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    const d=new Float32Array(pts.length*6);pts.forEach((p,i)=>d.set([p.x,p.y,0,p.s,p.l,p.h],i*6));
    gl.useProgram(pp);gl.uniform2f(pu.res,vw,vh);gl.uniform1f(pu.dpr,dpr);gl.bindVertexArray(pva);gl.bindBuffer(gl.ARRAY_BUFFER,pbuf);gl.bufferData(gl.ARRAY_BUFFER,d,gl.DYNAMIC_DRAW);gl.drawArrays(gl.POINTS,0,pts.length)}
  gl.bindVertexArray(null);
  // DOM: hit box + bubble
  btn.style.cssText=`left:${st.cx-S0*.75}px;top:${st.cy-S0*2.05}px;width:${S0*1.5}px;height:${S0*2.5}px`;
  const right=st.cx>vw*.5;if(right){bub.style.left='auto';bub.style.right=Math.max(8,vw-st.cx+S0*.5)+'px'}else{bub.style.right='auto';bub.style.left=Math.max(8,st.cx-S0*.5)+'px'}bub.style.top=(st.cy-S0*2.5)+'px';bub.classList.toggle('r',right);
}
requestAnimationFrame(frame);
window.__genie={st,say};
})();
