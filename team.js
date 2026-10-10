/* ========== チーム（仲間と一緒に続ける） ==========
   ・サーバーあり（Netlify Functions ＋ Blobs の無料枠）：チームを作る→招待リンクをLINEで送る→ワンタップで参加
   ・学習記録（日ごとの学習時間・推定スコア・連続日数・Spark の姿）は自動で同期
   ・ツムツム風ランキング：今日のがんばり／今週／先週。前日1〜3位と、週の順位でコインがもらえる
   ・応援を送ると、相手がアプリを開いたときに Spark が伝える。チームの出来事がフィードに流れる
   ・送るのは表示名と学習の数字だけ。サーバー側でも入力を検査する
   habit.js / spark.js / closet.js の後に読み込む。 */
'use strict';

const TM_API='/api/team';
const TM_DAY_REWARD=[30,15,10],TM_WEEK_REWARD=[150,80,50],TM_WEEK_JOIN=20;
const tmRand=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>'abcdefghijklmnopqrstuvwxyz0123456789'[b%36]).join('');
function tm(){const t=PROG.team||(PROG.team={});if(!t.id||!/^[a-z0-9]{6,16}$/.test(t.id))t.id=tmRand(10);if(!t.key)t.key=tmRand(24);t.claimed=t.claimed||{};return t}
const tmYmd=d=>typeof ymd==='function'?ymd(d):d.toISOString().slice(0,10);
function tmDayShift(n){const d=new Date();d.setDate(d.getDate()+n);return tmYmd(d)}
function tmWeekStart(off){const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7)+7*(off||0));return tmYmd(d)}
function tmWeekDays(off){const s=new Date(tmWeekStart(off)+'T00:00');return Array.from({length:7},(_,i)=>{const d=new Date(s);d.setDate(d.getDate()+i);return tmYmd(d)})}
function tmMember(){
  const t=tm(),sec=(PROG.hb&&PROG.hb.sec)||{},days={};
  for(let i=20;i>=0;i--){const k=tmDayShift(-i);if(sec[k])days[k]=Math.round(sec[k]/60)}
  const sp=typeof spkSpecies==='function'?spkSpecies():null;
  return{id:t.id,key:t.key,n:t.name||(PROG.spk&&PROG.spk.nick?PROG.spk.nick+'の相棒':'わたし'),s:sp?sp.id:'',g:typeof spkStage==='function'?spkStage().n:1,
    w:(PROG.spk&&PROG.spk.wear)||{},e:typeof p6Est==='function'?p6Est().score:0,k:getStreak(),days};
}
async function tmApi(body){
  const r=await fetch(TM_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...body,member:tmMember()})});
  const j=await r.json().catch(()=>({error:'network'}));if(!r.ok)throw Object.assign(new Error(j.error||'error'),{code:j.error});return j;
}
const TM_ERR={not_found:'そのコードのチームが見つかりません',full:'このチームは満員です（20人まで）',forbidden:'このチームのデータを更新できませんでした',not_member:'チームから外れています',network:'通信できませんでした。電波のよい所でもう一度'};
const tmErr=e=>TM_ERR[e&&e.code]||TM_ERR.network;

