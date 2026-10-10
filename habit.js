/* ========== 続ける仕組み・650点チャレンジ記録 ==========
   ・今日のメニューを3段階に：最低ライン（5分）→ 今日の目標（約半分の時間）→ ボーナス（余力がある日だけ）
     同じ課題の重複はまとめて表示し、「全15ステップ・96分」のような重さを感じさせない
   ・本当に学習した時間を自動で計測（操作中・音声再生中だけ数える。放置やホーム画面は数えない）
   ・650点チャレンジ記録：毎日の学習時間・学習日数・推定スコアの推移・公式スコアの記録・CSVコピー
   ・毎日のリマインダーをスマホのカレンダーに登録（サーバー不要・$0で確実に通知が届く）
   index.html / plan650.js の後に読み込む。 */
'use strict';

function hb(){const d=PROG.hb||(PROG.hb={});d.sec=d.sec||{};d.est=d.est||{};d.real=d.real||[];return d}
function hbMin(day){return Math.round((hb().sec[day||todayStr()]||0)/60)}
function hbTotalH(){const s=hb().sec;return Object.keys(s).reduce((a,k)=>a+s[k],0)/3600}
function hbDays(n){const out=[];for(let i=n-1;i>=0;i--){const d=addDays(-i);out.push({d,m:hbMin(d)})}return out}

/* ---------- 学習時間の自動計測 ---------- */
let hbLastAct=Date.now(),hbUnsaved=0;
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>{hbLastAct=Date.now()},{passive:true,capture:true}));
function hbTick(){
  if(document.hidden)return;
  const ob=document.getElementById('onboarding');if(ob&&!ob.classList.contains('hidden'))return;
  const speaking='speechSynthesis'in window&&speechSynthesis.speaking;
  const home=document.getElementById('screen-home');
  if(!speaking&&(home&&home.classList.contains('active')||Date.now()-hbLastAct>90000))return;
  const d=hb(),t=todayStr();d.sec[t]=(d.sec[t]||0)+5;hbUnsaved+=5;
  if(hbUnsaved>=30){hbUnsaved=0;commit()}
}
setInterval(hbTick,5000);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&hbUnsaved){hbUnsaved=0;commit()}});

/* ---------- 今日のメニューを3段階に ---------- */
function hbBudget(){const s=p6();const w=[0,6].includes(new Date().getDay());return w?(s.we||90):(s.wd||60)}
function hbCoreMin(){return Math.min(40,Math.max(20,Math.round(hbBudget()*0.5)))}
function hbTag(tasks){
  // 目標＝違う種類の課題を優先して約半分の時間まで。残り（同じ課題の2周目など）はボーナス
  const coreMin=hbCoreMin(),core=[],bonus=[],seen=new Set();let m=0;
  tasks.forEach(t=>{if(!seen.has(t.action)&&m<coreMin){seen.add(t.action);core.push(t);m+=t.mins}else bonus.push(t)});
  // 最低ラインは5分で終わる単語（模試などの重い課題を先頭にしない）
  const vi=core.findIndex(t=>t.action==='vocab');if(vi>0)core.unshift(core.splice(vi,1)[0]);
  core.forEach((t,i)=>{t.tier='core';t.min=i===0});
  bonus.forEach(t=>{t.tier='bonus'});
  return core.concat(bonus);
}
function hbSplit(){const all=planTasksForToday();const core=all.filter(t=>t.tier!=='bonus');const bonus=all.filter(t=>t.tier==='bonus');
  return{all,core,bonus,coreDone:core.every(t=>t.done),coreMins:core.reduce((a,t)=>a+t.mins,0),bonusLeft:bonus.filter(t=>!t.done)}}
