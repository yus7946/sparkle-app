/* ========== Sparkle Plus（無料版と有料級の設計） ==========
   ・無料版：毎日続けるための機能はすべて無料（メニュー・単語・ドリル・Spark・チーム）
   ・Plus：上達を早める「分析と量」（シャドーイング無制限・録音分析・本番形式の模試・クセの再診断・弱点集中）
   ・いまはβ期間：PLAN.beta=true で Plus 機能も全員無料。正式版で決済を入れるときは beta を false にするだけで
     無料回数の制限が働く（plusGate）
   ・Plus ページの「事前登録」で、正式版の需要（月額／年額の希望）をサーバーに数える（/api/interest）
   すべての学習モジュールの後に読み込む。 */
'use strict';

const PLAN={beta:true,price:{m:980,y:7800}};
const PLAN_ROWS=[
  ['毎日のメニュー・単語・Part 1〜7 ドリル','○','○'],
  ['日本人のための英語ジム（5つのクセ）','○','○'],
  ['Spark の育成・着せかえ・チーム','○','○'],
  ['シャドーイング（5ステップ）','1日1本','無制限'],
  ['録音して聞き比べ（波形・止まった回数）','1日1回','無制限'],
  ['本番形式の模試（音声のみ）','週1回','無制限'],
  ['英語のクセ再診断・変化のレポート','初回のみ','30日ごと'],
  ['Part 5 分野別の集中練習','1日1回','無制限']
];
function plusActive(){return PLAN.beta||!!(PROG.plus&&PROG.plus.until&&PROG.plus.until>=todayStr())}
// 無料の回数制限。per='day'|'week'|'month'。β中・Plus中は常に通す
function plusGate(key,limit,per,fn){
  if(plusActive())return fn();
  const u=PROG.plusUse||(PROG.plusUse={}),d=new Date(),k=per==='week'?todayStr().slice(0,8)+Math.floor((d.getDate()-1)/7):per==='month'?todayStr().slice(0,7):todayStr();
  const c=u[key]&&u[key].k===k?u[key].n:0;
  if(c<limit){u[key]={k,n:c+1};commit();return fn()}
  openPlus(key);
}
const plusBadge=()=>`<span class="plus-badge">PLUS${PLAN.beta?'・β無料':''}</span>`;

/* ---------- Plus ページ ---------- */
async function plusInterest(plan){
  PROG.plusInterest={plan,d:todayStr()};commit();
  try{await fetch('/api/interest',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({plan})})}catch(e){}
}
function openPlus(from){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById('screen-review');el.classList.add('active');window.scrollTo(0,0);
  const reg=PROG.plusInterest;
  el.innerHTML=`<div class="back-row"><button class="icon-btn" id="pl-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>Sparkle Plus</h2></div>
    <div class="card pl-hero"><div class="pl-k">For Japanese learners</div><div class="pl-t">日本人のクセを、<br>最短で直す。</div>
      <div class="pl-s">続けるための機能は、ずっと無料。<br>上達を早める「分析」と「量」が Plus です。</div>
      ${PLAN.beta?'<div class="pl-beta">いまはβ期間のため、Plus の機能もすべて無料で使えます</div>':''}
      ${from&&!PLAN.beta?'<div class="pl-beta">今日の無料回数を使い切りました。Plus なら回数を気にせず続けられます</div>':''}</div>
    <div class="card pl-table"><div class="pl-row pl-head"><span></span><b>無料</b><b>Plus</b></div>
      ${PLAN_ROWS.map(r=>`<div class="pl-row"><span>${r[0]}</span><i>${r[1]}</i><i class="pl-plus">${r[2]}</i></div>`).join('')}</div>
    <div class="pl-prices">
      <button class="card pl-price${reg&&reg.plan==='y'?' on':''}" data-plan="y"><span class="pl-save">33%おトク</span><b>年額 ¥${PLAN.price.y.toLocaleString()}</b><small>月あたり ¥${Math.round(PLAN.price.y/12)}</small></button>
      <button class="card pl-price${reg&&reg.plan==='m'?' on':''}" data-plan="m"><b>月額 ¥${PLAN.price.m}</b><small>いつでも解約できる予定</small></button>
    </div>
    <div class="hb-note" style="text-align:center">${reg?'✓ 事前登録ずみ（'+(reg.plan==='y'?'年額':'月額')+'）。正式版の準備ができたらお知らせします':'正式版はまだ準備中です。プランを選ぶと事前登録になり、料金は発生しません。'}</div>
    <button class="btn btn-secondary btn-block" id="pl-share" style="margin-top:12px">Sparkle を友だちに紹介する</button>`;
  document.getElementById('pl-back').onclick=()=>go('home');
  el.querySelectorAll('[data-plan]').forEach(b=>b.onclick=async()=>{await plusInterest(b.dataset.plan);showToast('事前登録しました。ありがとうございます！');openPlus()});
  document.getElementById('pl-share').onclick=async()=>{
    const url=location.origin+location.pathname,text='日本人の英語のクセ（L/R・カタカナ英語・冠詞…）を3分で診断して、毎日直せる英語アプリ「Sparkle」。無料で使えるよ👇\n';
    if(navigator.share){try{await navigator.share({title:'Sparkle',text,url});return}catch(e){if(e&&e.name==='AbortError')return}}
    try{await navigator.clipboard.writeText(text+url);showToast('紹介文をコピーしました')}catch(e){}
  };
}

