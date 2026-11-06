/* ========== 音が出なくなるのを防ぐ（効果音・読み上げの自己回復）＋ 音のチェック ==========
   1) AudioContext：スマホはタップ前に作ると「一時停止」で始まる。止まっていたら、タップのたびに再開する
   2) 読み上げ：一時停止・固まりを解除する
   3) iPhone：マイク（録音・音声認識）を使うと、ページの音が「通話モード」（受話口から小さく）になったまま戻らないことがある。
      マイクを使う直前だけ 'play-and-record'、マイクを離したら 'playback'（スピーカー）に戻す。
      音声認識は SpeechRecognition.prototype.start、録音は getUserMedia を包むので、どの機能から使っても同じ扱いになる
   4) 音のチェック：?soundcheck か Profile の「音のチェック」で開く。声・効果音・音声ファイルを1つずつ鳴らして結果を表示
   index.html の ac() を置き換えるため、ほかのスクリプトのあと（compact.js の前）に読み込む。 */
'use strict';

const AF={mic:0,log:[]};
(function(){
  const AS=navigator.audioSession;
  const setAS=t=>{try{if(AS&&AS.type!==t)AS.type=t}catch(e){}};
  AF.toSpeaker=()=>{if(AF.mic<=0){AF.mic=0;setAS('playback')}};
  AF.setAS=setAS;
  // 録音（getUserMedia）
  const md=navigator.mediaDevices;
  if(md&&md.getUserMedia){
    const g=md.getUserMedia.bind(md);
    md.getUserMedia=function(c){
      const wantsAudio=!!(c&&c.audio);if(wantsAudio)setAS('play-and-record');
      return g(c).then(st=>{
        if(wantsAudio)st.getAudioTracks().forEach(tr=>{AF.mic++;let done=false;const end=()=>{if(done)return;done=true;AF.mic--;setTimeout(AF.toSpeaker,300)};
          tr.addEventListener('ended',end);const stop=tr.stop.bind(tr);tr.stop=function(){stop();end()}});
        return st;
      },e=>{setTimeout(AF.toSpeaker,300);throw e});
    };
  }
  // 音声認識
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(SR&&SR.prototype&&SR.prototype.start){
    const start=SR.prototype.start;
    SR.prototype.start=function(){
      setAS('play-and-record');
      if(!this._afHooked){this._afHooked=true;this.addEventListener('end',()=>{if(this._afOn){this._afOn=false;AF.mic--}setTimeout(AF.toSpeaker,300)})}
      try{start.apply(this,arguments);if(!this._afOn){this._afOn=true;AF.mic++}}catch(e){setTimeout(AF.toSpeaker,300);throw e}
    };
  }
  setTimeout(AF.toSpeaker,0);

  // AudioContext と読み上げの自己回復
  const resumeAC=()=>{try{if(typeof AC!=='undefined'&&AC&&AC.state!=='running'&&AC.state!=='closed')AC.resume()}catch(e){}};
  if(typeof ac==='function'){const _ac=ac;ac=function(){const c=_ac.apply(this,arguments);try{if(c&&c.state==='suspended')c.resume()}catch(e){}return c}}
  let stuckSince=0;
  const healTTS=()=>{try{if(!('speechSynthesis'in window))return;const s=speechSynthesis;if(s.paused)s.resume();
    if(s.speaking&&!s.pending){if(!stuckSince)stuckSince=Date.now();else if(Date.now()-stuckSince>30000){s.cancel();stuckSince=0}}else stuckSince=0}catch(e){}};
  const onTouch=()=>{resumeAC();healTTS();AF.toSpeaker()};
  ['pointerdown','touchend','keydown'].forEach(ev=>document.addEventListener(ev,onTouch,{capture:true,passive:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){resumeAC();healTTS();AF.toSpeaker()}});
  window.addEventListener('pageshow',()=>{resumeAC();healTTS();AF.toSpeaker()});
})();

/* ---------- 音のチェック ---------- */
function afDevice(){const u=navigator.userAgent;const ios=/iP(hone|ad|od)/.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const v=(u.match(/OS (\d+)_(\d+)/)||[])[1];const an=(u.match(/Android (\d+)/)||[])[1];
  const br=/CriOS|Chrome/.test(u)?'Chrome':/FxiOS|Firefox/.test(u)?'Firefox':/Safari/.test(u)?'Safari':'ブラウザ';
  const sa=window.matchMedia&&matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  return (ios?`iPhone iOS ${v||'?'}`:an?`Android ${an}`:'PC')+` · ${br}${sa?' · ホーム画面のアプリ':''}`}
