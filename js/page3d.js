/* ---------- 360 VIEWER (WebGL, no dependencies) ---------- */
function loadPano(id){return new Promise((res,rej)=>{
  const go=()=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=window.PANO[id]};
  if(window.PANO&&window.PANO[id])return go();
  const s=document.createElement('script');s.src=`pano/${id}.js`;s.onload=go;s.onerror=rej;document.head.appendChild(s)})}
function Viewer(cv,o={}){
  const gl=cv.getContext('webgl',{antialias:false});
  if(!gl){cv.insertAdjacentHTML('afterend','<p style="position:absolute;inset:0;display:grid;place-items:center;color:#fff">Your browser has no WebGL, so 360° is unavailable.</p>');return{}}
  const mk=(t,s)=>{const h=gl.createShader(t);gl.shaderSource(h,s);gl.compileShader(h);return h};
  const pg=gl.createProgram();
  gl.attachShader(pg,mk(gl.VERTEX_SHADER,'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}'));
  gl.attachShader(pg,mk(gl.FRAGMENT_SHADER,`precision highp float;varying vec2 v;uniform sampler2D t;uniform vec2 r;uniform float yaw,pitch,fov;
  void main(){vec2 p=(v*2.-1.)*vec2(r.x/r.y,1.)*tan(fov*.5);vec3 d=normalize(vec3(p,-1.));
  float cp=cos(pitch),sp=sin(pitch),cy=cos(yaw),sy=sin(yaw);
  d=vec3(d.x,d.y*cp-d.z*sp,d.y*sp+d.z*cp);d=vec3(d.x*cy+d.z*sy,d.y,-d.x*sy+d.z*cy);
  gl_FragColor=texture2D(t,vec2(atan(d.x,-d.z)/6.2831853+.5,asin(clamp(d.y,-1.,1.))/3.1415927+.5));}`));
  gl.linkProgram(pg);gl.useProgram(pg);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(pg,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  const U=n=>gl.getUniformLocation(pg,n),tx=gl.createTexture();
  const S={yaw:o.yaw||0,pitch:0,fov:o.fov||1.5,auto:o.auto!==false,speed:o.speed||.0016,vis:true,ready:false,drag:false};
  gl.bindTexture(gl.TEXTURE_2D,tx);
  [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]].forEach(([k,v])=>gl.texParameteri(gl.TEXTURE_2D,k,v));
  const fit=()=>{const d=Math.min(devicePixelRatio||1,2),w=Math.round(cv.clientWidth*d),h=Math.round(cv.clientHeight*d);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}gl.viewport(0,0,w,h)};
  function frame(){requestAnimationFrame(frame);if(!S.vis||!S.ready)return;
    if(S.auto&&!S.drag)S.yaw+=S.speed;fit();
    gl.uniform2f(U('r'),cv.width,cv.height);gl.uniform1f(U('yaw'),S.yaw);gl.uniform1f(U('pitch'),S.pitch);gl.uniform1f(U('fov'),S.fov);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);o.onframe&&o.onframe(S)}
  new IntersectionObserver(e=>S.vis=e[0].isIntersecting).observe(cv);
  let lx,ly;
  cv.addEventListener('pointerdown',e=>{S.drag=true;lx=e.clientX;ly=e.clientY;cv.setPointerCapture(e.pointerId);if(o.stopOnDrag)S.auto=false;o.ondrag&&o.ondrag()});
  cv.addEventListener('pointermove',e=>{if(!S.drag)return;const k=S.fov/cv.clientHeight;S.yaw+=(e.clientX-lx)*k;if(!o.flat)S.pitch=Math.max(-1.45,Math.min(1.45,S.pitch+(e.clientY-ly)*k));lx=e.clientX;ly=e.clientY});
  cv.addEventListener('pointerup',()=>S.drag=false);cv.addEventListener('pointercancel',()=>S.drag=false);
  if(o.zoom)cv.addEventListener('wheel',e=>{e.preventDefault();S.fov=Math.max(.5,Math.min(2.1,S.fov+e.deltaY*.0012))},{passive:false});
  S.set=im=>{gl.bindTexture(gl.TEXTURE_2D,tx);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,im);S.ready=true};
  frame();return S}

/* hero video + showreel modal */
const hv=$('#hv'),rl=$('#rl'),rv=$('video',rl);
if(matchMedia('(prefers-reduced-motion:reduce)').matches){hv.removeAttribute('autoplay');hv.pause()}
new IntersectionObserver(e=>{if(!rl.classList.contains('on')&&!matchMedia('(prefers-reduced-motion:reduce)').matches)e[0].isIntersecting?hv.play().catch(()=>{}):hv.pause()}).observe(hv);
$('#reelbtn').onclick=()=>{hv.pause();rl.classList.add('on');rv.currentTime=0;rv.muted=false;rv.play().catch(()=>{});$('button',rl).focus()};
const closeReel=()=>{rl.classList.remove('on');rv.pause();hv.play().catch(()=>{})};
$('button',rl).onclick=closeReel;rl.onclick=e=>{if(e.target===rl)closeReel()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&rl.classList.contains('on'))closeReel()});

