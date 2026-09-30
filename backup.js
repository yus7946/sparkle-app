/* ========== データの保存（バックアップ／復元） ==========
   学習記録は localStorage にしかないため、次の対策を重ねる（$0・サーバー不要）：
   ・永続ストレージの申請（ブラウザの自動削除を受けにくくする）
   ・IndexedDB への日次スナップショット（直近7日分。破損・誤操作から戻せる）
   ・ファイル / テキストでの書き出しと復元（機種変更・端末間の移行）
   ・バックアップ忘れのお知らせ、保存失敗の通知、破損データの退避
   このファイルは本体スクリプトより前に読み込み、機能の接続は DOMContentLoaded で行う。 */
'use strict';
const BK_META='sparkle_backup_meta';
const BK_KEEP=7;

/* 起動直後：記録が壊れていたら、本体が初期値で上書きする前に退避しておく */
(function bkGuard(){
  try{
    const raw=localStorage.getItem('sparkle_progress');
    if(raw){try{JSON.parse(raw)}catch(e){localStorage.setItem('sparkle_progress_corrupt_'+Date.now(),raw);window._bkCorrupt=true}}
  }catch(e){}
})();

function bkMeta(){try{return JSON.parse(localStorage.getItem(BK_META))||{}}catch(e){return{}}}
function bkSetMeta(m){try{localStorage.setItem(BK_META,JSON.stringify(Object.assign(bkMeta(),m)))}catch(e){}}
function bkCollect(){
  const data={};
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('sparkle')&&k!==BK_META&&!k.startsWith('sparkle_progress_corrupt_'))data[k]=localStorage.getItem(k)}
  return data;
}
function bkSummary(data){
  let p={};try{p=JSON.parse(data.sparkle_progress||'{}')}catch(e){}
  let st={};try{st=JSON.parse(data.sparkle_streak||'{}')}catch(e){}
  const mastered=Object.values(p.phrases||{}).filter(x=>x&&x.correct>0).length;
  return{xp:p.xp||0,mastered,streak:st.count||0,last:p.lastActiveDate||''};
}
function bkPayload(){return{app:'sparkle',v:1,at:new Date().toISOString(),data:bkCollect()}}
function bkSizeKB(){return Math.round(JSON.stringify(bkCollect()).length/1024)}
function bkDaysSince(iso){return iso?Math.floor((Date.now()-new Date(iso))/864e5):null}
function bkFmt(iso){if(!iso)return '—';const d=new Date(iso);return (d.getMonth()+1)+'/'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}

/* ---------- 永続ストレージ ---------- */
function bkPersist(){
  if(!(navigator.storage&&navigator.storage.persist))return Promise.resolve(null);
  return navigator.storage.persisted().then(p=>p||navigator.storage.persist()).then(ok=>{bkSetMeta({persist:!!ok});return ok}).catch(()=>null);
}

