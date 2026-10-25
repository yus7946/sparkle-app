/* ========== 日本人のための英語ジム（Sparkle の中心） ==========
   日本人がつまずく5つの「クセ」を診断して、毎日少しずつ直す。
   1. 聞き分け  … 日本語にない音（L/R・TH/S・V/B）　→ 発音ジム（talk.js）
   2. 音の変化  … つながる・消える音（gonna / Check it out）→ 音声変化ドリル＋シャドーイング
   3. 和製英語  … カタカナ語の思い込み（マンション≠mansion）→ 和製英語トラップ（このファイル）
   4. 文法のクセ … 冠詞・複数形・三単現・時制・前置詞・自動詞/他動詞 → 文法のクセ（このファイル）
   5. 瞬発力    … 日本語を介さず英語がすぐ出る力 → 瞬間英作文（声に出して音声認識で判定）
   ・3分のクセ診断（15問）→ レーダーチャート → あなたのクセ TOP2 と処方箋
   ・毎日の「今日の目標」に、いちばん弱いクセの5問（3分）が入る
   index.html / talk.js / plan650.js / habit.js の後に読み込む。 */
'use strict';

const JP_AXES=[
  {k:'ear',name:'聞き分け',ja:'L/R・TH・V/B など日本語にない音',fix:'発音ジム',go:()=>{go('talk');if(typeof renderGym==='function')renderGym()}},
  {k:'link',name:'音の変化',ja:'gonna・Check it out などつながる音',fix:'音声変化ドリル',go:()=>openReduction()},
  {k:'wasei',name:'和製英語',ja:'マンション≠mansion などカタカナの思い込み',fix:'和製英語トラップ',go:()=>jpWaseiOpen()},
  {k:'gram',name:'文法のクセ',ja:'冠詞・複数形・三単現・前置詞',fix:'文法のクセ',go:()=>jpGrammarOpen()},
  {k:'speak',name:'瞬発力',ja:'日本語を介さず英語がすぐ出る力',fix:'瞬間英作文',go:()=>openIC()}
];
// 和製英語：[カタカナ, 場面, 正解, 罠（カタカナをそのまま英語にしたもの）, もう1つの誤答, 解説]
const JP_WASEI=[
  ['マンション','住んでいる集合住宅','apartment','mansion','house','mansion は「大豪邸」。普通の集合住宅は apartment（分譲なら condo）。'],
  ['クレーム','お客様からの苦情','complaint','claim','comment','claim は「主張する・請求する」。苦情は complaint。TOEIC頻出。'],
  ['サラリーマン','会社員','office worker','salaryman','pay man','salaryman は通じない。office worker / company employee と言う。'],
  ['コンセント','壁の電源の差し込み口','outlet','consent','concent','consent は「同意」。電源は outlet（英国では socket）。'],
  ['ノートパソコン','持ち運べるパソコン','laptop','note PC','desk PC','note PC は和製英語。laptop が一般的。'],
  ['アンケート','お客様への調査','survey','enquete','inquiry','アンケートはフランス語由来。英語では survey / questionnaire。'],
  ['フロント','ホテルの受付','front desk','front','counter man','front だけでは「前」。ホテルの受付は front desk / reception。'],
  ['モーニングコール','ホテルの起こしてもらう電話','wake-up call','morning call','morning bell','morning call は和製英語。wake-up call を頼む。'],
  ['バイキング','食べ放題の料理','buffet','viking','self food','viking は北欧の海賊。食べ放題は buffet。'],
  ['ガソリンスタンド','車の給油所','gas station','gasoline stand','oil shop','米国では gas station（英国では petrol station）。'],
  ['シール','ノートに貼るもの','sticker','seal','tape','seal は「封印・印章」。貼るシールは sticker。'],
  ['ペットボトル','飲み物の容器','plastic bottle','pet bottle','soft bottle','PET は素材名で、英語では plastic bottle。'],
  ['ホッチキス','紙をとめる文房具','stapler','hotchkiss','clipper','ホッチキスは人名由来。英語は stapler。'],
  ['ガードマン','ビルの警備員','security guard','guard man','police man','guard man は通じにくい。security guard。'],
  ['ワンピース','女性の服','dress','one-piece','skirt','one-piece は主に水着。服のワンピースは dress。'],
  ['レンジ','温める調理家電','microwave','range','oven','range は「コンロ・レンジ台」。電子レンジは microwave。'],
  ['キーホルダー','鍵につける飾り','key chain','key holder','key case','key chain（key ring）。key holder は鍵掛け。'],
  ['サイン','有名人に書いてもらうもの','autograph','sign','signal','有名人のサインは autograph。書類の署名は signature。sign は「標識」や動詞。'],
  ['カンニング','テストの不正','cheating','cunning','stealing','cunning は「ずる賢い」。不正は cheating。'],
  ['ハンドル','車を操作する輪','steering wheel','handle','driver','車のハンドルは steering wheel。handle は取っ手。'],
  ['フライドポテト','ファストフードの揚げたじゃがいも','fries','fried potato','potato chips','米国は (French) fries。英国では chips。'],
  ['ジェットコースター','遊園地の乗り物','roller coaster','jet coaster','speed ride','jet coaster は和製英語。roller coaster。'],
  ['ノルマ','営業の目標数','quota','norma','goal sheet','ノルマはロシア語由来。英語は quota（sales quota）。'],
  ['リフォーム','家を改装する','renovate','reform','rebuild','reform は「制度を改革する」。家なら renovate / remodel。'],
  ['アフターサービス','購入後のサポート','customer support','after service','back service','after-sales service / customer support と言う。'],
  ['マイペース','自分のペースで','at my own pace','my pace','self speed','I do things at my own pace. のように言う。'],
  ['テンションが高い','気分が盛り上がっている','excited','high tension','high power','tension は「緊張・張りつめた状態」。盛り上がりは excited。'],
  ['スマート','細身の体型','slim','smart','small','smart は「賢い」。細身は slim / slender。'],
  ['ベテラン','経験豊富な人','experienced','veteran','older','veteran は主に「退役軍人」の意味で使われる。experienced / expert。'],
  ['オーダーメイド','注文して作る','custom-made','order-made','hand-made','order-made は和製英語。custom-made / made-to-order。'],
  ['ガッツポーズ','喜びのポーズ','fist pump','guts pose','victory hand','fist pump。guts pose は通じない。'],
  ['クーラー','部屋を冷やす機械','air conditioner','cooler','fan','cooler は「保冷箱」。エアコンは air conditioner / AC。'],
  ['ホームページ','会社のウェブ上の案内','website','homepage','web paper','homepage はサイトのトップページ。サイト全体は website。'],
  ['ポイントカード','買い物でたまるカード','rewards card','point card','stamp ticket','rewards card / loyalty card と言う。'],
  ['ベビーカー','赤ちゃんを乗せて押すもの','stroller','baby car','baby seat','baby car は通じない。stroller（英国では pram / pushchair）。'],
  ['フリーダイヤル','無料でかけられる番号','toll-free number','free dial','free call line','toll-free number。TOEIC の広告問題で頻出。'],
  ['シャープペンシル','芯を出して書く鉛筆','mechanical pencil','sharp pencil','pen pencil','mechanical pencil。'],
  ['リュック','背負うかばん','backpack','ruck','back bag','backpack。リュックはドイツ語由来。']
];
// 文法のクセ：[状況, 正しい英文, 誤り1, 誤り2, 解説, タグ]
const JP_GRAMMAR=[
  ['3時に会議があります','I have a meeting at 3.','I have meeting at 3.','I have the meeting at 3.','初めて話題に出す「数えられる名詞」1つには a。日本語にない冠詞は最大のクセ。','冠詞'],
  ['彼女は医者です','She is a doctor.','She is doctor.','She is the doctor.','職業にも a が必要。','冠詞'],
  ['（同じ部屋の）窓を開けてくれますか','Can you open the window?','Can you open a window?','Can you open window?','お互いにどれか分かっているものには the。','冠詞'],
  ['兄が2人います','I have two brothers.','I have two brother.','I have two brotheres.','2つ以上なら複数形の -s。日本語には複数形がないので落としやすい。','複数形'],
  ['いくつか情報が必要です','I need some information.','I need some informations.','I need an information.','information は数えられない名詞。advice / furniture / equipment も同じ。','複数形'],
  ['アドバイスをもらえますか','Can I get some advice?','Can I get an advice?','Can I get some advices?','advice は数えられない。1つなら a piece of advice。','複数形'],
  ['彼は営業部で働いています','He works in sales.','He work in sales.','He working in sales.','主語が he / she / it の現在形は動詞に -s（三単現）。','三単現'],
  ['上司はそれが好きではありません','My boss doesn\'t like it.','My boss don\'t like it.','My boss not like it.','三人称単数の否定は doesn\'t。','三単現'],
  ['東京に5年住んでいます','I\'ve lived in Tokyo for five years.','I live in Tokyo for five years.','I am living in Tokyo since five years.','過去から今まで続くことは現在完了（have + 過去分詞）。','時制'],
  ['家に着いたら電話します','I\'ll call you when I get home.','I\'ll call you when I will get home.','I call you when I got home.','when / if の後ろは未来のことでも現在形。','時制'],
  ['昨日そこに行きました','I went there yesterday.','I have gone there yesterday.','I go there yesterday.','yesterday など過去の時点があれば過去形。現在完了は使わない。','時制'],
  ['明日雨なら家にいます','If it rains tomorrow, we\'ll stay home.','If it will rain tomorrow, we\'ll stay home.','If it rain tomorrow, we stay home.','条件の if の中は現在形。','時制'],
  ['月曜日に会いましょう','See you on Monday.','See you at Monday.','See you in Monday.','曜日・日付は on、時刻は at、月・年は in。','前置詞'],
  ['会議は午後3時です','The meeting is at 3 p.m.','The meeting is on 3 p.m.','The meeting is in 3 p.m.','時刻は at。','前置詞'],
  ['金曜日までに返信してください','Please reply by Friday.','Please reply until Friday.','Please reply in Friday.','期限（〜までに）は by、継続（〜までずっと）は until。TOEIC頻出。','前置詞'],
  ['その計画について話し合いましょう','Let\'s discuss the plan.','Let\'s discuss about the plan.','Let\'s discuss for the plan.','discuss は他動詞。「〜について」の about は不要。','自動詞・他動詞'],
  ['私に連絡してください','Please contact me.','Please contact to me.','Please contact with me.','contact は他動詞。to / with は不要。','自動詞・他動詞'],
  ['ホテルに着きました','We arrived at the hotel.','We arrived the hotel.','We arrived to the hotel.','arrive は自動詞。場所には at / in が必要。','自動詞・他動詞'],
  ['部屋に入ってください','Please enter the room.','Please enter into the room.','Please enter to the room.','enter は他動詞。into は不要。','自動詞・他動詞'],
  ['駅がどこか知っていますか','Do you know where the station is?','Do you know where is the station?','Do you know where the station?','文の中の疑問文（間接疑問）は「疑問詞＋主語＋動詞」の順。','語順'],
  ['何時か教えてもらえますか','Could you tell me what time it is?','Could you tell me what time is it?','Could you tell me what time?','間接疑問は普通の語順に戻る。','語順'],
  ['とても楽しかったです','I had a great time.','I enjoyed.','I was very enjoy.','enjoy は目的語が必要（I enjoyed it.）。「楽しかった」は I had a great time. が自然。','自動詞・他動詞']
];

