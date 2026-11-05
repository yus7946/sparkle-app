/* ========== TOEIC 650 コース（26週のカリキュラム） ==========
   「今日なにをやればいいか」を1つに絞るための仕組み。
   ・26週を4フェーズに分け、週ごとにテーマ（例：Week 3「動詞の形」）と「できるようになること」を決める
   ・毎日のレッスンは3ステップ・約15〜20分で固定：① 単語 → ② 今週のテーマのパート練習 → ③ 耳と口（シャドーイング・話す）
     土曜は模試（間隔はフェーズで変える）か弱点集中、日曜はミスノートで週のまとめ
   ・試験日を設定していれば、その日までの日数に26週を伸び縮みさせて当てはめる（未設定なら今日から182日）
   ・ホームの「今日」カードをこのレッスンだけにし、ほかの機能は下の「自由に練習」にまとめる
   いちばん最後に読み込む（planTasksForToday・ホームの表示を上書きする）。 */
'use strict';

// [フェーズ, 今週のメイン練習, テーマ, できるようになること]
const CO_WEEKS=[
  [1,'p5','品詞を見分ける','名詞・動詞・形容詞・副詞を語尾で見分けられる'],
  [1,'p1','写真描写の基本','人の動作（is ~ing）を聞き取れる'],
  [1,'p5','動詞の形（時制・受動態）','時を表す語から正しい時制を選べる'],
  [1,'p2','疑問詞で始まる質問','Who / When / Where の質問に答えを選べる'],
  [1,'p5','前置詞と接続詞','despite と although の違いがわかる'],
  [1,'p2','Yes/No・依頼・提案の質問','遠回しな答えでも正解を選べる'],
  [1,'p1','物の状態と位置','has been placed などの受け身を聞き取れる'],
  [1,'p5','代名詞・関係詞','who / which / whose を選べる'],
  [2,'p3','設問の先読み','3つの設問を15秒で読める'],
  [2,'p3','次に何をするか','会話の最後の発言から答えを選べる'],
  [2,'p4','アナウンス・電話メッセージ','話の目的と依頼を聞き取れる'],
  [2,'p3','3人の会話と意図問題','発言の意図を前後の流れで選べる'],
  [2,'p4','図表問題','図と音声を照らし合わせて解ける'],
  [2,'p2','Part 2 の総仕上げ','音声だけで正答率70%'],
  [3,'p6','文脈で選ぶ時制・つなぎ言葉','however / therefore を文脈で選べる'],
  [3,'p7','メール・お知らせ','「目的は何か」を1分で答えられる'],
  [3,'p6','文挿入問題','前後の文から入る位置がわかる'],
  [3,'p7','言い換えを見抜く','本文と選択肢の言い換えに気づける'],
  [3,'p5','語彙問題（よく一緒に使う語）','make a decision などの組み合わせを選べる'],
  [3,'p7','ダブルパッセージ','2つの文書を照らし合わせて解ける'],
  [3,'p3','Part 3・4 総合','先読み→聞く→解くを1セット通せる'],
  [3,'p7','トリプルパッセージ','必要な文書だけ探して読める'],
  [4,'weak','弱点パート集中','いちばん低いパートを +10%'],
  [4,'mistake','ミスノートつぶし','間違えた問題を二度と落とさない'],
  [4,'p5','本番の時間配分','Part 5 を1問20秒で解ける'],
  [4,'mistake','最終調整','本番と同じ時間帯に、落ち着いて解ける']
];
const CO_PHASE={1:['基礎固め','単語と文法の土台を作る'],2:['リスニング強化','L 350点を狙える耳を作る'],3:['読解・実戦','時間内に解き切る力をつける'],4:['仕上げ','取れる問題を確実に取る']};
// 3ステップ目（耳と口）：曜日で回す
const CO_THIRD={1:'shadow',2:'sj',3:'kuse',4:'shadow',5:'sj',6:'call',0:'call'};
const CO_LABEL={vocab:['単語 10語','忘れる直前に出る復習つき',5],p1:['Part 1 写真描写',null,6],p2:['Part 2 応答問題',null,6],p3:['Part 3 会話 1セット',null,7],p4:['Part 4 説明文 1セット',null,7],
  p5:['Part 5 文法・語彙',null,8],p6:['Part 6 長文穴埋め',null,8],p7:['Part 7 読解',null,10],weak:['弱点パート集中',null,8],mistake:['ミスノート','間違えた問題を解き直す',6],mock:['模試 30問（15分）','今の推定スコアを測る',15],
  shadow:['シャドーイング 1本','聞いた英語をまねして言う',8],sj:['話すジム 3分','3秒で話し出す・言い換え・カタカナ発音',4],kuse:['クセ克服 5問','日本人がつまずく音と文法',3],call:['Spark と英語通話','日本のことを英語で話す',5]};

