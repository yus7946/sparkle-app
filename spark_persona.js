/* ========== Spark の性格（口癖・しぐさ・話し方） ==========
   ・孵化のときに 6つの性格のどれかがランダムで決まる（9種類 × 6性格 = 54通りの相棒）
   ・性格ごとに：口癖／ふだんの顔（spark_yuru.js）／しぐさ（待機・タップの動き＝CSS）／セリフ集／話し方の変換
   ・すでに生まれている Spark には、次に開いたときに性格が決まる
   ・Sparkのへやで性格を確認、100コインで「性格チェンジ」
   ・すべてオリジナル（特定の作品のキャラクターや口癖は使わない）
   spark.js / closet.js / spark_yuru.js の後に読み込む。 */
'use strict';

const SPK_PERSONAS=[
  {id:'genki',name:'元気いっぱい',kuse:'〜だよっ！',gesture:'ぴょんぴょん跳ねる',desc:'いつでも全力。ほめ上手で、正解するといっしょに跳ねて喜ぶ。',
   intro:'はじめましてだよっ！ いっしょに毎日がんばろっ！',
   lines:{hello:[['きょうもやるよっ！','Let\'s go!'],['5分だけでも、いっしょならたのしいよっ！','5 minutes is fun together!'],['会えてうれしいよっ！','So happy to see you!']],
     win:[['やったー！ すごいすごいっ！','Yay! Amazing!'],['いまの、完ぺきだったよっ！','That was perfect!'],['このまま本番もいけちゃうよっ！','You\'re test-ready!']],
     cheer:[['だいじょうぶだよっ！ 次いこっ！','It\'s okay, next one!'],['間違えたとこ、いちばん伸びるとこだよっ！','Mistakes = growth!'],['まだまだいけるよっ！','You\'ve got this!']],
     study:[['集中モードだよっ！','Focus mode!'],['1問ずつ、いこっ！','One at a time!']]},
   poke:[['くすぐったいよっ！','That tickles!'],['なになにっ？ 遊ぶっ？','Wanna play?']]},
  {id:'nonbiri',name:'のんびり',kuse:'〜だね〜',gesture:'ゆらゆら揺れて、ときどき眠る',desc:'マイペースで、あせらせない。ゆっくりでも続けることをいちばんほめてくれる。',
   intro:'ふわぁ…はじめまして〜。ゆっくりいこうね〜',
   lines:{hello:[['きょうも、ちょっとだけやろうね〜','Just a little today~'],['ゆっくりでいいんだよ〜','No rush~'],['ふわぁ…会えてうれしいね〜','*yawn* Nice to see you~']],
     win:[['わぁ〜、できたね〜','Oh~ you did it~'],['すごいね〜、いい調子だね〜','Nice pace~'],['ちゃんと身についてるね〜','It\'s sinking in~']],
     cheer:[['だいじょうぶだよ〜、また明日もあるし〜','There\'s always tomorrow~'],['間違えても、ゆっくり覚えればいいね〜','Learn it slowly~'],['休みながらでいいからね〜','Take breaks~']],
     study:[['のんびり集中だね〜','Calm focus~'],['ひと息ついてからでもいいよ〜','Breathe first~']]},
   poke:[['ん〜…？ ねむいね〜','Mmm... sleepy~'],['ゆらゆら〜','Sway sway~']]},
  {id:'ganbari',name:'がんばり屋',kuse:'よしっ',gesture:'ぐっと力をためてジャンプ',desc:'目標まっしぐら。小さな前進も見逃さず「あと少し！」と背中を押してくれる。',
   intro:'よしっ！ はじめまして！ 650点まで、いっしょに走りきるぞ！',
   lines:{hello:[['よしっ、きょうのメニューいくぞ！','Alright, let\'s go!'],['今日の1歩が、本番の1点だ！','Every step counts!'],['よしっ、まずは最低ラインから！','Start with the minimum!']],
     win:[['よしっ！ 狙いどおり！','Yes! Right on target!'],['その調子だ！ 次も取るぞ！','Keep it up!'],['今日の自分に勝ったな！','You beat yesterday\'s you!']],
     cheer:[['よしっ、次で取り返すぞ！','We\'ll get it back!'],['間違いは、伸びしろだ！','Mistakes are room to grow!'],['ここで止まらないのが強さだ！','Not stopping is strength!']],
     study:[['よしっ、集中！','Focus!'],['あと少しだ、いけるぞ！','Almost there!']]},
   poke:[['よしっ！ 気合い入った！','Fired up!'],['なんだ？ 特訓か！？','Training time?']]},
  {id:'shy',name:'はずかしがり',kuse:'あ、あの…',gesture:'照れてもじもじ、ほっぺが赤くなる',desc:'ひかえめだけど、いちばん近くで見守ってくれる。小さな一言が、じんわりうれしい。',
   intro:'あ、あの…はじめまして…。いっしょに、がんばれたら…うれしい、です…',
   lines:{hello:[['あ、あの…きょうも、いっしょにやりませんか…？','W-want to study together?'],['…会えて、ちょっとうれしい、です','...Happy to see you.'],['5分だけでも…いい、ですか…？','Just 5 minutes...?']],
     win:[['す、すごい…！ えへへ…','W-wow...! Hehe...'],['…いまの、かっこよかった、です','...That was cool.'],['わ、わたしまでうれしくなっちゃう…','I\'m happy too...']],
     cheer:[['だ、だいじょうぶ…です。次は、きっと…','It\'s okay... next time...'],['間違えても…わたしは、ずっといます…','I\'ll still be here...'],['…いっしょに、もう1回、やってみませんか…？','Try once more together?']],
     study:[['し、静かに…集中、ですね…','Quiet focus...'],['…がんばって、ます、ね','You\'re doing great...']]},
   poke:[['ひゃっ…！ び、びっくりしました…','Eek...!'],['…え、えへへ…','...Hehe...']]},
  {id:'monoshiri',name:'物知り',kuse:'ふむふむ',gesture:'メガネで首をかしげて、うなずく',desc:'英語の豆知識が大好き。間違えたとき「なぜそうなるか」をいっしょに考えてくれる。',
   intro:'ふむふむ、はじめまして。英語のしくみ、いっしょに解き明かしていこう',
   lines:{hello:[['ふむふむ。今日は何を学ぼうか','Hmm, what shall we learn?'],['ふむふむ、毎日少しずつが、いちばん記憶に残るんだ','Little by little sticks best.'],['豆知識：英語は「強く読む語」でリズムが決まるんだよ','Fun fact: stress makes rhythm.']],
     win:[['ふむふむ、理解が深まってきたね','Your understanding is deepening.'],['見事。その考え方で正解だ','Excellent reasoning.'],['いまの正解、根拠まで言えたら完ぺきだね','Can you explain why? Perfect.']],
     cheer:[['ふむふむ、間違いには必ず理由がある。解説を見てみよう','Every mistake has a reason.'],['ここは日本人がよくつまずく所なんだ','A common trap for Japanese learners.'],['仕組みがわかれば、次は迷わないよ','Know the rule, don\'t hesitate.']],
     study:[['ふむふむ、集中しているね','Deep focus, I see.'],['考えるより先に、パターンで解けると速いよ','Patterns beat thinking.']]},
   poke:[['ふむ？ 質問かな？','Hm? A question?'],['ふむふむ…（メガネをくいっ）','*adjusts glasses*']]},
  {id:'tsun',name:'ツンデレ',kuse:'べ、べつに…',gesture:'ぷいっと横を向く（でも見てる）',desc:'素直じゃないけど、ほんとうは一番の応援団。たまに出る本音がうれしい。',
   intro:'べ、べつに、あなたに会いたかったわけじゃ…。…よろしく',
   lines:{hello:[['べ、べつに待ってなかったし…。…やるの？','N-not like I was waiting...'],['来たんだ。…まあ、いっしょにやってあげてもいいけど','Fine, I\'ll study with you.'],['…今日もサボらなかったんだ。ふーん','Didn\'t skip today, huh.']],
     win:[['べ、べつにほめてないし…。…でも、すごいじゃん','Not praising you... but nice.'],['ふん、それくらい当然でしょ。…やるじゃん','Obviously. ...Not bad.'],['…ちょっとだけ、見直した','...I\'m a little impressed.']],
     cheer:[['しょうがないなぁ。次は取りなさいよね','Get the next one, okay?'],['…べつに心配してないけど、解説は読んでよね','Read the explanation. Not that I care.'],['ここでやめたら、怒るから','Don\'t you dare quit.']],
     study:[['…集中してるとこ、ちょっとかっこいいかも','...You look cool focusing.'],['べ、べつに見てないし','I-I\'m not watching.']]},
   poke:[['ちょ、さわらないでよ…！','H-hey, don\'t touch!'],['…なに？ べつに、うれしくないし','...Not happy about it.']]}
];
// SPK_LINES を性格のセリフ集に差し替える（たまごの間・性格未定は元のまま）
const SPK_LINES_DEFAULT={};Object.keys(SPK_LINES).forEach(k=>SPK_LINES_DEFAULT[k]=SPK_LINES[k].slice());
function spkPersona(){const s=PROG.spk||{};return s.species&&s.persona?SPK_PERSONAS.find(p=>p.id===s.persona)||null:null}
function spkApplyLines(){const p=spkPersona();Object.keys(SPK_LINES_DEFAULT).forEach(k=>{const src=p&&p.lines[k]?p.lines[k]:SPK_LINES_DEFAULT[k];SPK_LINES[k].splice(0,SPK_LINES[k].length,...src)})}
// 話し方の変換（性格のセリフ集にない、固定の声かけを性格っぽくする）
const SPK_VOICE={
  genki:(t)=>/[？?]$/.test(t)?t:t.replace(/[。！!…]+$/,'')+'っ！',
  nonbiri:(t)=>t.replace(/[！!]/g,'〜').replace(/。$/,'〜'),
  ganbari:(t,m)=>(m==='cheer'||m==='hello'?'よしっ、':'')+t.replace(/。$/,'！'),
  shy:(t)=>'あ、あの… '+t.replace(/[！!]/g,'…'),
  monoshiri:(t)=>'ふむふむ。'+t,
  tsun:(t,m)=>m==='win'?'べ、べつにほめてないけど… '+t:m==='cheer'?'しょうがないなぁ。'+t:t.replace(/[！!]$/,'。')
};
function spkVoice(t,m){const p=spkPersona();return p&&SPK_VOICE[p.id]?SPK_VOICE[p.id](String(t),m||'hello'):t}
function spkRollPersona(not){const a=SPK_PERSONAS.filter(p=>p.id!==not);return a[Math.floor(Math.random()*a.length)].id}

