// Sparkle チーム機能のサーバー処理（Netlify Functions ＋ Netlify Blobs。無料枠で動く）
// POST /api/team {action, code, member, ...}
//   create: チームを作る（name）  join: 参加  sync: 自分の記録を更新して最新のボードを受け取る
//   cheer: 仲間に応援を送る（to）  leave: 抜ける
// GET /api/team?code=XXXXXX でボードを見る（招待コードが合言葉）
// 各メンバーは端末で作った秘密の key を持ち、他人が自分の記録を書き換えられないようにする
import { getStore } from '@netlify/blobs';

const SPECIES = ['sky', 'leaf', 'flame', 'aqua', 'moon', 'sakura', 'bolt', 'prism', 'cosmo'];
const ITEMS = { head: ['ribbon', 'straw', 'beret', 'phones', 'crown', 'gradcap'], face: ['starcheek', 'roundglasses', 'sunglasses'], neck: ['bowtie', 'scarf', 'lei', 'medal'] };
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_MEMBERS = 20;

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const genCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => CODE_ABC[b % 32]).join('');
const num = (x, a, b) => { x = Math.round(+x); return Number.isFinite(x) ? Math.max(a, Math.min(b, x)) : a; };
const txt = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const ymdOk = s => /^\d{4}-\d{2}-\d{2}$/.test(s);
const codeOk = c => /^[A-Z2-9]{6}$/.test(c);

function cleanMember(m) {
  if (!m || typeof m !== 'object') return null;
  const id = String(m.id || ''), key = String(m.key || '');
  if (!/^[a-z0-9]{6,16}$/.test(id) || !/^[a-z0-9]{16,40}$/.test(key)) return null;
  const w = {};
  if (m.w && typeof m.w === 'object') for (const k of Object.keys(ITEMS)) if (ITEMS[k].includes(m.w[k])) w[k] = m.w[k];
  const days = {};
  if (m.days && typeof m.days === 'object') Object.keys(m.days).filter(ymdOk).sort().slice(-21).forEach(d => { days[d] = num(m.days[d], 0, 1440); });
  return { id, key, n: txt(m.n, 12) || 'なかま', s: SPECIES.includes(m.s) ? m.s : '', g: num(m.g, 1, 6), w, e: num(m.e, 0, 990), k: num(m.k, 0, 9999), days };
}
const pub = (t, me) => ({
  code: t.code, name: t.name, created: t.created,
  members: Object.values(t.members).map(({ key, ...m }) => m),
  feed: t.feed.slice(-40),
  inbox: me ? (t.cheers[me] || []) : []
});
const addFeed = (t, e) => { t.feed.push({ t: Date.now(), ...e }); if (t.feed.length > 60) t.feed = t.feed.slice(-60); };

export default async (req) => {
  const store = getStore({ name: 'teams', consistency: 'strong' });
  if (req.method === 'GET') {
    const code = new URL(req.url).searchParams.get('code') || '';
    if (!codeOk(code)) return json({ error: 'bad_code' }, 400);
    const t = await store.get(code, { type: 'json' });
    return t ? json(pub(t)) : json({ error: 'not_found' }, 404);
  }
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const raw = await req.text();
  if (raw.length > 8000) return json({ error: 'too_large' }, 413);
  let body; try { body = JSON.parse(raw); } catch { return json({ error: 'bad_json' }, 400); }
  const m = cleanMember(body.member);
  if (!m) return json({ error: 'bad_member' }, 400);

  if (body.action === 'create') {
    let code = genCode();
    for (let i = 0; i < 5 && await store.get(code); i++) code = genCode();
    const t = { code, name: txt(body.name, 16) || 'チーム', created: Date.now(), members: { [m.id]: { ...m, joined: Date.now(), t: Date.now() } }, feed: [], cheers: {} };
    addFeed(t, { type: 'join', who: m.n });
    await store.setJSON(code, t);
    return json(pub(t, m.id));
  }

  const code = String(body.code || '');
  if (!codeOk(code)) return json({ error: 'bad_code' }, 400);
  const t = await store.get(code, { type: 'json' });
  if (!t) return json({ error: 'not_found' }, 404);
  const cur = t.members[m.id];
  if (cur && cur.key !== m.key) return json({ error: 'forbidden' }, 403);

  if (body.action === 'join' || body.action === 'sync') {
    if (!cur && body.action === 'sync') return json({ error: 'not_member' }, 403);
    if (!cur && Object.keys(t.members).length >= MAX_MEMBERS) return json({ error: 'full' }, 409);
    t.members[m.id] = { ...(cur || { joined: Date.now() }), ...m, t: Date.now() };
    if (!cur) addFeed(t, { type: 'join', who: m.n });
    // 出来事（今日の目標クリアなど）は1人1日1回だけフィードに流す
    const ev = String(body.ev || ''), day = ymdOk(body.day) ? body.day : '';
    if (['goal', 'hatch', 'evolve'].includes(ev) && day && !t.feed.some(f => f.type === ev && f.id === m.id && f.day === day)) addFeed(t, { type: ev, who: m.n, id: m.id, day });
    const inbox = t.cheers[m.id] || [];
    t.cheers[m.id] = [];
    await store.setJSON(code, t);
    return json({ ...pub(t), inbox });
  }
  if (body.action === 'cheer') {
    if (!cur) return json({ error: 'not_member' }, 403);
    const to = String(body.to || '');
    if (!t.members[to] || to === m.id) return json({ error: 'bad_to' }, 400);
    const box = t.cheers[to] = (t.cheers[to] || []);
    if (box.filter(c => c.id === m.id && Date.now() - c.t < 3600e3).length) return json({ ok: true, dup: true });
    box.push({ id: m.id, n: m.n, t: Date.now() });
    t.cheers[to] = box.slice(-20);
    addFeed(t, { type: 'cheer', who: m.n, to: t.members[to].n });
    await store.setJSON(code, t);
    return json({ ok: true });
  }
  if (body.action === 'leave') {
    if (!cur) return json({ ok: true });
    delete t.members[m.id]; delete t.cheers[m.id];
    addFeed(t, { type: 'leave', who: m.n });
    if (Object.keys(t.members).length) await store.setJSON(code, t); else await store.delete(code);
    return json({ ok: true });
  }
  return json({ error: 'bad_action' }, 400);
};

export const config = { path: '/api/team' };
