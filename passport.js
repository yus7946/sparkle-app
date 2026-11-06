/* ========== Passport：街ごとの「旅行気分」画面 ==========
   ・上：街の切り替え（チップ）。今日の目的地に NEXT、クリアしたストーリーの数をスタンプで表示
   ・中：その街の景色（SVG のイラスト＋動き）、現地の時刻と日本との時差、現地のあいさつ、東京からの飛行時間
   ・下：3つのストーリーを搭乗券の形で。クリアすると「CLEARED」のスタンプ
   ・景色を左右にスワイプしても街が変わる。選んだ街は端末に覚える
   人物の写真は使わない（ユーザーの好み）。画像ファイルなし・$0。 */
'use strict';

const PP_DEST={
  hawaii:{iata:'HNL',tz:'Pacific/Honolulu',fly:'約7時間',hi:'Aloha!',hiJa:'こんにちは／ようこそ（ハワイ語）',tip:'Mahalo = ありがとう',ink:'#2a1846'},
  singapore:{iata:'SIN',tz:'Asia/Singapore',fly:'約7時間',hi:'Selamat datang!',hiJa:'ようこそ（マレー語）',tip:'Can! = いいよ（シングリッシュ）',ink:'#0b1033'},
  orlando:{iata:'MCO',tz:'America/New_York',fly:'約16時間（乗り継ぎ）',hi:"Hey y'all!",hiJa:'みんな、やあ！（南部の言い方）',tip:'Have a good one! = じゃあね',ink:'#1d2350'},
  paris:{iata:'CDG',tz:'Europe/Paris',fly:'約14時間',hi:'Bonjour !',hiJa:'こんにちは（お店に入ったらまずこれ）',tip:'Merci = ありがとう',ink:'#1e2a5a'},
  london:{iata:'LHR',tz:'Europe/London',fly:'約14時間',hi:'Cheers!',hiJa:'ありがとう／乾杯（イギリス）',tip:'Queue = 行列（並ぶ）',ink:'#26324d'},
  rome:{iata:'FCO',tz:'Europe/Rome',fly:'約14時間',hi:'Ciao!',hiJa:'やあ／またね（イタリア語）',tip:'Grazie = ありがとう',ink:'#4a2230'},
  bangkok:{iata:'BKK',tz:'Asia/Bangkok',fly:'約6時間半',hi:'Sawasdee!',hiJa:'こんにちは（タイ語）',tip:'Khob khun = ありがとう',ink:'#3d2a5c'},
  sydney:{iata:'SYD',tz:'Australia/Sydney',fly:'約10時間',hi:"G'day!",hiJa:'こんにちは（オーストラリア）',tip:'No worries = 大丈夫、気にしないで',ink:'#0d3b66'},
  nyc:{iata:'JFK',tz:'America/New_York',fly:'約13時間',hi:"How you doin'?",hiJa:'元気？（ニューヨークらしい言い方）',tip:'Grab a coffee = コーヒー買う',ink:'#070b24'}
};

