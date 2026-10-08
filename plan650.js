/* ========== TOEIC 650 ロードマップ（短期集中・試験日から逆算） ==========
   ・試験日と1日の学習時間から、4フェーズ×日替わりメニュー（分量つき）を自動生成
   ・模試の頻度はフェーズが進むほど増やす（4週→3週→2週→毎週）
   ・チェックポイント（30/55/85/100%地点）とペース判定
   ・攻略ガイド（650点の取り方・パート別の解き方・効く勉強法）と今日のコツ
   ・本番形式の強化：Part 2 を音声のみで解く／Part 5 に1問20秒の計測
   ・推定スコアを L/R 別のパート正答率と模試から算出
   index.html / talk.js / growth.js / toeic_core.js の後に読み込む。 */
'use strict';

/* ---------- 設定・期間 ---------- */
function p6(){return PROG.p650||(PROG.p650={})}
function p6Ready(){return !!(PROG.p650&&PROG.p650.exam)}
function p6Span(){
  const s=p6();const start=new Date((s.start||todayStr())+'T00:00');const exam=new Date((s.exam||addDays(182))+'T00:00');
  const now=new Date(todayStr()+'T00:00');
  const total=Math.max(14,Math.round((exam-start)/864e5));
  const elapsed=Math.max(0,Math.round((now-start)/864e5));
  const left=Math.round((exam-now)/864e5);
  return{start,exam,total,elapsed,left,frac:Math.min(1,elapsed/total)};
}
const P6_PHASES=[
  {n:1,to:0.30,name:'Foundation',ja:'基礎固め',goal:'コア単語・熟語とPart 5の文法を固め、Part 1・2で耳を慣らす',why:'650点の土台は「単語」と「文法」。ここが弱いと、リスニングも長文も伸びません。'},
  {n:2,to:0.55,name:'Listening',ja:'リスニング強化',goal:'Part 3・4を「設問先読み」で解けるようにし、L350点を狙える耳を作る',why:'リスニングはリーディングより短期間で伸びやすく、650点の半分以上を稼げます。'},
  {n:3,to:0.85,name:'Practice',ja:'読解・実戦',goal:'Part 6・7を時間内に解く練習と、2週ごとの模試で弱点を洗い出す',why:'知識を「時間内に解ける力」に変える段階。模試で弱点が見えると、伸びが加速します。'},
  {n:4,to:1.01,name:'Final',ja:'仕上げ',goal:'毎週の模試とミスノート。新しいことより、取れる問題を確実に取る',why:'本番直前は、間違えた問題を二度と落とさないのがいちばん点数につながります。'}
];
function p6PhaseOf(frac){return P6_PHASES.find(p=>frac<p.to)||P6_PHASES[3]}

