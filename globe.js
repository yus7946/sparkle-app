/* ========== オープニングの立体地球（Canvas・$0・オフライン） ==========
   ・陸地は Natural Earth 1:110m（パブリックドメイン）を 0.25° 精度に簡略化して埋め込み
   ・起動時に端末内でテクスチャ（海・浅瀬・森・砂漠・氷・雲）を生成 → 球に貼って自転
   ・光の当たり方（昼夜の境目・海のきらめき・大気のふち）を画素ごとに計算
   ・飛行機が地球の周りを周回（奥を通るときは地球に隠れる）
   ・旅した街（ストーリー全クリア）が金色に光り、次の目的地が点滅する
   ・指でドラッグすると地球を回せる */
'use strict';
const SG_LAND='YFeL14H071I06342.q2cL709321826222.yGWL4226R4D101C1A5E0.i7kK406052910060.aAeK8042J051E0.-DaK14725021723101C1254188.0wL4162616261C0C2a14C1Q2M101R0D34311F3K062G31191N1931362E12260M313204122c13-10M36440G2A0I221533035I26240G1A24322A042E243I4S3404359430301I9K34012H412225276A4466A12D8N4P002E4H202A6W2862W15S281o133300N01321Q5Q1K381013043C183C021A2G122U58064A3402241E08042I0K383I6E5I340E143A08086C24061K22402540040368241C7E163G5G04364Q2E1E5C6G1E182I4C3O2O3016640W1044A2E281A480A4O2E258D49604448222J078E6M422E2C1A2vi10.WEWIC212503230D375E423414026.cFqH421250101211414021.gVkH72256202.se1iG40800414101230590142.ai1iG024102025622503832B10023E7674102.gi1uF44012202426116303A301023013121057B8402.ih1WE1233554286.0gDwi120140zi1102.uS-C2812011026BW152511B471925804523222746.ke1WD2221444GA6284024880206221C16323A185274510154B3111551211112124701541431013321B3L27414D0745053012007175D2213241729022185I345212324211121220345606440014781011021C440223416IA4029052921222C.Yc1mC302143A09412.yb1eC02B201214261.Ya1aC80216222A432N3B3236044.mf1-B7453006001024021034214.wc1qB24317001A0.ed1iB2842434340OA640262223004664002641091775132043251313152232017H712013181115053816200.ac1YB1432D002442181021054440224041010233201011103120A300710014D4382404100.oc1aB0210042210170320022002.uZ1WC5077BF37BB0182CC40A812422620220C.eb1WB443018321A013211315211500533072142212161EF20246202100212142202.gc1cA061203120402510301115400234122212120032224.qW1mA101313278A1412.Wc1-936112520022102.cc1u924312412152001112022.sb1-8220126023206A206331213502111021105220940.kDu8A2640271343150110080131041.ga1-832310321800214.oCi802408640026032B0413013D101003032304360C0.qb1i81415672238.gd1W7203401341123202122.kOm6169301C0.qNa6421610101740.ae1q60414D2343101F24416321123334087C04742832503214126043404.me1u520410452345114300323402786.Y7c571533013A2A8.mF-432402012A21240241431010154102130B001210067632014.-5m4401444750120.ke1-4465116440431120J13054110214G.qLs454514313834042120432.YOg412336002.i3a43213812232.aM-3348036404620464202102232D27230A55011613121600111510021111203114580.yBY30221C40262305011941130212540.sK-2024452D4H1417180019043606463428160.WDy230010141420232.0q2K8022001A084920410B101901021502212Wj105230861250F4B651921032515800420630122252165014345H25410160KB4530349415B29644D0015052P0RI60224041426404341A78BC5231961474044246061292031341311031212331D44511963212224002226362025276428C02122218109E967401327214100350741214EE2818FC010351355103303I4026A8220826127759035702114B7L56512501350033393004500270041252BA02521M1014021034335D17353L52105321017335J2F1151072B55731324A4402440320062280A90624626458121432023202B2149432B21450390759770313339D102538596G6804642E4248GE02326420Q5065E7CRQ580822166A2E58749A124608B6223CFG74D0B453050003BH1J9F0729450515013DBF4F1135925792F691B251D99D53053345271713034543278540871325A547G4E5G0418041220241122402322244E224E44103006362028260A28120220182216B050100511450313032313035233163600180A360E480410101J941211163F40460029210013141007100303610163424400250341330524210311046104402312210041031155703D7310310101021301006A8400200A6005112220234102313D555133196715204343056241430149032101390051029051161O02127755101C01542A103A125A14041350321810222542440026162E38221601721414420253001A1804131J251031321G70151723222D8348634323A5012309F7452511D41I7IDG7G063E0E2524241Y1822023252L1820682011120A24111838223312111C2225002426101M5403440I342413121C2K621333021338323E024324416427842A7112130114353811320220442136180843303Q13141O3E0I143A06052A002G0C202H6E02281E202G021E0622212C44362O03361a14E4O0421460S064613121W12vi12.qSY66432140682C00731213023422133100417303540016105707298440266.oAq230D181A4.0g2Wj123010vi11.0g2A09201.cBo204634412448703C242223222027290563450121230343418602861O8A226266441231531816535334319G0A68008846365CE12A682224226H8P07498208581604232286261430222LA1003639200B612122220000002D2607006321124362311110410204A329698066C18101357033332539012223251909434263E6C86A14325E1021614100812G062243E882081A46303216065421210241224002313611120222044804221A010026224622464C0A84822021400800421C4220240E2C8604A16DG3K5G320292B6341AJO3230711102641242121452D226125010100422212254163032048214323632064250520451931F234151410762273106314B2119206H0D254T1533HB13DP53211367011211032027412320451009130351342232039101530211037700013293D772RB75010003159731039937313128CE48202412115315952023537D3371FN251329196024011595711103311133015103511390D5F1B33202D411234101D822149276P6C560C5257211121152031150510111656083112172705053E34012A0F75141606143M384i12S48160C14041846102C1Q44252M0424131408164C2C10140620221402393036382663280.e8a21281624142442133804246E402502210D0T2117053K1L011A1D063C342.-Ca200B2530021A262.sBa22243A18612C3G4028042C44472G264600474955004A44414F3C6J33100B300923123G0118510F540B392R3314050032341A114.-9W2C022326204B0B301823341.ke1a2D18164.yAa254301561G05430.k7g292B38533U282D45202.gf1y132D121G2.wAy112B18162.qe1w112L2732160O2.cAs140167030015003G0.W9u100802232R21081L085Q453414222.sTk2F100710140038131A111M5K18042T4B4B80484.sAq1C0421282W104272N0H11331B12080.W8o11212H250G5C0.u8o17050816002.oPm1727041118062.mAm17013C212.WAk122L1405101I242.qZ1k1L28321E410.wOg1C292123212307120D511A12260216062.sPc18252B0B093M0A0.ySc1D2302170E102616210.WZ1i1J0513151K3G604.qBg140B4727131004170514340008164C044.-DSK06200L480F452N2621022H68094Z11016013E25151C35013E261L07173O1A021C0i10.aJQO450Z12Q0804232S3C240J4B2A0740642B2622430427240129044027110C40450732254G0J6H276N41216742238505370B935330310456025923005C2937063B73101B1R0B3I1P121U30190O511M0G0A1O49101E1Y11W10';
const SG_CITIES={tokyo:[35.68,139.69],hawaii:[21.31,-157.86],singapore:[1.35,103.82],orlando:[28.54,-81.38],paris:[48.86,2.35],london:[51.51,-0.13],rome:[41.9,12.5],bangkok:[13.76,100.5],sydney:[-33.87,151.21],nyc:[40.71,-74.0]};
const SG_W=1024,SG_H=512,SG_CW=512,SG_CH=256;
let sgTex=null;

