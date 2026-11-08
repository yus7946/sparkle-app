/* ========== プライバシーポリシーと利用規約 ==========
   公開に必要な表示。実際のデータの流れ（端末内保存・ブラウザの音声認識・チーム機能・Plus 事前登録の件数）に合わせて書く。
   運営者名と連絡先は LEGAL に入れる（決まるまでは「未定」）。
   Profile の一番下に入口を置く。 */
'use strict';

// 販売を始めるには owner・address・phone・contact をすべて入れる（未定のままだと plus_pay.js が販売を開始しない）
const LEGAL={owner:'未定',address:'未定',phone:'未定',contact:'未定',updated:'2026年11月8日'};
const legalReady=()=>[LEGAL.owner,LEGAL.address,LEGAL.phone,LEGAL.contact].every(v=>v&&v!=='未定');
const lgV=v=>v&&v!=='未定'?esc(v):'準備中';

function legalOpen(tab,from){
  const el=document.getElementById('screen-review');
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));el.classList.add('active');
  const tk=tab==='tokusho',pp=tab!=='terms'&&!tk;
  const who=`<p><b>運営者：</b>${LEGAL.owner?esc(LEGAL.owner):'準備中'}<br><b>お問い合わせ：</b>${LEGAL.contact?esc(LEGAL.contact):'準備中'}</p>`;
  el.innerHTML=`<div class="back-row"><button class="icon-btn" id="lg-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>${tk?'特定商取引法に基づく表記':pp?'プライバシーポリシー':'利用規約'}</h2></div>
    <div class="tk-seg lg-tabs"><button data-lg="pp" class="${pp?'on':''}">プライバシーポリシー</button><button data-lg="terms" class="${pp||tk?'':'on'}">利用規約</button><button data-lg="tokusho" class="${tk?'on':''}">特商法</button></div>
    <div class="card lg-body">${tk?`
      <h3>販売事業者・運営責任者</h3><p>${lgV(LEGAL.owner)}</p>
      <h3>所在地</h3><p>${lgV(LEGAL.address)}</p>
      <h3>電話番号</h3><p>${lgV(LEGAL.phone)}</p>
      <h3>お問い合わせ</h3><p>${lgV(LEGAL.contact)}</p>
      <h3>販売価格</h3><p>Sparkle Plus 月額 ${PLAN.price.m.toLocaleString()}円／年額 ${PLAN.price.y.toLocaleString()}円（いずれも税込）</p>
      <h3>商品代金以外に必要な料金</h3><p>インターネット接続に必要な通信料はお客様のご負担です。</p>
      <h3>お支払い方法</h3><p>クレジットカード（決済代行：Stripe）</p>
      <h3>お支払いの時期</h3><p>お申し込み時に初回分をお支払いいただき、以後は1か月ごと（月額）または1年ごと（年額）の更新日に自動で請求します。</p>
      <h3>サービスの提供時期</h3><p>決済が完了した時点から、すぐにご利用いただけます。</p>
      <h3>解約について</h3><p>Plus の画面の「解約・お支払いの管理」から、いつでも解約できます。解約後も次回更新日の前日まではご利用いただけ、以降の請求は発生しません。解約の手続きは次回更新日の前日までにお願いします。</p>
      <h3>返品・返金について</h3><p>デジタルサービスの性質上、決済後の返金および日割りでの返金はお受けしていません。ただし、法令に定めがある場合や、当方の不具合によりサービスを提供できない場合はこの限りではありません。</p>
      <h3>動作環境</h3><p>最新版の iOS の Safari、Android の Chrome を推奨します。音声の機能は、端末に内蔵された音声合成・音声認識を使います。</p>`:pp?`
      <p>Sparkle（以下「本アプリ」）は、学習の記録をできるだけお使いの端末の中だけで扱います。どの情報が、どこに送られるかを以下にまとめます。</p>
      <h3>1. 端末の中だけに保存する情報</h3>
      <p>学習の記録（進み具合・問題の正誤・推定スコア・学習時間・表現ノート・キャラクターやニックネームなど）は、お使いのブラウザの中（localStorage・IndexedDB）にだけ保存します。運営者のサーバーには送りません。</p>
      <p>シャドーイングなどで録音した音声は、聞き比べのために端末の中（IndexedDB）にだけ保存します（課題ごとに最初の日と最新の日の2本まで）。運営者のサーバーには送信しません。</p>
      <h3>2. 音声認識について</h3>
      <p>マイクで話した英語を文字にするために、ブラウザに組み込まれた音声認識機能を使います。端末やブラウザによっては、音声がブラウザの提供元（Chrome の場合は Google、Safari の場合は Apple）のサーバーで処理されます。その扱いは各社のプライバシーポリシーに従います。運営者が音声を受け取ることはありません。</p>
      <h3>3. チーム機能を使う場合</h3>
      <p>チームに参加すると、ランキングを表示するために次の情報をサーバー（Netlify）に保存し、同じチームのメンバーに表示します：チームのコード、表示名、キャラクターの種類と育ち具合、直近の1日ごとの学習時間。チームを使わない場合は送信されません。</p>
      <h3>4. Sparkle Plus の事前登録</h3>
      <p>事前登録では、選んだプラン（月額・年額）の件数だけを数えます。名前やメールアドレスなど、個人を特定できる情報は受け取りません。</p>
      <h3>5. Sparkle Plus のお支払い</h3>
      <p>お支払いは決済サービス Stripe（Stripe, Inc. およびそのグループ会社）を通じて行います。カード番号は Stripe の画面に直接入力され、運営者には届きません。メールアドレスなどの決済に必要な情報は Stripe に提供され、運営者は問い合わせ対応と会計に必要な範囲で確認します。購入後に発行される購入コードは、ご契約の状態を確認するために端末に保存し、サーバーとの通信に使います。</p>
      <h3>6. 外部のサービス</h3>
      <p>アプリの配信に Netlify、文字の表示に Google Fonts、画面の動きに cdnjs（Cloudflare）を使っています。読み込みの際、IPアドレスなどの通信情報がこれらの事業者に送られます。広告やアクセス解析のツールは使っていません。</p>
      <h3>7. データを消すには</h3>
      <p>端末の中のデータは、ブラウザの設定でこのサイトのデータを削除すると消えます。チームの情報は、チームを抜けると削除されます。</p>
      <h3>8. 変更とお問い合わせ</h3>
      <p>この内容を変更するときは、本アプリ内でお知らせします。</p>${who}`:`
      <h3>1. 本アプリについて</h3>
      <p>本アプリは英語学習を手助けするためのものです。TOEIC のスコアや英語力の向上を保証するものではありません。アプリ内の「推定スコア」は学習の記録から計算した目安です。</p>
      <h3>2. 商標</h3>
      <p>TOEIC は ETS の登録商標です。本アプリは ETS および国際ビジネスコミュニケーション協会とは関係がなく、承認を受けたものでもありません。問題はすべて本アプリのオリジナルです。</p>
      <h3>3. 会話の練習内容について</h3>
      <p>病院・銀行・契約などの会話は英語の練習用の例です。医療・法律・金融に関する助言ではありません。実際の場面では、専門家や窓口の案内に従ってください。</p>
      <h3>4. 禁止事項</h3>
      <p>サーバーへの不正なアクセスや負荷をかける行為、チーム機能での他人になりすました名前・不快な名前の利用、そのほか運営を妨げる行為を禁止します。</p>
      <h3>5. 有料プラン（Sparkle Plus）</h3>
      <p>料金、お支払いの時期、解約、返金の条件は「特定商取引法に基づく表記」のとおりです。有料プランは解約の手続きをしない限り自動で更新されます。アプリの機能は、改善のために変更することがあります。</p>
      <h3>6. 免責</h3>
      <p>本アプリの利用によって生じた損害について、運営者に故意または重大な過失がある場合を除き、責任を負いません。端末内のデータが失われることがあるため、大切な記録は Profile のバックアップ機能で保存してください。</p>
      <h3>7. 変更</h3>
      <p>本規約は、必要に応じて変更することがあります。変更後に本アプリを使った場合、変更に同意したものとみなします。</p>
      <h3>8. 準拠法</h3>
      <p>本規約は日本法に従って解釈します。</p>${who}`}
      <p class="lg-date">最終更新：${LEGAL.updated}</p></div>`;
  document.getElementById('lg-back').onclick=()=>from==='plus'?openPlus():go('profile');
  el.querySelectorAll('[data-lg]').forEach(b=>b.onclick=()=>legalOpen(b.dataset.lg,from));
  window.scrollTo(0,0);
}
function legalInstall(){
  if(typeof renderProfile!=='function')return;
  const _rp=renderProfile;
  renderProfile=function(){
    const r=_rp.apply(this,arguments);
    const scr=document.getElementById('screen-profile');
    if(scr&&!scr.querySelector('#lg-links')){
      const d=document.createElement('div');d.id='lg-links';d.className='lg-links';
      d.innerHTML='<button data-lg="pp">プライバシーポリシー</button><span>·</span><button data-lg="terms">利用規約</button><span>·</span><button data-lg="tokusho">特商法</button>';
      scr.appendChild(d);d.querySelectorAll('[data-lg]').forEach(b=>b.onclick=()=>legalOpen(b.dataset.lg));
    }
    return r;
  };
}
if(typeof go==='function')legalInstall();
