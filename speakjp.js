/* ========== 話すジム：日本人が英語で「黙る・通じない」3つの壁 ==========
   英語ジム（jp.js）の「話す」側。判定は端末の音声認識だけ（$0・ブラウザ内完結）。
   1. 3秒ルール     … 完璧な文を考えて黙る → つなぎ言葉で3秒以内に話し出し、＋1文で広げる（話し出すまでの秒数を計測）
   2. 言い換え      … 単語を知らないと止まる → 「〜に使うもの」「〜する場所」で説明して切り抜ける
   3. カタカナ発音  … 母音を足す・強勢がない → 音節と強勢を見て言い、音声認識に通じるか確かめる
   ・入口：英語ジム / Talk タブ。毎週木曜は「英会話ロールプレイ」の枠が「話すジム 3分」になる（メニュー量は増やさない）
   ・3秒ルールの結果は英語ジムの「瞬発力」にも記録する
   talk.js / jp.js / plan650.js の後に読み込む。 */
'use strict';

// [質問, 訳, お手本（つなぎ言葉＋答え＋1文）]
const SJ_QUICK=[
  ["What did you do last weekend?","先週末は何をした？","Well, I mostly stayed home and relaxed. I watched a movie on Sunday."],
  ["What kind of food do you like?","どんな食べ物が好き？","Hmm, I really like ramen. There's a great place near my office."],
  ["Where would you like to travel next?","次はどこに旅行したい？","Good question. I'd love to go to Hawaii. I just want to relax on the beach."],
  ["How was your day?","今日はどうだった？","It was pretty busy, actually. I had three meetings in the morning."],
  ["Do you prefer cats or dogs?","猫派？犬派？","Let me think. I'd say dogs. They're always happy to see you."],
  ["What do you do for fun?","休みの日は何してる？","I like going to cafés. I usually read there on weekends."],
  ["Why are you learning English?","なぜ英語を勉強してるの？","Well, I want to travel without worrying. I also need it for work."],
  ["What's your hometown like?","地元はどんなところ？","It's a quiet town by the sea. It's famous for its hot springs."],
  ["What time do you usually get up?","普段は何時に起きる？","Usually around seven. But on weekends I sleep in."],
  ["Have you been anywhere interesting recently?","最近どこか面白い所に行った？","Actually, yes. I went to a new aquarium last month. It was amazing."],
  ["What's something you're good at?","得意なことは？","Hmm, I'm pretty good at cooking. I make curry almost every week."],
  ["What would you do with a free day?","丸1日自由ならどうする？","I'd probably go hiking. I love being outside."],
  ["Can you recommend a place to eat in Japan?","日本でおすすめのお店は？","Sure. You should try conveyor belt sushi. It's cheap and fun."],
  ["What's the weather like today?","今日の天気はどう？","It's pretty warm today. It's a little cloudy, though."],
  ["What did you have for breakfast?","朝ごはんは何を食べた？","Just toast and coffee. I didn't have much time this morning."],
  ["What kind of music do you listen to?","どんな音楽を聴く？","Mostly J-pop. But lately I've been into jazz."],
  ["Is this your first time here?","ここは初めて？","Yes, it is! I've always wanted to come here."],
  ["How long are you staying?","どのくらい滞在するの？","About a week. I'm here on vacation."],
  ["What should I see in Tokyo?","東京では何を見るべき？","Hmm, I'd say Asakusa. It has a really traditional feel."],
  ["How did you get here today?","今日はどうやって来た？","I took the train. It only took about twenty minutes."],
  ["What are you doing this weekend?","今週末の予定は？","Nothing special, actually. Maybe I'll go shopping with a friend."],
  ["What's your favorite season?","好きな季節は？","I'd say autumn. The weather is nice and the food is great."]
];
const SJ_FILLER=/\b(well|hmm+|let me (think|see)|good question|i'?d say|actually|honestly|to be honest|i guess|you know what|how can i put it|that'?s a (good|great|tough) question)\b/i;
const SJ_FILLER_CHIPS=['Well, …','Hmm, let me think.','Good question.',"I'd say …",'Actually, …'];

