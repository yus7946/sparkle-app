/* ========== Spark と英語通話（日本のことを英語で話そう） ==========
   ビデオ通話風の画面で、日本に旅行する予定の「海外の友だち役」の Spark と話す。
   日本人が実際に聞かれて詰まる話題（自己紹介・日本の食べ物・習慣・おすすめの場所・道案内・行事）を選ぶ。
   ・着信 → 応答で通話開始（このタップで端末の音声再生とマイクを使えるようにする）
   ・Spark の質問が終わると自動でマイクが開く。7秒黙ったら「こう言ってみて」の書き出しを出す（沈黙サポート）
   ・一言だけなら「もう少し教えて」と1回だけ聞き返す
   ・答えに日本人に多いミス（冠詞・三単現・時制など）があれば、Spark が正しい言い方で返す（リキャスト）
   ・終わったら通話レポート：通話時間・話した語数・話し出すまでの秒数・言い直し（表現ノートに保存）
   ・「アメリカ生活」タブ：Spark が大家さん・銀行員・医師などの役になり、住む・暮らすための会話を練習する
   判定は端末の音声認識と talk.js の添削ルールだけ（$0・ブラウザ内完結）。
   talk.js / speakjp.js の後に読み込む。 */
'use strict';

// 1ターン＝[Spark の質問, 訳, 書き出しのヒント, 内容が合っているかを見るキーワード]
const CALL_TOPICS=[
  {id:'me',ic:'👋',ja:'自己紹介',sub:'名前・仕事・趣味を伝える',turns:[
    ["Hi! It's so nice to finally talk. Can you tell me a little about yourself?","やっと話せてうれしい！ ちょっと自己紹介してくれる？","I'm … I live in …",['name','live','from','work','student','japan','tokyo','osaka','years','old']],
    ["What do you do for work?","仕事は何をしているの？","I work at … / I'm a …",['work','job','company','office','student','school','teacher','nurse','engineer','sales','part']],
    ["Nice! What do you like to do on weekends?","いいね！ 週末は何をするのが好き？","I like to … on weekends.",['like','weekend','watch','play','go','read','cook','sleep','shopping','friends','walk']],
    ["Why are you learning English?","どうして英語を勉強しているの？","Because I want to …",['want','travel','work','because','talk','friends','abroad','movie','test','toeic','speak']]]},
  {id:'food',ic:'🍣',ja:'日本の食べ物',sub:'おすすめ料理を説明する',turns:[
    ["I'm visiting Japan next month! What Japanese food should I try?","来月日本に行くんだ！ どんな日本の料理を食べるべき？","You should try …",['try','sushi','ramen','tempura','okonomiyaki','udon','soba','yakitori','curry','takoyaki','should']],
    ["Sounds good! What is it like? Can you describe it?","いいね！ それってどんな料理？ 説明して","It's a kind of … with …",['kind','noodle','rice','fish','soup','sweet','salty','meat','sauce','like','fried','hot','delicious']],
    ["Is it expensive?","高いの？","No, it's about … yen.",['yen','cheap','expensive','about','dollar','not','price','depends','reasonable']],
    ["What's your favorite Japanese food?","あなたの好きな日本の料理は？","My favorite is … because …",['favorite','like','because','love','best','taste','delicious','mother','make']]]},
  {id:'custom',ic:'🎎',ja:'日本の習慣',sub:'靴・チップ・電車のマナー',turns:[
    ["I heard people take off their shoes at home in Japan. Why is that?","日本では家で靴を脱ぐって聞いたよ。どうして？","Because we want to keep …",['clean','floor','dirty','because','keep','house','home','sit','tatami','culture']],
    ["Do I need to tip at restaurants in Japan?","日本のレストランではチップが必要？","No, you don't need to. …",['no','tip','need','don','necessary','included','service','rude','money']],
    ["What should I be careful about on the train?","電車で気をつけることは？","Please don't … on the train.",['phone','talk','quiet','loud','line','wait','eat','seat','priority','careful','call']],
    ["What does 'itadakimasu' mean?","「いただきます」ってどういう意味？","We say it before we eat. It means …",['eat','before','thank','food','meal','say','mean','grateful','means']]]},
  {id:'trip',ic:'🗻',ja:'おすすめの場所',sub:'観光地をすすめて理由を言う',turns:[
    ["Where should I go in Japan? I want to see something special.","日本でどこに行くべき？ 特別なものが見たいな","You should go to …",['go','kyoto','tokyo','osaka','nara','hokkaido','okinawa','fuji','hiroshima','temple','should']],
    ["Why do you recommend it?","どうしておすすめなの？","Because it's … You can …",['because','beautiful','old','temple','food','famous','history','nature','can','see','traditional']],
    ["How can I get there from Tokyo?","東京からどうやって行けばいい？","You can take the … It takes about …",['take','train','shinkansen','bullet','bus','plane','fly','hour','hours','minutes','about']],
    ["What's the best season to visit?","行くならどの季節がいい？","I think … is the best because …",['spring','summer','fall','autumn','winter','cherry','blossom','leaves','snow','because','best']]]},
  {id:'way',ic:'🧭',ja:'道案内',sub:'困っている旅行者を助ける',turns:[
    ["Excuse me, I'm a little lost. I'm looking for the station. Can you help me?","すみません、ちょっと迷っちゃって。駅を探してるんだけど、助けてもらえる？","Sure. Go straight and …",['sure','straight','turn','left','right','corner','go','next','there','station','walk']],
    ["Is it far from here?","ここから遠いですか？","No, it's about … minutes on foot.",['no','minutes','minute','walk','foot','near','close','far','about','five','ten']],
    ["Which train goes to Shibuya?","渋谷に行くのはどの電車？","Take the … line.",['take','line','yamanote','green','train','platform','number','change','transfer']],
    ["Thank you so much! You're very kind.","本当にありがとう！ 親切だね","You're welcome. Have a nice …",['welcome','problem','pleasure','nice','trip','enjoy','day','care']]]},
  {id:'event',ic:'🎆',ja:'季節の行事',sub:'お花見・お祭り・お正月',turns:[
    ["What's a special event in Japan that I should know about?","日本で知っておくべき特別な行事は？","We have … in …",['hanami','festival','new','year','fireworks','cherry','obon','summer','spring','christmas','have']],
    ["What do people do then?","その時、みんなは何をするの？","People … and …",['people','eat','drink','watch','visit','temple','shrine','family','go','wear','yukata','see']],
    ["Do you do that too?","あなたもするの？","Yes, I usually … / No, but …",['yes','no','usually','every','year','family','friends','sometimes','go','but']],
    ["That sounds fun! What's your favorite season in Japan?","楽しそう！ 日本でいちばん好きな季節は？","I like … because …",['spring','summer','fall','autumn','winter','because','like','favorite','weather','food']]]}
];
// アメリカ生活：Spark が相手役になる。role＝役、bye＝最後のひとこと
const CALL_US=[
  {id:'apt',ic:'🏠',ja:'アパートの内見',sub:'入居時期・家賃・契約日を話す',role:'大家さん',bye:["Great! I'll get the lease ready. See you on signing day!","よし、契約書を用意しておくね。契約の日に会いましょう！"],turns:[
    ["Hi, thanks for coming to see the apartment. Are you looking to move in soon?","内見に来てくれてありがとう。すぐに入居したいのかな？","Yes, I'd like to move in by …",['yes','move','next','month','soon','week','by','want','like','april','may']],
    ["How many people will be living here?","ここには何人で住む予定？","Just me. / Two people, me and my …",['just','me','one','two','people','wife','husband','family','alone','myself','partner']],
    ["The rent is eighteen hundred dollars a month, and the deposit is one month's rent. Do you have any questions?","家賃は月1,800ドル、敷金は1か月分です。何か質問はある？","Are utilities included?",['utilities','included','include','parking','pet','pets','laundry','internet','lease','water','how']],
    ["Sure. So when would you like to sign the lease?","わかりました。では、いつ契約しますか？","Could I sign it this Friday?",['sign','friday','monday','week','tomorrow','next','could','can','lease','today']]]},
  {id:'bank',ic:'🏦',ja:'銀行口座を開く',sub:'口座開設・本人確認・カード',role:'銀行員',bye:["You're all set. Welcome to the bank, and have a great day!","手続き完了です。ようこそ。良い一日を！"],turns:[
    ["Good morning! How can I help you today?","おはようございます。本日はどうされましたか？","I'd like to open a checking account.",['open','account','checking','savings','bank','like','want']],
    ["Sure. Can I see your ID and proof of address?","かしこまりました。身分証と住所の証明を見せていただけますか？","Here's my passport and my lease.",['passport','here','id','lease','license','address','bill','card']],
    ["Thank you. Would you like a debit card with the account?","ありがとうございます。口座にデビットカードもおつけしますか？","Yes, please. How long does it take to arrive?",['yes','please','debit','card','how','long','arrive','need','no']],
    ["Is there anything else I can help you with?","ほかに何かお手伝いできることはありますか？","No, that's all. Thank you.",['no','that','all','thank','thanks','actually','also','online']]]},
  {id:'doctor',ic:'🩺',ja:'病院で症状を伝える',sub:'いつから・どんな症状か',role:'お医者さん',bye:["Take care, and get some rest. Feel better soon!","お大事に。ゆっくり休んでくださいね。"],turns:[
    ["Hi, I'm Dr. Smith. What brings you in today?","こんにちは、スミスです。今日はどうされましたか？","I've had a sore throat for three days.",['sore','throat','fever','headache','cough','days','since','pain','hurt','stomach','sick','feel']],
    ["I see. Do you have a fever or any other symptoms?","なるほど。熱やほかの症状はありますか？","I had a slight fever last night.",['fever','yes','no','night','cough','tired','runny','nose','little','slight','chills']],
    ["Are you taking any medication right now?","今、何か薬を飲んでいますか？","No, I'm not. / I'm taking …",['no','not','taking','medicine','medication','pill','allergic','allergy','nothing']],
    ["OK. I'll prescribe something for you. Do you have any questions?","わかりました。薬を出しますね。何か質問はありますか？","How often should I take it?",['how','often','take','day','times','food','side','effects','when','long','question']]]},
  {id:'phone',ic:'📞',ja:'電話でレストラン予約',sub:'人数・時間・名前を伝える',role:'お店の人',bye:["You're all set. We'll see you then!","ご予約承りました。お待ちしております！"],turns:[
    ["Thank you for calling Bella Cucina. How can I help you?","ベラ・クチーナです。ご用件をどうぞ。","I'd like to make a reservation for …",['reservation','reserve','table','book','like','tonight','friday','saturday']],
    ["Of course. For how many people, and what time?","かしこまりました。何名様で、何時にしますか？","For four people at seven o'clock.",['people','two','three','four','five','six','seven','eight','clock','pm','at','for']],
    ["Can I get a name and phone number for the reservation?","ご予約のお名前と電話番号をお願いします。","My name is … and my number is …",['name','number','phone','is','my']],
    ["Got it. Any special requests?","承知しました。何かご要望はありますか？","Could we have a table by the window?",['window','outside','birthday','allergy','quiet','high','chair','no','that']]]},
  {id:'work',ic:'💼',ja:'職場の雑談',sub:'週末・予定・ランチの誘い',role:'同僚',bye:["Awesome. See you at lunch then!","いいね。じゃあランチで！"],turns:[
    ["Hey! How was your weekend?","やあ！ 週末はどうだった？","It was great! I went to …",['great','good','went','weekend','relaxed','busy','fun','family','friends','nothing']],
    ["Nice! Do you have any plans for the holidays?","いいね！ 休みの予定はある？","I'm going to … / Not yet. Maybe …",['going','plan','plans','yet','maybe','visit','travel','family','home','japan','stay']],
    ["By the way, how are you settling in here? Is everything going OK?","ところで、こっちの生活には慣れた？ 順調？","Pretty well, thanks. I'm still getting used to …",['well','good','thanks','getting','used','still','everything','ok','fine','learning','weather','food']],
    ["Let me know if you need anything. Want to grab lunch sometime?","何かあったら言ってね。今度ランチでもどう？","Sure, I'd love to. How about …?",['sure','love','yes','how','about','tomorrow','lunch','sounds','good','great']]]},
  {id:'return',ic:'🛍',ja:'返品・カスタマーサービス',sub:'理由を伝えて返金してもらう',role:'店員',bye:["All done. Thanks for shopping with us!","手続き完了です。ご利用ありがとうございました！"],turns:[
    ["Hi, how can I help you?","いらっしゃいませ。どうされましたか？","I'd like to return this. It doesn't work.",['return','refund','exchange','broken','doesn','work','wrong','size','bought']],
    ["I'm sorry about that. Do you have the receipt?","申し訳ありません。レシートはお持ちですか？","Yes, here it is. I bought it last week.",['yes','receipt','here','bought','last','week','no','lost','card']],
    ["Would you like a refund or an exchange?","返金と交換、どちらにしますか？","A refund, please.",['refund','exchange','please','money','back','new','another']],
    ["OK, that's done. Is there anything else?","完了しました。ほかに何かありますか？","No, that's it. Thank you for your help.",['no','that','thank','thanks','help','all']]]},
  {id:'dmv',ic:'🚗',ja:'DMV（運転免許）',sub:'免許の手続きで要件を伝える',role:'窓口の職員',bye:["Good luck on your test!","試験、がんばってね！"],turns:[
    ["Next! What are you here for today?","次の方！ 今日はどんなご用件ですか？","I'd like to get a driver's license.",['license','driver','driving','test','get','apply','transfer','renew','id']],
    ["Do you have your passport and proof of residence?","パスポートと住所の証明はありますか？","Yes, here's my passport and a utility bill.",['yes','passport','here','bill','lease','proof','address','bank','statement']],
    ["Have you ever had a driver's license before?","これまでに運転免許を持っていたことはありますか？","Yes, I have a Japanese license.",['yes','japanese','japan','license','international','no','before','have','years']],
    ["OK, you'll need to take the written test. Are you ready?","では筆記試験を受けてもらいます。準備はいいですか？","Yes, I'm ready. / Can I take it in Japanese?",['yes','ready','japanese','language','can','now','wait','take']]]},
  {id:'neighbor',ic:'🏡',ja:'ご近所さんにあいさつ',sub:'引っ越しのあいさつと自己紹介',role:'お隣さん',bye:["It was so nice to meet you. See you around!","会えてうれしかった。またね！"],turns:[
    ["Oh, hi! Are you the new neighbor? I'm Linda.","あら、こんにちは！ 新しく越してきた方？ リンダです。","Yes! Nice to meet you. I'm … I just moved in.",['yes','nice','meet','moved','just','new','name','from']],
    ["Welcome to the neighborhood! Where are you from?","ようこそ！ どこから来たの？","I'm from Japan. I moved here for work.",['japan','from','tokyo','osaka','moved','work','school','family']],
    ["How do you like it here so far?","ここの暮らしはどう？","I like it a lot. It's quiet and …",['like','love','quiet','nice','people','friendly','big','different','so','far']],
    ["If you need anything, just knock on my door!","何かあったら、いつでもドアをノックしてね！","Thank you so much. That's very kind of you.",['thank','thanks','kind','you','too','same','appreciate','nice']]]}
];
CALL_US.forEach(t=>t.us=true);
const CALL_ALL=CALL_TOPICS.concat(CALL_US);
const CALL_REACT_US=["Got it.","Okay, sounds good.","Alright, thank you.","Perfect.","I see. Thanks."];
const CALL_REACT=["Oh, really? That sounds great!","Wow, I didn't know that!","Nice! That's really helpful.","Interesting! Thanks for telling me.","That sounds amazing!","Oh, cool! I like that."];
const CALL_MORE=["Oh, nice! Could you tell me a little more?","いいね！ もう少しくわしく教えて？"];
const CALL_AGAIN=["Sorry, I didn't catch that. Could you say it again?","ごめん、聞き取れなかった。もう一度言ってくれる？"];
const CALL_BYE=["Thank you so much! Talking with you was really fun. See you next time!","ありがとう！ 話せて本当に楽しかった。またね！"];

