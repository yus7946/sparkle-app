/* ========== 音が出なくなるのを防ぐ（効果音・読み上げの自己回復） ==========
   スマホのブラウザは、画面をタップする前に作った AudioContext を「一時停止」で始める。
   アプリは AudioContext を1つ使い回すので、一度止まったままだとその後の効果音が全部無音になる。
   ・ac()：止まっていたら再開を試みる
   ・画面に触れるたび（最初の数回＋アプリに戻ったとき）：AudioContext を再開、読み上げが固まっていたら直す
   index.html の ac() を置き換えるため、ほかのスクリプトのあと（compact.js の前）に読み込む。 */
'use strict';

(function(){
  const resumeAC=()=>{try{if(typeof AC!=='undefined'&&AC&&AC.state!=='running'&&AC.state!=='closed')AC.resume()}catch(e){}};
  if(typeof ac==='function'){
    const _ac=ac;
    ac=function(){const c=_ac.apply(this,arguments);try{if(c&&c.state==='suspended')c.resume()}catch(e){}return c};
  }
  // 読み上げが「一時停止」や「話している扱いのまま無音」で固まったときに戻す
  let stuckSince=0;
  const healTTS=()=>{try{if(!('speechSynthesis'in window))return;const s=speechSynthesis;if(s.paused)s.resume();
    if(s.speaking&&!s.pending){if(!stuckSince)stuckSince=Date.now();else if(Date.now()-stuckSince>30000){s.cancel();stuckSince=0}}else stuckSince=0}catch(e){}};
  const onTouch=()=>{resumeAC();healTTS()};
  ['pointerdown','touchend','keydown'].forEach(ev=>document.addEventListener(ev,onTouch,{capture:true,passive:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){resumeAC();healTTS()}});
  window.addEventListener('pageshow',()=>{resumeAC();healTTS()});
})();