/* ---------- 各機能への接続 ---------- */
function plInstall(){
  // 無料の回数（β中は制限なし）
  if(typeof lxShadowToday==='function'){const f=lxShadowToday;lxShadowToday=function(){return plusGate('shadow',1,'day',()=>f.apply(this,arguments))}}
  if(typeof lxRecStart==='function'){const f=lxRecStart;lxRecStart=function(){return plusGate('rec',1,'day',()=>f.apply(this,arguments))}}
  if(typeof startMock==='function'){const f=startMock;startMock=function(){return plusGate('mock',1,'week',()=>f.apply(this,arguments))}}
  if(typeof p5DrillTag==='function'){const f=p5DrillTag;p5DrillTag=function(){return plusGate('p5tag',1,'day',()=>f.apply(this,arguments))}}
  if(typeof jpDiagOpen==='function'){const f=jpDiagOpen;jpDiagOpen=function(){if(!jp().diag.length)return f.apply(this,arguments);return plusGate('diag',1,'month',()=>f.apply(this,arguments))}}
  // Plus 機能のしるし
  if(typeof lxShRender==='function'){const f=lxShRender;lxShRender=function(){const r=f.apply(this,arguments);const h=document.querySelector('.lx-rec .gw-q-h span');if(h&&!h.querySelector('.plus-badge'))h.insertAdjacentHTML('beforeend',plusBadge());return r}}
  if(typeof openRoadmap==='function'){const f=openRoadmap;openRoadmap=function(){const r=f.apply(this,arguments);const h=document.querySelector('#p5s .gw-q-h span');if(h&&!h.querySelector('.plus-badge'))h.insertAdjacentHTML('beforeend',plusBadge());return r}}
  // プロフィールに Plus の入口
  const _rp=renderProfile;
  renderProfile=function(){
    _rp.apply(this,arguments);
    const scr=document.getElementById('screen-profile');if(!scr||scr.querySelector('#pl-entry'))return;
    const b=document.createElement('button');b.className='card pl-entry';b.id='pl-entry';
    b.innerHTML=`<span class="pl-entry-ic">✦</span><span class="pl-entry-b"><b>Sparkle Plus</b><small>${PLAN.beta?'β期間中は全機能無料 · 正式版の事前登録':'分析と量で、上達を早める'}</small></span><span>${ICONS.arrowRight}</span>`;
    b.onclick=()=>openPlus();scr.prepend(b);
  };
}
if(typeof go==='function')plInstall();
