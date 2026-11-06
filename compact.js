/* ========== 1画面に収める（タブごとの折りたたみ） ==========
   スマホでスクロールせずに各タブの「いま使うもの」が見えるよう、補足の情報を折りたたむ。
   ・各タブの描画関数（ほかのファイルが上書きしたあと）をさらに包み、描画のたびに折りたたみを当てる
   ・開いた／閉じたは端末ごとに覚える（localStorage 'sparkle_fold'）
   ・中身は消さずに移動するだけなので、ボタンなどの動作はそのまま
   いちばん最後（icons.js の前）に読み込む。 */
'use strict';

const CP_KEY='sparkle_fold';
function cpState(){try{return JSON.parse(localStorage.getItem(CP_KEY)||'{}')}catch(e){return{}}}
function cpSave(k,v){try{const s=cpState();s[k]=v;localStorage.setItem(CP_KEY,JSON.stringify(s))}catch(e){}}
const CP_CHEV='<svg class="cp-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

// nodes を折りたたみの箱に入れる。head が要素なら、それを見出し（タップで開閉）にする
function cpFold(key,nodes,opt){
  nodes=(nodes||[]).filter(n=>n&&n.parentNode&&!n.closest('.cp-fold'));
  if(!nodes.length)return null;
  opt=opt||{};
  const st=cpState(),open=st[key]!=null?st[key]:!!opt.open;
  const box=document.createElement('div');box.className='cp-fold'+(open?' open':'')+(opt.cls?' '+opt.cls:'');box.dataset.cp=key;
  const head=opt.head||document.createElement('button');
  if(!opt.head){head.type='button';head.className='cp-fold-h';head.innerHTML=`<span class="cp-t">${opt.title||''}</span><span class="cp-s">${opt.sum||''}</span>${CP_CHEV}`}
  else{head.classList.add('cp-fold-h','cp-head-title');if(opt.sum&&!head.querySelector('.cp-s'))head.insertAdjacentHTML('beforeend',`<span class="cp-s">${opt.sum}</span>`);if(!head.querySelector('.cp-chev'))head.insertAdjacentHTML('beforeend',CP_CHEV);head.setAttribute('role','button');head.tabIndex=0}
  head.setAttribute('aria-expanded',open);
  const body=document.createElement('div');body.className='cp-fold-b';const inner=document.createElement('div');inner.className='cp-fold-i';body.appendChild(inner);
  (opt.head||nodes[0]).before(box);
  box.appendChild(head);box.appendChild(body);
  nodes.forEach(n=>inner.appendChild(n));
  const toggle=()=>{const o=!box.classList.contains('open');box.classList.toggle('open',o);head.setAttribute('aria-expanded',o);cpSave(key,o);if(typeof sfx==='function')sfx('tap')};
  head.addEventListener('click',e=>{if(e.target.closest('a,input,select')&&e.target!==head)return;toggle()});
  head.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
  return box;
}
const cpQ=(root,sel)=>root?root.querySelector(sel):null;
const cpQA=(root,sel)=>root?[...root.querySelectorAll(sel)]:[];
const cpTxt=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';