// 言い換え：[日本語, 英語, 種類, 伝わるキーワード, お手本の説明]
const SJ_PARA=[
  ['爪切り','nail clippers','tool',['nail','nails','cut','finger','fingers','toe'],"It's a small thing you use to cut your nails."],
  ['日焼け止め','sunscreen','thing',['sun','skin','cream','burn','sunburn','protect','beach','uv'],"It's a cream you put on your skin to protect it from the sun."],
  ['酔い止め','motion sickness pills','thing',['sick','medicine','pill','pills','car','bus','boat','ship','plane','travel','dizzy'],"It's medicine you take so you don't feel sick on a bus or a boat."],
  ['栓抜き','bottle opener','tool',['open','opener','bottle','bottles','beer','cap'],"It's a tool you use to open a bottle, like a beer bottle."],
  ['絆創膏','band-aid','thing',['cut','finger','skin','stick','sticky','tape','blood','wound','hurt'],"It's a small sticky thing you put on a cut."],
  ['延長コード','extension cord','thing',['cable','cord','wire','plug','electric','electricity','outlet','longer','power','far'],"It's a long cable you use when the outlet is too far away."],
  ['耳栓','earplugs','thing',['ear','ears','noise','noisy','quiet','sleep','sound'],"It's something you put in your ears to block noise when you sleep."],
  ['二日酔い','hangover','state',['drink','drank','drinking','alcohol','beer','headache','sick','morning','too'],"It's when you feel sick the morning after you drink too much."],
  ['時差ぼけ','jet lag','state',['tired','sleep','sleepy','time','flight','plane','fly','country','zone','night'],"It's when you feel tired because the time is different after a long flight."],
  ['乗り換え','transfer','action',['change','train','trains','line','another','different','station','switch'],"It means to change from one train to another."],
  ['両替所','currency exchange','place',['money','change','exchange','yen','dollar','dollars','currency','cash'],"It's a place where you can change yen into dollars."],
  ['手荷物預かり所','luggage storage','place',['bag','bags','luggage','suitcase','keep','leave','store','hold'],"It's a place where you can leave your bags for a few hours."],
  ['落とし物センター','lost and found','place',['lost','lose','find','found','forget','forgot','left','things','items'],"It's a place where they keep things people lost."],
  ['割り勘','split the bill','action',['pay','bill','check','money','each','same','share','split','half','everyone','together'],"It means everyone pays the same amount. We share the bill."],
  ['お持ち帰り','takeout / to go','action',['take','home','eat','outside','go','bag','away'],"It means I want to take the food with me and eat it somewhere else."],
  ['体温計','thermometer','tool',['temperature','fever','body','hot','measure','check','sick'],"It's a thing you use to check if you have a fever."],
  ['充電器','charger','tool',['phone','battery','charge','power','electric','plug','cable'],"It's a thing you use to charge your phone's battery."],
  ['湿布','pain relief patch','thing',['pain','hurt','hurts','back','shoulder','muscle','stick','cool','cold','skin'],"It's a cool sticker you put on your back when it hurts."],
  ['つまようじ','toothpick','tool',['teeth','tooth','food','small','stick','wood','wooden','clean','between'],"It's a small wooden stick you use to clean between your teeth."],
  ['小銭','coins / small change','thing',['coin','coins','money','small','cash','pocket','metal'],"It's small money, like coins, not bills."],
  ['迷子','lost child','person',['lost','child','kid','parent','parents','mother','mom','father','dad','find','alone'],"It's a child who can't find their parents."],
  ['寝坊する','oversleep','action',['sleep','slept','wake','woke','late','alarm','morning','too','long'],"It means you wake up too late and miss the time."],
  ['当日券','same-day ticket','thing',['ticket','tickets','today','same','day','buy','door'],"It's a ticket you can buy on the same day, at the door."],
  ['靴擦れ','blister','state',['shoe','shoes','foot','feet','hurt','hurts','skin','walk','walking','rub','new'],"It's when your new shoes rub your foot and it hurts."]
];
const SJ_FRAMES={
  tool:["It's a thing you use to …","It's a small tool for …"],
  thing:["It's something you … when …","It's a kind of … for …"],
  place:["It's a place where you can …","It's somewhere you go to …"],
  state:["It's when you feel … because …","It's how you feel after …"],
  action:["It means to …","It's when you …"],
  person:["It's a person who …","It's someone who …"]
};
const SJ_CAT_JA={tool:'道具',thing:'もの',place:'場所',state:'状態',action:'すること',person:'人'};
const SJ_FRAME_RE=/\b(thing|things|something|stuff|kind of|type of|place|where|person|someone|who|when|use|used|like|for|means?)\b/i;

