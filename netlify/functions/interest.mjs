// Sparkle Plus の事前登録（正式版の需要を数えるだけ。個人情報は受け取らない）
// POST /api/interest {plan:'m'|'y'}   GET /api/interest で合計を見る
import { getStore } from '@netlify/blobs';

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export default async (req) => {
  const store = getStore({ name: 'metrics', consistency: 'strong' });
  const cur = (await store.get('plus_interest', { type: 'json' })) || { m: 0, y: 0, total: 0, daily: {} };
  if (req.method === 'GET') return json({ m: cur.m, y: cur.y, total: cur.total });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const raw = await req.text();
  if (raw.length > 200) return json({ error: 'too_large' }, 413);
  let plan = '';
  try { plan = JSON.parse(raw).plan; } catch { return json({ error: 'bad_json' }, 400); }
  if (plan !== 'm' && plan !== 'y') return json({ error: 'bad_plan' }, 400);
  const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  cur[plan]++; cur.total++;
  cur.daily[day] = (cur.daily[day] || 0) + 1;
  cur.daily = Object.fromEntries(Object.entries(cur.daily).sort().slice(-60));
  await store.setJSON('plus_interest', cur);
  return json({ ok: true });
};

export const config = { path: '/api/interest' };
