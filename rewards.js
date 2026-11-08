/* ========== 旅のごほうび（毎日つづきが気になる仕組み） ==========
   今日のレッスンを終えると、
   ・Spark から絵はがきが届く：9都市を旅する全18話の連続ミステリー。1日1話だけ読めて、毎回「続き」で終わる
   ・おみやげパックを1つ開ける：旅で使えるフレーズのカードを集める（出る確率は画面に表示、10パックごとに★★★確定）
   カードはお金では買えない。1日の量に上限があるので、学習を押しのけない。
   ・はじめて使う人には、オンボーディングのあとに「あなたのプラン」を見せて、すぐ最初のレッスンへ
   passport.js のあと、compact.js の前に読み込む。 */
'use strict';

function rw(){const r=PROG.rw||(PROG.rw={});r.ep=r.ep||0;r.got=r.got||{};r.packs=r.packs||0;return r}

/* ---------- 絵はがき（全18話）：[英語, 訳, 明日の予告] ---------- */
const RW_EPS=[
  ["Aloha from Honolulu! I found an old postcard under my shave ice cup. It only says, \"Find me. — L.\"","ホノルルからアロハ！ シェイブアイスのカップの下に古い絵はがきがあったよ。「私を見つけて。L より」とだけ書いてある。","裏に、小さな地図が描いてあるみたい…"],
  ["There is a tiny map on the back of the postcard. A surfer says the X is in Singapore, so I bought a ticket!","絵はがきの裏に小さな地図があったんだ。サーファーの人が、×印はシンガポールだって。だからチケットを買っちゃった！","夜のシンガポールで、屋台の店主が呼び止める"],
  ["Singapore is so bright at night! The owner of a food stall stopped me and gave me a second postcard.","夜のシンガポールはとっても明るい！ 屋台の店主に呼び止められて、2枚目の絵はがきをもらったよ。","店主は L のことを知っていた"],
  ["The owner knows L! \"L loved my chicken rice,\" he said. \"Then L left for Florida ten years ago.\"","店主は L を知ってた！「L はうちのチキンライスが大好きだったよ。10年前にフロリダへ行ったんだ」って。","フロリダで見つけたチケットの日付は…"],
  ["It's very hot in Orlando. Inside the next postcard, I found a roller coaster ticket. The date on it is tonight!","オーランドはすごく暑い。次の絵はがきの中に、ジェットコースターのチケットが入ってた。日付はなんと今夜！","真夜中のコースター。座席の下に何かある"],
  ["I rode the roller coaster at midnight. When it stopped, I found a small key taped under my seat.","真夜中にコースターに乗ったよ。止まったとき、座席の下にテープで貼られた小さなカギを見つけたんだ。","カギに刻まれた数字は「1889」"],
  ["Bonjour from Paris! The key has a number on it: 1889. A woman at the bakery smiled and pointed at the sky.","パリからボンジュール！ カギには 1889 という数字。パン屋のお姉さんは笑って、空を指さした。","空の先にあるものと、1889年の関係"],
  ["Of course! The Eiffel Tower opened in 1889. My key opened a locker near the tower, and there was a photo inside.","そうか！ エッフェル塔ができたのが1889年だ。塔の近くのロッカーがカギで開いて、中には写真が1枚。","写真に写っていたのは、赤いバスと…"],
  ["The photo shows a red London bus and a small egg in someone's hands. Wait… why does that egg look so familiar?","写真には、ロンドンの赤いバスと、だれかの手の上の小さなたまご。あれ…このたまご、どうして見覚えがあるんだろう？","紅茶店のおじいさんが、写真を見て驚く"],
  ["An old man at a tea shop looked at the photo. \"That's L,\" he said quietly. \"And that egg… is you.\"","紅茶店のおじいさんが写真を見て、静かに言った。「これが L だよ。そしてそのたまごは…きみだ」","ぼくを運んでいたのは、L だった？"],
  ["L carried me when I was an egg? In Rome, I threw a coin into a fountain and made a wish: I want to meet L.","たまごのぼくを L が運んでいたの？ ローマの泉にコインを投げて、願いごとをしたよ。「L に会いたい」って。","翌朝、ホテルに届いた1通の手紙"],
  ["The next morning, a letter came to my hotel. I never told anyone I was here. How did L know?","次の朝、ホテルに手紙が届いた。ここにいるなんて、だれにも言ってないのに。どうして L は知ってるの？","手紙の指示は「日の出の舟に乗って」"],
  ["The letter says, \"Take the river boat at sunrise.\" So here I am on a long boat in Bangkok, half asleep.","手紙には「日の出に川の舟に乗って」とあった。だから今、バンコクの細長い舟の上。まだ半分ねむいよ。","舟を降りた先で、小さな鈴を渡される"],
  ["A kind man at the temple gave me a small bell. \"L left this,\" he said, \"for someone who keeps going.\"","お寺でやさしい人が小さな鈴をくれた。「L が置いていったんだよ。歩き続ける人のためにね」って。","シドニーの港で鈴を鳴らすと…"],
  ["G'day from Sydney! I rang the bell by the harbor. Then, from very far away, another bell answered me.","シドニーからグダイ！ 港で鈴を鳴らしたら、ずっと遠くから、別の鈴がこたえたんだ。","もう1つの鈴は、どこにある？"],
  ["A sailor heard it too. \"That other bell is in New York,\" the sailor said. One more flight. This is it!","船乗りさんにも聞こえたって。「もう1つの鈴はニューヨークだよ」。あと1回のフライト。いよいよだ！","最後の絵はがきに書かれた場所"],
  ["New York never sleeps, and tonight neither can I. The last postcard says, \"The roof. Tomorrow. Bring your bell.\"","ニューヨークは眠らない。今夜はぼくも眠れない。最後の絵はがきには「屋上で。明日。鈴を持ってきて」。","L の正体が、ついにわかる"],
  ["On the roof, I rang my bell. No one was there, only one last card: \"L is for Learner. L is you. Thank you for carrying me this far.\"","屋上で鈴を鳴らした。だれもいない。あったのは最後の1枚だけ。「L は Learner（学ぶ人）の L。L はきみだよ。ここまで連れてきてくれて、ありがとう」","シーズン1 完結"]
];
const rwEpCity=i=>CITY_ROTATION[Math.min(CITY_ROTATION.length-1,Math.floor(i/2))];

