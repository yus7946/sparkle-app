/* ========== 自然な英語音声とカタカナ表記の設定 ==========
   ・端末の音声の中から、ニューラル音声など最も自然な英語の声を優先して選ぶ
     （ロボット的・おもちゃ的な声、古いデスクトップ音声、英語以外の声は避ける）
   ・自分で声を選んで試聴できる（メイン／会話の男性役）
   ・カタカナ読みは日本語的な発音のクセがつくため標準で非表示（設定で表示可）
   index.html の後に読み込み、pickVoice / speak を置き換える。 */
'use strict';
const FL_JOKE=/\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley|hysterical|deranged|pipe organ)\b/i;
const FL_F=/female|samantha|ava|allison|susan|zoe|karen|moira|tessa|victoria|zira|jenny|aria|michelle|\bana\b|sara|nancy|amber|cora|elizabeth|jane|libby|sonia|natasha|emma|olivia|nicky|google us english/i;
const FL_M=/\bmale|\balex\b|daniel|\btom\b|evan|nathan|aaron|\bguy\b|davis|tony|jason|eric|brandon|christopher|roger|steffan|ryan|william|andrew|brian|arthur|oliver/i;
function flSet(){const v=PROG.voice||(PROG.voice={});if(v.kana==null)v.kana=false;return v}
function flIsEn(v){return /^en([-_]|$)/i.test(v.lang||'')}
function flScore(v,pref,target){
  if(!flIsEn(v))return -999;
  const n=v.name||'';let s=0;
  if(FL_JOKE.test(n))s-=100;
  if(/natural|neural|online|premium|enhanced|siri|拡張|高品質/i.test(n))s+=20;
  if(/google us english/i.test(n))s+=14;else if(/google uk english/i.test(n))s+=10;
  if(/\b(samantha|ava|allison|evan|nathan|zoe|tom|susan|karen|daniel)\b/i.test(n))s+=4;
  if(/microsoft (david|zira|mark|hazel|george|susan)/i.test(n)&&!/online|natural/i.test(n))s-=6;
  const lang=(v.lang||'').replace('_','-').toLowerCase();
  if(target){if(lang===target.toLowerCase())s+=12}
  else if(lang==='en-us')s+=8;else if(/^en-(gb|au|ca|ie|nz)$/.test(lang))s+=4;
  if(pref==='female'&&FL_F.test(n))s+=5;
  if(pref==='male'&&FL_M.test(n))s+=5;
  return s;
}
function flEnVoices(){if(!_voices.length)loadVoices();return _voices.filter(flIsEn)}
function flRanked(pref){return flEnVoices().slice().sort((a,b)=>flScore(b,pref)-flScore(a,pref))}

/* ---------- 置き換え ---------- */
pickVoice=function(pref,targetLang){
  const en=flEnVoices();if(!en.length)return null;
  const st=flSet();
  if(!targetLang){
    const want=pref==='male'?st.m:st.f;
    if(want){const v=en.find(x=>x.voiceURI===want);if(v)return v}
  }
  return en.slice().sort((a,b)=>flScore(b,pref,targetLang)-flScore(a,pref,targetLang))[0];
};
// 音声リストの読み込み前に話すと端末の既定（日本語訛り）の声になるため、少し待ってから話す。
// 英語の声が端末に1つもない場合は、日本語の声で英語を読ませない（カタコトの発音を覚えてしまうため）。
let flWarned=false;
function flHasEn(){return flEnVoices().length>0}
function flBlocked(lang){return (!lang||/^en/i.test(lang))&&_voices.length&&!flHasEn()&&!flSet().allowJa}
(function(){
  const wrap=fn=>function(t,rate,pref,lang){
    const args=arguments,self=this;
    if(!('speechSynthesis'in window))return;
    const go=()=>{
      if(flBlocked(lang)){if(!flWarned){flWarned=true;flNoEnGuide()}else showToast('英語の音声が端末にありません（Profile →「英語の読み上げ音声」）');return}
      fn.apply(self,args);
    };
    if(!_voices.length)loadVoices();
    if(_voices.length)return go();
    let done=false;const run=()=>{if(done)return;done=true;loadVoices();go()};
    speechSynthesis.addEventListener('voiceschanged',run,{once:true});setTimeout(run,700);
  };
  speak=wrap(speak);speakQueue=wrap(speakQueue);
})();