/* ---------- 毎日のメニュー ---------- */
const P6_TASKS={
  vocab:{t:'単語 10語',sub:'忘れる直前に出る復習つき',m:5},
  p5:{t:'Part 5 文法 15問',sub:'1問20秒が目標',m:8},
  p2:{t:'Part 2 応答 10問',sub:'本番と同じ「音声だけ」で解く',m:6},
  p1:{t:'Part 1 写真描写 8問',sub:'人物の動作・物の状態を聞き分ける',m:5},
  p3:{t:'Part 3 会話 1セット',sub:'設問を先に読んでから聞く',m:6},
  p4:{t:'Part 4 説明文 1セット',sub:'設問先読み＋言い換えに注意',m:6},
  p6:{t:'Part 6 長文穴埋め',sub:'時制・つなぎ言葉・文脈で解く',m:8},
  p7:{t:'Part 7 読解',sub:'設問→本文の該当箇所を探す',m:10},
  mistake:{t:'ミスノート',sub:'間違えた問題を48時間以内に解き直す',m:6},
  mock:{t:'模試 30問（15分）',sub:'今の推定スコアを測る',m:15},
  weak:{t:'弱点パート集中',sub:'正答率がいちばん低いパート',m:8},
  talk:{t:'英会話ロールプレイ',sub:'旅行の場面を自分の言葉で（息抜きも兼ねて）',m:5}
};
const P6_MENU={
  1:{base:['vocab','p5','p2','vocab'],extra:['p1','vocab','p5','p2','vocab','p1']},
  2:{base:['vocab','p5','p3','p2'],extra:['p4','vocab','p3','p1','p5','p2','vocab']},
  3:{base:['vocab','p5','p7','p3'],extra:['p6','p4','mistake','vocab','p7','p2','p5']},
  4:{base:['mistake','p5','p3','p7'],extra:['weak','vocab','p4','p6','p2','p7','weak']}
};
const P6_MOCK_EVERY={1:28,2:21,3:14,4:7};
function p6LastMockDays(){
  const h=(PROG.scoreHist||[]).filter(x=>!x.placement);const last=h[h.length-1];
  return last?Math.floor((Date.now()-last.ts)/864e5):9999;
}
function p6WeakPart(){
  const rows=[1,2,3,4,5,6,7].map(p=>({p,a:typeof gwPartAcc==='function'?gwPartAcc(p):null})).filter(x=>x.a);
  rows.sort((a,b)=>a.a.acc-b.a.acc);return rows[0]?rows[0].p:5;
}
function p6MenuFor(date){
  const s=p6();const sp=p6Span();const ph=p6PhaseOf(sp.frac);
  const dow=date.getDay();const weekend=dow===0||dow===6;
  const budget=weekend?(s.we||90):(s.wd||60);
  const hasMistakes=typeof mistakeItems==='function'&&mistakeItems().length>0;
  const ok=a=>a!=='mistake'||hasMistakes;
  const list=[];let mins=0;
  const add=a=>{const t=P6_TASKS[a];list.push(a);mins+=t.m};
  if(weekend&&p6LastMockDays()>=P6_MOCK_EVERY[ph.n]){add('mock');if(hasMistakes)add('mistake')}
  const m=P6_MENU[ph.n];
  m.base.filter(ok).forEach(a=>{if(mins<budget||list.length<2)add(a)});
  let k=0;
  while(mins+3<budget&&k<40){const a=m.extra[k%m.extra.length];k++;if(!ok(a))continue;if(mins+P6_TASKS[a].m>budget+3)break;add(a)}
  if(s.travel!==false&&[2,4,6].includes(dow))add('talk');
  return{phase:ph,list,mins,budget};
}

/* ---------- 推定スコア（L/R別） ---------- */
function p6EstLR(){
  const L=typeof gwPartAcc==='function'?gwPartAcc([1,2,3,4]):null;
  const R=typeof gwPartAcc==='function'?gwPartAcc([5,6,7]):null;
  const r5=v=>Math.max(5,Math.min(495,Math.round(v/5)*5));
  return{L:L?r5(L.acc*495):null,R:R?r5(R.acc*495):null};
}
function p6Est(){
  const h=(PROG.scoreHist||[]);const last=h[h.length-1];
  const lr=p6EstLR();const fresh=last&&Date.now()-(last.ts||0)<30*864e5;
  if(lr.L!=null&&lr.R!=null){
    const part=lr.L+lr.R;
    if(fresh)return{score:Math.round((last.score*0.5+part*0.5)/5)*5,src:'模試＋パート別の正答率',L:lr.L,R:lr.R};
    return{score:part,src:'パート別の正答率（L '+lr.L+' / R '+lr.R+'）',L:lr.L,R:lr.R};
  }
  if(fresh)return{score:last.score,src:last.placement?'レベル診断':'模試'};
  return{score:toeicScore(),src:'学習量から推定（パート練習や模試で精度が上がります）'};
}