/* ---------- 景色（viewBox 360×220） ---------- */
const ppG=(id,stops,v)=>`<linearGradient id="${id}" x1="0" y1="0" x2="${v?1:0}" y2="${v?0:1}">${stops.map(([o,c,a])=>`<stop offset="${o}" stop-color="${c}"${a!=null?` stop-opacity="${a}"`:''}/>`).join('')}</linearGradient>`;
// 決まった乱数（毎回同じ配置）
function ppRnd(seed){return()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646}}
function ppStars(n,seed,h){const r=ppRnd(seed);let s='';for(let i=0;i<n;i++){const x=(r()*360).toFixed(1),y=(r()*h).toFixed(1),z=(r()*1.1+.4).toFixed(2);s+=`<circle class="pp-tw" style="animation-delay:${(r()*3).toFixed(2)}s" cx="${x}" cy="${y}" r="${z}" fill="#fff"/>`}return s}
// 窓あかり：x,y,w,h の建物に、ランダムに灯る窓
function ppWin(x,y,w,h,seed,col,dens){const r=ppRnd(seed);let s='';for(let yy=y+4;yy<y+h-4;yy+=6)for(let xx=x+3;xx<x+w-3;xx+=5)if(r()<(dens||.35))s+=`<rect x="${xx}" y="${yy}" width="2.2" height="3" fill="${col||'#ffd98a'}" opacity="${(.45+r()*.5).toFixed(2)}"${r()<.12?' class="pp-tw"':''}/>`;return s}
function ppPalm(x,y,h,sc,col){const t=`<path d="M${x} ${y} C${x+3} ${y-h*.4} ${x+8} ${y-h*.8} ${x+6} ${y-h}" stroke="${col}" stroke-width="${3*sc}" fill="none" stroke-linecap="round"/>`;
  const fx=x+6,fy=y-h,fr=[[-28,6],[-22,-6],[-8,-12],[8,-12],[22,-6],[28,6]].map(([dx,dy])=>`<path d="M${fx} ${fy} Q${fx+dx*.5*sc} ${fy+dy*sc-6*sc} ${fx+dx*sc} ${fy+dy*sc+6*sc} Q${fx+dx*.55*sc} ${fy+dy*sc-1*sc} ${fx} ${fy}" fill="${col}"/>`).join('');
  return `<g class="pp-sway" style="transform-origin:${x}px ${y}px">${t}${fr}</g>`}
