/* ========== SPARKLE TALK — 話す英会話モジュール（$0・ブラウザ内完結） ==========
   ・ロールプレイ自由回答：台本会話を「選ぶ」のではなく自分の言葉で話して進める
   ・添削エンジン：日本人学習者の典型ミスをルールで検出し、言い直し文を提示
   ・1分スピーチ：流暢さ(WPM)・語彙・正確さ・キーフレーズを計測
   ・発音ジム：ミニマルペアの聞き分け／言い分け＋誤認識からの発音診断
   ・表現ノート：添削結果を自動収集→間隔反復で言い直しドリル
   ・旅行アシスト：日本語で言いたいこと検索／相手の英語の聞き取り／SOS
   index.html の後に読み込まれ、そのグローバル(PROG, SCENARIOS, speak, esc...)を使う。 */
'use strict';

/* ---------- 状態・記録 ---------- */
function talkData(){
  const t=PROG.talk||(PROG.talk={});
  t.notes=t.notes||[];t.log=t.log||[];t.gym=t.gym||{};t.best=t.best||{};
  if(t.hint==null)t.hint=1;
  if(t.showJa==null)t.showJa=false;
  if(t.rate==null)t.rate=0.92;
  return t;
}
function talkLog(kind,score,sec){
  const t=talkData();
  t.log.push({d:todayStr(),k:kind,s:Math.round(score||0),sec:Math.round(sec||0)});
  if(t.log.length>800)t.log=t.log.slice(-800);
  commit();
}

