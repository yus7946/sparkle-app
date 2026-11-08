/* ========== Sparkle Plus の購入（Stripe）・復元・解約 ==========
   サーバーは netlify/functions/plus.mjs。カード情報は Stripe の画面で入力され、アプリには届かない。
   いつから売るか：
   ・Netlify に STRIPE_SECRET_KEY が無い → これまでどおり β（全機能無料＋事前登録）
   ・sk_test_… → ?plustest=1 で開いた端末だけ購入画面（テスト）。ほかの人には見えない
   ・sk_live_… かつ legal.js の運営者情報がすべて入っている → 全員に販売開始、無料回数の制限も有効になる
   PLAN.beta はここで「販売中でない間 true」の値に置き換える。
   plan.js と legal.js のあとに読み込む。 */
'use strict';

const PY_CFG='sparkle_plus_cfg',PY_TEST='sparkle_plus_test';
const pyGet=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const pySet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const pyToday=()=>todayStr();
function plusSalesOpen(){const c=pyGet(PY_CFG,null);if(!c||!c.enabled)return false;
  if(c.mode==='live')return typeof legalReady==='function'&&legalReady();
  return pyGet(PY_TEST,false)===true}
const pyMode=()=>(pyGet(PY_CFG,null)||{}).mode||'test';
const pyPaid=()=>!!(PROG.plus&&PROG.plus.lic&&PROG.plus.until&&PROG.plus.until>=pyToday());
delete PLAN.beta;Object.defineProperty(PLAN,'beta',{configurable:true,get(){return !plusSalesOpen()}});

async function pyApi(a,data){
  const res=await fetch('/api/plus',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({a,...(data||{})})});
  let r={};try{r=await res.json()}catch(e){}
  if(!res.ok){const e=new Error(r.error||'http');e.code=r.error||'http';e.status=res.status;throw e}
  return r;
}
function pySave(r,lic){PROG.plus={lic:lic||(PROG.plus&&PROG.plus.lic),until:r.active?r.until:'',plan:r.plan,cancel:!!r.cancel,status:r.status,checked:pyToday()};commit()}
const pyYMD=s=>s?s.replace(/^(\d+)-0?(\d+)-0?(\d+)$/,'$1年$2月$3日'):'';
const pyPrice=p=>p==='y'?`年額 ¥${PLAN.price.y.toLocaleString()}`:`月額 ¥${PLAN.price.m.toLocaleString()}`;
async function pyCopy(t){try{await navigator.clipboard.writeText(t);showToast('購入コードをコピーしました')}catch(e){showToast('コードを長押ししてコピーしてください')}}
function pyErr(e){return e&&e.status===503?'いま購入の準備中です。':'通信に失敗しました。電波の良い場所でもう一度お試しください。'}