/* ---------- 英語の声がない端末への案内 ---------- */
function flGuideHTML(){
  const ua=navigator.userAgent;
  if(/iP(hone|ad|od)/.test(ua))return '<ol><li>「設定」→「アクセシビリティ」→「読み上げコンテンツ」→「声」</li><li>「英語」から <b>Ava（拡張）</b> か <b>Samantha（拡張）</b> をダウンロード</li><li>このアプリを開き直す</li></ol>';
  if(/Android/.test(ua))return '<ol><li>「設定」→「システム」→「言語と入力」→「テキスト読み上げの出力」</li><li>「Googleの音声サービス」の設定 →「音声データをインストール」→ <b>英語（米国）</b></li><li>このアプリを開き直す</li></ol>';
  if(/Windows/.test(ua))return '<ol><li><b>いちばん簡単：Microsoft Edge か Google Chrome で開く</b>（追加なしで英語音声が使えます。Edge の「Online (Natural)」がもっとも自然）</li><li>またはWindowsの「設定」→「時刻と言語」→「音声認識」→「音声を追加」→ <b>English (United States)</b> を追加して、ブラウザを再起動</li></ol>';
  if(/Mac/.test(ua))return '<ol><li>「システム設定」→「アクセシビリティ」→「読み上げコンテンツ」→「システムの声」→「声を管理」</li><li>英語の <b>Ava（プレミアム）</b> などを追加して、ブラウザを再起動</li></ol>';
  return '<ol><li>Google Chrome か Microsoft Edge の最新版で開いてください</li></ol>';
}
function flNoEnGuide(){
  if(document.getElementById('fl-guide'))return;
  const ov=document.createElement('div');ov.className='gw-cele';ov.id='fl-guide';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  ov.innerHTML=`<div class="gw-cele-card fl-card"><div class="gw-cele-k">English voice</div><div class="gw-cele-t">英語の音声が<br>この端末にありません</div>
    <div class="gw-cele-b" style="text-align:left">このままだと英文が<b>日本語の声</b>で読み上げられ、カタコトの発音になります。間違った発音を覚えないよう、英語の音声を追加してください（無料・数分）。</div>
    <div class="fl-guide">${flGuideHTML()}</div>
    <div class="tk-fb-btns"><button class="btn btn-secondary" id="fl-g-ja">日本語の声で再生（非推奨）</button><button class="btn btn-gold" id="fl-g-ok">わかった</button></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('#fl-g-ok').onclick=()=>ov.remove();
  ov.querySelector('#fl-g-ja').onclick=()=>{flSet().allowJa=true;commit();ov.remove();showToast('日本語の声で再生します（設定でいつでも戻せます）')};
}

/* ---------- カタカナ表記 ---------- */
function flApplyKana(){document.body.classList.toggle('show-kana',!!flSet().kana)}

/* ---------- 声の設定画面 ---------- */
const FL_SAMPLE="Hi there! Could I get a table for two, please? We'd love to sit by the window.";
function flPreview(v){
  if(!('speechSynthesis'in window))return;
  const u=new SpeechSynthesisUtterance(FL_SAMPLE);u.voice=v;u.lang=v.lang;u.rate=listenRate(0.95);
  speechSynthesis.cancel();speechSynthesis.speak(u);
}
function openVoiceSettings(){
  const st=flSet();
  const ov=document.createElement('div');ov.className='gw-cele';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent),android=/Android/.test(navigator.userAgent),edge=/Edg\//.test(navigator.userAgent);
  const hint=ios?'もっと自然な声にするには：iPhoneの「設定」→「アクセシビリティ」→「読み上げコンテンツ」→「声」→「英語」で「Ava（拡張）」や「Samantha（拡張）」をダウンロードしてください。'
    :android?'もっと自然な声にするには：「設定」→「Googleの音声サービス」で英語（米国）の音声データをダウンロードしてください。'
    :edge?'Microsoft Edge では「Online (Natural)」の付いた声がもっとも自然です。'
    :'PCでは Microsoft Edge で開くと、とても自然なニューラル音声（〜Online (Natural)）が使えます。';
  const render=tab=>{
    const pref=tab==='m'?'male':'female';
    const list=flRanked(pref).filter(v=>!FL_JOKE.test(v.name)).slice(0,14);
    const cur=pickVoice(pref);
    const best=list[0];
    ov.querySelector('#fl-list').innerHTML=list.length?list.map((v,i)=>`<div class="fl-v ${cur&&cur.voiceURI===v.voiceURI?'on':''}">
        <button class="fl-v-pick" data-i="${i}"><span class="fl-radio"></span><span class="fl-v-b"><span class="tk-row-t">${esc(v.name)}${v===best?' <span class="fl-badge">おすすめ</span>':''}</span><span class="tk-row-s">${esc(v.lang)}${/natural|neural|online|enhanced|premium|拡張/i.test(v.name)?' · 高品質':''}</span></span></button>
        <button class="bubble-play" data-p="${i}" aria-label="試聴">${ICONS.play}</button></div>`).join('')
      :'<div class="gw-note"><b>英語の音声が見つかりません。</b>英文が日本語の声で読まれてしまうため、次の方法で追加してください。</div><div class="fl-guide">'+flGuideHTML()+'</div>'+(st.allowJa?'<button class="tk-link" id="fl-noja">日本語の声での再生をやめる</button>':'');
    const nj=ov.querySelector('#fl-noja');if(nj)nj.onclick=()=>{delete st.allowJa;commit();render(tab)};
    ov.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>flPreview(list[+b.dataset.p]));
    ov.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const v=list[+b.dataset.i];st[tab]=v.voiceURI;commit();flPreview(v);render(tab)});
  };
  ov.innerHTML=`<div class="gw-cele-card fl-card">
    <div class="gw-cele-k">English voice</div>
    <div class="gw-cele-t">英語の読み上げ音声</div>
    <div class="tk-assist-tabs travel-seg fl-tabs" role="tablist"><button class="on" data-t="f">メインの声</button><button data-t="m">会話の男性役</button></div>
    <div id="fl-list" class="fl-list"></div>
    <div class="p6-note">${hint}</div>
    <div class="fl-kana"><span><b>カタカナ読みを表示</b><small>日本語的な発音のクセがつきやすいので、ふだんはオフがおすすめ</small></span><div class="tk-seg" id="fl-kana"><button data-v="0" class="${st.kana?'':'on'}">オフ</button><button data-v="1" class="${st.kana?'on':''}">オン</button></div></div>
    <div class="tk-fb-btns"><button class="btn btn-secondary" id="fl-auto">おまかせに戻す</button><button class="btn btn-gold" id="fl-ok">完了</button></div>
  </div>`;
  document.body.appendChild(ov);
  let tab='f';
  ov.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;ov.querySelectorAll('[data-t]').forEach(x=>x.classList.toggle('on',x===b));render(tab)});
  ov.querySelectorAll('#fl-kana button').forEach(b=>b.onclick=()=>{st.kana=b.dataset.v==='1';commit();flApplyKana();ov.querySelectorAll('#fl-kana button').forEach(x=>x.classList.toggle('on',x===b))});
  ov.querySelector('#fl-auto').onclick=()=>{delete st.f;delete st.m;commit();render(tab);showToast('いちばん自然な声を自動で選びます')};
  ov.querySelector('#fl-ok').onclick=()=>{if('speechSynthesis'in window)speechSynthesis.cancel();ov.remove()};
  render(tab);
  if(!_voices.length&&'speechSynthesis'in window)speechSynthesis.addEventListener('voiceschanged',()=>render(tab),{once:true});
}

/* ---------- 接続 ---------- */
function flInstall(){
  flApplyKana();
  // ホーム：英語の声がない端末に警告
  const _home=renderHome;
  renderHome=function(){
    _home.apply(this,arguments);
    const put=()=>{
      const home=document.getElementById('screen-home');
      if(!home||!home.classList.contains('active')||document.getElementById('fl-warn')||!_voices.length||flHasEn())return;
      const c=document.createElement('button');c.id='fl-warn';c.className='card fl-warn';
      c.innerHTML=`<span class="bk-ic warn">${ICONS.alert}</span><span class="bk-entry-b"><span class="tk-row-t">英語の音声が入っていません</span><span class="tk-row-s">このままだと日本語なまりで読み上げられます。直し方を見る</span></span><span class="tk-row-go">${ICONS.arrowRight}</span>`;
      c.onclick=flNoEnGuide;home.prepend(c);
    };
    if(!_voices.length){loadVoices();if('speechSynthesis'in window)speechSynthesis.addEventListener('voiceschanged',()=>{loadVoices();put()},{once:true})}
    put();
  };
  const _rp=renderProfile;
  renderProfile=function(){
    _rp.apply(this,arguments);
    const scr=document.getElementById('screen-profile');if(!scr)return;
    const v=pickVoice('female');
    const card=document.createElement('button');card.className='card bk-entry';
    card.innerHTML=`<span class="tk-mode-ic">${ICONS.play}</span><span class="bk-entry-b"><span class="tk-row-t">英語の読み上げ音声</span><span class="tk-row-s">${v?esc(v.name):'自動'} · 声の選択・カタカナ表記</span></span><span class="tk-row-go">${ICONS.arrowRight}</span>`;
    card.onclick=openVoiceSettings;
    const anchor=document.getElementById('bk-entry')||scr.querySelector('.sec-title');
    if(anchor)anchor.after(card);else scr.prepend(card);
  };
}
if(typeof go==='function')flInstall();