/* chapter viewer */
const sv=Viewer($('#sc'),{auto:true,zoom:true,fov:1.5,stopOnDrag:true,ondrag:()=>$('#auto').setAttribute('aria-pressed','false')});
const chips=$('#chips');
chips.innerHTML=PN.map(([id,n],i)=>`<button role="tab" aria-selected="${i===0}" data-id="${id}">${n}</button>`).join('');
function go(id,name){const L=$('#load');L.classList.remove('off');$('#badge').textContent='Golden Petroleum · '+name;
  loadPano(id).then(im=>{sv.set&&sv.set(im);if(sv.yaw!==undefined)sv.yaw=0;L.classList.add('off')}).catch(()=>L.textContent='Could not load this view.')}
chips.onclick=e=>{const b=e.target.closest('button');if(!b)return;$$('button',chips).forEach(x=>x.setAttribute('aria-selected',x===b));go(b.dataset.id,b.textContent)};
/* load the first panorama when the chapter nears the viewport */
new IntersectionObserver((e,ob)=>{if(e[0].isIntersecting){go(PN[0][0],PN[0][1]);ob.disconnect()}},{rootMargin:'600px'}).observe($('#stage'));
$('#auto').onclick=function(){sv.auto=!sv.auto;this.setAttribute('aria-pressed',sv.auto)};
$('#zi').onclick=()=>sv.fov=Math.max(.5,sv.fov-.2);$('#zo').onclick=()=>sv.fov=Math.min(2.1,sv.fov+.2);
$('#fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():$('#stage').requestFullscreen&&$('#stage').requestFullscreen();

/* walkable 3D scene */
(function(){
  const box=$('#walk'),go=$('#wgo'),bar=$('#wbar'),note=$('#wnote');let v=null;
  const ld=src=>new Promise((res,rej)=>{const e=document.createElement('script');e.src=src;e.onload=res;e.onerror=()=>rej(new Error('Could not load '+src));document.head.appendChild(e)});
  const touch=matchMedia('(pointer:coarse)').matches;
  if(touch)$('#whelp').textContent='Left thumb: walk · Right thumb: look around';
  function show(on){box.classList.toggle('on',on);document.body.classList.toggle('nogenie',on);if(!on){box.classList.remove('lk');if(document.fullscreenElement)document.exitFullscreen()}}
  go.onclick=async()=>{
    if(v){show(true);v.start();return}
    if(!window.WebGL2RenderingContext||typeof DecompressionStream==='undefined'){note.textContent='This browser can’t run the 3D scene. Try a recent Chrome, Edge, Safari or Firefox.';return}
    go.disabled=true;go.textContent='Loading…';bar.style.display='block';const fill=$('i',bar);
    try{
      await ld('scene/viewer.js');await ld('scene/branch.js');
      const j=$('#joy');
      v=await BranchViewer($('#wc3'),{map:$('#wmap'),start:{x:0,z:28,yaw:0},onprogress:p=>fill.style.width=Math.round(p*100)+'%',
        joy:(sx,sy,x,y)=>{if(sx===undefined){j.style.display='none';return}const r=box.getBoundingClientRect();j.style.display='block';j.style.left=(sx-r.left)+'px';j.style.top=(sy-r.top)+'px';
          const dx=Math.max(-50,Math.min(50,x-sx)),dy=Math.max(-50,Math.min(50,y-sy));$('i',j).style.transform=`translate(${dx}px,${dy}px)`}});
      window.BRANCH_DATA=null;show(true);v.start();go.disabled=false;go.textContent='Enter the 3D scene';bar.style.display='none';
    }catch(e){go.disabled=false;go.textContent='Try again';bar.style.display='none';note.textContent='Could not start the 3D scene: '+e.message}};
  $('#wx').onclick=()=>{if(v)v.stop();show(false)};
  $('#wfs').onclick=()=>document.fullscreenElement?document.exitFullscreen():box.requestFullscreen&&box.requestFullscreen();
  document.addEventListener('pointerlockchange',()=>box.classList.toggle('lk',document.pointerLockElement===$('#wc3')));
  new IntersectionObserver(e=>{if(!e[0].isIntersecting&&v&&box.classList.contains('on')&&!document.fullscreenElement){v.stop();show(false)}},{threshold:.05}).observe(box);
})();