/* ---------- テキスト正規化 ---------- */
const TK_NUM=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
function tkExpand(s){
  return String(s).toLowerCase().replace(/[’‘`]/g,"'")
    .replace(/\bi'm\b/g,'i am').replace(/\bcan't\b/g,'can not').replace(/\bwon't\b/g,'will not')
    .replace(/\b(\w+)n't\b/g,'$1 not').replace(/\b(\w+)'re\b/g,'$1 are').replace(/\b(\w+)'ve\b/g,'$1 have')
    .replace(/\b(\w+)'ll\b/g,'$1 will').replace(/\b(\w+)'d\b/g,'$1 would').replace(/\blet's\b/g,'let us')
    .replace(/\b(it|that|what|here|there|where|who|how|he|she|this)'s\b/g,'$1 is');
}
function tkTokens(s){
  return tkExpand(s).replace(/[^a-z0-9'\s-]/g,' ').replace(/-/g,' ').split(/\s+/).filter(Boolean)
    .map(w=>{w=w.replace(/^'+|'+$/g,'');const n=+w;return /^\d+$/.test(w)&&n<=20?TK_NUM[n]:w}).filter(Boolean);
}
const TK_STOP=new Set(('a an the is am are was were be been being to of in on at for and or but so i you me my mine your we us our it its this that these those '+
  'do does did will would can could shall should may might must please just very really yes yeah no oh ok okay well um uh er ah hmm hi hello hey '+
  'thank thanks sure good great fine perfect nice alright right also too then there here some any one if as with from by about up '+
  'not what is he she they them their his her have has had get got let').split(' '));
function tkStem(w){
  if(w.length>4&&w.endsWith('ies'))return w.slice(0,-3)+'y';
  if(w.length>3&&w.endsWith('s')&&!/(ss|us|is)$/.test(w))w=w.slice(0,-1);
  if(w.length>5&&w.endsWith('ing'))return w.slice(0,-3);
  if(w.length>4&&w.endsWith('ed'))return w.slice(0,-2);
  return w;
}
const TK_SYN=[
  ['luggage','baggage','bag','suitcase'],['restroom','bathroom','toilet','washroom','lavatory'],
  ['reservation','booking','reserve','book','reserv'],['want','like','need','hope','prefer','wish','lik'],
  ['price','cost','much','charge','fee'],['pay','payment'],['card','credit','visa'],['cash','money'],
  ['help','assist','assistance'],['sick','ill','unwell'],['hurt','pain','ache','painful','sore'],
  ['doctor','physician','clinic','hospital'],['lost','lose','missing','stolen'],['ticket','pass'],
  ['photo','picture','pic','photograph'],['bill','check','tab'],['small','little'],['big','large'],
  ['cheap','cheaper','inexpensive'],['wait','moment','second','minute','sec'],['change','exchange','swap','switch'],
  ['refund','return'],['recommend','suggest','recommendation','suggestion'],['allergy','allergic'],
  ['late','delay','delayed','behind'],['meeting','meet'],['deadline','due'],['schedule','timeline','plan'],
  ['begin','start'],['end','finish'],['tell','say','explain'],['show','see','look'],
  ['go','head','way','get'],['near','nearby','close','nearest','closest'],['stay','staying'],
  ['tourism','sightseeing','vacation','holiday','travel','tourist','trip'],['broken','broke','work'],
  ['again','repeat'],['slow','slowly'],['understand','follow'],['drink','beverage'],['food','meal','dish'],
  ['order','have','take'],['size','fit'],['phone','mobile','cell'],['room','suite'],['water']
];
const TK_CANON=(()=>{const m={};TK_SYN.forEach(g=>g.forEach(w=>{m[w]=g[0];m[tkStem(w)]=g[0]}));return m})();
function tkCanon(w){return TK_CANON[w]||TK_CANON[tkStem(w)]||tkStem(w)}
function tkContent(s){return tkTokens(s).filter(w=>!TK_STOP.has(w)).map(tkCanon)}
function tkWordCount(s){return tkTokens(s).length}
/* 伝達度：相手に伝えるべき要素(target)をどれだけ言えたか。再現率寄りのF2 */
function tkSim(said,target){
  const A=new Set(tkContent(said)),B=new Set(tkContent(target));
  if(!B.size)return A.size?0.5:1;
  if(!A.size)return 0;
  let hit=0;B.forEach(w=>{if(A.has(w))hit++});
  const r=hit/B.size,p=hit/A.size;
  return (r+p)?5*p*r/(4*p+r):0;
}

/* ---------- 単語アラインメント（言い直し・発音の採点用） ---------- */
function tkAlign(said,target){
  const words=String(target).split(/\s+/).filter(Boolean);
  const tt=[];// {tok, owner}
  words.forEach((w,i)=>tkTokens(w).forEach(tok=>tt.push({tok,owner:i})));
  const ss=tkTokens(said);
  const eq=(a,b)=>a===b||tkStem(a)===tkStem(b);
  const n=tt.length,m=ss.length;
  const dp=Array.from({length:n+1},()=>new Array(m+1).fill(0));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=eq(tt[i].tok,ss[j])?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const matched=new Array(n).fill(false),subs=[];
  let i=0,j=0,gapT=[],gapS=[];
  const flush=()=>{if(gapT.length&&gapT.length===gapS.length)gapT.forEach((t,k)=>subs.push({want:t,heard:gapS[k]}));else if(gapT.length===1&&gapS.length)subs.push({want:gapT[0],heard:gapS[0]});gapT=[];gapS=[]};
  while(i<n&&j<m){
    if(eq(tt[i].tok,ss[j])){flush();matched[i]=true;i++;j++}
    else if(dp[i+1][j]>=dp[i][j+1]){gapT.push(tt[i].tok);i++}
    else{gapS.push(ss[j]);j++}
  }
  while(i<n){gapT.push(tt[i].tok);i++}
  while(j<m){gapS.push(ss[j]);j++}
  flush();
  const marks=words.map((w,k)=>{const own=tt.map((t,x)=>t.owner===k?x:-1).filter(x=>x>=0);return own.length?own.every(x=>matched[x]):true});
  const counted=words.filter(w=>tkTokens(w).length).length||1;
  const hit=marks.filter((ok,k)=>ok&&tkTokens(words[k]).length).length;
  return{score:Math.round(hit/counted*100),marks,words,subs};
}

/* ---------- 発音診断（誤認識パターン→日本人向けの口の使い方） ---------- */
const tkSq=w=>String(w).replace(/(.)\1+/g,'$1');
const tkSk=w=>tkSq(w).replace(/[aeiouy]+/g,'');
const tkSwapEq=(a,b,x,y)=>a!==b&&(tkSq(a).split(x).join(y)===tkSq(b).split(x).join(y)||(tkSk(a).split(x).join(y)===tkSk(b).split(x).join(y)&&(a+b).includes(x)));
const TK_SOUNDS=[
  {id:'wk',name:'walk と work',test:(a,b)=>a!==b&&a.replace(/[aeiou]+[lr]?/g,'')===b.replace(/[aeiou]+[lr]?/g,'')&&/(al|or|ar|ur|er|ir|wo)/.test(a+b),tip:'walk / warm は口を縦に大きく開けて「オー」。work / worm は口をあまり開けず、舌を丸めた曖昧な「アー」。'},
  {id:'lr',name:'L と R',test:(a,b)=>tkSwapEq(a,b,'l','r'),tip:'L は舌先を上の歯ぐきにしっかり付けたまま声を出す。R は舌をどこにも付けず、唇を少し丸めて「ゥル」。'},
  {id:'th',name:'TH',test:(a,b)=>a!==b&&/th/.test(a+b)&&['s','t','d','z','f'].some(x=>a.replace(/th/g,x)===b||b.replace(/th/g,x)===a),tip:'舌先を上の前歯に軽く当て、すき間から息を出す。「ス」「ズ」「ト」にならないように。'},
  {id:'vb',name:'V と B',test:(a,b)=>tkSwapEq(a,b,'v','b'),tip:'V は上の前歯を下唇に軽く当てて震わせる。B は両唇を閉じてから破裂させる。'},
  {id:'fh',name:'F と H',test:(a,b)=>tkSwapEq(a,b,'f','h'),tip:'F は上の前歯を下唇に当てて息を出す。日本語の「フ」（両唇）とは別の音。'},
  {id:'si',name:'SI と SHI',test:(a,b)=>a!==b&&a.replace(/sh/g,'s').replace(/ee|ea/g,'e')===b.replace(/sh/g,'s').replace(/ee|ea/g,'e'),tip:'S は口角を横に引いて細い息で「スィ」。「シ」になると she / sheet に聞こえる。'},
  {id:'final',name:'語末の子音',test:(a,b)=>a!==b&&a.length>2&&b.length>2&&a.replace(/[^aeiouy]+$/,'')===b.replace(/[^aeiouy]+$/,''),tip:'語末の子音は母音を足さずに軽く止める（bag を「バッグ」、hand を「ハンド」と言わない）。'},
  {id:'vowel',name:'母音',test:(a,b)=>a!==b&&a.length>2&&a.replace(/[aeiouy]+/g,'')===b.replace(/[aeiouy]+/g,''),tip:'母音の口の形を大きめに。cat は口を横に開いて「エァ」、cut は小さく短い「ア」、walk は縦に開けた「オー」。'}
];
function tkDiagnose(subs){
  const out=[];const seen=new Set();
  (subs||[]).forEach(s=>{const hit=TK_SOUNDS.find(x=>x.test(s.want,s.heard));if(hit&&!seen.has(hit.id)){seen.add(hit.id);out.push({...hit,want:s.want,heard:s.heard})}});
  return out;
}

/* ---------- 添削エンジン（日本人学習者の典型ミス） ----------
   lv: 'error'=文法の誤り / 'better'=通じるが不自然・失礼に響く / 'tip'=より自然な言い方 */
const TK_COUNT_N='reservation|room|table|ticket|question|problem|map|receipt|seat|taxi|refund|discount|towel|pen|doctor|fever|headache|cold|stomachache|suitcase|coupon|locker|stroller|wheelchair|blanket|pillow|charger|adapter|umbrella|photo|picture|bottle|glass|cup|sandwich|hamburger|burger|bag|souvenir|jacket|shirt|flight|trip|seat belt';
const TK_ADJ='window|aisle|double|single|twin|big|small|quiet|non-smoking|early|late|extra|new|different|good|nice|high|bad|slight|little|large|cheap|cheaper|bigger|smaller|spare|clean|paper|plastic|long|short|great|wonderful|terrible|quick|free|better';
const TK_ING2ED={boring:'bored',exciting:'excited',interesting:'interested',tiring:'tired',confusing:'confused',disappointing:'disappointed',surprising:'surprised',exhausting:'exhausted'};
const TK_CMP={cheap:'cheaper',big:'bigger',small:'smaller',large:'larger',good:'better',nice:'nicer',fast:'faster',easy:'easier',hot:'hotter',cold:'colder',long:'longer',short:'shorter',quiet:'quieter'};
const TK_PAST={go:'went',eat:'ate',buy:'bought',see:'saw',have:'had',lose:'lost',take:'took',come:'came',leave:'left',forget:'forgot',find:'found',get:'got',pay:'paid',book:'booked',order:'ordered',visit:'visited',arrive:'arrived',miss:'missed',drop:'dropped',break:'broke',meet:'met',make:'made'};
const TK_3S={make:'makes',get:'gets',say:'says',feel:'feels',smell:'smells',sound:'sounds',mean:'means',seem:'seems',have:'has',go:'goes',do:'does',want:'wants',need:'needs',look:'looks',taste:'tastes',cost:'costs',come:'comes',take:'takes',work:'works',like:'likes',hurt:'hurts',open:'opens',close:'closes',leave:'leaves',start:'starts'};
const TK_PAST_WHEN=/\b(yesterday|last (night|week|year|month|time|weekend)|ago)\b/;
function tkPastRe(f){return new RegExp('(\\b(?:could|can|would|will|may|should|do|did|does|to) )?\\b(i|we|he|she|they|you) ('+Object.keys(TK_PAST).join('|')+')\\b',f||'')}
const TK_RULES=[
  {id:'short',test:x=>{const n=x.trim().split(/\s+/).filter(Boolean).length;return n>0&&n<=2&&!/^(yes|no|sure|thanks?|thank you|okay|ok|of course|excuse me|sorry|hello|hi|i'm|i am|it's|that's|here's|i'd|i|we|you|they|he|she|it)\b/.test(x.trim())},
    lv:'better',ja:'単語だけだと命令のように聞こえがち。文にして伝えよう（例：Water, please. → I\'d like some water, please.）'},
  {id:'want',svc:1,re:/\bi want (to )?/,lv:'better',ja:'I want は「〜が欲しい！」と直接的。お店・ホテルでは I\'d like (to) ～ が丁寧で自然。',fix:x=>x.replace(/\bi want to /,"i'd like to ").replace(/\bi want /,"i'd like ")},
  {id:'giveme',re:/\b(please give me|give me)\b/,lv:'better',ja:'Give me は命令形で強く響きます。Could I have ～, please? で頼もう。',fix:x=>x.replace(/\b(?:please )?give me ([^.?!]+?)(?:,? please)?(?=[.?!]|$)/,'could i have $1, please?')},
  {id:'imper',re:/^(tell|show|bring|call|take|help) me\b/,lv:'better',ja:'命令形だと強く聞こえます。Could you ～? で依頼の形に。',fix:x=>'could you '+x.replace(/,? please$/,'').replace(/\?$/,'')+'?'},
  {id:'canyou',svc:1,re:/^can you\b/,lv:'tip',ja:'Can you ～? でも通じますが、店員さんや初対面の人には Could you ～? がより丁寧。',fix:x=>x.replace(/^can you\b/,'could you')},
  {id:'beverb',re:/\bi(?: am|'m) (go|want|like|have|need|come|eat|think|know|stay|live|work)\b/,lv:'error',ja:'be動詞(am)と一般動詞は並べません。I go / I\'m going のどちらかに。',fix:x=>x.replace(/\bi(?: am|'m) (go|want|like|have|need|come|eat|think|know|stay|live|work)\b/,'i $1')},
  {id:'3s',test:x=>/\b(he|she|it|this|that) (have|go|do|want|need|look|taste|cost|come|take|work|like|hurt|open|close|leave|start|make|get|say|feel|smell|sound|mean|seem)\b/.test(x)&&!/\b(does|did|will|would|can|could|should|may|might|to|let|make|doesn't|didn't|can't|won't|how much is) (he|she|it|this|that) \w+/.test(x),
    lv:'error',ja:'主語が he / she / it のときは動詞に s（三人称単数）：it costs / she has。',fix:x=>x.replace(/\b(he|she|it|this|that) (have|go|do|want|need|look|taste|cost|come|take|work|like|hurt|open|close|leave|start|make|get|say|feel|smell|sound|mean|seem)\b/,(m,a,b)=>a+' '+TK_3S[b])},
  {id:'verylike',re:/\bvery like\b/,lv:'error',ja:'very は動詞を修飾できません。I really like ～ / I like ～ very much。',fix:x=>x.replace(/\bvery like\b/,'really like')},
  {id:'inged',re:/\bi(?: am|'m) (boring|exciting|interesting|tiring|confusing|disappointing|surprising|exhausting)\b/,lv:'error',ja:'-ing は「人を～させる」側。自分の気持ちは -ed：I\'m bored / I\'m excited。',fix:x=>x.replace(/\bi(?: am|'m) (\w+ing)\b/,(m,w)=>"i'm "+(TK_ING2ED[w]||w))},
  {id:'article',re:new RegExp('\\b(have|has|had|want|need|get|book|reserve|call|order|take|use|there is|is there|there\'s|got|lost|found|like|buy|see) ((?:(?:'+TK_ADJ+') )*)('+TK_COUNT_N+')\\b(?! (?:service|key|number|card|charge|temperature|number|attendant|desk))'),
    lv:'error',ja:'数えられる名詞の単数形には a / an（特定なら the）が必要です：a reservation, a taxi。',
    fix:x=>x.replace(new RegExp('\\b(have|has|had|want|need|get|book|reserve|call|order|take|use|there is|is there|there\'s|got|lost|found|like|buy|see) ((?:(?:'+TK_ADJ+') )*)('+TK_COUNT_N+')\\b','g'),(m,v,adj,n)=>{const first=(adj||n).trim();return v+' '+(/^[aeiou]/.test(first)?'an ':'a ')+adj+n})},
  {id:'changeroom',re:/\bchange (room|seat|table|train|plane|bus)\b/,lv:'error',ja:'「～を替える」の change は複数形：change rooms / change trains（替える前と後の2つがあるため）。',fix:x=>x.replace(/\bchange (room|seat|table|train|plane|bus)\b/,'change $1s')},
  {id:'another',test:x=>/\bother (room|one|seat|table|size|color|colour|day|time|place|restaurant|hotel|flight)\b/.test(x)&&!/\b(the|any|some|no|each|every) other\b/.test(x),lv:'error',ja:'「別の～（1つ）」は another ～。other は単数名詞の前に単独では使えません：another room。',fix:x=>/\b(the|any|some|no|each|every) other\b/.test(x)?x:x.replace(/\bother (room|one|seat|table|size|color|colour|day|time|place|restaurant|hotel|flight)\b/,'another $1')},
  {id:'uncount',re:/\b(a|an) (luggage|baggage|information|advice|furniture|equipment)\b|\b(luggages|baggages|informations|advices|furnitures)\b/,lv:'error',ja:'luggage / information / advice は数えられない名詞。a を付けず、複数形の s も付けません（荷物1つ = a piece of luggage / one bag）。',fix:x=>x.replace(/\b(?:a|an) (luggage|baggage|information|advice|furniture|equipment)\b/,'$1').replace(/\b(luggage|baggage|information|advice|furniture)s\b/,'$1')},
  {id:'aan',test:x=>/\ba (?!uni|use|usu|one|once|eu|ur)[aeiou]\w*/.test(x)||/\ban (?!hour|honest|hono|heir)[^aeiou\s]\w*/.test(x),lv:'error',ja:'母音の音で始まる語の前は an、子音の前は a（an apple / a bag）。',fix:x=>x.replace(/\ba ((?!uni|use|usu|one|once|eu|ur)[aeiou]\w*)/g,'an $1').replace(/\ban ((?!hour|honest|hono|heir)[^aeiou\s]\w*)/g,'a $1')},
  {id:'howmuch',re:/\bhow much is (it|this|that) cost\b/,lv:'error',ja:'is と cost が重複。How much does it cost? か How much is it? に。',fix:x=>x.replace(/\bhow much is (it|this|that) cost\b/,'how much does $1 cost')},
  {id:'indirect',re:/\b(?:could|can) you (?:tell|show) me (where|what|when|how|which) (is|are) (.+?)\??$/,lv:'better',ja:'Could you tell me の後ろは「疑問詞＋主語＋動詞」の順（間接疑問）：Could you tell me where the station is?',fix:x=>x.replace(/\b((?:could|can) you (?:tell|show) me) (where|what|when|how|which) (is|are) (.+?)\??$/,'$1 $2 $4 $3?')},
  {id:'howgo',re:/\bhow can i go to\b/,lv:'tip',ja:'道を聞くときは How do I get to ～? が自然。',fix:x=>x.replace(/\bhow can i go to\b/,'how do i get to')},
  {id:'tohome',re:/\b(go|went|come|came|get|got) to (home|there|here|abroad|downtown)\b/,lv:'error',ja:'home / there / here / abroad は副詞なので to は不要：go home, go there。',fix:x=>x.replace(/\b(go|went|come|came|get|got) to (home|there|here|abroad|downtown)\b/,'$1 $2')},
  {id:'sorry',re:/^(i'm sorry|sorry),? (where|can|could|do|is|what|how)\b/,lv:'tip',ja:'話しかけるときは Excuse me,（Sorry は謝るとき・聞き返すとき）。',fix:x=>x.replace(/^(i'm sorry|sorry),? /,'excuse me, ')},
  {id:'cantspeak',re:/\bi can(?:'t| not|not) speak english\b/,lv:'tip',ja:'「英語が話せません」と言うと相手が会話をやめがち。My English isn\'t perfect, but… の方が会話が続きます。'},
  {id:'wait',re:/\b(wait please|please wait|wait a minute)\b/,lv:'better',ja:'Wait は命令形で強め。One moment, please. / Just a second. が柔らかく自然。',fix:x=>x.replace(/\b(wait please|please wait|wait a minute)\b/,'one moment, please')},
  {id:'fineandyou',re:/\bi'?m fine,? thank you,? and you\b/,lv:'tip',ja:'教科書どおりで少し硬め。Good, thanks! How about you? が自然。',fix:x=>x.replace(/\bi'?m fine,? thank you,? and you\b/,'good, thanks! how about you')},
  {id:'nosubj',re:/^(want|need|like|have|stay|went|go|came|lost|think|live|work) \w/,lv:'better',ja:'主語が抜けています。I を付けて文にしよう。',fix:x=>'i '+x},
  {id:'morecmp',re:/\bmore (cheap|big|small|large|good|nice|fast|easy|hot|cold|long|short|quiet)\b/,lv:'error',ja:'短い形容詞の比較級は -er：cheaper, bigger（more は使わない）。',fix:x=>x.replace(/\bmore (cheap|big|small|large|good|nice|fast|easy|hot|cold|long|short|quiet)\b/,(m,a)=>TK_CMP[a])},
  {id:'past',test:x=>x.split(/[.?!]/).some(sen=>TK_PAST_WHEN.test(sen)&&sen.replace(tkPastRe('g'),(m,md)=>md?'':'#').includes('#')),
    lv:'error',ja:'過去の出来事は過去形に：I lost / I went。',fix:x=>x.replace(/[^.?!]+/g,sen=>TK_PAST_WHEN.test(sen)?sen.replace(tkPastRe('g'),(m,md,sb,v)=>md?m:sb+' '+TK_PAST[v]):sen)},
  {id:'liketo',re:/\b(i'd|i would) like to (a|an|the|some)\b/,lv:'error',ja:'to の後ろは動詞。I\'d like a ～ / I\'d like to have a ～。',fix:x=>x.replace(/\b(i'd|i would) like to (a|an|the|some)\b/,'$1 like $2')},
  {id:'onemore',re:/\bplease one more\b/,lv:'better',ja:'One more, please. の語順が自然。',fix:x=>x.replace(/\bplease one more\b/,'one more, please')},
  {id:'dontknow',svc:1,re:/^i (don't|do not) know\.?$/,lv:'tip',ja:'I don\'t know だけだと突き放した印象。I\'m not sure. / Let me think… が柔らかい。'}
];
function tkTidy(x,caps){
  if(caps)x=x.replace(/[a-z][a-z']*/g,w=>caps[w]||w);
  x=x.replace(/\?\s*[.,]/g,'?').replace(/\s+/g,' ').replace(/\s+([,?.!])/g,'$1').replace(/,\s*,/g,',').trim();
  x=x.replace(/\bi\b/g,'I').replace(/\bi'(m|d|ll|ve)\b/g,"I'$1");
  x=x.charAt(0).toUpperCase()+x.slice(1);
  x=x.replace(/([.?!]\s+)([a-z])/g,(m,p,c)=>p+c.toUpperCase());
  if(!/[.?!]$/.test(x))x+=/^(can|could|would|will|do|does|did|is|are|am|may|where|what|when|how|which|who|why)\b/i.test(x)?'?':'.';
  return x;
}
function tkCheck(text,opt){
  const raw=String(text||'').trim();
  let x=raw.toLowerCase().replace(/[’‘`]/g,"'").replace(/[.!]+$/,'').replace(/\s+/g,' ').trim();
  const issues=[];let fixed=x;
  TK_RULES.forEach(r=>{
    if(opt&&opt.speech&&(r.svc||r.id==='short'))return;
    const hit=r.test?r.test(x):r.re.test(x);
    if(!hit)return;
    const m=r.re?x.match(r.re):null;
    issues.push({id:r.id,lv:r.lv,ja:r.ja,from:m?m[0].trim():''});
    if(r.fix){try{const f=r.fix(fixed);if(f)fixed=f}catch(e){}}
  });
  const changed=issues.some(i=>TK_RULES.find(r=>r.id===i.id).fix);
  // 固有名詞などの大文字を復元（Orlando, IT など）
  const caps={};raw.replace(/[A-Za-z][A-Za-z']*/g,(w,pos)=>{const head=/^\s*$|[.?!]\s*$/.test(raw.slice(0,pos));if(/[A-Z]/.test(w)&&!head&&!TK_STOP.has(w.toLowerCase())&&w!=='I'&&!/^I'/.test(w))caps[w.toLowerCase()]=w;return w});
  return{issues,fixed:tkTidy(changed?fixed:x,caps),changed};
}
function tkMarkIssues(text,issues){
  let h=esc(text);
  issues.forEach(i=>{if(!i.from||i.from.length<2)return;const re=new RegExp('('+i.from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','i');h=h.replace(re,'<mark class="tk-mk tk-mk-'+i.lv+'">$1</mark>')});
  return h;
}

/* ---------- ロールプレイの1ターン評価 ---------- */
function tkEvalTurn(said,turn){
  const sims=turn.choices.map(c=>tkSim(said,c.en));
  const pIdx=turn.choices.findIndex(c=>c.q==='perfect');
  const perfect=turn.choices[pIdx]||turn.choices[0];
  let comm=0;turn.choices.forEach((c,i)=>{if(c.q!=='ng')comm=Math.max(comm,sims[i])});
  let best=0;sims.forEach((s,i)=>{if(s>sims[best])best=i});
  const chk=tkCheck(said);
  const words=tkWordCount(said);
  const comm01=Math.max(0,Math.min(1,(comm-0.15)/0.45));
  let natural=1;chk.issues.forEach(i=>{natural-=i.lv==='error'?0.2:i.lv==='better'?0.12:0.03});
  if(turn.choices[best].q==='ng'&&sims[best]>0.5)natural-=0.25;
  natural=Math.max(0.2,natural);
  const rich=words<=2?0.4:words<=4?0.75:1;
  let score=Math.round(100*(0.55*comm01+0.25*natural+0.2*rich));
  if(sims[pIdx]>=0.6)score+=5;
  // 指摘が残る回答は「ネイティブ並み」にしない
  const cap=chk.issues.some(i=>i.lv==='error')?74:chk.issues.some(i=>i.lv==='better')?84:100;
  score=Math.max(0,Math.min(cap,score));
  const understood=comm>=0.22;
  const label=score>=90?'Native-like':score>=75?'Natural':score>=55?'Understood':'Keep going';
  return{score,label,understood,comm,sims,best,perfect,matched:turn.choices[best],issues:chk.issues,fixed:chk.fixed,words};
}

/* ---------- 音声認識ヘルパー ---------- */
const TK_SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let tkRec=null;
function tkStopAll(){
  if(tkRec){try{tkRec.abort()}catch(e){}tkRec=null}
  if(tkSpeechState&&tkSpeechState.timer){clearInterval(tkSpeechState.timer);tkSpeechState.timer=null}
}
function tkListen(o){
  if(!TK_SR){o.onError&&o.onError('unsupported');return null}
  if(tkRec){try{tkRec.abort()}catch(e){}tkRec=null}
  const rec=new TK_SR();
  rec.lang=o.lang||'en-US';rec.interimResults=true;rec.continuous=!!o.continuous;rec.maxAlternatives=o.alts||1;
  let finals=[],interim='',tStart=0,tFirst=0,tLast=0,alts=[],err=null,done=false,timer=null;
  rec.onspeechstart=()=>{if(!tStart)tStart=performance.now()};
  rec.onresult=e=>{
    interim='';
    for(let i=e.resultIndex;i<e.results.length;i++){
      const r=e.results[i];const now=performance.now();
      if(!tFirst)tFirst=now;tLast=now;
      if(r.isFinal){finals.push(r[0].transcript.trim());alts=alts.concat(Array.from(r).map(a=>a.transcript))}
      else interim+=r[0].transcript;
    }
    o.onInterim&&o.onInterim((finals.join(' ')+' '+interim).trim());
  };
  rec.onerror=e=>{if(e.error!=='no-speech'&&e.error!=='aborted')err=e.error};
  rec.onend=()=>{
    if(done)return;done=true;clearTimeout(timer);if(tkRec&&tkRec.rec===rec)tkRec=null;
    const text=(finals.length?finals.join(' '):interim).trim();
    const t0=tStart||tFirst;
    const sec=t0&&tLast?Math.max(0.6,(tLast-t0)/1000+0.3):0;
    o.onDone&&o.onDone(text,{sec,alts:alts.length?alts:(text?[text]:[]),error:err});
  };
  try{rec.start()}catch(e){o.onError&&o.onError('start');return null}
  if(o.maxMs)timer=setTimeout(()=>{try{rec.stop()}catch(e){}},o.maxMs);
  tkRec={rec,stop:()=>{try{rec.stop()}catch(e){}},abort:()=>{done=true;try{rec.abort()}catch(e){}}};
  return tkRec;
}
function tkSrErrorMsg(code){
  return({unsupported:'このブラウザは音声認識に未対応です。Chrome / Safari で開くか、タイプで答えてください。','not-allowed':'マイクが許可されていません。ブラウザの設定で許可してください。',network:'音声認識にはネット接続が必要です。',start:'マイクを開始できませんでした。もう一度押してください。','audio-capture':'マイクが見つかりません。'})[code]||('音声認識エラー：'+code);
}
function tkWpm(words,sec){return sec>=1.2?Math.round(words/(sec/60)):0}

/* ---------- 共通UI部品 ---------- */
function tkScreen(){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById('screen-talk');el.classList.add('active');
  return el;
}
function tkBack(label,fn){return `<div class="back-row"><button class="icon-btn" id="tk-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>${label}</h2></div>`}
function tkBindBack(fn){const b=document.getElementById('tk-back');if(b)b.onclick=()=>{tkStopAll();if('speechSynthesis'in window)speechSynthesis.cancel();fn()}}
function tkRing(score,size){
  size=size||76;const r=size/2-6,c=2*Math.PI*r,off=c*(1-score/100);
  const col=score>=85?'var(--enchanted)':score>=60?'var(--sparkle)':'var(--ember)';
  return `<div class="tk-ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--border)" stroke-width="6"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size/2} ${size/2})"/></svg><span>${score}</span></div>`;
}
function tkIssueHTML(issues){
  if(!issues.length)return '';
  const tag={error:'文法',better:'自然さ',tip:'ヒント'};
  return '<div class="tk-issues">'+issues.map(i=>`<div class="tk-issue tk-lv-${i.lv}"><span class="tk-issue-tag">${tag[i.lv]}</span><span>${esc(i.ja)}</span></div>`).join('')+'</div>';
}
function tkMicHTML(id,label){return `<button class="tk-mic" id="${id}" aria-label="${label||'話す'}">${ICONS.mic}</button>`}
function tkBindSay(root){(root||document).querySelectorAll('[data-tksay]').forEach(b=>b.onclick=e=>{e.stopPropagation();speak(b.dataset.tksay,+(b.dataset.rate||talkData().rate),b.dataset.vp||undefined);sfx('tap')})}
function tkSayBtn(text,rate,vp,label){return `<button class="bubble-play" data-tksay="${esc(text)}" ${rate?`data-rate="${rate}"`:''} ${vp?`data-vp="${vp}"`:''} aria-label="${label||'再生'}">${ICONS.play}</button>`}

/* ---------- 表現ノート ---------- */
const TK_BOX_DAYS=[1,2,4,8,16,32];
function tkAddNote(n){
  const t=talkData();
  const ex=t.notes.find(x=>x.better===n.better);
  if(ex){Object.assign(ex,{said:n.said,why:n.why,box:0,due:todayStr()});}
  else t.notes.unshift({id:'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),box:0,due:todayStr(),d:todayStr(),...n});
  if(t.notes.length>300)t.notes.length=300;
  commit();
}
function tkDueNotes(){const t=talkData(),d=todayStr();return t.notes.filter(n=>n.due<=d&&n.box<TK_BOX_DAYS.length)}

/* ---------- 統計・レベル ---------- */
function tkWeek(){
  const t=talkData();const days=[];
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(ymd(d))}
  return days.map(d=>({d,sec:t.log.filter(l=>l.d===d).reduce((a,l)=>a+(l.sec||0),0),n:t.log.filter(l=>l.d===d).length}));
}
function tkLevel(){
  const t=talkData();const rec=t.log.filter(l=>l.k==='rp'||l.k==='sp').slice(-30);
  if(rec.length<3)return{code:'—',name:'判定中',avg:0,n:rec.length};
  const avg=rec.reduce((a,l)=>a+l.s,0)/rec.length;
  const L=avg<40?['A1','はじめの一歩']:avg<55?['A2','旅行の基本']:avg<70?['B1','旅先で自立']:avg<85?['B2','会話を楽しめる']:['C1','ほぼネイティブ'];
  return{code:L[0],name:L[1],avg:Math.round(avg),n:rec.length};
}

/* ========== HUB ========== */
function renderTalkHub(){
  tkStopAll();
  const el=tkScreen();const t=talkData();
  const wk=tkWeek();const weekSec=wk.reduce((a,x)=>a+x.sec,0);const weekTurns=wk.reduce((a,x)=>a+x.n,0);
  const lv=tkLevel();const due=tkDueNotes().length;
  const maxSec=Math.max(60,...wk.map(x=>x.sec));
  const dow=['日','月','火','水','木','金','土'];
  const bars=wk.map(x=>`<div class="tk-bar"><div class="tk-bar-f" style="height:${Math.round(x.sec/maxSec*100)}%"></div><span>${dow[new Date(x.d+'T00:00').getDay()]}</span></div>`).join('');
  const groups=Object.keys(SCENARIOS).map(sid=>{
    const sc=SCENARIOS[sid];
    return `<div class="tk-group"><div class="tk-group-h" style="--c:${sc.color}">${ICONS[sc.icon]||ICONS.globe}<span>${esc(sc.titleJa)}</span></div>`+
      sc.conversations.map(c=>{const b=t.best[c.id];const n=c.turns.filter(x=>x.who==='user').length;
        return `<button class="tk-row" data-rp="${sid}|${c.id}"><div><div class="tk-row-t">${esc(c.title)}</div><div class="tk-row-s">${esc(c.titleJa)} · ${n}ターン</div></div>${b!=null?`<span class="tk-best ${b>=85?'hi':b>=60?'mid':'lo'}">${b}</span>`:`<span class="tk-row-go">${ICONS.mic}</span>`}</button>`}).join('')+'</div>';
  }).join('');
  el.innerHTML=`
    <div class="tk-hero">
      <div class="tk-kicker">Speak · Fix · Repeat</div>
      <h2 class="tk-h">Talk</h2>
      <p class="tk-lead">話して、直されて、言い直す。旅先で困らない英会話を、このループで身につける。</p>
      <div class="tk-stats">
        <div class="tk-stat"><div class="tk-stat-v">${Math.floor(weekSec/60)}<small>分</small>${weekSec%60?`${weekSec%60}<small>秒</small>`:''}</div><div class="tk-stat-l">今週話した時間</div></div>
        <div class="tk-stat"><div class="tk-stat-v">${weekTurns}</div><div class="tk-stat-l">今週の発話回数</div></div>
        <div class="tk-stat"><div class="tk-stat-v">${lv.code}</div><div class="tk-stat-l">Speaking Lv · ${esc(lv.name)}</div></div>
      </div>
      <div class="tk-week" aria-label="直近7日の発話時間">${bars}</div>
    </div>
    <div class="tk-modes">
      <button class="tk-mode" id="tk-go-rp"><span class="tk-mode-ic">${ICONS.mic}</span><span class="tk-mode-t">ロールプレイ</span><span class="tk-mode-d">台本なしで、自分の言葉で返答</span></button>
      <button class="tk-mode" id="tk-go-sp"><span class="tk-mode-ic">${ICONS.clock}</span><span class="tk-mode-t">1分スピーチ</span><span class="tk-mode-d">流暢さ・語彙・正確さを計測</span></button>
      <button class="tk-mode" id="tk-go-gym"><span class="tk-mode-ic">${ICONS.zap}</span><span class="tk-mode-t">発音ジム</span><span class="tk-mode-d">L/R・TH・V/B を聞き分け&言い分け</span></button>
      <button class="tk-mode" id="tk-go-notes"><span class="tk-mode-ic">${ICONS.bookmark}</span><span class="tk-mode-t">表現ノート</span><span class="tk-mode-d">${due?`<b class="tk-due">${due}件</b> 言い直し待ち`:`添削された表現 ${t.notes.length}件`}</span></button>
    </div>
    <button class="tk-wide" id="tk-go-assist"><span class="tk-mode-ic">${ICONS.globe}</span><span><span class="tk-mode-t">旅行アシスト</span><span class="tk-mode-d">本番用：言いたいことを日本語で検索 / 相手の英語を聞き取り / SOS</span></span><span class="tk-row-go">${ICONS.arrowRight}</span></button>
    <div class="sec-title" id="tk-rp-list">${ICONS.mic} ロールプレイ（自由回答）</div>
    <p class="tk-note">相手のセリフを聞いて、マイクで自由に答えてください。伝わったか・自然か・文になっているかを採点し、よりネイティブらしい言い方を提示します。</p>
    ${groups}
    <div class="sec-title">${ICONS.user} 設定</div>
    <div class="tk-set">
      <div class="tk-set-row"><span>ヒント表示</span><div class="tk-seg" data-set="hint">${[['0','なし'],['1','言う内容'],['2','＋キーワード']].map(([v,l])=>`<button data-v="${v}" class="${String(t.hint)===v?'on':''}">${l}</button>`).join('')}</div></div>
      <div class="tk-set-row"><span>相手のセリフの訳</span><div class="tk-seg" data-set="showJa">${[['0','タップで表示'],['1','常に表示']].map(([v,l])=>`<button data-v="${v}" class="${(t.showJa?'1':'0')===v?'on':''}">${l}</button>`).join('')}</div></div>
      <div class="tk-set-row"><span>相手の話す速さ</span><div class="tk-seg" data-set="rate">${[['0.75','ゆっくり'],['0.92','ふつう'],['1.05','ナチュラル']].map(([v,l])=>`<button data-v="${v}" class="${String(t.rate)===v?'on':''}">${l}</button>`).join('')}</div></div>
    </div>
    ${TK_SR?'':`<div class="tk-warn">このブラウザは音声認識に未対応のため、タイプ入力で練習できます（Chrome / Safari 推奨）。</div>`}`;
  document.getElementById('tk-go-rp').onclick=()=>document.getElementById('tk-rp-list').scrollIntoView({behavior:'smooth'});
  document.getElementById('tk-go-sp').onclick=renderSpeechList;
  document.getElementById('tk-go-gym').onclick=renderGym;
  document.getElementById('tk-go-notes').onclick=renderNotes;
  document.getElementById('tk-go-assist').onclick=renderAssist;
  el.querySelectorAll('[data-rp]').forEach(b=>b.onclick=()=>{const [s,c]=b.dataset.rp.split('|');openRoleplay(s,c)});
  el.querySelectorAll('.tk-seg').forEach(seg=>seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const k=seg.dataset.set,v=b.dataset.v;
    t[k]=k==='showJa'?v==='1':k==='rate'?+v:+v;commit();
    seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));sfx('tap');
  }));
  window.scrollTo(0,0);
  anim('.tk-hero',{opacity:0,y:12},{opacity:1,y:0,duration:0.4,ease:'power2.out'});
}

