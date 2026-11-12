(function (E) {
  'use strict';
  const S = () => E.S;

  // ================= habits =================
  E.started = d => d >= S().profile.start;
  E.wakeOf = d => E.isWeekend(d) ? S().profile.wake.we : S().profile.wake.wd;
  // bedtime belongs to the night after day d: Friday and Saturday nights are weekend nights
  E.sleepOf = d => { const w = E.dow(d); return (w === 5 || w === 6) ? S().profile.sleep.we : S().profile.sleep.wd; };
  E.hTime = (h, d) => {
    if (h.time === 'wake') return E.min(E.wakeOf(d));
    if (h.time === 'wake+5') return E.min(E.wakeOf(d)) + 5;
    if (h.time === 'sleep') { const m = E.min(E.sleepOf(d)); return m < 360 ? m + 1440 : m; }
    if (h.time === 'all' || !h.time) return null;
    const m = E.min(h.time); return m < 360 ? m + 1440 : m;
  };
  E.hName = (h, d) => {
    if (h.id === 'wake') return `Get up at ${E.time12(E.wakeOf(d))}`;
    if (h.id === 'sleep') return `Lights out by ${E.time12(E.sleepOf(d))}`;
    if (h.type === 'count') return `${h.name} · ${E.n(h.target)} ${h.unit}`;
    return h.dur ? `${h.name} · ${h.dur} min` : h.name;
  };
  E.dueOn = (h, d) => !h.off && h.days.includes(E.dow(d)) && (!h.since || d >= h.since);
  E.log = (d, id) => (S().logs[d] || {})[id];
  E.setLog = (d, id, v) => { const L = S().logs[d] || (S().logs[d] = {}); if (v == null || v === 0 || v === false) delete L[id]; else L[id] = v; if (!Object.keys(L).length) delete S().logs[d]; };
  // state: 'done' | 'mini' | 'part' | 'none'
  E.hState = (h, d) => {
    const v = E.log(d, h.id);
    if (v === 'mini') return 'mini';
    if (h.type === 'count') { const n = typeof v === 'number' ? v : 0; return n >= h.target ? 'done' : n > 0 ? 'part' : 'none'; }
    return v === true ? 'done' : 'none';
  };
  E.dayHabits = d => S().habits.filter(h => E.dueOn(h, d)).sort((a, b) => (E.hTime(a, d) == null ? 9999 : E.hTime(a, d)) - (E.hTime(b, d) == null ? 9999 : E.hTime(b, d)));
  E.dayScore = d => {
    const hs = E.dayHabits(d); if (!hs.length) return { due: 0, done: 0, mini: 0, p: 0 };
    let done = 0, mini = 0;
    for (const h of hs) { const s = E.hState(h, d); if (s === 'done') done++; else if (s === 'mini') mini++; }
    return { due: hs.length, done, mini, p: (done + mini) / hs.length };
  };
  E.KEEP = 0.6; // keep the ember lit: 60% of today's habits, small versions count

  // ================= the ember =================
  // A kept day adds fuel. One missed day dims it. Two missed days in a row put it out.
  E.ember = () => {
    const key = 'em' + E.ver + E.today();
    if (E._em && E._em.k === key) return E._em.v;
    const start = S().profile.start, t = E.today(), days = {};
    let streak = 0, best = 0, missRun = 0, total = 0;
    for (let d = start; d <= t; d = E.add(d, 1)) {
      const sc = E.dayScore(d), kept = sc.due > 0 && sc.p >= E.KEEP;
      if (d === t && !kept) { days[d] = 'open'; break; }
      if (kept || sc.due === 0) { streak++; total += kept ? 1 : 0; missRun = 0; days[d] = kept ? 'kept' : 'rest'; }
      else { missRun++; days[d] = missRun >= 2 ? 'out' : 'dim'; if (missRun >= 2) streak = 0; }
      best = Math.max(best, streak);
    }
    const yesterday = days[E.add(t, -1)];
    const v = { streak, best, total, days, dimmed: yesterday === 'dim', out: yesterday === 'out' || (streak === 0 && start < t) };
    E._em = { k: key, v };
    return v;
  };
  E.emberStage = n => n >= 66 ? 5 : n >= 30 ? 4 : n >= 14 ? 3 : n >= 7 ? 2 : n >= 1 ? 1 : 0;
  E.STAGES = ['Ready to light', 'A spark', 'A small flame', 'A steady fire', 'A strong fire', 'A bonfire'];

  // ================= food =================
  E.foods = () => {
    const ex = new Set(S().food.exclude || []), out = {};
    for (const k in E.FOODS) if (!ex.has(k)) out[k] = E.FOODS[k];
    return out;
  };
  E.weightNow = () => { const w = S().weights.slice().sort((a, b) => a.d.localeCompare(b.d)); return w.length ? w[w.length - 1].kg : 105; };
  E.targets = () => {
    const p = S().profile, kg = E.weightNow();
    const bmr = 10 * kg + 6.25 * p.height - 5 * p.age + 5, tdee = bmr * (p.activity || 1.4);
    const kcal = Math.round(Math.max(1700, tdee - 850) / 10) * 10;
    const ref = Math.min(kg, 27 * (p.height / 100) ** 2), pr = Math.round(ref * 2), f = Math.round(ref * 0.8), c = Math.max(80, Math.round((kcal - pr * 4 - f * 9) / 4));
    return { kcal, p: pr, c, f, tdee: Math.round(tdee), weekly: Math.round((tdee - kcal) * 7 / 7700 * 10) / 10, bmi: Math.round(kg / (p.height / 100) ** 2 * 10) / 10, water: 8 };
  };
  E.foodById = id => {
    const F = S().food;
    if (id.startsWith('my:')) { const f = F.myFoods.find(m => 'my:' + m.id === id); return f && { n: f.n, k: f.k, p: f.p, c: f.c, f: f.f, unit: f.unit ? [f.unit, f.uname || 'portion', f.uname || 'portions'] : null, cat: 'My foods' }; }
    if (id.startsWith('rc:')) { const r = F.recipes.find(m => 'rc:' + m.id === id); if (!r) return null; const t = E.recipeTotals(r); return { n: r.n, k: t.k / t.g * 100, p: t.p / t.g * 100, c: t.c / t.g * 100, f: t.f / t.g * 100, unit: [t.g / Math.max(1, r.portions), 'portion', 'portions'], cat: 'My recipes' }; }
    return E.FOODS[id];
  };
  E.recipeTotals = r => r.items.reduce((a, it) => { const f = E.FOODS[it.id] || { k: 0, p: 0, c: 0, f: 0 }, m = it.g / 100; return { g: a.g + it.g, k: a.k + f.k * m, p: a.p + f.p * m, c: a.c + f.c * m, f: a.f + f.f * m }; }, { g: 0, k: 0, p: 0, c: 0, f: 0 });
  E.entryM = e => { if (e.q) return { k: e.k || 0, p: e.p || 0, c: 0, f: 0 }; const f = E.foodById(e.id); if (!f) return { k: 0, p: 0, c: 0, f: 0 }; const m = e.g / 100; return { k: f.k * m, p: f.p * m, c: f.c * m, f: f.f * m }; };
  E.dayFood = d => {
    const es = S().food.diary[d] || [], t = { k: 0, p: 0, c: 0, f: 0 };
    for (const e of es) { const m = E.entryM(e); t.k += m.k; t.p += m.p; t.c += m.c; t.f += m.f; }
    for (const k in t) t[k] = Math.round(t[k]);
    return t;
  };

  // ================= money =================
  E.CATS = [
    { id: 'food', n: 'Food & groceries', icon: 'shopping-basket', c: '#c9a46a', subs: ['Groceries', 'Restaurants', 'Fast food', 'Coffee & drinks', 'Delivery', 'Sweets & snacks'] },
    { id: 'transport', n: 'Car & transport', icon: 'car', c: '#8aa2b4', subs: ['Fuel', 'Taxi', 'Car service', 'Parking', 'Bus'] },
    { id: 'home', n: 'Home & bills', icon: 'house', c: '#a893b0', subs: ['Rent', 'Electricity', 'Water', 'Internet', 'Heating / mazout', 'Gas', 'Home things'] },
    { id: 'phone', n: 'Phone & subscriptions', icon: 'smartphone', c: '#7fa3a0', subs: ['Mobile credit', 'Apps & AI', 'Hosting & domains', 'Streaming'] },
    { id: 'baby', n: 'Baby', icon: 'baby', c: '#d6b07c', subs: ['Diapers', 'Milk & food', 'Clothes', 'Doctor & medicine', 'Toys'] },
    { id: 'love', n: 'Miryam & dates', icon: 'heart', c: '#cf8f86', subs: ['Dates & outings', 'Gifts', 'Flowers', 'Surprises'] },
    { id: 'family', n: 'Family & gifts', icon: 'gift', c: '#c48a6a', subs: ['Family support', 'Gifts', 'Occasions'] },
    { id: 'health', n: 'Health', icon: 'stethoscope', c: '#93ab8c', subs: ['Pharmacy', 'Doctor', 'Tests', 'Sport'] },
    { id: 'personal', n: 'Personal & clothes', icon: 'shirt', c: '#b49a7a', subs: ['Clothes', 'Shoes', 'Haircut', 'Personal care'] },
    { id: 'learn', n: 'Learning & career', icon: 'graduation-cap', c: '#8c9ec9', subs: ['German course', 'Online courses', 'Books', 'Exams & certificates'] },
    { id: 'work', n: 'Work & tools', icon: 'laptop', c: '#9aa5a8', subs: ['Devices', 'Software', 'Office'] },
    { id: 'fun', n: 'Fun & going out', icon: 'popcorn', c: '#c7a0b5', subs: ['Outings', 'Games', 'Events'] },
    { id: 'church', n: 'Church & giving', icon: 'hand-heart', c: '#b5a77c', subs: ['Church', 'Charity', 'Scouts'] },
    { id: 'other', n: 'Other', icon: 'more-horizontal', c: '#8f887c', subs: ['Fees', 'Lost', 'Other'] }
  ];
  E.INCS = [{ id: 'salary', n: 'Salary', icon: 'landmark' }, { id: 'freelance', n: 'Freelance', icon: 'laptop' }, { id: 'resale', n: 'Resale', icon: 'package' }, { id: 'gift', n: 'Gift', icon: 'gift' }, { id: 'other', n: 'Other income', icon: 'coins' }];
  E.cat = id => E.CATS.find(c => c.id === id) || E.CATS[E.CATS.length - 1];
  E.conv = (amt, cur) => { const m = S().money, r = m.rate || 1; if (cur === m.show) return amt; return m.show === 'USD' ? amt / r : amt * r; };
  E.money = n => { const m = S().money; return m.show === 'USD' ? `$${E.n(n, Math.abs(n) < 100 ? 2 : 0)}` : `${E.n(n)} SYP`; };
  E.amtTxt = (a, c) => c === 'USD' ? `$${E.n(a, 2)}` : `${E.n(a)} SYP`;
  E.monthTx = ym => S().money.tx.filter(t => t.date.startsWith(ym));

  // ================= agenda =================
  E.nextOcc = (date, rep, from) => {
    if (!rep || rep === 'none') return date >= from ? date : null;
    if (date >= from) return date;
    if (rep === 'daily') return from;
    if (rep === 'weekly') return E.add(date, Math.ceil(E.diff(from, date) / 7) * 7);
    const p = E.parse(date), f = E.parse(from);
    const mk = (y, m) => E.ymd(new Date(y, m, Math.min(p.getDate(), new Date(y, m + 1, 0).getDate())));
    if (rep === 'monthly') { let c = mk(f.getFullYear(), f.getMonth()); if (c < from) c = mk(f.getFullYear() + (f.getMonth() === 11 ? 1 : 0), (f.getMonth() + 1) % 12); return c; }
    if (rep === 'yearly') { let c = mk(f.getFullYear(), p.getMonth()); if (c < from) c = mk(f.getFullYear() + 1, p.getMonth()); return c; }
    return null;
  };
  E.occursOn = (date, rep, d) => E.nextOcc(date, rep, d) === d;
  // everything with a time or a date on day d
  E.agenda = d => {
    const out = [], w = E.dow(d);
    for (const b of S().schedule) if (b.days.includes(w) && !(b.skip || []).includes(d)) out.push({ kind: 'block', t: E.min(b.start), e: E.min(b.end), title: b.title, icon: b.icon, c: b.c, id: b.id, meal: b.meal });
    for (const ev of S().events) if (E.occursOn(ev.date, ev.repeat, d)) out.push({ kind: 'event', t: ev.time ? E.min(ev.time) : null, title: ev.title, icon: E.evKind(ev.kind).icon, c: E.evKind(ev.kind).c, id: ev.id });
    for (const k of S().tasks) if (!k.done && k.due === d) out.push({ kind: 'task', t: k.time ? E.min(k.time) : null, title: k.t, icon: 'circle', c: 'var(--muted)', id: k.id, area: k.area });
    for (const s of S().money.subs) if (s.next === d) out.push({ kind: 'sub', t: null, title: `${s.name} renews · ${E.amtTxt(s.amt, s.cur)}`, icon: 'repeat', c: 'var(--rose)', id: s.id });
    return out.sort((a, b) => (a.t == null ? -1 : a.t) - (b.t == null ? -1 : b.t));
  };
  E.EVKINDS = [
    { id: 'birthday', n: 'Birthday', icon: 'gift', c: 'var(--rose)' }, { id: 'anniversary', n: 'Anniversary', icon: 'heart', c: 'var(--rose)' },
    { id: 'baby', n: 'Baby', icon: 'baby', c: 'var(--sand)' }, { id: 'family', n: 'Family', icon: 'users', c: 'var(--sand)' },
    { id: 'work', n: 'Work', icon: 'briefcase', c: 'var(--slate)' }, { id: 'scouts', n: 'Scouts', icon: 'compass', c: 'var(--sage)' },
    { id: 'german', n: 'German', icon: 'languages', c: 'var(--plum)' }, { id: 'health', n: 'Health', icon: 'stethoscope', c: 'var(--sage)' },
    { id: 'church', n: 'Church', icon: 'church', c: 'var(--sand)' }, { id: 'bill', n: 'Payment', icon: 'receipt', c: 'var(--rose)' },
    { id: 'other', n: 'Other', icon: 'calendar', c: 'var(--ember)' }
  ];
  E.evKind = id => E.EVKINDS.find(k => k.id === id) || E.EVKINDS[E.EVKINDS.length - 1];

  // "Next up": the next thing in today's timeline that still needs you
  E.nextUp = () => {
    const d = E.today(), now = E.nowMin(), items = [];
    if (E.started(d)) for (const h of E.dayHabits(d)) { const t = E.hTime(h, d), st = E.hState(h, d); if (t != null && st !== 'done' && st !== 'mini') items.push({ kind: 'habit', t, h }); }
    for (const a of E.agenda(d)) if (a.t != null && !a.meal) items.push({ ...a, kind: a.kind });
    items.sort((a, b) => a.t - b.t);
    // first thing that is current or later, otherwise the earliest missed habit
    return items.find(i => (i.e != null ? i.e : i.t + 45) >= now) || null;
  };
})(window.E);
