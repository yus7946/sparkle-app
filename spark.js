/* ========== Spark — 一緒に成長するキャラクター ==========
   ・SVG＋CSSアニメーションで描く立体風キャラクター（光沢・陰影・ふちの光／まばたき・呼吸・浮遊）
   ・最初は「ナゾのたまご」。成長ランク Lv5 で孵化し、9種類のどれかがランダムで生まれる（ガチャ）
     ★ノーマル：空・森・炎・海　★★レア：月・桜・雷　★★★スーパーレア：虹・宇宙
     種類ごとに色・体の形・頭の飾りが違う。卵はレベルが上がるほどヒビが入り、光が漏れてくる
   ・その後も Lv10/15/20/30 で進化（腕→翼→光の輪→銀河の軌道）。進化と孵化は専用の演出
   ・結果画面・ホーム・学習中の要所で声をかけて励ます
   index.html / growth.js / habit.js の後に読み込む。 */
'use strict';

const SPK_STAGES=[
  {n:1,from:1,pre:''},{n:2,from:5,pre:'ベビー'},{n:3,from:10,pre:''},
  {n:4,from:15,pre:'スター'},{n:5,from:20,pre:'ノヴァ'},{n:6,from:30,pre:'ギャラクシー'}
];
// r=レア度, w=出やすさ, shape=体の形, acc=頭の飾り
const SPK_SPECIES=[
  {id:'sky',name:'ソラ',type:'空',r:1,w:15,c:['#f3faff','#7cc8ff','#2f7fe0'],shape:'round',acc:'star',desc:'素直にぐんぐん伸びる、まっすぐなタイプ'},
  {id:'leaf',name:'モリ',type:'森',r:1,w:15,c:['#f4fff0','#94e08c','#2c9650'],shape:'mochi',acc:'leaf',desc:'コツコツ型。毎日の積み重ねで大きく育つ'},
  {id:'flame',name:'ホムラ',type:'炎',r:1,w:15,c:['#fff6ea','#ffa45a','#e0442a'],shape:'drop',acc:'flame',desc:'負けず嫌い。模試の日にいちばん燃える'},
  {id:'aqua',name:'ミナモ',type:'海',r:1,w:15,c:['#effffd','#6fe0d6','#138e9c'],shape:'round',acc:'fin',desc:'耳がいい。リスニングが得意なタイプ'},
  {id:'moon',name:'ルナ',type:'月',r:2,w:11,c:['#f6f2ff','#b9a8ff','#5643c6'],shape:'round',acc:'moon',ears:'cat',desc:'夜型。寝る前の5分にいちばん強い'},
  {id:'sakura',name:'サクラ',type:'桜',r:2,w:11,c:['#fff5f8','#ffb6d0','#de5d8c'],shape:'mochi',acc:'blossom',desc:'人なつっこい。英会話が大好き'},
  {id:'bolt',name:'イカズチ',type:'雷',r:2,w:10,c:['#fffde8','#ffe25a','#e3a000'],shape:'round',acc:'bolt',desc:'スピード派。Part 5を20秒で解き切る'},
  {id:'prism',name:'ニジ',type:'虹',r:3,w:5,c:['#ffffff','#ffd6f4','#86a9ff'],shape:'round',acc:'crystal',fx:'rainbow',desc:'超レア！どんな問題にも輝くオールラウンダー'},
  {id:'cosmo',name:'コスモ',type:'宇宙',r:3,w:3,c:['#e9edff','#5f71ff','#1a1f6e'],shape:'round',acc:'star',fx:'galaxy',desc:'超レア！宇宙のように果てしなく伸びる'}
];
const SPK_RARITY={1:['★','ノーマル','#2f7fe0'],2:['★★','レア','#7b5cff'],3:['★★★','スーパーレア','#e39b00']};
function spkStageOfLv(lv){return SPK_STAGES.slice().reverse().find(s=>lv>=s.from)||SPK_STAGES[0]}
function spkStage(){return spkStageOfLv(gwRank().lv)}
function spk(){return PROG.spk||(PROG.spk={})}
function spkSpecies(){return SPK_SPECIES.find(s=>s.id===spk().species)||null}
function spkName(st,sp){return st.n===1||!sp?'ナゾのたまご':st.pre+sp.name}
function spkNick(){const s=spk(),sp=spkSpecies();return s.nick||(sp?sp.name:'Spark')}
function spkRoll(){let t=Math.random()*SPK_SPECIES.reduce((a,s)=>a+s.w,0);for(const s of SPK_SPECIES){t-=s.w;if(t<0)return s}return SPK_SPECIES[0]}
function spkCrack(){const r=gwRank();return Math.min(1,Math.max(0,(r.lv-1+r.pct/100)/4))}
let spkUid=0;
const spkStar=(cx,cy,R,r)=>{let p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,d=i%2?r:R;p.push((cx+Math.cos(a)*d).toFixed(1)+','+(cy+Math.sin(a)*d).toFixed(1))}return p.join(' ')};
const SPK_TW='M0,-6 Q1,-1 6,0 Q1,1 0,6 Q-1,1 -6,0 Q-1,-1 0,-6Z';
const spkTw=(n,cols)=>[[26,40],[136,50],[132,128],[22,118],[142,90],[18,78]].slice(0,n).map(([x,y],i)=>`<g transform="translate(${x} ${y}) scale(${i%2?0.7:1})"><path class="spk-tw" style="animation-delay:${(i*0.45).toFixed(2)}s" d="${SPK_TW}" fill="${cols[i%cols.length]}"/></g>`).join('');

