/* ========== シャドーイング・スタジオ（英会話アプリのいいとこ取り） ==========
   ・シャドテン式：1つの音声を「今週の課題」として7日間くり返す → 毎日の点数の伸び、Day1 と今日の録音を聞き比べ
   ・シャドテン式の添削：チェック結果から「コーチのメモ」を自動で作る（機能語の脱落・音のつながり・L/R/TH などの音・
     文の後半で崩れる・止まる・速さ）。日本人のクセに絞って、改善ポイントを3つまで
   ・abceed / スタサプ式：速さ 0.7〜1.2x、1文ずつ止まる「ポーズ再生」、音読中は読んでいる単語が光る（カラオケ）
   ・Duolingo 式：連続日数。レベル（旅行会話＝やさしい / TOEIC Part 3 / Part 4）を選べる
   中身のトレーニング（5ステップ）は listening.js の lxSh エンジンをそのまま使い、入口・音読・仕上げを拡張する。
   録音は端末の IndexedDB にだけ保存（最初の日と最新の日の2本）。$0・サーバーなし。 */
'use strict';

const SD_LV=[['easy','やさしい','旅行会話'],['p3','TOEIC P3','会話'],['p4','TOEIC P4','説明文']];
function sd(){const d=PROG.sd||(PROG.sd={});d.hist=d.hist||[];d.notes=d.notes||[];d.lv=d.lv||'easy';return d}
const sdAgo=(a,b)=>Math.round((new Date(b+'T00:00')-new Date(a+'T00:00'))/864e5);

/* ---------- 素材 ---------- */
// 旅行会話：街のストーリーから、相手のセリフと「完璧な返し」をつないだ短い会話にする
function sdTravel(){
  const out=[];
  (typeof CITY_ROTATION!=='undefined'?CITY_ROTATION:[]).forEach(c=>(CITY_STORIES[c.key]||[]).forEach(st=>{
    const lines=[];st.turns.forEach(t=>{if(t.who==='char')lines.push('W: '+t.en);else if(t.choices){const p=t.choices.find(x=>x.q==='perfect')||t.choices[0];lines.push('M: '+p.en)}});
    if(lines.length>=3)out.push({id:'st:'+st.id,script:lines.slice(0,6).join('\n'),title:`${c.en} · ${st.title}`,lang:c.ttsLang||'en-US',narr:'W'});
  }));
  return out;
}
function sdPool(lv){
  if(lv==='p3')return TOEIC_P3.map(s=>({id:s.id,script:s.script,title:'TOEIC Part 3 · 会話',lang:lxAccent(s.id),narr:lxNarr(s.id)}));
  if(lv==='p4')return TOEIC_P4.map(s=>({id:s.id,script:s.script,title:'TOEIC Part 4 · 説明文',lang:lxAccent(s.id),narr:lxNarr(s.id)}));
  return sdTravel();
}
// 今週の課題：7日たったら（またはレベルを変えたら）次の素材へ。やったことのない素材を優先
function sdWeek(force){
  const d=sd(),t=todayStr();
  if(!force&&d.wk&&d.wk.lv===d.lv&&sdAgo(d.wk.start,t)<7){const p=sdPool(d.lv).find(x=>x.id===d.wk.id);if(p)return d.wk}
  if(d.wk&&Object.keys(d.wk.days||{}).length)d.hist.push({id:d.wk.id,title:d.wk.title,start:d.wk.start,days:d.wk.days});
  if(d.hist.length>40)d.hist.shift();
  const done=new Set(d.hist.map(h=>h.id)),pool=sdPool(d.lv),fresh=pool.filter(p=>!done.has(p.id)),pick=(fresh.length?fresh:pool)[Math.floor(Math.random()*(fresh.length||pool.length))];
  d.wk={id:pick.id,lv:d.lv,title:pick.title,start:t,days:{}};commit();
  return d.wk;
}
function sdSrc(wk){return sdPool(wk.lv).find(x=>x.id===wk.id)}
function sdDayN(wk){return Math.min(7,sdAgo(wk.start,todayStr())+1)}
function sdStreak(){const days=PROG.lxShadowDays||{};let n=0,d=new Date();if(!days[todayStr()])d.setDate(d.getDate()-1);
  for(;;){const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(!days[k])break;n++;d.setDate(d.getDate()-1)}return n}