/* ---------- IndexedDB スナップショット ---------- */
function bkDB(){
  return new Promise((res,rej)=>{
    if(!('indexedDB'in window))return rej(new Error('no-idb'));
    const r=indexedDB.open('sparkle-backup',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('snaps',{keyPath:'id'});
    r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
  });
}
function bkTx(mode,fn){return bkDB().then(db=>new Promise((res,rej)=>{const tx=db.transaction('snaps',mode);const st=tx.objectStore('snaps');const out=fn(st);tx.oncomplete=()=>res(out&&out.result!==undefined?out.result:out);tx.onerror=()=>rej(tx.error)}))}
function bkSnapshot(id){
  const data=bkCollect();const s=bkSummary(data);
  if(!data.sparkle_progress||(!s.xp&&!s.mastered))return Promise.resolve(false); // 空の状態は保存しない
  if(!id&&window._bkCorrupt)return Promise.resolve(false); // 破損を検知したセッションは自動保存しない（良いスナップショットを守る）
  const snap={id:id||('day-'+todayStr()),at:new Date().toISOString(),data,sum:s};
  return bkTx('readonly',st=>st.get(snap.id)).catch(()=>null).then(prev=>{
    // 記録が大きく減った状態で当日分を上書きしない
    if(!id&&prev&&prev.sum&&prev.sum.xp>s.xp*2+100)return false;
    return bkTx('readwrite',st=>st.put(snap)).then(()=>bkTrim()).then(()=>{bkSetMeta({lastSnap:snap.at});return true});
  }).catch(()=>false);
}
function bkList(){return bkTx('readonly',st=>st.getAll()).then(r=>(r||[]).sort((a,b)=>b.at.localeCompare(a.at))).catch(()=>[])}
function bkTrim(){
  return bkList().then(list=>{
    const days=list.filter(s=>s.id.startsWith('day-'));const pre=list.filter(s=>s.id.startsWith('pre-'));
    const drop=[...days.slice(BK_KEEP),...pre.slice(3)];
    if(!drop.length)return;
    return bkTx('readwrite',st=>{drop.forEach(s=>st.delete(s.id))});
  });
}

/* ---------- 書き出し ---------- */
function bkIsMobile(){return matchMedia('(pointer:coarse)').matches}
async function bkExportFile(){
  const json=JSON.stringify(bkPayload());
  const name='sparkle-backup-'+todayStr()+'.json';
  const blob=new Blob([json],{type:'application/json'});
  const done=()=>{bkSetMeta({lastExport:new Date().toISOString()});showToast('バックアップを保存しました');bkRefresh()};
  try{
    if(bkIsMobile()&&navigator.canShare){
      const f=new File([blob],name,{type:'application/json'});
      if(navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'Sparkle バックアップ'});return done()}
    }
  }catch(e){if(e&&e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000);
  done();
}
function bkEncode(){return btoa(unescape(encodeURIComponent(JSON.stringify(bkPayload()))))}
async function bkCopyText(){
  const txt='SPARKLE1:'+bkEncode();
  try{await navigator.clipboard.writeText(txt);bkSetMeta({lastExport:new Date().toISOString()});showToast('コピーしました。メモやLINEに貼って保存');bkRefresh()}
  catch(e){const ta=document.getElementById('bk-paste');if(ta){ta.value=txt;ta.select();showToast('下の欄の文字をすべてコピーしてください')}}
}