// 同じ課題をまとめる（単語 10語 ×3 など）
function hbGroup(list){const g=[];list.forEach(t=>{const x=g.find(y=>y.title===t.title);if(x){x.n++;x.mins+=t.mins;x.done+=t.done?1:0}else g.push({title:t.title,sub:t.sub,mins:t.mins,n:1,done:t.done?1:0})});return g}
function hbTaskRow(t,label){
  return `<div class="p6-task ${t.done===true||t.done===t.n?'done':''}"><span class="p6-task-m">${t.mins}分</span><span class="p6-task-b"><span class="tk-row-t">${label?`<span class="hb-min-tag">${label}</span>`:''}${esc(t.title)}${t.n>1?` <span class="hb-x">×${t.n}</span>`:''}</span><span class="tk-row-s">${esc(t.sub)}</span></span><span class="p6-task-c">${t.done===true||t.done===t.n?ICONS.check:t.n>1&&t.done?t.done+'/'+t.n:''}</span></div>`;
}
function hbMenuHTML(){
  const s=hbSplit();const doneC=s.core.filter(t=>t.done).length;
  const bg=hbGroup(s.bonus),bonusMins=s.bonus.reduce((a,t)=>a+t.mins,0);
  const btn=s.coreDone?(s.bonusLeft.length?`ボーナスラウンドを始める（+約${s.bonusLeft.reduce((a,t)=>a+t.mins,0)}分）`:'今日のメニュー完了！ 復習する'):(doneC?'今日の目標の続きから':'今日の目標を始める（約'+s.coreMins+'分）');
  return `<div class="gw-q-h"><span>${ICONS.zap} 今日のメニュー</span><span class="gw-q-meta">目標 ${doneC}/${s.core.length} · 約${s.coreMins}分</span></div>
    ${s.coreDone?`<div class="hb-clear">${ICONS.check} 今日の目標クリア！ ここから先はおまけです</div>`:''}
    <div class="hb-tier"><b>今日の目標</b><small>これをやれば今日は合格</small></div>
    ${s.core.map(t=>hbTaskRow(t,t.min?'最低ライン':'')).join('')}
    <div class="hb-note">忙しい日は「最低ライン」の1つだけでOK。ゼロの日を作らないことが、6か月続ける一番のコツです。</div>
    ${bg.length?`<details class="hb-bonus"${s.coreDone?' open':''}><summary><b>ボーナス</b><small>余力がある日だけ · +約${bonusMins}分</small></summary>${bg.map(t=>hbTaskRow(t)).join('')}</details>`:''}
    <button class="btn btn-gold btn-block" id="p6-start" style="margin-top:12px">${btn} ${ICONS.arrowRight}</button>`;
}