function sgRand(seed){return()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// 横方向に継ぎ目のないフラクタルノイズ（0〜1）
function sgNoise(w,h,octs,seed){
  const r=sgRand(seed),out=new Float32Array(w*h);let amp=1,tot=0;
  for(let o=0;o<octs;o++){
    const gx=4<<o,gy=2<<o,g=new Float32Array(gx*(gy+1));for(let i=0;i<g.length;i++)g[i]=r();
    for(let y=0;y<h;y++){const fy=y/h*gy,y0=fy|0,ty=fy-y0,sy=ty*ty*(3-2*ty),r0=y0*gx,r1=r0+gx;
      for(let x=0;x<w;x++){const fx=x/w*gx,x0=fx|0,tx=fx-x0,sx=tx*tx*(3-2*tx),x1=(x0+1)%gx;
        const top=g[r0+x0]+(g[r0+x1]-g[r0+x0])*sx,bot=g[r1+x0]+(g[r1+x1]-g[r1+x0])*sx;
        out[y*w+x]+=amp*(top+(bot-top)*sy)}}
    tot+=amp;amp*=0.5}
  for(let i=0;i<out.length;i++)out[i]/=tot;
  return out;
}
function sgCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
const sgCl=v=>v<0?0:v>1?1:v;
const sgSm=(a,b,v)=>{const t=sgCl((v-a)/(b-a));return t*t*(3-2*t)};
// 経緯度の箱（ふちはなめらか）
const sgBox=(lon,lat,l0,l1,b0,b1,e)=>sgCl(Math.min(lon-l0,l1-lon,lat-b0,b1-lat)/(e||5)+0.5);

function sgBuild(){
  const W=SG_W,H=SG_H,AL='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
  // 1) 陸地マスク（正距円筒図法にそのまま描く）
  const m=sgCanvas(W,H),g=m.getContext('2d');
  g.fillStyle='#000';g.fillRect(0,0,W,H);g.fillStyle='#fff';g.beginPath();
  const kx=W/720,ky=H/360;
  SG_LAND.split('.').forEach(r=>{
    const p=[];let i=0,x=0,y=0;
    const rd=()=>{let z=0,s=0,c;do{c=AL.indexOf(r[i++]);z|=(c&31)<<s;s+=5}while(c&32);return z&1?-(z+1)/2:z/2};
    while(i<r.length){x+=rd();y+=rd();if(p.length){const q=p[p.length-1][0];while(x-q>360)x-=720;while(q-x>360)x+=720}p.push([x,y])}
    const polar=Math.abs(p[p.length-1][0]-p[0][0])>360;
    for(const o of[-720,0,720]){
      p.forEach(([a,b],k)=>k?g.lineTo((a+o)*kx,b*ky):g.moveTo((a+o)*kx,b*ky));
      if(polar){const yy=p[0][1]>180?H:0;g.lineTo((p[p.length-1][0]+o)*kx,yy);g.lineTo((p[0][0]+o)*kx,yy)}
      g.closePath();
    }
  });
  g.fill('evenodd');
  const land=g.getImageData(0,0,W,H).data;
  // 2) 浅瀬：マスクを段階的に縮めてぼかし、1/4 サイズに戻す
  let b=m,bw=W,bh=H;
  for(let k=0;k<4;k++){bw>>=1;bh>>=1;const c=sgCanvas(bw,bh);c.getContext('2d').drawImage(b,0,0,bw,bh);b=c}
  const up=sgCanvas(W>>2,H>>2),ug=up.getContext('2d');ug.imageSmoothingEnabled=true;ug.drawImage(b,0,0,W>>2,H>>2);
  const shal=ug.getImageData(0,0,W>>2,H>>2).data;
  // 3) 色づけ
  const nz=sgNoise(SG_CW,SG_CH,5,7);
  const tex=new Uint8ClampedArray(W*H*3),sea=new Float32Array(W*H);
  const C={forest:[30,82,42],grass:[98,128,60],trop:[22,74,34],boreal:[44,76,52],tundra:[126,122,100],sand:[212,182,128],sand2:[178,136,90],ice:[238,243,248]};
  const mix=(c,d,t)=>{c[0]+=(d[0]-c[0])*t;c[1]+=(d[1]-c[1])*t;c[2]+=(d[2]-c[2])*t};
  for(let y=0;y<H;y++){
    const lat=90-(y+0.5)/H*180,al=Math.abs(lat),cl=Math.cos(lat*Math.PI/180);
    const trop=Math.exp(-((lat/12)**2)),north=sgSm(44,58,lat),tun=sgSm(58,70,lat);
    for(let x=0;x<W;x++){
      const i=y*W+x,lon=(x+0.5)/W*360-180,a=land[i*4]/255,n=nz[(y>>1)*SG_CW+(x>>1)];
      const s=shal[((y>>2)*(W>>2)+(x>>2))*4]/255;
      // 海：赤道ほど明るい青、沿岸は浅瀬のターコイズ
      let r=8+10*n+30*s*s,gg=40+34*cl+16*n+70*s*s,bb=96+58*cl+12*n+36*s*s;
      if(a>0){
        const c=C.grass.slice();mix(c,C.forest,sgCl(n*1.6-0.3));mix(c,C.trop,trop*0.75);mix(c,C.boreal,north);mix(c,C.tundra,tun);
        let dry=Math.max(sgBox(lon,lat,-17,58,15,33),sgBox(lon,lat,34,60,14,32),sgBox(lon,lat,116,146,-31,-19,6),sgBox(lon,lat,55,118,36,47,6)*0.8,
          sgBox(lon,lat,-117,-103,25,37,4)*0.8,sgBox(lon,lat,13,26,-28,-18,4),sgBox(lon,lat,-75,-68,-30,-17,3),sgBox(lon,lat,60,75,23,31,4)*0.7);
        dry=sgCl(dry*(0.7+0.6*n));
        const sd=C.sand.slice();mix(sd,C.sand2,sgCl(n*1.4-0.2));mix(c,sd,dry);
        const ice=Math.max(lat<-60?1:0,sgBox(lon,lat,-56,-18,59,85,4)*0.95,sgSm(70,80,al)*0.9);
        mix(c,C.ice,ice);
        r+=(c[0]-r)*a;gg+=(c[1]-gg)*a;bb+=(c[2]-bb)*a;
      }
      tex[i*3]=r;tex[i*3+1]=gg;tex[i*3+2]=bb;sea[i]=1-a;
    }
  }
  // 4) 雲：熱帯収束帯と中緯度の帯に多め
  const cn=sgNoise(SG_CW,SG_CH,6,99),cloud=new Float32Array(SG_CW*SG_CH);
  for(let y=0;y<SG_CH;y++){
    const lat=90-(y+0.5)/SG_CH*180,al=Math.abs(lat);
    const band=0.5+0.5*Math.max(Math.exp(-((lat/8)**2))*0.8,Math.exp(-(((al-52)/13)**2)));
    for(let x=0;x<SG_CW;x++){const i=y*SG_CW+x;cloud[i]=sgSm(0.5,0.78,cn[i]*band+0.12)*0.85}
  }
  return{tex,sea,cloud};
}

// el の中に地球を描く。opt.cities = [{key, state:'done'|'next'|'todo'}]。成功で {stop} を返す
function sgMount(host,opt){
  opt=opt||{};
  if(!host||!document.createElement('canvas').getContext)return null;
  if(!sgTex)sgTex=sgBuild();
  const{tex,sea,cloud}=sgTex,W=SG_W,H=SG_H;
  const css=Math.round(host.clientWidth||300),dpr=Math.min(2,window.devicePixelRatio||1);
  const cv=sgCanvas(Math.round(css*dpr),Math.round(css*dpr));
  cv.style.cssText=`width:${css}px;height:${css}px;display:block;touch-action:none`;
  cv.setAttribute('role','img');cv.setAttribute('aria-label','地球の周りを飛行機が回るアニメーション');
  host.innerHTML='';host.appendChild(cv);
  const ctx=cv.getContext('2d'),S=cv.width,R=Math.round(S*0.31),D=R*2,cx=S/2,cy=S/2;
  const off=sgCanvas(D,D),octx=off.getContext('2d'),img=octx.createImageData(D,D),px=img.data;

  // 画素ごとの前計算（経度・緯度・明るさ・きらめき・大気）
  const tilt=0.36,ct=Math.cos(tilt),st=Math.sin(tilt);
  const nrm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)};
  const L=nrm([-0.55,0.42,0.72]),Hh=nrm([L[0],L[1],L[2]+1]);
  const N=Math.ceil(Math.PI*R*R)+4*D;
  const pI=new Int32Array(N),vR=new Int32Array(N),vC=new Int32Array(N),lonT=new Float32Array(N),shd=new Float32Array(N),spc=new Float32Array(N),rim=new Float32Array(N),alp=new Uint8Array(N);
  let n=0;
  for(let j=0;j<D;j++)for(let i=0;i<D;i++){
    const sx=(i+0.5-R)/R,sy=(R-j-0.5)/R,d2=sx*sx+sy*sy,a=sgCl(R-Math.sqrt(d2)*R+0.5);
    if(a<=0||n>=N)continue;
    const z=Math.sqrt(Math.max(0,1-Math.min(1,d2)));
    const wy=sy*ct+z*st,wz=-sy*st+z*ct,lat=Math.asin(Math.max(-1,Math.min(1,wy))),lon=Math.atan2(sx,wz);
    const v=Math.min(H-1,Math.max(0,((0.5-lat/Math.PI)*H)|0));
    const dif=sx*L[0]+sy*L[1]+z*L[2],dh=Math.max(0,sx*Hh[0]+sy*Hh[1]+z*Hh[2]),rm=Math.pow(1-z,2.4);
    pI[n]=(j*D+i)*4;vR[n]=v*W;vC[n]=Math.min(SG_CH-1,v>>1)*SG_CW;lonT[n]=lon/(2*Math.PI)*W;
    shd[n]=0.07+1.0*sgSm(-0.18,0.62,dif);spc[n]=Math.pow(dh,46)*0.75;rim[n]=rm*(0.25+0.75*sgSm(-0.35,0.55,dif));alp[n]=a*255;n++;
  }
  const glow=ctx.createRadialGradient(cx,cy,R*0.92,cx,cy,R*1.3);
  glow.addColorStop(0,'rgba(120,190,255,.55)');glow.addColorStop(0.3,'rgba(80,160,255,.2)');glow.addColorStop(1,'rgba(40,120,255,0)');

  const drawEarth=(cLon,cOff)=>{
    const cT=(cLon+180)/360*W,cC=cT/2+cOff;
    for(let k=0;k<n;k++){
      let u=(lonT[k]+cT)%W;if(u<0)u+=W;
      const t=vR[k]+(u|0),t3=t*3;
      let cu=(lonT[k]/2+cC)%SG_CW;if(cu<0)cu+=SG_CW;
      const c=cloud[vC[k]+(cu|0)],s=shd[k],sp=spc[k]*sea[t]*(1-c),rm=rim[k],p=pI[k];
      const r=tex[t3]+(242-tex[t3])*c,g=tex[t3+1]+(246-tex[t3+1])*c,b=tex[t3+2]+(252-tex[t3+2])*c;
      px[p]=r*s+sp*255+rm*70;px[p+1]=g*s+sp*240+rm*150;px[p+2]=b*s+sp*225+rm*255;px[p+3]=alp[k];
    }
    octx.putImageData(img,0,0);
  };
  // 街の位置（地球の回転に合わせて投影）
  const cities=[{key:'tokyo',state:'home'}].concat(opt.cities||[]).filter(c=>SG_CITIES[c.key]);
  const project=(lat,lon,cLon)=>{
    const f=lat*Math.PI/180,l=(lon-cLon)*Math.PI/180,X=Math.cos(f)*Math.sin(l),Y=Math.sin(f),Z=Math.cos(f)*Math.cos(l);
    return{x:cx+X*R,y:cy-(Y*ct-Z*st)*R,z:Y*st+Z*ct};
  };
  const drawCities=(cLon,ts)=>{
    cities.forEach(c=>{
      const[lat,lon]=SG_CITIES[c.key],q=project(lat,lon,cLon);if(q.z<0.06)return;
      const k=dpr*(0.55+0.45*q.z);ctx.save();ctx.globalAlpha=sgCl(q.z*4);
      if(c.state==='done'){ctx.shadowColor='rgba(255,200,80,.95)';ctx.shadowBlur=10*dpr;ctx.fillStyle='#ffd36b';ctx.beginPath();ctx.arc(q.x,q.y,3.2*k,0,7);ctx.fill()}
      else if(c.state==='next'){const ph=(ts/1400)%1;ctx.strokeStyle=`rgba(255,226,150,${1-ph})`;ctx.lineWidth=1.4*dpr;ctx.beginPath();ctx.arc(q.x,q.y,(3+9*ph)*k,0,7);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(q.x,q.y,2.6*k,0,7);ctx.fill()}
      else if(c.state==='home'){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(q.x,q.y,3*k,0,7);ctx.fill();ctx.fillStyle='#ff5a5f';ctx.beginPath();ctx.arc(q.x,q.y,1.7*k,0,7);ctx.fill()}
      else{ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(q.x,q.y,1.7*k,0,7);ctx.fill()}
      ctx.restore();
    });
  };
  // 周回軌道と飛行機
  const rx=R*1.46,ry=R*0.36,rot=-0.32,cr=Math.cos(rot),sr=Math.sin(rot);
  const orbitPt=th=>{const ex=rx*Math.cos(th),ey=ry*Math.sin(th);return[cx+ex*cr-ey*sr,cy+ex*sr+ey*cr]};
  const PLANE=[[13,0],[10,-1.5],[3,-1.6],[-4,-11],[-7.5,-11],[-3.5,-1.6],[-9,-1.4],[-12,-5],[-14,-5],[-12.5,-1],[-13.5,0]];
  const planeShape=PLANE.concat(PLANE.slice(1,-1).reverse().map(([x,y])=>[x,-y]));
  const drawPlane=(th)=>{
    const[x,y]=orbitPt(th),dx=-rx*Math.sin(th),dy=ry*Math.cos(th),ang=Math.atan2(dx*sr+dy*cr,dx*cr-dy*sr);
    const sc=dpr*0.78*(0.8+0.28*Math.sin(th));
    ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.scale(sc,sc);
    ctx.shadowColor='rgba(255,205,110,.9)';ctx.shadowBlur=9*dpr;ctx.fillStyle=Math.sin(th)>0?'#ffffff':'rgba(225,235,255,.85)';
    ctx.beginPath();planeShape.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.fill();ctx.restore();
  };
  const drawOrbit=(front)=>{
    ctx.save();ctx.setLineDash([2.5*dpr,5*dpr]);ctx.lineWidth=1*dpr;ctx.strokeStyle=front?'rgba(255,232,190,.42)':'rgba(255,232,190,.16)';
    ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,rot,front?0:Math.PI,front?Math.PI:2*Math.PI);ctx.stroke();ctx.restore();
  };
  const drawTrail=(th,front)=>{
    ctx.save();ctx.lineCap='round';
    for(let k=1;k<=26;k++){
      const a0=th-k*0.045,a1=a0+0.045;if((Math.sin((a0+a1)/2)>0)!==front)continue;
      const[x0,y0]=orbitPt(a0),[x1,y1]=orbitPt(a1);
      ctx.strokeStyle=`rgba(255,240,210,${0.55*(1-k/26)})`;ctx.lineWidth=(2.2-k*0.06)*dpr;
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    }
    ctx.restore();
  };

  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cLon=opt.lon!=null?opt.lon:150,th=-0.6,vel=-5.5,drag=null,last=0,raf=0,stopped=false,cOff=0;
  const frame=ts=>{
    if(stopped||!cv.isConnected){stopped=true;return}
    const dt=last?Math.min(0.05,(ts-last)/1000):0;last=ts;
    if(!drag&&!reduce){cLon+=vel*dt;vel+=(-5.5-vel)*Math.min(1,dt*1.5);th+=dt*0.75;cOff+=dt*1.2}
    ctx.clearRect(0,0,S,S);
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,R*1.3,0,7);ctx.fill();
    drawOrbit(false);drawTrail(th,false);if(Math.sin(th)<=0)drawPlane(th);
    drawEarth(cLon,cOff);ctx.drawImage(off,cx-R,cy-R);
    drawCities(cLon,ts);
    drawOrbit(true);drawTrail(th,true);if(Math.sin(th)>0)drawPlane(th);
    if(!reduce||drag)raf=requestAnimationFrame(frame);
  };
  // 指で回す
  cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,t:performance.now(),v:0};cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);if(reduce)raf=requestAnimationFrame(frame)});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const now=performance.now(),dx=e.clientX-drag.x,d=-dx/(R/dpr)*57.3;cLon+=d;drag.v=d/Math.max(0.016,(now-drag.t)/1000);drag.x=e.clientX;drag.t=now});
  const end=()=>{if(!drag)return;vel=Math.max(-240,Math.min(240,drag.v||0));drag=null};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  raf=requestAnimationFrame(frame);
  return{stop(){stopped=true;cancelAnimationFrame(raf)}};
}