/* ---------- 復元 ---------- */
function bkParse(txt){
  txt=String(txt||'').trim();
  let p=null;
  try{
    if(txt.startsWith('{'))p=JSON.parse(txt);
    else{const b=txt.replace(/^SPARKLE1:/,'').replace(/\s+/g,'');p=JSON.parse(decodeURIComponent(escape(atob(b))))}
  }catch(e){return null}
  if(!p||p.app!=='sparkle'||!p.data||!p.data.sparkle_progress)return null;
  return p;
}
function bkConfirmRestore(p,label){
  const s=bkSummary(p.data),cur=bkSummary(bkCollect());
  const ov=document.createElement('div');ov.className='gw-cele';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  ov.innerHTML=`<div class="gw-cele-card bk-confirm"><div class="gw-cele-k">Restore</div><div class="gw-cele-t">この記録に戻しますか？</div>
    <div class="bk-cmp"><div><small>いまの記録</small><b>${cur.xp} XP</b><span>${cur.mastered}フレーズ・連続${cur.streak}日</span></div><div>${ICONS.arrowRight}</div><div><small>${esc(label)}</small><b>${s.xp} XP</b><span>${s.mastered}フレーズ・連続${s.streak}日</span></div></div>
    <div class="gw-cele-b">いまの記録は念のため自動で退避してから置き換えます。</div>
    <div class="tk-fb-btns"><button class="btn btn-secondary" id="bk-no">やめる</button><button class="btn btn-gold" id="bk-yes">復元する</button></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('#bk-no').onclick=()=>ov.remove();
  ov.querySelector('#bk-yes').onclick=async()=>{
    await bkSnapshot('pre-'+Date.now()).catch(()=>{});
    Object.keys(bkCollect()).forEach(k=>localStorage.removeItem(k));
    Object.entries(p.data).forEach(([k,v])=>{if(k.startsWith('sparkle')&&k!==BK_META)localStorage.setItem(k,v)});
    bkSetMeta({lastRestore:new Date().toISOString()});
    location.reload();
  };
}
function bkRestoreFromText(txt){const p=bkParse(txt);if(!p){showToast('バックアップとして読み込めませんでした');return}bkConfirmRestore(p,bkFmt(p.at)+' のバックアップ')}
function bkRestoreFromFile(file){if(!file)return;const r=new FileReader();r.onload=()=>bkRestoreFromText(r.result);r.onerror=()=>showToast('ファイルを読めませんでした');r.readAsText(file)}

/* ---------- 画面 ---------- */
function openBackup(){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById('screen-review');el.classList.add('active');
  window.scrollTo(0,0);
  bkRender();
}
function bkRefresh(){const el=document.getElementById('bk-root');if(el)bkRender()}
async function bkRender(){
  const el=document.getElementById('screen-review');
  const m=bkMeta();const s=bkSummary(bkCollect());
  const since=bkDaysSince(m.lastExport);
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent);
  const persist=m.persist===true?'<b class="tk-ok">ON</b>（ブラウザに自動削除されにくい）':m.persist===false?'<b class="tk-mid">OFF</b>（ホーム画面に追加すると有効になりやすい）':'—';
  el.innerHTML=`<div id="bk-root"><div class="back-row"><button class="icon-btn" id="bk-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>学習記録の保存</h2></div>
    <div class="card bk-status">
      <div class="bk-status-top"><div class="bk-ic ${since!=null&&since<=7?'ok':'warn'}">${since!=null&&since<=7?ICONS.check:ICONS.alert}</div>
        <div><div class="bk-status-t">${since==null?'まだバックアップがありません':since===0?'今日バックアップ済み':since+'日前にバックアップ'}</div>
        <div class="gw-goal-s">いまの記録：${s.xp} XP・${s.mastered}フレーズ習得・連続${s.streak}日</div></div></div>
      <div class="bk-rows">
        <div><span>保存場所</span><span>この端末のブラウザ内</span></div>
        <div><span>自動削除からの保護</span><span>${persist}</span></div>
        <div><span>自動スナップショット</span><span>毎日（直近${BK_KEEP}日分）</span></div>
        <div><span>最終バックアップ</span><span>${bkFmt(m.lastExport)}</span></div>
        <div><span>データ量</span><span>約${bkSizeKB()} KB</span></div>
      </div>
      ${ios&&!standalone?`<div class="tk-tipbox">iPhone の Safari は、しばらく開かないサイトのデータを自動で消すことがあります。共有ボタン →「ホーム画面に追加」から開くと消えにくくなります。</div>`:''}
      ${window._bkCorrupt?`<div class="tk-tipbox">起動時に記録の一部が読み込めなかったため、元データを退避しました。下の「自動スナップショット」から前日の状態に戻せます。</div>`:''}
    </div>
    <div class="sec-title">${ICONS.bookmark} バックアップを保存</div>
    <button class="btn btn-gold btn-block" id="bk-file">${ICONS.arrowRight} ファイルに保存${bkIsMobile()?'（「ファイル」やiCloud Driveへ）':''}</button>
    <button class="btn btn-secondary btn-block" id="bk-copy" style="margin-top:8px">テキストでコピー（LINE・メモで別の端末へ）</button>
    <p class="gw-note" style="margin-top:8px">機種変更や別の端末で続けるときは、ここで保存 → 新しい端末の「復元」で読み込みます。</p>
    <div class="sec-title">${ICONS.clock} 復元する</div>
    <label class="btn btn-secondary btn-block bk-filebtn">バックアップファイルを選ぶ<input type="file" id="bk-in" accept="application/json,.json,text/plain" hidden></label>
    <textarea id="bk-paste" class="ic-input" rows="3" placeholder="コピーしたテキスト（SPARKLE1:…）を貼り付け" style="width:100%;margin-top:8px"></textarea>
    <button class="btn btn-secondary btn-block" id="bk-paste-go" style="margin-top:6px">貼り付けたテキストから復元</button>
    <div class="sec-title">${ICONS.zap} 自動スナップショット</div>
    <div id="bk-snaps"><div class="gw-note">読み込み中…</div></div>
  </div>`;
  document.getElementById('bk-back').onclick=()=>go('profile');
  document.getElementById('bk-file').onclick=bkExportFile;
  document.getElementById('bk-copy').onclick=bkCopyText;
  document.getElementById('bk-in').onchange=e=>bkRestoreFromFile(e.target.files[0]);
  document.getElementById('bk-paste-go').onclick=()=>bkRestoreFromText(document.getElementById('bk-paste').value);
  const list=await bkList();
  const box=document.getElementById('bk-snaps');if(!box)return;
  box.innerHTML=list.length?list.map((sn,i)=>`<div class="bk-snap"><div><div class="tk-row-t">${bkFmt(sn.at)}${sn.id.startsWith('pre-')?' <small>（復元前の退避）</small>':''}</div><div class="tk-row-s">${sn.sum.xp} XP・${sn.sum.mastered}フレーズ・連続${sn.sum.streak}日</div></div><button class="tk-link" data-snap="${i}">この状態に戻す</button></div>`).join('')
    :'<div class="gw-note">まだありません。学習を始めると毎日自動で保存されます。</div>';
  box.querySelectorAll('[data-snap]').forEach(b=>b.onclick=()=>{const sn=list[+b.dataset.snap];bkConfirmRestore({app:'sparkle',at:sn.at,data:sn.data},bkFmt(sn.at)+' の状態')});
}

/* ---------- 既存画面との接続 ---------- */
function bkInstall(){
  // 保存失敗（容量不足など）を知らせる
  const _save=saveProg;let warned=false;
  saveProg=function(p){try{_save(p)}catch(e){if(!warned){warned=true;showToast('記録を保存できませんでした。「学習記録の保存」からバックアップしてください')}}};
  // プロフィールに入口
  const _rp=renderProfile;
  renderProfile=function(){
    _rp.apply(this,arguments);
    const scr=document.getElementById('screen-profile');if(!scr)return;
    const m=bkMeta();const since=bkDaysSince(m.lastExport);
    const card=document.createElement('button');card.className='card bk-entry';card.id='bk-entry';
    card.innerHTML=`<span class="tk-mode-ic">${ICONS.bookmark}</span><span class="bk-entry-b"><span class="tk-row-t">学習記録の保存</span><span class="tk-row-s">${since==null?'まだバックアップがありません':since+'日前にバックアップ'} · 機種変更・復元もここから</span></span><span class="tk-row-go">${ICONS.arrowRight}</span>`;
    card.onclick=openBackup;
    const title=scr.querySelector('.sec-title');
    if(title)title.after(card);else scr.prepend(card);
  };
  // ホーム：バックアップが7日以上ないとお知らせ（学習が進んでから）
  const _home=renderHome;
  renderHome=function(){
    _home.apply(this,arguments);
    const home=document.getElementById('screen-home');if(!home)return;
    const m=bkMeta();const since=bkDaysSince(m.lastExport);const s=bkSummary(bkCollect());
    if(s.xp<150||(since!=null&&since<7)||m.snooze===todayStr())return;
    const n=document.createElement('div');n.className='card bk-nudge';
    n.innerHTML=`<span class="bk-ic warn">${ICONS.bookmark}</span><div class="bk-nudge-b"><div class="tk-row-t">${since==null?'学習記録をバックアップしよう':'最後のバックアップから'+since+'日'}</div><div class="tk-row-s">${s.xp} XP の記録を1タップで保存</div></div><button class="btn btn-gold" id="bk-nudge-go">保存</button><button class="tk-link" id="bk-nudge-x" aria-label="今日は表示しない">×</button>`;
    const q=home.querySelector('.gw-quests');(q||home.lastElementChild).after(n);
    n.querySelector('#bk-nudge-go').onclick=bkExportFile;
    n.querySelector('#bk-nudge-x').onclick=()=>{bkSetMeta({snooze:todayStr()});n.remove()};
  };
  bkPersist();
  bkSnapshot();
  // 記録が壊れていたら、直近の良いスナップショットへの復元をすぐ提案する
  if(window._bkCorrupt)bkList().then(list=>{const sn=list.find(x=>x.id.startsWith('day-'))||list[0];if(sn)setTimeout(()=>bkConfirmRestore({app:'sparkle',at:sn.at,data:sn.data},bkFmt(sn.at)+' の状態'),1200)});
  // アプリを離れるたびに今日のスナップショットを更新
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')bkSnapshot()});
  if(typeof curTab!=='undefined'&&curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome();
}
document.addEventListener('DOMContentLoaded',bkInstall);