/* ========== ロールプレイ（自由回答） ========== */
let tkRP=null;
const TK_CLARIFY=[
  {en:"Sorry, I didn't quite catch that. Could you say it another way?",ja:"すみません、よく聞き取れませんでした。別の言い方で言ってもらえますか？"},
  {en:"I'm sorry, could you say that again?",ja:"すみません、もう一度言っていただけますか？"},
  {en:"Hmm, I'm not sure I follow. What would you like?",ja:"うーん、ちょっとわかりませんでした。どうされたいですか？"}
];
function openRoleplay(sid,cid){
  const sc=SCENARIOS[sid];const conv=sc.conversations.find(c=>c.id===cid);
  const ch=sc.characters.find(c=>c.id===conv.character)||sc.characters[0];
  if(curTab!=='talk'){curTab='talk';buildNav()}
  tkRP={sid,conv,ch,vp:charVoicePref(ch),step:0,history:[],results:[],attempt:0,phase:'await',speechSec:0,words:0,lastSpoken:-1,typing:!TK_SR,hintShown:talkData().hint};
  tkRPAdvance();
}
function tkRPAdvance(){
  const r=tkRP;
  while(r.conv.turns[r.step]&&r.conv.turns[r.step].who==='char'){const tr=r.conv.turns[r.step];r.history.push({type:'char',en:tr.en,ja:tr.ja});r.step++}
  r.phase=r.conv.turns[r.step]?'await':'done';
  r.attempt=0;r.hintShown=talkData().hint;
  tkRPRender();
}
function tkRPChat(){
  const r=tkRP;const t=talkData();
  return '<div class="chat tk-chat">'+r.history.map((h,i)=>{
    if(h.type==='char')return `<div class="msg msg-char"><div class="tk-av" style="background:${r.ch.avatarColor||'var(--sparkle)'}">${esc(r.ch.avatar||'?')}</div><div><div class="bubble">${esc(h.en)}${tkSayBtn(h.en,t.rate,r.vp,'もう一度聞く')}</div>${h.ja?`<div class="bubble-ja tk-ja ${t.showJa?'show':''}" data-ja>${t.showJa?esc(h.ja):'訳を見る'}</div>`:''}</div></div>`;
    return `<div class="msg msg-user"><div class="bubble ${h.miss?'tk-miss':''}">${esc(h.en)}${h.score!=null?`<span class="bubble-score">${h.score}</span>`:''}</div></div>`;
  }).join('')+'</div>';
}
function tkRPRender(){
  const el=tkScreen();const r=tkRP;const t=talkData();
  const userTurns=r.conv.turns.filter(x=>x.who==='user').length;
  const done=r.results.length;
  let html=`<div class="back-row"><button class="icon-btn" id="tk-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>${esc(r.conv.title)}</h2><span class="tk-prog-n">${Math.min(done+1,userTurns)}/${userTurns}</span></div>
    <div class="tk-rp-head"><span class="tk-av sm" style="background:${r.ch.avatarColor||'var(--sparkle)'}">${esc(r.ch.avatar||'?')}</span><span><b>${esc(r.ch.name)}</b> · ${esc(r.ch.role)}</span></div>
    <div class="rv-prog tk-prog"><div class="rv-prog-fill" style="width:${done/userTurns*100}%"></div></div>`;
  html+=tkRPChat();
  if(r.phase==='await')html+=tkRPAwaitHTML();
  else if(r.phase==='feedback')html+=tkRPFeedbackHTML();
  else html+=tkRPSummaryHTML();
  el.innerHTML=html;
  tkBindBack(renderTalkHub);tkBindSay(el);
  el.querySelectorAll('[data-ja]').forEach((j,i)=>j.onclick=()=>{const chars=r.history.filter(h=>h.type==='char');const idx=[...el.querySelectorAll('[data-ja]')].indexOf(j);const h=chars[idx];if(h){j.textContent=h.ja;j.classList.add('show')}});
  if(r.phase==='await')tkRPBindAwait();
  else if(r.phase==='feedback')tkRPBindFeedback();
  else tkRPBindSummary();
  // 最新の相手セリフを自動再生（1回だけ）
  const lastChar=r.history.map(h=>h.type).lastIndexOf('char');
  if(r.phase!=='done'&&lastChar>r.lastSpoken){r.lastSpoken=lastChar;const h=r.history[lastChar];setTimeout(()=>speak(h.en,t.rate,r.vp),300)}
  const last=el.querySelector('.tk-chat .msg:last-child');
  if(last){anim(last,{opacity:0,y:8},{opacity:1,y:0,duration:0.3})}
  const act=el.querySelector('.tk-act');
  if(act&&(r.phase!=='await'||r.history.length>1))setTimeout(()=>act.scrollIntoView({behavior:PREF_REDUCED?'auto':'smooth',block:'nearest'}),60);
}
function tkRPAwaitHTML(){
  const r=tkRP;const turn=r.conv.turns[r.step];
  const perfect=turn.choices.find(c=>c.q==='perfect')||turn.choices[0];
  const keys=tkTokens(perfect.en.replace(/[’']/g,"'")).filter(w=>!TK_STOP.has(w)&&w.length>2).slice(0,4);
  let goal='';
  if(r.attempt>=2)goal=`<div class="tk-goal tk-goal-model"><div class="tk-goal-l">こう言ってみよう</div><div class="tk-goal-en">${esc(perfect.en)} ${tkSayBtn(perfect.en,0.85,null,'お手本を聞く')}</div><div class="tk-goal-ja">${esc(perfect.ja)}</div></div>`;
  else if(r.hintShown>=1)goal=`<div class="tk-goal"><div class="tk-goal-l">伝えること</div><div class="tk-goal-ja lg">${esc(perfect.ja)}</div>${r.hintShown>=2&&keys.length?`<div class="tk-keys">${keys.map(k=>`<span>${esc(k)}</span>`).join('')}</div>`:''}</div>`;
  return `<div class="tk-act">
    ${goal}
    <div class="tk-live" id="tk-live">${r.typing?'':TK_SR?'マイクを押して、英語で答えてください':''}</div>
    ${r.typing?`<div class="tk-typebox"><textarea id="tk-input" class="ic-input" rows="2" placeholder="英語で返答を入力"></textarea><button class="btn btn-gold" id="tk-send">送信 ${ICONS.arrowRight}</button></div>`:`<div class="tk-mic-wrap">${tkMicHTML('tk-mic','話す')}</div>`}
    <div class="tk-subacts">
      ${TK_SR?`<button class="tk-link" id="tk-toggle-type">${r.typing?'🎙 声で答える':'⌨ タイプで答える'}</button>`:''}
      ${r.attempt<2&&r.hintShown<2?`<button class="tk-link" id="tk-hint">💡 ヒント</button>`:''}
      <button class="tk-link" id="tk-skip">答えを見て次へ</button>
    </div>
  </div>`;
}
function tkRPBindAwait(){
  const r=tkRP;
  const tt=document.getElementById('tk-toggle-type');if(tt)tt.onclick=()=>{tkStopAll();r.typing=!r.typing;tkRPRender()};
  const hb=document.getElementById('tk-hint');if(hb)hb.onclick=()=>{r.hintShown=Math.min(2,r.hintShown+1);tkRPRender()};
  document.getElementById('tk-skip').onclick=()=>{
    tkStopAll();const turn=r.conv.turns[r.step];const p=turn.choices.find(c=>c.q==='perfect')||turn.choices[0];
    r.history.push({type:'user',en:p.en,score:null});r.results.push({said:'',score:0,skipped:true,better:p.en});r.step++;tkRPAdvance();
  };
  if(r.typing){
    const inp=document.getElementById('tk-input');
    const send=()=>{const v=inp.value.trim();if(!v){inp.focus();return}tkRPSubmit(v,0)};
    document.getElementById('tk-send').onclick=send;
    inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send()}});
    return;
  }
  const mic=document.getElementById('tk-mic');const live=document.getElementById('tk-live');
  mic.onclick=()=>{
    if(tkRec){tkRec.stop();return}
    if('speechSynthesis'in window)speechSynthesis.cancel();
    mic.classList.add('mic-active');live.textContent='Listening…';live.classList.add('on');
    const h=tkListen({lang:'en-US',maxMs:20000,
      onInterim:txt=>{live.textContent=txt||'Listening…'},
      onDone:(txt,meta)=>{mic.classList.remove('mic-active');live.classList.remove('on');
        if(meta.error){live.textContent=tkSrErrorMsg(meta.error);return}
        if(!txt){live.textContent='聞き取れませんでした。もう一度どうぞ。';return}
        tkRPSubmit(txt,meta.sec)},
      onError:c=>{mic.classList.remove('mic-active');live.textContent=tkSrErrorMsg(c)}});
    if(!h)mic.classList.remove('mic-active');
  };
}
function tkRPSubmit(said,sec){
  const r=tkRP;const turn=r.conv.turns[r.step];
  const ev=tkEvalTurn(said,turn);
  r.speechSec+=sec||0;r.words+=ev.words;
  if(!ev.understood&&r.attempt<2){
    r.attempt++;
    const c=TK_CLARIFY[(r.attempt-1)%TK_CLARIFY.length];
    r.history.push({type:'user',en:said,miss:true});
    r.history.push({type:'char',en:c.en,ja:c.ja});
    talkLog('rp',ev.score,sec);sfx('wrong');
    return tkRPRender();
  }
  r.history.push({type:'user',en:said,score:ev.score});
  r.cur={said,ev,sec,wpm:tkWpm(ev.words,sec)};
  r.results.push({said,score:ev.score,better:ev.perfect.en,sec});
  talkLog('rp',ev.score,sec);
  addXP('talk_turn');if(ev.score>=85)addXP('talk_great');
  sfx(ev.score>=75?'correct':ev.score>=55?'tap':'wrong');
  const hasErr=ev.issues.some(i=>i.lv!=='tip');
  if(ev.score<75||hasErr){
    tkAddNote({said,better:hasErr&&ev.score>=75?ev.fixed:ev.perfect.en,ja:ev.perfect.ja,why:ev.issues.map(i=>i.ja).slice(0,2).join(' / ')||(ev.matched.q!=='perfect'?ev.matched.fb:''),src:r.conv.title});
    r.cur.saved=true;
  }
  r.phase='feedback';
  tkRPRender();
}
function tkRPFeedbackHTML(){
  const {said,ev,wpm,saved}=tkRP.cur;
  const showFixed=ev.issues.some(i=>i.lv!=='tip')&&ev.fixed.toLowerCase()!==said.toLowerCase().replace(/[.?!]$/,'')&&ev.fixed!==tkTidy(said);
  const nativeFb=ev.matched.q!=='perfect'&&ev.sims[ev.best]>=0.45?ev.matched.fb:'';
  const bars=[['伝達',Math.round(Math.min(1,Math.max(0,(ev.comm-0.15)/0.45))*100)],['自然さ',Math.round(Math.max(0.2,1-ev.issues.reduce((a,i)=>a+(i.lv==='error'?0.2:i.lv==='better'?0.12:0.03),0))*100)],['文の長さ',ev.words<=2?40:ev.words<=4?75:100]];
  return `<div class="tk-act tk-fb">
    <div class="tk-fb-top">${tkRing(ev.score)}<div><div class="tk-fb-label">${ev.label}</div>
      <div class="tk-mini">${bars.map(([l,v])=>`<div class="tk-mini-row"><span>${l}</span><div class="tk-mini-bar"><i style="width:${v}%"></i></div></div>`).join('')}</div>
      ${wpm?`<div class="tk-fb-meta">話す速さ ${wpm} wpm</div>`:''}</div></div>
    <div class="tk-fb-sec"><div class="tk-fb-h">あなた</div><div class="tk-said">${tkMarkIssues(said,ev.issues)}</div></div>
    ${tkIssueHTML(ev.issues)}
    ${showFixed?`<div class="tk-fb-sec"><div class="tk-fb-h">直すと</div><div class="tk-better">${esc(ev.fixed)} ${tkSayBtn(ev.fixed,0.9)}</div></div>`:''}
    ${nativeFb?`<div class="tk-fb-sec tk-native"><div class="tk-fb-h">ネイティブ講師のコメント</div>${esc(nativeFb)}</div>`:''}
    <div class="tk-fb-sec"><div class="tk-fb-h">ネイティブならこう言う</div><div class="tk-better">${esc(ev.perfect.en)} ${tkSayBtn(ev.perfect.en,0.9)}</div><div class="tk-goal-ja">${esc(ev.perfect.ja)}</div></div>
    <div class="tk-fb-btns">
      <button class="btn btn-secondary" id="tk-retry">${ICONS.mic} 言い直す</button>
      <button class="btn btn-gold" id="tk-next">次へ ${ICONS.arrowRight}</button>
    </div>
    <div class="tk-saved">${saved?'✓ 表現ノートに保存しました（あとで言い直しドリル）':`<button class="tk-link" id="tk-save">＋ 表現ノートに保存</button>`}</div>
  </div>`;
}
function tkRPBindFeedback(){
  const r=tkRP;
  document.getElementById('tk-next').onclick=()=>{tkStopAll();r.step++;r.cur=null;tkRPAdvance()};
  document.getElementById('tk-retry').onclick=()=>{
    // 直前の回答を取り消して同じターンをやり直す
    r.history.pop();r.results.pop();r.phase='await';r.cur=null;tkRPRender();
  };
  const sv=document.getElementById('tk-save');
  if(sv)sv.onclick=()=>{const ev=r.cur.ev;tkAddNote({said:r.cur.said,better:ev.perfect.en,ja:ev.perfect.ja,why:ev.issues.map(i=>i.ja).slice(0,2).join(' / '),src:r.conv.title});addXP('talk_note');r.cur.saved=true;tkRPRender()};
}
function tkRPSummaryHTML(){
  const r=tkRP;const res=r.results.filter(x=>!x.skipped);
  const avg=res.length?Math.round(res.reduce((a,x)=>a+x.score,0)/res.length):0;
  const wpm=tkWpm(r.words,r.speechSec);
  return `<div class="tk-act tk-sum">
    <div class="tk-sum-top">${tkRing(avg,104)}<div><div class="tk-fb-label">${avg>=85?'Excellent!':avg>=65?'Well done!':'Nice try!'}</div><div class="tk-fb-meta">${res.length}/${r.results.length}ターンを自力で回答${r.speechSec?` · 発話 ${Math.round(r.speechSec)}秒`:''}${wpm?` · ${wpm} wpm`:''}</div></div></div>
    <div class="tk-sum-list">${r.results.map(x=>`<div class="tk-sum-row"><span class="tk-best ${x.skipped?'lo':x.score>=85?'hi':x.score>=60?'mid':'lo'}">${x.skipped?'—':x.score}</span><div><div class="tk-sum-said">${x.skipped?'<i>スキップ</i>':esc(x.said)}</div><div class="tk-sum-better">→ ${esc(x.better)}</div></div></div>`).join('')}</div>
    <div class="tk-fb-btns"><button class="btn btn-secondary" id="tk-again">${ICONS.mic} もう一度</button>${tkInSession()?'':`<button class="btn btn-gold" id="tk-hub">Talkへ ${ICONS.arrowRight}</button>`}</div>${tkInSession()?sessionNavHTML():''}
  </div>`;
}
function tkRPBindSummary(){
  const r=tkRP;const t=talkData();
  const res=r.results.filter(x=>!x.skipped);
  const avg=res.length?Math.round(res.reduce((a,x)=>a+x.score,0)/res.length):0;
  if(!r.recorded){
    r.recorded=true;
    if(res.length){t.best[r.conv.id]=Math.max(t.best[r.conv.id]||0,avg);commit()}
    if(typeof completeConv==='function'&&res.length){const prev=curScenario;curScenario=r.sid;completeConv(r.conv.id);curScenario=prev}
    if(avg>=80)launchConfetti();
  }
  document.getElementById('tk-again').onclick=()=>openRoleplay(r.sid,r.conv.id);
  const hb=document.getElementById('tk-hub');if(hb)hb.onclick=renderTalkHub;
}