function jp(){const j=PROG.jp||(PROG.jp={});j.ax=j.ax||{};j.diag=j.diag||[];return j}
const jpShuf=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
// 弱いクセの把握：直近の正誤（クセ別に最大20件）
function jpLog(axis,ok){const a=jp().ax[axis]||(jp().ax[axis]=[]);a.push(ok?1:0);if(a.length>20)a.shift()}
function jpLevel(axis){const j=jp(),a=j.ax[axis]||[],d=j.diag[j.diag.length-1];
  if(a.length>=5)return a.reduce((x,y)=>x+y,0)/a.length;return d?d.s[axis]:null}
function jpWeakest(){const r=JP_AXES.map(x=>({...x,v:jpLevel(x.k)})).filter(x=>x.v!=null).sort((a,b)=>a.v-b.v);return r[0]||null}

/* ---------- 問題を作る ---------- */
function jpItems(axis,n){
  if(axis==='wasei')return jpShuf(JP_WASEI).slice(0,n).map(w=>{const c=jpShuf([w[2],w[3],w[4]]);
    return{axis,id:'jw_'+w[0],q:`「<b>${esc(w[0])}</b>」（${esc(w[1])}）は英語で？`,choices:c,correct:c.indexOf(w[2]),exp:w[5],say:w[2]}});
  if(axis==='gram')return jpShuf(JP_GRAMMAR).slice(0,n).map(g=>{const c=jpShuf([g[1],g[2],g[3]]);
    return{axis,id:'jg_'+g[1].slice(0,24),q:`「${esc(g[0])}」<br><small>正しい英文はどれ？（${esc(g[5])}）</small>`,choices:c,correct:c.indexOf(g[1]),exp:g[4],say:g[1]}});
  if(axis==='ear'){const pairs=[];(typeof TK_GYM!=='undefined'?TK_GYM:[]).forEach(g=>g.pairs.forEach(p=>pairs.push({g,p})));
    return jpShuf(pairs).slice(0,n).map(({g,p})=>{const w=p[Math.random()<0.5?0:1];return{axis,id:'je_'+p.join('_'),q:'聞こえた単語はどっち？<br><small>'+esc(g.name)+'</small>',choices:[p[0],p[1]],correct:p.indexOf(w),exp:g.ja,play:w}})}
  if(axis==='link')return jpShuf(typeof REDUCTIONS!=='undefined'?REDUCTIONS:[]).slice(0,n).map(r=>{const s=shuffleChoices(r.choices,r.correct);
    return{axis,id:r.id,q:'聞こえた英文の意味に近いのは？',choices:s.choices,correct:s.correctIndex,exp:r.tip,play:r.natural}});
  if(axis==='speak')return jpShuf(typeof IC_DECK!=='undefined'?IC_DECK:[]).slice(0,n).map(c=>({axis,id:c.id,speak:true,q:esc(c.jp),en:c.en,alt:c.alt||[],exp:c.tip}));
  return[];
}