function ppWater(y,c1,c2,lines,lc){return `<rect x="0" y="${y}" width="360" height="${220-y}" fill="url(#${c1})"/>`+`<g class="pp-wave">${Array.from({length:lines},(_,i)=>{const yy=y+8+i*((220-y-10)/lines);return `<path d="M-40 ${yy.toFixed(1)} q10 -2 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="${lc}" stroke-opacity="${(.12+i*.04).toFixed(2)}" fill="none" stroke-width="1"/>`}).join('')}</g>`}
function ppBirds(x,y){return `<g class="pp-fly" fill="none" stroke="#1d1030" stroke-width="1.3" stroke-linecap="round"><path d="M${x} ${y} q4 -4 8 0 q4 -4 8 0"/><path d="M${x+22} ${y-8} q3 -3 6 0 q3 -3 6 0"/></g>`}

const PP_SCENE={
  hawaii:()=>`<defs>${ppG('hiS',[[0,'#2b1e5c'],[.45,'#b4477a'],[.75,'#ff8a5b'],[1,'#ffc46b']])}${ppG('hiW',[[0,'#ff9a6b'],[.35,'#8a3f78'],[1,'#2a1846']])}</defs>
    <rect width="360" height="220" fill="url(#hiS)"/>
    <circle class="pp-glow" cx="150" cy="146" r="44" fill="#ffd38a" opacity=".35"/><circle cx="150" cy="146" r="28" fill="#ffe7b0"/>
    ${ppBirds(70,58)}
    <path d="M176 150 C190 138 196 124 210 120 C222 112 236 104 252 108 C270 112 290 122 312 126 C332 130 348 140 360 146 L360 150 Z" fill="#4a2a5e"/>
    <path d="M196 150 C214 140 232 126 252 126 C276 128 300 138 360 144 L360 150 Z" fill="#3b2350"/>
    ${ppWater(150,'hiW',0,6,'#ffe2b8')}
    <g class="pp-shim"><rect x="136" y="156" width="28" height="2" fill="#ffe7b0" opacity=".7"/><rect x="130" y="164" width="40" height="2" fill="#ffe7b0" opacity=".5"/><rect x="140" y="173" width="22" height="2" fill="#ffe7b0" opacity=".4"/><rect x="126" y="183" width="46" height="2" fill="#ffe7b0" opacity=".25"/></g>
    <path d="M0 200 C60 188 110 196 160 206 L160 220 L0 220 Z" fill="#1d1030"/>
    ${ppPalm(40,206,96,1.1,'#1d1030')}${ppPalm(92,204,70,.8,'#1d1030')}${ppPalm(330,214,84,.95,'#1d1030')}`,

  singapore:()=>`<defs>${ppG('sgS',[[0,'#0b1033'],[.6,'#2a1f5c'],[1,'#7a4592']])}${ppG('sgW',[[0,'#3a2768'],[1,'#0b1033']])}</defs>
    <rect width="360" height="220" fill="url(#sgS)"/>${ppStars(40,7,110)}
    <g class="pp-beam"><path d="M196 76 L120 0" stroke="#7ee2ff" stroke-opacity=".35" stroke-width="2"/><path d="M220 76 L300 0" stroke="#c49bff" stroke-opacity=".3" stroke-width="2"/></g>
    <g fill="#1a1640">
      <rect x="20" y="118" width="26" height="46"/><rect x="50" y="104" width="18" height="60"/><rect x="72" y="126" width="30" height="38"/><rect x="290" y="112" width="24" height="52"/><rect x="318" y="96" width="22" height="68"/><rect x="342" y="124" width="18" height="40"/>
      <path d="M172 164 L176 86 L192 86 L194 164 Z"/><path d="M198 164 L201 84 L217 84 L220 164 Z"/><path d="M224 164 L226 86 L242 86 L246 164 Z"/>
      <path d="M164 80 L254 78 C258 78 258 86 252 86 L170 88 C164 88 160 82 164 80 Z"/>
    </g>
    ${ppWin(176,92,16,70,3,'#ffd98a',.45)}${ppWin(202,90,16,72,4,'#ffd98a',.45)}${ppWin(228,92,16,70,5,'#ffd98a',.45)}${ppWin(50,108,18,54,6)}${ppWin(318,100,22,62,8)}
    <g class="pp-tree"><path d="M120 164 L112 134 L128 134 Z M142 164 L134 140 L150 140 Z M104 164 L98 144 L110 144 Z" fill="#241c52"/>
      <ellipse cx="120" cy="133" rx="12" ry="3" fill="#8f6bff" opacity=".8"/><ellipse cx="142" cy="139" rx="10" ry="2.6" fill="#47e0c8" opacity=".8"/><ellipse cx="104" cy="143" rx="8" ry="2.2" fill="#ff7ac6" opacity=".8"/></g>
    ${ppWater(164,'sgW',0,5,'#c49bff')}
    <g opacity=".35"><rect x="176" y="168" width="16" height="30" fill="#ffd98a" opacity=".3"/><rect x="202" y="168" width="16" height="34" fill="#ffd98a" opacity=".3"/><rect x="228" y="168" width="16" height="28" fill="#ffd98a" opacity=".3"/></g>`,

  orlando:()=>`<defs>${ppG('orS',[[0,'#1d2b64'],[.55,'#6d5ba8'],[1,'#f6a5c0']])}${ppG('orW',[[0,'#8a6db8'],[1,'#1d2350']])}</defs>
    <rect width="360" height="220" fill="url(#orS)"/>${ppStars(18,11,70)}
    ${[[214,72,'#ffd76a',0],[296,50,'#ff8fc8',.9],[258,96,'#7ee2ff',1.7]].map(([x,y,c,d])=>`<g class="pp-fw" style="animation-delay:${d}s;transform-origin:${x}px ${y}px">${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<line x1="${x+Math.cos(a)*6}" y1="${y+Math.sin(a)*6}" x2="${(x+Math.cos(a)*22).toFixed(1)}" y2="${(y+Math.sin(a)*22).toFixed(1)}" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`}).join('')}<circle cx="${x}" cy="${y}" r="2.5" fill="#fff"/></g>`).join('')}
    <path d="M150 156 C170 104 186 104 200 140 C214 176 226 96 246 92 C266 88 270 140 290 156" stroke="#2a2458" stroke-width="3" fill="none"/>
    ${[160,176,192,208,224,240,256,272].map(x=>`<line x1="${x}" y1="156" x2="${x}" y2="${x<200?126:x<250?110:132}" stroke="#2a2458" stroke-width="1.2"/>`).join('')}
    <path d="M0 156 L360 156 L360 162 L0 162 Z" fill="#2a2458"/>
    ${ppWater(160,'orW',0,5,'#ffd6e8')}
    ${ppPalm(36,200,80,1,'#171a3d')}${ppPalm(318,204,92,1.05,'#171a3d')}<path d="M0 198 C80 192 140 200 200 210 L200 220 L0 220 Z" fill="#171a3d"/>`,

  paris:()=>`<defs>${ppG('paS',[[0,'#1e2a5a'],[.55,'#6c7bbf'],[1,'#f3c1a8']])}${ppG('paW',[[0,'#8d89b8'],[1,'#26305e']])}</defs>
    <rect width="360" height="220" fill="url(#paS)"/>${ppStars(14,5,60)}<circle cx="300" cy="44" r="10" fill="#fff4dc" opacity=".9"/>
    <g fill="#2a2a55">
      <path d="M178 20 L182 20 L184 54 L192 92 L204 150 L194 150 C190 132 186 122 180 122 C174 122 170 132 166 150 L156 150 L168 92 L176 54 Z"/>
      <rect x="171" y="90" width="18" height="4"/><rect x="166" y="54" width="28" height="3"/>
      <path d="M0 150 L0 128 L20 128 L24 120 L52 120 L56 128 L84 128 L84 112 L118 112 L118 150 Z M240 150 L240 116 L276 116 L280 108 L312 108 L316 116 L360 116 L360 150 Z"/>
    </g>
    ${ppWin(0,128,84,22,21,'#ffd98a',.3)}${ppWin(240,116,120,34,22,'#ffd98a',.3)}
    <g class="pp-sparkle">${Array.from({length:14},(_,i)=>{const r=ppRnd(40+i),t=r();const y=30+t*118,w=4+t*20;return `<circle class="pp-tw" style="animation-delay:${(r()*2).toFixed(2)}s" cx="${(180+(r()-.5)*w).toFixed(1)}" cy="${y.toFixed(1)}" r="1.1" fill="#fff6c8"/>`}).join('')}</g>
    <path d="M0 160 L360 160 L360 150 L0 150 Z" fill="#3a3a6a"/>
    <path d="M90 160 Q120 140 150 160 Q180 140 210 160 Q240 140 270 160" stroke="#3a3a6a" stroke-width="5" fill="none"/>
    ${ppWater(160,'paW',0,5,'#fff1d6')}`,

  london:()=>`<defs>${ppG('loS',[[0,'#3a4a6b'],[.6,'#8fa3c0'],[1,'#ead6b8']])}${ppG('loW',[[0,'#7b8aa6'],[1,'#26324d']])}</defs>
    <rect width="360" height="220" fill="url(#loS)"/>
    <g class="pp-eye" style="transform-origin:290px 104px"><circle cx="290" cy="104" r="44" fill="none" stroke="#3a4766" stroke-width="2.2"/>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<line x1="290" y1="104" x2="${(290+Math.cos(a)*44).toFixed(1)}" y2="${(104+Math.sin(a)*44).toFixed(1)}" stroke="#3a4766" stroke-width=".8"/><circle cx="${(290+Math.cos(a)*44).toFixed(1)}" cy="${(104+Math.sin(a)*44).toFixed(1)}" r="2.4" fill="#3a4766"/>`}).join('')}</g>
    <path d="M276 156 L290 104 L304 156" stroke="#3a4766" stroke-width="3" fill="none"/>
    <g fill="#2f3a57">
      <path d="M86 156 L86 58 L92 46 L98 58 L98 156 Z"/><rect x="82" y="66" width="20" height="26"/><path d="M84 66 L92 40 L100 66 Z"/>
      <path d="M0 156 L0 112 L14 112 L14 100 L22 100 L22 112 L80 112 L80 156 Z M104 156 L104 108 L124 108 L124 96 L130 96 L130 108 L170 108 L170 118 L200 118 L200 156 Z"/>
    </g>
    <circle cx="92" cy="79" r="6" fill="#ffe6a6"/><path d="M92 79 L92 75 M92 79 L95 80" stroke="#2f3a57" stroke-width="1"/>
    ${ppWin(0,112,80,44,31,'#ffe6a6',.18)}${ppWin(104,108,96,48,32,'#ffe6a6',.18)}
    <rect x="0" y="156" width="360" height="6" fill="#2f3a57"/>
    <g class="pp-bus"><rect x="0" y="140" width="34" height="18" rx="3" fill="#d6383a"/><rect x="2" y="143" width="30" height="4" fill="#ffd9c8" opacity=".85"/><rect x="2" y="150" width="30" height="4" fill="#ffd9c8" opacity=".85"/><circle cx="8" cy="159" r="2.6" fill="#1b2236"/><circle cx="27" cy="159" r="2.6" fill="#1b2236"/></g>
    ${ppWater(162,'loW',0,5,'#f3e3c4')}`,

  rome:()=>`<defs>${ppG('roS',[[0,'#5b3a78'],[.4,'#d9707a'],[.8,'#f7b267'],[1,'#ffd99a']])}${ppG('roG',[[0,'#7a5a3a'],[1,'#3a2a20']])}</defs>
    <rect width="360" height="220" fill="url(#roS)"/>
    <circle class="pp-glow" cx="70" cy="120" r="40" fill="#ffe0a0" opacity=".35"/><circle cx="70" cy="120" r="24" fill="#fff0c8"/>
    ${ppBirds(250,60)}
    <path d="M120 170 L120 96 C150 84 250 84 290 100 L290 170 Z" fill="#a85d45"/>
    <path d="M250 170 L250 92 C268 94 280 98 290 102 L290 170 Z" fill="#8a4b3a"/>
    ${[100,124,148].map((y,k)=>Array.from({length:8},(_,i)=>`<path d="M${128+i*20} ${y+18} L${128+i*20} ${y+6} Q${135+i*20} ${y-1} ${142+i*20} ${y+6} L${142+i*20} ${y+18} Z" fill="#5a2e2a" opacity="${.85-k*.1}"/>`).join('')).join('')}
    <rect x="120" y="94" width="170" height="3" fill="#c97a5c"/><rect x="120" y="120" width="170" height="2" fill="#c97a5c"/><rect x="120" y="144" width="170" height="2" fill="#c97a5c"/>
    <rect x="0" y="170" width="360" height="50" fill="url(#roG)"/>
    ${[[30,170,62],[52,172,48],[320,172,58],[342,174,44]].map(([x,y,h])=>`<path class="pp-sway" style="transform-origin:${x}px ${y}px" d="M${x} ${y} C${x-9} ${y-h*.4} ${x-6} ${y-h*.8} ${x} ${y-h} C${x+6} ${y-h*.8} ${x+9} ${y-h*.4} ${x} ${y} Z" fill="#2c3a24"/>`).join('')}
    <path d="M300 150 C300 140 330 134 346 140 C356 144 350 150 340 150 Z" fill="#2c3a24"/><line x1="322" y1="150" x2="324" y2="172" stroke="#2c3a24" stroke-width="2"/>`,

  bangkok:()=>`<defs>${ppG('bkS',[[0,'#7c5a9e'],[.45,'#ff9e7a'],[1,'#ffd27f']])}${ppG('bkW',[[0,'#e6936e'],[1,'#3d2a5c']])}</defs>
    <rect width="360" height="220" fill="url(#bkS)"/>
    <circle class="pp-glow" cx="80" cy="144" r="40" fill="#ffe3a0" opacity=".35"/><circle cx="80" cy="144" r="22" fill="#fff0c0"/>
    <g fill="#4a2f5e">
      <path d="M196 156 L198 120 L202 92 L206 66 L208 40 L210 66 L214 92 L218 120 L220 156 Z"/>
      ${[[196,120,24],[198,104,20],[200,88,16],[202,74,12]].map(([x,y,w])=>`<rect x="${x}" y="${y}" width="${w}" height="3" fill="#6a4a7e"/>`).join('')}
      <path d="M160 156 L162 128 L166 108 L168 96 L170 108 L174 128 L176 156 Z"/><path d="M242 156 L244 128 L248 108 L250 96 L252 108 L256 128 L258 156 Z"/>
      <path d="M130 156 L130 140 L190 140 L190 156 Z M226 156 L226 140 L286 140 L286 156 Z"/>
    </g>
    <rect x="0" y="156" width="360" height="4" fill="#4a2f5e"/>
    ${ppWater(160,'bkW',0,5,'#ffe3b0')}
    <g class="pp-boat"><path d="M0 186 L46 186 L40 194 L6 194 Z" fill="#3d2a5c"/><path d="M8 186 L14 176 L34 176 L40 186 Z" fill="#c9455a"/><line x1="46" y1="186" x2="56" y2="180" stroke="#3d2a5c" stroke-width="2"/></g>
    ${ppPalm(330,204,70,.9,'#3d2a5c')}`,

  sydney:()=>`<defs>${ppG('syS',[[0,'#1e78d6'],[.6,'#7cc6fe'],[1,'#d6f0ff']])}${ppG('syW',[[0,'#2a7fd0'],[1,'#0d3b66']])}</defs>
    <rect width="360" height="220" fill="url(#syS)"/>
    <circle class="pp-glow" cx="304" cy="40" r="30" fill="#fff6c8" opacity=".5"/><circle cx="304" cy="40" r="16" fill="#fffbe8"/>
    <path d="M150 150 C190 70 290 70 330 150" stroke="#5b6b80" stroke-width="5" fill="none"/><path d="M150 150 C190 84 290 84 330 150" stroke="#5b6b80" stroke-width="2" fill="none"/>
    ${[180,200,220,240,260,280,300].map((x,i)=>`<line x1="${x}" y1="${[120,104,96,94,96,104,120][i]}" x2="${x}" y2="142" stroke="#5b6b80" stroke-width="1"/>`).join('')}
    <rect x="140" y="140" width="200" height="4" fill="#5b6b80"/><rect x="140" y="128" width="10" height="22" fill="#7d8ca0"/><rect x="330" y="128" width="10" height="22" fill="#7d8ca0"/>
    <rect x="30" y="148" width="110" height="10" fill="#d9c9a8"/>
    <g><path d="M40 148 C46 116 64 100 82 96 C74 112 70 130 70 148 Z" fill="#fff"/><path d="M64 148 C72 118 90 104 108 102 C98 116 94 132 94 148 Z" fill="#f4f7fb"/><path d="M90 148 C98 124 112 114 128 112 C120 124 118 136 118 148 Z" fill="#fff"/>
      <path d="M70 148 C70 130 74 112 82 96 L78 148 Z" fill="#cfd8e3"/><path d="M94 148 C94 132 98 116 108 102 L102 148 Z" fill="#cfd8e3"/></g>
    ${ppWater(158,'syW',0,6,'#ffffff')}
    <g class="pp-boat"><path d="M0 190 L30 190 L26 196 L4 196 Z" fill="#fff"/><path d="M16 188 L16 164 L28 188 Z" fill="#fff"/><path d="M14 188 L14 170 L6 188 Z" fill="#e8eef5"/></g>`,

  nyc:()=>`<defs>${ppG('nyS',[[0,'#070b24'],[.6,'#1b2350'],[1,'#3c3f7a']])}${ppG('nyW',[[0,'#252a5c'],[1,'#070b24']])}</defs>
    <rect width="360" height="220" fill="url(#nyS)"/>${ppStars(36,13,90)}<circle cx="56" cy="40" r="12" fill="#f4f1de"/><circle cx="61" cy="36" r="11" fill="#070b24" opacity=".0"/>
    <g fill="#141a3f">
      ${[[0,110,30],[32,92,22],[56,120,26],[84,80,24],[112,104,20],[134,70,26],[196,96,24],[222,84,28],[252,112,22],[276,74,24],[302,100,26],[330,88,30]].map(([x,y,w])=>`<rect x="${x}" y="${y}" width="${w}" height="${160-y}"/>`).join('')}
      <path d="M162 160 L162 66 L168 66 L168 54 L172 54 L172 42 L176 30 L180 42 L180 54 L184 54 L184 66 L190 66 L190 160 Z"/>
    </g>
    <circle class="pp-tw" cx="176" cy="34" r="2" fill="#ff7a8a"/>
    ${[[0,110,30],[32,92,22],[56,120,26],[84,80,24],[112,104,20],[134,70,26],[162,66,28],[196,96,24],[222,84,28],[252,112,22],[276,74,24],[302,100,26],[330,88,30]].map(([x,y,w],i)=>ppWin(x,y,w,160-y,50+i,'#ffd98a',.3)).join('')}
    ${ppWater(160,'nyW',0,5,'#ffd98a')}`
};
function ppScene(key){const f=PP_SCENE[key]||PP_SCENE.paris;return `<svg class="pp-svg" viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${f()}</svg>`}