/* ---------- ナゾのたまご ---------- */
function spkEggSVG(mood,crack){
  const u='spk'+(++spkUid),c=crack==null?spkCrack():crack;
  // ヒビは成長に合わせて伸びる。後半はすき間から光が漏れる
  const pts=[[80,52],[74,62],[84,70],[76,80],[86,90],[78,100]];const k=Math.max(0,Math.round(c*(pts.length-1)));
  const crackPath=k?'M'+pts.slice(0,k+1).map(p=>p.join(' ')).join(' L'):'';
  return `<svg class="spk spk-egg spk-m-${mood||'hello'}" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
    <radialGradient id="${u}e" cx="36%" cy="28%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#fdf2dc"/><stop offset="1" stop-color="#e2c48e"/></radialGradient>
    <linearGradient id="${u}z" x1="0" x2="1"><stop offset="0" stop-color="#ffb3cf"/><stop offset=".33" stop-color="#ffe27a"/><stop offset=".66" stop-color="#8fe3c0"/><stop offset="1" stop-color="#7cc8ff"/></linearGradient>
    <radialGradient id="${u}a"><stop offset="0" stop-color="#ffe9a8" stop-opacity="${0.25+c*0.5}"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
    <linearGradient id="${u}r" x1="0" y1="0" x2="1" y2="1"><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>
    <clipPath id="${u}c"><ellipse cx="80" cy="90" rx="35" ry="44"/></clipPath></defs>
    <circle class="spk-aura" cx="80" cy="90" r="64" fill="url(#${u}a)"/>
    <ellipse class="spk-shadow" cx="80" cy="148" rx="28" ry="5" fill="#14305a" opacity=".16"/>
    <g class="spk-float"><g class="spk-eggwob">
      <ellipse cx="80" cy="90" rx="35" ry="44" fill="url(#${u}e)"/>
      <g clip-path="url(#${u}c)"><path d="M40 98 L50 90 L60 98 L70 90 L80 98 L90 90 L100 98 L110 90 L120 98 L120 110 L110 102 L100 110 L90 102 L80 110 L70 102 L60 110 L50 102 L40 110Z" fill="url(#${u}z)" opacity=".85"/>
        <circle cx="64" cy="70" r="5" fill="#ffb3cf" opacity=".8"/><circle cx="96" cy="66" r="3.5" fill="#7cc8ff" opacity=".85"/><circle cx="92" cy="122" r="5" fill="#8fe3c0" opacity=".85"/><circle cx="62" cy="124" r="3.2" fill="#ffe27a"/><circle cx="104" cy="84" r="2.6" fill="#b9a8ff"/>
        <ellipse cx="80" cy="128" rx="34" ry="10" fill="#c9a66a" opacity=".25"/></g>
      <ellipse cx="80" cy="90" rx="34.2" ry="43.2" fill="none" stroke="url(#${u}r)" stroke-width="2.4"/>
      ${crackPath?`${c>0.55?`<path d="${crackPath}" stroke="#fff3b0" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".55" class="spk-leak"/>`:''}<path d="${crackPath}" stroke="#a57c3e" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`:''}
      <ellipse cx="66" cy="66" rx="9" ry="5.5" fill="#fff" opacity=".8" transform="rotate(-30 66 66)"/><circle cx="76" cy="58" r="2.2" fill="#fff" opacity=".7"/>
    </g></g>${spkTw(3,['#fff','#ffd56b'])}</svg>`;
}