/* ---------- チェックポイントとペース ---------- */
function p6TierRatio(t){const tot=tierTotal(t);return tot?tierMastered(t)/tot:0}
function p6Acc(parts){const a=typeof gwPartAcc==='function'?gwPartAcc(parts):null;return a?a.acc:0}
function p6MockMax(){return Math.max(0,...(PROG.scoreHist||[]).filter(x=>!x.placement).map(x=>x.score))}
function p6Checkpoints(){
  const T=toeicTarget();const sp=p6Span();
  const pct=v=>Math.round(v*100)+'%';
  const cps=[
    {at:0.30,label:'基礎固め',items:[['コア600語を8割覚える',p6TierRatio(0),0.8],['Part 5 正答率 65%',p6Acc(5),0.65],['Part 2 正答率 70%',p6Acc(2),0.7]]},
    {at:0.55,label:'リスニング強化',items:[['頻出熟語を8割覚える',p6TierRatio(5),0.8],['Part 3・4 正答率 60%',p6Acc([3,4]),0.6],['Part 1・2 正答率 75%',p6Acc([1,2]),0.75]]},
    {at:0.85,label:'読解・実戦',items:[['模試で '+(T-50)+' 点',p6MockMax()/(T-50),1],['Part 7 正答率 60%',p6Acc(7),0.6],['銀の基礎語彙を7割',p6TierRatio(1),0.7]]},
    {at:1.00,label:'本番',items:[['模試で '+T+' 点',p6MockMax()/T,1],['Part 5 正答率 80%',p6Acc(5),0.8]]}
  ];
  return cps.map(c=>{
    const date=new Date(sp.start.getTime()+c.at*sp.total*864e5);
    const items=c.items.map(([l,v,need])=>({l,v,need,ok:v>=need,show:need===1?(v?Math.round(v*100)+'%到達':'未受験'):pct(Math.min(1,v))+' / '+pct(need)}));
    const done=items.every(i=>i.ok);
    const status=done?'done':sp.frac>=c.at?'late':(sp.frac>=c.at-0.3?'now':'next');
    return{...c,date,items,done,status};
  });
}
function p6Pace(){
  const s=p6();const sp=p6Span();const T=toeicTarget();
  const S=s.startScore||400;const est=p6Est().score;
  const expect=Math.round(S+(T-S)*Math.min(1,sp.frac/0.9));
  const diff=est-expect;
  let msg,lv;
  if(sp.elapsed<10){lv='new';msg='スタートしたばかり。まずは2週間、毎日のメニューを続けよう'}
  else if(diff>=10){lv='ahead';msg=`予定より ${diff}点 先行中。この調子！`}
  else if(diff>=-20){lv='ok';msg='ほぼ予定どおり。毎日のメニューを続ければ届くペースです'}
  else{lv='behind';const add=diff<-60?30:15;msg=`予定より ${-diff}点 遅れ気味。1日の学習を +${add}分 にするか、弱点パート集中を増やそう`}
  return{est,expect,diff,msg,lv};
}