/* ---------- 時刻・時差 ---------- */
function ppTime(tz){try{return new Date().toLocaleTimeString('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit'})}catch(e){return'--:--'}}
function ppDiff(tz){
  try{const now=new Date(),f=z=>{const p=new Intl.DateTimeFormat('en-US',{timeZone:z,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(now).reduce((a,x)=>(a[x.type]=x.value,a),{});return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute)};
    const h=Math.round((f(tz)-f('Asia/Tokyo'))/36e5*2)/2;return h===0?'日本と同じ時刻':`日本より${Math.abs(h)}時間${h<0?'遅い':'早い'}`}catch(e){return''}
}

/* ---------- 画面 ---------- */
const PP_KEY='sparkle_pp_city';
function ppCur(){let k='';try{k=localStorage.getItem(PP_KEY)||''}catch(e){}return CITY_ROTATION.some(c=>c.key===k)?k:todaysCity().key}
let ppClock=null;
renderPassportTab=function(){
  renderHeader();
  const el=document.getElementById('screen-passport'),key=ppCur(),city=CITY_ROTATION.find(c=>c.key===key),d=PP_DEST[key]||{},next=todaysCity().key;
  const total=CITY_ROTATION.reduce((n,c)=>n+(CITY_STORIES[c.key]||[]).length,0);
  const stamped=CITY_ROTATION.reduce((n,c)=>n+(CITY_STORIES[c.key]||[]).filter(s=>storyDone(s.id)).length,0);
  const stories=CITY_STORIES[key]||[];
  const ci=CITY_ROTATION.findIndex(c=>c.key===key);
  el.innerHTML=`<div class="pp-top"><div class="pp-ttl">${ICONS.globe}<b>City Passport</b></div><div class="pp-count"><b>${stamped}</b>/${total} stamps<i style="--p:${Math.round(stamped/total*100)}%"></i></div></div>
    <div class="pp-chips" role="tablist" aria-label="街を選ぶ">${CITY_ROTATION.map(c=>{const st=CITY_STORIES[c.key]||[],n=st.filter(s=>storyDone(s.id)).length;
      return `<button role="tab" class="pp-chip${c.key===key?' on':''}${n===st.length&&st.length?' clear':''}" data-pp="${c.key}" aria-selected="${c.key===key}"><b>${(PP_DEST[c.key]||{}).iata||c.code}</b><span>${esc(c.ja)}</span><i>${st.map(s=>`<u class="${storyDone(s.id)?'on':''}"></u>`).join('')}</i>${c.key===next?'<em>NEXT</em>':''}</button>`}).join('')}</div>
    <div class="pp-dest" id="pp-dest" style="--ink:${d.ink||'#0f2a4a'}">
      ${ppScene(key)}
      <div class="pp-shade"></div>
      <div class="pp-head"><div><span class="pp-k">WELCOME TO</span><b class="pp-city">${esc(city.en)}</b><small>${esc(city.ja)} · ${esc(city.country)}</small></div>
        <div class="pp-clock"><b id="pp-time">${ppTime(d.tz)}</b><small>${esc(ppDiff(d.tz))}</small></div></div>
      <div class="pp-foot">
        <button class="pp-hi" id="pp-hi" aria-label="${esc(d.hi||'')} を聞く"><b>${esc(d.hi||'Hello!')}</b><small>${esc(d.hiJa||'')}</small><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg></button>
        <div class="pp-fl"><span>HND</span><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg><span>${esc(d.iata||city.code)}</span><small>${esc(d.fly||'')}</small></div>
      </div>
      <button class="pp-nav l" id="pp-prev" aria-label="前の街"${ci<=0?' hidden':''}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg></button>
      <button class="pp-nav r" id="pp-next" aria-label="次の街"${ci>=CITY_ROTATION.length-1?' hidden':''}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button>
    </div>
    <div class="pp-tip"><span>LOCAL TIP</span>${esc(d.tip||'')}<em>${esc(city.accentNote||'')}</em></div>
    <div class="pp-tix">${stories.map((st,i)=>{const done=storyDone(st.id);return `<button class="pp-tk${done?' done':''}" data-story-open="${key}:${st.id}" style="--tk:${st.color||'#2b7fe0'}">
      <span class="pp-tk-l"><span class="pp-tk-av" style="background:${st.char.color}">${esc(st.char.avatar)}</span><small>${String(i+1).padStart(2,'0')}</small></span>
      <span class="pp-tk-b"><b>${esc(st.title)}</b><small>${esc(st.titleJa)}</small><span>${esc(st.char.name)} · ${esc(st.char.role)} · ${st.estMin}分</span></span>
      <span class="pp-tk-r">${done?'<span class="pp-stamp">CLEARED</span>':`<span class="pp-board">BOARD</span>${ICONS.arrowRight}`}</span></button>`}).join('')}</div>`;
  const pick=k=>{try{localStorage.setItem(PP_KEY,k)}catch(e){}sfx('tap');renderPassportTab();const c=document.querySelector('.pp-chip.on');c&&c.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'})};
  el.querySelectorAll('[data-pp]').forEach(b=>b.onclick=()=>pick(b.dataset.pp));
  const step=n=>{const c=CITY_ROTATION[ci+n];if(c)pick(c.key)};
  document.getElementById('pp-prev').onclick=()=>step(-1);document.getElementById('pp-next').onclick=()=>step(1);
  document.getElementById('pp-hi').onclick=()=>{if(typeof speak==='function')speak(d.hi||'Hello',0.9,'female',city.ttsLang)};
  // 景色を左右にスワイプして街を変える
  const dest=document.getElementById('pp-dest');let sx=null,sy=0;
  dest.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;sx=e.clientX;sy=e.clientY});
  dest.addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4)step(dx<0?1:-1)});
  el.querySelectorAll('[data-story-open]').forEach(b=>{const[ck,sid]=b.dataset.storyOpen.split(':');b.onclick=()=>openStory(ck,sid)});
  clearInterval(ppClock);ppClock=setInterval(()=>{const t=document.getElementById('pp-time');if(!t){clearInterval(ppClock);return}t.textContent=ppTime(d.tz)},20000);
  const on=el.querySelector('.pp-chip.on');if(on)on.scrollIntoView({inline:'center',block:'nearest'});window.scrollTo(0,0);
  anim('.pp-dest',{opacity:0,scale:.98},{opacity:1,scale:1,duration:0.45,ease:'power2.out'});
  anim('.pp-tk',{opacity:0,y:10},{opacity:1,y:0,duration:0.35,stagger:0.06,ease:'power2.out'});
};
