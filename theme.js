/* ========== テーマとカラー（5色 × 自動／ライト／ダーク） ==========
   ・<head> の CSS のあとで読み込み、最初の描画の前にテーマを当てる（ちらつき防止）
   ・旧スタイルにある青の直書き（#2b7fe0・rgba(43,127,224,.4) など）を、CSSOM で theme.css の --c-* に置き換える
     → どの画面もテーマの色になる（theme.css 自身は書き換えない）
   ・ダーク／ライトの手動切り替え：(prefers-color-scheme: dark) の media 条件を all / not all に書き換える
   ・設定は端末ごと（localStorage）。Profile の「設定とデータ」から変える */
'use strict';

const TH_LIST=[
  {k:'sky',n:'空',d:'澄んだブルー',c:['#4fa3f7','#2b7fe0','#123d80']},
  {k:'sage',n:'セージ',d:'くすみグリーン',c:['#7fb3a0','#4f8a76','#24483d']},
  {k:'lavender',n:'ラベンダー',d:'やわらかい紫',c:['#9d92d6','#7466b8','#3a2f6e']},
  {k:'navy',n:'ミッドナイト',d:'落ち着いた紺',c:['#6b88b8','#3b5b8c','#1a2a45']},
  {k:'rose',n:'ローズ',d:'くすみピンク',c:['#d29aa8','#b06a7c','#5c2f3c']}
];
// 旧スタイルの青 → テーマの変数
const TH_MAP={'43,127,224':'--c-primary','79,163,247':'--c-primary-2','26,86,168':'--c-deep','18,61,128':'--c-deeper','15,42,74':'--c-ink-deep','8,26,56':'--c-night-deep',
  '219,234,255':'--c-tint-1','227,239,255':'--c-tint-2','185,214,255':'--c-tint-3'};
const TH_KEY='sparkle_theme';

function thPrefs(){try{const p=JSON.parse(localStorage.getItem(TH_KEY)||'{}');return{t:TH_LIST.some(x=>x.k===p.t)?p.t:'sky',m:['auto','light','dark'].includes(p.m)?p.m:'auto'}}catch(e){return{t:'sky',m:'auto'}}}
function thSave(p){try{localStorage.setItem(TH_KEY,JSON.stringify(p))}catch(e){}}

/* ---------- 色の置き換え ---------- */
const thHex=h=>[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)].join(',');
function thSwap(v){
  if(!v||(v.indexOf('rgb')<0&&v.indexOf('#')<0))return v;
  return v.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g,(m,r,g,b,a)=>{const k=TH_MAP[r+','+g+','+b];if(!k)return m;
      return a!=null&&+a<1?`color-mix(in srgb,var(${k}) ${Math.round(a*100)}%,transparent)`:`var(${k})`})
    .replace(/#([0-9a-fA-F]{6})\b/g,(m,h)=>{const k=TH_MAP[thHex(h)];return k?`var(${k})`:m});
}
function thRules(list,fn){for(const r of list){if(r.style)fn(r);if(r.cssRules)thRules(r.cssRules,fn)}}
const thDone=new WeakSet();
const thDark=[];
function thScan(){
  for(const sh of document.styleSheets){
    if(thDone.has(sh))continue;
    let rules;try{rules=sh.cssRules}catch(e){continue}
    if(!rules)continue;thDone.add(sh);
    const own=sh.href&&/theme\.css/.test(sh.href);
    // ダーク用の media 条件を集める（手動切り替え用）
    const walk=list=>{for(const r of list){if(r.media&&/prefers-color-scheme:\s*dark/.test(r.media.mediaText))thDark.push(r);if(r.cssRules&&!r.media)walk(r.cssRules)}};
    walk(rules);
    if(own)continue;
    thRules(rules,r=>{const st=r.style;for(let i=0;i<st.length;i++){const p=st[i],v=st.getPropertyValue(p),nv=thSwap(v);if(nv!==v)st.setProperty(p,nv,st.getPropertyPriority(p))}});
  }
}