// カタカナ発音：[英単語, カタカナ, 音節（大文字＝強く）, 近い音（**＝強く）, コツ]
const SJ_KATA=[
  ['hotel','ホテル','ho·TEL','ホウ**テ**ゥ','後ろの TEL を強く・高く。「ホ」を強くすると通じにくい。'],
  ['event','イベント','e·VENT','イ**ヴェ**ント','後ろを強く。V は上の歯を下唇に当てる。'],
  ['career','キャリア','ca·REER','カ**リ**ア','後ろを強く。前を強くすると Korea（韓国）に聞こえる。'],
  ['image','イメージ','IM·age','**イ**ミッジ','前を強く。「メー」と伸ばさず、age は短い「イッジ」。'],
  ['energy','エネルギー','EN·er·gy','**エ**ナジー','「ギー」ではなく「ジー」。最初の EN を強く。'],
  ['allergy','アレルギー','AL·ler·gy','**ア**ラジー','「ギー」ではなく「ジー」。最初の A を強く。'],
  ['label','ラベル','LA·bel','**レ**イボゥ','LA は「レイ」。語末の L は「ル」と言わず、舌先を付けるだけ。'],
  ['theme','テーマ','THEME','**スィー**ム','1音節。TH は舌先を歯に。「マ」と母音を足さない。'],
  ['virus','ウイルス','VI·rus','**ヴァ**イラス','「ウイ」ではなく「ヴァイ」。最初を強く。'],
  ['vitamin','ビタミン','VI·ta·min','**ヴァ**イタミン','米国では「ヴァイ」。最初を強く。'],
  ['coffee','コーヒー','COF·fee','**カ**ーフィ','F は歯と唇で。「ヒー」だと通じにくい。'],
  ['water','ウォーター','WA·ter','**ワ**ーラー','間の t は「ら」に近く（米）。語末は舌を丸めて「アー」。'],
  ['chocolate','チョコレート','CHOC·late','**チャ**クレット','2音節。「レート」と伸ばさない。'],
  ['model','モデル','MOD·el','**マ**ドゥ','「モ」ではなく口を縦に開けた「マ」。語末の L に母音を足さない。'],
  ['studio','スタジオ','STU·di·o','ス**トゥー**ディオウ','「ジ」ではなく「ディ」。STU を強く。'],
  ['radio','ラジオ','RA·di·o','**レ**イディオウ','RA は「レイ」。「ジ」ではなく「ディ」。'],
  ['camera','カメラ','CAM·er·a','**キャ**ムラ','最初を強く。真ん中の e は弱くほぼ消える。'],
  ['ticket','チケット','TICK·et','**ティ**キット','「チ」ではなく「ティ」。最後の t は軽く止めるだけ。'],
  ['towel','タオル','TOW·el','**タ**ウオゥ','3拍ではなく、TOW を強く一息で。'],
  ['recipe','レシピ','REC·i·pe','**レ**サピ','3音節。最初を強く。'],
  ['percent','パーセント','per·CENT','パ**セ**ント','後ろを強く。「パー」と伸ばさない。'],
  ['original','オリジナル','o·RIG·i·nal','オ**リ**ジナゥ','2番目の RIG を強く。'],
  ['technique','テクニック','tech·NIQUE','テク**ニー**ク','後ろを強く伸ばす。「ニック」ではなく「ニーク」。'],
  ['sweater','セーター','SWEAT·er','ス**ウェ**ラー','「セー」ではなく SW「スウェ」。'],
  ['volunteer','ボランティア','vol·un·TEER','ヴァラン**ティ**ア','最後の TEER を強く。V で始める。'],
  ['routine','ルーティン','rou·TINE','ルー**ティー**ン','後ろを強く伸ばす。'],
  ['yogurt','ヨーグルト','YO·gurt','**ヨ**ウガート','2音節。「グルト」と母音を足さない。'],
  ['strike','ストライク','STRIKE','ス**トライ**ク','1音節。ス・ト・ラに母音を入れず、STR を一気に。'],
  ['milk','ミルク','MILK','**ミ**ウク','1音節。「ル」「ク」に母音を足さない。'],
  ['street','ストリート','STREET','ス**トリー**ト','1音節。STR を一気に、最後の t は軽く。'],
  ['salad','サラダ','SAL·ad','**サ**ラッド','最初を強く。「ダ」と母音を足さない。'],
  ['Christmas','クリスマス','CHRIST·mas','**ク**リスマス','2音節。t は発音しない。最初を強く。']
];

/* ---------- 記録 ---------- */
function sj(){const s=PROG.sj||(PROG.sj={});s.q=s.q||[];s.w=s.w||{};s.hist=s.hist||[];return s}
// 単語・お題ごとの [回数, できた回数]
function sjMark(id,ok){const w=sj().w,r=w[id]||(w[id]=[0,0]);r[0]++;if(ok)r[1]++}
function sjRate(prefix){let n=0,ok=0;Object.entries(sj().w).forEach(([k,v])=>{if(k.startsWith(prefix)){n+=v[0];ok+=v[1]}});return n?ok/n:null}
function sjAvgLat(){const q=sj().q.slice(-10);return q.length?q.reduce((a,x)=>a+x.lat,0)/q.length:null}
const sjShuf=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
// まだできていない物を優先して選ぶ
function sjPick(list,key,n){
  const w=sj().w,sc=x=>{const r=w[key(x)];return r?(r[1]/r[0])+r[0]*0.05:-1};
  return sjShuf(list).sort((a,b)=>sc(a)-sc(b)).slice(0,n);
}
const sjMora=k=>k.replace(/[ャュョァィゥェォゃゅょぁぃぅぇぉ・\s]/g,'').length;
const sjStressHTML=s=>s.split('·').map(p=>/[A-Z]/.test(p)&&p===p.toUpperCase()?`<b>${esc(p)}</b>`:esc(p)).join('·');
const sjGuideHTML=g=>esc(g).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
// continuous 認識で端末によって同じ語句が二重に返るのをまとめる
function sjDedupe(t){let s=String(t||'').trim();for(let n=6;n>=2;n--){const re=new RegExp('\\b((?:[\\w\']+\\s+){'+(n-1)+'}[\\w\']+)\\s+\\1\\b','gi');s=s.replace(re,'$1')}return s}
// 語句がそのまま（連続して）言えたか
function sjHas(text,w){const j=a=>' '+tkTokens(a).map(tkStem).join(' ')+' ';return j(text).includes(j(w))}
function sjSay(text,onend){
  if(typeof lxSpeakLines==='function')return lxSpeakLines([{sp:'W',t:text}],{rate:talkData().rate||0.92,onend});
  speak(text,talkData().rate||0.92);if(onend)setTimeout(onend,600+text.split(/\s+/).length*380);
}

/* ---------- 問題を作る ---------- */
function sjItems(kind,n){
  if(kind==='quick')return sjPick(SJ_QUICK,x=>'q_'+x[0],n).map(x=>({kind,id:'q_'+x[0],q:x[0],ja:x[1],model:x[2]}));
  if(kind==='para')return sjPick(SJ_PARA,x=>'p_'+x[1],n).map(x=>({kind,id:'p_'+x[1],ja:x[0],en:x[1],cat:x[2],keys:x[3],model:x[4]}));
  if(kind==='kata')return sjPick(SJ_KATA,x=>'k_'+x[0],n).map(x=>({kind,id:'k_'+x[0],w:x[0],kana:x[1],stress:x[2],guide:x[3],tip:x[4]}));
  return[];
}
const SJ_KIND={
  quick:{ic:'⏱',name:'3秒ルール',ja:'黙って考えず、つなぎ言葉で3秒以内に話し出す。答えは＋1文で広げる'},
  para:{ic:'🔁',name:'言い換え',ja:'単語を知らなくても止まらない。「〜に使うもの」と説明して切り抜ける'},
  kata:{ic:'🗣',name:'カタカナ発音リセット',ja:'母音を足さない・強く言う場所を守る。音声認識に通じるか確かめる'}
};