/* ---------- 共通のクイズ画面 ---------- */
let jpQ=null;
function jpQuiz(items,title,onDone){
  jpQ={items,i:0,score:0,title,onDone,res:[]};
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-review').classList.add('active');window.scrollTo(0,0);
  if(typeof lxUnlock==='function')lxUnlock();
  jpRender();
}
function jpSay(t,rate){if(typeof lxSpeakLines==='function')lxSpeakLines([{sp:'N',t}],{rate:rate||0.85});else speak(t,rate||0.85)}
function jpRender(){
  const s=jpQ,el=document.getElementById('screen-review');if(!s)return;
  if(s.i>=s.items.length)return jpFinish();
  const q=s.items[s.i],ax=JP_AXES.find(a=>a.k===q.axis);
  el.innerHTML=`<div id="jp-root"><div class="back-row"><button class="icon-btn" id="jp-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>${esc(s.title)}</h2><span class="gw-q-meta" style="margin-left:auto">${s.i+1}/${s.items.length}</span></div>
    <div class="q-prog"><div class="q-prog-fill" style="width:${s.i/s.items.length*100}%"></div></div>
    <div class="jp-ax">${esc(ax?ax.name:'')}</div>
    <div class="q-text jp-q">${q.q}</div>
    ${q.play?`<button class="btn btn-secondary btn-block" id="jp-play">${ICONS.play} もう一度聞く</button>`:''}
    ${q.speak?`<div class="jp-speak"><div class="hb-note">英語で声に出して言ってみよう（${TK_SR?'8秒・音声認識で判定':'言えたら答えを見る'}）</div>
      ${TK_SR?`<button class="btn btn-gold btn-block" id="jp-mic">🎤 英語で言う</button>`:`<button class="btn btn-gold btn-block" id="jp-show">答えを見る</button>`}<div class="jp-heard" id="jp-heard"></div></div>`
      :`<div id="td-choices">${q.choices.map((c,i)=>`<button class="choice-btn" data-jc="${i}">${esc(c)}</button>`).join('')}</div>`}
    <div class="q-toeic" id="jp-exp" style="display:none"></div><div id="jp-next"></div></div>`;
  document.getElementById('jp-back').onclick=()=>{jpQ=null;lxStop&&lxStop();jpHubOpen()};
  if(q.play){document.getElementById('jp-play').onclick=()=>jpSay(q.play);setTimeout(()=>jpSay(q.play),350)}
  el.querySelectorAll('[data-jc]').forEach(b=>b.onclick=()=>jpAnswer(+b.dataset.jc));
  const mic=document.getElementById('jp-mic');
  if(mic)mic.onclick=()=>{mic.disabled=true;mic.textContent='🎤 聞いています…';
    tkListen({lang:'en-US',maxMs:8000,onInterim:t=>{const h=document.getElementById('jp-heard');if(h)h.textContent=t},
      onDone:text=>{const best=Math.max(...[q.en,...q.alt].map(t=>text?tkAlign(text,t).score:0));jpSpeakResult(best>=60,text,best)},
      onError:()=>jpSpeakResult(null,'',0)})};
  const sh=document.getElementById('jp-show');
  if(sh)sh.onclick=()=>{sh.outerHTML=`<div class="jp-model"><b>${esc(q.en)}</b></div><div class="lx-row"><button class="btn btn-secondary" id="jp-ng">言えなかった</button><button class="btn btn-gold" id="jp-ok">言えた</button></div>`;
    jpSay(q.en);document.getElementById('jp-ok').onclick=()=>jpSpeakResult(true,'',100,true);document.getElementById('jp-ng').onclick=()=>jpSpeakResult(false,'',0,true)};
}
function jpRecord(q,ok){
  const rec=PROG.phrases[q.id]||(PROG.phrases[q.id]=newPhraseRec());rec.views++;if(ok){rec.correct++;srsGrade(rec,2)}else{rec.incorrect++;srsGrade(rec,0)}
  jpLog(q.axis,ok);jpQ.res.push({axis:q.axis,ok});if(ok)jpQ.score++;commit();
  if(typeof comboHit==='function')comboHit(ok);
}
function jpShowNext(q){
  const ex=document.getElementById('jp-exp');ex.innerHTML=`<strong>${esc(q.exp||'')}</strong>`;ex.style.display='block';
  document.getElementById('jp-next').innerHTML=`<button class="btn btn-primary btn-block" id="jp-n" style="margin-top:14px">${jpQ.i+1>=jpQ.items.length?'結果を見る':'次へ'} ${ICONS.arrowRight}</button>`;
  document.getElementById('jp-n').onclick=()=>{jpQ.i++;jpRender()};
}
function jpAnswer(i){
  const q=jpQ.items[jpQ.i],ok=i===q.correct;
  document.querySelectorAll('#td-choices .choice-btn').forEach((b,k)=>{b.disabled=true;if(k===q.correct)b.classList.add('q-perfect');else if(k===i)b.classList.add('q-ng')});
  sfx(ok?'correct':'wrong');jpRecord(q,ok);
  if(q.say)jpSay(q.say,0.9);
  jpShowNext(q);
}
function jpSpeakResult(ok,text,score,self){
  const q=jpQ.items[jpQ.i];
  if(ok===null){showToast('音声認識を開始できませんでした。答えを見て自己判定してください');ok=false}
  const box=document.querySelector('.jp-speak');
  if(box&&!self)box.innerHTML=`<div class="jp-model"><b>${esc(q.en)}</b>${text?`<small>聞き取り：${esc(text)}（一致 ${score}%）</small>`:''}</div>`;
  sfx(ok?'correct':'wrong');jpRecord(q,ok);jpSay(q.en);jpShowNext(q);
}
function jpFinish(){
  const s=jpQ;jpQ=null;
  if(s.onDone)return s.onDone(s);
  const el=document.getElementById('screen-review');const per=Math.round(s.score/s.items.length*100);
  el.innerHTML=`${sparkHeroHTML(per>=80?'win':per>=50?'hello':'cheer')}<div class="card result-card"><div class="result-score">${s.score} / ${s.items.length}</div>
    <div class="result-msg">${esc(s.title)} 完了！ 間違えた問題は数日後にまた出ます。クセは「気づく→くり返す」で直ります。</div>
    ${inDaySession()?sessionNavHTML():`<button class="btn btn-secondary btn-block" style="margin-top:12px" onclick="jpHubOpen()">英語ジムへ戻る</button><button class="btn btn-gold btn-block" style="margin-top:8px" onclick="go('home')">Home ${ICONS.arrowRight}</button>`}</div>`;
  window.scrollTo(0,0);
}
function jpWaseiOpen(){jpQuiz(jpItems('wasei',8),'和製英語トラップ')}
function jpGrammarOpen(){jpQuiz(jpItems('gram',8),'文法のクセ')}