/* ---------- 録音の保存（Day1 と最新の2本だけ） ---------- */
function sdDb(){return new Promise((res,rej)=>{const r=indexedDB.open('sparkle-shadow',1);r.onupgradeneeded=()=>r.result.createObjectStore('rec');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function sdRecSave(id,date,blob){try{const db=await sdDb();const st=db.transaction('rec','readwrite').objectStore('rec');
  const keys=await new Promise(r=>{const q=st.getAllKeys();q.onsuccess=()=>r(q.result||[]);q.onerror=()=>r([])});
  const mine=keys.filter(k=>String(k).startsWith(id+'|')).sort();
  // 最初の日は残し、それ以外の古い録音は消す（保存は最大2本）
  const st2=db.transaction('rec','readwrite').objectStore('rec');mine.slice(1).forEach(k=>{if(k!==id+'|'+date)st2.delete(k)});st2.put(blob,id+'|'+date);
  // ほかの素材の録音は、直近3素材ぶんだけ残す
  const others=[...new Set(keys.map(k=>String(k).split('|')[0]).filter(x=>x!==id))];if(others.length>3){const st3=db.transaction('rec','readwrite').objectStore('rec');keys.filter(k=>others.slice(0,others.length-3).includes(String(k).split('|')[0])).forEach(k=>st3.delete(k))}
}catch(e){}}
async function sdRecList(id){try{const db=await sdDb();const st=db.transaction('rec').objectStore('rec');
  const keys=await new Promise(r=>{const q=st.getAllKeys();q.onsuccess=()=>r(q.result||[]);q.onerror=()=>r([])});
  return keys.filter(k=>String(k).startsWith(id+'|')).sort()}catch(e){return[]}}
async function sdRecPlay(key){try{const db=await sdDb();const b=await new Promise(r=>{const q=db.transaction('rec').objectStore('rec').get(key);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)});
  if(!b)return;lxStop();const u=URL.createObjectURL(b),a=new Audio(u);a.onended=()=>URL.revokeObjectURL(u);a.play().catch(()=>{})}catch(e){}}

/* ---------- スタジオのホーム ---------- */
function sdHome(){
  lxStop();if(typeof tkStopAll==='function')tkStopAll();lxSh=null;
  const d=sd(),wk=sdWeek(),src=sdSrc(wk),day=sdDayN(wk),el=document.getElementById('screen-review');
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));el.classList.add('active');
  const sents=lxSentences(src.script,src.narr),secs=Math.round(sents.reduce((a,x)=>a+x.t.split(/\s+/).length,0)/2.3);
  const ds=Object.entries(wk.days).sort((a,b)=>a[0]<b[0]?-1:1),todayDone=!!wk.days[todayStr()];
  const pts=Array.from({length:7},(_,i)=>{const k=ds.find(([dt])=>sdAgo(wk.start,dt)===i);return k?k[1].score:null});
  const first=ds.length?ds[0][1].score:null,last=ds.length?ds[ds.length-1][1].score:null;
  const note=d.notes.find(n=>n.id===wk.id)||d.notes[0];
  const total=Object.values(PROG.lxShadowDays||{}).reduce((a,b)=>a+b,0),streak=sdStreak();
  el.innerHTML=`<div class="sd-wrap">
    <div class="back-row"><button class="icon-btn" id="sd-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>シャドーイング</h2><span class="sd-streak${streak?' on':''}">${ICONS.zap}${streak}日</span></div>
    <div class="sd-week">
      <div class="sd-week-h"><span class="sd-k">今週の課題 · DAY ${day}/7</span><span class="sd-acc">${esc(LX_ACCENT_JA[src.lang]||'アメリカ')}の発音</span></div>
      <b class="sd-title">${esc(src.title)}</b>
      <small class="sd-meta">${sents.length}文 · 約${secs}秒 · ${esc(SD_LV.find(l=>l[0]===wk.lv)[1])}</small>
      <div class="sd-days">${pts.map((v,i)=>`<div class="sd-day${i+1===day?' now':''}${v!=null?' done':''}"><i style="--h:${v==null?0:Math.max(8,v)}%"></i><span>${v==null?(i+1===day?'今日':'D'+(i+1)):v}</span></div>`).join('')}</div>
      ${first!=null&&last!=null&&ds.length>1?`<div class="sd-gain">Day1 <b>${first}</b> → 最新 <b>${last}</b>${last>first?` <em>+${last-first}</em>`:''}</div>`:''}
      <button class="btn btn-gold btn-block" id="sd-go">${todayDone?'もう一度トレーニング':'今日のトレーニング（約8分）'} ${ICONS.arrowRight}</button>
      <div class="sd-ba" id="sd-ba"></div>
    </div>
    ${note?`<div class="sd-note"><div class="sd-note-h"><span>${ICONS.star} コーチのメモ</span><small>${esc(note.d.slice(5).replace('-','/'))}</small></div>${note.pts.slice(0,2).map(p=>`<div class="sd-pt"><b>${esc(p.name)}</b><small>${esc(p.tip)}</small></div>`).join('')}</div>`
      :`<div class="sd-note sd-how"><b>7日間、同じ音声で</b><small>毎日5ステップ（聞く→穴埋め→音読→シャドーイング→チェック）。チェックのあとにコーチのメモが届き、Day1 と今日の録音を聞き比べられます。</small></div>`}
    <div class="sd-lv" role="tablist">${SD_LV.map(([k,n,s])=>`<button data-lv="${k}" class="${d.lv===k?'on':''}"><b>${n}</b><small>${s}</small></button>`).join('')}</div>
    <div class="sd-foot"><span>これまで <b>${total}</b>本</span><button class="sd-link" id="sd-change">別の課題にする</button></div>
  </div>`;
  const on=(id,f)=>{const b=document.getElementById(id);if(b)b.onclick=f};
  on('sd-back',()=>go(typeof curTab!=='undefined'&&curTab?curTab:'home'));
  on('sd-go',()=>sdStart());
  on('sd-change',()=>{sdWeek(true);sfx('tap');sdHome()});
  el.querySelectorAll('[data-lv]').forEach(b=>b.onclick=()=>{if(d.lv===b.dataset.lv)return;d.lv=b.dataset.lv;sdWeek(true);sfx('tap');sdHome()});
  sdRecList(wk.id).then(keys=>{const ba=document.getElementById('sd-ba');if(!ba||!keys.length)return;
    const lab=k=>'Day'+(sdAgo(wk.start,String(k).split('|')[1])+1);
    ba.innerHTML=`<span>録音を聞き比べ</span>${keys.map(k=>`<button data-rk="${esc(String(k))}">${ICONS.play}${lab(k)}</button>`).join('')}<button data-model="1">${ICONS.play}お手本</button>`;
    ba.querySelectorAll('[data-rk]').forEach(b=>b.onclick=()=>sdRecPlay(b.dataset.rk));
    ba.querySelector('[data-model]').onclick=()=>lxSpeakLines(lxSentences(src.script,src.narr),{lang:src.lang,narr:src.narr,rate:0.95})});
  window.scrollTo(0,0);
}
function sdStart(){
  if(typeof plusGate==='function'&&!sdStart._ok){return plusGate('shadow',1,'day',()=>{sdStart._ok=true;try{sdStart()}finally{sdStart._ok=false}})}
  if(typeof lxUnlock==='function')lxUnlock();
  const wk=sdWeek(),src=sdSrc(wk);
  lxShadowOpen({id:src.id,script:src.script,lang:src.lang,narr:src.narr,title:'Day '+sdDayN(wk)},{studio:true,back:'studio'});
  if(lxSh)lxSh.rate=sd().rate||1;
  lxShRender();
}