/* ---------- 共通の進行 ---------- */
let sjS=null;
function sjRun(items,title){
  if(typeof lxUnlock==='function')lxUnlock();
  sjS={items,i:0,res:[],title,t0:Date.now()};sjRender();
}
function sjHead(){
  const s=sjS,q=s.items[s.i],k=SJ_KIND[q.kind];
  return tkBack(esc(s.title))+`<div class="rv-prog tk-prog"><div class="rv-prog-fill" style="width:${s.i/s.items.length*100}%"></div></div>
    <div class="sj-kind"><span>${k.ic} ${k.name}</span><span class="tk-prog-n">${s.i+1}/${s.items.length}</span></div>`;
}
function sjRender(){
  tkStopAll();if('speechSynthesis'in window)speechSynthesis.cancel();
  const s=sjS;if(!s)return;
  if(s.i>=s.items.length)return sjFinish();
  const q=s.items[s.i];
  ({quick:sjQuick,para:sjPara,kata:sjKata})[q.kind](q);
  tkBindBack(()=>{clearInterval(sjQuick._t);sjS=null;sjHubOpen()});
  window.scrollTo(0,0);
}
function sjNextBtns(){
  return`<div class="tk-fb-btns"><button class="btn btn-secondary" id="sj-retry">${ICONS.mic} もう一度</button><button class="btn btn-gold" id="sj-next">${sjS.i+1>=sjS.items.length?'結果を見る':'次へ'} ${ICONS.arrowRight}</button></div>`;
}
function sjBindNext(q,ok,retry){
  let saved=false;const save=()=>{if(saved)return;saved=true;sjMark(q.id,ok);sjS.res.push({kind:q.kind,ok});commit()};
  document.getElementById('sj-next').onclick=()=>{save();sjS.i++;sjRender()};
  document.getElementById('sj-retry').onclick=retry;
  sfx(ok?'correct':'wrong');
}