/* ---------- おみやげカード ---------- */
// ★★★は各都市の「現地の言葉」。★と★★は街のストーリーの「完璧な返し」から作る
const RW_LOCAL={
  hawaii:[['Mahalo!','ありがとう（ハワイ語）'],['Shoots!','いいね、了解！（ハワイのピジン英語）'],['Da kine','あれ、例のやつ（ハワイのピジン英語）']],
  singapore:[['Can lah!','いいよ、できるよ！（シングリッシュ）'],['Shiok!','最高！うまい！（シングリッシュ）'],['Chope','席を取っておく（シングリッシュ）']],
  orlando:[["Y'all come back now!",'また来てね！（南部の言い方）'],["I'm fixin' to leave.",'もう出るところだよ（南部の言い方）'],['Bless your heart.','あらまあ、気の毒に（南部の言い方）']],
  paris:[["S'il vous plaît",'お願いします（フランス語）'],["L'addition, s'il vous plaît.",'お会計をお願いします（フランス語）'],['Bon appétit !','めしあがれ（フランス語）']],
  london:[['Cheers, mate.','ありがとね（イギリス）'],['Mind the gap.','すき間にご注意ください（ロンドンの地下鉄）'],['Fancy a cuppa?','お茶でもどう？（イギリス）']],
  rome:[['Buongiorno!','おはよう・こんにちは（イタリア語）'],['Il conto, per favore.','お会計をお願いします（イタリア語）'],['Mamma mia!','なんてこった！（イタリア語）']],
  bangkok:[['Khob khun','ありがとう（タイ語）'],['Mai pen rai','気にしないで（タイ語）'],['Aroi mak!','とてもおいしい！（タイ語）']],
  sydney:[['No worries, mate.','大丈夫だよ（オーストラリア）'],['See you this arvo.','今日の午後にね（オーストラリア）'],["She'll be right.",'なんとかなるさ（オーストラリア）']],
  nyc:[['Have a good one.','じゃあね、良い一日を（ニューヨーク）'],['Fuhgeddaboudit!','気にすんな！（ニューヨーク）'],["Don't schlep that.",'それ、がんばって運ばなくていいよ（ニューヨーク）']]
};
const RW_ODDS=[[3,8],[2,27],[1,65]],RW_RLAB={1:'定番',2:'旅慣れ',3:'現地の言葉'};
let rwAllC=null;
function rwCards(){
  if(rwAllC)return rwAllC;const out=[];
  CITY_ROTATION.forEach(c=>{const seen=new Set();(CITY_STORIES[c.key]||[]).forEach(st=>st.turns.forEach(t=>{if(!t.choices)return;const p=t.choices.find(x=>x.q==='perfect');if(!p||seen.has(p.en))return;seen.add(p.en);
      out.push({id:'s:'+c.key+':'+seen.size,c:c.key,r:p.en.split(/\s+/).length>=11?2:1,en:p.en,ja:p.ja})}));
    (RW_LOCAL[c.key]||[]).forEach((l,i)=>out.push({id:'l:'+c.key+':'+i,c:c.key,r:3,en:l[0],ja:l[1]}))});
  return rwAllC=out;
}
const rwGotN=()=>Object.keys(rw().got).length;
// 1枚引く：行ったことのある街から。未入手を優先し、10パックごとに★★★
function rwDraw(cityMax){
  const r=rw(),keys=CITY_ROTATION.slice(0,cityMax+1).map(c=>c.key),pool=rwCards().filter(x=>keys.includes(x.c));r.packs++;
  let want;if(r.packs%10===0)want=3;else{let v=Math.random()*100,s=0;want=1;for(const[k,p]of RW_ODDS){s+=p;if(v<s){want=k;break}}}
  let tier=pool.filter(x=>x.r===want);if(!tier.length)tier=pool;
  const fresh=tier.filter(x=>!r.got[x.id]),use=fresh.length?fresh:tier,card=use[Math.floor(Math.random()*use.length)];
  const isNew=!r.got[card.id];r.got[card.id]=(r.got[card.id]||0)+1;if(!isNew&&typeof spkCoin==='function')spkCoin(10,'おみやげのダブり');
  return{card,isNew};
}
const rwStars=n=>'★'.repeat(n);
const rwScene=k=>ppScene(k).replace(/id="(\w+)"/g,'id="rw$1"').replace(/url\(#(\w+)\)/g,'url(#rw$1)');
const rwCardHTML=(x,isNew)=>`<div class="rw-card r${x.r}" style="--ink:${(PP_DEST[x.c]||{}).ink||'#0f2a4a'}"><div class="rw-card-t"><span>${esc((PP_DEST[x.c]||{}).iata||'')}</span><em>${rwStars(x.r)}</em></div><b>${esc(x.en)}</b><small>${esc(x.ja)}</small><div class="rw-card-f"><i>${RW_RLAB[x.r]}</i>${isNew===true?'<u>NEW</u>':isNew===false?'<u class="dup">+10コイン</u>':''}</div></div>`;

/* ---------- 開封 ---------- */
function rwReady(){return typeof coTasks==='function'&&coTasks().length&&coTasks().every(t=>t.done)&&rw().last!==todayStr()}
function rwOpen(){
  if(document.getElementById('rw-ov')||rw().last===todayStr())return;
  const r=rw(),i=Math.min(r.ep,RW_EPS.length),over=i>=RW_EPS.length,city=over?CITY_ROTATION[CITY_ROTATION.length-1]:rwEpCity(i);
  const streak=typeof getStreak==='function'?getStreak():0,n=streak>0&&streak%7===0?2:1;
  const cityMax=over?CITY_ROTATION.length-1:Math.floor(i/2);
  const draws=Array.from({length:n},()=>rwDraw(cityMax));
  r.last=todayStr();if(!over)r.ep=i+1;commit();
  const ep=over?null:RW_EPS[i],d=PP_DEST[city.key]||{};
  const ov=document.createElement('div');ov.id='rw-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','今日のごほうび');document.body.appendChild(ov);document.body.classList.add('call-open');
  const close=()=>{if(typeof speechSynthesis!=='undefined')try{speechSynthesis.cancel()}catch(e){}ov.remove();document.body.classList.remove('call-open');if(curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome()};
  const pack=()=>{
    ov.innerHTML=`<div class="rw-in"><span class="rw-k">SOUVENIR PACK${n>1?' · 7日連続ボーナス ×2':''}</span><b class="rw-h">${esc(city.en)} のおみやげ</b><small class="rw-sub">タップして開ける</small>
      <button class="rw-pack" id="rw-pack" style="--ink:${d.ink||'#0f2a4a'}" aria-label="パックを開ける"><i></i><span>${esc(d.iata||city.code)}</span><em>SOUVENIR</em></button></div>`;
    document.getElementById('rw-pack').onclick=e=>{e.currentTarget.classList.add('open');sfx('unlock');setTimeout(reveal,420)};
  };
  const reveal=()=>{
    const top=Math.max(...draws.map(x=>x.card.r));if(top===3&&typeof launchConfetti==='function')launchConfetti();
    const nextEp=!over&&r.ep<RW_EPS.length?rwEpCity(r.ep):null;
    ov.innerHTML=`<div class="rw-in"><span class="rw-k">${top===3?'RARE FIND':'NEW SOUVENIR'}</span>
      <div class="rw-cards">${draws.map(x=>rwCardHTML(x.card,x.isNew)).join('')}</div>
      <div class="rw-row"><button class="rw-say" id="rw-say">声を聞く</button></div>
      <div class="rw-prog"><span>おみやげ ${rwGotN()} / ${rwCards().length}</span><i style="--p:${Math.round(rwGotN()/rwCards().length*100)}%"></i></div>
      ${ep?`<div class="rw-next"><span>明日の絵はがき${nextEp?' · '+esc(nextEp.en):''}</span><b>${esc(ep[2])}</b></div>`:''}
      <div class="rw-btns"><button class="btn btn-secondary" id="rw-share">シェア</button><button class="btn btn-gold" id="rw-close">また明日</button></div>
      <button class="rw-link" id="rw-album">アルバムを見る</button></div>`;
    document.getElementById('rw-say').onclick=()=>speak(draws[0].card.en,0.88,'female',city.ttsLang);
    document.getElementById('rw-close').onclick=close;
    document.getElementById('rw-album').onclick=()=>{close();rwAlbum()};
    document.getElementById('rw-share').onclick=()=>{close();if(typeof openStillShareModal==='function')openStillShareModal({title:ep?`Postcard ${i+1}/18 from ${city.en}`:'Sparkle',subtitle:`おみやげ ${rwGotN()}/${rwCards().length} 枚`,xp:0,streak})};
  };
  if(!ep)return pack();
  ov.innerHTML=`<div class="rw-in"><span class="rw-k">POSTCARD ${i+1} / ${RW_EPS.length}</span>
    <div class="rw-post"><div class="rw-post-s">${rwScene(city.key)}<div class="rw-mark"><b>${esc(d.iata||city.code)}</b><small>${new Date().toLocaleDateString('en',{month:'short',day:'2-digit'}).toUpperCase()}</small></div></div>
      <div class="rw-post-b"><b>${esc(ep[0])}</b><small>${esc(ep[1])}</small><span class="rw-sign">— ${esc(typeof spkNick==='function'?spkNick():'Spark')}</span></div></div>
    <div class="rw-btns"><button class="btn btn-secondary" id="rw-play">声で聞く</button><button class="btn btn-gold" id="rw-go">おみやげを開ける ${ICONS.arrowRight}</button></div></div>`;
  document.getElementById('rw-play').onclick=()=>speak(ep[0],0.88,'female','en-US');
  document.getElementById('rw-go').onclick=()=>{try{speechSynthesis.cancel()}catch(e){}pack()};
}

/* ---------- アルバム ---------- */
let rwTab='cards',rwCity=null;
function rwAlbum(){
  const el=document.getElementById('screen-review'),r=rw();document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));el.classList.add('active');
  const all=rwCards();rwCity=rwCity||(typeof todaysCity==='function'?todaysCity().key:'hawaii');
  const list=all.filter(x=>x.c===rwCity).sort((a,b)=>a.r-b.r);
  el.innerHTML=`<div class="rw-al"><div class="back-row"><button class="icon-btn" id="rw-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>旅のアルバム</h2><span class="rw-count">${rwGotN()}/${all.length}</span></div>
    <div class="tk-seg rw-seg"><button data-t="cards" class="${rwTab==='cards'?'on':''}">おみやげ</button><button data-t="eps" class="${rwTab==='eps'?'on':''}">絵はがき ${r.ep}/${RW_EPS.length}</button></div>
    ${rwTab==='cards'?`<div class="pp-chips">${CITY_ROTATION.map(c=>{const n=all.filter(x=>x.c===c.key),g=n.filter(x=>r.got[x.id]).length;return`<button class="pp-chip${c.key===rwCity?' on':''}" data-c="${c.key}"><b>${esc((PP_DEST[c.key]||{}).iata||c.code)}</b><span>${g}/${n.length}</span></button>`}).join('')}</div>
      <div class="rw-grid">${list.map(x=>r.got[x.id]?`<button class="rw-tile r${x.r}" data-say="${esc(x.en)}"><em>${rwStars(x.r)}</em><b>${esc(x.en)}</b><small>${esc(x.ja)}</small></button>`:`<div class="rw-tile lock r${x.r}"><em>${rwStars(x.r)}</em><b>？？？</b></div>`).join('')}</div>
      <div class="rw-odds">出る確率：★ 65% · ★★ 27% · ★★★ 8%（10パックごとに★★★確定）。レッスンを終えると1日1パック、お金では買えません。</div>`
    :`<div class="rw-eps">${RW_EPS.map((e,i)=>i<r.ep?`<div class="rw-ep"><span>${i+1} · ${esc(rwEpCity(i).en)}</span><b>${esc(e[0])}</b><small>${esc(e[1])}</small></div>`:'').join('')}${r.ep<RW_EPS.length?`<div class="rw-ep lock"><span>${r.ep+1} · ${esc(rwEpCity(r.ep).en)}</span><b>今日のレッスンを終えると届きます</b></div>`:'<div class="rw-ep lock"><b>シーズン1 完結。おめでとう！</b></div>'}</div>`}</div>`;
  document.getElementById('rw-back').onclick=()=>go('passport');
  el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{rwTab=b.dataset.t;rwAlbum()});
  el.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{rwCity=b.dataset.c;rwAlbum()});
  el.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>speak(b.dataset.say,0.88,'female'));
  window.scrollTo(0,0);
}