/* ---------- 攻略ガイド ---------- */
const P6_GUIDE=[
  {t:'650点の取り方（全体戦略）',b:[
    '目安は <b>リスニング350点＋リーディング300点</b>。正答率でいうと L 約70%・R 約60%です。全問正解は要りません。',
    'リスニングは短期間で伸びやすいので、<b>まずLで稼ぐ</b>のが最短ルート。Part 1・2 は取りこぼさないことが前提です。',
    'リーディングは <b>Part 5 で確実に稼ぎ、Part 7 は解けるものから</b>。最後まで解き切れなくても650点は届きます。',
    '毎日の学習は「単語＋文法」が軸。語彙が足りないとリスニングも長文も伸びないため、6か月間ずっと続けます。']},
  {t:'本番の時間配分（リーディング75分）',b:[
    'Part 5（30問）：<b>10分</b>（1問20秒）。わからない問題は勘で塗って次へ。',
    'Part 6（16問）：<b>8分</b>。文挿入問題は最後に回す。',
    'Part 7（54問）：<b>残り約55分</b>。1問1分ペース。シングル→ダブル→トリプルの順。',
    '残り5分になったら、未回答を全部同じ記号で塗る（空欄にしない）。']},
  {t:'Part 1・2 のコツ',b:[
    'Part 1：<b>人物の動作</b>か<b>物の状態</b>かをまず見る。<i>is being 〜ed</i>（今まさに〜されている）は、人が写っていないと不正解になりやすい。',
    'Part 2：<b>最初の疑問詞（When/Where/Who/Why/How）を絶対に聞き逃さない</b>。ここだけで正解を絞れる問題が多い。',
    'Part 2 のひっかけ：問いと<b>同じ単語・似た音</b>が入った選択肢は誤答のことが多い（print → printer など）。',
    'Yes/No 疑問でも、<b>Yes/No を言わない応答</b>（「まだ聞いていない」「〜に聞いて」）が正解になりやすい。']},
  {t:'Part 3・4 のコツ',b:[
    '音声が流れる前に<b>設問（と選択肢）を先に読む</b>。何を聞き取ればいいかが分かれば、正答率が大きく上がります。',
    '正解の選択肢は、本文の単語を<b>言い換えた表現</b>になっていることが多い（car → vehicle など）。',
    '1問目は冒頭、3問目は最後にヒントがあることが多い。聞き逃したら引きずらず次の設問へ。',
    '復習ではスクリプトを見ながら<b>音読・シャドーイング</b>。聞き取れなかった部分を口に出すと耳が育ちます。']},
  {t:'Part 5・6 のコツ',b:[
    'まず選択肢を見て<b>問題タイプを判断</b>：品詞（-tion/-ive/-ly）、動詞の形、前置詞vs接続詞、語彙。',
    '<b>品詞問題は空所の前後だけで5秒</b>で解ける。全文を読まない。',
    '前置詞か接続詞か：後ろが<b>名詞なら前置詞</b>（despite / due to）、<b>文（S+V）なら接続詞</b>（although / because）。',
    'Part 6 は空所の前後の文の<b>時制・つなぎ言葉（However / Therefore）</b>をヒントに。']},
  {t:'Part 7 のコツ',b:[
    '<b>設問を先に読み</b>、本文の該当箇所を探す（全文精読はしない）。',
    '「NOT問題」「推測問題」は時間がかかるので後回しでOK。',
    '650点なら正答率6割で十分。<b>難問に時間をかけず、易しい問題を確実に</b>。']},
  {t:'いちばん効く勉強法',b:[
    '<b>毎日少しずつ</b>：週末にまとめて6時間より、毎日1時間の方が定着します（分散学習）。',
    '<b>間違えた問題が宝</b>：ミスノートで48時間以内に解き直す。同じミスを本番で繰り返さないことが最も点数になります。',
    '<b>思い出す練習</b>：答えを見る前に一度考える。単語は「知っている／曖昧／知らない」を正直に押すと、復習のタイミングが最適化されます。',
    '<b>模試で現在地を測る</b>：伸びが見えるとやる気が続き、弱点にも気づけます。',
    '試験の<b>2〜3か月前に一度受験</b>しておくと、本番の緊張と時間配分に慣れて本命で点が出やすくなります。']}
];
const P6_TIPS=[
  'Part 2 は最初の疑問詞だけは絶対に聞き逃さない。それだけで選択肢を2つ消せることが多い。',
  '品詞問題は空所の前後だけを見る。the ___ of なら名詞、be動詞の後なら形容詞が入りやすい。',
  'Part 3・4 は、音声の前に設問を読む。何を聞けばいいか分かるだけで正答率が上がる。',
  '単語は「曖昧」を正直に押そう。覚えたつもりの語ほど本番で迷います。',
  'Part 1 で人が写っていないのに being が聞こえたら、その選択肢は疑おう。',
  '後ろが名詞なら前置詞(despite)、文なら接続詞(although)。Part 5 の頻出パターン。',
  'Part 7 は全部読まない。設問のキーワードを本文で探しにいく。',
  'Part 2 で問いと同じ単語が聞こえたら要注意。似た音・同じ語はひっかけの定番。',
  '間違えた問題は「なぜ間違えたか」を一言でメモすると、同じミスが減る。',
  'リスニングの復習は、スクリプトを見て音読→何も見ずにシャドーイング。',
  'Part 5 で20秒考えてもわからなければ、勘で選んで次へ。時間は Part 7 のためにとっておく。',
  'Part 3 の正解は本文の言い換え。本文と同じ単語の選択肢は逆に疑う。',
  '毎日同じ時間に勉強すると習慣になる。通勤・昼休み・寝る前など時間を決めよう。',
  'increase by 〜（〜だけ増える）、as of 〜（〜付けで）など、前置詞の熟語は Part 5 の得点源。',
  '模試の後は、点数より「どのパートで落としたか」を見る。そこが次の2週間の重点。',
  'Part 6 の文挿入問題は最後に。前後の文の流れ(代名詞・つなぎ言葉)が鍵。',
  '疲れた日は単語10語だけでもOK。ゼロの日を作らないことが一番大事。',
  'Would you mind 〜? に「いいですよ」と答えるなら Not at all。Part 2 の頻出。',
  'Part 4 は最初の一文で「誰が・どこで・何の話か」をつかむと残りが楽になる。',
  '試験の1か月前からは新しい教材より、ミスノートの解き直しを優先。'
];
function p6Tip(){const d=Math.floor(Date.now()/864e5);return P6_TIPS[d%P6_TIPS.length]}