function co(){return PROG.course||(PROG.course={})}
function coSpan(){
  if(typeof p6Ready==='function'&&p6Ready())return p6Span();
  const c=co();if(!c.start){c.start=todayStr();commit()}
  const start=new Date(c.start+'T00:00'),now=new Date(todayStr()+'T00:00'),total=182;
  const elapsed=Math.max(0,Math.round((now-start)/864e5));
  return{start,exam:new Date(start.getTime()+total*864e5),total,elapsed,left:total-elapsed,frac:Math.min(1,elapsed/total)};
}
function coNow(){
  const sp=coSpan(),per=sp.total/CO_WEEKS.length,w=Math.min(CO_WEEKS.length-1,Math.floor(sp.elapsed/per));
  const wk=CO_WEEKS[w];
  return{sp,w,wk,ph:wk[0],day:Math.min(sp.total,sp.elapsed+1),wStart:Math.round(w*per),wEnd:Math.round((w+1)*per)};
}
function coHasMistakes(){return typeof mistakeItems==='function'&&mistakeItems().length>0}
// 今日のレッスン（3ステップ）
function coLessonActions(){
  const{wk,ph}=coNow(),dow=new Date().getDay();
  let main=wk[1];
  if(main==='mistake'&&!coHasMistakes())main='p5';
  if(dow===6){const every=typeof P6_MOCK_EVERY!=='undefined'?P6_MOCK_EVERY[ph]:21;main=typeof p6LastMockDays==='function'&&p6LastMockDays()>=every?'mock':'weak'}
  if(dow===0&&coHasMistakes())main='mistake';
  const list=['vocab',main];
  if(main!=='mock')list.push(CO_THIRD[dow]);
  return list;
}
function coTasks(){
  const{wk}=coNow(),done=PROG['plan_'+todayStr()]||[];
  return coLessonActions().map((a,k)=>{
    const L=CO_LABEL[a]||[a,'',5];let title=L[0],sub=L[1];
    if(a==='weak'&&typeof p6WeakPart==='function')title='弱点集中：Part '+p6WeakPart();
    if(!sub)sub='今週のテーマ：'+wk[2];
    const id='co_'+a+'_'+k;
    return{id,title,sub,mins:L[2],action:a,done:done.includes(id),main:k===1};
  });
}
// 今週の達成日数（3ステップ全部を終えた日）
function coWeekDays(){
  const{sp,wStart,wEnd}=coNow(),out=[];
  for(let d=wStart;d<Math.min(wEnd,wStart+7);d++){
    const date=new Date(sp.start.getTime()+d*864e5),key=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
    const done=(PROG['plan_'+key]||[]).filter(x=>String(x).startsWith('co_')).length;
    out.push({key,ok:done>=2,today:key===todayStr(),future:date>new Date(todayStr()+'T00:00')});
  }
  return out;
}