function afWav(){const sr=22050,n=Math.floor(sr*0.35),b=new ArrayBuffer(44+n*2),d=new DataView(b);const w=(o,s)=>[...s].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));
  w(0,'RIFF');d.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,sr,true);d.setUint32(28,sr*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);w(36,'data');d.setUint32(40,n*2,true);
  for(let i=0;i<n;i++)d.setInt16(44+i*2,Math.sin(i/sr*2*Math.PI*660)*12000*Math.min(1,(n-i)/2000),true);return URL.createObjectURL(new Blob([b],{type:'audio/wav'}))}
function sndCheck(){
  if(document.getElementById('af-ov'))return;
  if(!document.getElementById('af-css')){const st=document.createElement('style');st.id='af-css';st.textContent=`
    #af-ov{position:fixed;inset:0;z-index:400;background:rgba(6,14,30,.55);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
    #af-ov .af-p{width:100%;max-width:520px;max-height:92vh;overflow:auto;background:var(--night,#fff);color:var(--text-primary);border-radius:24px 24px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 40px rgba(0,0,0,.25)}
    #af-ov h3{margin:0 0 4px;font-size:18px}#af-ov .af-sub{font-size:12px;color:var(--text-secondary);margin-bottom:12px;line-height:1.6}
    #af-ov .af-t{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:16px;margin-bottom:8px}
    #af-ov .af-t b{font-size:13.5px}#af-ov .af-t small{display:block;font-size:11px;color:var(--text-muted);margin-top:2px;line-height:1.5}
    #af-ov .af-t button{min-height:40px;padding:0 14px;border-radius:999px;border:none;background:var(--sparkle);color:#fff;font:inherit;font-weight:800;font-size:12.5px}
    #af-ov .af-r{grid-column:1/-1;font-size:12px;font-weight:700}#af-ov .af-r.ok{color:var(--enchanted)}#af-ov .af-r.ng{color:var(--ember)}
    #af-ov .af-info{font-size:11px;line-height:1.7;color:var(--text-secondary);background:var(--surface-2,rgba(0,0,0,.04));border-radius:14px;padding:10px 12px;margin:10px 0;white-space:pre-wrap;word-break:break-word}
    #af-ov .af-row{display:flex;gap:8px}#af-ov .af-row button{flex:1;min-height:44px;border-radius:999px;border:1px solid var(--border);background:var(--surface-2,#fff);color:var(--text-primary);font:inherit;font-weight:700;font-size:13px}`;document.head.appendChild(st)}
  const ov=document.createElement('div');ov.id='af-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','音のチェック');
  const t=(id,title,sub)=>`<div class="af-t"><div><b>${title}</b><small>${sub}</small></div><button data-af="${id}">鳴らす</button><div class="af-r" id="af-r-${id}"></div></div>`;
  ov.innerHTML=`<div class="af-p"><h3>音のチェック</h3><div class="af-sub">上から順に「鳴らす」を押して、聞こえたかどうかを確かめてください。結果の画面をそのままスクショで送ってもらえれば原因が分かります。</div>
    ${t('tts','① 英語の声','Spark や問題文を読み上げる声')}${t('fx','② 効果音','正解音などのピコッという音')}${t('file','③ 音声ファイル','録音の再生と同じしくみ')}
    <div class="af-info" id="af-info"></div>
    <div class="af-row"><button id="af-fix">リセットして再読み込み</button><button id="af-close">閉じる</button></div></div>`;
  document.body.appendChild(ov);
  const info=()=>{const vs=('speechSynthesis'in window)?speechSynthesis.getVoices():[],en=vs.filter(v=>/^en/i.test(v.lang));const pv=typeof pickVoice==='function'?pickVoice('female','en-US'):null;
    document.getElementById('af-info').textContent=[`端末：${afDevice()}`,`声：全${vs.length}・英語${en.length}${pv?`（使う声：${pv.name} / ${pv.lang}）`:''}`,
      `読み上げ：${'speechSynthesis'in window?`speaking=${speechSynthesis.speaking} pending=${speechSynthesis.pending} paused=${speechSynthesis.paused}`:'なし'}`,
      `効果音：${typeof AC!=='undefined'&&AC?AC.state:'未作成'}・消音設定=${localStorage.getItem('sparkle_mute')==='1'?'ON':'OFF'}`,
      `音の出し方：${navigator.audioSession?navigator.audioSession.type:'（端末が非対応）'}・マイク使用中=${AF.mic}`,
      ...AF.log.slice(-6)].join('\n')};
  const res=(id,ok,msg)=>{const r=document.getElementById('af-r-'+id);r.className='af-r '+(ok?'ok':'ng');r.textContent=msg;AF.log.push(`${id}: ${msg}`);info()};
  info();setTimeout(info,800);
  ov.querySelector('[data-af="tts"]').onclick=()=>{
    if(!('speechSynthesis'in window))return res('tts',false,'この端末は読み上げに非対応');
    AF.toSpeaker();const s=speechSynthesis;s.cancel();if(s.paused)s.resume();
    const u=new SpeechSynthesisUtterance('Hello! This is Sparkle. Can you hear me?');u.lang='en-US';u.rate=0.95;u.volume=1;const v=typeof pickVoice==='function'&&pickVoice('female','en-US');if(v)u.voice=v;
    const t0=performance.now();let started=false;
    u.onstart=()=>{started=true;res('tts',true,'再生が始まりました。聞こえましたか？（聞こえない＝音量・消音スイッチ・出力先の問題）')};
    u.onend=()=>{if(!started)res('tts',false,'すぐに終わりました（声が出ていない可能性）');else res('tts',true,`最後まで再生しました（${((performance.now()-t0)/1000).toFixed(1)}秒）。聞こえなかったら音量と消音スイッチを確認`)};
    u.onerror=e=>res('tts',false,'エラー：'+(e&&e.error||'不明'));
    s.speak(u);setTimeout(()=>{if(!started)res('tts',false,'3秒たっても再生が始まりません（読み上げが固まっています → リセット）')},3000);
  };
  ov.querySelector('[data-af="fx"]').onclick=()=>{
    try{const c=typeof ac==='function'?ac():null;if(!c)return res('fx',false,'効果音のしくみが使えません');
      const go=()=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.setValueAtTime(0.25,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+0.4);
        res('fx',c.state==='running',c.state==='running'?'鳴らしました。聞こえましたか？':'状態：'+c.state+'（止まっています）')};
      if(c.state!=='running')c.resume().then(go,go);else go();
    }catch(e){res('fx',false,'エラー：'+e.message)}
  };
  ov.querySelector('[data-af="file"]').onclick=()=>{try{const u=afWav(),a=new Audio(u);let done=false;a.onended=()=>URL.revokeObjectURL(u);
    a.play().then(()=>{done=true;res('file',true,'鳴らしました。聞こえましたか？')},e=>{done=true;res('file',false,'再生できません：'+(e&&e.name||''))});
    setTimeout(()=>{if(!done)res('file',false,'3秒たっても再生が始まりません')},3000)}catch(e){res('file',false,'エラー：'+e.message)}};
  document.getElementById('af-close').onclick=()=>ov.remove();
  document.getElementById('af-fix').onclick=()=>{try{speechSynthesis.cancel()}catch(e){}try{AF.mic=0;AF.toSpeaker()}catch(e){}try{if(typeof AC!=='undefined'&&AC)AC.close()}catch(e){}
    try{localStorage.removeItem('sparkle_mute')}catch(e){}location.reload()};
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
}
// 入口：URL に ?soundcheck、または Profile の「音のチェック」
if(/[?&#]soundcheck/.test(location.href))setTimeout(sndCheck,1500);
if(typeof renderProfile==='function'){const _rp=renderProfile;renderProfile=function(){const r=_rp.apply(this,arguments);
  const lg=document.getElementById('lg-links');if(lg&&!lg.querySelector('[data-af-open]')){lg.insertAdjacentHTML('afterbegin','<button data-af-open="1">音のチェック</button><span>·</span>');lg.querySelector('[data-af-open]').onclick=sndCheck}
  return r}}