/* ========== 1分スピーチ ========== */
const TK_SPEECH=[
  {id:'intro',ja:'初対面の人に自己紹介',en:'Introduce yourself to someone you just met.',keys:["I'm from","I work","in my free time","nice to meet you"],model:"Hi, nice to meet you! I'm Ken, and I'm from Tokyo, Japan. I work as a project manager at an IT company. In my free time, I love traveling and trying new food. This is actually my first time in Florida, so I'm really excited to be here."},
  {id:'trip',ja:'今回の旅行プランを説明',en:'Tell a cast member about your trip plan.',keys:["we're staying","for a week","we're planning to","can't wait"],model:"We're staying at a resort near the parks for a week. We're planning to spend four days at Walt Disney World and two days at the beach. My favorite park is Magic Kingdom, so we're going there first. I can't wait to see the fireworks!"},
  {id:'job',ja:'自分の仕事を説明',en:'Explain what you do for work.',keys:["I'm in charge of","my job is to","I work with","the best part"],model:"I work in human resources at a staffing company. I'm in charge of helping companies find the right people. My job is to talk with clients and job seekers every day. The best part is when someone finds a job they really love."},
  {id:'hometown',ja:'地元の紹介',en:'Describe your hometown.',keys:["it's famous for","you should","there are","if you visit"],model:"My hometown is a small city about an hour from Tokyo. It's famous for its hot springs and fresh vegetables. There are a lot of quiet temples, too. If you visit Japan, you should go there in autumn, because the leaves are beautiful."},
  {id:'food',ja:'おすすめの日本食を紹介',en:'Recommend a Japanese dish to a foreign friend.',keys:["you should try","it tastes","it's made with","my favorite"],model:"You should definitely try okonomiyaki. It's like a savory pancake made with cabbage, eggs, and pork. It tastes sweet and salty because of the sauce on top. My favorite place makes it right in front of you, so it's really fun, too."},
  {id:'weekend',ja:'週末にしたこと（過去形）',en:'Talk about what you did last weekend.',keys:["last weekend","I went","it was","after that"],model:"Last weekend, I went to a new cafe near my station with my friend. It was really crowded, but the coffee was amazing. After that, we walked around a park and took a lot of photos. In the evening, I just relaxed at home and watched a movie."},
  {id:'why',ja:'英語を学ぶ理由',en:'Why are you learning English?',keys:["I want to be able to","because","my goal is","someday"],model:"I'm learning English because I want to be able to talk with people when I travel. Last time I went abroad, I couldn't order food smoothly, and it was frustrating. My goal is to have a real conversation with a cast member at Disney World. Someday, I'd also like to use English at work."},
  {id:'hotel',ja:'ホテルのトラブルを説明',en:'Explain a problem with your hotel room to the front desk.',keys:["there's a problem with","it doesn't work","could you","as soon as possible"],model:"Hi, I'm in room 512, and there's a problem with the air conditioner. It doesn't work at all, and the room is really hot. I tried turning it off and on, but nothing happened. Could you send someone to fix it as soon as possible? Or could I change rooms?"},
  {id:'lost',ja:'なくした物の特徴を説明',en:'Describe a bag you lost to the lost and found.',keys:["I lost","it's a","it has","I think I left it"],model:"Excuse me, I think I lost my bag. It's a small black backpack with a white logo on the front. It has my wallet and a camera inside. I think I left it on the bench near the carousel about thirty minutes ago. Has anyone turned it in?"},
  {id:'reco',ja:'おすすめを聞いて会話を広げる',en:'Ask a local for recommendations and react.',keys:["what would you recommend","that sounds","how about","thanks for"],model:"Excuse me, we're visiting for the first time. What would you recommend for dinner around here? Oh, that sounds great! How about something that's not too expensive? We're also looking for a place with a nice view. Thanks for the tip!"},
  {id:'disney',ja:'好きなディズニー作品を語る',en:'Talk about your favorite Disney movie or character.',keys:["my favorite","because","the scene where","it reminds me"],model:"My favorite Disney movie is Toy Story. I love it because it's funny, but it's also really emotional. The scene where the toys say goodbye to Andy always makes me cry. It reminds me of my own childhood and the toys I used to play with."},
  {id:'memory',ja:'思い出に残る旅行',en:'Describe a memorable trip.',keys:["the most memorable","we visited","I'll never forget","it was so"],model:"The most memorable trip was when I went to Hawaii with my family. We went to the beach every morning and ate lots of fresh fruit. I'll never forget watching the sunset from a mountain. It was so peaceful, and everyone was in a great mood."},
  {id:'routine',ja:'朝のルーティン',en:'Describe your morning routine.',keys:["I usually","first","then","before work"],model:"I usually wake up at six thirty. First, I drink a glass of water and check the news on my phone. Then I make a quick breakfast, usually toast and coffee. Before work, I study English for about ten minutes on the train."},
  {id:'doctor',ja:'医者に症状を説明',en:'Explain your symptoms to a doctor.',keys:["I've had","since","it hurts when","I'm allergic to"],model:"I've had a bad headache since yesterday morning, and I feel a little dizzy. I also have a slight fever. It hurts more when I stand up quickly. I took some painkillers, but they didn't help much. Oh, and I'm allergic to penicillin."},
  {id:'status',ja:'仕事の進捗を報告',en:'Give a quick project status update.',keys:["we're on track","so far","the next step","by the end of"],model:"Here's a quick update. So far, we've finished the design and about half of the development. We're on track for the release, but testing might take a little longer. The next step is to review the feedback from users. We should have everything ready by the end of the month."},
  {id:'opinion',ja:'意見を言う：旅行は計画派？',en:'Do you prefer planning trips or being spontaneous? Why?',keys:["I prefer","honestly","on the other hand","for example"],model:"I prefer planning my trips carefully. Honestly, it saves me a lot of time and stress. For example, at big theme parks, you need to book ride times in advance. On the other hand, I try to leave one free day, because the best memories often happen by accident."}
];
let tkSpeechState=null;
function renderSpeechList(){
  tkStopAll();const el=tkScreen();const t=talkData();
  el.innerHTML=tkBack('1分スピーチ')+`<p class="tk-note">テーマについて1分間、止まらずに話し続ける練習です。完璧さより「話し続ける力」。話し終えたら流暢さ・語彙・正確さ・キーフレーズを採点し、添削とお手本を表示します。</p>`+
    TK_SPEECH.map(p=>{const b=t.best['sp_'+p.id];return `<button class="tk-row" data-sp="${p.id}"><div><div class="tk-row-t">${esc(p.ja)}</div><div class="tk-row-s">${esc(p.en)}</div></div>${b!=null?`<span class="tk-best ${b>=85?'hi':b>=60?'mid':'lo'}">${b}</span>`:`<span class="tk-row-go">${ICONS.arrowRight}</span>`}</button>`}).join('');
  tkBindBack(renderTalkHub);
  el.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>openSpeech(b.dataset.sp));
  window.scrollTo(0,0);
}
function openSpeech(id){
  tkStopAll();const p=TK_SPEECH.find(x=>x.id===id);const el=tkScreen();
  tkSpeechState={p,text:'',phase:'ready',typing:!TK_SR};
  el.innerHTML=tkBack('1分スピーチ')+`
    <div class="tk-goal"><div class="tk-goal-l">テーマ</div><div class="tk-goal-ja lg">${esc(p.ja)}</div><div class="tk-goal-en sm">${esc(p.en)}</div>
      <div class="tk-goal-l" style="margin-top:10px">使えるとボーナス</div><div class="tk-keys">${p.keys.map(k=>`<span>${esc(k)}</span>`).join('')}</div></div>
    <div id="tk-sp-body"></div>`;
  tkBindBack(renderSpeechList);
  tkSpeechReady();window.scrollTo(0,0);
}
function tkSpeechReady(){
  const s=tkSpeechState;const body=document.getElementById('tk-sp-body');
  if(s.typing){
    body.innerHTML=`<div class="tk-act"><textarea id="tk-sp-input" class="ic-input" rows="5" placeholder="テーマについて英語で書いてみよう（声で話す練習が理想です）"></textarea><button class="btn btn-gold btn-block" id="tk-sp-send">採点する ${ICONS.arrowRight}</button>${TK_SR?`<div class="tk-subacts"><button class="tk-link" id="tk-sp-voice">🎙 声で話す</button></div>`:''}</div>`;
    document.getElementById('tk-sp-send').onclick=()=>{const v=document.getElementById('tk-sp-input').value.trim();if(v)tkSpeechResult(v,0)};
    const vb=document.getElementById('tk-sp-voice');if(vb)vb.onclick=()=>{s.typing=false;tkSpeechReady()};
    return;
  }
  body.innerHTML=`<div class="tk-act">
    <div class="tk-timer" id="tk-timer">60</div>
    <div class="tk-live tk-live-lg" id="tk-live">準備ができたらマイクを押してスタート。1分たつと自動で止まります。</div>
    <div class="tk-mic-wrap">${tkMicHTML('tk-mic','スピーチ開始')}</div>
    <div class="tk-subacts"><button class="tk-link" id="tk-sp-type">⌨ タイプで答える</button><button class="tk-link" id="tk-sp-model">お手本を先に聞く</button></div>
  </div>`;
  document.getElementById('tk-sp-type').onclick=()=>{tkStopAll();s.typing=true;tkSpeechReady()};
  document.getElementById('tk-sp-model').onclick=()=>speak(s.p.model,0.9);
  const mic=document.getElementById('tk-mic');const live=document.getElementById('tk-live');const timer=document.getElementById('tk-timer');
  mic.onclick=()=>{
    if(tkRec){tkRec.stop();return}
    if('speechSynthesis'in window)speechSynthesis.cancel();
    const t0=Date.now();mic.classList.add('mic-active');live.textContent='Go! 止まらずに話し続けよう…';live.classList.add('on');
    let finished=false;
    const h=tkListen({lang:'en-US',continuous:true,maxMs:61000,
      onInterim:txt=>{live.textContent=txt},
      onDone:(txt,meta)=>{
        if(finished)return;
        const el2=(Date.now()-t0)/1000;
        // continuous でも端末によっては途中で切れるので、1分未満なら続きから再開する
        if(!meta.error&&el2<58&&tkSpeechState&&tkSpeechState.phase==='rec'&&!tkSpeechState.stopReq){
          tkSpeechState.text=(tkSpeechState.text+' '+txt).trim();tkSpeechRestart(t0);return;
        }
        finished=true;clearInterval(s.timer);mic.classList.remove('mic-active');live.classList.remove('on');
        const all=(s.text+' '+txt).trim();
        if(meta.error&&!all){live.textContent=tkSrErrorMsg(meta.error);s.phase='ready';return}
        if(!all){live.textContent='聞き取れませんでした。もう一度どうぞ。';s.phase='ready';return}
        tkSpeechResult(all,Math.min(60,el2));
      },
      onError:c=>{mic.classList.remove('mic-active');live.textContent=tkSrErrorMsg(c)}});
    if(!h){mic.classList.remove('mic-active');return}
    s.phase='rec';s.text='';s.stopReq=false;
    mic.onclick=()=>{s.stopReq=true;if(tkRec)tkRec.stop()};
    clearInterval(s.timer);
    s.timer=setInterval(()=>{const left=Math.max(0,60-Math.floor((Date.now()-t0)/1000));if(timer)timer.textContent=left;timer.classList.toggle('low',left<=10);if(left<=0){clearInterval(s.timer);s.stopReq=true;if(tkRec)tkRec.stop()}},250);
  };
}
function tkSpeechRestart(t0){
  const s=tkSpeechState;const live=document.getElementById('tk-live');const mic=document.getElementById('tk-mic');
  const left=61000-(Date.now()-t0);
  tkListen({lang:'en-US',continuous:true,maxMs:left,
    onInterim:txt=>{if(live)live.textContent=(s.text+' '+txt).trim()},
    onDone:(txt,meta)=>{
      const el2=(Date.now()-t0)/1000;
      if(!meta.error&&el2<58&&s.phase==='rec'&&!s.stopReq){s.text=(s.text+' '+txt).trim();return tkSpeechRestart(t0)}
      clearInterval(s.timer);if(mic)mic.classList.remove('mic-active');
      const all=(s.text+' '+txt).trim();
      if(!all){if(live)live.textContent='聞き取れませんでした。もう一度どうぞ。';s.phase='ready';return}
      tkSpeechResult(all,Math.min(60,el2));
    }});
}
function tkSpeechScore(text,sec,p){
  const toks=tkTokens(text);const words=toks.length;
  const content=toks.filter(w=>!TK_STOP.has(w));const uniq=new Set(content.map(tkStem)).size;
  const fillers=(text.toLowerCase().match(/\b(um+|uh+|er+|ah+|you know|like like)\b/g)||[]).length;
  const low=tkExpand(text);
  const keysHit=p.keys.filter(k=>low.includes(tkExpand(k).replace(/[^a-z' ]/g,'').trim()));
  // 音声認識は句読点が無いことが多いので、分割せず全文にルールを当てる（'short' は除外）
  const chk=tkCheck(text,{speech:true});
  const issues=chk.issues;
  const errs=issues.filter(i=>i.lv==='error').length,bet=issues.filter(i=>i.lv==='better').length;
  const wpm=sec?tkWpm(words,sec):0;
  const fluency=sec?Math.min(100,Math.round(wpm/110*100)):Math.min(100,Math.round(words/80*100));
  const volume=Math.min(100,Math.round(words/90*100));
  const vocab=Math.min(100,Math.round(uniq/32*100));
  const accuracy=Math.max(0,100-errs*14-bet*6-fillers*2);
  const keyScore=Math.round(keysHit.length/p.keys.length*100);
  const overall=Math.round(fluency*0.25+volume*0.2+vocab*0.2+accuracy*0.25+keyScore*0.1);
  return{words,wpm,uniq,fillers,keysHit,issues,fixed:chk.fixed,fluency,volume,vocab,accuracy,keyScore,overall};
}
function tkSpeechResult(text,sec){
  const s=tkSpeechState;s.phase='done';const p=s.p;const t=talkData();
  const sc=tkSpeechScore(text,sec,p);
  t.best['sp_'+p.id]=Math.max(t.best['sp_'+p.id]||0,sc.overall);
  talkLog('sp',sc.overall,sec||0);addXP('talk_speech');
  if(sc.issues.some(i=>i.lv!=='tip')){
    tkAddNote({said:text.length>160?text.slice(0,157)+'…':text,better:sc.fixed.length>200?sc.fixed.slice(0,197)+'…':sc.fixed,ja:p.ja,why:sc.issues.map(i=>i.ja).slice(0,2).join(' / '),src:'1分スピーチ'});
  }
  if(sc.overall>=80)launchConfetti();sfx(sc.overall>=60?'correct':'tap');
  const L=sc.overall<40?'A1':sc.overall<55?'A2':sc.overall<70?'B1':sc.overall<85?'B2':'C1';
  const metrics=[['流暢さ',sc.fluency,sc.wpm?sc.wpm+' wpm':''],['発話量',sc.volume,sc.words+' 語'],['語彙の幅',sc.vocab,sc.uniq+' 種類'],['正確さ',sc.accuracy,sc.issues.length?sc.issues.length+' 件指摘':'ミスなし'],['キーフレーズ',sc.keyScore,sc.keysHit.length+'/'+p.keys.length]];
  document.getElementById('tk-sp-body').innerHTML=`<div class="tk-act tk-fb">
    <div class="tk-fb-top">${tkRing(sc.overall,96)}<div><div class="tk-fb-label">Speaking ${L}</div><div class="tk-fb-meta">${sec?Math.round(sec)+'秒':'テキスト'} · ${sc.words}語${sc.fillers?` · つなぎ語 ${sc.fillers}回`:''}</div></div></div>
    <div class="tk-metrics">${metrics.map(([l,v,m])=>`<div class="tk-metric"><div class="tk-metric-h"><span>${l}</span><span>${m}</span></div><div class="tk-mini-bar"><i style="width:${v}%"></i></div></div>`).join('')}</div>
    <div class="tk-fb-sec"><div class="tk-fb-h">あなたのスピーチ</div><div class="tk-said">${tkMarkIssues(text,sc.issues)}</div></div>
    ${tkIssueHTML(sc.issues)}
    ${sc.issues.some(i=>i.lv!=='tip')?`<div class="tk-fb-sec"><div class="tk-fb-h">直すと</div><div class="tk-better">${esc(sc.fixed)} ${tkSayBtn(sc.fixed,0.9)}</div></div>`:''}
    <div class="tk-fb-sec"><div class="tk-fb-h">お手本スピーチ</div><div class="tk-better tk-model">${esc(p.model)} ${tkSayBtn(p.model,0.9)}</div></div>
    <div class="tk-tipbox">${sc.wpm&&sc.wpm<80?'💡 速さより「止まらない」ことが大事。言葉に詰まったら Well… / Let me see… でつなごう。':sc.vocab<50?'💡 同じ単語が多め。お手本の表現を1つ借りて、次は使ってみよう。':sc.keyScore<50?'💡 キーフレーズを1つ入れるだけで、話の構成がぐっと自然になります。':'💡 いい流れです！次はお手本より長く、具体例を1つ足してみよう。'}</div>
    <div class="tk-fb-btns"><button class="btn btn-secondary" id="tk-sp-again">${ICONS.mic} もう一度</button>${tkInSession()?'':`<button class="btn btn-gold" id="tk-sp-list">テーマ一覧 ${ICONS.arrowRight}</button>`}</div>${tkInSession()?sessionNavHTML():''}
  </div>`;
  tkBindSay(document.getElementById('tk-sp-body'));
  document.getElementById('tk-sp-again').onclick=()=>openSpeech(p.id);
  const sl=document.getElementById('tk-sp-list');if(sl)sl.onclick=renderSpeechList;
  document.querySelector('.tk-fb').scrollIntoView({behavior:PREF_REDUCED?'auto':'smooth',block:'start'});
}

/* ========== 発音ジム（ミニマルペア） ========== */
const TK_GYM=[
  {id:'lr',name:'L と R',ja:'日本人最大の壁。舌が歯ぐきに付く(L)か、どこにも付かない(R)か。',pairs:[['light','right'],['lice','rice'],['lead','read'],['glass','grass'],['collect','correct'],['fly','fry'],['lock','rock'],['play','pray'],['long','wrong'],['climb','crime']]},
  {id:'th',name:'TH と S',ja:'舌先を前歯に当てて息を出す TH。「ス」で代用すると別の単語に。',pairs:[['think','sink'],['thick','sick'],['thank','sank'],['math','mass'],['mouth','mouse'],['thing','sing'],['worth','worse']]},
  {id:'vb',name:'V と B',ja:'V は上の歯で下唇に触れる。B は両唇。',pairs:[['very','berry'],['vest','best'],['vote','boat'],['van','ban'],['curve','curb'],['vet','bet']]},
  {id:'fh',name:'F と H',ja:'F は歯と唇の摩擦音。日本語の「フ」は H 寄りになりがち。',pairs:[['fall','hall'],['food','hood'],['fair','hair'],['feet','heat'],['fold','hold'],['fire','hire']]},
  {id:'si',name:'SI と SHI',ja:'sea を「シー」と言うと she に。口角を引いて細い息で。',pairs:[['sea','she'],['seat','sheet'],['sip','ship'],['sell','shell'],['sort','short'],['save','shave']]},
  {id:'ae',name:'æ と ʌ',ja:'cat（口を横に大きく）と cut（小さく短く）。どちらも「ア」ではない。',pairs:[['hat','hut'],['cat','cut'],['bag','bug'],['fan','fun'],['match','much'],['ran','run']]},
  {id:'wk',name:'walk と work',ja:'walk は口を縦に開ける「オー」、work は舌を丸めた曖昧な「アー」。',pairs:[['walk','work'],['warm','worm'],['born','burn'],['ward','word'],['torn','turn']]}
];
let tkGym=null;
function renderGym(){
  tkStopAll();const el=tkScreen();const t=talkData();
  el.innerHTML=tkBack('発音ジム')+`<p class="tk-note">日本人が苦手な音のペア（ミニマルペア）を集中トレーニング。まず<b>聞き分け</b>で耳を作り、次に<b>言い分け</b>で音声認識に正しく伝わるか確かめます。</p>`+
    TK_GYM.map(g=>{const s=t.gym[g.id]||{};const la=s.ln?Math.round(s.lok/s.ln*100):null,sa=s.sn?Math.round(s.sok/s.sn*100):null;
      return `<div class="card tk-gym-card"><div class="tk-gym-h"><div><div class="tk-row-t">${esc(g.name)}</div><div class="tk-row-s">${esc(g.ja)}</div></div></div>
        <div class="tk-gym-ex">${g.pairs.slice(0,3).map(p=>`<span>${p[0]} / ${p[1]}</span>`).join('')}</div>
        <div class="tk-fb-btns"><button class="btn btn-secondary" data-gl="${g.id}">👂 聞き分け${la!=null?` <small>${la}%</small>`:''}</button><button class="btn btn-gold" data-gs="${g.id}" ${TK_SR?'':'disabled'}>🎙 言い分け${sa!=null?` <small>${sa}%</small>`:''}</button></div></div>`}).join('');
  tkBindBack(renderTalkHub);
  el.querySelectorAll('[data-gl]').forEach(b=>b.onclick=()=>startGym(b.dataset.gl,'listen'));
  el.querySelectorAll('[data-gs]').forEach(b=>b.onclick=()=>startGym(b.dataset.gs,'speak'));
  window.scrollTo(0,0);
}
function startGym(id,mode){
  const g=TK_GYM.find(x=>x.id===id);
  const qs=[];const N=mode==='listen'?10:6;
  for(let i=0;i<N;i++){const pr=g.pairs[i%g.pairs.length];const k=Math.random()<0.5?0:1;qs.push({pair:pr,ans:k})}
  qs.sort(()=>Math.random()-0.5);
  tkGym={g,mode,qs,i:0,ok:0};
  renderGymQ();
}
function renderGymQ(){
  const el=tkScreen();const G=tkGym;
  if(G.i>=G.qs.length)return renderGymDone();
  const q=G.qs[G.i];const target=q.pair[q.ans];const other=q.pair[1-q.ans];
  const head=tkBack(G.g.name+(G.mode==='listen'?' · 聞き分け':' · 言い分け'))+`<div class="rv-prog tk-prog"><div class="rv-prog-fill" style="width:${G.i/G.qs.length*100}%"></div></div>`;
  if(G.mode==='listen'){
    el.innerHTML=head+`<div class="tk-act tk-gym-q"><div class="tk-goal-l">どちらが聞こえた？</div>
      <button class="tk-mic tk-play-big" id="tk-g-play" aria-label="もう一度聞く">${ICONS.play}</button>
      <div class="tk-pair">${q.pair.map((w,k)=>`<button class="tk-pair-b" data-k="${k}">${esc(w)}</button>`).join('')}</div>
      <div id="tk-g-fb" class="tk-live"></div></div>`;
    const play=()=>speak(target,0.8);
    document.getElementById('tk-g-play').onclick=play;setTimeout(play,250);
    el.querySelectorAll('.tk-pair-b').forEach(b=>b.onclick=()=>{
      const k=+b.dataset.k;const ok=k===q.ans;if(ok)G.ok++;
      el.querySelectorAll('.tk-pair-b').forEach(x=>{x.disabled=true;if(+x.dataset.k===q.ans)x.classList.add('ok');else if(x===b)x.classList.add('ng')});
      sfx(ok?'correct':'wrong');
      const fb=document.getElementById('tk-g-fb');
      fb.innerHTML=`${ok?'正解！':'正解は <b>'+esc(target)+'</b>'} <button class="tk-link" data-tksay="${esc(target)}" data-rate="0.8">▶ ${esc(target)}</button> <button class="tk-link" data-tksay="${esc(other)}" data-rate="0.8">▶ ${esc(other)}</button>`;
      tkBindSay(fb);
      setTimeout(()=>{if(tkGym===G&&G.qs[G.i]===q){G.i++;renderGymQ()}},ok?900:2600);
    });
  }else{
    el.innerHTML=head+`<div class="tk-act tk-gym-q"><div class="tk-goal-l">この単語を言ってみよう</div>
      <div class="tk-gym-word">${esc(target)}</div><div class="tk-row-s">（ペア：${esc(other)}）</div>
      <div class="tk-mic-wrap">${tkMicHTML('tk-mic','話す')}</div>
      <div class="tk-subacts"><button class="tk-link" data-tksay="${esc(target)}" data-rate="0.8">▶ お手本</button><button class="tk-link" id="tk-g-skip">スキップ</button></div>
      <div id="tk-g-fb" class="tk-live">「${esc(target)}」だけ、または「I said ${esc(target)}.」と文で言ってもOK。</div></div>`;
    tkBindSay(el);
    document.getElementById('tk-g-skip').onclick=()=>{tkStopAll();G.i++;renderGymQ()};
    const mic=document.getElementById('tk-mic');const fb=document.getElementById('tk-g-fb');
    mic.onclick=()=>{
      if(tkRec){tkRec.stop();return}
      mic.classList.add('mic-active');fb.textContent='Listening…';
      tkListen({lang:'en-US',alts:5,maxMs:6000,onInterim:x=>{fb.textContent=x},
        onDone:(txt,meta)=>{mic.classList.remove('mic-active');
          if(meta.error){fb.textContent=tkSrErrorMsg(meta.error);return}
          if(!txt){fb.textContent='聞き取れませんでした。もう一度どうぞ。';return}
          const has=(s,w)=>tkTokens(s).some(x=>x===w||tkStem(x)===tkStem(w));
          const top=meta.alts[0]||txt;
          let res,ok=false;
          if(has(top,target)&&!has(top,other)){res=`<b class="tk-ok">伝わった！</b> 「${esc(target)}」と認識されました。`;ok=true}
          else if(has(top,other)){res=`<b class="tk-ng">「${esc(other)}」に聞こえました。</b><div class="tk-tipbox">${esc(TK_SOUNDS.find(s=>s.id===G.g.id)?.tip||G.g.ja)}</div>`}
          else if(meta.alts.some(a=>has(a,target))){res=`<b class="tk-mid">惜しい！</b> 候補には入りましたが、1番ではありませんでした（認識: ${esc(top)}）。`;ok=true}
          else{const d=tkDiagnose([{want:target,heard:tkTokens(top).slice(-1)[0]||''}]);res=`<b class="tk-ng">「${esc(top)}」と認識されました。</b>${d.length?`<div class="tk-tipbox">${esc(d[0].name)}：${esc(d[0].tip)}</div>`:''}`}
          if(ok)G.ok++;sfx(ok?'correct':'wrong');
          fb.innerHTML=res+`<div class="tk-fb-btns"><button class="btn btn-secondary" id="tk-g-retry">${ICONS.mic} もう一度</button><button class="btn btn-gold" id="tk-g-next">次へ ${ICONS.arrowRight}</button></div>`;
          document.getElementById('tk-g-retry').onclick=()=>{if(ok)G.ok--;renderGymQ()};
          document.getElementById('tk-g-next').onclick=()=>{G.i++;renderGymQ()};
        },
        onError:c=>{mic.classList.remove('mic-active');fb.textContent=tkSrErrorMsg(c)}});
    };
  }
  tkBindBack(renderGym);
}
function renderGymDone(){
  const G=tkGym;const t=talkData();const s=t.gym[G.g.id]||(t.gym[G.g.id]={});
  const pct=Math.round(G.ok/G.qs.length*100);
  if(G.mode==='listen'){s.lok=(s.lok||0)+G.ok;s.ln=(s.ln||0)+G.qs.length}else{s.sok=(s.sok||0)+G.ok;s.sn=(s.sn||0)+G.qs.length}
  commit();talkLog('gym',pct,G.mode==='speak'?G.qs.length*2:0);addXP('talk_gym');
  if(pct>=80)launchConfetti();
  const el=tkScreen();
  el.innerHTML=tkBack(G.g.name)+`<div class="tk-act tk-sum"><div class="tk-sum-top">${tkRing(pct,104)}<div><div class="tk-fb-label">${G.ok}/${G.qs.length} ${pct>=80?'Great ear!':pct>=60?'Good!':'Keep training!'}</div><div class="tk-fb-meta">${G.mode==='listen'?'聞き分け':'言い分け'} · ${esc(G.g.name)}</div></div></div>
    <div class="tk-tipbox">${esc(TK_SOUNDS.find(x=>x.id===G.g.id)?.tip||G.g.ja)}</div>
    <div class="tk-fb-btns"><button class="btn btn-secondary" id="tk-g-again">もう一度</button><button class="btn btn-gold" id="tk-g-other">${G.mode==='listen'&&TK_SR?'言い分けへ':'ジムへ戻る'} ${ICONS.arrowRight}</button></div></div>`;
  tkBindBack(renderGym);
  document.getElementById('tk-g-again').onclick=()=>startGym(G.g.id,G.mode);
  document.getElementById('tk-g-other').onclick=()=>G.mode==='listen'&&TK_SR?startGym(G.g.id,'speak'):renderGym();
}

/* ========== 表現ノート（言い直しドリル） ========== */
let tkND=null;
function renderNotes(){
  tkStopAll();const el=tkScreen();const t=talkData();const due=tkDueNotes();
  el.innerHTML=tkBack('表現ノート')+`<p class="tk-note">ロールプレイやスピーチで添削された表現が自動で集まります。「言い直しドリル」で正しい形を声に出すと定着し、間隔をあけて再出題されます。</p>
    ${due.length?`<button class="btn btn-gold btn-block" id="tk-nd-start">${ICONS.mic} 言い直しドリル（${due.length}件）</button>`:`<div class="tk-tipbox">今日の言い直しはありません。${t.notes.length?'':'ロールプレイで話すと、ここに表現がたまっていきます。'}</div>`}
    <div class="tk-notes">${t.notes.map(n=>`<div class="card tk-note-card">
      <div class="tk-note-src">${esc(n.src||'')} · ${n.box>=TK_BOX_DAYS.length?'習得済み':'Lv'+n.box}</div>
      ${n.said?`<div class="tk-note-said">${esc(n.said)}</div>`:''}
      <div class="tk-note-better">${esc(n.better)} ${tkSayBtn(n.better,0.9)}</div>
      ${n.why?`<div class="tk-note-why">${esc(n.why)}</div>`:''}
      <button class="tk-link tk-note-del" data-del="${n.id}">削除</button></div>`).join('')}</div>`;
  tkBindBack(renderTalkHub);tkBindSay(el);
  const st=document.getElementById('tk-nd-start');if(st)st.onclick=()=>{tkND={list:due.slice(0,10),i:0,ok:0};renderNoteDrill()};
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{t.notes=t.notes.filter(n=>n.id!==b.dataset.del);commit();renderNotes()});
  window.scrollTo(0,0);
}
function renderNoteDrill(){
  const el=tkScreen();const D=tkND;
  if(D.i>=D.list.length){
    talkLog('note',D.list.length?Math.round(D.ok/D.list.length*100):0,D.list.length*3);
    el.innerHTML=tkBack('言い直しドリル')+`<div class="tk-act tk-sum"><div class="tk-sum-top">${tkRing(Math.round(D.ok/Math.max(1,D.list.length)*100),104)}<div><div class="tk-fb-label">${D.ok}/${D.list.length} 言い直し成功</div><div class="tk-fb-meta">成功した表現は次の復習まで間隔が伸びます。</div></div></div><button class="btn btn-gold btn-block" id="tk-nd-done">ノートへ ${ICONS.arrowRight}</button></div>`;
    tkBindBack(renderNotes);document.getElementById('tk-nd-done').onclick=renderNotes;
    if(D.ok===D.list.length&&D.list.length)launchConfetti();
    return;
  }
  const n=D.list[D.i];const typing=!TK_SR||D.typing;
  el.innerHTML=tkBack('言い直しドリル')+`<div class="rv-prog tk-prog"><div class="rv-prog-fill" style="width:${D.i/D.list.length*100}%"></div></div>
    <div class="tk-act">
      <div class="tk-goal"><div class="tk-goal-l">伝えること</div><div class="tk-goal-ja lg">${esc(n.ja||'')}</div>${n.said?`<div class="tk-note-said">前回：${esc(n.said)}</div>`:''}</div>
      <div class="tk-reveal" id="tk-nd-ans" hidden><div class="tk-better">${esc(n.better)} ${tkSayBtn(n.better,0.9)}</div>${n.why?`<div class="tk-note-why">${esc(n.why)}</div>`:''}</div>
      <div class="tk-live" id="tk-live">正しい形で言ってみよう</div>
      ${typing?`<div class="tk-typebox"><textarea id="tk-input" class="ic-input" rows="2" placeholder="正しい英語を入力"></textarea><button class="btn btn-gold" id="tk-send">判定 ${ICONS.arrowRight}</button></div>`:`<div class="tk-mic-wrap">${tkMicHTML('tk-mic','話す')}</div>`}
      <div class="tk-subacts"><button class="tk-link" id="tk-nd-show">答えを見る</button>${TK_SR?`<button class="tk-link" id="tk-nd-type">${typing?'🎙 声で':'⌨ タイプで'}</button>`:''}</div>
    </div>`;
  tkBindBack(renderNotes);tkBindSay(el);
  const ans=document.getElementById('tk-nd-ans');
  document.getElementById('tk-nd-show').onclick=()=>{ans.hidden=false;speak(n.better,0.9)};
  const tb=document.getElementById('tk-nd-type');if(tb)tb.onclick=()=>{tkStopAll();D.typing=!typing;renderNoteDrill()};
  const judge=(said)=>{
    const al=tkAlign(said,n.better);const ok=al.score>=80;
    const t=talkData();const nn=t.notes.find(x=>x.id===n.id);
    if(nn){if(ok){nn.box=Math.min(TK_BOX_DAYS.length,nn.box+1);nn.due=addDays(TK_BOX_DAYS[Math.min(nn.box,TK_BOX_DAYS.length-1)])}else{nn.box=0;nn.due=addDays(1)}commit()}
    if(ok){D.ok++;addXP('talk_note')}
    sfx(ok?'correct':'wrong');ans.hidden=false;
    const diag=tkDiagnose(al.subs);
    document.getElementById('tk-live').innerHTML=`<div class="tk-align">${al.words.map((w,k)=>`<span class="sh-w ${al.marks[k]?'hit':'miss'}">${esc(w)}</span>`).join(' ')}</div><b class="${ok?'tk-ok':'tk-ng'}">${al.score}点 ${ok?'言えた！':'もう一息'}</b><div class="tk-row-s">認識：${esc(said)}</div>${diag.map(d=>`<div class="tk-tipbox">${esc(d.name)}（${esc(d.want)}→${esc(d.heard)}）：${esc(d.tip)}</div>`).join('')}
      <div class="tk-fb-btns"><button class="btn btn-secondary" id="tk-nd-retry">もう一度</button><button class="btn btn-gold" id="tk-nd-next">次へ ${ICONS.arrowRight}</button></div>`;
    document.getElementById('tk-nd-retry').onclick=()=>{if(ok)D.ok--;renderNoteDrill()};
    document.getElementById('tk-nd-next').onclick=()=>{D.i++;renderNoteDrill()};
  };
  if(typing){const inp=document.getElementById('tk-input');const go2=()=>{const v=inp.value.trim();if(v)judge(v)};document.getElementById('tk-send').onclick=go2;inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();go2()}});return}
  const mic=document.getElementById('tk-mic');const live=document.getElementById('tk-live');
  mic.onclick=()=>{if(tkRec){tkRec.stop();return}mic.classList.add('mic-active');live.textContent='Listening…';
    tkListen({lang:'en-US',maxMs:15000,onInterim:x=>{live.textContent=x},onDone:(txt,meta)=>{mic.classList.remove('mic-active');if(meta.error){live.textContent=tkSrErrorMsg(meta.error);return}if(!txt){live.textContent='聞き取れませんでした。もう一度どうぞ。';return}judge(txt)},onError:c=>{mic.classList.remove('mic-active');live.textContent=tkSrErrorMsg(c)}})};
}