/* ---------- 同期 ---------- */
let tmBusy=false;
async function tmSync(o){
  const t=tm();if(!t.code||tmBusy)return null;
  if(!(o&&o.force)&&t.syncAt&&Date.now()-t.syncAt<180000&&!(o&&o.ev))return t.board;
  tmBusy=true;
  try{
    const ev=(o&&o.ev)||t.pendingEv||'';
    const b=await tmApi({action:'sync',code:t.code,ev,day:todayStr()});
    t.pendingEv='';t.board=b;t.syncAt=Date.now();commit();
    if(b.inbox&&b.inbox.length){const names=[...new Set(b.inbox.map(x=>x.n))].slice(0,3).join('さん、');
      setTimeout(()=>{sparkSay&&sparkSay(`${names}さんから応援が届いたよ！`,'Your team is cheering you on!','win',{force:true,ms:5200});spkCoin&&spkCoin(3*b.inbox.length,'応援が届いた')},1200)}
    tmRewards(b);
    return b;
  }catch(e){if(e.code==='not_found'||e.code==='not_member'){t.code='';t.board=null;commit()}return null}
  finally{tmBusy=false}
}
// ツムツム風のごほうび：昨日のがんばり1〜3位、先週の順位
function tmRank(members,dates){return members.map(m=>({...m,sc:dates.reduce((a,d)=>a+((m.days||{})[d]||0),0)})).filter(m=>m.sc>0).sort((a,b)=>b.sc-a.sc)}
function tmRewards(b){
  const t=tm();if(!b||!b.members||b.members.length<2)return;
  const y=tmDayShift(-1),dk='d:'+y;
  if(!t.claimed[dk]){t.claimed[dk]=1;const r=tmRank(b.members,[y]),i=r.findIndex(m=>m.id===t.id);
    if(r.length>=2&&i>=0&&i<3)setTimeout(()=>{spkCoin(TM_DAY_REWARD[i],`昨日のがんばり ${i+1}位`);sparkSay(`昨日のチームで ${i+1}位！${i===0?'いちばん頑張ったね':'いい順位！'}`,'Great work yesterday!','win',{force:true})},2600)}
  const ws=tmWeekStart(-1),wk='w:'+ws;
  if(!t.claimed[wk]&&b.members.some(m=>(m.joined||0)<new Date(tmWeekStart(0)+'T00:00').getTime())){
    t.claimed[wk]=1;const r=tmRank(b.members,tmWeekDays(-1));
    if(r.length>=2)setTimeout(()=>tmWeekResult(r),3400);
  }
  commit();
}
function tmWeekResult(r){
  const t=tm(),i=r.findIndex(m=>m.id===t.id),coin=i<0?0:i<3?TM_WEEK_REWARD[i]:TM_WEEK_JOIN;
  const pod=[r[1],r[0],r[2]].map((m,k)=>m?`<div class="tm-pod p${[2,1,3][k]}"><div class="tm-spk">${tmSpark(m)}</div><div class="tm-pod-n">${esc(m.n)}</div><div class="tm-pod-bar">${[2,1,3][k]}</div></div>`:'<div class="tm-pod"></div>').join('');
  const ov=document.createElement('div');ov.className='spk-evo';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','先週のランキング結果');
  ov.innerHTML=`<div class="spk-evo-in"><div class="spk-evo-k">Weekly Ranking</div><div class="spk-evo-t">先週のランキング発表！</div>
    <div class="tm-podium">${pod}</div>
    <div class="tm-res-me">${i<0?'先週は記録がありませんでした。今週は一緒に！':`あなたは <b>${i+1}位</b>（${r[i].sc}分）`}</div>
    ${coin?`<div class="spk-evo-m">${SPK_COIN_SVG} ${coin}コイン ゲット！</div>`:'<div class="spk-evo-m">今週もランキングに参加しよう。</div>'}
    <button class="btn btn-gold btn-block spk-evo-ok">今週もがんばる！</button></div>`;
  document.body.appendChild(ov);requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('on','done')));
  if(i===0&&typeof launchConfetti==='function')launchConfetti();
  ov.querySelector('.spk-evo-ok').onclick=()=>{ov.remove();if(coin)spkCoin(coin,`先週のランキング ${i+1}位`)};
}

