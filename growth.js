/* ========== SPARKLE GROWTH — 成果が見える仕組み ==========
   ・2つのゴール：TOEIC推定スコア（到達予測つき）× 旅行準備度（出発日から逆算）
   ・Can-doリスト：「できるようになったこと」を自動判定し、達成の瞬間を祝う
   ・トラベラーランク：XPでレベルと称号が上がる
   ・今週のクエスト：弱点に合わせて毎週3つ。全達成でストリーク保護
   index.html / talk.js の後に読み込まれ、それらのグローバルを使う。 */
'use strict';

/* ---------- 状態 ---------- */
function gw(){
  const g=PROG.gw||(PROG.gw={});
  g.log=g.log||[];g.cando=g.cando||{};g.snap=g.snap||{};
  return g;
}
function gwLog(k,extra){
  const g=gw();
  g.log.push(Object.assign({d:todayStr(),k},extra||{}));
  if(g.log.length>2000)g.log=g.log.slice(-2000);
  commit();gwAfterActivity();
}
function gwWeekStart(){const d=new Date();const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return ymd(d)}
function gwDaysLeftInWeek(){return 7-((new Date().getDay()+6)%7)}

/* ---------- トラベラーランク ---------- */
const GW_TITLES=[[1,'旅の準備中','Dreamer'],[5,'バックパッカー','Backpacker'],[10,'トラベラー','Traveler'],[15,'エクスプローラー','Explorer'],[20,'グローブトロッター','Globetrotter'],[30,'ワールドシチズン','World Citizen']];
function gwRank(xp){
  xp=xp==null?(PROG.xp||0):xp;
  let lv=1,need=60,rest=xp;
  while(rest>=need){rest-=need;lv++;need=60+(lv-1)*30}
  const t=GW_TITLES.filter(x=>lv>=x[0]).pop();
  const nextT=GW_TITLES.find(x=>x[0]>lv);
  return{lv,into:rest,need,pct:Math.round(rest/need*100),title:t[1],en:t[2],next:nextT?{lv:nextT[0],title:nextT[1]}:null};
}

/* ---------- TOEICゴール ---------- */
function gwToeicEst(){
  const h=PROG.scoreHist||[];const last=h[h.length-1];
  const mastery=toeicScore();
  // 45日以内の模試・診断があればそれを主に、習得状況で補正
  if(last&&Date.now()-(last.ts||0)<45*864e5)return{score:Math.round(last.score*0.7+mastery*0.3),src:last.placement?'レベル診断＋習得状況':'模試＋習得状況'};
  return{score:mastery,src:'習得状況から推定'};
}
function gwSnapshot(){
  const g=gw();const t=todayStr();
  g.snap[t]={toeic:gwToeicEst().score,travel:gwTravel().pct};
  const keys=Object.keys(g.snap).sort();
  if(keys.length>120)keys.slice(0,keys.length-120).forEach(k=>delete g.snap[k]);
  commit();
}
function gwPace(field){
  // 直近21日のスナップショットから1日あたりの伸びを出す（3日以上の幅が必要）
  const g=gw();const keys=Object.keys(g.snap).sort();if(keys.length<2)return null;
  const now=keys[keys.length-1];const lim=ymd(new Date(Date.now()-21*864e5));
  const old=keys.find(k=>k>=lim&&k<now);if(!old)return null;
  const days=(new Date(now)-new Date(old))/864e5;if(days<3)return null;
  return (g.snap[now][field]-g.snap[old][field])/days;
}
function gwFmtDate(d){return (d.getMonth()+1)+'/'+d.getDate()}
function gwToeicGoal(){
  const est=gwToeicEst();const target=toeicTarget();const remain=Math.max(0,target-est.score);
  const total=toeicAllTotal();const perItem=350/Math.max(1,total);
  const items=Math.ceil(remain/perItem);
  const pace=gwPace('toeic');
  let proj='';
  if(!remain)proj='目標スコアに到達しています！次は+50点を狙おう';
  else if(pace&&pace>0.05){const days=Math.ceil(remain/pace);const d=new Date(Date.now()+days*864e5);proj=days>365?'今のペースだと1年以上。1日の量を少し増やそう':`今のペースなら ${gwFmtDate(d)} ごろ到達（あと約${days}日）`}
  else proj='3日分の記録がたまると到達予測を表示します';
  return{score:est.score,src:est.src,target,remain,items,pct:Math.min(100,Math.round(est.score/target*100)),proj,pace};
}
function gwPartAcc(part){
  const parts=Array.isArray(part)?part:[part];
  const rows=gw().log.filter(l=>l.k==='toeic'&&parts.includes(l.part)).slice(-8);
  const t=rows.reduce((a,r)=>a+(r.t||0),0),c=rows.reduce((a,r)=>a+(r.c||0),0);
  return t>=8?{acc:c/t,n:t}:null;
}