/* ---------- 適用 ---------- */
function thApply(p){
  p=p||thPrefs();
  const html=document.documentElement;
  if(p.t==='sky')html.removeAttribute('data-theme');else html.setAttribute('data-theme',p.t);
  html.setAttribute('data-mode',p.m);
  thScan();
  thDark.forEach(r=>{try{r.media.mediaText=p.m==='dark'?'all':p.m==='light'?'not all':'(prefers-color-scheme: dark)'}catch(e){}});
  const dark=p.m==='dark'||(p.m==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
  html.style.colorScheme=dark?'dark':'light';
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',getComputedStyle(html).getPropertyValue('--night').trim()||(dark?'#0e1622':'#f4f8fd'));
}
thApply();
// あとから読み込まれる CSS（各モジュールが足す <style>）にも当てる
document.addEventListener('DOMContentLoaded',()=>thApply());
addEventListener('load',()=>thApply());
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(thPrefs().m==='auto')thApply()})}catch(e){}

/* ---------- テーマとカラーの画面 ---------- */
const TH_IC={
  auto:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>',
  light:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  dark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  palette:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/></svg>'
};
function themeOpen(){
  const p=thPrefs(),el=document.getElementById('screen-review');
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));el.classList.add('active');
  el.innerHTML=`<div class="back-row"><button class="icon-btn" id="th-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>テーマとカラー</h2></div>
    <div class="sec-title">明るさ</div>
    <div class="tk-seg th-modes" role="radiogroup" aria-label="明るさ">${[['auto','自動'],['light','ライト'],['dark','ダーク']].map(([k,l])=>`<button data-m="${k}" class="${p.m===k?'on':''}" role="radio" aria-checked="${p.m===k}">${TH_IC[k]}${l}</button>`).join('')}</div>
    <p class="tk-note" style="margin-top:8px">「自動」はスマホの設定（ライト／ダーク）に合わせます。</p>
    <div class="sec-title">カラー</div>
    <div class="th-grid" role="radiogroup" aria-label="カラー">${TH_LIST.map(t=>`<button class="th-sw${p.t===t.k?' on':''}" data-t="${t.k}" role="radio" aria-checked="${p.t===t.k}">
      <span class="th-dot" style="background:radial-gradient(circle at 32% 28%,rgba(255,255,255,.75),rgba(255,255,255,0) 34%),linear-gradient(145deg,${t.c[0]},${t.c[1]} 55%,${t.c[2]})"></span>
      <span><b>${t.n}</b><small>${t.d}</small></span><span class="th-check">${TH_IC.check}</span></button>`).join('')}</div>
    <div class="card th-preview"><div class="sec-sub">プレビュー</div><div class="gw-bar lg"><i style="width:62%"></i></div>
      <button class="btn btn-gold btn-block" style="margin-top:10px" tabindex="-1">今日のレッスンを始める ${ICONS.arrowRight}</button></div>`;
  document.getElementById('th-back').onclick=()=>go('profile');
  el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const q=thPrefs();q.m=b.dataset.m;thSave(q);thApply(q);sfx('tap');themeOpen()});
  el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const q=thPrefs();q.t=b.dataset.t;thSave(q);thApply(q);sfx('tap');themeOpen()});
  window.scrollTo(0,0);
}
// Profile の「設定とデータ」に入口
document.addEventListener('DOMContentLoaded',()=>{
  if(typeof renderProfile!=='function')return;
  const _rp=renderProfile;
  renderProfile=function(){
    const r=_rp.apply(this,arguments);
    const scr=document.getElementById('screen-profile');
    if(scr&&!scr.querySelector('#th-entry')){
      const p=thPrefs(),t=TH_LIST.find(x=>x.k===p.t);
      const b=document.createElement('button');b.className='card bk-entry';b.id='th-entry';
      b.innerHTML=`<span class="tk-mode-ic">${TH_IC.palette}</span><span class="bk-entry-b"><span class="tk-row-t">テーマとカラー</span><span class="tk-row-s">${t.n} · ${{auto:'自動',light:'ライト',dark:'ダーク'}[p.m]}</span></span><span>${ICONS.arrowRight}</span>`;
      b.onclick=themeOpen;scr.appendChild(b);
    }
    return r;
  };
});