/* ---------- 生まれたあとの姿 ---------- */
// st=進化段階, mood='hello'|'win'|'cheer'|'study', sp=種類
function sparkSVG(st,mood,sp,wear){
  st=st||spkStage();mood=mood||'hello';
  if(st.n===1)return spkEggSVG(mood);
  sp=sp||spkSpecies()||SPK_SPECIES[0];
  const u='spk'+(++spkUid),[c1,c2,c3]=sp.c,n=st.n,ink='#1b2747';
  const R=n===2?36:42,cy=n===2?94:88;
  const shape=sp.shape,ht=shape==='drop'?cy-R-14:shape==='mochi'?cy-R+7:cy-R,ey=shape==='mochi'?cy+3:cy-2;
  const body=shape==='drop'?`<path d="M80 ${cy-R-14} C${80+R*0.45} ${cy-R*0.75} ${80+R} ${cy-R*0.35} ${80+R} ${cy+R*0.05} A${R} ${R} 0 0 1 ${80-R} ${cy+R*0.05} C${80-R} ${cy-R*0.35} ${80-R*0.45} ${cy-R*0.75} 80 ${cy-R-14}Z"/>`
    :shape==='mochi'?`<ellipse cx="80" cy="${cy+3}" rx="${R+7}" ry="${R-4}"/>`:`<circle cx="80" cy="${cy}" r="${R}"/>`;
  const W=shape==='mochi'?R+7:R,bottom=shape==='mochi'?cy+R-1:cy+R;
  const fill=(s,a)=>s.replace('/>',' '+a+'/>');
  const defs=`<defs>
    <radialGradient id="${u}b" cx="36%" cy="28%" r="78%"><stop offset="0" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></radialGradient>
    <radialGradient id="${u}a"><stop offset="0" stop-color="${n>=6?'#ffd76a':c2}" stop-opacity="${0.22+n*0.07}"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${u}r" x1="0" y1="0" x2="1" y2="1"><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>
    <linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".5" stop-color="#ffc83d"/><stop offset="1" stop-color="#ef8a00"/></linearGradient>
    <linearGradient id="${u}k" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c3}"/><stop offset="1" stop-color="${c1}"/></linearGradient>
    <linearGradient id="${u}w" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="${c2}" stop-opacity=".55"/></linearGradient>
    <linearGradient id="${u}f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a2a"/><stop offset=".6" stop-color="#ffb13d"/><stop offset="1" stop-color="#fff2a0"/></linearGradient>
    <linearGradient id="${u}x" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff9ad5"/><stop offset=".25" stop-color="#ffe27a"/><stop offset=".5" stop-color="#8fe3c0"/><stop offset=".75" stop-color="#7cc8ff"/><stop offset="1" stop-color="#c9a2ff"/></linearGradient>
    <clipPath id="${u}c">${body}</clipPath></defs>`;
  // 目と口（気分で変わる）
  const eyes=(dy)=>sp.id==='moon'&&mood==='hello'
    ?`<g class="spk-eyes"><path d="M59 ${ey+dy} Q66 ${ey+dy+5} 73 ${ey+dy}" stroke="${ink}" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M87 ${ey+dy} Q94 ${ey+dy+5} 101 ${ey+dy}" stroke="${ink}" stroke-width="3.2" fill="none" stroke-linecap="round"/></g>`
    :`<g class="spk-eyes"><ellipse cx="66" cy="${ey+dy}" rx="6.6" ry="8.6" fill="${ink}"/><ellipse cx="94" cy="${ey+dy}" rx="6.6" ry="8.6" fill="${ink}"/>
    <circle cx="63.6" cy="${ey+dy-3.2}" r="2.7" fill="#fff"/><circle cx="91.6" cy="${ey+dy-3.2}" r="2.7" fill="#fff"/><circle cx="68" cy="${ey+dy+3.4}" r="1.2" fill="#fff" opacity=".85"/><circle cx="96" cy="${ey+dy+3.4}" r="1.2" fill="#fff" opacity=".85"/></g>`;
  let face='';
  if(mood==='win')face=`<path d="M59 ${ey+2} Q66 ${ey-7} 73 ${ey+2}" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M87 ${ey+2} Q94 ${ey-7} 101 ${ey+2}" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M71 ${ey+11} Q80 ${ey+25} 89 ${ey+11} Z" fill="${ink}"/><path d="M75 ${ey+17} Q80 ${ey+14} 85 ${ey+17} Q80 ${ey+22} 75 ${ey+17}Z" fill="#ff7d92"/>`;
  else if(mood==='cheer')face=eyes(0)+`<path d="M59 ${ey-14} Q65 ${ey-19} 71 ${ey-15}" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M89 ${ey-15} Q95 ${ey-19} 101 ${ey-14}" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M73 ${ey+12} Q80 ${ey+21} 87 ${ey+12} Z" fill="${ink}"/>`;
  else if(mood==='study')face=eyes(2)+`<g fill="#fff" fill-opacity=".18" stroke="${ink}" stroke-width="2"><circle cx="66" cy="${ey+2}" r="11.5"/><circle cx="94" cy="${ey+2}" r="11.5"/></g><path d="M77.5 ${ey+1} Q80 ${ey-2} 82.5 ${ey+1}" stroke="${ink}" stroke-width="2" fill="none"/>
    <path d="M75 ${ey+16} Q80 ${ey+19} 85 ${ey+16}" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  else face=eyes(0)+`<path d="M73 ${ey+13} Q80 ${ey+19} 87 ${ey+13}" stroke="${ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  const blush=`<ellipse cx="${80-W+15}" cy="${ey+11}" rx="6.5" ry="3.6" fill="#ff8fa6" opacity=".5"/><ellipse cx="${80+W-15}" cy="${ey+11}" rx="6.5" ry="3.6" fill="#ff8fa6" opacity=".5"/>`;
  // 種類ごとの頭の飾り（進化するほど大きく）
  const s=n>=4?1.3:n>=3?1.1:0.9;
  const ACC={
    star:`<path d="M80 ${ht+3} Q77 ${ht-10} 84 ${ht-18}" stroke="${c3}" stroke-width="3.2" fill="none" stroke-linecap="round"/><polygon points="${spkStar(85,ht-22,8*s,3.5*s)}" fill="url(#${u}g)" stroke="#e38a00" stroke-width="1" stroke-linejoin="round"/>`,
    leaf:`<path d="M80 ${ht+3} Q79 ${ht-6} 81 ${ht-12}" stroke="#2c7a3e" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M81 ${ht-11} Q${81+13*s} ${ht-26*s} ${81+24*s} ${ht-14} Q${81+12*s} ${ht-4} 81 ${ht-11}Z" fill="url(#${u}k)" stroke="#2c7a3e" stroke-width="1.2"/>${n>=3?`<path d="M80 ${ht-9} Q${80-10*s} ${ht-22*s} ${80-19*s} ${ht-12} Q${80-9*s} ${ht-3} 80 ${ht-9}Z" fill="url(#${u}k)" stroke="#2c7a3e" stroke-width="1.2"/>`:''}`,
    flame:`<g class="spk-flame"><path d="M80 ${ht+6} C${80-12*s} ${ht-2} ${80-8*s} ${ht-14*s} 80 ${ht-24*s} C${80+2*s} ${ht-14*s} ${80+10*s} ${ht-16*s} ${80+8*s} ${ht-26*s} C${80+18*s} ${ht-12*s} ${80+14*s} ${ht} 80 ${ht+6}Z" fill="url(#${u}f)"/></g>`,
    fin:`<path d="M${80-10*s} ${ht+6} Q${80-4*s} ${ht-20*s} ${80+14*s} ${ht-12*s} Q${80+6*s} ${ht-4} ${80+8*s} ${ht+6}Z" fill="url(#${u}k)" stroke="${c3}" stroke-width="1.2"/>`,
    moon:`<path d="M80 ${ht+3} Q78 ${ht-8} 82 ${ht-14}" stroke="${c3}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${84} ${ht-34*s+6} a${9*s} ${9*s} 0 1 0 ${9*s} ${15*s} a${7.5*s} ${7.5*s} 0 1 1 ${-9*s} ${-15*s}Z" fill="url(#${u}g)" stroke="#e38a00" stroke-width="1"/>`,
    blossom:`<g transform="translate(${80+W*0.55} ${ht+8}) scale(${s})">${[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-6" rx="4.6" ry="6.5" fill="#fff" stroke="#f08db0" stroke-width="1" transform="rotate(${a})"/>`).join('')}<circle r="3" fill="#ffd34d"/></g>`,
    bolt:`<polygon points="${[[84,-34],[72,-12],[80,-12],[74,4],[92,-18],[84,-18],[90,-34]].map(([x,y])=>(80+(x-80)*s).toFixed(1)+','+(ht+y*s*0.9).toFixed(1)).join(' ')}" fill="url(#${u}g)" stroke="#d68a00" stroke-width="1.2" stroke-linejoin="round"/>`,
    crystal:`<g class="spk-crystal"><polygon points="80,${ht-34*s} ${80+9*s},${ht-22*s} 80,${ht-6} ${80-9*s},${ht-22*s}" fill="url(#${u}x)" stroke="#fff" stroke-width="1.4"/><polyline points="${80-9*s},${ht-22*s} 80,${ht-18*s} ${80+9*s},${ht-22*s}" fill="none" stroke="#fff" stroke-width="1" opacity=".8"/></g>`
  };
  const acc=`<g class="spk-antenna">${ACC[sp.acc]||ACC.star}</g>`;
  const halo=n>=5?`<ellipse class="spk-halo" cx="80" cy="${ht-12}" rx="24" ry="5.5" fill="none" stroke="url(#${u}g)" stroke-width="3.2" opacity=".95"/>`:'';
  const ears=sp.ears==='cat'?`<path d="M${80-R*0.78} ${cy-R*0.4} L${80-R*0.66} ${cy-R-13} L${80-R*0.12} ${cy-R*0.86}Z" fill="url(#${u}b)"/><path d="M${80-R*0.66} ${cy-R*0.62} L${80-R*0.62} ${cy-R-5} L${80-R*0.34} ${cy-R*0.86}Z" fill="#ffb3cf" opacity=".8"/>
    <path d="M${80+R*0.78} ${cy-R*0.4} L${80+R*0.66} ${cy-R-13} L${80+R*0.12} ${cy-R*0.86}Z" fill="url(#${u}b)"/><path d="M${80+R*0.66} ${cy-R*0.62} L${80+R*0.62} ${cy-R-5} L${80+R*0.34} ${cy-R*0.86}Z" fill="#ffb3cf" opacity=".8"/>`:'';
  const fins=sp.acc==='fin'?`<path d="M${80-R+4} ${cy-4} Q${80-R-20} ${cy-22} ${80-R-15} ${cy+6} Q${80-R-6} ${cy+12} ${80-R+4} ${cy+9}Z" fill="url(#${u}k)"/><path d="M${80+R-4} ${cy-4} Q${80+R+20} ${cy-22} ${80+R+15} ${cy+6} Q${80+R+6} ${cy+12} ${80+R-4} ${cy+9}Z" fill="url(#${u}k)"/>`:'';
  const wings=n>=4?`<g class="spk-wing spk-wing-l"><path d="M${80-W+4} ${cy-6} Q${80-W-30} ${cy-34} ${80-W-24} ${cy+6} Q${80-W-16} ${cy+22} ${80-W+6} ${cy+12}Z" fill="url(#${u}w)"/></g>
    <g class="spk-wing spk-wing-r"><path d="M${80+W-4} ${cy-6} Q${80+W+30} ${cy-34} ${80+W+24} ${cy+6} Q${80+W+16} ${cy+22} ${80+W-6} ${cy+12}Z" fill="url(#${u}w)"/></g>`:'';
  const armY=ey+16;
  const arms=n>=3?`<ellipse cx="${80-W+1}" cy="${armY}" rx="7" ry="10.5" fill="url(#${u}b)" transform="rotate(28 ${80-W+1} ${armY})"/>
    ${mood==='cheer'||mood==='win'?`<g class="spk-arm-r up" style="transform-origin:${80+W-6}px ${ey+6}px"><ellipse cx="${80+W+4}" cy="${ey-8}" rx="7" ry="10.5" fill="url(#${u}b)" transform="rotate(32 ${80+W+4} ${ey-8})"/></g>`:`<ellipse cx="${80+W-1}" cy="${armY}" rx="7" ry="10.5" fill="url(#${u}b)" transform="rotate(-28 ${80+W-1} ${armY})"/>`}`:'';
  const inside=`<g clip-path="url(#${u}c)"><ellipse cx="80" cy="${bottom-4}" rx="${W}" ry="12" fill="${c3}" opacity=".35"/><ellipse cx="80" cy="${cy+18}" rx="${W*0.55}" ry="${R*0.32}" fill="#fff" opacity=".16"/>
    ${sp.fx==='rainbow'?`<rect class="spk-sheen" x="20" y="${cy-R-20}" width="240" height="${2*R+40}" fill="url(#${u}x)" opacity=".38"/>`:''}
    ${sp.fx==='galaxy'||n>=6?[[64,100],[96,108],[84,74],[58,82],[104,90],[72,116],[90,60]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%2?1.1:1.7}" fill="#fff" opacity=".85"/>`).join(''):''}</g>`;
  const shineY=shape==='drop'?cy-R*0.55:ht+R*0.36;
  const shine=`<ellipse cx="${80-W*0.42}" cy="${shineY}" rx="${R*0.3}" ry="${R*0.18}" fill="#fff" opacity=".78" transform="rotate(-30 ${80-W*0.42} ${shineY})"/><circle cx="${80-W*0.08}" cy="${shineY-R*0.18}" r="2.6" fill="#fff" opacity=".6"/>`;
  const orbitOn=n>=6||(sp.fx==='galaxy'&&n>=4);
  const orbit=orbitOn?`<ellipse cx="80" cy="${cy}" rx="70" ry="17" fill="none" stroke="url(#${u}g)" stroke-width="1.6" stroke-dasharray="3 5" opacity=".8" transform="rotate(-12 80 ${cy})"/>`:'';
  const orbitDot=orbitOn?`<g transform="rotate(-12 80 ${cy})"><circle r="4" fill="#ffe08a"><animateMotion dur="5s" repeatCount="indefinite" path="M10,${cy} a70,17 0 1,0 140,0 a70,17 0 1,0 -140,0"/></circle></g>`:'';
  const twCols=sp.acc==='blossom'?['#ffc2d8','#fff']:sp.fx==='rainbow'?['#ff9ad5','#7cc8ff','#ffe27a']:['#fff','#ffd56b'];
  return `<svg class="spk spk-m-${mood} spk-s${n} spk-${sp.id}" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}
    <circle class="spk-aura" cx="80" cy="${cy}" r="${R+26}" fill="url(#${u}a)"/>${orbit}<ellipse class="spk-shadow" cx="80" cy="150" rx="${W*0.72}" ry="5" fill="#14305a" opacity=".16"/>
    <g class="spk-float"><g class="spk-squash">${wings}${fins}${ears}${halo}${acc}
      ${fill(body,`fill="url(#${u}b)"`)}${inside}${fill(body,`fill="none" stroke="url(#${u}r)" stroke-width="2.6"`)}${shine}${blush}<g class="spk-face">${face}</g>${arms}${typeof spkWearSVG==='function'?spkWearSVG({ht,ey,cy,W,R,n,u},wear===undefined?spk().wear:wear):''}</g></g>${orbitDot}${spkTw(Math.min(6,n+1),twCols)}</svg>`;
}