/* ---------- 1. 3秒ルール ---------- */
function sjQuick(q){
  const el=tkScreen(),hasSR=!!TK_SR;
  el.innerHTML=sjHead()+`<div class="tk-act sj-act">
    <div class="tk-goal-l">質問が終わったら、3秒以内に話し出す</div>
    <div class="sj-question" id="sj-qt">${esc(q.q)}</div>
    <button class="tk-link" id="sj-ja">訳を見る</button>
    <div class="sj-clock" id="sj-clock" aria-live="polite">—</div>
    <div class="tk-mic-wrap" id="sj-micw"><button class="btn btn-gold" id="sj-start">${ICONS.play} 質問を聞く</button></div>
    <div class="tk-live tk-live-lg" id="sj-live">完璧な文はいりません。まず声を出すのが英語の会話のマナー。</div>
    <div class="sj-chips" aria-label="つなぎ言葉">${SJ_FILLER_CHIPS.map(c=>`<span>${esc(c)}</span>`).join('')}</div>
    <div id="sj-fb"></div></div>`;
  document.getElementById('sj-ja').onclick=e=>{e.target.outerHTML=`<div class="tk-row-s">${esc(q.ja)}</div>`};
  const clock=document.getElementById('sj-clock'),live=document.getElementById('sj-live'),micw=document.getElementById('sj-micw');
  let t0=0,lat=null,silence=null,stopped=false;
  const tick=()=>{if(lat==null&&t0){const v=(performance.now()-t0)/1000;clock.textContent=v.toFixed(1)+'秒';clock.classList.toggle('over',v>3)}};
  const gotVoice=()=>{if(lat!=null||!t0)return;lat=(performance.now()-t0)/1000;clearInterval(sjQuick._t);clock.textContent=lat.toFixed(1)+'秒';clock.classList.toggle('over',lat>3);clock.classList.add('done')};
  const listen=()=>{
    micw.innerHTML=hasSR?`${tkMicHTML('sj-mic','話し終わったらタップ')}`:`<button class="btn btn-gold" id="sj-tap">話し始めたらタップ</button>`;
    if(!hasSR){document.getElementById('sj-tap').onclick=()=>{gotVoice();sjQuickSelf(q,lat)};return}
    const mic=document.getElementById('sj-mic');mic.classList.add('mic-active');live.textContent='Go!';live.classList.add('on');
    mic.onclick=()=>{stopped=true;if(tkRec)tkRec.stop()};
    const h=tkListen({lang:'en-US',continuous:true,maxMs:15000,
      onInterim:t=>{gotVoice();live.textContent=t;clearTimeout(silence);silence=setTimeout(()=>{if(tkRec)tkRec.stop()},2600)},
      onDone:(txt,meta)=>{clearTimeout(silence);clearInterval(sjQuick._t);mic.classList.remove('mic-active');live.classList.remove('on');
        txt=sjDedupe(txt);
        if(!txt){clock.textContent='—';live.textContent=meta.error?tkSrErrorMsg(meta.error):'聞き取れませんでした。';
          micw.innerHTML=`<button class="btn btn-gold" id="sj-start">${ICONS.play} もう一度質問を聞く</button>`;document.getElementById('sj-start').onclick=ask;return}
        gotVoice();sjQuickResult(q,txt,lat)},
      onError:c=>{mic.classList.remove('mic-active');live.textContent=tkSrErrorMsg(c)}});
    // 自動で始められない端末では、タップで始める（時計は質問が終わった時点から進む）
    if(!h){micw.innerHTML=tkMicHTML('sj-mic','話す');live.textContent='マイクを押して答えよう（時計は進んでいます）';
      document.getElementById('sj-mic').onclick=()=>{gotVoice();listen()}}
  };
  const ask=()=>{
    lat=null;t0=0;stopped=false;clock.textContent='…';clock.className='sj-clock';
    micw.innerHTML=`<div class="tk-row-s">🔊 質問を聞いています…</div>`;live.textContent='';
    sjSay(q.q,()=>{if(!sjS||sjS.items[sjS.i]!==q)return;t0=performance.now();clearInterval(sjQuick._t);sjQuick._t=setInterval(tick,100);listen()});
  };
  document.getElementById('sj-start').onclick=ask;
}
function sjQuickResult(q,text,lat){
  const words=tkTokens(text).length,filler=SJ_FILLER.test(text),fast=lat<=3,more=words>=8,ok=fast&&words>=5;
  sj().q.push({d:todayStr(),lat:Math.round(lat*10)/10,w:words});if(sj().q.length>200)sj().q.shift();
  if(typeof jpLog==='function')jpLog('speak',ok);
  const advice=!fast?'黙って考えるより、まず <b>Well,</b> / <b>Hmm, let me think.</b> で声を出そう。英語では、考えながら話すのがふつうです。'
    :words<5?'Yes / No や単語だけで終わると会話が止まります。<b>理由か具体例を1文足す</b>（because … / I usually …）と続きます。'
    :!more?'いいテンポ！ あと1文足せると、相手が質問を返しやすくなります。':'すばらしい！ すぐ話し出して、ちゃんと広げられています。';
  document.getElementById('sj-micw').innerHTML='';document.getElementById('sj-live').textContent='';
  document.getElementById('sj-fb').innerHTML=`<div class="sj-metrics">
      <div class="sj-m ${fast?'ok':'ng'}"><b>${lat.toFixed(1)}<small>秒</small></b><span>話し出すまで<br>目標 3秒</span></div>
      <div class="sj-m ${more?'ok':words>=5?'mid':'ng'}"><b>${words}<small>語</small></b><span>${more?'＋1文できた':'一言で<br>終わりがち'}</span></div>
      <div class="sj-m ${filler?'ok':''}"><b>${filler?'✓':'—'}</b><span>つなぎ言葉</span></div></div>
    <div class="tk-tipbox">${advice}</div>
    <div class="sj-model"><span class="tk-goal-l">お手本</span><b>${esc(q.model)}</b>${tkSayBtn(q.model,0.9)}</div>
    ${sjNextBtns()}`;
  tkBindSay(document.getElementById('sj-fb'));
  sjBindNext(q,ok,()=>sjRender());
}
// 音声認識がない端末：自分で判定
function sjQuickSelf(q,lat){
  document.getElementById('sj-micw').innerHTML='';
  const fb=document.getElementById('sj-fb');
  fb.innerHTML=`<div class="sj-metrics"><div class="sj-m ${lat<=3?'ok':'ng'}"><b>${lat.toFixed(1)}<small>秒</small></b><span>話し出すまで<br>目標 3秒</span></div></div>
    <div class="sj-model"><span class="tk-goal-l">お手本</span><b>${esc(q.model)}</b>${tkSayBtn(q.model,0.9)}</div>
    <div class="tk-fb-btns"><button class="btn btn-secondary" id="sj-s0">一言で終わった</button><button class="btn btn-gold" id="sj-s1">＋1文まで言えた</button></div>`;
  tkBindSay(fb);
  const fin=more=>{const ok=lat<=3&&more;sj().q.push({d:todayStr(),lat:Math.round(lat*10)/10,w:more?8:2});if(typeof jpLog==='function')jpLog('speak',ok);
    sjMark(q.id,ok);sjS.res.push({kind:q.kind,ok});commit();sfx(ok?'correct':'wrong');sjS.i++;sjRender()};
  document.getElementById('sj-s0').onclick=()=>fin(false);document.getElementById('sj-s1').onclick=()=>fin(true);
}

