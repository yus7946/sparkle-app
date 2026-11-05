/* ========== プライバシーポリシーと利用規約 ==========
   公開に必要な表示。実際のデータの流れ（端末内保存・ブラウザの音声認識・チーム機能・Plus 事前登録の件数）に合わせて書く。
   運営者名と連絡先は LEGAL に入れる（決まるまでは「未定」）。
   Profile の一番下に入口を置く。 */
'use strict';

const LEGAL={owner:'未定',contact:'未定',updated:'2026年11月5日'};

function legalOpen(tab){
  const el=document.getElementById('screen-review');
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));el.classList.add('active');
  const pp=tab!=='terms';
  const who=`<p><b>運営者：</b>${LEGAL.owner?esc(LEGAL.owner):'準備中'}<br><b>お問い合わせ：</b>${LEGAL.contact?esc(LEGAL.contact):'準備中'}</p>`;
  el.innerHTML=`<div class="back-row"><button class="icon-btn" id="lg-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>${pp?'プライバシーポリシー':'利用規約'}</h2></div>
    <div class="tk-seg lg-tabs"><button data-lg="pp" class="${pp?'on':''}">プライバシーポリシー</button><button data-lg="terms" class="${pp?'':'on'}">利用規約</button></div>
    <div class="card lg-body">${pp?`
      <p>Sparkle（以下「本アプリ」）は、学習の記録をできるだけお使いの端末の中だけで扱います。どの情報が、どこに送られるかを以下にまとめます。</p>
      <h3>1. 端末の中だけに保存する情報</h3>
      <p>学習の記録（進み具合・問題の正誤・推定スコア・学習時間・表現ノート・キャラクターやニックネームなど）は、お使いのブラウザの中（localStorage・IndexedDB）にだけ保存します。運営者のサーバーには送りません。</p>
      <p>シャドーイングなどで録音した音声は、その場での聞き比べのために端末の中で再生するだけで、保存も送信もしません。</p>
      <h3>2. 音声認識について</h3>
      <p>マイクで話した英語を文字にするために、ブラウザに組み込まれた音声認識機能を使います。端末やブラウザによっては、音声がブラウザの提供元（Chrome の場合は Google、Safari の場合は Apple）のサーバーで処理されます。その扱いは各社のプライバシーポリシーに従います。運営者が音声を受け取ることはありません。</p>
      <h3>3. チーム機能を使う場合</h3>
      <p>チームに参加すると、ランキングを表示するために次の情報をサーバー（Netlify）に保存し、同じチームのメンバーに表示します：チームのコード、表示名、キャラクターの種類と育ち具合、直近の1日ごとの学習時間。チームを使わない場合は送信されません。</p>
      <h3>4. Sparkle Plus の事前登録</h3>
      <p>事前登録では、選んだプラン（月額・年額）の件数だけを数えます。名前やメールアドレスなど、個人を特定できる情報は受け取りません。</p>
      <h3>5. 外部のサービス</h3>
      <p>アプリの配信に Netlify、文字の表示に Google Fonts、画面の動きに cdnjs（Cloudflare）を使っています。読み込みの際、IPアドレスなどの通信情報がこれらの事業者に送られます。広告やアクセス解析のツールは使っていません。</p>
      <h3>6. データを消すには</h3>
      <p>端末の中のデータは、ブラウザの設定でこのサイトのデータを削除すると消えます。チームの情報は、チームを抜けると削除されます。</p>
      <h3>7. 変更とお問い合わせ</h3>
      <p>この内容を変更するときは、本アプリ内でお知らせします。</p>${who}`:`
      <h3>1. 本アプリについて</h3>
      <p>本アプリは英語学習を手助けするためのものです。TOEIC のスコアや英語力の向上を保証するものではありません。アプリ内の「推定スコア」は学習の記録から計算した目安です。</p>
      <h3>2. 商標</h3>
      <p>TOEIC は ETS の登録商標です。本アプリは ETS および国際ビジネスコミュニケーション協会とは関係がなく、承認を受けたものでもありません。問題はすべて本アプリのオリジナルです。</p>
      <h3>3. 会話の練習内容について</h3>
      <p>病院・銀行・契約などの会話は英語の練習用の例です。医療・法律・金融に関する助言ではありません。実際の場面では、専門家や窓口の案内に従ってください。</p>
      <h3>4. 禁止事項</h3>
      <p>サーバーへの不正なアクセスや負荷をかける行為、チーム機能での他人になりすました名前・不快な名前の利用、そのほか運営を妨げる行為を禁止します。</p>
      <h3>5. 免責</h3>
      <p>本アプリの利用によって生じた損害について、運営者に故意または重大な過失がある場合を除き、責任を負いません。端末内のデータが失われることがあるため、大切な記録は Profile のバックアップ機能で保存してください。</p>
      <h3>6. 変更</h3>
      <p>本規約は、必要に応じて変更することがあります。変更後に本アプリを使った場合、変更に同意したものとみなします。</p>
      <h3>7. 準拠法</h3>
      <p>本規約は日本法に従って解釈します。</p>${who}`}
      <p class="lg-date">最終更新：${LEGAL.updated}</p></div>`;
  document.getElementById('lg-back').onclick=()=>go('profile');
  el.querySelectorAll('[data-lg]').forEach(b=>b.onclick=()=>legalOpen(b.dataset.lg));
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
      d.innerHTML='<button data-lg="pp">プライバシーポリシー</button><span>·</span><button data-lg="terms">利用規約</button>';
      scr.appendChild(d);d.querySelectorAll('[data-lg]').forEach(b=>b.onclick=()=>legalOpen(b.dataset.lg));
    }
    return r;
  };
}
if(typeof go==='function')legalInstall();
