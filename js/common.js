/* shared scripts for every page (needs a page-level const D before it loads) */
/* ---------- GALLERIES + LIGHTBOX ---------- */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
function fill(el,key){const L=D[key],n=L.length,p=el.classList.contains('p');
  el.innerHTML=L.map(([f,c],i)=>{let w='';if(!p){if(n===1)w='w6';else if(n%3===2&&i>=n-2)w='w3';else if(n%3===1&&n>=4&&i>=n-4)w='w3'}
  return `<figure class="${w}${/plan/.test(f)?' fit':''}" data-i="${i}" tabindex="0"><img src="img/${f}.webp" alt="${c}" loading="lazy" decoding="async"><figcaption>${c}</figcaption></figure>`}).join('');el.dataset.set=key}
$$('[data-set]').forEach(e=>{if(e.matches('.g')&&D[e.dataset.set])fill(e,e.dataset.set)});
$$('#qvt button').forEach(b=>b.onclick=()=>{$$('#qvt button').forEach(x=>x.setAttribute('aria-selected',x===b));fill($('#qvgrid'),b.dataset.set)});
const lb=$('#lb'),li=$('img',lb),lp=$('p',lb);let cur=[],ci=0;
function show(i){ci=(i+cur.length)%cur.length;const[f,c]=cur[ci];li.src=`img/${f}.webp`;li.alt=c;lp.textContent=c}
function open(k,i){cur=D[k];lb.classList.add('on');show(i);$('.c',lb).focus()}
const close=()=>lb.classList.remove('on');
document.addEventListener('click',e=>{const f=e.target.closest('figure[data-i]');if(f)open(f.parentElement.dataset.set,+f.dataset.i)});
document.addEventListener('keydown',e=>{
  if(!lb.classList.contains('on')){if(e.key==='Enter'){const f=document.activeElement;if(f.matches&&f.matches('figure[data-i]'))f.click()}return}
  if(e.key==='Escape')close();if(e.key==='ArrowRight')show(ci+1);if(e.key==='ArrowLeft')show(ci-1)});
$('.c',lb).onclick=close;$('.p',lb).onclick=()=>show(ci-1);$('.n',lb).onclick=()=>show(ci+1);
lb.onclick=e=>{if(e.target===lb)close()};


/* ---------- shared: nav, reveals, counters, parallax, stack, page transitions ---------- */
(function(){
  const calm=matchMedia('(prefers-reduced-motion:reduce)').matches,root=document.documentElement;
  const nav=$('#nav'),prog=$('#prog'),L=$('#links'),bg=$('#burger');
  const close=()=>{L.classList.remove('open');bg.setAttribute('aria-expanded','false');nav.classList.remove('mo')};
  bg.onclick=()=>{const o=L.classList.toggle('open');bg.setAttribute('aria-expanded',o);nav.classList.toggle('mo',o)};
  L.addEventListener('click',e=>{if(e.target.closest('a'))close()});
  addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  /* reveals + counters */
  const fmt=(v,d)=>v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
  function count(el){const to=parseFloat(el.dataset.count),d=+el.dataset.dec||0,pre=el.dataset.pre||'',suf=el.dataset.suf||'';
    if(calm){el.textContent=pre+fmt(to,d)+suf;return}
    const t0=performance.now(),D=1700;(function f(t){const k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,4);el.textContent=pre+fmt(to*e,d)+suf;if(k<1)requestAnimationFrame(f)})(t0)}
  const rv=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add('in');$$('[data-count]',e.target).forEach(count);if(e.target.dataset.count)count(e.target);rv.unobserve(e.target)}),{threshold:.14,rootMargin:'0px 0px -5% 0px'});
  $$('[data-r],[data-count]').forEach(el=>{if(calm){el.classList.add('in');if(el.dataset.count)count(el)}else rv.observe(el)});
  /* parallax + stack + progress, one rAF-throttled scroll handler */
  const par=$$('[data-par]'),stk=$$('.stk-s'),vh=()=>innerHeight;let tick=false;
  function frame(){tick=false;const y=scrollY,m=root.scrollHeight-innerHeight,h=vh();
    nav.classList.toggle('s',y>40);prog.style.width=(m>0?y/m*100:0)+'%';
    if(!calm){for(const el of par){const r=el.getBoundingClientRect();if(r.bottom<-100||r.top>h+100)continue;el.style.setProperty('--py',(((r.top+r.height/2-h/2)/h)*-26).toFixed(1)+'px')}
      stk.forEach((w,i)=>{const n=stk[i+1];if(!n)return;const c=w.firstElementChild,t=Math.max(0,Math.min(1,(h-n.getBoundingClientRect().top)/(h*.75)));c.style.transform=`scale(${1-.06*t})`;c.style.filter=`brightness(${1-.4*t})`})}}
  const req=()=>{if(!tick){tick=true;requestAnimationFrame(frame)}};
  addEventListener('scroll',req,{passive:true});addEventListener('resize',req);frame();
  /* page transitions: purple wipe, then navigate */
  const pt=document.createElement('div');pt.className='pt';document.body.appendChild(pt);
  document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||calm||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||a.target==='_blank')return;
    const h=a.getAttribute('href');if(!/^[\w-]+\.html(#.*)?$/.test(h))return;e.preventDefault();pt.classList.add('go');setTimeout(()=>{location.href=h},420)});
  addEventListener('pageshow',e=>{if(e.persisted)pt.classList.remove('go')});
})();