/* ---------- ホーム：今日のレッスン ---------- */
function coCardHTML(){
  const n=coNow(),t=coTasks(),next=t.find(x=>!x.done),mins=t.reduce((a,x)=>a+x.mins,0),done=t.filter(x=>x.done).length;
  const P=CO_PHASE[n.ph],days=coWeekDays();
  return`<div class="co-card" id="co-card">
    <div class="co-top"><span class="co-pill">TOEIC ${toeicTarget()} コース</span><span class="co-left">${typeof p6Ready==='function'&&p6Ready()?`試験まで <b>${Math.max(0,n.sp.left)}</b>日`:`<button class="co-link" id="co-setexam">試験日を設定</button>`}</span></div>
    <div class="co-week"><b>Week ${n.w+1}</b><small>/ ${CO_WEEKS.length} · Day ${n.day}</small></div>
    <div class="co-theme">${esc(n.wk[2])}</div>
    <div class="co-goal"><span>今週のゴール</span>${esc(n.wk[3])}</div>
    <div class="co-phase"><i style="width:${Math.round(n.sp.frac*100)}%"></i></div>
    <div class="co-phase-l"><span>フェーズ${n.ph}：${P[0]}</span><span>${days.map(d=>`<i class="co-dot${d.ok?' ok':''}${d.today?' now':''}"></i>`).join('')}</span></div>
    <div class="co-steps-h">今日のレッスン <small>${done}/${t.length} · 約${mins}分</small></div>
    <ol class="co-steps">${t.map((x,i)=>`<li><button class="co-step${x.done?' done':''}${x===next?' next':''}" data-co="${i}"><span class="co-num">${x.done?'✓':i+1}</span><span class="co-step-b"><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></span><span class="co-min">${x.mins}分</span></button></li>`).join('')}</ol>
    ${next?`<button class="btn btn-gold btn-block" id="co-start">${done?'続きから：'+esc(next.title):'今日のレッスンを始める'} ${ICONS.arrowRight}</button><div class="co-note">忙しい日は ① だけでもOK。続けることがいちばん大事。</div>`
      :`<div class="co-clear">🎉 今日のレッスン完了！ また明日。</div><button class="btn btn-secondary btn-block" id="co-more">余力があれば：復習する ${ICONS.arrowRight}</button>`}
    <button class="co-link co-all" id="co-all">カリキュラム全体を見る ${ICONS.arrowRight}</button>
  </div>`;
}
function coStartFrom(i){
  const t=coTasks(),list=t.slice(i).filter(x=>!x.done);if(!list.length)return;
  daySession={tasks:list,idx:0,active:true,startedAt:Date.now(),startXP:PROG.xp||0,round:'core'};
  runDaySessionStep();
}
function coBindCard(root){
  const s=root.querySelector('#co-start');if(s)s.onclick=()=>coStartFrom(0);
  root.querySelectorAll('[data-co]').forEach(b=>b.onclick=()=>{const i=+b.dataset.co,t=coTasks()[i];if(t.done){markPlanTaskDone(t.id);planTaskAction(t.action)}else coStartFrom(i)});
  const m=root.querySelector('#co-more');if(m)m.onclick=()=>totalDue()>0?openReview():openVocab();
  const a=root.querySelector('#co-all');if(a)a.onclick=coOpen;
  const e=root.querySelector('#co-setexam');if(e)e.onclick=()=>p6Setup(()=>go('home'));
}