/* ---------- セリフ ---------- */
const SPK_LINES={
  win:[["完璧！その調子！","Perfect! Keep it up!"],["本番でも取れる力がついてきたね","You're getting test-ready!"],["一緒に成長してるね！","We're growing together!"]],
  cheer:[["大丈夫。間違えた問題が、いちばん伸びるところ","Mistakes are where you grow."],["ここで終わらないのがえらい","Proud of you for not quitting."],["解説を読めば、次は取れるよ","Next time you'll get it."]],
  study:[["いい集中！1問ずつ確実に","Nice focus. One at a time."],["今日の積み重ねが、本番の1点になる","Every bit counts."]],
  hello:[["一緒に練習しよう！","Let's practice together!"],["今日も会えてうれしい！","Happy to see you!"],["5分だけでも、ゼロよりずっといい","5 minutes beats zero."]]
};
const spkPick=a=>a[Math.floor(Math.random()*a.length)];
function spkContextLine(){
  const h=new Date().getHours(),streak=getStreak(),due=totalDue();
  if(spkStage().n===1&&Math.random()<0.5){const left=5-gwRank().lv;return[left<=1?'たまごが動いてる…！もうすぐ生まれそう':`あと${left}レベルで、たまごがかえるよ。何が生まれるかな？`,'Something is about to hatch...']}
  if(streak>=7)return[`${streak}日連続！もう習慣になってるね`,`${streak} days in a row!`];
  if(due>=5)return[`${due}個の復習が待ってるよ。忘れる前に一緒に！`,`${due} reviews waiting!`];
  if(h<5||h>=23)return['寝る前に単語5分だけ、どう？','Just 5 minutes before bed?'];
  if(h<10)return['おはよう！通勤の5分から始めよう','Good morning!'];
  if(h<17)return['こんにちは！すきま時間で1セットいこう','Hi there!'];
  return['おつかれさま！今日の目標、一緒に片づけよう','Good evening!'];
}