/* smooth scrolling (wheel + anchor links); native momentum is kept on touch screens */
(function(){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches||matchMedia('(pointer:coarse)').matches)return;
  const root=document.documentElement;root.classList.add('sm');
  let target=scrollY,cur=scrollY,run=false,lt=0,ease=9;
  const max=()=>Math.max(0,root.scrollHeight-innerHeight),clampY=v=>Math.max(0,Math.min(max(),v));
  function tick(now){const dt=Math.min(.05,(now-lt)/1000||.016);lt=now;
    cur+=(target-cur)*(1-Math.exp(-dt*ease));
    if(Math.abs(target-cur)<.4){cur=target;run=false}
    scrollTo(0,cur);if(run)requestAnimationFrame(tick)}
  function go(y,e){target=clampY(y);ease=e||9;if(!run){cur=scrollY;run=true;lt=performance.now();requestAnimationFrame(tick)}}
  addEventListener('wheel',e=>{
    if(e.ctrlKey||e.defaultPrevented||e.target.closest('.stage,.lb,.rl,.gchat'))return;
    e.preventDefault();if(!run)target=scrollY;
    go(target+e.deltaY*(e.deltaMode===1?34:e.deltaMode===2?innerHeight:1),9)},{passive:false});
  addEventListener('scroll',()=>{if(!run){target=cur=scrollY}},{passive:true});
  document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;
    const h=a.getAttribute('href'),el=h==='#'||h==='#top'?null:document.querySelector(h);if(h!=='#top'&&h!=='#'&&!el)return;
    e.preventDefault();go(el?el.getBoundingClientRect().top+scrollY-56:0,5);history.replaceState(null,'',h)});
})();

/* 3D tilt on tiles */
if(matchMedia('(hover:hover)').matches){
  document.addEventListener('pointermove',e=>{const f=e.target.closest&&e.target.closest('.g figure,.slides figure');if(!f)return;const r=f.getBoundingClientRect();
    f.style.setProperty('--ry',((e.clientX-r.left)/r.width-.5)*9+'deg');f.style.setProperty('--rx',-((e.clientY-r.top)/r.height-.5)*9+'deg')});
  document.addEventListener('pointerout',e=>{const f=e.target.closest&&e.target.closest('.g figure,.slides figure');if(f){f.style.setProperty('--rx','0deg');f.style.setProperty('--ry','0deg')}})}