/* ---------- 状態の確認 ---------- */
async function pyRefresh(force){
  const p=PROG.plus;if(!p||!p.lic||(!force&&p.checked===pyToday()))return;
  try{const r=await pyApi('status',{license:p.lic});pySave(r)}
  catch(e){if(e.code==='bad_license'||e.code==='not_found'){p.until='';p.checked=pyToday();commit()}} // 通信エラーのときは今の状態のまま
}
// 決済のあと iPhone のホーム画面アプリに戻ると、戻り先が別の画面になることがあるので、保留中の決済を確かめる
async function pyPending(){
  const p=PROG.plusPending;if(!p||pyPaid())return;
  if(Date.now()-p.t>864e5){delete PROG.plusPending;return commit()}
  try{const r=await pyApi('verify',{sid:p.sid});if(r.license){pySave(r,r.license);delete PROG.plusPending;commit();pyDone(r.license)}else if(r.expired){delete PROG.plusPending;commit()}}catch(e){}
}
function pyDone(lic){
  if(document.getElementById('py-done'))return;
  const o=document.createElement('div');o.id='py-done';o.setAttribute('role','dialog');
  o.innerHTML=`<div class="py-done-c"><span class="rw-k">THANK YOU</span><b class="rw-h">Plus が使えるようになりました</b>
    <small>機種変更のときに使う「購入コード」です。メモかスクショで保管してください。</small>
    <code id="py-code">${esc(lic)}</code><button class="btn btn-secondary btn-block" id="py-copy">コピー</button><button class="btn btn-gold btn-block" id="py-ok">はじめる</button></div>`;
  document.body.appendChild(o);if(typeof launchConfetti==='function')launchConfetti();
  o.querySelector('#py-copy').onclick=()=>pyCopy(lic);o.querySelector('#py-ok').onclick=()=>o.remove();
}
async function pyReturn(){
  const q=new URLSearchParams(location.search),st=q.get('plus');if(!st)return;
  history.replaceState(null,'',location.pathname);
  if(st==='cancel'){delete PROG.plusPending;commit();return showToast('お申し込みは完了していません。料金はかかりません')}
  if(st==='portal')return pyRefresh(true);
  if(st!=='success')return;
  const sid=q.get('session_id');
  for(let i=0;i<4;i++){try{const r=await pyApi('verify',{sid});if(r.license){pySave(r,r.license);delete PROG.plusPending;commit();return pyDone(r.license)}}catch(e){}await new Promise(x=>setTimeout(x,1500))}
  PROG.plusPending={sid,t:Date.now()};commit();showToast('決済を確認しています。少しあとでもう一度開いてください');
}

