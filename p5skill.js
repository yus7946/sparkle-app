/* ========== Part 5 分野別の分析（Santa・abceed 式の弱点分析） ==========
   ・Part 5 の各問題を、選択肢の形から分野に自動で分類（品詞／時制・態／不定詞・動名詞／前置詞／接続詞／
     前置詞・接続詞／代名詞／関係詞／比較／語彙）
   ・分野ごとの正答率を出し、いちばん弱い分野を10問で集中練習できる（ロードマップ画面）
   toeic_core.js / plan650.js / habit.js の後に読み込む。 */
'use strict';

const P5_PREP=new Set('in on at by for with from to of during despite until since within without throughout among between through toward towards about against along across behind beside beyond except into onto upon via per regarding concerning including following prior'.split(' '));
const P5_CONJ=new Set('although though while because since if unless when whereas once until before after so but and or yet nor whether as'.split(' '));
const P5_PRON=new Set('he him his himself she her hers herself they them their theirs themselves it its itself we us our ours ourselves you your yours yourself yourselves i me my mine myself'.split(' '));
const P5_REL=new Set('who whom whose which that what where when whoever whatever whichever'.split(' '));
const P5_PREP2=/^(because of|due to|in spite of|instead of|according to|in addition to|as well as|prior to|owing to|regardless of|on behalf of|along with)$/;
const P5_CONJ2=/^(as soon as|even though|even if|so that|as long as|now that|provided that|as if|in case|only if)$/;
const P5_TIPS={
  '品詞':'空所の前後を見る。冠詞と名詞の間＝形容詞、動詞のあと＝副詞、冠詞のあと＝名詞。意味を考える前に「位置」で決める。',
  '時制・態':'主語が「する側」か「される側」か（態）と、時を表す語（yesterday / by next week / since）を探す。',
  '不定詞・動名詞':'直前の動詞で決まる。want / plan / decide＋to do、enjoy / consider / avoid＋doing を丸ごと覚える。',
  '前置詞':'後ろの名詞との組み合わせで覚える（in + 月・年、on + 曜日・日付、at + 時刻、by + 期限）。',
  '接続詞':'後ろが「主語＋動詞」の文なら接続詞。前後の意味が「逆接」か「理由」か「条件」かで選ぶ。',
  '前置詞・接続詞':'後ろが名詞だけ→前置詞（despite / because of / during）、主語＋動詞→接続詞（although / because / while）。',
  '代名詞':'空所が主語・目的語・所有のどれかを見る。主語と同じ人を指す目的語なら -self。',
  '関係詞':'先行詞が人→who / whom、物→which、後ろに名詞が続いて「〜の」→whose。後ろの文に足りない部分を探す。',
  '比較':'than があれば比較級、the＋範囲（of all / in the company）があれば最上級。',
  '語彙':'文の意味から選ぶ問題。単語帳の例文ごと覚えると、組み合わせ（コロケーション）で解ける。',
  '語彙・語法':'動詞と名詞の組み合わせや、決まった言い回しを問う問題。解説の訳と一緒に例文で覚える。'
};
function p5Tag(q){
  if(q.gen)return'語彙';
  if(q._tag)return q._tag;
  const ch=q.choices.map(c=>String(c).toLowerCase().trim());
  const one=ch.every(c=>!/\s/.test(c));
  const isP=c=>P5_PREP.has(c)||P5_PREP2.test(c),isC=c=>P5_CONJ.has(c)||P5_CONJ2.test(c);
  const np=ch.filter(isP).length,nc=ch.filter(isC).length;
  // since / until / before / after / as は前置詞にも接続詞にもなるので「どちらか一方だけ」の語で判定する
  const pp=ch.filter(c=>isP(c)&&!isC(c)).length,pc=ch.filter(c=>isC(c)&&!isP(c)).length;
  const AUX=/^(is|are|was|were|be|been|being|have|has|had|do|does|did|will|would)$/;
  const DERIV=/(ly|tion|sion|ment|ive|al|ful|ness|ity|ance|ence|able|ible|ous|ant|ent|er|or|ize|ise)$/;
  const stem=ch.map(c=>c.split(' ').pop().slice(0,4)),same=stem.filter(x=>x===stem[0]).length;
  let t='語彙・語法';
  if(one&&ch.every(c=>P5_PRON.has(c)))t='代名詞';
  else if(one&&ch.filter(c=>P5_REL.has(c)).length>=3)t='関係詞';
  else if(one&&ch.every(c=>AUX.test(c)))t='時制・態';
  else if(pp&&pc&&np+nc>=3)t='前置詞・接続詞';
  else if(np>=3)t='前置詞';
  else if(nc>=3)t='接続詞';
  else if(ch.filter(c=>/\b(more|most|less|least)\b|est$/.test(c)).length>=2)t='比較';
  else if(same>=3){
    if(ch.some(c=>/^to\s/.test(c)))t='不定詞・動名詞';
    else if(ch.some(c=>/\s/.test(c)||/^(been|being)$/.test(c)))t='時制・態';
    // 語尾が -ly / -tion / -ive など品詞の違いなら品詞、-ed / -ing / -s だけなら動詞の形（時制・態）
    else t=ch.filter(c=>DERIV.test(c)&&!/(ed|ing)$/.test(c)).length>=2?'品詞':'時制・態';
  }
  q._tag=t;return t;
}
function p5Stats(){
  const m={};
  TOEIC_P5.forEach(q=>{const t=p5Tag(q),r=PROG.phrases[q.id];const o=m[t]||(m[t]={tag:t,n:0,c:0,a:0});o.n++;if(r){o.c+=r.correct||0;o.a+=(r.correct||0)+(r.incorrect||0)}});
  return Object.values(m).map(o=>({...o,acc:o.a?o.c/o.a:null})).sort((x,y)=>(x.a>=3?x.acc:2)-(y.a>=3?y.acc:2));
}
function p5DrillTag(tag){
  const t=todayStr(),items=TOEIC_P5.filter(q=>p5Tag(q)===tag);
  const due=[],rest=[];items.forEach(q=>{const r=PROG.phrases[q.id];if(!r||!r.correct||r.incorrect>r.correct||(r.nextReview&&r.nextReview<=t))due.push(q);else rest.push(q)});
  const pick=[...due.sort(()=>Math.random()-0.5),...rest.sort(()=>Math.random()-0.5)].slice(0,10);
  toeicPart=5;openTOEICDrill(pick,5,'Part 5 · '+tag+'を集中');
}
function p5SkillHTML(){
  const st=p5Stats(),tried=st.filter(o=>o.a>=3),weak=tried[0];
  return `<div class="card p5s" id="p5s">
    <div class="gw-q-h"><span>${ICONS.award} Part 5 分野別の分析</span><span class="gw-q-meta">タップで集中練習</span></div>
    ${weak?`<div class="p5s-weak"><b>いちばんの伸びしろ：${esc(weak.tag)}（正答率${Math.round(weak.acc*100)}%）</b><small>${esc(P5_TIPS[weak.tag]||'')}</small><button class="btn btn-gold btn-block" data-p5tag="${esc(weak.tag)}">${esc(weak.tag)}を10問 ${ICONS.arrowRight}</button></div>`
      :'<div class="hb-empty">Part 5 を解くと、分野ごとの正答率がここに出ます（各分野3問から）。</div>'}
    ${st.map(o=>`<button class="p5s-row" data-p5tag="${esc(o.tag)}"><span class="p5s-t">${esc(o.tag)}</span><span class="p5s-bar"><i style="width:${o.acc==null?0:Math.round(o.acc*100)}%" class="${o.acc==null?'':o.acc>=0.8?'ok':o.acc>=0.6?'mid':'ng'}"></i></span><span class="p5s-v">${o.a>=3?Math.round(o.acc*100)+'%':'—'}<small>${o.n}問</small></span></button>`).join('')}
  </div>`;
}
function p5Install(){
  if(typeof openRoadmap!=='function')return;
  const _or=openRoadmap;
  openRoadmap=function(){
    const r=_or.apply(this,arguments);
    const anchor=document.getElementById('hb-log');
    if(anchor&&!document.getElementById('p5s')){anchor.insertAdjacentHTML('afterend',p5SkillHTML());
      document.querySelectorAll('[data-p5tag]').forEach(b=>b.onclick=()=>p5DrillTag(b.dataset.p5tag))}
    return r;
  };
  // Part 5 の解説の頭に分野と解き方のコツを出す
  const _ad=answerTOEICDrill;
  answerTOEICDrill=function(){
    const st=toeicDrillState,q=st&&st.items[st.i];const r=_ad.apply(this,arguments);
    if(st&&st.part===5&&q){const ex=document.getElementById('td-exp');const t=p5Tag(q);if(ex&&!ex.querySelector('.p5s-tag'))ex.insertAdjacentHTML('afterbegin',`<div class="p5s-tag"><b>${esc(t)}</b> ${esc(P5_TIPS[t]||'')}</div>`)}
    return r;
  };
}
if(typeof go==='function')p5Install();