/* ---------- 3分のクセ診断 ---------- */
function jpDiagOpen(){
  const items=jpShuf(JP_AXES.flatMap(a=>jpItems(a.k,3)));
  jpQuiz(items,'英語のクセ診断',s=>{
    const sc={};JP_AXES.forEach(a=>{const r=s.res.filter(x=>x.axis===a.k);sc[a.k]=r.length?r.filter(x=>x.ok).length/r.length:0});
    jp().diag.push({d:todayStr(),s:sc});commit();
    if(typeof spkCoin==='function')spkCoin(30,'クセ診断');
    jpDiagResult();
  });
}
function jpRadar(sc,prev,size){
  const W=size||240,c=W/2,R=W*0.36,n=JP_AXES.length,pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[(c+Math.cos(a)*R*v).toFixed(1),(c+Math.sin(a)*R*v).toFixed(1)]};
  const poly=s=>JP_AXES.map((a,i)=>pt(i,Math.max(0.06,s[a.k]||0)).join(',')).join(' ');
  const rings=[1,0.66,0.33].map(v=>`<polygon points="${JP_AXES.map((a,i)=>pt(i,v).join(',')).join(' ')}" class="jp-ring"/>`).join('');
  const labels=JP_AXES.map((a,i)=>{const[x,y]=pt(i,1.24);return`<text x="${x}" y="${y}" class="jp-lbl" text-anchor="middle" dominant-baseline="middle">${a.name}</text>`}).join('');
  return`<svg viewBox="0 0 ${W} ${W}" class="jp-radar" role="img" aria-label="英語のクセのレーダーチャート">${rings}${prev?`<polygon points="${poly(prev)}" class="jp-prev"/>`:''}<polygon points="${poly(sc)}" class="jp-now"/>${labels}</svg>`;
}
function jpDiagResult(){
  const j=jp(),d=j.diag[j.diag.length-1],p=j.diag.length>1?j.diag[j.diag.length-2]:null;if(!d)return jpHubOpen();
  const order=JP_AXES.map(a=>({...a,v:d.s[a.k]})).sort((a,b)=>a.v-b.v),top=order.slice(0,2);
  const el=document.getElementById('screen-review');
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));el.classList.add('active');
  el.innerHTML=`<div class="back-row"><button class="icon-btn" id="jp-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>あなたの英語のクセ</h2></div>
    <div class="card jp-res">${jpRadar(d.s,p&&p.s)}${p?'<div class="hb-note" style="text-align:center">薄い線は前回の診断。外側に広がるほど得意です。</div>':''}</div>
    <div class="sec-title">${ICONS.zap} 直すと伸びるクセ TOP2</div>
    ${top.map((a,i)=>`<div class="card jp-top"><div class="jp-top-h"><b>${i+1}. ${a.name}</b><span>${Math.round(a.v*100)}%</span></div><div class="hb-note" style="margin-top:2px">${a.ja}</div>
      <button class="btn ${i?'btn-secondary':'btn-gold'} btn-block" data-fix="${a.k}" style="margin-top:8px">処方箋：${a.fix}へ ${ICONS.arrowRight}</button></div>`).join('')}
    <div class="hb-note">これから毎日の「今日の目標」に、いちばん弱いクセの5問（約3分）が入ります。30日ごとに再診断して、変化を確かめよう。</div>
    <button class="btn btn-secondary btn-block" id="jp-hub" style="margin-top:10px">英語ジムを見る</button>`;
  document.getElementById('jp-back').onclick=()=>go('home');
  document.getElementById('jp-hub').onclick=jpHubOpen;
  el.querySelectorAll('[data-fix]').forEach(b=>b.onclick=()=>JP_AXES.find(a=>a.k===b.dataset.fix).go());
  window.scrollTo(0,0);
}

