/* Video portfolio: slider hero, filters, hover previews, cinematic player, explainer theater (needs window.VIDS) */
(function(){
const V=window.VIDS,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const calm=matchMedia('(prefers-reduced-motion:reduce)').matches,fine=matchMedia('(hover:hover)').matches;
const mmss=s=>{s=Math.round(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const shape=d=>d.w>d.h*1.3?'landscape':d.h>d.w*1.2?'vertical':'square';
const WA=t=>'https://wa.me/923250111158?text='+encodeURIComponent(t);
let mOpen=false;
/* ---------- slider ---------- */
const vs=q('.vs'),sl=qa('.vsl',vs),bgs=qa('.vs-bg i',vs),dots=qa('.vs-dots button',vs),cnt=q('#vsc b');
let cur=0,prog=0,hover=false,seen=true,DUR=3600;
const lazy=v=>{if(v&&!v.getAttribute('src'))v.src=v.dataset.src};
function sound(){const v=q('video',sl[cur]),b=q('.snd',sl[cur]);if(b&&v)b.textContent=v.muted?'Sound off':'Sound on'}
function show(n){n=(n+sl.length)%sl.length;if(n===cur)return;
  const old=sl[cur],ov=q('video',old);old.classList.remove('on');old.classList.add('out');ov&&ov.pause();setTimeout(()=>old.classList.remove('out'),450);
  cur=n;sl[cur].classList.add('on');bgs.forEach((b,i)=>b.classList.toggle('on',i===cur));
  dots.forEach((d,i)=>{d.classList.toggle('done',i<cur);d.firstElementChild.style.width=i<cur?'100%':'0'});
  prog=0;cnt.textContent=String(cur+1).padStart(2,'0');
  const v=q('video',sl[cur]);if(v&&!calm){lazy(v);v.muted=true;v.play().catch(()=>{})}sound()}
{const v=q('video',sl[0]);if(v&&!calm){lazy(v);v.play().catch(()=>{})}}
let last=performance.now();
(function loop(t){requestAnimationFrame(loop);const dt=Math.min(1,(t-last)/1000);last=t;
  if(calm||hover||!seen||mOpen||document.hidden)return;prog+=dt*1000/DUR;dots[cur].firstElementChild.style.width=Math.min(100,prog*100)+'%';if(prog>=1)show(cur+1)})(last);
q('#vsn').onclick=()=>show(cur+1);q('#vsp').onclick=()=>show(cur-1);
dots.forEach((d,i)=>d.onclick=()=>show(i));
new IntersectionObserver(e=>{seen=e[0].isIntersecting;const v=q('video',sl[cur]);if(!v||calm||mOpen)return;seen?v.play().catch(()=>{}):v.pause()}).observe(vs);
vs.addEventListener('pointerenter',()=>hover=true);vs.addEventListener('pointerleave',()=>{hover=false;vs.style.setProperty('--x','0')});
let sx=null;
vs.addEventListener('pointerdown',e=>{if(e.target.closest('button,a,video'))return;sx=e.clientX});
vs.addEventListener('pointerup',e=>{if(sx===null)return;const dx=e.clientX-sx;sx=null;if(Math.abs(dx)>60)show(cur+(dx<0?1:-1))});
addEventListener('keydown',e=>{if(mOpen||!seen||/input|textarea/i.test(e.target.tagName))return;if(e.key==='ArrowRight')show(cur+1);if(e.key==='ArrowLeft')show(cur-1)});
qa('.snd',vs).forEach(b=>b.onclick=()=>{const v=q('video',b.closest('.vsl'));v.muted=!v.muted;if(!v.muted){lazy(v);v.play().catch(()=>{})}b.textContent=v.muted?'Sound off':'Sound on'});
/* ---------- filters + grid ---------- */
const grid=q('#vgrid'),cards=qa('.vc',grid),chips=qa('.chips-f button');
function setFilter(c){chips.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.f===c)));let i=0;
  cards.forEach(cd=>{const on=c==='all'||cd.dataset.c===c;cd.classList.toggle('hide',!on);if(on){cd.style.animation='none';void cd.offsetWidth;cd.style.animation='';cd.style.animationDelay=(i++*.035)+'s'}})}
chips.forEach(b=>b.onclick=()=>setFilter(b.dataset.f));
qa('[data-filter]').forEach(a=>a.addEventListener('click',()=>setFilter(a.dataset.filter)));
/* hover preview */
let pv=null,pt=0;
function stopPrev(){clearTimeout(pt);if(pv){pv.remove();pv=null}}
cards.forEach(cd=>{
  cd.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse'||calm)return;pt=setTimeout(()=>{const d=V[cd.dataset.id],v=document.createElement('video');v.muted=true;v.loop=true;v.playsInline=true;v.src=d.src;v.play().catch(()=>{});const th=q('.vc-th',cd);th.insertBefore(v,q('.vc-p',th));pv=v},140)});
  cd.addEventListener('pointerleave',stopPrev);
  const open=()=>{stopPrev();openM(cd.dataset.id,qa('.vc:not(.hide)',grid).map(x=>x.dataset.id))};
  cd.addEventListener('click',open);cd.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
});
/* ---------- cinematic modal ---------- */
const vm=q('#vm'),mv=q('#mv'),box=q('.vm-v',vm);let list=[],li=0;
function fill(){const d=V[list[li]];box.style.setProperty('--ar',(d.w/d.h).toFixed(4));
  mv.poster=d.poster;mv.src=d.src;mv.muted=false;mv.play().catch(()=>{mv.muted=true;mv.play().catch(()=>{})});
  q('#mc').textContent=d.c;q('#mt').textContent=d.t;q('#mm').textContent=mmss(d.d)+' · '+shape(d)+' '+(d.k==='explainer'?'explainer':'reel');
  q('#mwa').href=WA(`Hi Waseem, I watched “${d.t}” (${d.c}) on your video portfolio and I’d like something similar.`)}
function openM(id,l){list=l&&l.length?l:[id];li=Math.max(0,list.indexOf(id));mOpen=true;vm.classList.add('on');document.body.classList.add('nogenie');
  const hv=q('video',sl[cur]);hv&&hv.pause();fill();q('.vm-x',vm).focus()}
function closeM(){if(!mOpen)return;vm.classList.remove('on');mv.pause();mv.removeAttribute('src');mv.load();mOpen=false;document.body.classList.remove('nogenie');
  const hv=q('video',sl[cur]);if(hv&&seen&&!calm)hv.play().catch(()=>{})}
const step=n=>{li=(li+n+list.length)%list.length;fill()};
q('.vm-x',vm).onclick=closeM;q('.vm-pv',vm).onclick=()=>step(-1);q('.vm-nx',vm).onclick=()=>step(1);
vm.addEventListener('click',e=>{if(e.target===vm||e.target===q('.vm-b',vm))closeM()});
addEventListener('keydown',e=>{if(!mOpen)return;if(e.key==='Escape')closeM();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1)});
qa('[data-play]').forEach(b=>b.onclick=()=>openM(b.dataset.play,[b.dataset.play]));
/* ---------- explainer theater ---------- */
const tv=q('#tv'),stage=q('.stage2'),post=q('.poster2'),plist=qa('.plist button');let ci=null;
function sel(id,go){const d=V[id];ci=id;tv.pause();tv.removeAttribute('src');tv.load();stage.classList.remove('playing');post.style.backgroundImage=`url(${d.poster})`;
  q('#th').textContent=d.t;q('#td').textContent=d.desc||'';q('#tm').innerHTML=`<span>${mmss(d.d)}</span><span>${shape(d)}</span><span>Explainer</span>`;
  q('#twa').href=WA(`Hi Waseem, I watched the “${d.t}” explainer and I’d like one for my brand.`);
  plist.forEach(b=>b.setAttribute('aria-current',String(b.dataset.id===id)));if(go)run()}
function run(){const d=V[ci];if(tv.getAttribute('src')!==d.src)tv.src=d.src;stage.classList.add('playing');tv.play().catch(()=>{})}
post.onclick=run;q('.bigplay').onclick=e=>{e.stopPropagation();run()};
plist.forEach(b=>b.onclick=()=>sel(b.dataset.id,true));
if(plist.length)sel(plist[0].dataset.id,false);
/* ---------- cursor bubble ---------- */
if(fine){const c=document.createElement('div');c.className='vcur';c.textContent='Play';document.body.appendChild(c);
  addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;c.style.transform=`translate3d(${e.clientX}px,${e.clientY}px,0)`;c.classList.toggle('on',!!(e.target.closest&&e.target.closest('.vc,.poster2')&&!mOpen))},{passive:true})}
})();
