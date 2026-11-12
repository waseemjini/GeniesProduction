/* Branding page: hero video + "watch with sound" modal */
(function(){
  const $=s=>document.querySelector(s),calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const hv=$('#bv'),rl=$('#rl'),rv=rl.querySelector('video'),btn=$('#reelbtn');
  if(calm){hv.removeAttribute('autoplay');hv.pause()}
  new IntersectionObserver(e=>{if(rl.classList.contains('on')||calm)return;e[0].isIntersecting?hv.play().catch(()=>{}):hv.pause()}).observe(hv);
  btn.onclick=()=>{hv.pause();rl.classList.add('on');rv.currentTime=0;rv.muted=false;rv.play().catch(()=>{});rl.querySelector('button').focus()};
  const close=()=>{rl.classList.remove('on');rv.pause();if(!calm)hv.play().catch(()=>{})};
  rl.querySelector('button').onclick=close;rl.onclick=e=>{if(e.target===rl)close()};
  addEventListener('keydown',e=>{if(e.key==='Escape'&&rl.classList.contains('on'))close()});
})();