/* ---------- 英語ジム（ハブ） ---------- */
function jpHubOpen(){
  const j=jp(),d=j.diag[j.diag.length-1],el=document.getElementById('screen-review');
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));el.classList.add('active');
  const since=d?Math.round((new Date(todayStr()+'T00:00')-new Date(d.d+'T00:00'))/864e5):null;
  const cur={};JP_AXES.forEach(a=>{const v=jpLevel(a.k);cur[a.k]=v==null?0:v});
  el.innerHTML=`<div class="back-row"><button class="icon-btn" id="jp-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>日本人のための英語ジム</h2></div>
    <div class="card jp-res">${d?jpRadar(cur,d.s):'<div class="jp-hero-t">日本語にない音・文法・カタカナの思い込み。<br>日本人がつまずく5つのクセを、3分で見つけて毎日直す。</div>'}
      <button class="btn btn-gold btn-block" id="jp-diag" style="margin-top:10px">${d?(since>=30?'再診断する（30日たちました）':'もう一度クセ診断（前回 '+since+'日前）'):'3分でクセ診断をはじめる'}</button></div>
    <div class="jp-list">${JP_AXES.map(a=>{const v=jpLevel(a.k);return`<button class="card jp-row" data-ax="${a.k}"><span class="jp-row-b"><b>${a.name}</b><small>${a.ja}</small></span>
      <span class="jp-row-v">${v==null?'—':Math.round(v*100)+'%'}<small>${a.fix}</small></span></button>`}).join('')}</div>
    <button class="card jp-row" id="jp-shadow"><span class="jp-row-b"><b>リズムとイントネーション</b><small>強弱・つながりを見ながらシャドーイング</small></span><span class="jp-row-v">${ICONS.arrowRight}</span></button>`;
  document.getElementById('jp-back').onclick=()=>go('home');
  document.getElementById('jp-diag').onclick=jpDiagOpen;
  document.getElementById('jp-shadow').onclick=()=>typeof lxShadowToday==='function'&&lxShadowToday();
  el.querySelectorAll('[data-ax]').forEach(b=>b.onclick=()=>JP_AXES.find(a=>a.k===b.dataset.ax).go());
  window.scrollTo(0,0);
}
// 今日のクセ克服（いちばん弱いクセを5問）
function jpKuseToday(){
  const w=jpWeakest();if(!w)return jpDiagOpen();
  if(w.k==='ear'||w.k==='link'||w.k==='speak'||w.k==='wasei'||w.k==='gram')return jpQuiz(jpItems(w.k,5),'クセ克服：'+w.name);
}
function jpHomeHTML(){
  const j=jp(),d=j.diag[j.diag.length-1],w=jpWeakest();
  if(!d)return`<button class="card jp-home" id="jp-home"><span class="jp-home-ic">🇯🇵</span><span class="jp-home-b"><b>3分でわかる「英語のクセ」診断</b><small>L/R・カタカナ英語・冠詞… 日本人がつまずく5つのクセを見つけて、毎日直す</small></span><span>${ICONS.arrowRight}</span></button>`;
  return`<button class="card jp-home" id="jp-home"><span class="jp-home-r">${jpRadar(Object.fromEntries(JP_AXES.map(a=>[a.k,jpLevel(a.k)||0])),null,96)}</span><span class="jp-home-b"><b>英語ジム · いま直したいクセ：${w?w.name:'—'}</b><small>${w?w.ja:''}</small></span><span>${ICONS.arrowRight}</span></button>`;
}