/* ========== 旅行アシスト（本番用） ========== */
let _tkCorpus=null;
function tkCorpus(){
  if(_tkCorpus)return _tkCorpus;
  const out=[];const seen=new Set();
  const add=(en,ja,who,src,extra)=>{if(!en||!ja)return;const k=en.toLowerCase();if(seen.has(k))return;seen.add(k);
    const isThem=who==='them'||/セリフ/.test(ja);
    const jaClean=ja.replace(/（[^）]*セリフ[^）]*）/g,'').trim();
    out.push({en,ja:jaClean,who:isThem?'them':'me',src,...(extra||{})})};
  Object.keys(SCENARIOS).forEach(sid=>{const sc=SCENARIOS[sid];
    sc.phrases.forEach(p=>add(p.en,p.ja,'me',sc.titleJa));
    sc.conversations.forEach(c=>c.turns.forEach((tr,i)=>{
      if(tr.who==='char')add(tr.en,tr.ja,'them',sc.titleJa,{sid,cid:c.id,idx:i});
      else tr.choices.filter(x=>x.q!=='ng').forEach(x=>add(x.en,x.ja,'me',sc.titleJa));
    }));
  });
  if(typeof WDW_CATS!=='undefined')WDW_CATS.forEach(cat=>(WDW_PHRASES[cat.id]||[]).forEach(p=>add(p.en,p.ja,'me','WDW '+cat.ja)));
  _tkCorpus=out;return out;
}
function tkJaNorm(s){return String(s).replace(/（[^）]*）|\([^)]*\)/g,'').replace(/[\s、。！？!?,.・「」『』〜～…ー]/g,'').toLowerCase()}
function tkBigrams(s){const a=[];for(let i=0;i<s.length-1;i++)a.push(s.slice(i,i+2));if(s.length===1)a.push(s);return a}
function tkSearch(q){
  const C=tkCorpus();q=q.trim();if(!q)return[];
  const latin=/[a-z]/i.test(q)&&!/[ぁ-んァ-ン一-龥]/.test(q);
  const qb=tkBigrams(tkJaNorm(q));const qset=new Set(qb);
  return C.map(it=>{
    let s;
    if(latin)s=tkSim(it.en,q)*0.6+tkSim(q,it.en)*0.4;
    else{const ib=new Set(tkBigrams(tkJaNorm(it.ja)));let hit=0;qset.forEach(b=>{if(ib.has(b))hit++});
      const cov=qset.size?hit/qset.size:0;const dice=2*hit/(qset.size+ib.size||1);s=cov*0.75+dice*0.25}
    if(it.who==='them')s*=0.7;
    return{it,s};
  }).filter(x=>x.s>0.2).sort((a,b)=>b.s-a.s).slice(0,8).map(x=>x.it);
}
const TK_QUICK=[
  {en:"Sorry, could you say that again more slowly?",ja:"すみません、もう一度ゆっくり言ってもらえますか？"},
  {en:"Could you write it down, please?",ja:"書いてもらえますか？"},
  {en:"I'm sorry, I don't understand.",ja:"すみません、わかりません。"},
  {en:"Just a moment, please.",ja:"少々お待ちください。"},
  {en:"Could you show me on the map?",ja:"地図で教えてもらえますか？"},
  {en:"Yes, please.",ja:"はい、お願いします。"},
  {en:"No, thank you.",ja:"いいえ、結構です。"},
  {en:"Thank you so much for your help!",ja:"助けてくれて本当にありがとう！"}
];
const TK_SOS=[
  {en:"Help! Please call 911.",ja:"助けて！911に電話してください。"},
  {en:"I need a doctor.",ja:"医者が必要です。"},
  {en:"I lost my passport.",ja:"パスポートをなくしました。"},
  {en:"My wallet was stolen.",ja:"財布を盗まれました。"},
  {en:"I don't feel well.",ja:"気分が悪いです。"},
  {en:"I'm allergic to nuts.",ja:"ナッツアレルギーがあります。"},
  {en:"I can't find my child.",ja:"子どもが見つかりません。"},
  {en:"Where is the nearest hospital?",ja:"一番近い病院はどこですか？"}
];
const TK_GLOSS=('luggage=荷物,baggage=荷物,boarding=搭乗,gate=搭乗口,departure=出発,arrival=到着,delayed=遅延,canceled=欠航,cancelled=欠航,aisle=通路側,window=窓側,'+
  'passport=パスポート,declare=申告,purpose=目的,customs=税関,connecting=乗り継ぎ,transfer=乗り換え,terminal=ターミナル,shuttle=シャトル,'+
  'reservation=予約,check-in=チェックイン,checkout=チェックアウト,deposit=保証金,incidental=雑費,upgrade=アップグレード,amenities=設備,housekeeping=客室清掃,'+
  'available=空いている,fully=完全に,booked=予約済み,receipt=レシート,tax=税,tip=チップ,gratuity=チップ,included=込み,split=割り勘,'+
  'appetizer=前菜,entree=メイン料理,side=付け合わせ,dressing=ドレッシング,refill=おかわり,to-go=持ち帰り,allergy=アレルギー,allergies=アレルギー,'+
  'medium=ミディアム,rare=レア,sparkling=炭酸入り,still=炭酸なし,bottled=ボトル入り,tap=水道水,'+
  'height=身長,requirement=制限,wait=待ち時間,minutes=分,line=列,queue=列,exit=出口,entrance=入口,restroom=トイレ,stroller=ベビーカー,'+
  'refund=返金,exchange=交換,size=サイズ,fitting=試着,discount=割引,sale=セール,cash=現金,card=カード,sign=サイン,pin=暗証番号,'+
  'emergency=緊急,ambulance=救急車,pharmacy=薬局,prescription=処方箋,symptoms=症状,insurance=保険,police=警察,report=届け出,stolen=盗まれた,'+
  'ID=身分証,identification=身分証,valid=有効,expired=期限切れ,ma\'am=奥様,sir=お客様,folks=皆さん,awesome=最高,sure=もちろん,absolutely=もちろん,'+
  'recommend=おすすめ,special=本日のおすすめ,portion=量,spicy=辛い,mild=マイルド,vegetarian=ベジタリアン,parade=パレード,fireworks=花火,'+
  'fastpass=ファストパス,lightning=ライトニング,photopass=フォトパス,magicband=マジックバンド,resort=リゾート,bus=バス,monorail=モノレール,ferry=フェリー').split(',').reduce((m,x)=>{const [k,v]=x.split('=');m[k.toLowerCase()]=v;return m},{});