function callData(){const c=PROG.call||(PROG.call={});c.hist=c.hist||[];c.best=c.best||{};return c}
function callRate(){return typeof sjLv==='function'?sjLv().rate:(talkData().rate||0.92)}

/* ---------- 話題を選ぶ ---------- */
function callPick(){
  tkStopAll();const el=tkScreen(),c=callData(),us=(c.tab||((PROG.jpGoals||[]).includes('live')?'us':'jp'))==='us',list=us?CALL_US:CALL_TOPICS;
  el.innerHTML=tkBack('Spark と英語通話')+`
    <div class="call-hero"><div class="call-hero-av">${sparkSVG(null,'hello')}</div>
      <div class="call-hero-b"><span class="call-hero-k">VIDEO CALL · 日本人特化</span><b>${us?'アメリカで、困らずに暮らす':'日本のことを、英語で話そう'}</b>
      <small>${us?'Spark が大家さん・銀行員・お医者さんなどの役になります。住む・働く・病院に行く…生活の場面を、本番の前に通話で練習。':'日本に来る予定の友だち（Spark）から電話がきます。聞かれて詰まりがちな「日本の説明」を、通話で練習。黙ってもヒントが出るので大丈夫。'}</small></div></div>
    <div class="tk-seg call-tabs" role="tablist"><button data-tab="jp" class="${us?'':'on'}">🇯🇵 日本を紹介</button><button data-tab="us" class="${us?'on':''}">🇺🇸 アメリカ生活</button></div>
    <div class="call-grid">${list.map(t=>{const b=c.best[t.id];return`<button class="call-topic" data-ct="${t.id}"><span class="call-topic-ic">${t.ic}</span><b>${t.ja}</b><small>${t.role?'相手：'+t.role+' · ':''}${t.sub}</small><span class="call-topic-m">${b!=null?`<i class="tk-best ${b>=80?'hi':b>=60?'mid':'lo'}">${b}</i>`:'4ターン · 約3分'}</span></button>`}).join('')}</div>
    ${c.hist.length?`<div class="tk-note" style="margin-top:12px">これまでの通話：${c.hist.length}回 · 合計 ${Math.round(c.hist.reduce((a,x)=>a+x.sec,0)/60)}分</div>`:''}
    ${TK_SR?'':`<div class="tk-warn">このブラウザは音声認識に未対応です。Chrome / Safari で開くと通話できます。</div>`}`;
  tkBindBack(renderTalkHub);
  el.querySelectorAll('[data-ct]').forEach(b=>b.onclick=()=>callRing(b.dataset.ct));
  el.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{c.tab=b.dataset.tab;commit();sfx('tap');callPick()});
  window.scrollTo(0,0);
}