/* ---------- 旅行ゴール ---------- */
function gwAllConvs(){const a=[];Object.keys(SCENARIOS).forEach(sid=>SCENARIOS[sid].conversations.forEach(c=>a.push({sid,id:c.id,title:c.titleJa})));return a}
function gwTravel(){
  const t=typeof talkData==='function'?talkData():{best:{},gym:{}};
  const wdw=wdwMastered()/Math.max(1,wdwTotalPhrases());
  const convs=gwAllConvs();
  const rp=convs.reduce((a,c)=>a+Math.min(100,t.best[c.id]||0),0)/(convs.length*100);
  const gyms=Object.values(t.gym||{});
  const gymAcc=gyms.length?gyms.reduce((a,s)=>a+((s.ln?s.lok/s.ln:0)+(s.sn?s.sok/s.sn:0))/((s.ln?1:0)+(s.sn?1:0)||1),0)/7:0;
  const sps=typeof TK_SPEECH!=='undefined'?TK_SPEECH.map(p=>t.best['sp_'+p.id]||0):[];
  const spk=Math.min(1,gymAcc*0.5+(sps.length?sps.filter(x=>x>=60).length/Math.min(6,sps.length):0)*0.5);
  const pct=Math.round(100*(0.4*wdw+0.45*rp+0.15*spk));
  const days=wdwDaysLeft();
  const leftPh=wdwTotalPhrases()-wdwMastered();
  const leftConv=convs.filter(c=>(t.best[c.id]||0)<75).length;
  let plan='';
  if(pct>=100)plan='準備万端！本番の旅行アシストも確認しておこう';
  else if(days>0)plan=`出発までに100%：1日 ${Math.max(1,Math.ceil(leftPh/days))}表現＋ロールプレイ${leftConv?Math.max(1,Math.ceil(leftConv/Math.max(1,days/2)))+'本':'の復習'}`;
  else plan='旅行中！困ったら Talk → 旅行アシスト';
  return{pct,days,plan,parts:[['WDWフレーズ',wdw],['ロールプレイ（75点以上で合格）',rp],['発音・スピーチ',spk]],leftPh,leftConv};
}