/* 3D emblems: wireframe solids drawn with raw WebGL, driven by scroll + pointer */
const G3={
 sphere(){const o=[],pl=(a)=>{for(let i=0;i<a.length-1;i++)o.push(...a[i],...a[i+1])};
  for(const la of[-60,-30,0,30,60]){const y=Math.sin(la*Math.PI/180),r=Math.cos(la*Math.PI/180),a=[];for(let i=0;i<=64;i++){const t=i/64*6.2832;a.push([r*Math.cos(t),y,r*Math.sin(t)])}pl(a)}
  for(let k=0;k<12;k++){const t=k/12*3.1416,a=[];for(let i=0;i<=48;i++){const l=-1.5708+i/48*3.1416;a.push([Math.cos(l)*Math.cos(t),Math.sin(l),Math.cos(l)*Math.sin(t)])}pl(a);const b=a.map(v=>[-v[0],v[1],-v[2]]);pl(b)}return o},
 cube(){const o=[],h=.6,T=[-1,-1/3,1/3,1].map(x=>x*h);
  for(let a=0;a<3;a++)for(const sg of[-1,1])for(let b=0;b<3;b++){if(b===a)continue;const c=3-a-b;for(const t of T){const v=[0,0,0],w=[0,0,0];v[a]=w[a]=sg*h;v[c]=w[c]=t;v[b]=-h;w[b]=h;o.push(...v,...w)}}return o},
 ico(){const f=(1+Math.sqrt(5))/2,V=[];for(const a of[-1,1])for(const b of[-f,f]){V.push([0,a,b],[a,b,0],[b,0,a])}
  const n=V.map(v=>{const l=Math.hypot(...v);return v.map(x=>x/l)}),o=[];let m=9;
  for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)m=Math.min(m,Math.hypot(...n[i].map((x,k)=>x-n[j][k])));
  for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)if(Math.hypot(...n[i].map((x,k)=>x-n[j][k]))<m*1.01){o.push(...n[i],...n[j]);o.push(...n[i].map(x=>x*.45),...n[j].map(x=>x*.45))}return o},
 torus(){const o=[],R=.7,r=.3,P=(u,v)=>[(R+r*Math.cos(v))*Math.cos(u),r*Math.sin(v),(R+r*Math.cos(v))*Math.sin(u)];
  for(let i=0;i<24;i++)for(let j=0;j<32;j++)o.push(...P(i/24*6.2832,j/32*6.2832),...P(i/24*6.2832,(j+1)/32*6.2832));
  for(let j=0;j<10;j++)for(let i=0;i<64;i++)o.push(...P(i/64*6.2832,j/10*6.2832),...P((i+1)/64*6.2832,j/10*6.2832));return o}};
let mx=0,my=0;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5});
const EM=$$('canvas.em').map(cv=>{
  const gl=cv.getContext('webgl',{alpha:true});if(!gl)return null;
  const sh=(t,c)=>{const h=gl.createShader(t);gl.shaderSource(h,c);gl.compileShader(h);return h},pg=gl.createProgram();
  gl.attachShader(pg,sh(gl.VERTEX_SHADER,'attribute vec3 a;uniform float y,p;varying float d;void main(){float c=cos(y),s=sin(y),cp=cos(p),sp=sin(p);vec3 q=vec3(c*a.x+s*a.z,a.y,-s*a.x+c*a.z);q=vec3(q.x,cp*q.y-sp*q.z,sp*q.y+cp*q.z);d=q.z*.5+.5;gl_Position=vec4(q.xy,0.,(4.-q.z)/2.4);gl_PointSize=1.5+3.5*d;}'));
  gl.attachShader(pg,sh(gl.FRAGMENT_SHADER,'precision mediump float;varying float d;void main(){vec3 c=mix(vec3(.38,.2,.85),vec3(.86,.78,1.),d);float al=.22+.78*d;gl_FragColor=vec4(c*al,al);}'));
  gl.linkProgram(pg);gl.useProgram(pg);const V=new Float32Array(G3[cv.dataset.k]());
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,V,gl.STATIC_DRAW);
  const a=gl.getAttribLocation(pg,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  const e={cv,gl,pg,n:V.length/3,vis:false,seed:Math.random()*6};new IntersectionObserver(x=>e.vis=x[0].isIntersecting).observe(cv);return e}).filter(Boolean);
const calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
(function emLoop(t){requestAnimationFrame(emLoop);
  for(const e of EM){if(!e.vis)continue;const{cv,gl,pg}=e,d=Math.min(devicePixelRatio||1,2),w=Math.round(cv.clientWidth*d);
    if(cv.width!==w){cv.width=cv.height=w}gl.viewport(0,0,w,w);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    const r=cv.getBoundingClientRect(),sc=r.top/innerHeight;
    gl.uniform1f(gl.getUniformLocation(pg,'y'),e.seed+(calm?0:t*.0004)+sc*2.4+mx*.9);
    gl.uniform1f(gl.getUniformLocation(pg,'p'),.5+sc*.5+my*.5);
    gl.drawArrays(gl.LINES,0,e.n);gl.drawArrays(gl.POINTS,0,e.n)}})(0);
