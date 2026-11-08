// Sparkle Plus の決済（Stripe）。POST /api/plus {a:'config'|'checkout'|'verify'|'status'|'portal', ...}
// ・必要な設定は Netlify の環境変数 STRIPE_SECRET_KEY だけ（sk_test_… でテスト、sk_live_… で本番）
// ・カード情報は Stripe の決済画面で入力され、このサーバーには届かない
// ・アプリにログインがないので、購入すると「購入コード」（サブスクIDの署名付き）を発行する。
//   状態は毎回 Stripe に問い合わせるので、解約・支払い失敗も自動で反映される。Webhook は不要
// ・料金はここで決める（ブラウザから金額を受け取らない）
import { getStore } from '@netlify/blobs';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const PRICES = {
  m: { amount: 980, interval: 'month', name: 'Sparkle Plus（月額）', label: '月額980円（税込）' },
  y: { amount: 7800, interval: 'year', name: 'Sparkle Plus（年額）', label: '年額7,800円（税込）' }
};
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const fail = (error, status = 400) => ({ __status: status, error });

const sign = (id, secret) => createHmac('sha256', secret).update(id).digest('base64url').slice(0, 24);
export const makeLicense = (id, secret) => `${id}.${sign(id, secret)}`;
export function readLicense(lic, secret) {
  const m = /^(sub_[A-Za-z0-9]+)\.([A-Za-z0-9_-]{24})$/.exec(String(lic || '').trim());
  if (!m) return null;
  const a = Buffer.from(m[2]), b = Buffer.from(sign(m[1], secret));
  return a.length === b.length && timingSafeEqual(a, b) ? m[1] : null;
}
const jstDate = (sec) => new Date(sec * 1000 + 9 * 3600e3).toISOString().slice(0, 10);
export function subState(sub) {
  const item = sub.items && sub.items.data && sub.items.data[0];
  // Stripe の API バージョンによって、更新日の場所が違う
  const end = sub.current_period_end || (item && item.current_period_end) || 0;
  const interval = item && item.price && item.price.recurring && item.price.recurring.interval;
  return {
    active: ['active', 'trialing', 'past_due'].includes(sub.status),
    status: sub.status,
    until: end ? jstDate(end) : '',
    plan: interval === 'year' ? 'y' : 'm',
    cancel: !!(sub.cancel_at_period_end || sub.cancel_at)
  };
}

// a＝操作、deps＝{key, origin, stripe, secret}（テストで差し替えられるように分けている）
export async function handle(body, deps) {
  const { a } = body || {};
  const { key, origin, stripe, secret } = deps;
  if (a === 'config') return { enabled: !!key, mode: /^[sr]k_live_/.test(key || '') ? 'live' : 'test' };
  if (!key) return fail('not_configured', 503);

  if (a === 'checkout') {
    const p = PRICES[body.plan];
    if (!p) return fail('bad_plan');
    const s = await stripe('POST', '/v1/checkout/sessions', {
      mode: 'subscription', locale: 'ja',
      'payment_method_types[0]': 'card',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'jpy',
      'line_items[0][price_data][unit_amount]': String(p.amount),
      'line_items[0][price_data][recurring][interval]': p.interval,
      'line_items[0][price_data][product_data][name]': p.name,
      'custom_text[submit][message]': `${p.label}の自動更新です。アプリの Plus 画面からいつでも解約でき、解約後も次回更新日まで使えます。`,
      'subscription_data[metadata][app]': 'sparkle',
      success_url: `${origin}/?plus=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?plus=cancel`
    });
    return { url: s.url, sid: s.id };
  }
  if (a === 'verify') {
    if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(String(body.sid || ''))) return fail('bad_session');
    const s = await stripe('GET', `/v1/checkout/sessions/${body.sid}?expand[]=subscription`);
    const paid = s.mode === 'subscription' && s.status === 'complete' && s.subscription && typeof s.subscription === 'object';
    if (!paid) return { pending: true, expired: s.status === 'expired' };
    return { license: makeLicense(s.subscription.id, await secret()), ...subState(s.subscription) };
  }
  if (a === 'status' || a === 'portal') {
    const id = readLicense(body.license, await secret());
    if (!id) return fail('bad_license');
    const sub = await stripe('GET', `/v1/subscriptions/${id}`);
    if (a === 'status') return subState(sub);
    const p = await stripe('POST', '/v1/billing_portal/sessions', { customer: sub.customer, return_url: `${origin}/?plus=portal` });
    return { url: p.url };
  }
  return fail('bad_action');
}

async function stripeCall(key, method, path, params) {
  const res = await fetch('https://api.stripe.com' + path, {
    method,
    headers: { authorization: `Bearer ${key}`, ...(params ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
    body: params ? new URLSearchParams(params).toString() : undefined
  });
  const data = await res.json();
  if (!res.ok) { const e = new Error('stripe'); e.status = res.status; e.code = data.error && (data.error.code || data.error.type); throw e; }
  return data;
}
// 購入コードの署名に使う秘密の値。最初の1回だけ作って Blobs に保存する（設定の手間を増やさない）
async function licenseSecret() {
  const store = getStore({ name: 'plus', consistency: 'strong' });
  let s = await store.get('license_secret');
  if (!s) { await store.set('license_secret', randomBytes(32).toString('hex')); s = await store.get('license_secret'); }
  return s;
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const raw = await req.text();
  if (raw.length > 2000) return json({ error: 'too_large' }, 413);
  let body; try { body = JSON.parse(raw); } catch { return json({ error: 'bad_json' }, 400); }
  const key = process.env.STRIPE_SECRET_KEY || '';
  try {
    const r = await handle(body, { key, origin: new URL(req.url).origin, stripe: (m, p, q) => stripeCall(key, m, p, q), secret: licenseSecret });
    const { __status, ...out } = r;
    return json(out, __status || 200);
  } catch (e) {
    console.error('plus', e.status, e.code || e.message);
    if (e.status === 404) return json({ error: 'not_found' }, 404);
    return json({ error: 'stripe', code: e.code || '' }, 502);
  }
};

export const config = { path: '/api/plus' };
