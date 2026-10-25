/* ========== Spark「ゆるかわ」絵柄 ==========
   ・ヒットしている“ゆるかわ”キャラの人気要素（手描き風の揺れた輪郭線・小さな点の目・低い位置の顔・
     斜線入りのほっぺ・パステルの塗り・小さな手足・短い感情の一言）を取り入れたオリジナルの絵柄
   ・特定の作品には似せない（著作権・商標のため）
   ・種類（9種）・進化（6段階）・着せかえ・気分（hello/win/cheer/study）はそのまま使える
   ・Sparkのへやで「ゆるかわ／つやつや」を切り替え（既定はゆるかわ）
   spark.js / closet.js の後に読み込む。 */
'use strict';

const _spkGlossSVG=sparkSVG,_spkGlossEgg=spkEggSVG;
function spkStyle(){return(PROG.spk&&PROG.spk.style)||'yuru'}
const YU_OL='#5b4842',YU_INK='#3a2e2b';
const yuMix=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const yuOL=(w)=>`stroke="${YU_OL}" stroke-width="${w||2.4}" stroke-linejoin="round" stroke-linecap="round"`;
function yuRand(str){let h=2166136261;for(const c of String(str))h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h=Math.imul(h^h>>>15,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}}
// 点列をなめらかに結ぶ（Catmull-Rom）→ 手描き風の閉じた線
function yuPath(pts){
  const n=pts.length,f=v=>v.toFixed(1);let d=`M${f(pts[0][0])} ${f(pts[0][1])}`;
  for(let i=0;i<n;i++){const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
    d+=` C${f(p1[0]+(p2[0]-p0[0])/6)} ${f(p1[1]+(p2[1]-p0[1])/6)} ${f(p2[0]-(p3[0]-p1[0])/6)} ${f(p2[1]-(p3[1]-p1[1])/6)} ${f(p2[0])} ${f(p2[1])}`}
  return d+'Z';
}
function yuBody(shape,cy,R,seed){
  const r=yuRand(seed),pts=[],N=18;
  for(let i=0;i<N;i++){
    const a=-Math.PI/2+i*2*Math.PI/N,s=Math.sin(a),c=Math.cos(a);
    let rx=R,ry=R,ccy=cy;if(shape==='mochi'){rx=R+8;ry=R-5;ccy=cy+4}
    let x=80+c*rx,y=ccy+s*ry;
    if(shape==='drop'){const k=Math.pow(Math.max(0,-s),5);y-=k*15;x=80+c*rx*(1-0.38*k)}
    if(s>0.55)y-=(s-0.55)*R*0.16;// 座っているように底を少し平らに
    const j=1+(r()-0.5)*0.04;pts.push([80+(x-80)*j,ccy+(y-ccy)*j]);
  }
  return yuPath(pts);
}