/* ---------- 結果画面などのキャラクター枠 ---------- */
function spkHeroHTML(mood){
  mood=mood||'hello';const r=gwRank(),st=spkStageOfLv(r.lv),sp=spkSpecies(),next=SPK_STAGES.find(s=>s.n===st.n+1);
  const line=mood==='hello'?spkContextLine():spkPick(SPK_LINES[mood]||SPK_LINES.hello);
  const pct=next?Math.min(100,Math.round(((r.lv-st.from)+r.pct/100)/(next.from-st.from)*100)):100;
  const rar=sp&&st.n>1?SPK_RARITY[sp.r]:null;
  return `<div class="spark-hero spk-hero" role="group" aria-label="Sparkコンパニオン">
    <div class="spark-lv">Lv.${r.lv} ${st.n>1&&spk().nick?esc(spk().nick)+'（'+spkName(st,sp)+'）':spkName(st,sp)}</div>
    ${rar?`<div class="spk-type" style="color:${rar[2]}">${rar[0]} ${sp.type}タイプ</div>`:''}
    <button class="spk-stage" aria-label="Sparkに話しかける" data-mood="${mood}">${sparkSVG(st,mood)}</button>
    <div class="spark-bubble">${esc(line[1])}</div>
    <div class="spark-line"><span class="ja">${esc(line[0])}</span></div>
    <div class="spk-next">${st.n===1?`あと <b>${next.from-r.lv}</b> レベルで たまごがかえる！`:next?`次の進化（${spkName(next,sp)}）まで あと <b>${next.from-r.lv}</b> レベル`:'最終形態！ ここまで一緒に来たね'}</div>
    <div class="spark-xp" aria-label="次の進化までの進み具合"><div class="spark-xp-fill" style="width:${pct}%"></div></div>
  </div>`;
}
// タップで反応（ジャンプ＋別のセリフ）
document.addEventListener('click',e=>{
  const b=e.target.closest('.spk-stage,.spk-mini');if(!b)return;
  if(b.classList.contains('spk-mini')&&typeof openSparkRoom==='function')return openSparkRoom();
  const svg=b.querySelector('.spk');if(svg){svg.classList.remove('spk-poke');void svg.getBBox();svg.classList.add('spk-poke');setTimeout(()=>svg.classList.remove('spk-poke'),700)}
  if(typeof sfx==='function')sfx('tap');
  const hero=b.closest('.spk-hero');
  const line=spkPick([spkContextLine(),...SPK_LINES.hello,...SPK_LINES.win]);
  if(hero){const bb=hero.querySelector('.spark-bubble'),jj=hero.querySelector('.spark-line .ja');if(bb)bb.textContent=line[1];if(jj)jj.textContent=line[0]}
  else sparkSay(line[0],line[1],'hello',{force:true});
});