/* ---------- 設定モーダル ---------- */
function p6Setup(onDone){
  const s=p6();
  const exam=s.exam||addDays(182);
  const segs=(key,vals,cur)=>`<div class="tk-seg p6-seg" data-k="${key}">${vals.map(([v,l])=>`<button data-v="${v}" class="${String(cur)===String(v)?'on':''}">${l}</button>`).join('')}</div>`;
  const ov=document.createElement('div');ov.className='gw-cele';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  ov.innerHTML=`<div class="gw-cele-card p6-setup">
    <div class="gw-cele-k">TOEIC ${toeicTarget()} Roadmap</div>
    <div class="gw-cele-t">あなた専用の<br>短期集中プランを作る</div>
    <label class="p6-field"><span>試験日（受ける予定の公開テスト）</span><input type="date" id="p6-exam" value="${exam}" min="${addDays(14)}"></label>
    <div class="p6-quick"><button data-m="3">3か月後</button><button data-m="4">4か月後</button><button data-m="6">6か月後</button></div>
    <div class="p6-field"><span>目標スコア</span>${segs('goal',[[600,'600'],[650,'650'],[700,'700'],[730,'730']],toeicTarget())}</div>
    <div class="p6-field"><span>平日の学習時間</span>${segs('wd',[[30,'30分'],[45,'45分'],[60,'60分'],[90,'90分']],s.wd||60)}</div>
    <div class="p6-field"><span>休日の学習時間</span>${segs('we',[[45,'45分'],[60,'60分'],[90,'90分'],[120,'120分']],s.we||90)}</div>
    <div class="p6-field"><span>旅行英会話も並行する（週3回・5分）</span>${segs('travel',[[1,'する'],[0,'しない']],s.travel===false?0:1)}</div>
    <div class="p6-note">6か月で650点なら、目安は<b>平日60分・休日90分</b>（合計約250時間）。今のスコアが500点前後なら平日45分でも狙えます。</div>
    <div class="tk-fb-btns"><button class="btn btn-secondary" id="p6-cancel">あとで</button><button class="btn btn-gold" id="p6-save">プランを作る ${ICONS.arrowRight}</button></div>
  </div>`;
  document.body.appendChild(ov);
  const val={goal:toeicTarget(),wd:s.wd||60,we:s.we||90,travel:s.travel===false?0:1};
  ov.querySelectorAll('.p6-seg').forEach(seg=>seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{val[seg.dataset.k]=+b.dataset.v;seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))}));
  ov.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const d=new Date();d.setMonth(d.getMonth()+ +b.dataset.m);ov.querySelector('#p6-exam').value=d.toISOString().slice(0,10)});
  ov.querySelector('#p6-cancel').onclick=()=>ov.remove();
  ov.querySelector('#p6-save').onclick=()=>{
    const ex=ov.querySelector('#p6-exam').value;
    if(!ex||ex<addDays(14)){showToast('試験日は2週間以上先にしてください');return}
    const first=!s.exam;
    Object.assign(s,{exam:ex,wd:val.wd,we:val.we,travel:!!val.travel});
    if(first||!s.start){s.start=todayStr();s.startScore=p6Est().score}
    PROG.toeicGoal=val.goal;PROG.planStart=s.start;
    commit();ov.remove();sfx('unlock');
    showToast(first?'プランを作成しました':'プランを更新しました');
    if(onDone)onDone();else openRoadmap();
  };
}