/* ---------- ナゾのたまご（ゆるかわ） ---------- */
function yuEgg(mood,crack){
  const u='yu'+(++spkUid),c=crack==null?spkCrack():crack;
  const pts=[];for(let i=0;i<18;i++){const a=-Math.PI/2+i*Math.PI/9,s=Math.sin(a);pts.push([80+Math.cos(a)*34*(s<0?0.86+0.14*(1+s):1),92+s*(s<0?46:38)])}
  const body=yuPath(pts);
  const cp=[[80,54],[75,63],[84,70],[77,80],[86,89],[79,98]],k=Math.max(0,Math.round(c*(cp.length-1)));
  const crackD=k?'M'+cp.slice(0,k+1).map(p=>p.join(' ')).join(' L'):'';
  return`<svg class="spk spk-yuru spk-egg spk-m-${mood||'hello'}" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><clipPath id="${u}c"><path d="${body}"/></clipPath></defs>
    ${c>0.55?`<circle class="spk-aura" cx="80" cy="92" r="60" fill="#fff3b0" opacity="${(0.1+c*0.18).toFixed(2)}"/>`:''}
    <ellipse class="spk-shadow" cx="80" cy="146" rx="26" ry="4.5" fill="${YU_OL}" opacity=".14"/>
    <g class="spk-float"><g class="spk-eggwob">
      <path d="${body}" fill="#fffaf0"/>
      <g clip-path="url(#${u}c)"><path d="M100 60 Q126 92 112 134 L130 134 L130 50Z" fill="#f3e3c3" opacity=".7"/>
        <path d="M38 104 L48 96 L58 104 L68 96 L78 104 L88 96 L98 104 L108 96 L118 104 L124 100" stroke="#ffb3cf" stroke-width="5" fill="none" stroke-linejoin="round"/>
        <circle cx="64" cy="76" r="4" fill="#9fd8ff"/><circle cx="96" cy="70" r="3" fill="#ffe27a"/><circle cx="92" cy="122" r="4" fill="#9fe3c0"/><circle cx="64" cy="124" r="2.6" fill="#c9b6ff"/></g>
      <path d="${body}" fill="none" ${yuOL(2.6)}/>
      ${crackD?`${c>0.55?`<path d="${crackD}" stroke="#fff3b0" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" class="spk-leak"/>`:''}<path d="${crackD}" stroke="${YU_OL}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`:''}
    </g></g>${spkTw(3,['#ffd56b','#ffb3cf'])}</svg>`;
}

/* ---------- 生まれたあとの姿（ゆるかわ） ---------- */
function yuSVG(st,mood,sp,wear){
  st=st||spkStage();mood=mood||'hello';
  if(st.n===1)return yuEgg(mood);
  sp=sp||spkSpecies()||SPK_SPECIES[0];
  const u='yu'+(++spkUid),[c1,c2,c3]=sp.c,n=st.n,gal=sp.fx==='galaxy';
  const R=n===2?36:41,cy=n===2?96:90,shape=sp.shape;
  const fill=gal?yuMix(c2,'#ffffff',0.15):yuMix('#ffffff',c2,0.36),shade=gal?yuMix(c2,c3,0.45):yuMix('#ffffff',c2,0.62);
  const body=yuBody(shape,cy,R,sp.id+n),W=shape==='mochi'?R+8:R;
  const ht=shape==='drop'?cy-R-14:shape==='mochi'?cy-R+9:cy-R,ey=(shape==='mochi'?cy+6:cy+3);
  // 顔（低い位置・小さな点の目）
  const dot=(x,dy)=>`<ellipse cx="${x}" cy="${ey+dy}" rx="3.5" ry="4.5" fill="${YU_INK}"/><circle cx="${x-1.2}" cy="${ey+dy-1.6}" r="1.2" fill="#fff"/>`;
  const happy=x=>`<path d="M${x-5} ${ey+1} Q${x} ${ey-5} ${x+5} ${ey+1}" stroke="${YU_INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  let face='';
  if(mood==='win')face=`<g class="spk-eyes">${happy(68)}${happy(92)}</g><path d="M75 ${ey+8} Q80 ${ey+16} 85 ${ey+8} Z" fill="${YU_INK}"/><path d="M77.5 ${ey+12} Q80 ${ey+10.5} 82.5 ${ey+12} Q80 ${ey+14.5} 77.5 ${ey+12}Z" fill="#ff8a9a"/>`;
  else if(mood==='cheer')face=`<g class="spk-eyes">${dot(68,0)}${dot(92,0)}</g><path d="M62 ${ey-9} Q67 ${ey-12} 72 ${ey-10}" stroke="${YU_INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M88 ${ey-10} Q93 ${ey-12} 98 ${ey-9}" stroke="${YU_INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/><ellipse cx="80" cy="${ey+10}" rx="3" ry="3.6" fill="${YU_INK}"/>`;
  else if(mood==='study')face=`<g class="spk-eyes">${dot(68,1.5)}${dot(92,1.5)}</g><g fill="none" stroke="${YU_INK}" stroke-width="1.6"><circle cx="68" cy="${ey+1}" r="8"/><circle cx="92" cy="${ey+1}" r="8"/><path d="M76 ${ey} Q80 ${ey-2} 84 ${ey}"/></g><path d="M77 ${ey+11} Q80 ${ey+13} 83 ${ey+11}" stroke="${YU_INK}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M${80+W-12} ${ht+14} q4 7 0 10 q-4 -3 0 -10z" fill="#9fd8ff" ${yuOL(1.2)}/>`;
  else face=`<g class="spk-eyes">${dot(68,0)}${dot(92,0)}</g><path d="M76.5 ${ey+9} Q80 ${ey+12.5} 83.5 ${ey+9}" stroke="${YU_INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const blush=[58,102].map(x=>`<ellipse cx="${x}" cy="${ey+7}" rx="6" ry="3.4" fill="#ff9fb3" opacity=".55"/><path d="M${x-3} ${ey+9} l2 -4 M${x} ${ey+9} l2 -4 M${x+3} ${ey+9} l2 -4" stroke="#ff7f9a" stroke-width="1" stroke-linecap="round" opacity=".7"/>`).join('');
  // 頭の飾り（種類ごと、進化で大きく）
  const s=n>=4?1.3:n>=3?1.1:0.9,y0=ht+2;
  const ACC={
    star:`<path d="M80 ${y0} Q78 ${y0-10} 83 ${y0-17}" fill="none" ${yuOL(2.4)}/><polygon points="${spkStar(84,y0-21,8*s,3.6*s)}" fill="#ffd34d" ${yuOL(2)}/>`,
    leaf:`<path d="M80 ${y0} Q79 ${y0-7} 81 ${y0-12}" fill="none" ${yuOL(2.4)}/><path d="M81 ${y0-11} Q${81+13*s} ${y0-26*s} ${81+24*s} ${y0-14} Q${81+12*s} ${y0-4} 81 ${y0-11}Z" fill="#9be08f" ${yuOL(2)}/>${n>=3?`<path d="M80 ${y0-9} Q${80-10*s} ${y0-22*s} ${80-19*s} ${y0-12} Q${80-9*s} ${y0-3} 80 ${y0-9}Z" fill="#b8eaa8" ${yuOL(2)}/>`:''}`,
    flame:`<g class="spk-flame"><path d="M80 ${y0+5} C${80-12*s} ${y0-2} ${80-8*s} ${y0-14*s} 80 ${y0-24*s} C${80+2*s} ${y0-14*s} ${80+10*s} ${y0-16*s} ${80+8*s} ${y0-26*s} C${80+18*s} ${y0-12*s} ${80+14*s} ${y0} 80 ${y0+5}Z" fill="#ffa24d" ${yuOL(2)}/><path d="M80 ${y0+2} C${80-5*s} ${y0-3} ${80-3*s} ${y0-9*s} ${80+1*s} ${y0-14*s} C${80+6*s} ${y0-8*s} ${80+6*s} ${y0-2} 80 ${y0+2}Z" fill="#ffe27a"/></g>`,
    fin:`<path d="M${80-10*s} ${y0+5} Q${80-4*s} ${y0-20*s} ${80+14*s} ${y0-12*s} Q${80+6*s} ${y0-4} ${80+8*s} ${y0+5}Z" fill="${shade}" ${yuOL(2)}/>`,
    moon:`<path d="M80 ${y0} Q78 ${y0-8} 82 ${y0-14}" fill="none" ${yuOL(2.4)}/><path d="M84 ${y0-34*s+6} a${9*s} ${9*s} 0 1 0 ${9*s} ${15*s} a${7.5*s} ${7.5*s} 0 1 1 ${-9*s} ${-15*s}Z" fill="#ffd34d" ${yuOL(2)}/>`,
    blossom:`<g transform="translate(${80+W*0.55} ${ht+9}) scale(${s})">${[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-6" rx="4.6" ry="6.4" fill="#ffd6e4" stroke="${YU_OL}" stroke-width="1.4" transform="rotate(${a})"/>`).join('')}<circle r="3" fill="#ffd34d"/></g>`,
    bolt:`<polygon points="${[[84,-34],[72,-12],[80,-12],[74,4],[92,-18],[84,-18],[90,-34]].map(([x,y])=>(80+(x-80)*s).toFixed(1)+','+(y0+y*s*0.9).toFixed(1)).join(' ')}" fill="#ffe14d" ${yuOL(2)}/>`,
    crystal:`<g class="spk-crystal"><polygon points="80,${y0-34*s} ${80+9*s},${y0-22*s} 80,${y0-6} ${80-9*s},${y0-22*s}" fill="#e9f3ff" ${yuOL(2)}/><path d="M${80-9*s} ${y0-22*s} L80 ${y0-18*s} L${80+9*s} ${y0-22*s}" fill="none" stroke="#b9a8ff" stroke-width="1.4"/></g>`
  };
  const acc=`<g class="spk-antenna">${ACC[sp.acc]||ACC.star}</g>`;
  const halo=n>=5?`<ellipse class="spk-halo" cx="80" cy="${ht-10}" rx="22" ry="5" fill="none" stroke="#ffd34d" stroke-width="3.4"/><ellipse cx="80" cy="${ht-10}" rx="22" ry="5" fill="none" stroke="${YU_OL}" stroke-width="1" opacity=".6"/>`:'';
  const ears=sp.ears==='cat'?[-1,1].map(k=>`<path d="M${80+k*R*0.78} ${cy-R*0.42} L${80+k*R*0.66} ${cy-R-12} L${80+k*R*0.12} ${cy-R*0.86}Z" fill="${fill}" ${yuOL(2.4)}/><path d="M${80+k*R*0.64} ${cy-R*0.6} L${80+k*R*0.6} ${cy-R-4} L${80+k*R*0.34} ${cy-R*0.84}Z" fill="#ffc2d4"/>`).join(''):'';
  const fins=sp.acc==='fin'?[-1,1].map(k=>`<path d="M${80+k*(R-4)} ${cy-4} Q${80+k*(R+20)} ${cy-20} ${80+k*(R+15)} ${cy+6} Q${80+k*(R+6)} ${cy+12} ${80+k*(R-4)} ${cy+9}Z" fill="${shade}" ${yuOL(2.2)}/>`).join(''):'';
  const wings=n>=4?[-1,1].map(k=>`<g class="spk-wing spk-wing-${k<0?'l':'r'}"><path d="M${80+k*(W-4)} ${cy-6} Q${80+k*(W+26)} ${cy-30} ${80+k*(W+21)} ${cy+4} Q${80+k*(W+13)} ${cy+18} ${80+k*(W-6)} ${cy+10}Z" fill="#ffffff" ${yuOL(2.2)}/></g>`).join(''):'';
  const up=mood==='cheer'||mood==='win';
  const arms=n>=3?`<ellipse cx="${80-W+2}" cy="${up?ey-4:ey+16}" rx="6.5" ry="9" fill="${fill}" ${yuOL(2.2)} transform="rotate(${up?-30:25} ${80-W+2} ${up?ey-4:ey+16})"/>
    ${up?`<g class="spk-arm-r up" style="transform-origin:${80+W-6}px ${ey+6}px"><ellipse cx="${80+W-2}" cy="${ey-4}" rx="6.5" ry="9" fill="${fill}" ${yuOL(2.2)} transform="rotate(30 ${80+W-2} ${ey-4})"/></g>`:`<ellipse cx="${80+W-2}" cy="${ey+16}" rx="6.5" ry="9" fill="${fill}" ${yuOL(2.2)} transform="rotate(-25 ${80+W-2} ${ey+16})"/>`}`:'';
  const bottom=shape==='mochi'?cy+4+(R-5)*0.84:cy+R*0.92;
  const feet=[-1,1].map(k=>`<ellipse cx="${80+k*W*0.38}" cy="${bottom+1}" rx="8" ry="5" fill="${shade}" ${yuOL(2.2)}/>`).join('');
  const inside=`<g clip-path="url(#${u}c)"><path d="M${80+W*0.25} ${cy-R} Q${80+W*1.25} ${cy} ${80+W*0.3} ${cy+R*1.2} L${80+W*1.5} ${cy+R*1.2} L${80+W*1.5} ${cy-R}Z" fill="${shade}" opacity=".55"/>
    ${sp.fx==='rainbow'?['#ffc2df','#ffe9a0','#bff0d6','#bfe0ff'].map((col,i)=>`<rect x="20" y="${cy-R+i*R*0.5}" width="140" height="${R*0.25}" fill="${col}" opacity=".55"/>`).join(''):''}
    ${gal||n>=6?[[64,100],[96,108],[84,76],[58,84],[104,92],[72,118],[90,64]].map(([x,y],i)=>`<polygon points="${spkStar(x,y,i%2?1.8:2.6,1)}" fill="#fff"/>`).join(''):''}</g>`;
  const orbitOn=n>=6||(gal&&n>=4);
  const orbit=orbitOn?`<ellipse cx="80" cy="${cy}" rx="68" ry="16" fill="none" stroke="#ffcf5a" stroke-width="2" stroke-dasharray="3 6" transform="rotate(-12 80 ${cy})"/>`:'';
  const g={ht,ey,cy,W,R,n,u};
  const wearL=typeof spkWearSVG==='function'?`<g class="spk-wear">${spkWearSVG(g,wear===undefined?spk().wear:wear)}</g>`:'';
  const tw=mood==='win'?`<path d="M${80+W+6} ${ht+6} l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2z" fill="#ffd34d" ${yuOL(1.2)}/>`:mood==='cheer'?`<path d="M${80+W+8} ${ht} l3 14" ${yuOL(3)}/><circle cx="${80+W+12.5}" cy="${ht+20}" r="1.8" fill="${YU_OL}"/>`:'';
  return`<svg class="spk spk-yuru spk-m-${mood} spk-s${n} spk-${sp.id}" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><clipPath id="${u}c"><path d="${body}"/></clipPath><radialGradient id="${u}a"><stop offset=".45" stop-color="${n>=6?'#ffe08a':c2}" stop-opacity=".38"/><stop offset="1" stop-color="${n>=6?'#ffe08a':c2}" stop-opacity="0"/></radialGradient></defs>
    ${n>=5?`<circle class="spk-aura" cx="80" cy="${cy}" r="${R+26}" fill="url(#${u}a)"/>`:''}${orbit}
    <ellipse class="spk-shadow" cx="80" cy="150" rx="${W*0.7}" ry="4.5" fill="${YU_OL}" opacity=".14"/>
    <g class="spk-float"><g class="spk-squash">${wings}${fins}${ears}${halo}${acc}${feet}
      <path d="${body}" fill="${fill}"/>${inside}<path d="${body}" fill="none" ${yuOL(2.8)}/>
      ${blush}<g class="spk-face">${face}</g>${arms}${wearL}${tw}</g></g>
    ${spkTw(Math.min(4,n),sp.acc==='blossom'?['#ffc2d8','#ffd56b']:['#ffd56b','#ffffff'])}</svg>`;
}

/* ---------- 切り替え ---------- */
sparkSVG=function(st,mood,sp,wear){return spkStyle()==='gloss'?_spkGlossSVG(st,mood,sp,wear):yuSVG(st,mood,sp,wear)};
spkEggSVG=function(mood,crack){return spkStyle()==='gloss'?_spkGlossEgg(mood,crack):yuEgg(mood,crack)};
// ゆるかわに合う、短くて気持ちのこもった一言
SPK_LINES.win.splice(0,SPK_LINES.win.length,['できた…！ すごい…！','You did it!'],['えらすぎる…！','So proud of you!'],['この調子なら、本番もいける','You\'re getting test-ready!']);
SPK_LINES.cheer.splice(0,SPK_LINES.cheer.length,['だいじょうぶ。間違えたとこが、伸びるとこ','Mistakes are where you grow.'],['ここでやめないの、えらい','Not quitting is winning.'],['ちょっとずつで、いいよ','Little by little.']);
SPK_LINES.study.splice(0,SPK_LINES.study.length,['いっしょに、がんばろ…！','Let\'s do this together.'],['1問ずつ、ゆっくりでいいよ','One at a time.']);
SPK_LINES.hello.splice(0,SPK_LINES.hello.length,['きょうも会えた…うれしい','Happy to see you!'],['5分だけ、いっしょにやろ','Just 5 minutes?'],['英語、ちょっとずつ好きになってきた？','Getting fun?']);

// Sparkのへやに絵柄の切り替え
if(typeof openSparkRoom==='function'){
  const _or=openSparkRoom;
  openSparkRoom=function(){
    const r=_or.apply(this,arguments);
    const sub=document.querySelector('.spk-room-sub');
    if(sub&&!document.getElementById('spk-style')){
      sub.insertAdjacentHTML('afterend',`<div class="spk-style" id="spk-style" role="group" aria-label="絵柄"><button data-st="yuru" class="${spkStyle()==='yuru'?'on':''}">ゆるかわ</button><button data-st="gloss" class="${spkStyle()==='gloss'?'on':''}">つやつや</button></div>`);
      document.querySelectorAll('#spk-style [data-st]').forEach(b=>b.onclick=()=>{spk().style=b.dataset.st;commit();openSparkRoom();if(typeof renderHeader==='function')renderHeader()});
    }
    return r;
  };
}