/* ---------- Can-doリスト ---------- */
function gwBest(id){const t=typeof talkData==='function'?talkData():{best:{}};return t.best[id]||0}
function gwCandos(){
  const conv=(id,ja)=>({id:'c_'+id,g:'travel',ja,test:()=>gwBest(id)>=75,how:'ロールプレイで75点以上',act:()=>{go('talk');const c=gwAllConvs().find(x=>x.id===id);if(c)openRoleplay(c.sid,c.id)}});
  const list=[
    conv('conv_checkin','空港でチェックインし、座席の希望を伝えられる'),
    conv('conv_immigration','入国審査の質問に落ち着いて答えられる'),
    conv('conv_checkin_hotel','ホテルにチェックインできる'),
    conv('conv_trouble_hotel','部屋のトラブルを伝えて対応を頼める'),
    conv('conv_order','レストランで飲み物と料理を注文できる'),
    conv('conv_bill','会計・割り勘・チップのやり取りができる'),
    conv('conv_attraction','アトラクションの待ち時間や条件を質問できる'),
    conv('conv_photo','写真撮影を頼んだり頼まれたりできる'),
    conv('conv_shopping','お店でサイズや値段を聞いて買い物できる'),
    conv('conv_return','返品・交換を頼める'),
    conv('conv_emergency','緊急時に助けを求められる'),
    conv('conv_medical','体調や症状を医者に説明できる'),
    conv('conv_kickoff','英語の会議で自己紹介と議題の確認ができる'),
    conv('conv_deadline','締切や進捗について英語で交渉できる'),
    {id:'s_speech',g:'travel',ja:'1分間、止まらずに英語で話し続けられる',test:()=>typeof TK_SPEECH!=='undefined'&&TK_SPEECH.some(p=>gwBest('sp_'+p.id)>=60),how:'1分スピーチで60点以上',act:()=>{go('talk');renderSpeechList()}},
    {id:'s_lr',g:'travel',ja:'L と R を聞き分けられる',test:()=>{const s=(talkData().gym||{}).lr;return s&&s.ln>=10&&s.lok/s.ln>=0.8},how:'発音ジム L/R 聞き分けで80%',act:()=>{go('talk');startGym('lr','listen')}},
    {id:'s_say',g:'travel',ja:'苦手な音（L/R・TH など）を言い分けられる',test:()=>Object.values(talkData().gym||{}).some(s=>s.sn>=6&&s.sok/s.sn>=0.7),how:'発音ジムの言い分けで70%',act:()=>{go('talk');renderGym()}},
    {id:'t_vocab',g:'toeic',ja:'650点レベルの頻出語彙を半分以上覚えた',test:()=>tierTotal(2)&&tierMastered(2)/tierTotal(2)>=0.5,how:'単語セッションで銀レベルを進める',act:()=>openVocab()},
    {id:'t_p5',g:'toeic',ja:'Part 5 の文法問題を8割正解できる',test:()=>{const a=gwPartAcc(5);return a&&a.acc>=0.8},how:'Part 5 を直近で正答率80%',act:()=>openTOEICPart(5)},
    {id:'t_p2',g:'toeic',ja:'Part 2 の応答問題を7割正解できる',test:()=>{const a=gwPartAcc(2);return a&&a.acc>=0.7},how:'Part 2 を直近で正答率70%',act:()=>openTOEICPart(2)},
    {id:'t_p34',g:'toeic',ja:'Part 3/4 の会話・アナウンスを聞いて7割正解できる',test:()=>{const a=gwPartAcc([3,4]);return a&&a.acc>=0.7},how:'Part 3・4 を直近で正答率70%',act:()=>openTOEICPart(3)},
    {id:'t_p7',g:'toeic',ja:'Part 7 の長文を読んで7割正解できる',test:()=>{const a=gwPartAcc(7);return a&&a.acc>=0.7},how:'Part 7 を直近で正答率70%',act:()=>openTOEICPart(7)},
    {id:'t_650',g:'toeic',ja:'模試で推定650点を超えた',test:()=>(PROG.scoreHist||[]).some(h=>!h.placement&&h.score>=650),how:'模試モードで650点以上',act:()=>startMock()}
  ];
  WDW_CATS.forEach(c=>{const n=(WDW_PHRASES[c.id]||[]).length;list.push({id:'w_'+c.id,g:'wdw',ja:`WDW「${c.ja}」の英語がわかる`,test:()=>n&&wdwCatMastered(c.id)/n>=0.8,how:'表現の8割を習得',act:()=>openWDWCat(c.id)})});
  return list;
}
function gwCheckCandos(silent){
  const g=gw();const fresh=[];
  gwCandos().forEach(c=>{if(g.cando[c.id])return;let ok=false;try{ok=!!c.test()}catch(e){}if(ok){g.cando[c.id]=todayStr();fresh.push(c)}});
  if(fresh.length){commit();if(!silent)fresh.forEach(c=>gwCelebrate({icon:'check',kicker:'Can-do unlocked',title:'できるようになった！',body:c.ja}))}
  return fresh;
}