/* ---------- ロードマップ画面 ---------- */
function openRoadmap(){
  if(!p6Ready())return p6Setup();
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  const el=document.getElementById('screen-review');el.classList.add('active');
  const s=p6();const sp=p6Span();const ph=p6PhaseOf(sp.frac);const pace=p6Pace();const est=p6Est();
  const menu=planTasksForToday();const mins=menu.reduce((a,t)=>a+t.mins,0);const done=menu.filter(t=>t.done).length;
  const cps=p6Checkpoints();
  const segs=P6_PHASES.map((p,i)=>{const from=i?P6_PHASES[i-1].to:0;const to=Math.min(1,p.to);return`<div class="p6-tl-seg ${p.n<ph.n?'past':p.n===ph.n?'cur':''}" style="flex:${to-from}"><span>${p.ja}</span></div>`}).join('');
  const examStr=(sp.exam.getMonth()+1)+'/'+sp.exam.getDate();
  el.innerHTML=`<div class="back-row"><button class="icon-btn" id="p6-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>${toeicTarget()}点ロードマップ</h2><button class="icon-btn" id="p6-edit" aria-label="プラン設定">${ICONS.user}</button></div>
    <div class="p6-hero">
      <div class="p6-hero-top"><div><div class="p6-k">試験日 ${examStr}</div><div class="p6-days">${sp.left>0?'あと <b>'+sp.left+'</b> 日':sp.left===0?'<b>今日が本番！</b>':'試験は終了しました'}</div></div>
        <div class="p6-est"><small>推定スコア</small><b>${est.score}</b><small>目標 ${toeicTarget()}</small></div></div>
      <div class="p6-tl">${segs}<i class="p6-tl-now" style="left:${Math.round(sp.frac*100)}%"></i></div>
      <div class="p6-phase"><b>Phase ${ph.n}：${ph.ja}</b> — ${ph.goal}</div>
      <div class="p6-pace p6-pace-${pace.lv}">${esc(pace.msg)}</div>
    </div>
    <div class="card p6-today">
      <div class="gw-q-h"><span>${ICONS.zap} 今日のメニュー</span><span class="gw-q-meta">${done}/${menu.length} · 約${mins}分</span></div>
      ${menu.map(t=>`<div class="p6-task ${t.done?'done':''}"><span class="p6-task-m">${t.mins}分</span><span class="p6-task-b"><span class="tk-row-t">${esc(t.title)}</span><span class="tk-row-s">${esc(t.sub)}</span></span><span class="p6-task-c">${t.done?ICONS.check:''}</span></div>`).join('')}
      <button class="btn btn-gold btn-block" id="p6-start" style="margin-top:12px">${done>=menu.length?'今日のメニュー完了！ 復習する':'今日のメニューを始める'} ${ICONS.arrowRight}</button>
    </div>
    <div class="card p6-tip"><div class="p6-k">今日のコツ</div><div>${esc(p6Tip())}</div></div>
    <div class="card p6-why"><div class="p6-k">いまのフェーズで大事なこと</div><div>${esc(ph.why)}</div></div>
    <div class="sec-title">${ICONS.award} チェックポイント</div>
    ${cps.map(c=>`<div class="card p6-cp p6-cp-${c.status}"><div class="p6-cp-h"><span class="p6-cp-badge">${c.status==='done'?'達成':c.status==='late'?'要挽回':c.status==='now'?'挑戦中':'これから'}</span><b>${esc(c.label)}</b><span class="gw-q-meta">${c.date.getMonth()+1}/${c.date.getDate()} まで</span></div>
      ${c.items.map(i=>`<div class="p6-cp-row ${i.ok?'ok':''}"><span class="gw-cd-box">${i.ok?ICONS.check:''}</span><span class="p6-cp-l">${esc(i.l)}</span><span class="p6-cp-v">${i.show}</span></div>`).join('')}</div>`).join('')}
    <div class="sec-title">${ICONS.bookmark} 攻略ガイド</div>
    ${P6_GUIDE.map((g,i)=>`<details class="card p6-guide" ${i===0?'open':''}><summary>${esc(g.t)}</summary><ul>${g.b.map(x=>`<li>${x}</li>`).join('')}</ul></details>`).join('')}
    <button class="btn btn-secondary btn-block" id="p6-edit2" style="margin-top:6px">プランを変更（試験日・学習時間）</button>`;
  document.getElementById('p6-back').onclick=()=>go('home');
  document.getElementById('p6-edit').onclick=()=>p6Setup();
  document.getElementById('p6-edit2').onclick=()=>p6Setup();
  document.getElementById('p6-start').onclick=()=>startDaySession();
  window.scrollTo(0,0);
  anim('.p6-hero',{opacity:0,y:12},{opacity:1,y:0,duration:0.35,ease:'power2.out'});
}
function p6BannerHTML(){
  if(!p6Ready())return `<button class="p6-banner p6-banner-setup" id="p6-banner"><span class="p6-banner-ic">${ICONS.award}</span><span class="p6-banner-b"><b>TOEIC ${toeicTarget()}点 短期集中プランを作る</b><small>試験日と学習時間から、毎日のメニューを自動で組みます（30秒）</small></span><span>${ICONS.arrowRight}</span></button>`;
  const sp=p6Span();const ph=p6PhaseOf(sp.frac);const pace=p6Pace();
  return `<button class="p6-banner" id="p6-banner"><span class="p6-banner-ic">${ICONS.award}</span><span class="p6-banner-b"><b>TOEIC ${toeicTarget()} · 試験まで${Math.max(0,sp.left)}日</b><small>Phase ${ph.n} ${ph.ja} · <span class="p6-pace-t p6-pace-${pace.lv}">${pace.lv==='behind'?'遅れ気味':pace.lv==='ahead'?'先行中':'予定どおり'}</span></small></span><span>${ICONS.arrowRight}</span></button>`;
}