function renderAssist(){
  tkStopAll();const el=tkScreen();
  el.innerHTML=tkBack('旅行アシスト')+`
    <div class="tk-assist-tabs" role="tablist"><button class="on" data-at="say">言いたい</button><button data-at="hear">聞き取る</button><button data-at="sos">SOS</button></div>
    <div id="tk-assist-body"></div>`;
  tkBindBack(renderTalkHub);
  el.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{el.querySelectorAll('[data-at]').forEach(x=>x.classList.toggle('on',x===b));tkStopAll();tkAssistTab(b.dataset.at)});
  tkAssistTab('say');window.scrollTo(0,0);
}
function tkPhraseCard(it,i){
  return `<div class="card tk-ph"><div class="tk-ph-en">${esc(it.en)}</div><div class="tk-ph-ja">${esc(it.ja)}${it.src?` <span class="tk-ph-src">${esc(it.src)}${it.who==='them'?' · 相手のセリフ':''}</span>`:''}</div>
    <div class="tk-ph-acts">${tkSayBtn(it.en,0.9,null,'再生')}<button class="tk-link" data-tksay="${esc(it.en)}" data-rate="0.65">🐢 ゆっくり</button><button class="tk-link" data-show="${i}">📣 見せる</button></div></div>`;
}
function tkShowBig(it){
  const ov=document.createElement('div');ov.className='tk-show';ov.setAttribute('role','dialog');
  ov.innerHTML=`<div class="tk-show-en">${esc(it.en)}</div><div class="tk-show-ja">${esc(it.ja||'')}</div><div class="tk-show-hint">タップで閉じる · 画面を相手に見せてください</div>`;
  ov.onclick=()=>{ov.remove();if('speechSynthesis'in window)speechSynthesis.cancel()};
  document.body.appendChild(ov);speak(it.en,0.85);
}
function tkBindCards(root,list){
  tkBindSay(root);
  root.querySelectorAll('[data-show]').forEach(b=>b.onclick=()=>tkShowBig(list[+b.dataset.show]));
}
function tkAssistTab(tab){
  const body=document.getElementById('tk-assist-body');
  if(tab==='say'){
    body.innerHTML=`<div class="tk-search"><input id="tk-q" type="search" placeholder="例：トイレ / 窓側の席 / 返金したい" autocomplete="off">${TK_SR?`<button class="icon-btn" id="tk-q-mic" aria-label="日本語で話して検索">${ICONS.mic}</button>`:''}</div>
      <div class="tk-row-s" style="margin:6px 2px 12px">日本語でも英語でもOK。アプリ内の${tkCorpus().length}フレーズから探します（オフラインでも動作）。</div>
      <div id="tk-q-res"></div><div class="sec-title">${ICONS.zap} すぐ使える返し</div><div id="tk-quick"></div>`;
    const res=document.getElementById('tk-q-res');const q=document.getElementById('tk-q');
    const run=()=>{const list=tkSearch(q.value);res.innerHTML=q.value.trim()?(list.length?list.map(tkPhraseCard).join(''):`<div class="tk-tipbox">見つかりませんでした。短い言葉（例：「トイレ」「予約」）で試してください。</div>`):'';tkBindCards(res,list)};
    let tmr;q.oninput=()=>{clearTimeout(tmr);tmr=setTimeout(run,150)};
    const qm=document.getElementById('tk-q-mic');
    if(qm)qm.onclick=()=>{if(tkRec){tkRec.stop();return}qm.classList.add('mic-active');tkListen({lang:'ja-JP',maxMs:8000,onInterim:x=>{q.value=x},onDone:(x,m)=>{qm.classList.remove('mic-active');if(m.error){showToast(tkSrErrorMsg(m.error));return}if(x){q.value=x;run()}},onError:c=>{qm.classList.remove('mic-active');showToast(tkSrErrorMsg(c))}})};
    const qk=document.getElementById('tk-quick');qk.innerHTML=TK_QUICK.map(tkPhraseCard).join('');tkBindCards(qk,TK_QUICK);
  }else if(tab==='hear'){
    body.innerHTML=`<p class="tk-note">相手に「Could you say that again?」とお願いしてから、マイクを押して相手の英語を聞き取ります。文字にして、意味の近いフレーズと返し方を表示します。</p>
      <div class="tk-mic-wrap">${TK_SR?tkMicHTML('tk-h-mic','相手の英語を聞き取る'):''}</div>
      <div class="tk-live tk-live-lg" id="tk-h-live">${TK_SR?'マイクを押して、相手に話してもらいましょう':tkSrErrorMsg('unsupported')}</div>
      <div id="tk-h-res"></div>`;
    const mic=document.getElementById('tk-h-mic');if(!mic)return;
    const live=document.getElementById('tk-h-live');const res=document.getElementById('tk-h-res');
    mic.onclick=()=>{if(tkRec){tkRec.stop();return}mic.classList.add('mic-active');live.textContent='Listening…';res.innerHTML='';
      tkListen({lang:'en-US',maxMs:15000,onInterim:x=>{live.textContent=x},onDone:(x,m)=>{mic.classList.remove('mic-active');
        if(m.error){live.textContent=tkSrErrorMsg(m.error);return}
        if(!x){live.textContent='聞き取れませんでした。もう一度どうぞ。';return}
        live.textContent=x;tkHearResult(x,res)},onError:c=>{mic.classList.remove('mic-active');live.textContent=tkSrErrorMsg(c)}})};
  }else{
    body.innerHTML=`<p class="tk-note">緊急時は「見せる」で大きく表示し、そのまま相手に見せられます。米国の緊急番号は <b>911</b>。</p><div id="tk-sos"></div>`;
    const s=document.getElementById('tk-sos');s.innerHTML=TK_SOS.map(tkPhraseCard).join('');tkBindCards(s,TK_SOS);
  }
}
function tkHearResult(text,res){
  const C=tkCorpus();
  const matches=C.map(it=>({it,s:tkSim(text,it.en)*0.5+tkSim(it.en,text)*0.5})).filter(x=>x.s>0.3).sort((a,b)=>b.s-a.s).slice(0,3);
  const gloss=[...new Set(tkTokens(text))].filter(w=>TK_GLOSS[w]).slice(0,10);
  let replies=[];
  const top=matches[0]&&matches[0].it;
  if(top&&top.cid){const conv=SCENARIOS[top.sid].conversations.find(c=>c.id===top.cid);const next=conv&&conv.turns[top.idx+1];if(next&&next.who==='user')replies=next.choices.filter(c=>c.q!=='ng').map(c=>({en:c.en,ja:c.ja}))}
  res.innerHTML=`${gloss.length?`<div class="tk-gloss">${gloss.map(w=>`<span><b>${esc(w)}</b> ${esc(TK_GLOSS[w])}</span>`).join('')}</div>`:''}
    ${matches.length?`<div class="sec-title">${ICONS.globe} たぶんこういう意味</div>`+matches.map(m=>`<div class="card tk-ph"><div class="tk-ph-en">${esc(m.it.en)}</div><div class="tk-ph-ja">${esc(m.it.ja)}</div></div>`).join(''):`<div class="tk-tipbox">近いフレーズが見つかりませんでした。「Could you say that again more slowly?」とお願いしてみましょう。</div>`}
    ${replies.length?`<div class="sec-title">${ICONS.mic} こう返そう</div><div id="tk-h-rep"></div>`:''}
    <div class="sec-title">${ICONS.zap} 聞き返す</div><div id="tk-h-q"></div>`;
  if(replies.length){const r=document.getElementById('tk-h-rep');r.innerHTML=replies.map(tkPhraseCard).join('');tkBindCards(r,replies)}
  const qq=TK_QUICK.slice(0,3);const qd=document.getElementById('tk-h-q');qd.innerHTML=qq.map(tkPhraseCard).join('');tkBindCards(qd,qq);
}