/* ---------- 650点チャレンジ記録 ---------- */
function hbTargetH(){
  // プラン期間の平日・休日の学習時間から、試験日までの目安の合計時間
  const s=p6();const sp=p6Span();let m=0;const d=new Date(sp.start);
  for(let i=0;i<sp.total;i++){const w=d.getDay();m+=(w===0||w===6)?(s.we||90):(s.wd||60);d.setDate(d.getDate()+1)}
  return Math.round(m/60);
}
function hbSnapshotEst(){const d=hb(),t=todayStr();if(d.est[t]==null&&typeof p6Est==='function'){d.est[t]=p6Est().score;commit()}}
function hbScoreSVG(){
  // 推定スコア（日ごと）・模試・公式スコアを1本の時間軸に
  const d=hb();const pts=Object.keys(d.est).sort().map(k=>({t:new Date(k+'T00:00').getTime(),v:d.est[k],k:'est'}));
  (PROG.scoreHist||[]).filter(x=>x.ts&&x.score).forEach(x=>pts.push({t:x.ts,v:x.score,k:x.placement?'place':'mock'}));
  d.real.forEach(x=>pts.push({t:new Date(x.d+'T00:00').getTime(),v:x.L+x.R,k:'real'}));
  if(pts.length<2)return'<div class="hb-empty">毎日開くと推定スコアが記録され、ここにグラフが出ます。模試・公式スコアも重ねて表示します。</div>';
  const T=toeicTarget(),W=300,H=110,P=8;
  const t0=Math.min(...pts.map(p=>p.t)),t1=Math.max(...pts.map(p=>p.t),t0+864e5);
  const v0=Math.min(300,...pts.map(p=>p.v))-20,v1=Math.max(T+30,...pts.map(p=>p.v));
  const X=t=>P+(t-t0)/(t1-t0)*(W-2*P),Y=v=>H-P-(v-v0)/(v1-v0)*(H-2*P);
  const est=pts.filter(p=>p.k==='est').sort((a,b)=>a.t-b.t);
  const line=est.map((p,i)=>(i?'L':'M')+X(p.t).toFixed(1)+' '+Y(p.v).toFixed(1)).join(' ');
  const dot=p=>p.k==='real'?`<circle cx="${X(p.t)}" cy="${Y(p.v)}" r="5" class="hb-pt-real"/>`:p.k!=='est'?`<circle cx="${X(p.t)}" cy="${Y(p.v)}" r="3.5" class="hb-pt-mock"/>`:'';
  return `<svg viewBox="0 0 ${W} ${H}" class="hb-svg" role="img" aria-label="スコアの推移">
    <line x1="${P}" x2="${W-P}" y1="${Y(T)}" y2="${Y(T)}" class="hb-goal"/><text x="${W-P}" y="${Y(T)-4}" text-anchor="end" class="hb-goal-t">${T}</text>
    ${line?`<path d="${line}" class="hb-line"/>`:''}${pts.map(dot).join('')}</svg>
    <div class="hb-legend"><span><i class="hb-lg-line"></i>推定</span><span><i class="hb-lg-mock"></i>模試・診断</span><span><i class="hb-lg-real"></i>公式スコア</span></div>`;
}
function hbLogHTML(){
  const days=hbDays(14),wk=days.slice(-7),wkMin=wk.reduce((a,x)=>a+x.m,0),wkDays=wk.filter(x=>x.m>=5).length;
  const tot=hbTotalH(),tgt=hbTargetH(),bud=hbBudget(),mx=Math.max(bud,...days.map(x=>x.m),1);
  const real=hb().real.slice().sort((a,b)=>a.d<b.d?-1:1);
  return `<div class="card hb-log" id="hb-log">
    <div class="gw-q-h"><span>${ICONS.award} 650点チャレンジ記録</span><span class="gw-q-meta">自動で計測中</span></div>
    <div class="hb-stats">
      <div><b>${hbMin()}</b><small>今日の分</small></div>
      <div><b>${wkDays}<span>/7</span></b><small>今週の学習日</small></div>
      <div><b>${tot<10?tot.toFixed(1):Math.round(tot)}<span>h</span></b><small>累計 / 目安${tgt}h</small></div>
    </div>
    <div class="hb-bar-track"><i style="width:${Math.min(100,tot/Math.max(1,tgt)*100).toFixed(1)}%"></i></div>
    <div class="hb-bars" aria-label="直近14日の学習時間">${days.map(x=>`<div class="hb-b${x.m>=5?' on':''}" title="${x.d} ${x.m}分"><i style="height:${Math.max(2,Math.round(x.m/mx*100))}%"></i><span>${+x.d.slice(8)}</span></div>`).join('')}<div class="hb-bud" style="bottom:calc(14px + (100% - 14px) * ${(bud/mx).toFixed(3)})"></div></div>
    <div class="hb-cap">直近14日（分）・点線は1日の予定 ${bud}分 · 今週 合計${wkMin}分</div>
    <div class="p6-k" style="margin-top:14px">スコアの推移</div>
    ${hbScoreSVG()}
    ${real.length?`<div class="hb-real-list">${real.map(x=>`<div><span>${x.d}</span><b>${x.L+x.R}点</b><small>L ${x.L} / R ${x.R}</small></div>`).join('')}</div>`:''}
    <div class="hb-actions">
      <button class="btn btn-secondary" id="hb-real-btn">${ICONS.star} 公式スコアを記録</button>
      <button class="btn btn-secondary" id="hb-csv-btn">${ICONS.bookmark} 記録をコピー</button>
    </div>
  </div>`;
}
function hbOpenReal(){
  const ov=document.createElement('div');ov.className='gw-cele';
  ov.innerHTML=`<div class="gw-cele-card hb-sheet" role="dialog" aria-label="公式スコアを記録">
    <div class="gw-q-h"><span>${ICONS.star} 公式スコアを記録</span></div>
    <div class="hb-note" style="margin-top:0">公開テスト・IPテストの結果を残すと、推定スコアと並べて「アプリで伸びたか」を検証できます。</div>
    <label class="hb-f">受験日<input type="date" id="hb-r-d" value="${todayStr()}"></label>
    <div style="display:flex;gap:8px"><label class="hb-f">リスニング<input type="number" id="hb-r-l" min="5" max="495" step="5" inputmode="numeric" placeholder="例 330"></label>
    <label class="hb-f">リーディング<input type="number" id="hb-r-r" min="5" max="495" step="5" inputmode="numeric" placeholder="例 280"></label></div>
    <div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-secondary" style="flex:1" id="hb-r-x">やめる</button><button class="btn btn-gold" style="flex:1" id="hb-r-ok">記録する</button></div>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>ov.remove();
  ov.onclick=e=>{if(e.target===ov)close()};
  ov.querySelector('#hb-r-x').onclick=close;
  ov.querySelector('#hb-r-ok').onclick=()=>{
    const d=ov.querySelector('#hb-r-d').value,L=+ov.querySelector('#hb-r-l').value,R=+ov.querySelector('#hb-r-r').value;
    if(!d||!(L>=5&&L<=495)||!(R>=5&&R<=495))return showToast('日付と L・R のスコア（5〜495）を入れてください');
    hb().real.push({d,L,R});commit();close();
    showToast(L+R>=toeicTarget()?'目標達成、おめでとう！ 記録しました':'記録しました。ここからの伸びも記録していきましょう');
    openRoadmap();
  };
}
async function hbCopyCSV(){
  const d=hb();const plan=k=>(PROG['plan_'+k]||[]).length;
  const keys=Array.from(new Set(Object.keys(d.sec).concat(Object.keys(d.est)))).sort();
  const rows=['date,minutes,menu_done,est_score'].concat(keys.map(k=>[k,hbMin(k),plan(k),d.est[k]==null?'':d.est[k]].join(',')));
  (PROG.scoreHist||[]).forEach(x=>x.ts&&rows.push(`mock,${ymd(new Date(x.ts))},,${x.score}`));
  d.real.forEach(x=>rows.push(`official,${x.d},L${x.L}/R${x.R},${x.L+x.R}`));
  const txt=rows.join('\n');
  try{await navigator.clipboard.writeText(txt);showToast('記録をコピーしました（表計算アプリに貼り付けできます）')}
  catch(e){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast('記録をコピーしました')}catch(_){showToast('コピーできませんでした')}ta.remove()}
}

/* ---------- 毎日のリマインダー（カレンダー登録） ---------- */
function hbRemindHTML(){
  const t=hb().remindAt||'21:00';
  return `<div class="card hb-remind">
    <div class="gw-q-h"><span>${ICONS.clock} 毎日のリマインダー</span>${hb().remindSet?'<span class="gw-q-meta">登録済み</span>':''}</div>
    <div class="hb-note" style="margin-top:0">スマホのカレンダーに「毎日この時間に通知」を登録します。アプリを開いていなくても確実に届きます。</div>
    <div class="hb-remind-row"><label class="hb-f" style="flex:0 0 120px">時刻<input type="time" id="hb-time" value="${t}"></label>
      <button class="btn btn-gold" style="flex:1" id="hb-ics">カレンダーに追加</button></div>
    <button class="btn btn-secondary btn-block" style="margin-top:8px" id="hb-gcal">Googleカレンダーで追加（Android向け）</button>
  </div>`;
}
function hbIcs(time){
  const[h,m]=time.split(':');const p=n=>String(n).padStart(2,'0');
  const d=new Date();d.setDate(d.getDate()+(new Date().getHours()*60+new Date().getMinutes()>=+h*60+ +m?1:0));
  const day=d.getFullYear()+p(d.getMonth()+1)+p(d.getDate());
  const ex=p6Ready()?p6().exam.replace(/-/g,''):'';
  const url=location.origin+location.pathname;
  return['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sparkle//Daily//JA','CALSCALE:GREGORIAN','BEGIN:VEVENT',
    'UID:sparkle-daily-'+Date.now()+'@sparkle','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z',
    'DTSTART:'+day+'T'+h+m+'00','DURATION:PT15M','RRULE:FREQ=DAILY'+(ex?';UNTIL='+ex+'T235959':''),
    'SUMMARY:Sparkle 英語（最低5分だけでもOK）','DESCRIPTION:今日の目標メニューを開く '+url,'URL:'+url,
    'BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:Sparkle 英語の時間です','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
}
function hbSaveRemind(time){const d=hb();d.remindAt=time;d.remindSet=true;commit()}
function hbAddIcs(){
  const time=(document.getElementById('hb-time')||{}).value||'21:00';hbSaveRemind(time);
  const blob=new Blob([hbIcs(time)],{type:'text/calendar;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sparkle-reminder.ics';
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);
  showToast('開いたカレンダーで「追加」を押すと登録完了です');
}
function hbAddGcal(){
  const time=(document.getElementById('hb-time')||{}).value||'21:00';hbSaveRemind(time);
  const[h,m]=time.split(':');const d=new Date();const p=n=>String(n).padStart(2,'0');
  const day=d.getFullYear()+p(d.getMonth()+1)+p(d.getDate());
  const end=new Date(d.getFullYear(),d.getMonth(),d.getDate(),+h,+m+15);
  const q=new URLSearchParams({action:'TEMPLATE',text:'Sparkle 英語（最低5分だけでもOK）',dates:`${day}T${h}${m}00/${day}T${p(end.getHours())}${p(end.getMinutes())}00`,ctz:'Asia/Tokyo',recur:'RRULE:FREQ=DAILY',details:'今日の目標メニューを開く '+location.origin+location.pathname});
  window.open('https://calendar.google.com/calendar/render?'+q.toString(),'_blank','noopener');
}

/* ---------- 既存機能への接続 ---------- */
function hbInstall(){
  if(typeof p6Ready!=='function')return;
  hbSnapshotEst();
  // メニューに段階をつける
  const _pt=planTasksForToday;
  planTasksForToday=function(){const l=_pt.apply(this,arguments);return p6Ready()?hbTag(l):l};
  // 1本道セッションは「今日の目標」→（終わったら）「ボーナス」の順に1ラウンドずつ
  const _sd=startDaySession;
  startDaySession=function(){
    if(!p6Ready())return _sd.apply(this,arguments);
    const s=hbSplit();const core=s.core.filter(t=>!t.done);const tasks=core.length?core:s.bonusLeft;
    if(!tasks.length)return totalDue()>0?openReview():showToast('今日のメニューは完了しています');
    daySession={tasks,idx:0,active:true,startedAt:Date.now(),startXP:PROG.xp||0,round:core.length?'core':'bonus'};
    runDaySessionStep();
  };
  const _dc=renderDaySessionComplete;
  renderDaySessionComplete=function(){
    const round=daySession&&daySession.round;
    const r=_dc.apply(this,arguments);
    if(!p6Ready())return r;
    const s=hbSplit();const card=document.querySelector('#screen-review .result-card');if(!card)return r;
    const head=card.querySelector('.result-score');
    if(round==='core'&&head)head.textContent='今日の目標クリア！';
    const box=document.createElement('div');box.className='hb-next';
    box.innerHTML=`<div class="hb-stat-line">今日の学習 <b>${hbMin()}分</b> · 累計 <b>${hbTotalH().toFixed(1)}時間</b></div>`+
      (round==='core'&&s.bonusLeft.length?`<button class="btn btn-secondary btn-block" id="hb-bonus-go">余力があればボーナスラウンド（+約${s.bonusLeft.reduce((a,t)=>a+t.mins,0)}分） ${ICONS.arrowRight}</button>`:'');
    card.insertBefore(box,card.querySelector('.btn'));
    const b=document.getElementById('hb-bonus-go');if(b)b.onclick=()=>startDaySession();
    return r;
  };
  // ホーム：今日の目標だけを見せる（ボーナスは目標クリア後に）
  const _tf=todayFocusHTML;
  todayFocusHTML=function(){
    if(!p6Ready())return _tf.apply(this,arguments);
    const s=hbSplit();const scope=s.coreDone&&s.bonusLeft.length?s.bonus:s.coreDone?s.all:s.core;
    const keep=planTasksForToday;planTasksForToday=()=>scope;
    let h;try{h=_tf.apply(this,arguments)}finally{planTasksForToday=keep}
    if(s.coreDone&&s.bonusLeft.length)h=h.replace('今日のプラン ','ボーナス ').replace('今日のトレーニングを始める','ボーナスラウンドを始める').replace(/全\d+ステップ・約\d+分を続けて/,'今日の目標はクリア済み。余力がある日だけでOK');
    else if(!s.coreDone)h=h.replace('今日のプラン ','今日の目標 ').replace('今日のトレーニングを始める','今日の目標を始める').replace(/全(\d+)ステップ・約(\d+)分を続けて/,'全$1ステップ・約$2分 · 忙しい日は最初の1つだけでOK');
    return h.replace('<div class="focus-chips">',`<div class="hb-home-line">${ICONS.clock}<span>今日 <b>${hbMin()}分</b> · 今週 <b>${hbDays(7).filter(x=>x.m>=5).length}/7日</b> · 累計 <b>${hbTotalH().toFixed(1)}h</b></span></div><div class="focus-chips">`);
  };
  // ロードマップ：段階つきメニュー＋チャレンジ記録＋リマインダー
  const _or=openRoadmap;
  openRoadmap=function(){
    const r=_or.apply(this,arguments);
    if(!p6Ready())return r;
    const today=document.querySelector('.p6-today');if(!today)return r;
    today.innerHTML=hbMenuHTML();
    document.getElementById('p6-start').onclick=()=>startDaySession();
    today.insertAdjacentHTML('afterend',hbLogHTML()+hbRemindHTML());
    document.getElementById('hb-real-btn').onclick=hbOpenReal;
    document.getElementById('hb-csv-btn').onclick=hbCopyCSV;
    document.getElementById('hb-ics').onclick=hbAddIcs;
    document.getElementById('hb-gcal').onclick=hbAddGcal;
    return r;
  };
  if(typeof curTab!=='undefined'&&curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome();
}
if(typeof go==='function')hbInstall();