/* ---------- はじめての人へ：あなたのプラン ---------- */
function rwPlan(){
  const goal=PROG.toeicGoal||650,tasks=typeof coTasks==='function'?coTasks():[],n=typeof coNow==='function'?coNow():null,theme=n?n.wk[2]:'';
  const ov=document.createElement('div');ov.id='rw-ov';ov.className='rw-plan';ov.setAttribute('role','dialog');document.body.appendChild(ov);
  ov.innerHTML=`<div class="rw-in"><span class="rw-k">YOUR PLAN</span><div class="rw-egg">${sparkSVG(null,'hello')}</div><b class="rw-h">準備できました</b><small class="rw-sub">TOEIC ${goal} と、海外で話せる英語へ</small>
    <div class="rw-list"><div><i>1</i><span><b>今日は ${tasks.length||3} ステップ</b><small>${esc(theme)}から。忙しい日は最初の1つだけでOK</small></span></div>
      <div><i>2</i><span><b>終えると Spark から絵はがき</b><small>9都市を旅する全18話。1日1話ずつ届きます</small></span></div>
      <div><i>3</i><span><b>たまごを育てて、旅のカードを集める</b><small>Lv5 で孵化。使えるフレーズ ${rwCards().length} 枚</small></span></div></div>
    <button class="btn btn-gold btn-block" id="rw-first">最初のレッスンを始める ${ICONS.arrowRight}</button><button class="rw-link" id="rw-skip">あとで</button></div>`;
  document.getElementById('rw-first').onclick=()=>{ov.remove();if(typeof lxUnlock==='function')lxUnlock();coStartFrom(0)};
  document.getElementById('rw-skip').onclick=()=>ov.remove();
}