/* ---------- 通話画面 ---------- */
let CL=null;
function callOv(){let o=document.getElementById('call-ov');if(!o){o=document.createElement('div');o.id='call-ov';o.setAttribute('role','dialog');o.setAttribute('aria-label','Spark と英語通話');document.body.appendChild(o)}document.body.classList.add('call-open');return o}
function callClose(){
  if(CL){clearInterval(CL.tick);clearTimeout(CL.hintT);clearTimeout(CL.silT)}
  tkStopAll();if('speechSynthesis'in window)speechSynthesis.cancel();
  const o=document.getElementById('call-ov');if(o)o.remove();document.body.classList.remove('call-open');
}
// 着信画面
function callRing(id){
  const t=CALL_ALL.find(x=>x.id===id);if(!t)return;
  const o=callOv();
  o.innerHTML=`<div class="call-bg"></div><div class="call-ring">
    <div class="call-top"><span class="call-k">着信中…</span><b>${esc(typeof spkNick==='function'?spkNick():'Spark')}</b><small>${t.role?esc(t.role)+'役 · ':'話題：'}${t.ic} ${esc(t.ja)}</small></div>
    <div class="call-av ringing">${sparkSVG(null,'hello')}</div>
    <div class="call-ring-tip">英語が苦手でも大丈夫。黙ったらヒントが出ます。<br>下の <b>💡</b> でいつでも訳と書き出しを見られます。</div>
    <div class="call-ring-btns"><button class="call-btn end" id="cl-no" aria-label="拒否"><svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 010-1.41C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 00-2.67-1.85.996.996 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg></button>
      <button class="call-btn ok" id="cl-yes" aria-label="応答"><svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/></svg></button></div></div>`;
  if(typeof sfx==='function')sfx('tap');
  document.getElementById('cl-no').onclick=()=>{callClose();callPick()};
  document.getElementById('cl-yes').onclick=()=>{if(typeof lxUnlock==='function')lxUnlock();callStart(t)};
}
function callStart(t){
  CL={t,i:0,t0:Date.now(),turns:[],ja:!!(typeof sjLv==='function'&&sjLv().hint),more:false,again:0,cur:null};
  const o=callOv();
  o.innerHTML=`<div class="call-bg"></div><div class="call-live">
    <div class="call-top"><span class="call-k" id="cl-time">00:00</span><b>${esc(typeof spkNick==='function'?spkNick():'Spark')}</b><small>${t.role?esc(t.role)+'役 · ':''}${t.ic} ${esc(t.ja)} · <span id="cl-n">1</span>/${t.turns.length}</small></div>
    <div class="call-av" id="cl-av">${sparkSVG(null,'hello')}</div>
    <div class="call-cap" id="cl-cap" aria-live="polite"></div>
    <div class="call-hint" id="cl-hint" hidden></div>
    <div class="call-me" id="cl-me"><div class="call-wave" id="cl-wave"><i></i><i></i><i></i><i></i><i></i></div><span id="cl-said"></span></div>
    <div class="call-ctl">
      <button class="call-c" id="cl-h" aria-label="ヒント"><span>💡</span><small>ヒント</small></button>
      <button class="call-c" id="cl-ja" aria-label="日本語訳"><span>あ</span><small>訳 ${CL.ja?'ON':'OFF'}</small></button>
      <button class="call-mic" id="cl-mic" aria-label="話し終わったらタップ">${ICONS.mic}</button>
      <button class="call-c" id="cl-rep" aria-label="もう一度聞く"><span>↻</span><small>もう一度</small></button>
      <button class="call-btn end sm" id="cl-end" aria-label="通話を終える"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 010-1.41C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 00-2.67-1.85.996.996 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg></button>
    </div></div>`;
  CL.tick=setInterval(()=>{const s=Math.floor((Date.now()-CL.t0)/1000),e=document.getElementById('cl-time');if(e)e.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')},500);
  document.getElementById('cl-end').onclick=()=>callFinish(true);
  document.getElementById('cl-h').onclick=()=>callHint(true);
  document.getElementById('cl-ja').onclick=e=>{CL.ja=!CL.ja;e.currentTarget.querySelector('small').textContent='訳 '+(CL.ja?'ON':'OFF');document.querySelectorAll('#cl-cap .call-ja').forEach(x=>x.hidden=!CL.ja)};
  document.getElementById('cl-rep').onclick=()=>{if(CL.busy)return;tkStopAll();const q=t.turns[CL.i];callSay([[q[0],q[1]]],callListen)};
  document.getElementById('cl-mic').onclick=()=>{if(tkRec){tkRec.stop();return}if(!CL.busy)callListen()};
  callAsk();
}
// Spark が話す：lines=[[英語, 訳, 種類]]。話している間はアバターが光る
function callSay(lines,then){
  if(!CL)return;CL.busy=true;clearTimeout(CL.hintT);
  const cap=document.getElementById('cl-cap'),av=document.getElementById('cl-av'),mic=document.getElementById('cl-mic');
  cap.innerHTML=lines.map(l=>`<div class="call-line${l[2]?' '+l[2]:''}"><b>${esc(l[0])}</b><span class="call-ja"${CL.ja?'':' hidden'}>${esc(l[1]||'')}</span></div>`).join('');
  av.classList.add('talk');mic.classList.remove('on');mic.disabled=true;
  document.getElementById('cl-said').textContent='';document.getElementById('cl-me').classList.remove('on');
  const done=()=>{if(!CL)return;CL.busy=false;av.classList.remove('talk');mic.disabled=false;then&&then()};
  const txt=lines.map(l=>({sp:'W',t:l[0]}));
  if(typeof lxSpeakLines==='function')lxSpeakLines(txt,{rate:callRate(),onend:done});
  else{speak(lines.map(l=>l[0]).join(' '),callRate());setTimeout(done,800+lines.map(l=>l[0]).join(' ').split(/\s+/).length*420/callRate())}
}
function callAsk(){
  const q=CL.t.turns[CL.i];CL.more=false;CL.again=0;CL.cur={q:q[0],said:'',lat:null};
  document.getElementById('cl-n').textContent=CL.i+1;
  const h=document.getElementById('cl-hint');h.hidden=true;
  callSay([[q[0],q[1]]],callListen);
}
function callHint(force){
  const q=CL.t.turns[CL.i],h=document.getElementById('cl-hint');if(!h)return;
  h.innerHTML=`<span class="call-hint-k">💡 こう言ってみて</span><b>${esc(q[2])}</b>${CL.ja?'':`<small>${esc(q[1])}</small>`}`;
  h.hidden=false;h.classList.remove('pop');void h.offsetWidth;h.classList.add('pop');
  if(force&&typeof sfx==='function')sfx('tap');
}
function callListen(){
  if(!CL||!TK_SR){if(CL&&!TK_SR){document.getElementById('cl-said').textContent='音声認識に未対応のブラウザです'}return}
  const mic=document.getElementById('cl-mic'),me=document.getElementById('cl-me'),said=document.getElementById('cl-said'),wave=document.getElementById('cl-wave');
  const t0=performance.now();let first=null,heardT=null;
  mic.classList.add('on');me.classList.add('on');said.textContent='Your turn…';
  clearTimeout(CL.hintT);CL.hintT=setTimeout(()=>{if(first==null)callHint()},7000);
  const h=tkListen({lang:'en-US',continuous:true,maxMs:25000,
    onInterim:t=>{if(first==null){first=(performance.now()-t0)/1000;clearTimeout(CL.hintT)}
      said.textContent=t;wave.classList.add('hear');clearTimeout(heardT);heardT=setTimeout(()=>wave.classList.remove('hear'),500);
      clearTimeout(CL.silT);CL.silT=setTimeout(()=>{if(tkRec)tkRec.stop()},2600)},
    onDone:(txt,meta)=>{clearTimeout(CL&&CL.silT);clearTimeout(CL&&CL.hintT);if(!CL)return;
      mic.classList.remove('on');wave.classList.remove('hear');
      txt=typeof sjDedupe==='function'?sjDedupe(txt):txt;
      if(!txt){
        if(meta.error){said.textContent=tkSrErrorMsg(meta.error);return}
        callHint();
        if(CL.again++<1)return callSay([CALL_AGAIN],callListen);
        said.textContent='🎤 を押して答えよう（ヒントを見ながらでOK）';return;
      }
      if(CL.cur.lat==null)CL.cur.lat=first==null?7:first;
      callAnswer(txt)},
    onError:c=>{mic.classList.remove('on');said.textContent=tkSrErrorMsg(c)}});
  if(!h){mic.classList.remove('on');said.textContent='🎤 を押して答えよう'}
}
function callAnswer(txt){
  const q=CL.t.turns[CL.i],cur=CL.cur;
  cur.said=(cur.said+' '+txt).trim();
  const toks=tkTokens(cur.said),words=toks.length;
  document.getElementById('cl-said').textContent=cur.said;
  // 一言だけなら1回だけ聞き返す
  if(words<3&&!CL.more){CL.more=true;return callSay([CALL_MORE],callListen)}
  const hits=q[3].filter(k=>toks.some(t=>t===k||tkStem(t)===tkStem(k))).length;
  const chk=tkCheck(cur.said,{speech:true}),bad=chk.issues.filter(i=>i.lv==='error'||i.lv==='better');
  const recast=chk.changed&&bad.length&&chk.fixed.length<=120;
  const rel=hits>=1||words>=5;
  const score=Math.min(100,(rel?50:20)+Math.min(25,words*3)+(bad.some(i=>i.lv==='error')?5:bad.length?15:25));
  Object.assign(cur,{words,hits,score,issues:bad.map(i=>i.ja),fixed:recast?chk.fixed:''});
  CL.turns.push(cur);
  if(recast)tkAddNote({said:cur.said,better:chk.fixed,ja:'',why:bad.map(i=>i.ja).slice(0,2).join(' / '),src:'Spark と英語通話'});
  if(typeof jpLog==='function')jpLog('speak',cur.lat<=(typeof sjLv==='function'?sjLv().sec:5)&&words>=3);
  const lines=[];
  if(recast)lines.push(["Got it! You can also say:","わかった！ こう言うともっと自然だよ：",''],[chk.fixed,bad[0].ja,'recast']);
  else {const RE=CL.t.us?CALL_REACT_US:CALL_REACT;lines.push([RE[Math.floor(Math.random()*RE.length)],rel?'':'（伝わったよ）'])}
  CL.i++;
  if(CL.i>=CL.t.turns.length){lines.push(CL.t.bye||CALL_BYE);return callSay(lines,()=>setTimeout(()=>callFinish(false),600))}
  const n=CL.t.turns[CL.i];lines.push([n[0],n[1]]);
  document.getElementById('cl-hint').hidden=true;
  CL.more=false;CL.again=0;CL.cur={q:n[0],said:'',lat:null};
  document.getElementById('cl-n').textContent=CL.i+1;
  callSay(lines,callListen);
}

/* ---------- 通話レポート ---------- */
function callFinish(early){
  const s=CL;if(!s)return;
  if(early&&s.cur&&s.cur.said&&!s.turns.includes(s.cur))s.turns.push({...s.cur,words:tkTokens(s.cur.said).length,score:40,issues:[],fixed:''});
  callClose();CL=null;
  if(!s.turns.length)return callPick();
  const sec=Math.round((Date.now()-s.t0)/1000),n=s.turns.length;
  const words=s.turns.reduce((a,x)=>a+(x.words||0),0),score=Math.round(s.turns.reduce((a,x)=>a+(x.score||0),0)/n);
  const lats=s.turns.map(x=>x.lat).filter(x=>x!=null),lat=lats.length?lats.reduce((a,x)=>a+x,0)/lats.length:null;
  const c=callData();c.hist.push({d:todayStr(),id:s.t.id,sec,score,words});if(c.hist.length>200)c.hist.shift();
  c.best[s.t.id]=Math.max(c.best[s.t.id]||0,score);commit();
  if(typeof talkLog==='function')talkLog('call',score,Math.min(sec,900));
  if(typeof XP_TABLE!=='undefined'&&XP_TABLE.speak_call==null)XP_TABLE.speak_call=25;
  addXP('speak_call');if(typeof spkCoin==='function')spkCoin(15,'Spark と英語通話');
  if(score>=80)launchConfetti();
  const fixes=s.turns.filter(x=>x.fixed);
  const el=tkScreen();
  el.innerHTML=tkBack('通話レポート')+`<div class="tk-act call-rep">
      <div class="call-rep-h"><div class="call-rep-av">${sparkSVG(null,score>=70?'win':'cheer')}</div><div><div class="call-k2">${s.t.ic} ${esc(s.t.ja)}</div><b>${score>=85?'Amazing call!':score>=65?'Great job!':'Nice try!'}</b><small>${score>=65?'ちゃんと会話が続きました。':'話せたことが一番の前進です。'}</small></div>${tkRing(score,84)}</div>
      <div class="sj-metrics">
        <div class="sj-m ok"><b>${Math.floor(sec/60)}<small>分</small>${sec%60}<small>秒</small></b><span>通話時間</span></div>
        <div class="sj-m ${words>=n*6?'ok':'mid'}"><b>${words}<small>語</small></b><span>話した語数</span></div>
        <div class="sj-m ${lat!=null&&lat<=5?'ok':'mid'}"><b>${lat==null?'—':lat.toFixed(1)}<small>秒</small></b><span>話し出す<br>まで（平均）</span></div></div></div>
    ${fixes.length?`<div class="sec-title">🇯🇵 日本人のクセ：言い直し</div>${fixes.map(x=>`<div class="card call-fix"><div class="call-fix-s">${esc(x.said)}</div><div class="call-fix-b">→ <b>${esc(x.fixed)}</b>${tkSayBtn(x.fixed,0.85)}</div><small>${esc(x.issues.join(' / '))}</small></div>`).join('')}<div class="tk-note">言い直しは「表現ノート」に保存しました。数日後に言い直しドリルで出ます。</div>`
      :`<div class="card call-fix"><b>✨ 文法のクセは見つかりませんでした</b><small>次は1つの答えに「理由」や「例」を1文足すと、もっと会話らしくなります。</small></div>`}
    <div class="sec-title">🗣 あなたが話したこと</div>
    ${s.turns.map(x=>`<div class="card call-log"><small>${esc(x.q)}</small><div>${esc(x.said||'—')}</div></div>`).join('')}
    ${inDaySession()?sessionNavHTML():`<div class="tk-fb-btns"><button class="btn btn-secondary" id="cl-other">別の話題</button><button class="btn btn-gold" id="cl-again">もう一度かける ${ICONS.arrowRight}</button></div>`}`;
  tkBindBack(callPick);tkBindSay(el);
  const a=document.getElementById('cl-again');if(a){a.onclick=()=>callRing(s.t.id);document.getElementById('cl-other').onclick=callPick}
  window.scrollTo(0,0);
}

/* ---------- 入口 ---------- */
function callInstall(){
  // 毎日のメニュー：土曜の「英会話ロールプレイ」枠を通話に（量は変えない）
  if(typeof P6_TASKS!=='undefined'&&typeof p6MenuFor==='function'){
    P6_TASKS.call={t:'Spark と英語通話',sub:'日本のことを英語で紹介する（約3分）',m:5};
    const _mf=p6MenuFor;p6MenuFor=function(date){const r=_mf.apply(this,arguments);if(date&&date.getDay()===6)r.list=r.list.map(a=>a==='talk'?'call':a);return r};
  }
  const _pta=planTaskAction;planTaskAction=function(a){if(a==='call')return callPick();return _pta.apply(this,arguments)};
  const card=id=>`<button class="call-entry" id="${id}"><span class="call-entry-av">${sparkSVG(null,'hello')}<i></i></span><span class="call-entry-b"><span class="call-k2">VIDEO CALL</span><b>Spark と英語通話</b><small>日本のことを英語で話そう · 黙ってもヒントが出る</small></span><span class="call-entry-go"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/></svg></span></button>`;
  // Talk タブの先頭
  if(typeof renderTalkHub==='function'){const _th=renderTalkHub;renderTalkHub=function(){const r=_th.apply(this,arguments);const el=document.getElementById('screen-talk'),modes=el&&el.querySelector('.tk-modes');
    if(modes&&!el.querySelector('#call-talk')){modes.insertAdjacentHTML('beforebegin',card('call-talk'));document.getElementById('call-talk').onclick=callPick}return r}}
  // ホーム：話すジムの下
  if(typeof renderHome==='function'){const _rh=renderHome;renderHome=function(){const r=_rh.apply(this,arguments);const home=document.getElementById('screen-home');
    const after=home&&(home.querySelector('#sj-home-card')||home.querySelector('#jp-home')||home.querySelector('.focus-card'));
    if(after&&!home.querySelector('#call-home')){after.insertAdjacentHTML('afterend',card('call-home'));document.getElementById('call-home').onclick=callPick}return r}}
  if(typeof PLAN_ROWS!=='undefined'&&!PLAN_ROWS.some(r=>r[0].startsWith('Spark と英語通話')))PLAN_ROWS.splice(3,0,['Spark と英語通話（日本を英語で紹介）','○','○']);
}
if(typeof go==='function'){callInstall();if(typeof curTab!=='undefined'&&curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome()}