/* ---------- 吹き出しで声をかける ---------- */
function sparkSay(ja,en,mood,o){
  o=o||{};
  const ob=document.getElementById('onboarding');if(ob&&!ob.classList.contains('hidden'))return;
  if(document.querySelector('.spk-evo'))return;
  const now=Date.now();if(!o.force&&now-(sparkSay._t||0)<8000)return;sparkSay._t=now;
  const old=document.getElementById('spk-coach');if(old)old.remove();
  const el=document.createElement('div');el.id='spk-coach';el.className='spk-coach';el.setAttribute('role','status');
  el.innerHTML=`<div class="spk-coach-b"><b>${esc(ja)}</b>${en?`<small>${esc(en)}</small>`:''}</div><div class="spk-coach-c">${sparkSVG(null,mood||'hello')}</div>`;
  document.body.appendChild(el);requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('on')));
  const hide=()=>{el.classList.remove('on');setTimeout(()=>el.remove(),450)};
  el.onclick=hide;clearTimeout(sparkSay._h);sparkSay._h=setTimeout(hide,o.ms||4300);
}

/* ---------- 進化・孵化の演出 ---------- */
function spkShow(html,onOk){
  const ov=document.createElement('div');ov.className='spk-evo';ov.setAttribute('role','dialog');ov.innerHTML=html;
  document.body.appendChild(ov);
  requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('on')));
  if(typeof PREF_REDUCED!=='undefined'&&PREF_REDUCED)ov.classList.add('done');
  else{setTimeout(()=>ov.classList.add('glow'),500);setTimeout(()=>{ov.classList.add('done');if(typeof sfx==='function')sfx('levelup');if(typeof launchConfetti==='function')launchConfetti()},2700)}
  ov.querySelector('.spk-evo-ok').onclick=()=>{ov.classList.remove('on');setTimeout(()=>ov.remove(),300);onOk&&onOk();if(typeof renderHeader==='function')renderHeader();if(curTab==='home'&&typeof renderHome==='function')renderHome()};
}
function sparkEvolve(from,to,o){
  const sp=spkSpecies();
  spkShow(`<div class="spk-evo-in"><div class="spk-evo-k">Evolution</div>
    <div class="spk-evo-stage"><div class="spk-evo-ring"></div><div class="spk-evo-old">${sparkSVG(from,'hello')}</div><div class="spk-evo-new">${sparkSVG(to,'win')}</div><div class="spk-evo-flash"></div></div>
    <div class="spk-evo-txt"><div class="spk-evo-t">Sparkが進化した！</div><div class="spk-evo-s">${spkName(from,sp)} → <b>${spkName(to,sp)}</b></div>
    <div class="spk-evo-lv">${esc(o&&o.title||'')}</div><div class="spk-evo-m">あなたが続けた分だけ、Sparkも成長します。次の進化も一緒に。</div>
    <button class="btn btn-gold btn-block spk-evo-ok">一緒に次へ</button></div></div>`);
  if(typeof spkCoin==='function')setTimeout(()=>spkCoin(100,'進化'),2800);
}
// たまごがかえる（ここで種類が決まる）。ガチャ風：自分でタップして割る→光の色でレア度の予告→シルエットのルーレット→正体→名前をつける
const SPK_RAYS={1:'#7cc8ff',2:'#b07cff',3:'#ffcc3d'};
function sparkHatch(o){
  if(document.querySelector('.spk-evo'))return;
  const s=spk();if(!s.species){s.species=spkRoll().id;s.hatchedAt=todayStr()}
  s.stage=Math.max(2,spkStage().n);commit();
  const sp=spkSpecies(),st=spkStageOfLv(gwRank().lv),rar=SPK_RARITY[sp.r];
  const reduce=typeof PREF_REDUCED!=='undefined'&&PREF_REDUCED;
  const ov=document.createElement('div');ov.className='spk-evo spk-hatch spk-r'+sp.r;ov.setAttribute('role','dialog');ov.setAttribute('aria-label','たまごがかえる');
  ov.style.setProperty('--rc',SPK_RAYS[sp.r]);
  ov.innerHTML=`<div class="spk-evo-in"><div class="spk-evo-k">Hatching</div>
    <div class="spk-evo-stage"><div class="spk-rays"></div><div class="spk-evo-ring"></div>
      <button class="spk-egg-btn" aria-label="たまごをタップ">${spkEggSVG('hello',0)}</button>
      <div class="spk-roul" aria-hidden="true"></div><div class="spk-evo-new">${sparkSVG(st,'win',sp)}</div><div class="spk-evo-flash"></div></div>
    <div class="spk-hint"><b id="spk-h-t">たまごをタップして割ろう！</b><div class="spk-taps"><i></i><i></i><i></i></div></div>
    <div class="spk-evo-txt"><div class="spk-rar" style="--rc:${rar[2]}">${rar[0]} ${rar[1]}</div>
      <div class="spk-evo-t">${sp.type}タイプの「${sp.name}」が生まれた！</div>
      <div class="spk-evo-m">${esc(sp.desc)}。</div>
      <label class="spk-nick-f">名前をつけてあげよう<input id="spk-nick-in" maxlength="10" placeholder="${sp.name}" autocomplete="off"></label>
      <button class="btn btn-gold btn-block spk-evo-ok">よろしくね！</button></div></div>`;
  document.body.appendChild(ov);requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('on')));
  const $=q=>ov.querySelector(q),egg=$('.spk-egg-btn'),hint=$('#spk-h-t');
  const tn=(f,d)=>{try{tone(f,d||0.08,'triangle',0.12)}catch(e){}};
  const reveal=()=>{ov.classList.add('done');sfx('levelup');launchConfetti();if(sp.r===3)setTimeout(launchConfetti,700);spkCoin(50,'たまごがかえった')};
  const roulette=()=>{
    // 9種類のシルエットが回って、だんだん遅くなり、生まれた種類で止まる
    ov.classList.add('roul');const box=$('.spk-roul');
    const sil=SPK_SPECIES.map(x=>sparkSVG(SPK_STAGES[1],'hello',x,{}));const order=[];
    for(let i=0;i<16;i++)order.push(i%SPK_SPECIES.length);order.push(SPK_SPECIES.indexOf(sp));
    let i=0;const step=()=>{box.innerHTML=sil[order[i]];tn(520+i*25,0.04);
      if(++i<order.length)setTimeout(step,60+Math.pow(i/order.length,3)*420);
      else setTimeout(()=>{ov.classList.remove('roul');reveal()},650)};
    hint.textContent='何が出るかな…？';step();
  };
  $('.spk-evo-ok').onclick=()=>{
    const v=($('#spk-nick-in').value||'').trim().slice(0,10);if(v){spk().nick=v;commit()}
    ov.classList.remove('on');setTimeout(()=>ov.remove(),300);
    if(typeof renderHeader==='function')renderHeader();if(curTab==='home'&&typeof renderHome==='function')renderHome();
  };
  if(reduce){egg.disabled=true;return reveal()}
  let taps=0;
  egg.onclick=()=>{
    if(taps>=3)return;taps++;
    egg.innerHTML=spkEggSVG('hello',[0.35,0.75,1][taps-1]);
    egg.classList.remove('spk-shake');void egg.offsetWidth;egg.classList.add('spk-shake');
    ov.querySelectorAll('.spk-taps i')[taps-1].classList.add('on');tn([440,560,700][taps-1],0.12);
    if(taps===1)hint.textContent='動いた…！ もう一回！';
    if(taps===2)hint.textContent='光が漏れてる…！ あと一回！';
    if(taps===3){
      // 光の色でレア度を予告（青＝ノーマル／紫＝レア／金＝スーパーレア）
      ov.classList.add('glow','rays');hint.textContent=sp.r===3?'金色の光…!? これは…！':sp.r===2?'紫の光…！ レアの予感':'まぶしい光が…！';
      tn(880,0.2);setTimeout(roulette,1400);
    }
  };
}