/* ---------- 今週のクエスト ---------- */
const GW_QUESTS={
  rp:{ja:'ロールプレイで{n}回話す',n:15,cat:'話す',count:ws=>gwTalkCount('rp',ws),go:()=>{go('talk');tkPlanRoleplay()}},
  sp:{ja:'1分スピーチに{n}回挑戦',n:2,cat:'話す',count:ws=>gwTalkCount('sp',ws),go:()=>{go('talk');renderSpeechList()}},
  gym:{ja:'発音ジムを{n}セット',n:3,cat:'話す',count:ws=>gwTalkCount('gym',ws),go:()=>{go('talk');renderGym()}},
  listen:{ja:'リスニング（Part 1〜4）を{n}セット',n:4,cat:'TOEIC',count:ws=>gw().log.filter(l=>l.d>=ws&&l.k==='toeic'&&l.part<=4).length,go:()=>openTOEICPart(2)},
  read:{ja:'Part 5〜7 を{n}セット',n:4,cat:'TOEIC',count:ws=>gw().log.filter(l=>l.d>=ws&&l.k==='toeic'&&l.part>=5).length,go:()=>openTOEICPart(5)},
  vocab:{ja:'単語セッションを{n}回',n:5,cat:'TOEIC',count:ws=>gw().log.filter(l=>l.d>=ws&&l.k==='vocab').length,go:()=>openVocab()},
  mock:{ja:'模試を1回受けて実力を測る',n:1,cat:'TOEIC',count:ws=>gw().log.filter(l=>l.d>=ws&&l.k==='mock').length,go:()=>startMock()},
  days:{ja:'{n}日学習する',n:5,cat:'習慣',count:ws=>Object.keys(PROG.xpDaily||{}).filter(d=>d>=ws&&PROG.xpDaily[d]>0).length,go:()=>startDaySession()},
  review:{ja:'復習デッキを{n}回やる',n:3,cat:'習慣',count:ws=>gw().log.filter(l=>l.d>=ws&&l.k==='review').length,go:()=>openReview()},
  note:{ja:'表現ノートの言い直しドリルを{n}回',n:2,cat:'習慣',count:ws=>gwTalkCount('note',ws),go:()=>{go('talk');renderNotes()}}
};
function gwTalkCount(k,ws){return typeof talkData==='function'?talkData().log.filter(l=>l.d>=ws&&l.k===k).length:0}
function gwQuests(){
  const g=gw();const ws=gwWeekStart();
  if(!g.q||g.q.week!==ws){
    const wn=Math.floor(new Date(ws)/(7*864e5));
    const speak=['rp','gym','rp','sp'][wn%4];
    const la=gwPartAcc([1,2,3,4]),ra=gwPartAcc([5,6,7]);
    const toeic=wn%4===3?'mock':(la&&ra?(la.acc<=ra.acc?'listen':'read'):['listen','vocab','read'][wn%3]);
    const habit=['days','review','note'][wn%3];
    g.q={week:ws,ids:[speak,toeic,habit],done:[],bonus:false};commit();
  }
  return g.q.ids.map(id=>{const d=GW_QUESTS[id];const cur=Math.min(d.n,d.count(ws));return{id,...d,title:d.ja.replace('{n}',d.n),cur,done:g.q.done.includes(id)}});
}
function gwCheckQuests(){
  const g=gw();const qs=gwQuests();let any=false;
  qs.forEach(q=>{if(q.cur>=q.n&&!g.q.done.includes(q.id)){g.q.done.push(q.id);any=true;addXP('quest_clear');showToast('クエスト達成！ '+q.title)}});
  if(any&&!g.q.bonus&&g.q.done.length>=qs.length){
    g.q.bonus=true;PROG.streakFreezes=(PROG.streakFreezes||0)+1;addXP('quest_all');
    gwCelebrate({icon:'award',kicker:'Weekly quests complete',title:'今週のクエスト全クリア！',body:'ごほうびにストリーク保護を1個プレゼント。来週もこの調子で。'});
  }
  if(any){
    commit();
    // ホーム表示中ならクエストカードを最新に
    const home=document.getElementById('screen-home');
    if(home&&home.classList.contains('active'))renderHome();
  }
}

/* ---------- お祝い演出（キュー） ---------- */
let gwQueue=[],gwShowing=false;
function gwCelebrate(o){
  // レベルアップが連続したら最新だけ見せる
  if(o.lv)gwQueue=gwQueue.filter(x=>!x.lv);
  gwQueue.push(o);
  if(!gwShowing){gwShowing=true;setTimeout(gwNextCelebrate,700)}
}
function gwNextCelebrate(){
  const o=gwQueue.shift();if(!o){gwShowing=false;return}
  gwShowing=true;
  const ov=document.createElement('div');ov.className='gw-cele';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  ov.innerHTML=`<div class="gw-cele-card"><div class="gw-cele-ic">${ICONS[o.icon]||ICONS.star}</div><div class="gw-cele-k">${esc(o.kicker)}</div><div class="gw-cele-t">${esc(o.title)}</div><div class="gw-cele-b">${esc(o.body)}</div><button class="btn btn-gold btn-block" id="gw-cele-ok">OK ${ICONS.arrowRight}</button></div>`;
  document.body.appendChild(ov);
  sfx('unlock');launchConfetti();
  if(window.gsap&&!PREF_REDUCED)gsap.fromTo(ov.querySelector('.gw-cele-card'),{scale:0.85,opacity:0},{scale:1,opacity:1,duration:0.35,ease:'back.out(1.8)'});
  const close=()=>{ov.remove();setTimeout(gwNextCelebrate,250)};
  ov.querySelector('#gw-cele-ok').onclick=close;
  ov.onclick=e=>{if(e.target===ov)close()};
}
let gwAfterT=null;
function gwAfterActivity(){clearTimeout(gwAfterT);gwAfterT=setTimeout(()=>{gwCheckQuests();gwCheckCandos(false)},900)}