/* ========== 今日のトレーニング（1本道セッション）との接続 ========== */
function tkInSession(){return typeof inDaySession==='function'&&inDaySession()}
function tkPlanRoleplay(){
  // 14会話を日替わりで回し、まだ80点未満の会話を優先
  const all=[];Object.keys(SCENARIOS).forEach(sid=>SCENARIOS[sid].conversations.forEach(c=>all.push([sid,c.id])));
  const t=talkData();const start=(typeof planDayNum==='function'?planDayNum():new Date().getDate())%all.length;
  let pick=all[start];
  for(let k=0;k<all.length;k++){const x=all[(start+k)%all.length];if((t.best[x[1]]||0)<80){pick=x;break}}
  openRoleplay(pick[0],pick[1]);
}
function tkPlanSpeech(){
  if(curTab!=='talk'){curTab='talk';buildNav()}
  const t=talkData();const start=(typeof planDayNum==='function'?planDayNum():new Date().getDate())%TK_SPEECH.length;
  let p=TK_SPEECH[start];
  for(let k=0;k<TK_SPEECH.length;k++){const x=TK_SPEECH[(start+k)%TK_SPEECH.length];if(t.best['sp_'+x.id]==null){p=x;break}}
  openSpeech(p.id);
}

/* ========== 既存画面との接続 ========== */
function tkInstall(){
  Object.assign(XP_TABLE,{talk_turn:8,talk_great:12,talk_speech:25,talk_gym:15,talk_note:5});
  // タブ移動時はマイクを止める
  const _go=go;go=function(tab){tkStopAll();return _go(tab)};
  // シナリオ詳細の「Conversation」に自由回答モードへの入口を追加
  const _rcl=renderConvList;
  renderConvList=function(body){
    _rcl(body);
    const sc=SCENARIOS[curScenario];if(!sc)return;
    body.insertAdjacentHTML('afterbegin',`<div class="card tk-cta" role="button" tabindex="0" id="tk-cta-conv"><span class="tk-mode-ic">${ICONS.mic}</span><div><div class="sc-title">自由回答モードで話す</div><div class="sc-ja">選択肢なし。自分の言葉で答えて、添削を受けよう</div></div></div>`);
    const b=document.getElementById('tk-cta-conv');
    const open=()=>{go('talk');openRoleplay(curScenario,sc.conversations[0].id)};
    b.onclick=open;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}};
  };
  // ホームに今日の英会話カードを追加
  const _rh=renderHome;
  renderHome=function(){
    _rh();
    const home=document.getElementById('screen-home');if(!home)return;
    const due=tkDueNotes().length;const lv=tkLevel();
    const sids=Object.keys(SCENARIOS);const sid=sids[new Date().getDate()%sids.length];const sc=SCENARIOS[sid];const conv=sc.conversations[new Date().getDate()%sc.conversations.length];
    const card=document.createElement('div');
    card.className='card glow-card tk-home';card.setAttribute('role','button');card.tabIndex=0;
    card.innerHTML=`<div class="tk-home-l"><span class="tk-mode-ic">${ICONS.mic}</span><div><div class="sc-title">今日の英会話</div><div class="sc-ja">${esc(sc.titleJa)}：${esc(conv.titleJa)} を自分の言葉で${due?` · 言い直し ${due}件`:''}</div></div></div><span class="tk-home-lv">${lv.code}</span>`;
    const open=()=>{go('talk');openRoleplay(sid,conv.id)};
    card.onclick=open;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}};
    const focus=home.querySelector('.focus-card');
    if(focus&&focus.parentNode===home)focus.after(card);else home.prepend(card);
  };
  if(typeof curTab!=='undefined'&&curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome();
}
if(typeof go==='function')tkInstall();