/* ---------- 2. 言い換え ---------- */
function sjPara(q){
  const el=tkScreen();
  el.innerHTML=sjHead()+`<div class="tk-act sj-act">
    <div class="tk-goal-l">英語の単語を知らなくてOK。説明して伝えよう</div>
    <div class="sj-ja">${esc(q.ja)}</div><div class="tk-row-s">${SJ_CAT_JA[q.cat]}を説明する型</div>
    <div class="sj-frames">${SJ_FRAMES[q.cat].map(f=>`<span>${esc(f)}</span>`).join('')}</div>
    <div class="tk-mic-wrap" id="sj-micw">${TK_SR?tkMicHTML('sj-mic','話す'):''}</div>
    <div class="tk-live tk-live-lg" id="sj-live">${TK_SR?'マイクを押して、15秒以内で説明しよう':''}</div>
    <div id="sj-type" ${TK_SR?'hidden':''}><textarea class="ic-input" id="sj-ta" rows="2" placeholder="It's a thing you use to …"></textarea><button class="btn btn-gold btn-block" id="sj-send">これで伝える</button></div>
    ${TK_SR?'<div class="tk-subacts"><button class="tk-link" id="sj-totype">⌨ タイプで答える</button><button class="tk-link" id="sj-give">降参して答えを見る</button></div>':'<div class="tk-subacts"><button class="tk-link" id="sj-give">降参して答えを見る</button></div>'}
    <div id="sj-fb"></div></div>`;
  const live=document.getElementById('sj-live');
  document.getElementById('sj-give').onclick=()=>{tkStopAll();sjParaResult(q,'',true)};
  const tt=document.getElementById('sj-totype');if(tt)tt.onclick=()=>{tkStopAll();document.getElementById('sj-type').hidden=false;document.getElementById('sj-ta').focus()};
  document.getElementById('sj-send').onclick=()=>{const v=document.getElementById('sj-ta').value.trim();if(v)sjParaResult(q,v)};
  const mic=document.getElementById('sj-mic');
  if(mic)mic.onclick=()=>{
    if(tkRec){tkRec.stop();return}
    if('speechSynthesis'in window)speechSynthesis.cancel();
    mic.classList.add('mic-active');live.textContent='Listening…';live.classList.add('on');let silence=null;
    tkListen({lang:'en-US',continuous:true,maxMs:15000,
      onInterim:t=>{live.textContent=t;clearTimeout(silence);silence=setTimeout(()=>{if(tkRec)tkRec.stop()},2800)},
      onDone:(txt,meta)=>{clearTimeout(silence);mic.classList.remove('mic-active');live.classList.remove('on');txt=sjDedupe(txt);
        if(!txt){live.textContent=meta.error?tkSrErrorMsg(meta.error):'聞き取れませんでした。もう一度どうぞ。';return}
        sjParaResult(q,txt)},
      onError:c=>{mic.classList.remove('mic-active');live.textContent=tkSrErrorMsg(c)}});
  };
}
function sjParaResult(q,text,gaveUp){
  const toks=tkTokens(text),words=toks.length;
  const hits=q.keys.filter(k=>toks.some(t=>t===k||tkStem(t)===tkStem(k)));
  const knew=text&&q.en.split(' / ').some(e=>sjHas(text,e));
  const frame=SJ_FRAME_RE.test(text);
  const ok=!gaveUp&&(knew||(hits.length>=1&&words>=4));
  const msg=gaveUp?'次は型の1つ目だけでも言ってみよう。<b>It\'s a thing …</b> と言い始めれば、相手が単語を推測してくれます。'
    :knew?'単語そのものを知っていました！ 知らない単語に出会ったときも、この「説明する型」で止まらずに話せます。'
    :ok?'伝わります！ ピッタリの単語が出なくても、説明すれば相手が <b>Oh, '+esc(q.en.split(' / ')[0])+'?</b> と教えてくれます。教わった単語をくり返せばOK。'
    :hits.length?'もう少し！ 「何に使う／どこで／どんなとき」を1つ足して、文にしてみよう。'
    :'中身を伝える単語がまだ足りません。下のお手本の型をまねして、何に使うものかを言ってみよう。';
  ['sj-micw','sj-type'].forEach(id=>{const x=document.getElementById(id);if(x)x.style.display='none'});
  const sub=document.querySelector('.sj-act .tk-subacts');if(sub)sub.remove();
  document.getElementById('sj-live').textContent='';
  document.getElementById('sj-fb').innerHTML=`${text?`<div class="tk-tipbox">あなた：${esc(text)}</div>`:''}
    ${gaveUp?'':`<div class="sj-metrics">
      <div class="sj-m ${frame?'ok':''}"><b>${frame?'✓':'—'}</b><span>説明の型</span></div>
      <div class="sj-m ${hits.length>=2?'ok':hits.length?'mid':'ng'}"><b>${hits.length}</b><span>伝わる<br>キーワード</span></div>
      <div class="sj-m ${words>=6?'ok':words>=4?'mid':'ng'}"><b>${words}<small>語</small></b><span>長さ</span></div></div>`}
    <div class="tk-tipbox">${msg}</div>
    <div class="sj-model"><span class="tk-goal-l">英語では</span><b>${esc(q.en)}</b>${tkSayBtn(q.en.split(' / ')[0],0.85)}</div>
    <div class="sj-model"><span class="tk-goal-l">説明のお手本</span><b>${esc(q.model)}</b>${tkSayBtn(q.model,0.9)}</div>
    ${sjNextBtns()}`;
  tkBindSay(document.getElementById('sj-fb'));
  sjBindNext(q,ok,()=>sjRender());
}