/* ---------- ホーム ---------- */
function cpHome(){
  const s=document.getElementById('screen-home');if(!s)return;s.classList.add('cp-on');
  const co=cpQ(s,'#co-card');
  if(co){
    const ph=cpQ(co,'.co-phase-l');
    cpFold('home-week',[cpQ(co,'.co-goal'),cpQ(co,'.co-phase'),ph,cpQ(co,'#co-all')],{title:'今週のゴール・カリキュラム',sum:ph?esc(cpTxt(ph.firstElementChild||ph).slice(0,14)):''});
  }
  const ls=cpQ(s,'.login-strip');
  if(ls){const cur=cpQ(ls,'.login-dot.cur')||cpQ(ls,'.login-dot.done:last-of-type');const n=cpQA(ls,'.login-dot.done').length;
    cpFold('home-login',[ls],{title:'ログインボーナス',sum:`${n}/7日${cur?' · 今日 '+esc(cpTxt(cpQ(cur,'.login-dot-xp'))):''}`,cls:'cp-mini'})}
}
/* ---------- Talk ---------- */
function cpTalk(){
  const s=document.getElementById('screen-talk');if(!s||!cpQ(s,'.tk-hero'))return;s.classList.add('cp-on');
  const h=cpQ(s,':scope>.tk-hero');
  if(h){const st=cpQA(h,'.tk-stats > *').slice(0,2).map(e=>cpTxt(e.firstElementChild||e)).filter(Boolean).join(' · ');
    cpFold('talk-stats',[cpQ(h,'.tk-lead'),cpQ(h,'.tk-stats'),cpQ(h,'.tk-week')],{title:'今週の記録',sum:esc(st),cls:'cp-in-hero'})}
  const rp=cpQ(s,':scope>#tk-rp-list');
  if(rp){const nodes=[];let n=rp.nextElementSibling;while(n&&!n.classList.contains('co-set')&&!n.classList.contains('sec-title')){nodes.push(n);n=n.nextElementSibling}
    const on=cpQ(s,'.co-scenes .pill.on');
    if(nodes.length)cpFold('talk-rp',nodes,{head:rp,sum:on?esc(cpTxt(on)):''})}
}
/* ---------- TOEIC ---------- */
function cpToeic(){
  const s=document.getElementById('screen-toeic');if(!s)return;s.classList.add('cp-on');
  const h=cpQ(s,'.toeic-hero');
  if(h){const f=cpFold('toeic-parts',[cpQ(h,'.toeic-desc'),cpQ(h,'.toeic-parts')],{title:'パート別の進み具合',sum:'P1〜P7',cls:'cp-in-hero'});if(f)h.appendChild(f)}
}
/* ---------- Profile ---------- */
function cpProfile(){
  const s=document.getElementById('screen-profile');if(!s)return;s.classList.add('cp-on');
  const body=document.getElementById('profile-tab-body');
  if(body){
    cpQA(body,':scope>.sec-title').forEach((t,i)=>{const c=t.nextElementSibling;if(c&&!c.classList.contains('sec-title'))cpFold('prof-sec-'+i+'-'+cpTxt(t).slice(0,8),[c],{head:t})});
  }
  const set=document.getElementById('co-set-title');
  if(set){const nodes=[];let n=set.nextElementSibling;while(n){nodes.push(n);n=n.nextElementSibling}
    cpFold('prof-set',nodes.filter(x=>!x.classList.contains('cp-fold')),{head:set,sum:'バックアップ・色・Plus'})}
}

function cpWrap(name,fn){
  const f=window[name];if(typeof f!=='function')return;
  window[name]=function(){const r=f.apply(this,arguments);try{fn()}catch(e){}return r};
}
cpWrap('renderHome',cpHome);
cpWrap('renderTalkHub',cpTalk);
cpWrap('renderTOEICTab',cpToeic);
cpWrap('renderProfile',cpProfile);
// サブタブ（概要／詳細）を切り替えたときも当てる
['setProfileTab','profileTab','switchProfileTab'].forEach(n=>cpWrap(n,cpProfile));
// ほかのファイルが後から差し込む入口にも対応（描画の直後に1回だけ見直す）
new MutationObserver(()=>{clearTimeout(cpWrap._t);cpWrap._t=setTimeout(()=>{try{
  const a=document.querySelector('.screen.active');if(!a)return;
  if(a.id==='screen-home')cpHome();else if(a.id==='screen-talk')cpTalk();else if(a.id==='screen-toeic')cpToeic();else if(a.id==='screen-profile')cpProfile();
}catch(e){}},60)}).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
// 読み込んだ時点で表示中のタブにも
try{const a=document.querySelector('.screen.active');if(a&&a.id==='screen-home')cpHome()}catch(e){}