/* ---------- 既存機能への接続 ---------- */
function jpInstall(){
  // 毎日のメニュー：いちばん弱いクセの5問（3分）
  if(typeof P6_TASKS!=='undefined'){
    P6_TASKS.kuse={t:'クセ克服 5問',sub:'診断で見つかった、あなたの弱いクセ',m:3};
    [1,2,3,4].forEach(n=>{const b=P6_MENU[n].base;if(!b.includes('kuse'))b.splice(Math.min(b.indexOf('shadow')+1||3,b.length),0,'kuse')});
  }
  const _pta=planTaskAction;planTaskAction=function(a){if(a==='kuse')return jpKuseToday();return _pta.apply(this,arguments)};
  // WDW 画面は廃止：旅行タブへ
  const _go=go;go=function(t){if(t==='wdw'){PROG.travelSeg='passport';t='passport'}return _go.apply(this,[t,...[].slice.call(arguments,1)])};
  if(PROG.travelSeg==='wdw'){PROG.travelSeg='passport';commit()}
  // ホーム：フォーカスカードの直後に英語ジム
  const _rh=renderHome;
  renderHome=function(){
    const r=_rh.apply(this,arguments);
    const home=document.getElementById('screen-home'),focus=home&&home.querySelector('.focus-card');
    if(focus&&!home.querySelector('#jp-home')){focus.insertAdjacentHTML('afterend',jpHomeHTML());document.getElementById('jp-home').onclick=()=>jp().diag.length?jpHubOpen():jpDiagOpen()}
    return r;
  };
  // Talk タブの先頭にも入口
  if(typeof renderTalkHub==='function'){const _th=renderTalkHub;renderTalkHub=function(){const r=_th.apply(this,arguments);const el=document.getElementById('screen-talk');
    if(el&&!el.querySelector('#jp-talk')){const d=document.createElement('div');d.innerHTML=`<button class="p6-banner" id="jp-talk"><span class="p6-banner-ic">🇯🇵</span><span class="p6-banner-b"><b>日本人のための英語ジム</b><small>聞き分け・音の変化・和製英語・文法のクセ・瞬発力</small></span><span>${ICONS.arrowRight}</span></button>`;
      const n=d.firstElementChild;const back=el.querySelector('.back-row,h2');if(back&&back.nextSibling)back.parentNode.insertBefore(n,back.nextSibling);else el.prepend(n);n.onclick=jpHubOpen}return r}}
  if(typeof curTab!=='undefined'&&curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome();
}
if(typeof go==='function')jpInstall();