/* ---------- ホームのカード ---------- */
function gwHomeHTML(){
  const tg=gwToeicGoal(),tr=gwTravel();
  const qs=gwQuests();const doneN=qs.filter(q=>q.done).length;
  const goals=`<div class="gw-goals">
    <button class="gw-goal" id="gw-g-toeic" aria-label="TOEICゴールの詳細">
      <div class="gw-goal-h">${ICONS.award}<span>TOEIC</span></div>
      <div class="gw-goal-v">${tg.score}<small>/ ${tg.target}</small></div>
      <div class="gw-bar"><i style="width:${tg.pct}%"></i></div>
      <div class="gw-goal-s">${tg.remain?'あと'+tg.remain+'点':'目標達成！'}</div>
    </button>
    <button class="gw-goal" id="gw-g-travel" aria-label="旅行準備度の詳細">
      <div class="gw-goal-h">${ICONS.plane}<span>旅行準備度</span></div>
      <div class="gw-goal-v">${tr.pct}<small>%</small></div>
      <div class="gw-bar travel"><i style="width:${tr.pct}%"></i></div>
      <div class="gw-goal-s">${tr.days>=0?'出発まで '+tr.days+'日':'旅行中'}</div>
    </button>
  </div>`;
  const quests=`<div class="card gw-quests">
    <div class="gw-q-h"><span>${ICONS.zap} 今週のクエスト</span><span class="gw-q-meta">${doneN}/${qs.length} · 残り${gwDaysLeftInWeek()}日</span></div>
    ${qs.map(q=>`<button class="gw-q ${q.done?'done':''}" data-gwq="${q.id}"><span class="gw-q-cat">${q.cat}</span><span class="gw-q-body"><span class="gw-q-t">${esc(q.title)}</span><span class="gw-bar sm"><i style="width:${Math.round(q.cur/q.n*100)}%"></i></span></span><span class="gw-q-n">${q.done?ICONS.check:q.cur+'/'+q.n}</span></button>`).join('')}
    <div class="gw-q-foot">${gw().q.bonus?'✓ 今週のボーナス獲得済み':'3つ達成でストリーク保護 +1'}</div>
  </div>`;
  return{goals,quests};
}