/* ---------- トレーニング画面の拡張 ---------- */
const SD_RATES=[0.7,0.8,0.9,1,1.1,1.2];
// 1文ずつ読み上げ。単語の境目のイベントで、読んでいる単語を光らせる。onend が来ない端末向けに時間の保険つき
function sdSay(x,rate,lang,narr,onWord,onEnd){
  let done=false,t=0;const fin=()=>{if(done)return;done=true;clearTimeout(t);onEnd&&onEnd()};
  if(!('speechSynthesis'in window)){setTimeout(fin,300);return}
  const u=new SpeechSynthesisUtterance(x.t);u.lang=lang||'en-US';u.rate=listenRate(0.95*rate);
  const g=x.sp[0]==='W'?'female':x.sp[0]==='M'?'male':(narr==='W'?'female':'male');const v=pickVoice(g,lang);if(v)u.voice=v;
  if(x.sp.endsWith('2'))u.pitch=g==='male'?0.78:1.22;
  u.onboundary=e=>{if(!e.name||e.name==='word')onWord&&onWord(e.charIndex)};u.onend=fin;u.onerror=fin;
  speechSynthesis.speak(u);t=setTimeout(fin,x.t.split(/\s+/).length/(1.6*rate)*1000+2500);
}
// 音読（オーバーラッピング）：全文を通して／1文ずつ止まる「ポーズ再生」
function sdOverlap(pause){
  const s=lxSh;if(!s)return;lxStop();s.loop=null;s.sdRun=(s.sdRun||0)+1;const run=s.sdRun;
  const rows=[...document.querySelectorAll('#lx-sh-root .lx-sh-row')];
  const offs=s.sents.map(x=>{let c=0;return x.t.split(/(\s+)/).filter(w=>{const keep=/\S/.test(w);return keep}).map(w=>{const i=x.t.indexOf(w,c);c=i+w.length;return i})});
  const clear=()=>rows.forEach(r=>{r.classList.remove('sd-now','sd-turn');r.querySelectorAll('.sd-lit').forEach(e=>e.classList.remove('sd-lit'))});
  const step=i=>{
    if(!lxSh||lxSh.sdRun!==run)return clear();
    if(i>=s.sents.length){clear();const b=document.getElementById('sd-ov-st');if(b)b.textContent='おつかれさま。もう一度やるか、次のステップへ。';return}
    clear();const row=rows[i];if(row){row.classList.add('sd-now');row.scrollIntoView({block:'nearest',behavior:'smooth'})}
    const spans=row?[...row.querySelectorAll('.lx-sh-line span')]:[];
    sdSay(s.sents[i],(s.rate||1)*0.92,s.src.lang,s.src.narr,ci=>{const o=offs[i];let k=0;while(k+1<o.length&&o[k+1]<=ci)k++;spans.forEach((sp,j)=>sp.classList.toggle('sd-lit',j<=k))},()=>{
      if(!lxSh||lxSh.sdRun!==run)return;spans.forEach(sp=>sp.classList.add('sd-lit'));
      if(pause){
        // ポーズ再生：その文の長さ＋少しのあいだ止まるので、自分で言う
        if(row)row.classList.add('sd-turn');const st=document.getElementById('sd-ov-st');if(st)st.textContent='あなたの番：いまの文を声に出して';
        setTimeout(()=>{const st2=document.getElementById('sd-ov-st');if(st2)st2.textContent='';step(i+1)},s.sents[i].t.split(/\s+/).length/(2.2*(s.rate||1))*1000+900);
      }else setTimeout(()=>step(i+1),250);
    });
  };
  step(0);
}
const _sdRender=lxShRender;
lxShRender=function(){
  _sdRender.apply(this,arguments);
  const s=lxSh;if(!s||!s.opt||!s.opt.studio)return;
  const on=(id,f)=>{const b=document.getElementById(id);if(b)b.onclick=f};
  on('lx-sh-back',()=>{lxStop();lxRecStop(true);if(typeof tkStopAll==='function')tkStopAll();if(lxSh)lxSh.sdRun=-1;lxSh=null;sdHome()});
  // 速さは 0.7〜1.2x
  const rb=document.getElementById('lx-sh-rate');if(rb)rb.onclick=()=>{const k=SD_RATES.indexOf(s.rate);s.rate=SD_RATES[(k+1)%SD_RATES.length];sd().rate=s.rate;commit();lxShRender()};
  if(s.step===3){
    const play=document.getElementById('lx-sh-play');
    if(play){play.outerHTML=`<div class="sd-ov"><button class="btn btn-gold" id="sd-ov-all">${ICONS.play} 通して音読</button><button class="btn btn-secondary" id="sd-ov-pause">${ICONS.play} ポーズ再生</button><button class="btn btn-secondary sd-rate" id="sd-ov-rate">${s.rate||1}x</button></div><div class="sd-ov-st" id="sd-ov-st" aria-live="polite"></div>`;
      on('sd-ov-all',()=>sdOverlap(false));on('sd-ov-pause',()=>sdOverlap(true));
      on('sd-ov-rate',()=>{const k=SD_RATES.indexOf(s.rate||1);s.rate=SD_RATES[(k+1)%SD_RATES.length];sd().rate=s.rate;commit();lxShRender()});}
  }
  // ステップを移るときは読み上げを止める
  const nx=document.getElementById('lx-sh-next');if(nx){const f=nx.onclick;nx.onclick=()=>{s.sdRun=(s.sdRun||0)+1;f&&f()}}
};