/* ---------- 画面 ---------- */
function tmSpark(o){
  if(typeof sparkSVG!=='function')return'';
  const st=SPK_STAGES[(o.g||1)-1]||SPK_STAGES[0];
  if(st.n===1||!o.s)return spkEggSVG('hello',0.3);
  return sparkSVG(st,'hello',SPK_SPECIES.find(x=>x.id===o.s),o.w||{});
}
function tmAgo(ts){const m=Math.floor((Date.now()-ts)/60000);return m<2?'たった今':m<60?m+'分前':m<1440?Math.floor(m/60)+'時間前':Math.floor(m/1440)+'日前'}
const TM_FEED={join:f=>`${esc(f.who)}さんがチームに参加`,goal:f=>`${esc(f.who)}さんが今日の目標をクリア 🎉`,cheer:f=>`${esc(f.who)}さんが${esc(f.to)}さんを応援 ⚡`,hatch:f=>`${esc(f.who)}さんのSparkが生まれた 🥚`,evolve:f=>`${esc(f.who)}さんのSparkが進化 ✨`,leave:f=>`${esc(f.who)}さんがチームを抜けました`};
let tmView='day';
function openTeam(){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  const el=document.getElementById('screen-review');el.classList.add('active');window.scrollTo(0,0);
  const t=tm();
  if(!t.code)return tmStartScreen(el);
  tmBoard(el);
  tmSync({force:true}).then(b=>{if(b&&document.getElementById('tm-root'))tmBoard(el)});
}
function tmStartScreen(el,joinCode,err){
  const t=tm();
  el.innerHTML=`<div class="back-row"><button class="icon-btn" id="tm-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>チーム</h2></div>
    <div class="card tm-start" id="tm-root">
      <div class="tm-head-n">仲間と一緒に続けよう</div>
      <div class="hb-note">チームの仲間と、今日・今週の学習時間でランキング。上位になるとコインがもらえます。応援も送り合えます。</div>
      <label class="hb-f">あなたの表示名<input id="tm-name" maxlength="12" value="${esc(t.name||'')}" placeholder="例：ゆう"></label>
      ${joinCode?`<label class="hb-f">招待コード<input id="tm-code" maxlength="6" value="${esc(joinCode)}" autocapitalize="characters"></label><button class="btn btn-gold btn-block" id="tm-join" style="margin-top:12px">このチームに参加する</button>`
      :`<label class="hb-f">チーム名（作る場合）<input id="tm-tname" maxlength="16" placeholder="例：650点チーム"></label>
      <button class="btn btn-gold btn-block" id="tm-create" style="margin-top:12px">チームを作る</button>
      <div class="tm-or">または、招待コードで参加</div>
      <div class="spk-nick-row"><input id="tm-code" maxlength="6" placeholder="6文字のコード" autocapitalize="characters" aria-label="招待コード"><button class="btn btn-secondary" id="tm-join">参加</button></div>`}
      ${err?`<div class="tm-err">${esc(err)}</div>`:''}
      <div class="hb-note" style="margin-top:12px">送るのは表示名・学習時間・推定スコア・連続日数・Sparkの姿だけです。</div>
    </div>`;
  document.getElementById('tm-back').onclick=()=>go('home');
  const nameOk=()=>{const v=document.getElementById('tm-name').value.trim().slice(0,12);if(!v){showToast('表示名を入れてください');return false}t.name=v;commit();return true};
  const run=async(btn,fn)=>{if(!nameOk())return;btn.disabled=true;btn.textContent='通信中…';
    try{const b=await fn();t.code=b.code;t.board=b;t.syncAt=Date.now();t.joinedAt=Date.now();commit();openTeam();if(typeof spkCoin==='function')spkCoin(20,'チーム結成')}
    catch(e){tmStartScreen(el,joinCode,tmErr(e))}};
  const c=document.getElementById('tm-create');
  if(c)c.onclick=()=>run(c,()=>tmApi({action:'create',name:document.getElementById('tm-tname').value}));
  const j=document.getElementById('tm-join');
  j.onclick=()=>{const code=document.getElementById('tm-code').value.trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))return showToast('6文字の招待コードを入れてください');run(j,()=>tmApi({action:'join',code}))};
}
function tmBoard(el){
  const t=tm(),b=t.board||{members:[],feed:[]},me=t.id;
  const members=b.members.some(m=>m.id===me)?b.members.map(m=>m.id===me?{...m,...tmMember(),t:Date.now()}:m):[...b.members,{...tmMember(),t:Date.now()}];
  const dates=tmView==='day'?[todayStr()]:tmWeekDays(tmView==='week'?0:-1);
  const rows=members.map(m=>({...m,sc:dates.reduce((a,d)=>a+((m.days||{})[d]||0),0)})).sort((a,b)=>b.sc-a.sc);
  const wk=members.map(m=>tmWeekDays(0).reduce((a,d)=>a+((m.days||{})[d]||0),0)),totalH=wk.reduce((a,x)=>a+x,0)/60,goalH=(t.goalH||5)*members.length;
  const reward=tmView==='day'?`明日、今日の 1位 ${TM_DAY_REWARD[0]}・2位 ${TM_DAY_REWARD[1]}・3位 ${TM_DAY_REWARD[2]} コイン`:tmView==='week'?`週が明けたら 1位 ${TM_WEEK_REWARD[0]}・2位 ${TM_WEEK_REWARD[1]}・3位 ${TM_WEEK_REWARD[2]}・参加 ${TM_WEEK_JOIN} コイン`:'先週の結果';
  el.innerHTML=`<div id="tm-root"><div class="back-row"><button class="icon-btn" id="tm-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>チーム</h2></div>
    <div class="card tm-head"><div class="tm-head-n">${esc(b.name||'チーム')}</div>
      <div class="tm-code">招待コード <b>${esc(t.code)}</b></div>
      <button class="btn btn-gold btn-block" id="tm-invite" style="margin-top:10px">仲間を招待する（LINEなど）</button></div>
    <div class="tm-seg">${[['day','今日のがんばり'],['week','今週'],['last','先週']].map(([k,l])=>`<button class="${k===tmView?'on':''}" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="tm-reward">${SPK_COIN_SVG}<span>${reward}</span></div>
    <div class="tm-list">${rows.map((r,i)=>`<div class="card tm-row${r.id===me?' me':''}">
      <div class="tm-rank${r.sc&&i<3?' r'+(i+1):''}">${r.sc?i+1:'–'}</div><div class="tm-spk">${tmSpark(r)}</div>
      <div class="tm-b"><b>${esc(r.n)}${r.id===me?' <small>（自分）</small>':''}</b><span>推定${r.e}点 · 連続${r.k}日</span><small>${r.id===me?'自動で同期中':'更新：'+tmAgo(r.t||0)}</small></div>
      <div class="tm-score">${r.sc}<small>分</small></div>
      ${r.id===me?'':`<button class="icon-btn tm-cheer" data-cheer="${esc(r.id)}" data-n="${esc(r.n)}" aria-label="${esc(r.n)}さんを応援">${ICONS.zap}</button>`}</div>`).join('')}</div>
    ${members.length<2?'<div class="hb-note" style="text-align:center">まだひとりです。招待リンクを送って、仲間を呼ぼう。</div>':''}
    <div class="card tm-total" style="margin-top:12px"><div class="gw-q-h"><span>${ICONS.zap} 今週のチーム合計</span><span class="gw-q-meta">${members.length}人</span></div>
      <div class="tm-total-n"><b>${totalH.toFixed(1)}</b>時間 <small>/ 目標 ${goalH}時間</small></div>
      <div class="hb-bar-track"><i style="width:${Math.min(100,totalH/Math.max(1,goalH)*100).toFixed(1)}%"></i></div></div>
    ${b.feed&&b.feed.length?`<div class="card tm-feed"><div class="p6-k" style="border:none;padding:0">チームの出来事</div>${b.feed.slice(-12).reverse().map(f=>TM_FEED[f.type]?`<div><span>${TM_FEED[f.type](f)}</span><small>${tmAgo(f.t)}</small></div>`:'').join('')}</div>`:''}
    <div class="card tm-me">
      <label class="hb-f">あなたの表示名<input id="tm-name" maxlength="12" value="${esc(t.name||'')}"></label>
      <label class="hb-f">ひとりあたりの週の目標<select id="tm-goal">${[3,5,7,10].map(h=>`<option value="${h}" ${h===(t.goalH||5)?'selected':''}>${h}時間</option>`).join('')}</select></label>
      <button class="btn btn-secondary btn-block" id="tm-leave" style="margin-top:10px">チームを抜ける</button>
    </div></div>`;
  document.getElementById('tm-back').onclick=()=>go('home');
  el.querySelectorAll('[data-v]').forEach(x=>x.onclick=()=>{tmView=x.dataset.v;tmBoard(el)});
  document.getElementById('tm-invite').onclick=tmInvite;
  document.getElementById('tm-name').onchange=e=>{const v=e.target.value.trim().slice(0,12);if(v){t.name=v;commit();tmSync({force:true})}};
  document.getElementById('tm-goal').onchange=e=>{t.goalH=+e.target.value;commit();tmBoard(el)};
  document.getElementById('tm-leave').onclick=async()=>{if(!confirm('チームを抜けますか？（もう一度参加するには招待コードが必要です）'))return;try{await tmApi({action:'leave',code:t.code})}catch(e){}t.code='';t.board=null;commit();openTeam()};
  el.querySelectorAll('[data-cheer]').forEach(x=>x.onclick=async()=>{x.disabled=true;try{await tmApi({action:'cheer',code:t.code,to:x.dataset.cheer});showToast(`${x.dataset.n}さんに応援を送りました ⚡`);sfx('correct')}catch(e){showToast(tmErr(e))}});
}
async function tmInvite(){
  const t=tm(),url=location.origin+location.pathname+'#join='+t.code;
  const text=`Sparkleで一緒に英語を続けよう！ チーム「${(t.board&&t.board.name)||'チーム'}」の招待コードは ${t.code} です。リンクを開くと参加できます👇\n`;
  if(navigator.share){try{await navigator.share({title:'Sparkle チームへの招待',text,url});return}catch(e){if(e&&e.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(text+url);showToast('招待文をコピーしました。LINEなどに貼り付けて送ってね')}catch(e){showToast('コード：'+t.code)}
}
// 招待リンク（#join=コード）から開いたとき
function tmReceive(){
  const m=location.hash.match(/^#join=([A-Za-z2-9]{6})$/);if(!m)return;
  history.replaceState(null,'',location.pathname+location.search);
  const code=m[1].toUpperCase(),t=tm();
  if(t.code===code)return openTeam();
  if(t.code&&!confirm('別のチームに参加すると、今のチームの表示から切り替わります。参加しますか？'))return;
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  const el=document.getElementById('screen-review');el.classList.add('active');tmStartScreen(el,code);
}
function tmHomeHTML(){
  const t=tm();
  if(!t.code)return`<button class="card tm-home" id="tm-home"><span class="tm-home-ic">${ICONS.user}</span><span class="tm-home-b"><b>仲間と一緒に続ける</b><small>チームで今日のがんばりランキング。上位はコインがもらえる</small></span><span>${ICONS.arrowRight}</span></button>`;
  const b=t.board||{members:[]},ms=b.members.map(m=>m.id===t.id?{...m,...tmMember()}:m);if(!ms.some(m=>m.id===t.id))ms.push(tmMember());
  const r=ms.map(m=>({...m,sc:(m.days||{})[todayStr()]||0})).sort((a,b)=>b.sc-a.sc),i=r.findIndex(m=>m.id===t.id);
  return`<button class="card tm-home" id="tm-home"><span class="tm-home-ic">${ICONS.user}</span><span class="tm-home-b"><b>${esc(b.name||'チーム')} · 今日のがんばり ${r[i].sc?(i+1)+'位':'まだ0分'}/${r.length}人</b><small>${r[0]&&r[0].sc?'1位：'+esc(r[0].n)+'（'+r[0].sc+'分）':'今日の1位はまだいません。いちばん乗りしよう'}</small></span><span>${ICONS.arrowRight}</span></button>`;
}
function tmInstall(){
  const _rh=renderHome;
  renderHome=function(){
    const r=_rh.apply(this,arguments);
    const home=document.getElementById('screen-home'),focus=home&&home.querySelector('.focus-card');
    if(focus&&!home.querySelector('#tm-home')){focus.insertAdjacentHTML('afterend',tmHomeHTML());document.getElementById('tm-home').onclick=openTeam}
    if(tm().code)tmSync().then(b=>{if(b&&curTab==='home'){const c=document.getElementById('tm-home');if(c){c.outerHTML=tmHomeHTML();document.getElementById('tm-home').onclick=openTeam}}});
    return r;
  };
  // 今日の目標クリア・孵化・進化はチームのフィードに流す
  const _mp=markPlanTaskDone;
  markPlanTaskDone=function(){const r=_mp.apply(this,arguments);if(tm().code&&typeof hbSplit==='function'&&p6Ready()&&hbSplit().coreDone)tmSync({ev:'goal'});return r};
  if(typeof sparkHatch==='function'){const _h=sparkHatch;sparkHatch=function(){tm().pendingEv='hatch';return _h.apply(this,arguments)}}
  if(typeof sparkEvolve==='function'){const _e=sparkEvolve;sparkEvolve=function(){tm().pendingEv='evolve';return _e.apply(this,arguments)}}
  // 学習のあとアプリを閉じるときにも同期
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&tm().code)tmSync()});
  window.addEventListener('hashchange',tmReceive);
  const _sa=startApp;startApp=function(){const r=_sa.apply(this,arguments);setTimeout(tmReceive,600);return r};
  if(typeof curTab!=='undefined'&&curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome();
}
if(typeof go==='function')tmInstall();
