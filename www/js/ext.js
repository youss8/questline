(function (Q) {
  'use strict';
  // Core for the Body / Life / Grow sections: extra state, shared UI helpers, routing, XP and reminders.
  const { esc, ic } = Q;
  Q.VIEWS = {}; Q.ACTS = {};
  Q.extView = t => (Q.VIEWS[t] ? Q.VIEWS[t]() : null);
  Q.extAct = (a, el) => { const f = Q.ACTS[a]; if (f) f(el); };

  const X0 = () => ({
    diary: {}, myFoods: [], saved: [], recipes: [], measures: [],
    train: { prog: 'home', next: 0, logs: [], active: null },
    mob: { logs: [] },
    tasks: [], events: [],
    money: { tx: [], budgets: {}, rate: 13000, show: 'USD', salary: null },
    subs: [],
    de: { srs: {}, lessons: { done: 0, course: 'A1.1', left: 3 }, seen: 0 },
    career: { done: {} }, qfav: [], tabs: {}
  });
  const ensure = d => {
    const f = X0(); d.x = d.x || {};
    for (const k in f) if (d.x[k] == null) d.x[k] = f[k];
    for (const k of ['train', 'money', 'de', 'mob', 'career']) d.x[k] = { ...f[k], ...d.x[k] };
    return d;
  };
  const norm = Q.normalize;
  Q.normalize = d => ensure(norm(d));
  ensure(Q.S);
  Q.X = () => Q.S.x;

  // ---------- UI helpers ----------
  Q.ring = (p, o) => {
    o = o || {}; const sz = o.size || 120, sw = o.stroke || 10, r = (100 - sw) / 2, C = 2 * Math.PI * r;
    const v = Math.max(0, Math.min(1, p)), id = 'g' + Q.hash(String(Math.random())).toString(36);
    return `<div class="ring" style="--sz:${sz}px"><svg viewBox="0 0 100 100"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.c1 || '#8b7cff'}"/><stop offset="1" stop-color="${o.c2 || '#22d3ee'}"/></linearGradient></defs>
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="${sw}"/>
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="${o.over ? '#fb7185' : `url(#${id})`}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - v)).toFixed(1)}"/></svg>
      <div class="rv"><b>${o.label != null ? o.label : Math.round(v * 100) + '%'}</b>${o.sub ? `<small>${o.sub}</small>` : ''}</div></div>`;
  };
  Q.tabsBar = (key, list, cur) => `<div class="tabs">${list.map(([v, l, icn]) => `<button class="${v === cur ? 'on' : ''}" data-act="xtab" data-k="${key}" data-v="${v}">${icn ? ic(icn) : ''}${l}</button>`).join('')}</div>`;
  Q.tabOf = (key, def) => Q.X().tabs[key] || def;
  Q.ACTS.xtab = el => { Q.X().tabs[el.dataset.k] = el.dataset.v; Q.save(); Q.render(); window.scrollTo(0, 0); };
  Q.spark = (vals, o) => {
    o = o || {}; if (vals.length < 2) return '<p class="empty">Log at least two entries to see the trend.</p>';
    const w = 320, h = o.h || 80, mn = Math.min(...vals), mx = Math.max(...vals), rg = mx - mn || 1;
    const pts = vals.map((v, i) => [i / (vals.length - 1) * w, h - 8 - (v - mn) / rg * (h - 16)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px" preserveAspectRatio="none"><defs><linearGradient id="sp" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8b7cff" stop-opacity=".35"/><stop offset="1" stop-color="#8b7cff" stop-opacity="0"/></linearGradient></defs>
      <path d="${d} L${w} ${h} L0 ${h} Z" fill="url(#sp)"/><path d="${d}" fill="none" stroke="#a78bfa" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      <circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="4" fill="#22d3ee"/></svg>`;
  };
  Q.head = (title, sub) => `<h1 class="pt">${title}</h1>${sub ? `<p class="pt-sub muted">${sub}</p>` : ''}`;
  Q.li = (o) => `<div class="li" ${o.act ? `data-act="${o.act}"` : ''} ${o.id ? `data-id="${esc(o.id)}"` : ''} ${o.attrs || ''}>
    ${o.cb != null ? `<button class="cb ${o.cb ? 'on' : ''}" data-act="${o.cbAct}" data-id="${esc(o.id)}">${o.cb ? ic('check') : ''}</button>` : ''}
    ${o.icon ? `<div class="dot" style="--dc:${o.color || '#a78bfa'}">${ic(o.icon)}</div>` : ''}
    <div class="li-m"><b>${o.title}</b>${o.sub ? `<small>${o.sub}</small>` : ''}</div>${o.right != null ? `<div class="li-r">${o.right}</div>` : ''}</div>`;
  Q.field = (label, inner) => `<div class="field"><label>${label}</label>${inner}</div>`;
  Q.opts = (list, cur) => list.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(l)}</option>`; }).join('');
  Q.nowHM = () => { const n = Q._now(); return Q.pad(n.getHours()) + ':' + Q.pad(n.getMinutes()); };
  Q.celebrate = (el, txt) => { try { if (el) { Q.burstAt(el, { n: 16 }); if (txt) Q.floatText(el, txt); } Q.sfx('tick'); Q.buzz(15); } catch (e) { /* fx optional */ } };

  // ---------- XP from the new sections ----------
  Q.extXp = () => {
    const x = Q.X(), out = { str: 0, vit: 0, wis: 0, foc: 0, wea: 0, dis: 0 };
    out.str += x.train.logs.length * 30;
    out.vit += x.mob.logs.length * 12;
    out.vit += Object.keys(x.diary).filter(d => (x.diary[d] || []).length).length * 5;
    out.vit += x.measures.length * 5;
    out.foc += x.tasks.filter(t => t.done).length * 10;
    out.wis += Math.min(5000, x.de.seen || 0);
    out.wis += x.de.lessons.done * 40;
    out.wea += Object.keys(x.career.done).length * 25;
    out.wea += x.money.tx.length * 2;
    return out;
  };

  // ---------- recurrence ----------
  // next occurrence on/after `from` for a date with repeat: none|daily|weekly|monthly|yearly
  Q.nextOcc = (date, repeat, from) => {
    if (!repeat || repeat === 'none') return date >= from ? date : null;
    let d = date;
    if (d >= from) return d;
    if (repeat === 'daily') return from;
    if (repeat === 'weekly') { const n = Math.ceil(Q.diffDays(from, d) / 7); return Q.addDays(d, n * 7); }
    const p = Q.parse(d), f = Q.parse(from);
    const make = (y, m) => { const last = new Date(y, m + 1, 0).getDate(); return Q.ymd(new Date(y, m, Math.min(p.getDate(), last))); };
    if (repeat === 'monthly') { let y = f.getFullYear(), m = f.getMonth(); let c = make(y, m); if (c < from) c = make(m === 11 ? y + 1 : y, (m + 1) % 12); return c; }
    if (repeat === 'yearly') { let c = make(f.getFullYear(), p.getMonth()); if (c < from) c = make(f.getFullYear() + 1, p.getMonth()); return c; }
    return null;
  };
  Q.daysUntil = d => Q.diffDays(d, Q.today());
  Q.whenLabel = d => { const n = Q.daysUntil(d); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n < 0 ? `${-n}d ago` : n < 7 ? Q.niceDate(d, { weekday: 'long' }) : Q.niceDate(d, { day: 'numeric', month: 'short' }) + ` · in ${n}d`; };

  // ---------- reminders for events, tasks and subscriptions ----------
  const baseBuild = Q.buildNotifications;
  Q.buildNotifications = () => {
    const out = baseBuild();
    const s = Q.S.settings; if (!s.remindersOn) return out;
    const x = Q.X(), now = Q._now(), t = Q.today(), horizon = Q.addDays(t, 14);
    const at = (d, hm) => { const z = Q.parse(d); const m = Q.toMin(hm || '09:00'); z.setHours(Math.floor(m / 60), m % 60, 0, 0); return z; };
    const nid = (k) => 200000 + (Q.hash(k) % 1800000);
    const push = (k, title, body, when) => { if (when > now) out.push({ id: nid(k), title, body, at: when }); };
    for (const e of x.events) {
      const d = Q.nextOcc(e.date, e.repeat, t); if (!d || d > horizon) continue;
      const when = at(d, e.time || '09:00');
      push(e.id + d + 'a', `Tomorrow: ${e.title}`, e.time ? `At ${e.time}` : 'All day', new Date(when.getTime() - 864e5));
      push(e.id + d + 'b', `${e.title} ${e.time ? 'in 2 hours' : 'today'}`, e.note || (e.time ? `At ${e.time}` : 'Today'), e.time ? new Date(when.getTime() - 2 * 36e5) : at(d, '08:30'));
    }
    for (const k of x.tasks) {
      if (k.done || !k.due || k.due > horizon) continue;
      const when = at(k.due, k.time || '10:00');
      push(k.id + 'a', `Due tomorrow: ${k.t}`, k.area || 'Task', new Date(when.getTime() - 864e5));
      push(k.id + 'b', `Due ${k.time ? 'in 2 hours' : 'today'}: ${k.t}`, k.area || 'Task', k.time ? new Date(when.getTime() - 2 * 36e5) : at(k.due, '09:00'));
    }
    for (const sub of x.subs) {
      if (!sub.next || sub.next > horizon) continue;
      push(sub.id + sub.next + 'a', `${sub.name} renews tomorrow`, `${sub.amt} ${sub.cur}`, at(Q.addDays(sub.next, -1), '19:00'));
      push(sub.id + sub.next + 'b', `${sub.name} renews today`, `${sub.amt} ${sub.cur}. Tap to mark paid.`, at(sub.next, '10:00'));
    }
    const sal = x.money.salary;
    if (sal && sal.day) {
      const p = Q.parse(t), d = Q.nextOcc(Q.ymd(new Date(p.getFullYear(), p.getMonth(), sal.day)), 'monthly', t);
      if (d && d <= horizon) push('sal' + d, 'Payday 💰', 'Log your salary and set this month\'s budget.', at(d, '18:00'));
    }
    return out.sort((a, b) => a.at - b.at).slice(0, 400);
  };

  // ---------- Today summary card ----------
  Q.todayExtra = () => {
    const x = Q.X(), t = Q.today(), parts = [];
    const tasks = x.tasks.filter(k => !k.done && k.due && k.due <= t);
    const evs = x.events.map(e => ({ e, d: Q.nextOcc(e.date, e.repeat, t) })).filter(o => o.d && Q.diffDays(o.d, t) <= 1).sort((a, b) => a.d.localeCompare(b.d));
    const subs = x.subs.filter(s => s.next && Q.diffDays(s.next, t) <= 2);
    const cal = Q.calToday ? Q.calToday() : null;
    let html = '';
    if (cal) html += `<div class="li" data-act="tab" data-tab="body">${Q.ring(cal.eaten / Math.max(1, cal.target), { size: 54, stroke: 12, label: '', over: cal.eaten > cal.target })}<div class="li-m"><b>${Math.max(0, cal.target - cal.eaten)} kcal left</b><small>${cal.eaten} eaten · protein ${cal.p}/${cal.pt} g</small></div>${ic('chevron-right', 'chev')}</div>`;
    const nt = Q.nextWorkout ? Q.nextWorkout() : null;
    if (nt) html += Q.li({ icon: 'dumbbell', color: '#22d3ee', title: nt, sub: 'Next workout', act: 'tab', attrs: 'data-tab="body"', right: ic('chevron-right', 'chev') });
    for (const e of (Q.phoneToday ? Q.phoneToday() : [])) parts.push(Q.li({ icon: 'calendar', color: '#38bdf8', title: esc(e.title), sub: `Calendar${e.time ? ' · ' + e.time : ' · all day'}` }));
    for (const o of evs) parts.push(Q.li({ icon: 'calendar-check', color: '#f472b6', title: esc(o.e.title), sub: `${Q.whenLabel(o.d)}${o.e.time ? ' · ' + o.e.time : ''}` }));
    for (const k of tasks.slice(0, 5)) parts.push(Q.li({ cb: false, cbAct: 'task-done', id: k.id, title: esc(k.t), sub: `${esc(k.area || '')}${k.due < t ? ' · overdue' : ''}${k.time ? ' · ' + k.time : ''}` }));
    for (const s of subs) parts.push(Q.li({ icon: 'receipt', color: '#fbbf24', title: `${esc(s.name)} renews ${Q.whenLabel(s.next).toLowerCase()}`, sub: `${s.amt} ${s.cur}` }));
    const manage = `<button class="btn ghost wide" data-act="tab" data-tab="quests">${ic('scroll-text')} Manage habits & side quests</button>`;
    if (!html && !parts.length) return manage;
    return `<div class="sec"><span>Also today</span></div><section class="card">${html}${parts.join('')}</section>${manage}`;
  };
})(window.Q);
