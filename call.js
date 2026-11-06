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
// 速さ：通話画面で切り替えた値 → 話すジムのレベル → 既定
const CL_SPEEDS=[[0.8,'ゆっくり'],[0.92,'ふつう'],[1,'ナチュラル']];
function callRate(){const c=callData();if(c.rate)return c.rate;return typeof sjLv==='function'?sjLv().rate:(talkData().rate||0.92)}
const CL_ANDROID=/Android/i.test(navigator.userAgent);
const CL_IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
// iOS 17+：話す間は「再生」、聞く間は「録音」に切り替える（マイクのあと声が小さくなる・受話口から出るのを防ぐ）
function clAudio(type){try{if(navigator.audioSession)navigator.audioSession.type=type}catch(e){}}
const CL_IC={
  bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  kb:'<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6.5 14h11"/>',
  rep:'<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4.5h4.5"/>',
  cc:'<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M10.5 10.2a2.4 2.4 0 1 0 0 3.6M17 10.2a2.4 2.4 0 1 0 0 3.6"/>',
  ja:'<path d="M4 6h9M8.5 4v2M6 6c0 4 3 7 7 8M11 6c-.5 4-3.5 7.5-7 9"/><path d="M14 20l3.5-9 3.5 9M15.2 17h4.6"/>',
  speed:'<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-5"/>',
  send:'<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  redo:'<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4.5h-4.5"/>',
  shuffle:'<path d="M3 7h3.5c4 0 6 10 10 10H21M3 17h3.5c1.6 0 2.8-1.6 3.8-3.5M14 9.5c.9-1.4 1.9-2.5 3.5-2.5H21"/><path d="M18.5 4.5L21 7l-2.5 2.5M18.5 14.5L21 17l-2.5 2.5"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>'
};
const clI=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CL_IC[k]}</svg>`;
const CL_PH_END='<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 010-1.41C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 00-2.67-1.85.996.996 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>';
const CL_PH_OK='<svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>';
function callCalledToday(){return callData().hist.some(h=>h.d===todayStr())}

/* ---------- 話題を選ぶ ---------- */
function callPick(){
  tkStopAll();const el=tkScreen(),c=callData(),us=(c.tab||((PROG.jpGoals||[]).includes('live')?'us':'jp'))==='us',list=us?CALL_US:CALL_TOPICS;
  const mins=Math.round(c.hist.reduce((a,x)=>a+x.sec,0)/60),days=new Set(c.hist.map(h=>h.d)).size;
  el.innerHTML=tkBack('Spark と英語通話')+`
    <div class="call-hero"><div class="call-hero-av">${sparkSVG(null,'hello')}<i></i></div>
      <div class="call-hero-b"><span class="call-hero-k">VOICE CALL · ${us?'LIFE IN THE US':'TALK ABOUT JAPAN'}</span><b>${us?'アメリカで、困らずに暮らす':'日本のことを、英語で話そう'}</b>
      <small>${us?'Spark が大家さん・銀行員・お医者さんなどの役に。生活の場面を本番の前に練習。':'日本に来る友だち（Spark）から電話。聞かれて詰まりがちな「日本の説明」を練習。'}</small></div></div>
    ${c.hist.length?`<div class="call-stats"><div><b>${c.hist.length}</b><span>通話</span></div><div><b>${mins}</b><span>分</span></div><div><b>${days}</b><span>日</span></div><div><b>${Object.keys(c.best).length}</b><span>/${CALL_ALL.length} 話題</span></div></div>`:''}
    <div class="tk-seg call-tabs" role="tablist"><button data-tab="jp" class="${us?'':'on'}">🇯🇵 日本を紹介</button><button data-tab="us" class="${us?'on':''}">🇺🇸 アメリカ生活</button></div>
    <button class="call-random" id="cl-rand"><span>${clI('shuffle')}</span><span><b>おまかせで着信</b><small>話題はかかってきてからのお楽しみ</small></span>${ICONS.arrowRight}</button>
    <div class="call-grid">${list.map(t=>{const b=c.best[t.id];return`<button class="call-topic${b!=null?' done':''}" data-ct="${t.id}"><span class="call-topic-ic">${t.ic}</span><b>${t.ja}</b><small>${t.role?'相手：'+t.role+' · ':''}${t.sub}</small><span class="call-topic-m">${b!=null?`<i class="tk-best ${b>=80?'hi':b>=60?'mid':'lo'}">ベスト ${b}</i>`:'4ターン · 約3分'}</span></button>`}).join('')}</div>
    <div class="tk-note call-howto"><b>通話のコツ</b>・Spark の質問が終わると自動でマイクがオンになります<br>・話している途中でもマイクをタップすると割り込めます<br>・声が出せない場所では <b>キーボード</b> で答えられます</div>
    ${TK_SR?'':`<div class="tk-warn">このブラウザは音声認識に未対応です。キーボードで答える通話になります（Chrome / Safari なら声で話せます）。</div>`}`;
  tkBindBack(renderTalkHub);
  el.querySelectorAll('[data-ct]').forEach(b=>b.onclick=()=>callRing(b.dataset.ct));
  document.getElementById('cl-rand').onclick=()=>{const fresh=list.filter(t=>c.best[t.id]==null),pool=fresh.length?fresh:list;callRing(pool[Math.floor(Math.random()*pool.length)].id,true)};
  el.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{c.tab=b.dataset.tab;commit();sfx('tap');callPick()});
  window.scrollTo(0,0);
}

/* ---------- 着信音（端末内で合成・$0） ---------- */
// 振動は、ユーザーが一度でも画面に触れたあとだけ（触れる前はブラウザが拒否してエラーを出す）
function clVib(p){try{if(navigator.vibrate&&(!navigator.userActivation||navigator.userActivation.hasBeenActive))navigator.vibrate(p)}catch(e){}}
let clRingT=null;
function clRingStart(){
  clRingStop();
  const muted=localStorage.getItem('sparkle_mute')==='1';
  const burst=()=>{
    if(!muted&&typeof ac==='function'){const c=ac();if(c){try{if(c.state==='suspended')c.resume();const t=c.currentTime;
      for(let k=0;k<2;k++){const t0=t+k*0.5,g=c.createGain();g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(0.07,t0+0.02);g.gain.setValueAtTime(0.07,t0+0.38);g.gain.linearRampToValueAtTime(0,t0+0.42);g.connect(c.destination);
        [880,1046].forEach(f=>{const o=c.createOscillator();o.type='sine';o.frequency.value=f;o.connect(g);o.start(t0);o.stop(t0+0.44)})}}catch(e){}}}
    try{clVib([350,150,350])}catch(e){}
  };
  burst();let n=0;clRingT=setInterval(()=>{if(++n>9)return clRingStop();burst()},2600);
}
function clRingStop(){clearInterval(clRingT);clRingT=null;try{clVib(0)}catch(e){}}

/* ---------- 通話画面 ---------- */
let CL=null;
function callOv(){let o=document.getElementById('call-ov');if(!o){o=document.createElement('div');o.id='call-ov';o.setAttribute('role','dialog');o.setAttribute('aria-label','Spark と英語通話');document.body.appendChild(o)}document.body.classList.add('call-open');return o}
function clStopVoice(){if(CL&&CL.sp){CL.sp.cancel();CL.sp=null}tkStopAll();if('speechSynthesis'in window)try{speechSynthesis.cancel()}catch(e){}}
function callClose(){
  clRingStop();
  if(CL){clearInterval(CL.tick);['hintT','silT','waitT','kbT'].forEach(k=>clearTimeout(CL[k]));CL.ls=null}
  clStopVoice();clAudio('auto');
  const o=document.getElementById('call-ov');if(o)o.remove();document.body.classList.remove('call-open');
}
// 着信画面
function callRing(id,surprise){
  const t=CALL_ALL.find(x=>x.id===id);if(!t)return;
  const o=callOv();
  o.innerHTML=`<div class="call-bg"></div><div class="call-ring">
    <div class="call-top"><span class="call-k">INCOMING CALL · 着信中</span><b>${esc(typeof spkNick==='function'?spkNick():'Spark')}</b><small>${surprise?'話題：おまかせ':(t.role?esc(t.role)+'役 · ':'話題：')+`${t.ic} ${esc(t.ja)}`}</small></div>
    <div class="call-av-wrap ringing"><span class="call-halo"></span><span class="call-halo d2"></span><div class="call-av">${sparkSVG(null,'hello')}</div></div>
    <div class="call-ring-tip">英語が苦手でも大丈夫。<br>黙るとヒントが出て、<b>キーボード</b>でも答えられます。</div>
    <div class="call-ring-btns">
      <div class="call-ring-b"><button class="call-btn end" id="cl-no" aria-label="拒否">${CL_PH_END}</button><small>拒否</small></div>
      <div class="call-ring-b"><button class="call-btn ok" id="cl-yes" aria-label="応答">${CL_PH_OK}</button><small>応答</small></div></div></div>`;
  clRingStart();
  document.getElementById('cl-no').onclick=()=>{callClose();callPick()};
  document.getElementById('cl-yes').onclick=()=>{
    clRingStop();
    // 応答のタップ＝ユーザー操作。この中で音声の再生を解禁しておく（iOS は操作なしだと話さない）
    if(typeof lxUnlock==='function')lxUnlock();
    try{const c=typeof ac==='function'&&ac();if(c&&c.state==='suspended')c.resume()}catch(e){}
    callStart(t);
  };
}
function callStart(t){
  const c=callData();
  CL={t,i:0,t0:Date.now(),turns:[],ja:c.ja!=null?c.ja:!!(typeof sjLv==='function'&&sjLv().hint),cc:c.cc!==false,
    auto:true,kb:!TK_SR,micFails:0,silence:0,more:false,again:0,cur:null,last:null,rep:0,hints:0,state:'',sp:null,ls:null};
  const o=callOv();
  o.innerHTML=`<div class="call-bg"></div><div class="call-live">
    <div class="call-top"><span class="call-k" id="cl-time">00:00</span><b>${esc(typeof spkNick==='function'?spkNick():'Spark')}</b>
      <small>${t.role?esc(t.role)+'役 · ':''}${t.ic} ${esc(t.ja)}</small>
      <div class="call-steps" aria-label="進み具合">${t.turns.map((_,k)=>`<i data-k="${k}"></i>`).join('')}</div></div>
    <div class="call-av-wrap" id="cl-avw"><span class="call-halo"></span><span class="call-halo d2"></span><div class="call-av" id="cl-av">${sparkSVG(null,'hello')}</div></div>
    <div class="call-cap" id="cl-cap" aria-live="polite"></div>
    <div class="call-hint" id="cl-hint" hidden></div>
    <div class="call-dock">
      <div class="call-state" id="cl-st"><span class="call-dot"></span><span id="cl-st-t">接続中…</span></div>
      <div class="call-me" id="cl-me"><div class="call-wave" id="cl-wave"><i></i><i></i><i></i><i></i><i></i></div><span id="cl-said"></span>
        <button class="call-redo" id="cl-redo" hidden aria-label="言い直す">${clI('redo')}</button></div>
      <form class="call-kb" id="cl-kb" hidden><input id="cl-kb-in" type="text" autocomplete="off" autocapitalize="sentences" enterkeyhint="send" placeholder="英語で答えを入力…" aria-label="英語で答えを入力"><button type="submit" aria-label="送信">${clI('send')}</button></form>
      <div class="call-pills">
        <button id="cl-cc" class="${CL.cc?'on':''}">${clI('cc')}<span>字幕</span></button>
        <button id="cl-ja" class="${CL.ja?'on':''}">${clI('ja')}<span>訳</span></button>
        <button id="cl-sp">${clI('speed')}<span id="cl-sp-t">${(CL_SPEEDS.find(s=>s[0]===callRate())||[0,'ふつう'])[1]}</span></button>
      </div>
      <div class="call-ctl">
        <button class="call-c" id="cl-h">${clI('bulb')}<small>ヒント</small></button>
        <button class="call-c" id="cl-kbb">${clI('kb')}<small>キーボード</small></button>
        <button class="call-mic" id="cl-mic" aria-label="マイク">${clI('mic')}</button>
        <button class="call-c" id="cl-rep">${clI('rep')}<small id="cl-rep-t">もう一度</small></button>
        <button class="call-btn end sm" id="cl-end" aria-label="通話を終える">${CL_PH_END}</button>
      </div>
    </div></div>`;
  CL.tick=setInterval(()=>{const s=Math.floor((Date.now()-CL.t0)/1000),e=document.getElementById('cl-time');if(e)e.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')},500);
  const $=id=>document.getElementById(id);
  $('cl-end').onclick=()=>callFinish(true);
  $('cl-h').onclick=()=>{CL.hints++;callHint(true)};
  $('cl-ja').onclick=e=>{CL.ja=!CL.ja;c.ja=CL.ja;commit();e.currentTarget.classList.toggle('on',CL.ja);document.querySelectorAll('#cl-cap .call-ja').forEach(x=>x.hidden=!CL.ja)};
  $('cl-cc').onclick=e=>{CL.cc=!CL.cc;c.cc=CL.cc;commit();e.currentTarget.classList.toggle('on',CL.cc);$('cl-cap').classList.toggle('nocc',!CL.cc)};
  $('cl-sp').onclick=()=>{const cur=callRate(),k=CL_SPEEDS.findIndex(s=>s[0]===cur),n=CL_SPEEDS[(k+1)%CL_SPEEDS.length];c.rate=n[0];commit();$('cl-sp-t').textContent=n[1];sfx('tap')};
  $('cl-rep').onclick=()=>{if(!CL.last)return;CL.rep++;const slow=CL.rep>=2;callSay(CL.last,clAfterSpeak,{slow});$('cl-rep-t').textContent=slow?'ゆっくり':'もう一度'};
  $('cl-kbb').onclick=()=>clKb(!CL.kb,true);
  $('cl-mic').onclick=clMicTap;
  $('cl-redo').onclick=()=>{if(!CL)return;tkStopAll();CL.cur.said='';$('cl-said').textContent='';$('cl-redo').hidden=true;clListen(true)};
  $('cl-cap').onclick=e=>{const l=e.target.closest('.call-line');if(l&&!CL.cc)l.classList.toggle('peek')};
  $('cl-kb').onsubmit=e=>{e.preventDefault();const v=$('cl-kb-in').value.trim();if(!v||!CL||CL.state==='speak')return;$('cl-kb-in').value='';clSubmit(v,true)};
  $('cl-kb-in').oninput=()=>{if(CL&&CL.cur&&CL.cur.lat==null)CL.cur.lat=(performance.now()-CL.cur.t)/1000;clearTimeout(CL.hintT)};
  $('cl-cap').classList.toggle('nocc',!CL.cc);
  if(CL.kb)clKb(true,false);
  callAsk();
}
// 状態の表示：speak（Spark が話す）・listen（聞いている）・tap（タップ待ち）・type（キーボード）・think
function clState(s,msg){
  if(!CL)return;CL.state=s;
  const st=document.getElementById('cl-st'),t=document.getElementById('cl-st-t'),mic=document.getElementById('cl-mic'),avw=document.getElementById('cl-avw'),me=document.getElementById('cl-me');
  if(!st)return;
  st.dataset.s=s;mic.dataset.s=s;avw.classList.toggle('talk',s==='speak');avw.classList.toggle('listen',s==='listen');me.classList.toggle('on',s==='listen'||s==='type');
  const said=!!(CL.cur&&CL.cur.said);
  t.textContent=msg||({speak:'Spark が話しています · マイクで割り込めます',listen:said?'聞いています… 話し終えたら ✓ で送信':'あなたの番です · 英語で話してください',tap:'マイクをタップして話してください',type:'キーボードで答えを入力してください',think:'…'})[s]||'';
  mic.innerHTML=s==='listen'&&said?clI('check'):clI('mic');
  mic.setAttribute('aria-label',s==='speak'?'割り込んで話す':s==='listen'?(said?'送信する':'話すのをやめる'):'話す');
}
// Spark が話す：lines=[[英語, 訳, 種類]]。字幕は話している単語まで明るくなる
function callSay(lines,then,opt){
  if(!CL)return;opt=opt||{};
  clearTimeout(CL.hintT);clearTimeout(CL.silT);clearTimeout(CL.waitT);CL.ls=null;tkStopAll();if(CL.sp)CL.sp.cancel();
  CL.last=lines;
  const cap=document.getElementById('cl-cap');
  cap.innerHTML=lines.map(l=>{let ci=0;const ws=l[0].split(/(\s+)/).map(w=>{const s=ci;ci+=w.length;return /\S/.test(w)?`<span data-c="${s}">${esc(w)}</span>`:w}).join('');
    return `<div class="call-line${l[2]?' '+l[2]:''}"><b>${ws}</b><span class="call-ja"${CL.ja?'':' hidden'}>${esc(l[1]||'')}</span></div>`}).join('')+(CL.cc?'':'<div class="call-cc-off">字幕オフ · タップで表示</div>');
  cap.classList.remove('in');void cap.offsetWidth;cap.classList.add('in');
  document.getElementById('cl-said').textContent='';document.getElementById('cl-redo').hidden=true;
  clState('speak');clAudio('playback');
  const els=[...cap.querySelectorAll('.call-line')];
  const rate=callRate()*(opt.slow?0.8:1);
  CL.sp=clSpeak(lines.map(l=>l[0]),{rate,
    onWord:(i,ci)=>{const b=els[i]&&els[i].querySelector('b');if(!b)return;els.forEach((e,k)=>k<i&&e.classList.add('said'));b.parentNode.classList.add('kara');b.querySelectorAll('span').forEach(s=>s.classList.toggle('lit',+s.dataset.c<=ci))},
    onLine:i=>els.forEach((e,k)=>{if(k<i)e.classList.add('said')}),
    onend:()=>{if(!CL)return;CL.sp=null;CL.state='idle';els.forEach(e=>{e.classList.add('said');e.querySelectorAll('span[data-c]').forEach(s=>s.classList.add('lit'))});then&&then()}});
}
// 端末の読み上げ。onend が来ない・途中で止まる端末があるので、状態の見張りと時間の保険で必ず1回だけ終わらせる
function clSpeak(texts,o){
  let fired=false,started=false,idle=0,poll=0,cap=0,go=0;const t0=performance.now();
  const stop=()=>{clearInterval(poll);clearTimeout(cap);clearTimeout(go)};
  const finish=()=>{if(fired)return;fired=true;stop();o.onend&&o.onend()};
  const ctl={cancel(){fired=true;stop();try{speechSynthesis.cancel()}catch(e){}}};
  if(!('speechSynthesis'in window)||!texts.length){setTimeout(finish,300);return ctl}
  try{speechSynthesis.cancel()}catch(e){}
  const r=typeof listenRate==='function'?listenRate(o.rate):o.rate;
  // cancel の直後に speak すると捨てられる端末があるので少し待つ
  go=setTimeout(()=>{if(fired)return;
    texts.forEach((tx,i)=>{const u=new SpeechSynthesisUtterance(tx);u.lang='en-US';u.rate=r;const v=typeof pickVoice==='function'&&pickVoice('female');if(v)u.voice=v;
      u.onstart=()=>{started=true;o.onLine&&o.onLine(i)};
      u.onboundary=e=>{if(!e.name||e.name==='word')o.onWord&&o.onWord(i,e.charIndex)};
      if(i===texts.length-1){u.onend=()=>setTimeout(finish,120);u.onerror=e=>{if(e&&e.error==='interrupted'||e&&e.error==='canceled')return;finish()}}
      try{speechSynthesis.speak(u)}catch(e){finish()}});
    if(speechSynthesis.paused)try{speechSynthesis.resume()}catch(e){}
  },CL_ANDROID?150:60);
  poll=setInterval(()=>{
    if(speechSynthesis.speaking||speechSynthesis.pending){started=true;idle=0;return}
    if(started||performance.now()-t0>3000){idle+=250;if(idle>=750)finish()}
  },250);
  const words=texts.join(' ').split(/\s+/).length;
  cap=setTimeout(finish,words/(1.7*r)*1000+texts.length*900+4000);
  return ctl;
}
function clAfterSpeak(){
  if(!CL)return;
  if(CL.cur&&!CL.cur.said&&CL.cur.lat==null)CL.cur.t=performance.now();
  if(CL.kb)return clState('type');
  if(!TK_SR)return clKb(true,false);
  if(!CL.auto)return clState('tap');
  // スピーカーの残響を拾わないよう、少し間をあけてからマイクを開く
  clearTimeout(CL.waitT);CL.waitT=setTimeout(()=>clListen(false),350);
}
function callAsk(){
  const q=CL.t.turns[CL.i];CL.more=false;CL.again=0;CL.rep=0;CL.silence=0;CL.cur={q:q[0],said:'',lat:null,t:performance.now(),typed:false};
  clSteps();
  const h=document.getElementById('cl-hint');h.hidden=true;
  callSay([[q[0],q[1]]],clAfterSpeak);
}
function clSteps(){document.querySelectorAll('.call-steps i').forEach(e=>{const k=+e.dataset.k;e.className=k<CL.i?'done':k===CL.i?'on':''})}
function callHint(force){
  if(!CL)return;const q=CL.t.turns[CL.i],h=document.getElementById('cl-hint');if(!h||!q)return;
  h.innerHTML=`<span class="call-hint-k">${clI('bulb')} こう言ってみて</span><b>${esc(q[2])}</b>${CL.ja?'':`<small>${esc(q[1])}</small>`}`;
  h.hidden=false;h.classList.remove('pop');void h.offsetWidth;h.classList.add('pop');
  if(force&&typeof sfx==='function')sfx('tap');
}
function clKb(on,user,noListen){
  if(!CL)return;CL.kb=on;
  const f=document.getElementById('cl-kb'),b=document.getElementById('cl-kbb');if(!f)return;
  f.hidden=!on;b.classList.toggle('on',on);document.getElementById('cl-me').hidden=on;
  if(on){CL.ls=null;tkStopAll();clearTimeout(CL.waitT);if(CL.state!=='speak')clState('type');if(user)setTimeout(()=>{const i=document.getElementById('cl-kb-in');i&&i.focus()},50)}
  else if(!noListen&&CL.state!=='speak'){if(TK_SR){CL.auto=true;clListen(!!user)}else clKb(true,false)}
}
function clMicTap(){
  if(!CL)return;
  if(CL.kb){if(!TK_SR)return;clKb(false,false,true)}
  if(CL.state==='speak'){if(CL.sp)CL.sp.cancel();CL.sp=null;try{speechSynthesis.cancel()}catch(e){}document.querySelectorAll('#cl-cap .call-line').forEach(e=>e.classList.add('said'));return clListen(true)}
  if(CL.state==='listen'){
    if(!CL.cur.said){CL.ls=null;tkStopAll();CL.auto=false;return clState('tap','一時停止中 · マイクをタップで再開')}
    if(tkRec){CL.submitNow=true;tkRec.stop()}else clSubmit(CL.cur.said,false);return}
  CL.auto=true;clListen(true);
}
// マイクで聞く。byTap＝ユーザーのタップで始めた（iOS はこれでないと開けないことがある）
function clListen(byTap){
  if(!CL||CL.state==='speak'&&!byTap)return;
  if(CL.kb)return clState('type');
  if(!TK_SR)return clKb(true,false);
  clearTimeout(CL.hintT);clearTimeout(CL.silT);
  const said=document.getElementById('cl-said'),wave=document.getElementById('cl-wave'),redo=document.getElementById('cl-redo');
  const sess={t0:performance.now(),first:null,heardT:null,byTap};CL.ls=sess;CL.submitNow=false;
  const silMs=(typeof sjLv==='function'&&sjLv().sec>=8)?3200:2600;
  clAudio('play-and-record');clState('listen');
  if(!CL.cur.said)said.textContent='';
  CL.hintT=setTimeout(()=>{if(CL&&CL.ls===sess&&sess.first==null&&!CL.cur.said)callHint()},7000);
  const base=CL.cur.said;
  const h=tkListen({lang:'en-US',continuous:!CL_ANDROID,maxMs:CL_ANDROID?15000:30000,
    onInterim:t=>{if(!CL||CL.ls!==sess)return;
      if(sess.first==null){sess.first=(performance.now()-sess.t0)/1000;clearTimeout(CL.hintT);if(CL.cur.lat==null)CL.cur.lat=(performance.now()-CL.cur.t)/1000}
      CL.cur.said=(base+' '+t).trim();said.textContent=CL.cur.said;redo.hidden=false;if(CL.state==='listen')clState('listen');
      wave.classList.add('hear');clearTimeout(sess.heardT);sess.heardT=setTimeout(()=>wave.classList.remove('hear'),500);
      if(!CL_ANDROID){clearTimeout(CL.silT);CL.silT=setTimeout(()=>{if(CL&&CL.ls===sess&&tkRec)tkRec.stop()},silMs)}},
    onDone:(txt,meta)=>{if(!CL||CL.ls!==sess)return;clearTimeout(CL.silT);clearTimeout(CL.hintT);CL.ls=null;wave.classList.remove('hear');
      txt=typeof sjDedupe==='function'?sjDedupe(txt):txt;
      const all=(base+' '+(txt||'')).trim();
      if(meta.error&&!txt)return clMicFail(meta.error,sess.byTap,all);
      if(!txt&&!base){
        // Android は数秒黙ると自動で止まる。通話開始から短ければ静かにもう一度開く
        if(CL_ANDROID&&!CL.submitNow&&(CL.cur.retries=(CL.cur.retries||0)+1)<=1)return clListen(sess.byTap);
        return clSilent();
      }
      CL.micFails=0;
      clSubmit(all,false)},
    onError:code=>{if(!CL||CL.ls!==sess)return;CL.ls=null;clMicFail(code,sess.byTap,base)}});
  if(!h&&CL&&CL.ls===sess){CL.ls=null;clMicFail('start',byTap,base)}
}
function clSilent(){
  if(!CL)return;CL.silence++;callHint();
  if(CL.silence===1)return callSay([["Take your time. You can start with the words on the screen.","ゆっくりで大丈夫。画面の言い出しから始めてみて。"]],clAfterSpeak);
  CL.auto=false;clState('tap','準備ができたらマイクをタップ（キーボードでもOK）');
}
// マイクが使えないとき：まずタップで開き直す → だめならキーボードに切り替えて、通話は続ける
function clMicFail(code,byTap,keep){
  if(!CL)return;CL.micFails++;
  if(keep){CL.cur.said=keep;document.getElementById('cl-said').textContent=keep}
  const msg=typeof tkSrErrorMsg==='function'?tkSrErrorMsg(code==='service-not-allowed'?'not-allowed':code):'';
  const hard=code==='network'||code==='audio-capture'||code==='unsupported'||((code==='not-allowed'||code==='service-not-allowed')&&byTap)||CL.micFails>=3;
  if(hard){clKb(true,false);clState('type',(code==='network'?'音声認識はネット接続が必要です。':'マイクが使えないため、')+'キーボードで続けましょう');return}
  CL.auto=false;clState('tap',code==='start'||code==='not-allowed'||code==='service-not-allowed'?'マイクをタップして話してください':msg||'マイクをタップしてもう一度');
}
function clSubmit(txt,typed){
  if(!CL)return;
  if(typed&&CL.more&&CL.cur.said)txt=CL.cur.said+' '+txt;
  CL.cur.said=txt;if(typed){CL.cur.typed=true;if(CL.cur.lat==null)CL.cur.lat=(performance.now()-CL.cur.t)/1000}
  document.getElementById('cl-said').textContent=txt;document.getElementById('cl-redo').hidden=true;
  clState('think');
  callAnswer(txt);
}
function callAnswer(){
  const q=CL.t.turns[CL.i],cur=CL.cur;
  const toks=tkTokens(cur.said),words=toks.length;
  // 一言だけなら1回だけ聞き返す（続けて話した分は前の答えに足す）
  if(words<3&&!CL.more){CL.more=true;return callSay([CALL_MORE],clAfterSpeak)}
  const hits=q[3].filter(k=>toks.some(t=>t===k||tkStem(t)===tkStem(k))).length;
  const chk=tkCheck(cur.said,{speech:true}),bad=chk.issues.filter(i=>i.lv==='error'||i.lv==='better');
  const recast=chk.changed&&bad.length&&chk.fixed.length<=120;
  const rel=hits>=1||words>=5;
  const score=Math.min(100,(rel?50:20)+Math.min(25,words*3)+(bad.some(i=>i.lv==='error')?5:bad.length?15:25));
  Object.assign(cur,{words,hits,score,issues:bad.map(i=>i.ja),fixed:recast?chk.fixed:''});
  CL.turns.push(cur);
  if(recast)tkAddNote({said:cur.said,better:chk.fixed,ja:'',why:bad.map(i=>i.ja).slice(0,2).join(' / '),src:'Spark と英語通話'});
  if(typeof jpLog==='function'&&!cur.typed)jpLog('speak',cur.lat!=null&&cur.lat<=(typeof sjLv==='function'?sjLv().sec:5)&&words>=3);
  const lines=[];
  if(recast)lines.push(["Got it! You can also say:","わかった！ こう言うともっと自然だよ：",''],[chk.fixed,bad[0].ja,'recast']);
  else {const RE=CL.t.us?CALL_REACT_US:CALL_REACT;lines.push([RE[Math.floor(Math.random()*RE.length)],rel?'':'（伝わったよ）'])}
  CL.i++;
  if(CL.i>=CL.t.turns.length){clSteps();lines.push(CL.t.bye||CALL_BYE);return callSay(lines,()=>setTimeout(()=>callFinish(false),700))}
  const n=CL.t.turns[CL.i];lines.push([n[0],n[1]]);
  document.getElementById('cl-hint').hidden=true;
  CL.more=false;CL.again=0;CL.rep=0;CL.silence=0;CL.cur={q:n[0],said:'',lat:null,t:0,typed:false};
  clSteps();document.getElementById('cl-rep-t').textContent='もう一度';
  callSay(lines,clAfterSpeak);
}
// 画面を離れたら（アプリ切り替え・ロック）マイクと声を止め、戻ったらタップで再開
document.addEventListener('visibilitychange',()=>{if(document.hidden&&CL&&document.getElementById('cl-mic')){clearTimeout(CL.waitT);CL.ls=null;clStopVoice();CL.auto=false;clState(CL.kb?'type':'tap','一時停止中 · マイクをタップで再開')}});

/* ---------- 通話レポート ---------- */
function callFinish(early){
  const s=CL;if(!s)return;
  if(early&&s.cur&&s.cur.said&&!s.turns.includes(s.cur))s.turns.push({...s.cur,words:tkTokens(s.cur.said).length,score:40,issues:[],fixed:''});
  callClose();CL=null;
  if(!s.turns.length)return callPick();
  const sec=Math.round((Date.now()-s.t0)/1000),n=s.turns.length;
  const words=s.turns.reduce((a,x)=>a+(x.words||0),0),score=Math.round(s.turns.reduce((a,x)=>a+(x.score||0),0)/n);
  const lats=s.turns.filter(x=>!x.typed).map(x=>x.lat).filter(x=>x!=null),lat=lats.length?lats.reduce((a,x)=>a+x,0)/lats.length:null;
  const c=callData(),prev=c.best[s.t.id];c.hist.push({d:todayStr(),id:s.t.id,sec,score,words});if(c.hist.length>200)c.hist.shift();
  c.best[s.t.id]=Math.max(c.best[s.t.id]||0,score);commit();
  if(typeof talkLog==='function')talkLog('call',score,Math.min(sec,900));
  if(typeof XP_TABLE!=='undefined'&&XP_TABLE.speak_call==null)XP_TABLE.speak_call=25;
  addXP('speak_call');if(typeof spkCoin==='function')spkCoin(15,'Spark と英語通話');
  if(score>=80)launchConfetti();
  const fixes=s.turns.filter(x=>x.fixed),typed=s.turns.filter(x=>x.typed).length;
  const tip=lat!=null&&lat>6?'話し出しが遅れがち。まず “Well,” “Let me see,” と言ってから考えると、会話が止まりません。'
    :words<n*6?'答えが短め。「理由（because …）」か「例（for example …）」を1文足すと、ぐっと会話らしくなります。'
    :fixes.length?'言い直しを3回声に出してから、もう一度かけてみましょう。同じ話題で点数が上がるのを確かめて。'
    :'自然に会話できています。速さを「ナチュラル」にするか、字幕をオフにして挑戦してみましょう。';
  const el=tkScreen();
  el.innerHTML=tkBack('通話レポート')+`<div class="tk-act call-rep">
      <div class="call-rep-h"><div class="call-rep-av">${sparkSVG(null,score>=70?'win':'cheer')}</div><div><div class="call-k2">${s.t.ic} ${esc(s.t.ja)}</div><b>${score>=85?'Amazing call!':score>=65?'Great job!':'Nice try!'}</b><small>${prev!=null&&score>prev?`ベスト更新（${prev} → ${score}）`:score>=65?'ちゃんと会話が続きました。':'話せたことが一番の前進です。'}</small></div>${tkRing(score,84)}</div>
      <div class="sj-metrics">
        <div class="sj-m ok"><b>${Math.floor(sec/60)}<small>分</small>${sec%60}<small>秒</small></b><span>通話時間</span></div>
        <div class="sj-m ${words>=n*6?'ok':'mid'}"><b>${words}<small>語</small></b><span>話した語数</span></div>
        <div class="sj-m ${lat!=null&&lat<=5?'ok':'mid'}"><b>${lat==null?'—':lat.toFixed(1)}<small>秒</small></b><span>話し出す<br>まで（平均）</span></div></div>
      <div class="call-tip"><b>次はここ</b>${esc(tip)}</div></div>
    ${fixes.length?`<div class="sec-title">🇯🇵 日本人のクセ：言い直し</div>${fixes.map(x=>`<div class="card call-fix"><div class="call-fix-s">${esc(x.said)}</div><div class="call-fix-b">→ <b>${esc(x.fixed)}</b>${tkSayBtn(x.fixed,0.85)}</div><small>${esc(x.issues.join(' / '))}</small></div>`).join('')}<div class="tk-note">言い直しは「表現ノート」に保存しました。数日後に言い直しドリルで出ます。</div>`
      :`<div class="card call-fix"><b>✨ 文法のクセは見つかりませんでした</b><small>次は1つの答えに「理由」や「例」を1文足すと、もっと会話らしくなります。</small></div>`}
    <div class="sec-title">🗣 会話の記録${typed?` <small class="call-typed">うち${typed}回はキーボード</small>`:''}</div>
    <div class="call-chat">${s.turns.map(x=>`<div class="call-b spark"><span>${esc(x.q)}</span></div><div class="call-b me${x.typed?' typed':''}"><span>${esc(x.said||'—')}</span>${x.fixed?`<em>${esc(x.fixed)}</em>`:''}</div>`).join('')}</div>
    ${inDaySession()?sessionNavHTML():`<div class="tk-fb-btns"><button class="btn btn-secondary" id="cl-other">別の話題</button><button class="btn btn-gold" id="cl-again">もう一度かける ${ICONS.arrowRight}</button></div>`}`;
  tkBindBack(callPick);tkBindSay(el);
  const a=document.getElementById('cl-again');if(a){a.onclick=()=>callRing(s.t.id);document.getElementById('cl-other').onclick=callPick}
  window.scrollTo(0,0);
}

/* ---------- Spark からの着信（1日1回、ホームに通知） ----------
   その日まだ通話していなければ、ホームを開いたときに iPhone の着信通知のようなバナーを出す。
   応答で着信画面へ、× で今日は出さない。使い始めた日は出さない（最初に情報を詰め込みすぎないため）。 */
function clBannerMaybe(){
  if(CL||document.getElementById('cl-banner')||document.body.classList.contains('call-open'))return;
  const c=callData(),d=todayStr();
  if(!c.since){c.since=d;commit();return}
  if(c.since===d||c.banner===d||callCalledToday())return;
  const home=document.getElementById('screen-home'),ob=document.getElementById('onboarding');
  if(!home||!home.classList.contains('active')||(ob&&!ob.classList.contains('hidden')))return;
  if(typeof inDaySession==='function'&&inDaySession())return;
  const us=(c.tab||((PROG.jpGoals||[]).includes('live')?'us':'jp'))==='us',list=us?CALL_US:CALL_TOPICS;
  const fresh=list.filter(t=>c.best[t.id]==null),pool=fresh.length?fresh:list,t=pool[new Date().getDate()%pool.length];
  c.banner=d;commit();
  const b=document.createElement('div');b.id='cl-banner';b.className='cl-banner';b.setAttribute('role','alert');
  b.innerHTML=`<div class="cl-banner-av">${sparkSVG(null,'hello')}</div><div class="cl-banner-b"><small>SPARK から着信</small><b>${esc(typeof spkNick==='function'?spkNick():'Spark')}</b><span>${t.ic} ${esc(t.ja)} · 約3分</span></div>
    <button class="no" aria-label="あとで"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <button class="ok" aria-label="応答">${CL_PH_OK}</button>`;
  document.body.appendChild(b);
  if(typeof sfx==='function')sfx('unlock');try{clVib([200,100,200])}catch(e){}
  const close=()=>{if(!b.isConnected)return;b.classList.add('out');setTimeout(()=>b.remove(),300)};
  b.querySelector('.no').onclick=close;
  b.querySelector('.ok').onclick=()=>{b.remove();callRing(t.id)};
  setTimeout(close,15000);
}

/* ---------- 入口 ---------- */
function callInstall(){
  // 毎日のメニュー：土曜の「英会話ロールプレイ」枠を通話に（量は変えない）
  if(typeof P6_TASKS!=='undefined'&&typeof p6MenuFor==='function'){
    P6_TASKS.call={t:'Spark と英語通話',sub:'日本のことを英語で紹介する（約3分）',m:5};
    const _mf=p6MenuFor;p6MenuFor=function(date){const r=_mf.apply(this,arguments);if(date&&date.getDay()===6)r.list=r.list.map(a=>a==='talk'?'call':a);return r};
  }
  const _pta=planTaskAction;planTaskAction=function(a){if(a==='call')return callPick();return _pta.apply(this,arguments)};
  const card=id=>`<button class="call-entry" id="${id}"><span class="call-entry-av">${sparkSVG(null,'hello')}<i></i></span><span class="call-entry-b"><span class="call-k2">VOICE CALL</span><b>Spark と英語通話</b><small>日本の紹介・アメリカ生活 · 声でもキーボードでも</small></span><span class="call-entry-go"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/></svg></span></button>`;
  // Talk タブの先頭
  if(typeof renderTalkHub==='function'){const _th=renderTalkHub;renderTalkHub=function(){const r=_th.apply(this,arguments);const el=document.getElementById('screen-talk'),modes=el&&el.querySelector('.tk-modes');
    if(modes&&!el.querySelector('#call-talk')){modes.insertAdjacentHTML('beforebegin',card('call-talk'));document.getElementById('call-talk').onclick=callPick}return r}}
  // ホーム：話すジムの下
  if(typeof renderHome==='function'){const _rh=renderHome;renderHome=function(){const r=_rh.apply(this,arguments);const home=document.getElementById('screen-home');
    const after=home&&(home.querySelector('#sj-home-card')||home.querySelector('#jp-home')||home.querySelector('.focus-card'));
    if(after&&!home.querySelector('#call-home')){after.insertAdjacentHTML('afterend',card('call-home'));document.getElementById('call-home').onclick=callPick}
    clearTimeout(callInstall._bt);callInstall._bt=setTimeout(clBannerMaybe,2500);return r}}
  if(typeof PLAN_ROWS!=='undefined'&&!PLAN_ROWS.some(r=>r[0].startsWith('Spark と英語通話')))PLAN_ROWS.splice(3,0,['Spark と英語通話（日本を英語で紹介）','○','○']);
}
if(typeof go==='function'){callInstall();if(typeof curTab!=='undefined'&&curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome()}
