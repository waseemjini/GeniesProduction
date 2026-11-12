/* Genie chat: a small rule-based assistant that hands the conversation to WhatsApp. No server needed. */
(function(){
const NUM='923250111158',EMAIL='waseem.linked@gmail.com',KEY='genieChat';
const wa=t=>`https://wa.me/${NUM}?text=${encodeURIComponent(t)}`;
const WA_SVG='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.004 3.2C8.94 3.2 3.2 8.94 3.2 16c0 2.256.59 4.46 1.71 6.4L3.2 28.8l6.57-1.72A12.74 12.74 0 0 0 16 28.8c7.06 0 12.8-5.74 12.8-12.8S23.06 3.2 16.004 3.2zm5.8 15.46c-.32-.16-1.88-.93-2.17-1.03-.29-.1-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.5-2.55-1.57-.94-.84-1.58-1.88-1.76-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.64s1.14 3.07 1.3 3.28c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.37.19-1.51-.08-.13-.29-.21-.61-.37z"/></svg>';
const root=document.createElement('section');root.className='gchat';root.id='gchat';root.setAttribute('aria-label','Chat with the genie');
root.innerHTML=`<header><span class="av"><img src="img/logo.png" alt=""></span><div><b>Genie</b><small>Ask me anything</small></div><a class="gwa" id="gwa" target="_blank" rel="noopener">${WA_SVG}WhatsApp</a><button class="x" type="button" aria-label="Close chat">✕</button></header>
<div class="glog" id="glog" role="log" aria-live="polite"></div><div class="gqr" id="gqr"></div>
<form class="gin" id="gin" autocomplete="off"><input id="gtxt" type="text" placeholder="Type a message…" aria-label="Your message" maxlength="300"><button type="submit" aria-label="Send">➤</button></form>
<p class="gnote">I’m a scripted assistant. Tap WhatsApp to talk to Waseem himself.</p>`;
document.body.appendChild(root);
const $=s=>root.querySelector(s),log=$('#glog'),qr=$('#gqr'),inp=$('#gtxt'),waBtn=$('#gwa');
let S={msgs:[],flow:null,lead:{},chips:[]};
try{const j=JSON.parse(sessionStorage.getItem(KEY));if(j&&Array.isArray(j.msgs))S=j}catch(e){}
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const lastUser=()=>{for(let i=S.msgs.length-1;i>=0;i--)if(S.msgs[i].who==='u')return S.msgs[i].t;return''};
function refreshWa(){waBtn.href=wa('Hi Waseem, I’m visiting your portfolio.'+(lastUser()?' '+lastUser():''))}
function el(m){const d=document.createElement('div');d.className='gm '+m.who;d.textContent=m.t;
  if(m.a&&m.a.length){const w=document.createElement('div');w.className='gacts';
    m.a.forEach(x=>{const a=document.createElement('a');a.className='gact'+(x.w?' gw':'');a.textContent=x.l;a.href=x.h;if(/^https?:|^mailto:/.test(x.h)){a.target=x.h.startsWith('mailto')?'_self':'_blank';a.rel='noopener'}w.appendChild(a)});d.appendChild(w)}
  return d}
const down=()=>{log.scrollTop=log.scrollHeight};
function setChips(c){S.chips=c||[];qr.innerHTML='';S.chips.forEach(t=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.onclick=()=>user(t);qr.appendChild(b)})}
function bot(t,o){o=o||{};return new Promise(res=>{
  const ty=document.createElement('div');ty.className='gtype';ty.innerHTML='<i></i><i></i><i></i>';log.appendChild(ty);down();qr.innerHTML='';
  setTimeout(()=>{ty.remove();const m={who:'b',t,a:o.a};S.msgs.push(m);log.appendChild(el(m));setChips(o.c);save();down();refreshWa();res()},Math.min(1100,350+t.length*9))})}
/* ---------- knowledge ---------- */
const GREET='Hi! I’m the genie of this portfolio. I can show you Waseem’s work, answer quick questions, or pass your message to him on WhatsApp. What are you after?';
const MAIN=['See 3D work','Social media design','Branding','Video & reels','Start a project','Pricing'];
const link=(l,h)=>({l,h});
const W=(l,t)=>({l:l||'Continue on WhatsApp',h:wa(t),w:1});
const rules=[
 [/\b(hi|hello|hey|salam|assalam|good (morning|evening|afternoon))\b/,()=>['Hello! Great to meet you. What would you like to know?',{c:MAIN}]],
 [/\b(price|pricing|cost|rate|rates|budget|how much|charge|fee)\b/,()=>['Pricing depends on the scope, the number of deliverables and the timeline, so Waseem quotes every project personally. Share the details with him on WhatsApp and he’ll come back with a quote.',{a:[W('Ask for a quote','Hi Waseem, I’d like a quote for a project.')],c:['Start a project','See 3D work']}]],
 [/\b(time|timeline|deadline|how long|turnaround|delivery|days|weeks|urgent|rush)\b/,()=>['Timelines depend on the project. Tell Waseem the date you have in mind and he’ll confirm what’s possible.',{a:[W('Discuss my deadline','Hi Waseem, I have a project with a deadline. Can we talk?')],c:['Start a project']}]],
 [/\b(start|begin|hire|book|quote|work with|new project)\b/,()=>{S.flow='name';return['Wonderful! First, what’s your name?',{}]}],
 [/\b(video|videos|reel|reels|explainer|explainers|motion|editing|footage|shorts|tiktok)\b/,()=>['Waseem makes short-form vertical reels for brands (often captioned) plus brand explainer videos from 20 seconds to about 3 minutes. The Videos page has 27 reels and 5 explainers you can play.',{a:[link('Open the Videos page','video.html')],c:['Pricing','Start a project']}]],
 [/\b(3d|render|renders|environment|interior|interiors|architect|building|360|walk|walkthrough|model|modeling|modelling|animation|product visual)/,()=>['Waseem builds 3D environments, interior and building renders, product renders and 360° tours. You can even walk through the Golden Petroleum station in real time on the 3D Portfolio page.',{a:[link('Open 3D Portfolio','index.html')],c:['Pricing','Start a project']}]],
 [/\b(social|instagram|facebook|post|posts|content|campaign|poster|posters|carousel|reels?)\b/,()=>['Waseem designs social media content and campaigns: posters, carousels and brand posts for 17 brands across tech, healthcare, retail, hospitality and more, including English and Arabic work.',{a:[link('Open Social Media work','social.html')],c:['Branding','Start a project']}]],
 [/\b(brand|branding|logo|identity|guideline|guidelines|stationery|packaging|typography)\b/,()=>['Waseem creates complete brand identities: logo, color, typography, stationery, packaging and guidelines. Eight identities are shown on the Branding page.',{a:[link('Open Branding work','branding.html')],c:['Pricing','Start a project']}]],
 [/\b(contact|whatsapp|email|mail|phone|call|reach|number|talk)\b/,()=>['You can reach Waseem on WhatsApp at +92 325 0111158 or by email at '+EMAIL+'.',{a:[W('Open WhatsApp','Hi Waseem, I’m visiting your portfolio.'),link('Send an email','mailto:'+EMAIL)]}]],
 [/\b(who|about|waseem|creative lead|services|offer|do you do|what do you do)\b/,()=>['Waseem Ahmed is a Creative Lead who builds visual systems that help brands communicate better: 3D visualization, social media design and branding.',{c:['See 3D work','Social media design','Branding','Video & reels']}]],
 [/\b(thanks|thank you|thx|great|awesome|nice|cool)\b/,()=>['Anytime! Your wish is my command.',{c:MAIN}]],
 [/\b(bye|goodbye|see you)\b/,()=>['Goodbye! Come back any time, I’ll be floating around.',{}]]
];
function reply(t){
  const low=t.toLowerCase();
  if(S.flow==='name'){S.lead.name=t.replace(/^(i am|i'm|im|my name is|this is)\s+/i,'').trim().slice(0,40);S.flow='need';return['Nice to meet you, '+S.lead.name+'! What do you need?',{c:['3D visuals','Social media design','Branding','Video / reels','Something else']}]}
  if(S.flow==='need'){S.lead.need=t;S.flow='brief';return['Got it. Tell me a little about it: what is the project, and when do you need it?',{}]}
  if(S.flow==='brief'){S.lead.brief=t;S.flow=null;const L=S.lead,msg=`Hi Waseem, I’m ${L.name}. I’m interested in: ${L.need}.\n${L.brief}\n\n(Sent from your portfolio via the genie)`;
    return['Perfect, thanks '+L.name+'! Tap below and I’ll open WhatsApp with your details ready for Waseem.',{a:[W('Send to WhatsApp',msg)],c:['Start over']}]}
  if(/^start over$/.test(low)){S.lead={};S.flow='name';return['Sure, let’s start again. What’s your name?',{}]}
  for(const[re,fn]of rules)if(re.test(low))return fn();
  return['Good question! I’m only a simple genie, so Waseem is the best person to answer that. Want me to send it to him on WhatsApp?',{a:[W('Send to Waseem',`Hi Waseem, I have a question: ${t}`)],c:MAIN}];
}
let busy=false;
async function user(t){t=(t||'').trim();if(!t||busy)return;busy=true;
  const m={who:'u',t};S.msgs.push(m);log.appendChild(el(m));save();down();refreshWa();
  const[txt,o]=reply(t);await bot(txt,o);busy=false}
$('#gin').addEventListener('submit',e=>{e.preventDefault();const v=inp.value;inp.value='';user(v)});
/* ---------- open / close ---------- */
function open(){
  root.classList.add('open');document.body.classList.add('chat-open');
  if(!log.childElementCount){S.msgs.forEach(m=>log.appendChild(el(m)));down()}
  if(!S.msgs.length)bot(GREET,{c:MAIN});else setChips(S.chips);
  refreshWa();if(!matchMedia('(pointer:coarse)').matches)setTimeout(()=>inp.focus(),300)}
function close(){root.classList.remove('open');document.body.classList.remove('chat-open')}
document.addEventListener('genie:open',()=>root.classList.contains('open')?close():open());
$('.x').onclick=close;
addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('open'))close()});
/* page transitions: keep the panel from blocking the wipe */
root.addEventListener('click',e=>{const a=e.target.closest('a.gact');if(a&&/^[\w-]+\.html$/.test(a.getAttribute('href')))close()});
})();