/* ---------- 要所で励ます ---------- */
function spkDailyGreeting(){
  const s=spk(),t=todayStr();if(s.greet===t)return;s.greet=t;commit();
  const sec=(PROG.hb&&PROG.hb.sec)||{};const days=Object.keys(sec).filter(k=>sec[k]>=60&&k<t).sort();
  const last=days[days.length-1];const gap=last?Math.round((new Date(t+'T00:00')-new Date(last+'T00:00'))/864e5):0;
  if(gap>=2)return sparkSay('おかえり！また会えてうれしい。今日は最低ラインだけでOKだよ','Welcome back!','hello',{ms:5200});
  if(typeof p6Ready==='function'&&p6Ready()){const left=p6Span().left;if([150,120,100,90,60,30,14,7,3,1].includes(left))return sparkSay(`試験まであと${left}日。${left<=14?'新しいことより、取れる問題を確実に！':'ここからの毎日が点数になるよ'}`,`${left} days to the test!`,'cheer',{ms:5200})}
  const st=getStreak();if([3,7,14,21,30,50,100].includes(st))return sparkSay(`${st}日連続！続けられてるの、本当にすごい`,`${st}-day streak!`,'win',{ms:5000});
  const l=spkContextLine();sparkSay(l[0],l[1],'hello');
}
let spkRun=0,spkMiss=0;
function spkInstall(){
  if(typeof gwRank!=='function')return;
  if(!spk().stage)spk().stage=spkStage().n;
  sparkHeroHTML=spkHeroHTML;
  sparkFallbackSVG=function(){return sparkSVG(null,'hello')};
  preloadSparkAssets=function(){};
  sparkLevel=function(){const r=gwRank(),st=spkStageOfLv(r.lv);return{lv:st.n,name:'Spark',label:spkName(st,spkSpecies()),min:0,max:Infinity}};
  sparkLines=function(){const l=spkContextLine();return{en:l[1],ja:l[0]}};
  // 孵化・進化（成長ランクの節目で段階が上がったら、通常のレベルアップ演出の代わりに）
  const _gc=gwCelebrate;
  gwCelebrate=function(o){
    if(o&&o.lv){const cur=spkStageOfLv(o.lv),prev=SPK_STAGES.find(s=>s.n===(spk().stage||1))||SPK_STAGES[0];
      if(cur.n>prev.n){if(prev.n===1)return sparkHatch(o);spk().stage=cur.n;commit();return sparkEvolve(prev,cur,o)}}
    return _gc.apply(this,arguments);
  };
  // 連続正解・連続ミスで声をかける
  const _ch=comboHit;
  comboHit=function(ok){
    const r=_ch.apply(this,arguments);
    if(ok){spkRun++;spkMiss=0;if(spkRun===3)sparkSay('3問連続正解！いい流れ！','Three in a row!','win');else if(spkRun===6)sparkSay('6連続！この集中、本番でも出せるよ','Six straight!','win');else if(spkRun===10)sparkSay('10連続…！もう止められないね','Unstoppable!','win')}
    else{spkRun=0;spkMiss++;if(spkMiss===2){const l=spkPick(SPK_LINES.cheer);sparkSay(l[0],l[1],'cheer')}}
    return r;
  };
  // ホーム：Sparkが常駐（タップで話す）＋その日最初の声かけ。孵化レベルを超えていてまだ生まれていなければ孵化
  const _rh=renderHome;
  renderHome=function(){
    const r=_rh.apply(this,arguments);
    const head=document.querySelector('#screen-home .focus-head');
    if(head&&!head.querySelector('.spk-mini')){const b=document.createElement('button');b.className='spk-mini';b.setAttribute('aria-label','Sparkに話しかける');b.innerHTML=sparkSVG(null,'hello');head.prepend(b)}
    clearTimeout(spkInstall._g);
    spkInstall._g=setTimeout(()=>{if(spkStage().n>=2&&!spk().species)sparkHatch();else spkDailyGreeting()},1100);
    return r;
  };
  // 学習時間の節目（habit.js の計測と連動）
  setInterval(()=>{
    if(typeof hbMin!=='function')return;const m=hbMin(),s=spk(),t=todayStr();
    for(const k of[30,60,90])if(m>=k&&s['min'+k]!==t){s['min'+k]=t;commit();sparkSay(k===30?'今日30分集中！すごい。目を少し休めてもいいよ':`今日${k}分！本番に向けて確実に積み上がってる`,`${k} minutes today!`,'win',{force:true,ms:5000});break}
  },60000);
  if(typeof curTab!=='undefined'&&curTab==='home'&&document.getElementById('screen-home').classList.contains('active'))renderHome();
}
if(typeof go==='function')spkInstall();