/* ---------- 3. カタカナ発音リセット ---------- */
function sjKata(q){
  const el=tkScreen(),syl=q.stress.split('·').length;
  el.innerHTML=sjHead()+`<div class="tk-act sj-act tk-gym-q">
    <div class="sj-kata"><s>${esc(q.kana)}</s><small>カタカナだと ${sjMora(q.kana)}拍</small></div>
    <div class="tk-gym-word">${esc(q.w)}</div>
    <div class="sj-stress"><span>${sjStressHTML(q.stress)}</span><small>英語は ${syl}音節 · 太字を強く</small></div>
    <div class="sj-guide">近い音：${sjGuideHTML(q.guide)}</div>
    <div class="tk-subacts"><button class="tk-link" data-tksay="${esc(q.w)}" data-rate="0.85">▶ お手本</button><button class="tk-link" data-tksay="${esc(q.w)}" data-rate="0.6">▶ ゆっくり</button>${TK_SR?'':'<button class="tk-link" id="sj-self">自分で判定する</button>'}</div>
    <div class="tk-mic-wrap" id="sj-micw">${TK_SR?tkMicHTML('sj-mic','話す'):''}</div>
    <div class="tk-live" id="sj-live">${TK_SR?'お手本を聞いてから、マイクで言ってみよう':''}</div>
    <div id="sj-fb"></div></div>`;
  tkBindSay(el);
  setTimeout(()=>{if(sjS&&sjS.items[sjS.i]===q)speak(q.w,0.85)},300);
  const self=document.getElementById('sj-self');
  if(self)self.onclick=()=>sjKataResult(q,null);
  const mic=document.getElementById('sj-mic'),live=document.getElementById('sj-live');
  if(mic)mic.onclick=()=>{
    if(tkRec){tkRec.stop();return}
    if('speechSynthesis'in window)speechSynthesis.cancel();
    mic.classList.add('mic-active');live.textContent='Listening…';
    tkListen({lang:'en-US',alts:5,maxMs:5000,onInterim:t=>{live.textContent=t},
      onDone:(txt,meta)=>{mic.classList.remove('mic-active');
        if(meta.error){live.textContent=tkSrErrorMsg(meta.error);return}
        if(!txt){live.textContent='聞き取れませんでした。もう一度どうぞ。';return}
        sjKataResult(q,{top:meta.alts[0]||txt,alts:meta.alts})},
      onError:c=>{mic.classList.remove('mic-active');live.textContent=tkSrErrorMsg(c)}});
  };
}
function sjKataResult(q,r){
  const fb=document.getElementById('sj-fb');document.getElementById('sj-micw').innerHTML='';document.getElementById('sj-live').textContent='';
  if(!r){
    fb.innerHTML=`<div class="tk-tipbox">${esc(q.tip)}</div><div class="tk-fb-btns"><button class="btn btn-secondary" id="sj-s0">カタカナっぽい</button><button class="btn btn-gold" id="sj-s1">お手本に近い</button></div>`;
    const fin=ok=>{sjMark(q.id,ok);sjS.res.push({kind:q.kind,ok});commit();sfx(ok?'correct':'wrong');sjS.i++;sjRender()};
    document.getElementById('sj-s0').onclick=()=>fin(false);document.getElementById('sj-s1').onclick=()=>fin(true);return;
  }
  const top=sjHas(r.top,q.w),any=r.alts.some(a=>sjHas(a,q.w)),ok=top||any;
  fb.innerHTML=`${top?`<b class="tk-ok">通じた！</b> 「${esc(q.w)}」と認識されました。`
      :any?`<b class="tk-mid">惜しい！</b> 候補には入りましたが1番ではありませんでした（認識：${esc(r.top)}）。`
      :`<b class="tk-ng">「${esc(r.top)}」と認識されました。</b>`}
    <div class="tk-tipbox">${esc(q.tip)}</div>${sjNextBtns()}`;
  sjBindNext(q,ok,()=>sjRender());
}

/* ---------- 結果 ---------- */
function sjFinish(){
  const s=sjS;sjS=null;clearInterval(sjQuick._t);
  const n=s.res.length,ok=s.res.filter(x=>x.ok).length,pct=n?Math.round(ok/n*100):0,sec=Math.round((Date.now()-s.t0)/1000);
  sj().hist.push({d:todayStr(),n,ok});if(sj().hist.length>200)sj().hist.shift();commit();
  if(typeof talkLog==='function')talkLog('sj',pct,Math.min(sec,600));
  if(typeof XP_TABLE!=='undefined'&&XP_TABLE.speak_gym==null)XP_TABLE.speak_gym=15;
  if(n)addXP('speak_gym');
  if(n&&typeof spkCoin==='function')spkCoin(10,'話すジム');
  if(pct>=80&&n)launchConfetti();
  const by=Object.keys(SJ_KIND).map(k=>{const r=s.res.filter(x=>x.kind===k);return r.length?`<div class="sj-sum-row"><span>${SJ_KIND[k].ic} ${SJ_KIND[k].name}</span><b>${r.filter(x=>x.ok).length}/${r.length}</b></div>`:''}).join('');
  const lat=sjAvgLat();
  const el=tkScreen();
  el.innerHTML=tkBack(esc(s.title))+`<div class="tk-act tk-sum"><div class="tk-sum-top">${tkRing(pct,104)}<div><div class="tk-fb-label">${ok}/${n} ${pct>=80?'Great!':pct>=50?'Good!':'Keep going!'}</div><div class="tk-fb-meta">${Math.max(1,Math.round(sec/60))}分 話す練習</div></div></div>
    ${by}${lat!=null?`<div class="tk-tipbox">直近の「話し出すまで」の平均：<b>${lat.toFixed(1)}秒</b>（目標 3秒以内）</div>`:''}
    <div class="tk-tipbox">日本人が英語で黙るのは、知識より「間違えたくない」気持ちから。つなぎ言葉・説明・リズムは、使うほど口が覚えます。</div>
    ${inDaySession()?sessionNavHTML():`<div class="tk-fb-btns"><button class="btn btn-secondary" id="sj-hub">話すジムへ</button><button class="btn btn-gold" id="sj-home">Home ${ICONS.arrowRight}</button></div>`}</div>`;
  tkBindBack(sjHubOpen);
  const hb=document.getElementById('sj-hub');if(hb){hb.onclick=sjHubOpen;document.getElementById('sj-home').onclick=()=>go('home')}
  window.scrollTo(0,0);
}