/* ---------- ゴール詳細画面 ---------- */
function openGoals(focus){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById('screen-review');el.classList.add('active');
  gwCheckCandos(true);
  const rk=gwRank(),tg=gwToeicGoal(),tr=gwTravel(),g=gw();
  const cds=gwCandos();
  const groups=[['travel','旅行で困らない英会話',ICONS.plane],['toeic','TOEIC 650',ICONS.award],['wdw','WDW（ディズニー）',ICONS.star]];
  const parts=[[1,'P1'],[2,'P2'],[3,'P3'],[4,'P4'],[5,'P5'],[6,'P6'],[7,'P7']].map(([p,l])=>{const a=gwPartAcc(p);return{p,l,a}});
  const weakP=parts.filter(x=>x.a).sort((a,b)=>a.a.acc-b.a.acc)[0];
  const achieved=cds.filter(c=>g.cando[c.id]).length;
  el.innerHTML=`<div class="back-row"><button class="icon-btn" id="gw-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>成長の記録</h2></div>
    <div class="gw-rank">
      <div class="gw-rank-lv"><small>Lv</small>${rk.lv}</div>
      <div class="gw-rank-body"><div class="gw-rank-t">${esc(rk.title)} <span>${esc(rk.en)}</span></div>
        <div class="gw-bar"><i style="width:${rk.pct}%"></i></div>
        <div class="gw-goal-s">次のレベルまで ${rk.need-rk.into} XP${rk.next?` · Lv${rk.next.lv}で「${esc(rk.next.title)}」`:''}</div></div>
    </div>
    <section class="card gw-sec" id="gw-sec-toeic">
      <div class="gw-sec-h">${ICONS.award}<span>TOEIC ${tg.target}</span></div>
      <div class="gw-big">${tg.score}<small> / ${tg.target}</small></div>
      <div class="gw-bar lg"><i style="width:${tg.pct}%"></i></div>
      <div class="gw-goal-s">${esc(tg.src)}</div>
      <div class="gw-callout">${tg.remain?`あと <b>${tg.remain}点</b>。頻出項目をあと約 <b>${tg.items}個</b> 習得すると届く計算です（1日10個で約${Math.ceil(tg.items/10)}日）。`:'目標到達！模試で実力を確かめよう。'}<br>${esc(tg.proj)}</div>
      <div class="gw-parts">${parts.map(x=>`<div class="gw-part"><div class="gw-part-bar"><i style="height:${x.a?Math.round(x.a.acc*100):0}%"></i></div><span>${x.l}</span><small>${x.a?Math.round(x.a.acc*100)+'%':'—'}</small></div>`).join('')}</div>
      <div class="gw-goal-s" style="text-align:center">パート別の直近正答率</div>
      ${weakP?`<button class="btn btn-gold btn-block" id="gw-weak" style="margin-top:12px">弱点の Part ${weakP.p} を練習（${Math.round(weakP.a.acc*100)}%） ${ICONS.arrowRight}</button>`:`<button class="btn btn-secondary btn-block" id="gw-mock" style="margin-top:12px">模試で今の実力を測る ${ICONS.arrowRight}</button>`}
    </section>
    <section class="card gw-sec" id="gw-sec-travel">
      <div class="gw-sec-h">${ICONS.plane}<span>旅行準備度</span><span class="gw-sec-meta">${tr.days>=0?'出発まで '+tr.days+'日':'旅行中'}</span></div>
      <div class="gw-big">${tr.pct}<small>%</small></div>
      <div class="gw-bar lg travel"><i style="width:${tr.pct}%"></i></div>
      <div class="gw-break">${tr.parts.map(([l,v])=>`<div class="gw-break-row"><span>${l}</span><div class="gw-bar sm"><i style="width:${Math.round(v*100)}%"></i></div><b>${Math.round(v*100)}%</b></div>`).join('')}</div>
      <div class="gw-callout">${esc(tr.plan)}</div>
      <button class="btn btn-gold btn-block" id="gw-rp" style="margin-top:12px">${ICONS.mic} 今日のロールプレイへ ${ICONS.arrowRight}</button>
    </section>
    <div class="sec-title">${ICONS.check} Can-do リスト <span class="gw-sec-meta">${achieved} / ${cds.length}</span></div>
    <p class="gw-note">「できるようになったこと」を自動で判定します。未達成の項目はタップで練習へ。</p>
    ${groups.map(([k,label,ic])=>{const items=cds.filter(c=>c.g===k);const n=items.filter(c=>g.cando[c.id]).length;
      return `<div class="gw-cd-group"><div class="gw-cd-h">${ic}<span>${label}</span><small>${n}/${items.length}</small></div>`+
        items.map(c=>{const d=g.cando[c.id];return `<button class="gw-cd ${d?'on':''}" data-cd="${c.id}"><span class="gw-cd-box">${d?ICONS.check:''}</span><span class="gw-cd-body"><span class="gw-cd-t">${esc(c.ja)}</span><span class="gw-cd-s">${d?d.slice(5).replace('-','/')+' 達成':esc(c.how)}</span></span>${d?'':`<span class="gw-cd-go">${ICONS.arrowRight}</span>`}</button>`}).join('')+'</div>'}).join('')}`;
  document.getElementById('gw-back').onclick=()=>go('home');
  const wk=document.getElementById('gw-weak');if(wk)wk.onclick=()=>openTOEICPart(weakP.p);
  const mk=document.getElementById('gw-mock');if(mk)mk.onclick=()=>startMock();
  document.getElementById('gw-rp').onclick=()=>{go('talk');tkPlanRoleplay()};
  el.querySelectorAll('[data-cd]').forEach(b=>{const c=cds.find(x=>x.id===b.dataset.cd);if(!g.cando[c.id])b.onclick=()=>c.act();else b.disabled=true});
  window.scrollTo(0,0);
  if(focus){const s=document.getElementById('gw-sec-'+focus);if(s)setTimeout(()=>s.scrollIntoView({behavior:PREF_REDUCED?'auto':'smooth',block:'start'}),80)}
  anim('.gw-rank',{opacity:0,y:12},{opacity:1,y:0,duration:0.35,ease:'power2.out'});
}

