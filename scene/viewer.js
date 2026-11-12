/* Branch walkthrough: dependency-free WebGL2 viewer for the optimized model. */
(function(){
async function loadData(onp){
  const C=window.BRANCH_DATA,parts=[];let n=0;
  for(let i=0;i<C.length;i++){const s=atob(C[i]),u=new Uint8Array(s.length);for(let k=0;k<s.length;k++)u[k]=s.charCodeAt(k);parts.push(u);n+=u.length;onp&&onp((i+1)/C.length*.5);await new Promise(r=>setTimeout(r))}
  const all=new Uint8Array(n);let o=0;for(const p of parts){all.set(p,o);o+=p.length}
  const ab=await new Response(new Blob([all]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  return ab}
const VS=`#version 300 es
layout(location=0) in vec3 a_p;layout(location=1) in vec3 a_n;layout(location=2) in vec2 a_u;
layout(location=3) in vec4 i0;layout(location=4) in vec4 i1;layout(location=5) in vec4 i2;layout(location=6) in vec4 i3;
uniform mat4 u_vp;uniform vec3 u_pmin,u_pext;uniform vec2 u_umin,u_uext;
out vec3 v_n;out vec3 v_w;out vec2 v_u;
void main(){vec3 p=u_pmin+a_p*u_pext;mat4 m=mat4(i0,i1,i2,i3);vec4 w=m*vec4(p,1.);v_w=w.xyz;
 mat3 M=mat3(m);v_n=transpose(inverse(M))*a_n;v_u=u_umin+a_u*u_uext;gl_Position=u_vp*w;}`;
const FS=`#version 300 es
precision highp float;in vec3 v_n;in vec3 v_w;in vec2 v_u;
uniform vec4 u_c;uniform vec3 u_e;uniform float u_m,u_r,u_cut;uniform int u_mode;uniform bool u_tex;uniform sampler2D u_t;uniform vec3 u_cam;uniform float u_clip;
out vec4 o;
void main(){if(v_w.y>u_clip)discard;vec4 c=u_c;if(u_tex)c*=texture(u_t,v_u);
 if(u_mode==1&&c.a<u_cut)discard;
 vec3 n=normalize(v_n);if(!gl_FrontFacing)n=-n;
 vec3 V=u_cam-v_w;float d=length(V);V/=d;
 vec3 amb=mix(vec3(.17,.16,.2),vec3(.5,.5,.56),n.y*.5+.5);
 float key=max(dot(n,normalize(vec3(.4,1.,.3))),0.);
 float head=max(dot(n,V),0.)/(1.+pow(d/110.,2.));
 vec3 L=amb+vec3(1.,.97,.92)*key*.5+vec3(1.,.95,.9)*head*.6;
 vec3 base=c.rgb*(1.-u_m*.75);vec3 col=base*L;
 vec3 R=reflect(-V,n);float env=smoothstep(-.4,.7,R.y);
 vec3 ec=mix(vec3(.12,.11,.15),vec3(.8,.8,.9),env);
 col+=ec*mix(vec3(.04),c.rgb,u_m)*(1.-u_r*.7);
 col+=u_e;col=1.-exp(-col*1.3);o=vec4(pow(col,vec3(1./2.2)),u_mode==2?c.a:1.);}`;
function m4persp(f,a,n,fr){const t=1/Math.tan(f/2),r=1/(n-fr);return[t/a,0,0,0,0,t,0,0,0,0,(n+fr)*r,-1,0,0,2*n*fr*r,0]}
function m4look(e,f){const z=[-f[0],-f[1],-f[2]];let x=[f[1]*0+ -z[2]*0,0,0];
  // right = normalize(cross(up,z)) with up=(0,1,0)
  x=[z[2],0,-z[0]];const l=Math.hypot(x[0],x[2])||1;x=[x[0]/l,0,x[2]/l];
  const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
  return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1]}
function m4mul(a,b){const o=new Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o}

window.BranchViewer=async function(cv,ui){ui=ui||{};
  const gl=cv.getContext('webgl2',{antialias:true,powerPreference:'high-performance'});
  if(!gl)throw new Error('WebGL2 is not available');
  const ab=await loadData(ui.onprogress);
  const dv=new DataView(ab),hl=dv.getUint32(0,true),H=JSON.parse(new TextDecoder().decode(new Uint8Array(ab,4,hl))),B=4+hl,M=H.meta;
  const mk=(t,s)=>{const h=gl.createShader(t);gl.shaderSource(h,s);gl.compileShader(h);if(!gl.getShaderParameter(h,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(h));return h};
  const pg=gl.createProgram();gl.attachShader(pg,mk(gl.VERTEX_SHADER,VS));gl.attachShader(pg,mk(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pg);gl.useProgram(pg);
  const U={};['u_vp','u_pmin','u_pext','u_umin','u_uext','u_c','u_e','u_m','u_r','u_cut','u_mode','u_tex','u_t','u_cam','u_clip'].forEach(k=>U[k]=gl.getUniformLocation(pg,k));
  // textures
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
  const an=gl.getExtension('EXT_texture_filter_anisotropic'),T=[];
  for(let i=0;i<H.tex.length;i++){const t=H.tex[i],bm=await createImageBitmap(new Blob([new Uint8Array(ab,B+t.o,t.l)],{type:'image/webp'}),{premultiplyAlpha:'none',colorSpaceConversion:'none'});
    const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);gl.texImage2D(gl.TEXTURE_2D,0,gl.SRGB8_ALPHA8,gl.RGBA,gl.UNSIGNED_BYTE,bm);gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    if(an)gl.texParameterf(gl.TEXTURE_2D,an.TEXTURE_MAX_ANISOTROPY_EXT,8);T.push(tx);bm.close&&bm.close();ui.onprogress&&ui.onprogress(.5+.3*(i+1)/H.tex.length)}
  // geometry: one draw per (prim, winding)
  const draws=[];
  H.prims.forEach((p,pi)=>{
    gl.bindVertexArray(null);
    const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Uint8Array(ab,B+p.vo,p.nv*16),gl.STATIC_DRAW);
    const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint8Array(ab,B+p.io,p.ni*(p.w?4:2)),gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null);
    for(const[list,cw]of[[p.inst,0],[p.instN,1]]){if(!list.length)continue;
      const vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vb);
      gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.UNSIGNED_SHORT,true,16,0);
      gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.BYTE,true,16,8);
      gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,2,gl.UNSIGNED_SHORT,true,16,12);
      const ibuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,ibuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(list.flat()),gl.STATIC_DRAW);
      for(let k=0;k<4;k++){gl.enableVertexAttribArray(3+k);gl.vertexAttribPointer(3+k,4,gl.FLOAT,false,64,k*16);gl.vertexAttribDivisor(3+k,1)}
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);draws.push({p,vao,cw,n:list.length,mat:H.mats[p.m]})}});
  gl.bindVertexArray(null);
  draws.sort((a,b)=>(a.mat.mode===2)-(b.mat.mode===2));
  ui.onprogress&&ui.onprogress(1);
  // collision grid
  const G=M.grid,grid=new Uint8Array(ab,B+G.o,G.l);
  const blocked=(x,z)=>{const gx=Math.floor((x-G.x0)/G.cs),gz=Math.floor((z-G.z0)/G.cs);if(gx<0||gz<0||gx>=G.w||gz>=G.h)return true;return grid[gz*G.w+gx]===1};
  const RAD=3.2,ring=[[0,0]];for(let i=0;i<8;i++)ring.push([Math.cos(i*.785)*RAD,Math.sin(i*.785)*RAD]);
  const free=(x,z)=>{for(const[a,b]of ring)if(blocked(x+a,z+b))return false;return true};
  const S={x:0,y:M.floor+16,z:0,yaw:0,pitch:0,fov:1.2,run:false,go:false,debug:false};
  Object.assign(S,ui.start||{});
  if(!free(S.x,S.z)){let ok=false;for(let r=2;r<80&&!ok;r+=2)for(let k=0;k<16&&!ok;k++){const x=S.x+Math.cos(k*.39)*r,z=S.z+Math.sin(k*.39)*r;if(free(x,z)){S.x=x;S.z=z;ok=true}}}
  const keys={};let joy=[0,0],look=[0,0];
  // minimap
  let mapc,mx,mimg;
  if(ui.map){mapc=ui.map;mx=mapc.getContext('2d');mimg=document.createElement('canvas');mimg.width=G.w;mimg.height=G.h;const c=mimg.getContext('2d'),id=c.createImageData(G.w,G.h);
    for(let i=0;i<G.w*G.h;i++){const b=grid[i]?[196,181,253,255]:[255,255,255,0];id.data.set(b,i*4)}c.putImageData(id,0,0)}
  function drawMap(){if(!mx)return;const W=mapc.width,Hh=mapc.height,s=Math.min(W/G.w,Hh/G.h);mx.clearRect(0,0,W,Hh);mx.fillStyle='rgba(17,14,25,.72)';mx.fillRect(0,0,W,Hh);
    mx.imageSmoothingEnabled=false;mx.drawImage(mimg,0,0,G.w*s,G.h*s);const px=(S.x-G.x0)/G.cs*s,pz=(S.z-G.z0)/G.cs*s;
    mx.fillStyle='#8b5cf6';mx.beginPath();mx.arc(px,pz,4,0,6.3);mx.fill();mx.strokeStyle='#fff';mx.lineWidth=2;mx.beginPath();mx.moveTo(px,pz);mx.lineTo(px-Math.sin(S.yaw)*11,pz-Math.cos(S.yaw)*11);mx.stroke()}
  // input
  const kd=e=>{if(!S.go)return;keys[e.code]=true;if(/^(Arrow|Space)/.test(e.code))e.preventDefault()},ku=e=>keys[e.code]=false;
  addEventListener('keydown',kd);addEventListener('keyup',ku);
  const lockd=()=>document.pointerLockElement===cv;
  cv.addEventListener('click',e=>{if(e.pointerType!=='touch'&&S.go&&!lockd()&&cv.requestPointerLock)cv.requestPointerLock()});
  addEventListener('mousemove',e=>{if(lockd()){S.yaw-=e.movementX*.0022;S.pitch=Math.max(-1.4,Math.min(1.4,S.pitch-e.movementY*.0022))}});
  const pt={};
  cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&!lockd()){pt.m=[e.clientX,e.clientY];cv.setPointerCapture(e.pointerId);return}
    if(e.pointerType==='touch'){const r=cv.getBoundingClientRect(),left=(e.clientX-r.left)<r.width*.45;pt[e.pointerId]={left,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY};cv.setPointerCapture(e.pointerId)}});
  cv.addEventListener('pointermove',e=>{
    if(e.pointerType==='mouse'&&pt.m&&!lockd()){S.yaw-=(e.clientX-pt.m[0])*.004;S.pitch=Math.max(-1.4,Math.min(1.4,S.pitch-(e.clientY-pt.m[1])*.004));pt.m=[e.clientX,e.clientY];return}
    const q=pt[e.pointerId];if(!q)return;
    if(q.left){joy=[Math.max(-1,Math.min(1,(e.clientX-q.sx)/50)),Math.max(-1,Math.min(1,(e.clientY-q.sy)/50))];ui.joy&&ui.joy(q.sx,q.sy,e.clientX,e.clientY)}
    else{S.yaw-=(e.clientX-q.x)*.005;S.pitch=Math.max(-1.4,Math.min(1.4,S.pitch-(e.clientY-q.y)*.005));q.x=e.clientX;q.y=e.clientY}});
  const up=e=>{if(e.pointerType==='mouse')pt.m=null;const q=pt[e.pointerId];if(q&&q.left){joy=[0,0];ui.joy&&ui.joy()}delete pt[e.pointerId]};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  let last=0,raf=0;
  function step(dt){
    const fx=-Math.sin(S.yaw),fz=-Math.cos(S.yaw),rx=Math.cos(S.yaw),rz=-Math.sin(S.yaw);
    let f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy[1],s=(keys.KeyD?1:0)-(keys.KeyA?1:0)+joy[0];
    if(keys.ArrowLeft)S.yaw+=1.6*dt;if(keys.ArrowRight)S.yaw-=1.6*dt;
    const l=Math.hypot(f,s);if(l>1){f/=l;s/=l}
    const sp=(keys.ShiftLeft||keys.ShiftRight?58:28)*dt,dx=(fx*f+rx*s)*sp,dz=(fz*f+rz*s)*sp;
    if(free(S.x+dx,S.z+dz)){S.x+=dx;S.z+=dz}else if(free(S.x+dx,S.z))S.x+=dx;else if(free(S.x,S.z+dz))S.z+=dz}
  function render(){
    const w=Math.round(cv.clientWidth*Math.min(devicePixelRatio||1,1.5)),h=Math.round(cv.clientHeight*Math.min(devicePixelRatio||1,1.5));
    if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
    gl.viewport(0,0,w,h);gl.clearColor(.047,.04,.07,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.useProgram(pg);
    const cp=Math.cos(S.pitch),fwd=[-Math.sin(S.yaw)*cp,Math.sin(S.pitch),-Math.cos(S.yaw)*cp];
    const vp=m4mul(m4persp(S.fov,w/h,.4,6000),m4look([S.x,S.y,S.z],fwd));
    gl.uniformMatrix4fv(U.u_vp,false,vp);gl.uniform3f(U.u_cam,S.x,S.y,S.z);gl.uniform1f(U.u_clip,S.clip||1e9);gl.uniform1i(U.u_t,0);gl.activeTexture(gl.TEXTURE0);
    let blend=false;
    for(const d of draws){const m=d.mat;
      if((m.mode===2)!==blend){blend=m.mode===2;if(blend){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false)}}
      if(m.ds)gl.disable(gl.CULL_FACE);else{gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK)}
      gl.frontFace(d.cw?gl.CW:gl.CCW);
      const p=d.p;gl.uniform3fv(U.u_pmin,p.pn);gl.uniform3fv(U.u_pext,p.pe);gl.uniform2fv(U.u_umin,p.un);gl.uniform2fv(U.u_uext,p.ue);
      gl.uniform4fv(U.u_c,m.c);gl.uniform3fv(U.u_e,m.e);gl.uniform1f(U.u_m,Math.min(m.m,1));gl.uniform1f(U.u_r,Math.min(m.r,1));gl.uniform1f(U.u_cut,m.cut);gl.uniform1i(U.u_mode,m.mode);
      if(m.t>=0){gl.uniform1i(U.u_tex,1);gl.bindTexture(gl.TEXTURE_2D,T[m.t])}else gl.uniform1i(U.u_tex,0);
      gl.bindVertexArray(d.vao);gl.drawElementsInstanced(gl.TRIANGLES,p.ni,p.w?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT,0,d.n)}
    gl.depthMask(true);gl.disable(gl.BLEND);gl.frontFace(gl.CCW);gl.bindVertexArray(null);drawMap()}
  function loop(t){raf=requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000||0);last=t;if(S.go&&!S.debug)step(dt);render()}
  const V={S,meta:M,render,free,
    start(){S.go=true;cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(loop)},
    stop(){S.go=false;cancelAnimationFrame(raf);for(const k in keys)keys[k]=false;document.exitPointerLock&&document.exitPointerLock()},
    resume(){this.start()}};
  return V}
})();