/* ---------- 接続 ---------- */
if(typeof finishOnboarding==='function'){const _fo=finishOnboarding;finishOnboarding=function(){const first=!OB_STATE.returning;const r=_fo.apply(this,arguments);if(first)setTimeout(rwPlan,350);return r}}
// 宝箱を閉じたら、絵はがきとパックへ
if(typeof openDailyChest==='function'){const _oc=openDailyChest;openDailyChest=function(){const r=_oc.apply(this,arguments);
  if(document.getElementById('chest-modal')&&rw().last!==todayStr())new MutationObserver((_,ob)=>{if(!document.getElementById('chest-modal')){ob.disconnect();setTimeout(rwOpen,250)}}).observe(document.body,{childList:true});
  return r}}
// ホーム：今日のレッスンの見出しに「終えると何が届くか」を出す
if(typeof renderHome==='function'){const _rh=renderHome;renderHome=function(){const r=_rh.apply(this,arguments);
  const h=document.querySelector('#screen-home .co-steps-h');
  if(h&&!h.querySelector('.rw-chip')&&h.firstElementChild){const ready=rwReady(),done=rw().last===todayStr();
    const c=document.createElement(ready?'button':'span');c.className='rw-chip'+(ready?' ready':'');c.textContent=ready?'絵はがきを開ける':done?'続きは明日':`完了で第${Math.min(rw().ep+1,RW_EPS.length)}話`;
    if(rw().ep>=RW_EPS.length&&!ready)c.textContent=done?'また明日':'完了でおみやげ';
    if(ready)c.onclick=rwOpen;h.firstElementChild.appendChild(c)}
  return r}}
// Passport：アルバムの入口
if(typeof renderPassportTab==='function'){const _rp=renderPassportTab;renderPassportTab=function(){const r=_rp.apply(this,arguments);
  const c=document.querySelector('#screen-passport .pp-count');
  if(c&&!document.getElementById('rw-al-open')){const b=document.createElement('button');b.id='rw-al-open';b.className='rw-al-open';b.innerHTML=`アルバム <b>${rwGotN()}/${rwCards().length}</b>`;b.onclick=rwAlbum;c.after(b);c.querySelector('i')&&c.querySelector('i').remove()}
  return r}}