/* ---------- コーチのメモ（シャドテン式の添削を自動で） ---------- */
function sdCoach(s){
  const sents=s.sents,sc=s.scores;const cat={};
  const add=(id,name,tip,ex,i)=>{const c=cat[id]||(cat[id]={id,name,tip,n:0,ex:[],sent:i});c.n++;if(ex&&!c.ex.includes(ex)&&c.ex.length<4)c.ex.push(ex);if(c.sent==null)c.sent=i};
  sc.forEach((r,i)=>{if(!r||!r.words)return;const ws=r.words,mk=r.marks,n=ws.length;
    ws.forEach((w,k)=>{if(mk[k])return;const b=lxBare(w);if(!b)return;
      if(LX_WEAK.has(b))add('weak','小さな単語が消えている','a / the / to / of などは「弱く短く」だけど、消さずに軽く言う。日本人は強く言うか、まるごと落としがち。',b,i);
      else if(k>=n*0.6&&n>=6)add('tail','文の後半で崩れる','長い文は意味のかたまりで区切って、息つぎの場所を決めておく。後半だけ ↻ でくり返すと安定します。',b,i);
      else add('content','内容語の言い落とし','大事な単語（名詞・動詞）は強く長く。聞き取れなかった単語は、まず ▶ で音を確認してから。',b,i);
      const nx=ws[k+1]?lxBare(ws[k+1]):'';if(nx&&!mk[k+1]&&/[bcdfgklmnprstvxz]$/.test(b)&&/^[aeiou]/.test(nx))add('link','音のつながり',`子音で終わる語＋母音で始まる語は1語のようにつなげる（例：${b}‿${nx}）。区切って言うとカタカナ英語に聞こえます。`,b+'‿'+nx,i);
    });
    (typeof tkDiagnose==='function'?tkDiagnose(r.subs):[]).forEach(d=>add('snd-'+d.id,d.name+' の音',d.tip,`${d.want}→${d.heard}`,i));
    // 速さ：お手本（1秒に約2.5語）よりかなり遅い
    if(r.sec&&n>=5){const model=n/(2.5*(s.rate||1));if(r.sec>model*1.6)add('slow','お手本より遅い','意味のかたまりごとに一息で言う。止まらないことを優先して、細かい音はあとで。',null,i)}
  });
  if(s.recGaps>=2)add('stop','途中で止まる',`録音で${s.recGaps}回止まりました。速さを1段下げて、止まらずに最後まで追いかけるのが先。`,null,null);
  const pts=Object.values(cat).sort((a,b)=>b.n-a.n).slice(0,3);
  const good=sc.filter(r=>r&&r.v!=null&&r.v>=90).length;
  return{pts,good};
}
const _sdFinish=lxShFinish;
lxShFinish=function(){
  const s=lxSh;if(!s||!s.opt||!s.opt.studio)return _sdFinish.apply(this,arguments);
  const vals=s.scores.filter(x=>x&&x.v!=null).map(x=>x.v),avg=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):null;
  const coach=sdCoach(s),d=sd(),wk=d.wk,t=todayStr(),day=sdDayN(wk);
  const prevDays=Object.entries(wk.days).filter(([dt])=>dt!==t).sort((a,b)=>a[0]<b[0]?-1:1),prev=prevDays.length?prevDays[prevDays.length-1][1].score:null;
  wk.days[t]={score:avg,gaps:s.recGaps!=null?s.recGaps:null,rate:s.rate||1};
  if(coach.pts.length)d.notes.unshift({d:t,id:wk.id,pts:coach.pts.map(p=>({name:p.name,tip:p.tip}))});if(d.notes.length>20)d.notes.length=20;
  const blob=s.recBlob;if(blob)sdRecSave(wk.id,t,blob);
  const sents=s.sents,scores=s.scores.slice();
  _sdFinish.apply(this,arguments); // 既存の記録（本数・つまずいた単語・素材ログ）はそのまま
  const el=document.getElementById('screen-review');
  const mark=(r,x)=>r&&r.words?r.words.map((w,k)=>`<span class="${r.marks[k]?'ok':'ng'}${LX_WEAK.has(lxBare(w))?' wk':''}">${esc(w)}</span>`).join(' '):`<span class="na">${esc(x.t)}</span>`;
  el.innerHTML=`<div class="sd-wrap sd-rep">
    <div class="sd-rep-h"><div><span class="sd-k">DAY ${day} の添削</span><b>${avg==null?'おつかれさま！':avg>=85?'Excellent!':avg>=65?'Good job!':'Keep going!'}</b>
      <small>${avg!=null&&prev!=null?`前回 ${prev} → 今回 ${avg}${avg>prev?'（伸びた！）':''}`:'明日も同じ音声で。毎日の伸びが見えます。'}</small></div>${avg!=null?tkRing(avg,72):''}</div>
    <div class="sd-pts">${coach.pts.length?coach.pts.map((p,i)=>`<div class="sd-pt-c"><div class="sd-pt-t"><i>${i+1}</i><b>${esc(p.name)}</b><span>${p.n}か所</span></div><small>${esc(p.tip)}</small>
        ${p.ex.length?`<div class="sd-ex">${p.ex.map(e=>`<u>${esc(e)}</u>`).join('')}</div>`:''}${p.sent!=null?`<button class="sd-try" data-try="${p.sent}">${ICONS.play} その文をゆっくり聞く</button>`:''}</div>`).join('')
      :`<div class="sd-pt-c"><div class="sd-pt-t"><i>✓</i><b>大きなクセは見つかりませんでした</b></div><small>速さを1段上げるか、Step 4 でスクリプトを見ずに挑戦してみよう。</small></div>`}</div>
    ${coach.good?`<div class="sd-good">${ICONS.check} ${coach.good}文はほぼ完璧に言えました</div>`:''}
    <div class="cp-fold sd-script" data-cp="sd-script"><button class="cp-fold-h" type="button"><span class="cp-t">添削つきスクリプト</span><span class="cp-s">赤＝言えなかった単語</span><svg class="cp-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></button>
      <div class="cp-fold-b"><div class="cp-fold-i">${sents.map((x,i)=>`<p>${mark(scores[i],x)}</p>`).join('')}</div></div></div>
    ${inDaySession()?sessionNavHTML():`<div class="tk-fb-btns"><button class="btn btn-secondary" id="sd-home">スタジオへ</button><button class="btn btn-gold" id="sd-done">Home ${ICONS.arrowRight}</button></div>`}
  </div>`;
  const fold=el.querySelector('.sd-script');fold.querySelector('.cp-fold-h').onclick=()=>fold.classList.toggle('open');
  el.querySelectorAll('[data-try]').forEach(b=>b.onclick=()=>{const x=sents[+b.dataset.try];lxSpeakLines([x],{lang:wk&&sdSrc(wk)?sdSrc(wk).lang:'en-US',rate:0.75})});
  const h=document.getElementById('sd-home');if(h)h.onclick=sdHome;const dn=document.getElementById('sd-done');if(dn)dn.onclick=()=>go('home');
  if(avg!=null&&avg>=80&&typeof launchConfetti==='function')launchConfetti();
  window.scrollTo(0,0);
};

/* ---------- 入口 ---------- */
// 毎日のメニューの「シャドーイング」は、今週の課題のトレーニングをすぐ始める
lxShadowToday=function(){sdStart()};
if(typeof renderTOEICPracticeTab==='function'){const _rp=renderTOEICPracticeTab;renderTOEICPracticeTab=function(body){_rp.apply(this,arguments);
  const b=document.getElementById('lx-sh-entry');if(!b)return;const wk=sd().wk;
  const sm=b.querySelector('small');if(sm)sm.textContent=wk?`今週の課題 Day ${sdDayN(wk)}/7 · ${sdStreak()}日連続`:'7日間で同じ音声を仕上げる · コーチのメモつき';
  const bb=b.querySelector('b');if(bb)bb.textContent='シャドーイング・スタジオ';
  b.onclick=sdHome}}
