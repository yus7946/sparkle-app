/* ========== 絵文字を線のアイコンに置き換える ==========
   端末ごとに見た目が変わり、デザインのトーンを崩す絵文字を、統一した線画アイコン（SVG）にする。
   画面に出た文字を MutationObserver で見て、絵文字だけを <span class="ei"> の SVG に差し替える。
   （学習の本文や問題文は変えない。入力欄・script・style の中は触らない）
   いちばん最後に読み込む。 */
'use strict';

const EI_P={
  pin:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  play:'<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z" fill="currentColor"/>',
  zap:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  thumb:'<path d="M7 11v9H4v-9zM7 11l4-8a2.5 2.5 0 0 1 2.5 2.5V9h5.2a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.5 20H7"/>',
  sound:'<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  smile:'<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.6"/>',
  dish:'<path d="M3 15h18M5 15a7 7 0 0 1 14 0M12 8V6M4 18h16"/>',
  gate:'<path d="M3 6.5c3 .8 15 .8 18 0M5 10h14M7 7v14M17 7v14"/>',
  mount:'<path d="M3 20l6.5-11 3.5 5.5 2.5-3.5L21 20z"/><path d="M8 11.5l1.5 1 1.5-1.2"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  spark:'<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8zM5 15.5l.6 1.4 1.4.6-1.4.6L5 19.5l-.6-1.4L3 17.5l1.4-.6z"/>',
  home:'<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  bank:'<path d="M3 9.5L12 4l9 5.5M4.5 10v8M9 10v8M15 10v8M19.5 10v8M3 20.5h18"/>',
  medic:'<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M12 8v8M8 12h8"/>',
  phone:'<path d="M6.6 3.5h2.6l1.4 4-2 1.3a12 12 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>',
  case:'<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
  bag:'<path d="M5 8h14l-1 12.5H6z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>',
  car:'<path d="M5 16.5V12l2-5h10l2 5v4.5M3.5 16.5h17v2h-17z"/><circle cx="7.5" cy="13.8" r=".9" fill="currentColor"/><circle cx="16.5" cy="13.8" r=".9" fill="currentColor"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
  phones:'<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.5"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  timer:'<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M9.5 2.5h5M18.5 6.5l1.5-1.5"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  down:'<path d="M12 4v15M6 13l6 6 6-6"/>',
  repeat:'<path d="M17 2.5l3 3-3 3"/><path d="M4 11V9.5a4 4 0 0 1 4-4h12M7 21.5l-3-3 3-3"/><path d="M20 13v1.5a4 4 0 0 1-4 4H4"/>',
  ear:'<path d="M7 9a5 5 0 0 1 10 0c0 3-2.5 3.8-3 6.5-.4 2.2-1.6 4-3.8 4A3.2 3.2 0 0 1 7 16.3"/><path d="M10 9.5a2 2 0 0 1 4 0"/>',
  slow:'<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l-4-5"/>',
  mega:'<path d="M3 10v4l11 5V5zM14 8.5a4 4 0 0 1 0 7"/><path d="M6 14.5l1.5 5h3l-1-4"/>',
  egg:'<path d="M12 3c3.6 0 6.5 6 6.5 10.5a6.5 6.5 0 0 1-13 0C5.5 9 8.4 3 12 3z"/>',
  flagjp:'<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>',
  flagus:'<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M10 9h11.5M10 12h11.5M2.5 15h19"/><rect x="2.5" y="5.5" width="7.5" height="6.5" fill="currentColor" stroke="none" rx="1"/>',
  cele:'<path d="M4 20l4.5-12.5 8 8z"/><path d="M14 4.5l.5 2M19.5 9.5l-2 .5M17.5 4l-1.5 2.5"/>',
  film:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/>'
};
const EI_MAP={'📍':'pin','🎬':'film','⚡':'zap','👍':'thumb','🔊':'sound','💡':'bulb','🎤':'mic','🎙':'mic','👋':'smile','🍣':'dish','🎎':'gate','🗻':'mount','🧭':'compass',
  '🎆':'spark','✨':'spark','🏠':'home','🏡':'home','🏦':'bank','🩺':'medic','📞':'phone','💼':'case','🛍':'bag','🚗':'car','🗣':'chat','🎉':'cele','🎯':'target',
  '🎧':'phones','👥':'users','⏱':'timer','⚙':'gear','🛡':'shield','❌':'x','👇':'down','🔁':'repeat','👂':'ear','🐢':'slow','📣':'mega','🥚':'egg','🇯🇵':'flagjp','🇺🇸':'flagus'};
const EI_RE=new RegExp('('+Object.keys(EI_MAP).map(e=>e.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\uFE0F?','gu');
const eiSVG=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EI_P[k]}</svg>`;
const EI_SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','SELECT','OPTION','TITLE','svg','SVG']);

function eiNode(t){
  const s=t.nodeValue;if(!s||!EI_RE.test(s))return;EI_RE.lastIndex=0;
  const p=t.parentNode;if(!p||EI_SKIP.has(p.nodeName)||p.closest&&p.closest('[contenteditable],.ei'))return;
  const f=document.createDocumentFragment();let last=0;
  s.replace(EI_RE,(m,e,i)=>{if(i>last)f.appendChild(document.createTextNode(s.slice(last,i)));
    const sp=document.createElement('span');sp.className='ei ei-'+EI_MAP[e];sp.innerHTML=eiSVG(EI_MAP[e]);f.appendChild(sp);last=i+m.length;return m});
  if(last<s.length)f.appendChild(document.createTextNode(s.slice(last)));
  p.replaceChild(f,t);
}
function eiScan(root){
  if(!root)return;
  if(root.nodeType===3)return eiNode(root);
  if(root.nodeType!==1||EI_SKIP.has(root.nodeName))return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),list=[];
  while(w.nextNode())list.push(w.currentNode);
  list.forEach(eiNode);
}
eiScan(document.body);
new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')eiNode(m.target);else m.addedNodes.forEach(eiScan)}})
  .observe(document.body,{childList:true,subtree:true,characterData:true});