/* ---------- 入口（ハブ） ---------- */
function sjDaily(){sjRun(sjShuf([...sjItems('quick',2),...sjItems('para',1)]).concat(sjItems('kata',2)),'今日の話すジム')}
function sjHubOpen(){
  tkStopAll();const el=tkScreen();
  const lat=sjAvgLat(),kr=sjRate('k_'),pr=sjRate('p_');
  const stat=(v,l)=>`<div class="tk-stat"><div class="tk-stat-v">${v}</div><div class="tk-stat-l">${l}</div></div>`;
  el.innerHTML=tkBack('話すジム')+`<p class="tk-note">日本人が英語で話せない原因は、知識不足より<b>「黙る」「止まる」「カタカナで言う」</b>の3つのクセ。1回3分、声に出して直します。</p>
    <div class="tk-stats sj-stats">${stat(lat==null?'—':lat.toFixed(1)+'<small>秒</small>','話し出すまで')}${stat(pr==null?'—':Math.round(pr*100)+'<small>%</small>','言い換え成功')}${stat(kr==null?'—':Math.round(kr*100)+'<small>%</small>','カタカナ発音が通じた')}</div>
    <button class="btn btn-gold btn-block" id="sj-daily" style="margin:12px 0">今日の3分セット（5問）${ICONS.arrowRight}</button>
    ${Object.entries(SJ_KIND).map(([k,v])=>`<button class="tk-wide" data-sj="${k}"><span class="tk-mode-ic sj-ic">${v.ic}</span><span><span class="tk-mode-t">${v.name}</span><span class="tk-mode-d">${v.ja}</span></span><span class="tk-row-go">${ICONS.arrowRight}</span></button>`).join('')}
    ${TK_SR?'':`<div class="tk-warn">このブラウザは音声認識に未対応のため、タイプ入力・自己判定で練習できます（Chrome / Safari 推奨）。</div>`}`;
  tkBindBack(renderTalkHub);
  document.getElementById('sj-daily').onclick=sjDaily;
  el.querySelectorAll('[data-sj]').forEach(b=>b.onclick=()=>{const k=b.dataset.sj;sjRun(sjItems(k,k==='kata'?8:5),SJ_KIND[k].name)});
  window.scrollTo(0,0);
}

/* ---------- 既存機能への接続 ---------- */
function sjInstall(){
  // 毎日のメニュー：木曜の「英会話ロールプレイ」枠を話すジムに（量は変えない）
  if(typeof P6_TASKS!=='undefined'&&typeof p6MenuFor==='function'){
    P6_TASKS.sj={t:'話すジム 3分',sub:'3秒で話し出す・言い換え・カタカナ発音',m:5};
    const _mf=p6MenuFor;p6MenuFor=function(date){const r=_mf.apply(this,arguments);if(date&&date.getDay()===4)r.list=r.list.map(a=>a==='talk'?'sj':a);return r};
  }
  const _pta=planTaskAction;planTaskAction=function(a){if(a==='sj')return sjDaily();return _pta.apply(this,arguments)};
  // Talk タブ：モードの直後に入口
  if(typeof renderTalkHub==='function'){const _th=renderTalkHub;renderTalkHub=function(){const r=_th.apply(this,arguments);const el=document.getElementById('screen-talk'),modes=el&&el.querySelector('.tk-modes');
    if(modes&&!el.querySelector('#sj-talk')){modes.insertAdjacentHTML('afterend',`<button class="tk-wide sj-entry" id="sj-talk"><span class="tk-mode-ic sj-ic">⏱</span><span><span class="tk-mode-t">話すジム <small class="sj-new">日本人特化</small></span><span class="tk-mode-d">黙らない（3秒ルール）・止まらない（言い換え）・カタカナで言わない</span></span><span class="tk-row-go">${ICONS.arrowRight}</span></button>`);
      document.getElementById('sj-talk').onclick=sjHubOpen}return r}}
  // 英語ジム：「話す」の3つの壁を追加
  if(typeof jpHubOpen==='function'){const _jh=jpHubOpen;jpHubOpen=function(){const r=_jh.apply(this,arguments);const el=document.getElementById('screen-review'),sh=el&&el.querySelector('#jp-shadow');
    if(sh&&!el.querySelector('#sj-jp')){sh.insertAdjacentHTML('beforebegin',`<div class="sec-title" id="sj-jp">🗣 話すジム（黙らない・止まらない・通じる）</div>`+Object.entries(SJ_KIND).map(([k,v])=>`<button class="card jp-row" data-sjk="${k}"><span class="jp-row-b"><b>${v.ic} ${v.name}</b><small>${v.ja}</small></span><span class="jp-row-v">${ICONS.arrowRight}</span></button>`).join(''));
      el.querySelectorAll('[data-sjk]').forEach(b=>b.onclick=()=>{const k=b.dataset.sjk;sjRun(sjItems(k,k==='kata'?8:5),SJ_KIND[k].name)})}return r}}
  // Plus 比較表：話すジムは無料
  if(typeof PLAN_ROWS!=='undefined'&&!PLAN_ROWS.some(r=>r[0].startsWith('話すジム')))PLAN_ROWS.splice(2,0,['話すジム（3秒ルール・言い換え・カタカナ発音）','○','○']);
}
if(typeof go==='function')sjInstall();