/* ---------- カリキュラム全体 ---------- */
function coOpen(){
  const n=coNow(),el=document.getElementById('screen-review');
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));el.classList.add('active');
  const per=n.sp.total/CO_WEEKS.length,est=typeof p6Est==='function'?p6Est().score:null;
  let html='';
  [1,2,3,4].forEach(ph=>{
    const P=CO_PHASE[ph];
    html+=`<div class="co-ph-h"><b>フェーズ${ph}　${P[0]}</b><small>${P[1]}</small></div>`;
    CO_WEEKS.forEach((wk,i)=>{if(wk[0]!==ph)return;
      const st=i<n.w?'past':i===n.w?'now':'next',d=new Date(n.sp.start.getTime()+Math.round(i*per)*864e5);
      html+=`<div class="co-row ${st}"><span class="co-row-w">W${i+1}</span><span class="co-row-b"><b>${esc(wk[2])}</b><small>${esc(wk[3])}</small></span><span class="co-row-d">${st==='now'?'<i>今週</i>':st==='past'?'✓':(d.getMonth()+1)+'/'+d.getDate()+'〜'}</span></div>`;
    });
  });
  el.innerHTML=`<div class="back-row"><button class="icon-btn" id="co-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>TOEIC ${toeicTarget()} コース</h2></div>
    <div class="card co-sum"><div><small>いまの推定</small><b>${est!=null?est:'—'}<i>点</i></b></div><div><small>目標</small><b>${toeicTarget()}<i>点</i></b></div><div><small>進み</small><b>${n.day}<i>/${n.sp.total}日</i></b></div></div>
    <p class="tk-note">毎日のレッスンは「① 単語 → ② 今週のテーマ → ③ 耳と口」の3ステップ。土曜は模試か弱点集中、日曜はミスノートで1週間をしめくくります。</p>
    ${html}
    <button class="btn btn-secondary btn-block" id="co-road" style="margin-top:14px">ペースとチェックポイントを見る ${ICONS.arrowRight}</button>`;
  document.getElementById('co-back').onclick=()=>go('home');
  document.getElementById('co-road').onclick=()=>p6Ready()?openRoadmap():p6Setup(()=>{go('home');openRoadmap()});
  const now=el.querySelector('.co-row.now');window.scrollTo(0,0);if(now)setTimeout(()=>now.scrollIntoView({block:'center',behavior:'smooth'}),250);
}

/* ---------- ホームの整理 ---------- */
// 下の「自由に練習」にまとめる入口：[id, アイコン, ラベル]
const CO_FREE=[['call-home','📞','Spark と通話'],['sj-home-card','🗣','話すジム'],['jp-home','🇯🇵','英語ジム'],['placement-entry','🎯','レベル診断'],['audio-entry','🎧','聞き流し'],['tm-home','👥','チーム']];
function coTidyHome(){
  const home=document.getElementById('screen-home');if(!home)return;
  home.classList.add('co-tidy');
  const focus=home.querySelector('.focus-card');
  if(focus&&!focus.querySelector('#co-card')){
    const head=focus.querySelector('.focus-head');
    (head||focus.firstChild).insertAdjacentHTML(head?'afterend':'beforebegin',coCardHTML());
    coBindCard(focus);
  }
  // 「自由に練習」：元の入口は隠し、押されたら元のボタンを押す
  if(!home.querySelector('#co-free')){
    const items=CO_FREE.filter(([id])=>document.getElementById(id));
    const jpDone=typeof jp==='function'&&jp().diag.length;
    const box=document.createElement('div');box.id='co-free';
    box.innerHTML=`<div class="sec-title">自由に練習</div><div class="co-free">${items.map(([id,ic,l])=>`<button class="co-chip" data-free="${id}"><span>${ic}</span>${id==='jp-home'&&!jpDone?'英語のクセ診断':l}</button>`).join('')}</div>`;
    const goals=home.querySelector('.gw-goals');
    if(goals)goals.insertAdjacentElement('afterend',box);else home.appendChild(box);
    box.querySelectorAll('[data-free]').forEach(b=>b.onclick=()=>{const o=document.getElementById(b.dataset.free);if(o)o.click()});
    const q=home.querySelector('.gw-quests');if(q)box.insertAdjacentElement('afterend',q);
  }
}
function coInstall(){
  planTasksForToday=function(){return coTasks()};
  // ボーナスラウンドは使わない（レッスンは3ステップで完結）
  if(typeof hbSplit==='function')hbSplit=function(){const all=coTasks(),core=all;return{all,core,bonus:[],bonusLeft:[],coreDone:core.every(t=>t.done)}};
  const _rh=renderHome;renderHome=function(){const r=_rh.apply(this,arguments);try{coTidyHome()}catch(e){}return r};
  if(typeof curTab!=='undefined'&&curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome();
}
if(typeof go==='function')coInstall();