function spkPersonaInstall(){
  if(typeof sparkSay!=='function')return;
  // 声かけはすべて性格の話し方で
  const _say=sparkSay;
  sparkSay=function(ja,en,mood,o){if(!(o&&o.raw))ja=spkVoice(ja,mood);return _say.call(this,ja,en,mood,o)};
  const _ctx=spkContextLine;
  spkContextLine=function(){const l=_ctx.apply(this,arguments);const p=spkPersona();if(!p)return l;
    // 半分は性格のあいさつ、半分は状況のひとこと（話し方つき）
    return Math.random()<0.5?spkPick(p.lines.hello):[spkVoice(l[0],'hello'),l[1]]};
  // 孵化のときに性格も決まる
  const _hatch=sparkHatch;
  sparkHatch=function(o){
    const s=spk();if(!s.persona)s.persona=spkRollPersona();commit();
    const r=_hatch.apply(this,arguments);
    const ov=document.querySelector('.spk-hatch');const p=spkPersona()||SPK_PERSONAS.find(x=>x.id===s.persona);
    if(ov&&p){const m=ov.querySelector('.spk-evo-m');if(m)m.insertAdjacentHTML('afterend',`<div class="spk-pz"><b>性格：${p.name}</b><span>口癖「${p.kuse}」・${p.gesture}</span><i>「${esc(p.intro)}」</i></div>`)}
    spkApplyLines();return r;
  };
  // タップしたときの、性格ごとのひとこと（しぐさは CSS）
  document.addEventListener('click',e=>{
    const b=e.target.closest('.spk-stage');if(!b)return;const p=spkPersona();if(!p)return;
    const hero=b.closest('.spk-hero,.spk-room');const l=spkPick(p.poke);
    setTimeout(()=>{if(hero){const bb=hero.querySelector('.spark-bubble'),jj=hero.querySelector('.spark-line .ja');if(bb)bb.textContent=l[1];if(jj)jj.textContent=l[0];if(!bb&&!jj)sparkSay(l[0],l[1],'hello',{force:true,raw:true})}},10);
  });
  // すでに生まれている Spark には、ここで性格が決まる
  const s=spk();
  if(s.species&&!s.persona){s.persona=spkRollPersona();s.personaNew=1;commit()}
  spkApplyLines();
  const _rh=renderHome;
  renderHome=function(){const r=_rh.apply(this,arguments);const st=spk();
    if(st.personaNew&&spkPersona()){st.personaNew=0;commit();const p=spkPersona();setTimeout(()=>sparkSay(`わたしの性格、わかったよ。「${p.name}」みたい。口癖は「${p.kuse}」`,'I found my personality!','win',{force:true,raw:true,ms:6000}),1500)}
    return r};
  // Sparkのへや：性格の表示と、性格チェンジ（100コイン）
  if(typeof openSparkRoom==='function'){
    const _or=openSparkRoom;
    openSparkRoom=function(){
      const r=_or.apply(this,arguments);const p=spkPersona();
      const room=document.querySelector('.spk-room');
      if(room&&!document.getElementById('spk-pz-card')){
        room.insertAdjacentHTML('afterend',p?`<div class="card spk-pz-card" id="spk-pz-card"><div class="spk-pz-h"><b>性格：${p.name}</b><span>口癖「${p.kuse}」</span></div>
          <div class="hb-note" style="margin-top:2px">${p.desc}<br>しぐさ：${p.gesture}。タップすると反応します。</div>
          <button class="btn btn-secondary spk-item-b" id="spk-pz-change" style="margin-top:8px" ${spkCoins()<100?'disabled':''}>性格チェンジ ${SPK_COIN_SVG}100</button></div>`
          :`<div class="card spk-pz-card" id="spk-pz-card"><div class="hb-note" style="margin:0">性格は、たまごがかえったときに決まります（6タイプ）。口癖やしぐさがそれぞれ違うよ。</div></div>`);
        const c=document.getElementById('spk-pz-change');
        if(c)c.onclick=()=>{if(spkCoins()<100)return;const st=spk();st.coins-=100;st.persona=spkRollPersona(st.persona);commit();spkApplyLines();spkCoinPill&&spkCoinPill();
          const np=spkPersona();openSparkRoom();sparkSay(np.intro,'New personality!','win',{force:true,raw:true,ms:5200})};
      }
      return r;
    };
  }
  // チームの仲間にも性格を表示（チーム機能）
  if(typeof tmMember==='function'){const _tm=tmMember;tmMember=function(){const m=_tm.apply(this,arguments);m.p=(PROG.spk&&PROG.spk.persona)||'';return m}}
  if(typeof tmSpark==='function'){const _ts=tmSpark;tmSpark=function(o){if(o&&o.s&&(o.g||1)>1&&typeof sparkSVG==='function'){const st=SPK_STAGES[(o.g||1)-1];const sp=SPK_SPECIES.find(x=>x.id===o.s);if(sp)return sparkSVG(st,'hello',{...sp,persona:SPK_PERSONAS.some(p=>p.id===o.p)?o.p:null},o.w||{})}return _ts.apply(this,arguments)}}
  if(typeof curTab!=='undefined'&&curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome();
}
if(typeof go==='function')spkPersonaInstall();