/* ---------- 既存機能への接続 ---------- */
function gwInstall(){
  Object.assign(XP_TABLE,{quest_clear:50,quest_all:100});
  const g=gw();
  // 初回は既に達成済みのものを静かに登録（いきなり大量のお祝いを出さない）
  if(!g.seeded){gwCheckCandos(true);g.lv=gwRank().lv;g.seeded=true;commit()}
  if(g.lv==null)g.lv=gwRank().lv;
  // レベルアップ検知
  const _addXP=addXP;
  addXP=function(k){
    _addXP(k);
    const r=gwRank();const gg=gw();
    if(r.lv>(gg.lv||1)){
      const titled=GW_TITLES.find(x=>x[0]===r.lv);
      gg.lv=r.lv;commit();
      gwCelebrate({lv:r.lv,icon:'award',kicker:'Level up',title:'Lv '+r.lv+(titled?' 「'+titled[1]+'」':''),body:titled?'新しい称号を手に入れました。旅人としてひとつ上のステージへ。':'この調子！ 次の称号までもう少し。'});
      if(typeof renderHeader==='function')renderHeader();
    }
  };
  // 学習の記録（クエスト・Can-do判定用）
  const wrapAfter=(name,fn)=>{const orig=window[name];const w=function(){const r=orig.apply(this,arguments);try{fn.apply(this,arguments)}catch(e){}return r};return w};
  renderTOEICDrillResult=wrapAfter('renderTOEICDrillResult',()=>{const s=toeicDrillState;if(s)gwLog('toeic',{part:s.part,c:s.score,t:s.items.length})});
  finishMock=wrapAfter('finishMock',()=>gwLog('mock'));
  renderVocabResult=wrapAfter('renderVocabResult',()=>gwLog('vocab'));
  renderReviewDone=wrapAfter('renderReviewDone',()=>gwLog('review'));
  renderICResult=wrapAfter('renderICResult',()=>gwLog('ic'));
  if(typeof talkLog==='function'){const _tl=talkLog;talkLog=function(){_tl.apply(this,arguments);gwAfterActivity()}}
  // ヘッダーにランク
  const _rh=renderHeader;
  renderHeader=function(){
    _rh();
    const box=document.querySelector('.hdr-stats');if(!box)return;
    let pill=document.getElementById('hdr-rank');
    if(!pill){pill=document.createElement('button');pill.id='hdr-rank';pill.className='hdr-pill gw-rank-pill';pill.onclick=()=>openGoals();box.prepend(pill)}
    const r=gwRank();
    pill.setAttribute('aria-label','レベル'+r.lv+' '+r.title+'。成長の記録を開く');
    pill.innerHTML=`<span class="gw-mini-ring" style="--p:${r.pct}"></span><span>Lv${r.lv}</span>`;
  };
  // ホーム：今日のプランの直後に「2つのゴール」、その下に「今週のクエスト」
  const _home=renderHome;
  renderHome=function(){
    _home();
    const home=document.getElementById('screen-home');if(!home)return;
    gwSnapshot();
    const {goals,quests}=gwHomeHTML();
    const focus=home.querySelector('.focus-card');
    const gEl=document.createElement('div');gEl.innerHTML=goals;const gNode=gEl.firstElementChild;
    const qEl=document.createElement('div');qEl.innerHTML=quests;const qNode=qEl.firstElementChild;
    if(focus&&focus.parentNode===home){focus.after(gNode)}else home.prepend(gNode);
    const talkCard=home.querySelector('.tk-home');
    (talkCard||gNode).after(qNode);
    document.getElementById('gw-g-toeic').onclick=()=>openGoals('toeic');
    document.getElementById('gw-g-travel').onclick=()=>openGoals('travel');
    home.querySelectorAll('[data-gwq]').forEach(b=>b.onclick=()=>{const q=GW_QUESTS[b.dataset.gwq];if(q)q.go()});
    gwCheckQuests();
  };
  renderHeader();
  if(typeof curTab!=='undefined'&&curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome();
}
if(typeof go==='function')gwInstall();