/* ---------- 本番形式：Part 2 を音声のみで ---------- */
function p6PickP2(n){
  const t=todayStr();
  const score=q=>{const r=PROG.phrases[q.id];if(!r||!r.views)return 0;if(r.incorrect>r.correct)return 1;if(r.nextReview<=t)return 2;return 3};
  return [...TOEIC_P2].sort(()=>Math.random()-0.5).sort((a,b)=>score(a)-score(b)).slice(0,n);
}
function p6PlayP2(q){
  if(!('speechSynthesis'in window))return;
  const L=['A','B','C'];
  speak(q.q,0.9,'female');
  q.choices.forEach((c,i)=>speakQueue(L[i]+'. '+c,0.9,'male'));
}

/* ---------- 既存機能への接続 ---------- */
function p6Install(){
  // 毎日のメニュー
  planTasksForToday=function(){
    if(!p6Ready())return p6LegacyTasks();
    const m=p6MenuFor(new Date());
    const done=PROG['plan_'+todayStr()]||[];
    const seen={};
    return m.list.map(a=>{seen[a]=(seen[a]||0)+1;const t=P6_TASKS[a];const id='p6_'+a+'_'+seen[a];
      let title=t.t,sub=t.sub;
      if(a==='weak'){const p=p6WeakPart();title='弱点集中：Part '+p;sub='いちばん正答率が低いパート'}
      return{id,title,sub,mins:t.m,action:a,done:done.includes(id)}});
  };
  planPhase=function(){const ph=p6PhaseOf(p6Span().frac);return{n:ph.n,name:ph.name,ja:ph.ja,desc:ph.goal}};
  const _pta=planTaskAction;
  planTaskAction=function(a){
    if(a==='mock')return startMock();
    if(a==='mistake')return openMistakeNote();
    if(a==='p6')return openTOEICPart(6);
    if(a==='weak')return openTOEICPart(p6WeakPart());
    return _pta(a);
  };
  // 推定スコアを L/R 別の算出に（TOEICタブ・ゴール表示も同じ値になる）
  gwToeicEst=function(){const e=p6Est();return{score:e.score,src:e.src}};
  // 模試・音声変化の結果画面にも「次へ」（1本道セッション用）
  const addNav=()=>{if(inDaySession()&&!document.querySelector('#screen-review [onclick="advanceDaySession()"]')){const d=document.createElement('div');d.innerHTML=sessionNavHTML();(document.querySelector('#screen-review .result-card')||document.getElementById('screen-review')).appendChild(d)}};
  const _fm=finishMock;finishMock=function(){const r=_fm.apply(this,arguments);addNav();return r};
  const _rr=renderReductionResult;renderReductionResult=function(){const r=_rr.apply(this,arguments);addNav();return r};
  // Part 2：10問・音声のみ（本番形式）
  openTOEICP2=function(){
    const items=p6PickP2(10).map(x=>({...x,stem:x.q}));
    openTOEICDrill(items,2,'Part 2 · 応答（音声のみ）');
    toeicDrillState._audio=true;renderTOEICDrillStep();
  };
  const _rs=renderTOEICDrillStep;
  renderTOEICDrillStep=function(){
    _rs.apply(this,arguments);
    const st=toeicDrillState;if(!st||st.i>=st.items.length)return;
    const q=st.items[st.i];
    if(st.part===2&&st._audio){
      const qt=document.querySelector('#screen-review .q-text');
      if(qt)qt.outerHTML=`<div class="p6-audio"><button class="tk-mic tk-play-big" id="p6-play" aria-label="もう一度聞く">${ICONS.play}</button><div class="tk-row-s">問いかけ → A・B・C の順に流れます。聞いて答えを選んでください。</div><div class="p6-script" id="p6-script" hidden><b>Q:</b> ${esc(q.q)}</div></div>`;
      document.querySelectorAll('#td-choices .choice-btn').forEach((b,i)=>{b.dataset.text=b.textContent;b.textContent='（音声を聞いて選ぶ）';b.classList.add('p6-abc')});
      document.getElementById('p6-play').onclick=()=>p6PlayP2(q);
      setTimeout(()=>p6PlayP2(q),300);
    }
    if(st.part===5){
      st._t0=Date.now();
      const sub=document.querySelector('#screen-review .sec-sub');
      if(sub){sub.insertAdjacentHTML('beforeend',' <span class="p6-timer" id="p6-timer">0秒</span>');
        clearInterval(st._tm);st._tm=setInterval(()=>{const el=document.getElementById('p6-timer');if(!el||!st._t0){clearInterval(st._tm);return}const s=Math.floor((Date.now()-st._t0)/1000);el.textContent=s+'秒';el.classList.toggle('over',s>20)},500)}
    }
  };
  const _ad=answerTOEICDrill;
  answerTOEICDrill=function(idx){
    const st=toeicDrillState;const q=st&&st.items[st.i];
    const sec=st&&st.part===5&&st._t0?Math.round((Date.now()-st._t0)/1000):null;
    if(st){clearInterval(st._tm);st._t0=0}
    _ad.apply(this,arguments);
    if(!st||!q)return;
    if(st.part===2&&st._audio){
      if('speechSynthesis'in window)speechSynthesis.cancel();
      document.querySelectorAll('#td-choices .choice-btn').forEach((b,i)=>{b.textContent=b.dataset.text||'';b.classList.remove('p6-abc')});
      const sc=document.getElementById('p6-script');if(sc)sc.hidden=false;
    }
    if(sec!=null){const ex=document.getElementById('td-exp');if(ex)ex.insertAdjacentHTML('afterbegin',`<div class="p6-sec ${sec>20?'over':''}">⏱ ${sec}秒${sec>20?'（目標20秒。迷ったら勘で次へ）':' ⚡ 目標クリア'}</div>`)}
  };
  // ホーム：プランのバナーを一番上に
  const _home=renderHome;
  renderHome=function(){
    _home.apply(this,arguments);
    const home=document.getElementById('screen-home');if(!home)return;
    const d=document.createElement('div');d.innerHTML=p6BannerHTML();const node=d.firstElementChild;
    home.prepend(node);
    node.onclick=()=>p6Ready()?openRoadmap():p6Setup(()=>{go('home');openRoadmap()});
    if(p6Ready()){
      const tip=document.createElement('div');tip.className='p6-home-tip';tip.innerHTML=`<b>今日のコツ</b> ${esc(p6Tip())}`;
      const focus=home.querySelector('.focus-card');if(focus)focus.appendChild(tip);
    }
  };
  // TOEICタブ：ロードマップと攻略ガイドへの入口
  const _rp=renderTOEICPracticeTab;
  renderTOEICPracticeTab=function(body){
    _rp.apply(this,arguments);
    const d=document.createElement('div');d.innerHTML=p6BannerHTML();const node=d.firstElementChild;node.id='p6-banner-toeic';
    body.prepend(node);node.onclick=()=>p6Ready()?openRoadmap():p6Setup(()=>openRoadmap());
  };
  if(typeof curTab!=='undefined'&&curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome();
}
// 設定前の従来メニュー（index.html の元の planTasksForToday を保存しておく）
const p6LegacyTasks=planTasksForToday;
if(typeof go==='function')p6Install();