/* ---------- Plus の画面 ---------- */
const pyLegal=()=>`<div class="py-legal"><button data-lg="tokusho">特定商取引法に基づく表記</button><span>·</span><button data-lg="terms">利用規約</button><span>·</span><button data-lg="pp">プライバシー</button></div>`;
let pySel='y';
function pyPage(from){
  const paid=pyPaid(),open=plusSalesOpen();
  if(!paid&&!open)return _pyOpen(from);
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById('screen-review');el.classList.add('active');window.scrollTo(0,0);
  const head=`<div class="back-row"><button class="icon-btn" id="pl-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>Sparkle Plus</h2></div>`;
  const test=pyMode()!=='live'?'<div class="py-test">テストモード：実際の請求は発生しません</div>':'';
  if(paid){const p=PROG.plus;
    el.innerHTML=`${head}${test}<div class="card pl-hero"><div class="pl-k">Plus 利用中</div><div class="pl-t">${pyPrice(p.plan)}</div>
        <div class="pl-s">${p.cancel?`解約済み · ${pyYMD(p.until)} まで使えます。以降の請求はありません`:`次回の更新日：${pyYMD(p.until)}（自動更新）`}${p.status==='past_due'?'<br>お支払いに失敗しています。カードをご確認ください':''}</div></div>
      <div class="card py-code-c"><b>購入コード</b><small>機種変更のときに必要です。他の人には教えないでください。</small><code>${esc(p.lic)}</code><button class="btn btn-secondary btn-block" id="py-copy">コピー</button></div>
      <button class="btn btn-secondary btn-block" id="py-portal" style="margin-top:10px">解約・お支払いの管理</button>${pyLegal()}`;
    document.getElementById('py-copy').onclick=()=>pyCopy(p.lic);
    document.getElementById('py-portal').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{const r=await pyApi('portal',{license:p.lic});location.href=r.url}catch(err){b.disabled=false;showToast(pyErr(err))}};
  }else{
    const m=pySel==='y';
    el.innerHTML=`${head}${test}<div class="card pl-hero py-hero"><div class="pl-k">For Japanese learners</div><div class="pl-t">日本人のクセを、最短で直す。</div>
        ${from?'<div class="pl-beta">今日の無料回数を使い切りました。Plus なら回数を気にせず続けられます</div>':'<div class="pl-s">続けるための機能は無料のまま。上達を早める「分析」と「量」が Plus です。</div>'}</div>
      <div class="pl-prices"><button class="card pl-price best${m?' on':''}" data-pick="y"><span class="pl-save">おすすめ · 33%おトク</span><b>年額 ¥${PLAN.price.y.toLocaleString()}</b><small>月あたり ¥${Math.round(PLAN.price.y/12)}</small></button>
        <button class="card pl-price${m?'':' on'}" data-pick="m"><b>月額 ¥${PLAN.price.m}</b><small>いつでも解約OK</small></button></div>
      <div class="py-terms"><b>${pyPrice(pySel)}（税込）· ${m?'1年':'1か月'}ごとに自動更新</b>
        <span>お支払いは申し込み時と、以後の各更新日にクレジットカードで行われます。決済後すぐに使えます。この画面からいつでも解約でき、解約後も次回更新日まで使えます（日割りの返金はありません）。</span></div>
      <button class="btn btn-gold btn-block" id="py-buy">申し込む ${ICONS.arrowRight}</button>
      <div class="hb-note" style="text-align:center">次の Stripe の画面でカードを入力します。Sparkle にカード情報は届きません。</div>
      <div class="card pl-table"><div class="pl-row pl-head"><span></span><b>無料</b><b>Plus</b></div>${PLAN_ROWS.map(r=>`<div class="pl-row"><span>${r[0]}</span><i>${r[1]}</i><i class="pl-plus">${r[2]}</i></div>`).join('')}</div>
      <details class="pl-faq"><summary>解約はどうやってしますか？</summary><p>Plus の画面の「解約・お支払いの管理」から、いつでも手続きできます。次回の更新日までは使えます。</p></details>
      <details class="pl-faq"><summary>機種変更したら？</summary><p>購入後に表示される「購入コード」を、新しい端末のこの画面の「購入コードで復元」に入れてください。</p></details>
      <details class="pl-faq"><summary>購入コードで復元</summary><div class="py-restore"><input id="py-lic" placeholder="sub_…" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="購入コード"><button class="btn btn-secondary" id="py-res">復元</button></div></details>${pyLegal()}`;
    el.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{pySel=b.dataset.pick;sfx('tap');pyPage(from)});
    document.getElementById('py-buy').onclick=async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Stripe に接続しています…';
      try{const r=await pyApi('checkout',{plan:pySel});PROG.plusPending={sid:r.sid,t:Date.now()};commit();location.href=r.url}catch(err){b.disabled=false;b.textContent='申し込む';showToast(pyErr(err))}};
    document.getElementById('py-res').onclick=async()=>{const v=document.getElementById('py-lic').value.trim();if(!v)return;
      try{const r=await pyApi('status',{license:v});if(r.active){pySave(r,v);showToast('Plus を復元しました');pyPage()}else showToast('このコードのご契約は終了しています')}catch(err){showToast(err.code==='bad_license'||err.code==='not_found'?'購入コードが正しくありません':pyErr(err))}};
  }
  document.getElementById('pl-back').onclick=()=>go('home');
  el.querySelectorAll('.py-legal [data-lg]').forEach(b=>b.onclick=()=>legalOpen(b.dataset.lg,'plus'));
}
const _pyOpen=openPlus;openPlus=pyPage;

/* ---------- 起動時 ---------- */
(function(){
  const q=new URLSearchParams(location.search);if(q.has('plustest')){pySet(PY_TEST,q.get('plustest')==='1'?true:null);history.replaceState(null,'',location.pathname)}
  // Stripe の審査などで使う公開URL：?legal=tokusho / terms / pp
  const lg=q.get('legal');
  if(['tokusho','terms','pp'].includes(lg))setTimeout(()=>{if(typeof closeOnboardSplash==='function')closeOnboardSplash();setTimeout(()=>legalOpen(lg),300)},600);
  const run=async()=>{try{const c=await pyApi('config');pySet(PY_CFG,c)}catch(e){}pyReturn();pyRefresh();pyPending()};
  if(document.readyState==='complete')setTimeout(run,800);else window.addEventListener('load',()=>setTimeout(run,800));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)pyPending()});
})();
