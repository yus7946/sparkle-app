/* ========== コインと着せかえ（Sparkのへや） ==========
   ・学習の実績でコインがたまる（今日の目標・全問正解・シャドーイング・模試・レベルアップ・連続学習など）
   ・コインで帽子・顔・首まわりのアイテムを買って Spark に着せられる。ニックネームもここで変更
   ・課金はなし（$0運用。コインは学習でのみ手に入る）
   spark.js の後に読み込む。 */
'use strict';

const SPK_COIN_SVG='<svg class="spk-coin-ic" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#ffc83d" stroke="#e08a00" stroke-width="1.4"/><circle cx="10" cy="10" r="6.2" fill="none" stroke="#fff3b0" stroke-width="1"/><path d="M10 5.6l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#fff6d0"/></svg>';
const SPK_COIN_RULES=[['今日の目標・ボーナスの課題 1つ',5],['今日の目標クリア',30],['全問正解のドリル',10],['シャドーイング 1本（80%以上で+5）',10],['模試',30],['レベルアップ',20],['連続学習 3・7・14・30日','20〜200'],['たまごがかえる／進化',50+'／'+100]];
// slot: head / face / neck。draw(g) は Spark の頭や顔の位置（ht=頭のてっぺん, ey=目の高さ, W=体の半幅）に合わせて描く
const SPK_ITEMS=[
  {id:'ribbon',slot:'head',name:'リボン',p:60,draw:g=>`<g transform="translate(${80+g.W*0.5} ${g.ht+9}) rotate(18)"><path d="M0 0 L-13 -8 Q-16 0 -13 8Z M0 0 L13 -8 Q16 0 13 8Z" fill="#ff6fa0" stroke="#d94a80" stroke-width="1.2" stroke-linejoin="round"/><circle r="3.6" fill="#ff8fb6" stroke="#d94a80" stroke-width="1.2"/></g>`},
  {id:'straw',slot:'head',name:'麦わら帽子',p:100,draw:g=>`<g><ellipse cx="80" cy="${g.ht+9}" rx="${g.W*0.98}" ry="8" fill="#f2d27a" stroke="#c99a3c" stroke-width="1.3"/><path d="M${80-g.W*0.5} ${g.ht+8} Q${80-g.W*0.48} ${g.ht-12} 80 ${g.ht-13} Q${80+g.W*0.48} ${g.ht-12} ${80+g.W*0.5} ${g.ht+8}Z" fill="#f6dc8e" stroke="#c99a3c" stroke-width="1.3"/><path d="M${80-g.W*0.5} ${g.ht+3} Q80 ${g.ht+7} ${80+g.W*0.5} ${g.ht+3} L${80+g.W*0.5} ${g.ht+8} Q80 ${g.ht+12} ${80-g.W*0.5} ${g.ht+8}Z" fill="#e0483a"/></g>`},
  {id:'beret',slot:'head',name:'ベレー帽',p:120,draw:g=>`<g transform="rotate(-12 80 ${g.ht+4})"><ellipse cx="78" cy="${g.ht+3}" rx="${g.W*0.66}" ry="10" fill="#2b3f72"/><ellipse cx="74" cy="${g.ht}" rx="${g.W*0.4}" ry="4" fill="#3d5594" opacity=".8"/><path d="M78 ${g.ht-7} q1 -5 4 -6" stroke="#2b3f72" stroke-width="3" stroke-linecap="round" fill="none"/></g>`},
  {id:'phones',slot:'head',name:'ヘッドホン',p:150,draw:g=>`<g><path d="M${80-g.W+3} ${g.ey-2} Q${80-g.W+2} ${g.ht-10} 80 ${g.ht-10} Q${80+g.W-2} ${g.ht-10} ${80+g.W-3} ${g.ey-2}" stroke="#2b2f3a" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="${80-g.W-6}" y="${g.ey-12}" width="14" height="22" rx="7" fill="#2b2f3a"/><rect x="${80-g.W-3}" y="${g.ey-8}" width="5" height="14" rx="2.5" fill="#7cc8ff"/><rect x="${80+g.W-8}" y="${g.ey-12}" width="14" height="22" rx="7" fill="#2b2f3a"/><rect x="${80+g.W-2}" y="${g.ey-8}" width="5" height="14" rx="2.5" fill="#7cc8ff"/></g>`},
  {id:'crown',slot:'head',name:'王冠',p:300,draw:g=>`<g><path d="M66 ${g.ht+4} L64 ${g.ht-14} L72 ${g.ht-6} L80 ${g.ht-18} L88 ${g.ht-6} L96 ${g.ht-14} L94 ${g.ht+4}Z" fill="#ffcc3d" stroke="#d98a00" stroke-width="1.4" stroke-linejoin="round"/><circle cx="80" cy="${g.ht-3}" r="2.6" fill="#ff5a7a"/><circle cx="70" cy="${g.ht-1}" r="1.8" fill="#5fb6ff"/><circle cx="90" cy="${g.ht-1}" r="1.8" fill="#5fb6ff"/></g>`},
  {id:'gradcap',slot:'head',name:'卒業帽（650点の証）',p:400,draw:g=>`<g><path d="M${80-14} ${g.ht-2} L${80-14} ${g.ht+6} Q80 ${g.ht+11} ${80+14} ${g.ht+6} L${80+14} ${g.ht-2}Z" fill="#1d2438"/><polygon points="80,${g.ht-14} 106,${g.ht-4} 80,${g.ht+5} 54,${g.ht-4}" fill="#262e48" stroke="#11162a" stroke-width="1"/><path d="M80 ${g.ht-4} L100 ${g.ht+2} L100 ${g.ht+14}" stroke="#ffc83d" stroke-width="1.8" fill="none"/><circle cx="100" cy="${g.ht+16}" r="2.6" fill="#ffc83d"/></g>`},
  {id:'starcheek',slot:'face',name:'ほっぺの星',p:50,draw:g=>`<polygon points="${spkStar(80-g.W+15,g.ey+11,5,2.2)}" fill="#ffd34d" stroke="#e39b00" stroke-width=".8"/><polygon points="${spkStar(80+g.W-15,g.ey+11,5,2.2)}" fill="#ffd34d" stroke="#e39b00" stroke-width=".8"/>`},
  {id:'roundglasses',slot:'face',name:'まるメガネ',p:80,draw:g=>`<g fill="#fff" fill-opacity=".15" stroke="#b07a1e" stroke-width="2.2"><circle cx="66" cy="${g.ey}" r="11.5"/><circle cx="94" cy="${g.ey}" r="11.5"/></g><path d="M77.5 ${g.ey-1} Q80 ${g.ey-4} 82.5 ${g.ey-1}" stroke="#b07a1e" stroke-width="2" fill="none"/>`},
  {id:'sunglasses',slot:'face',name:'サングラス',p:150,draw:g=>`<g><rect x="53" y="${g.ey-8}" width="25" height="16" rx="7" fill="#1b2232"/><rect x="82" y="${g.ey-8}" width="25" height="16" rx="7" fill="#1b2232"/><path d="M78 ${g.ey-3} L82 ${g.ey-3}" stroke="#1b2232" stroke-width="3"/><path d="M57 ${g.ey-4} L64 ${g.ey-4}" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/><path d="M86 ${g.ey-4} L93 ${g.ey-4}" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/></g>`},
  {id:'bowtie',slot:'neck',name:'蝶ネクタイ',p:80,draw:g=>`<g transform="translate(80 ${g.ey+28})"><path d="M0 0 L-12 -7 L-12 7Z M0 0 L12 -7 L12 7Z" fill="#e0483a" stroke="#a82c22" stroke-width="1.2" stroke-linejoin="round"/><rect x="-3.5" y="-3.5" width="7" height="7" rx="2" fill="#c43a2e"/></g>`},
  {id:'scarf',slot:'neck',name:'マフラー',p:120,draw:g=>`<g><path d="M${80-g.W*0.8} ${g.ey+22} Q80 ${g.ey+34} ${80+g.W*0.8} ${g.ey+22} L${80+g.W*0.82} ${g.ey+30} Q80 ${g.ey+42} ${80-g.W*0.82} ${g.ey+30}Z" fill="#e0483a"/><path d="M${80-g.W*0.6} ${g.ey+27} Q80 ${g.ey+37} ${80+g.W*0.6} ${g.ey+27}" stroke="#fff" stroke-width="2.4" fill="none" opacity=".9"/><path d="M${80+g.W*0.38} ${g.ey+32} l6 18 l-9 1 l-4 -16Z" fill="#c83a2e"/></g>`},
  {id:'lei',slot:'neck',name:'フラワーレイ',p:150,draw:g=>{const c=['#ff6fa0','#ffd34d','#fff','#ff9b5a','#c99bff'];let o='';for(let i=0;i<9;i++){const t=i/8,x=80-g.W*0.78+t*g.W*1.56,y=g.ey+24+Math.sin(t*Math.PI)*10;o+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.6" fill="${c[i%c.length]}" stroke="#fff" stroke-width=".8"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.4" fill="#ffd34d"/>`}return o}},
  {id:'medal',slot:'neck',name:'金メダル',p:250,draw:g=>`<g><path d="M70 ${g.ey+20} L80 ${g.ey+34} L90 ${g.ey+20}" stroke="#2f7fe0" stroke-width="5" fill="none" stroke-linejoin="round"/><circle cx="80" cy="${g.ey+38}" r="7.5" fill="#ffc83d" stroke="#d98a00" stroke-width="1.4"/><polygon points="${spkStar(80,g.ey+38,4.2,1.8)}" fill="#fff6c2"/></g>`}
];
const SPK_SLOTS=[['head','ぼうし'],['face','かお'],['neck','くび']];
function spkWearSVG(g,wear){
  if(!wear)return'';
  return['neck','face','head'].map(sl=>{const it=SPK_ITEMS.find(x=>x.id===wear[sl]);return it?it.draw(g):''}).join('');
}

/* ---------- コイン ---------- */
function spkCoins(){return spk().coins||0}
function spkCoin(n,why){
  if(!n)return;const s=spk();s.coins=(s.coins||0)+n;commit();
  const el=document.createElement('div');el.className='spk-coin-pop';el.innerHTML=`${SPK_COIN_SVG}<b>+${n}</b><span>${esc(why||'')}</span>`;
  document.body.appendChild(el);setTimeout(()=>el.remove(),2300);
  spkCoinPill();
}
function spkCoinPill(){
  const st=document.getElementById('hdr-streak');if(!st)return;
  let p=document.getElementById('hdr-coin');
  if(!p){p=document.createElement('button');p.id='hdr-coin';p.className='hdr-pill spk-coin-pill';p.setAttribute('aria-label','コインとSparkのへや');p.onclick=()=>openSparkRoom();st.parentElement.insertBefore(p,st)}
  p.innerHTML=SPK_COIN_SVG+'<span>'+spkCoins()+'</span>';
}

/* ---------- Sparkのへや ---------- */
let spkRoomTab='head';
function openSparkRoom(){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  const el=document.getElementById('screen-review');el.classList.add('active');
  const s=spk();s.own=s.own||[];s.wear=s.wear||{};
  const r=gwRank(),st=spkStageOfLv(r.lv),sp=spkSpecies(),egg=st.n===1;
  // たまごの間は、グレーのお試しモデルで着せかえを見られる
  const model=egg?{...SPK_SPECIES[0],id:'model',c:['#f7f8fb','#d9dee8','#a3adc0']}:sp;
  const mst=egg?SPK_STAGES[1]:st,rar=sp&&!egg?SPK_RARITY[sp.r]:null;
  const items=SPK_ITEMS.filter(x=>x.slot===spkRoomTab);
  el.innerHTML=`<div class="back-row"><button class="icon-btn" id="spk-r-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>Sparkのへや</h2><span class="spk-coin-big">${SPK_COIN_SVG}<b>${spkCoins()}</b></span></div>
    <div class="card spk-room">
      <button class="spk-stage spk-room-pv" aria-label="Sparkに話しかける">${egg?spkEggSVG('hello'):sparkSVG(st,'hello')}</button>
      <div class="spk-room-name">${egg?'ナゾのたまご':esc(spkNick())}</div>
      <div class="spk-room-sub">${egg?`あと${5-r.lv}レベルで孵化 · 何が生まれるかはお楽しみ`:`<span style="color:${rar[2]}">${rar[0]} ${sp.type}タイプ</span> · Lv.${r.lv} ${spkName(st,sp)}`}</div>
      ${egg?'':`<div class="spk-nick-row"><input id="spk-nick" maxlength="10" value="${esc(s.nick||'')}" placeholder="${sp.name}" aria-label="ニックネーム"><button class="btn btn-secondary" id="spk-nick-save">名前を変える</button></div>`}
    </div>
    ${egg?'<div class="hb-note">たまごがかえったら着せかえできます。アイテムは今のうちに買っておけます（下はお試しモデル）。</div>':''}
    <div class="spk-tabs">${SPK_SLOTS.map(([k,l])=>`<button class="${k===spkRoomTab?'on':''}" data-tab="${k}">${l}</button>`).join('')}</div>
    <div class="spk-items">${items.map(it=>{const own=s.own.includes(it.id),on=s.wear[it.slot]===it.id,can=spkCoins()>=it.p;
      return`<div class="spk-item${on?' on':''}"><div class="spk-item-pv">${sparkSVG(mst,'hello',model,{...(egg?{}:s.wear),[it.slot]:it.id})}</div><div class="spk-item-n">${esc(it.name)}</div>
        <button class="btn ${own?(on?'btn-secondary':'btn-gold'):'btn-secondary'} spk-item-b" data-it="${it.id}" ${!own&&!can?'disabled':''}>${own?(on?'はずす':'着る'):`${SPK_COIN_SVG}${it.p}`}</button></div>`}).join('')}</div>
    <details class="card spk-rules"><summary>${SPK_COIN_SVG} コインのため方</summary>${SPK_COIN_RULES.map(([t,n])=>`<div><span>${t}</span><b>+${n}</b></div>`).join('')}<div class="hb-note">コインは学習でだけ手に入ります。続けるほど、おしゃれの幅が広がります。</div></details>`;
  document.getElementById('spk-r-back').onclick=()=>go('home');
  el.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{spkRoomTab=b.dataset.tab;openSparkRoom()});
  const sv=document.getElementById('spk-nick-save');
  if(sv)sv.onclick=()=>{const v=document.getElementById('spk-nick').value.trim().slice(0,10);s.nick=v||'';commit();showToast(v?`「${v}」になりました`:'名前を元に戻しました');openSparkRoom()};
  el.querySelectorAll('[data-it]').forEach(b=>b.onclick=()=>{
    const it=SPK_ITEMS.find(x=>x.id===b.dataset.it);
    if(!s.own.includes(it.id)){
      if(spkCoins()<it.p)return;
      s.coins-=it.p;s.own.push(it.id);s.wear[it.slot]=it.id;commit();sfx('unlock');spkCoinPill();
      showToast(`${it.name}を手に入れた！`);
    }else s.wear[it.slot]=s.wear[it.slot]===it.id?null:it.id;
    commit();openSparkRoom();
  });
  window.scrollTo(0,0);
}

/* ---------- コインがたまるタイミング ---------- */
function spkClosetInstall(){
  if(typeof spk!=='function')return;
  // 今日のメニューの課題（目標・ボーナス）＋今日の目標クリア
  const _mp=markPlanTaskDone;
  markPlanTaskDone=function(id){
    const k='plan_'+todayStr(),had=(PROG[k]||[]).includes(id);
    const r=_mp.apply(this,arguments);
    if(!had){spkCoin(5,'課題クリア');
      if(typeof hbSplit==='function'&&typeof p6Ready==='function'&&p6Ready()&&hbSplit().coreDone&&spk().goalCoin!==todayStr()){spk().goalCoin=todayStr();commit();setTimeout(()=>spkCoin(30,'今日の目標クリア'),900)}}
    return r;
  };
  const _dr=renderTOEICDrillResult;
  renderTOEICDrillResult=function(){const st=toeicDrillState;const r=_dr.apply(this,arguments);if(st&&st.items&&st.items.length>=3&&st.score===st.items.length)spkCoin(10,'全問正解');return r};
  if(typeof lxShFinish==='function'){const _sf=lxShFinish;lxShFinish=function(){const s=lxSh;const v=s?s.scores.filter(x=>x&&x.v!=null).map(x=>x.v):[];const avg=v.length?v.reduce((a,b)=>a+b,0)/v.length:0;const r=_sf.apply(this,arguments);spkCoin(avg>=80?15:10,'シャドーイング');return r}}
  const _fm=finishMock;finishMock=function(){const r=_fm.apply(this,arguments);spkCoin(30,'模試');return r};
  const _gc=gwCelebrate;gwCelebrate=function(o){const r=_gc.apply(this,arguments);if(o&&o.lv)setTimeout(()=>spkCoin(20,'レベルアップ'),400);return r};
  const _us=updateStreak;
  updateStreak=function(){const c=_us.apply(this,arguments);const m={3:20,7:50,14:100,30:200}[c];if(m&&spk().stCoin!==c+'@'+todayStr()){spk().stCoin=c+'@'+todayStr();commit();setTimeout(()=>spkCoin(m,c+'日連続'),1500)}return c};
  // ヘッダーにコイン、プロフィールに「Sparkのへや」の入口
  const _rh=renderHeader;renderHeader=function(){const r=_rh.apply(this,arguments);spkCoinPill();return r};
  const _rp=renderProfile;
  renderProfile=function(){
    _rp.apply(this,arguments);
    const scr=document.getElementById('screen-profile');if(!scr||scr.querySelector('#spk-room-entry'))return;
    const b=document.createElement('button');b.className='card spk-room-entry';b.id='spk-room-entry';
    const st=spkStage();b.innerHTML=`<span class="spk-room-entry-pv">${st.n===1?spkEggSVG('hello'):sparkSVG(st,'hello')}</span><span class="spk-room-entry-b"><b>Sparkのへや</b><small>着せかえ・名前 · ${SPK_COIN_SVG}${spkCoins()}</small></span><span>${ICONS.arrowRight}</span>`;
    b.onclick=openSparkRoom;scr.prepend(b);
  };
  spkCoinPill();
}
if(typeof go==='function')spkClosetInstall();
