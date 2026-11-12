(function (E) {
  'use strict';
  const S = () => E.S;

  // A "day" runs until 4 am, so a 00:30 bedtime still belongs to the day before.
  const CUT = 4;
  E.today = () => E.ymd(new Date(E.now().getTime() - CUT * 36e5));
  E.nowMin = () => { const n = E.now(), m = n.getHours() * 60 + n.getMinutes(); return n.getHours() < CUT ? m + 1440 : m; };

  // remember when something was ticked, so done things sit where they happened on the timeline
  const _set = E.setLog;
  E.setLog = (d, id, v) => {
    _set(d, id, v);
    const A = S().at || (S().at = {});
    if (v == null || v === 0 || v === false) { if (A[d]) { delete A[d][id]; if (!Object.keys(A[d]).length) delete A[d]; } }
    else if (d === E.today()) (A[d] = A[d] || {})[id] = E.nowMin();
  };

  const MEAL = { bf: 'breakfast', ln: 'lunch', dn: 'dinner' };
  const up5 = m => Math.ceil(m / 5) * 5;

  // ================= the auto day planner =================
  // Fixed things (work, class, meals, timed dates) are placed first. Flexible things (habits with a
  // duration, tasks without a time) are dropped into the free gaps, as close as possible to their
  // preferred time. Today, anything not done yet is only ever planned from "now" on, so a missed
  // slot moves itself to the next free one.
  E.planDay = d => {
    const key = E.ver + d + Math.floor(E.nowMin() / 5) + E.today();
    if (E._pd && E._pd.k === key) return E._pd.v;
    const t = E.today(), isToday = d === t, past = d < t, now = E.nowMin(), w = E.dow(d);
    const wake = E.min(E.wakeOf(d)); let sleep = E.min(E.sleepOf(d)); if (sleep < wake) sleep += 1440;
    const at = (S().at || {})[d] || {}, ov = (S().plan || {})[d] || {};
    const items = [], busy = [], any = [], allDay = [], flex = [], unplaced = [];

    for (const b of S().schedule) {
      if (!b.days.includes(w) || (b.skip || []).includes(d)) continue;
      const s = E.min(b.start); let e = E.min(b.end); if (e <= s) e += 1440;
      if (b.meal) {
        const meal = MEAL[b.id] || 'extra', es = (S().food.diary[d] || []).filter(x => x.meal === meal), kcal = Math.round(es.reduce((a, x) => a + E.entryM(x).k, 0));
        items.push({ key: 'm:' + b.id, kind: 'meal', t: s, e, title: b.title, icon: b.icon, c: 'var(--sand)', meal, kcal, state: es.length ? 'done' : 'none' });
      } else items.push({ key: 'b:' + b.id, kind: 'block', t: s, e, title: b.title, icon: b.icon, c: b.c, id: b.id, state: past || (isToday && e <= now) ? 'done' : 'none' });
      busy.push([s, e]);
    }
    for (const ev of S().events) {
      if (!E.occursOn(ev.date, ev.repeat, d)) continue;
      const k = E.evKind(ev.kind), o = { key: 'e:' + ev.id, kind: 'event', id: ev.id, title: ev.title, icon: k.icon, c: k.c, state: 'none' };
      if (ev.time) { o.t = E.min(ev.time); o.e = o.t + 60; items.push(o); busy.push([o.t, o.e]); } else allDay.push(o);
    }
    for (const pe of (E.ui.phoneEv || [])) { if (pe.date !== d) continue; const o = { key: 'p:' + pe.title + pe.time, kind: 'event', ro: true, title: pe.title, icon: 'calendar', c: 'var(--slate)', state: 'none' }; if (pe.time) { o.t = E.min(pe.time); o.e = o.t + 60; items.push(o); busy.push([o.t, o.e]); } else allDay.push(o); }
    for (const s of S().money.subs) if (s.next === d) allDay.push({ key: 's:' + s.id, kind: 'sub', id: s.id, title: `${s.name} renews · ${E.amtTxt(s.amt, s.cur)}`, icon: 'repeat', c: 'var(--rose)' });
    for (const k of S().tasks) {
      const base = { key: 't:' + k.id, kind: 'task', id: k.id, title: k.t, icon: 'circle-check', c: 'var(--sage)', area: k.area, pri: k.pri };
      if (k.done) { if (k.doneAt === d) items.push({ ...base, state: 'done', t: at['t:' + k.id] != null ? at['t:' + k.id] : (k.time ? E.min(k.time) : wake + 60) }); continue; }
      const due = k.due === d || (isToday && k.due && k.due < d);
      if (!due) continue;
      if (k.time && k.due === d) { const tm = E.min(k.time); items.push({ ...base, state: 'none', t: tm, e: tm + (k.est || 30) }); busy.push([tm, tm + (k.est || 30)]); }
      else flex.push({ ...base, state: 'none', dur: k.est || 30, pref: k.pri ? wake + 90 : 18 * 60, overdue: k.due < d });
    }
    for (const f of (S().focus || [])) if (f.d === d) items.push({ key: 'f:' + f.t, kind: 'focus', t: f.t, e: f.t + f.mins, title: f.label, icon: 'timer', c: 'var(--plum)', mins: f.mins, state: 'done' });

    if (E.started(d)) for (const h of E.dayHabits(d)) {
      const st = E.hState(h, d), tm = E.hTime(h, d);
      const o = { key: 'h:' + h.id, kind: 'habit', h, id: h.id, title: E.hName(h, d), icon: h.icon, c: 'var(--ember)', state: st };
      if (tm == null) { any.push(o); continue; }
      if (h.dur) flex.push({ ...o, dur: h.dur, pref: tm });
      else items.push({ ...o, t: st === 'done' || st === 'mini' ? (at[h.id] != null && h.time !== 'sleep' ? Math.min(at[h.id], tm) : tm) : tm, late: isToday && st === 'none' && tm + 45 < now && h.time !== 'sleep' });
    }

    const free = (s, dur) => {
      for (let guard = 0; guard < 60; guard++) {
        const hit = busy.find(([a, b]) => s < b + 5 && s + dur > a - 5);
        if (!hit) return s + dur <= sleep - 10 ? s : null;
        s = up5(hit[1] + 5);
      }
      return null;
    };
    flex.sort((a, b) => a.pref - b.pref);
    for (const f of flex) {
      const done = f.state === 'done' || f.state === 'mini';
      let tm;
      if (done) tm = at[f.id] != null ? Math.max(wake, at[f.id] - f.dur) : f.pref;
      else if (past) { tm = f.pref; f.late = true; }
      else if (ov[f.key] != null && (!isToday || ov[f.key] + f.dur > now)) { tm = ov[f.key]; f.pinned = true; }
      else {
        const earliest = isToday ? Math.max(f.pref, up5(now + 2)) : f.pref;
        tm = free(earliest, f.dur);
        if (tm == null && earliest > f.pref) tm = null;
        if (tm == null) { unplaced.push(f); continue; }
        f.moved = tm - f.pref >= 20;
      }
      f.t = tm; f.e = tm + f.dur;
      if (!done) busy.push([f.t, f.e]);
      items.push(f);
    }
    items.sort((a, b) => a.t - b.t || (a.kind === 'block' ? -1 : 1));

    // free gaps from now on (for "use this time" suggestions)
    const gaps = [];
    if (!past) {
      const all = busy.slice().sort((a, b) => a[0] - b[0]); let cur = isToday ? Math.max(wake, up5(now)) : wake;
      for (const [a, b] of all) { if (a - cur >= 40) gaps.push([cur, a]); cur = Math.max(cur, b); }
      if (sleep - 30 - cur >= 40) gaps.push([cur, sleep - 30]);
    }
    const v = { items, any, allDay, unplaced, gaps, wake, sleep };
    E._pd = { k: key, v };
    return v;
  };

  // the one thing to do now / next (also used by the widget and reminders)
  E.nextUp = () => {
    const d = E.today(), now = E.nowMin(), p = E.planDay(d);
    const act = p.items.filter(i => (i.kind === 'habit' || i.kind === 'task' || (i.kind === 'meal' && i.state === 'none') || i.kind === 'event') && i.state !== 'done' && i.state !== 'mini' && !i.late);
    return act.find(i => (i.e || i.t + 30) >= now) || null;
  };
  E.movePlan = (d, key, min) => { const P = S().plan || (S().plan = {}); if (min == null) { if (P[d]) delete P[d][key]; } else (P[d] = P[d] || {})[key] = min; };

  // ================= stats used by the coach and reports =================
  E.range = n => { const t = E.today(), st = S().profile.start, out = []; for (let i = n - 1; i >= 0; i--) { const d = E.add(t, -i); if (d >= st) out.push(d); } return out; };
  E.habitRate = (h, days) => { let due = 0, ok = 0; for (const d of days) if (E.dueOn(h, d)) { due++; const s = E.hState(h, d); if (s === 'done') ok++; else if (s === 'mini') ok += 0.7; else if (s === 'part' && h.type === 'count') ok += Math.min(1, (E.log(d, h.id) || 0) / h.target) * 0.5; } return { due, ok, p: due ? ok / due : null }; };
  E.habitStreak = h => { let n = 0; for (let d = E.today(), i = 0; i < 400 && d >= S().profile.start; d = E.add(d, -1), i++) { if (!E.dueOn(h, d)) continue; const s = E.hState(h, d); if (s === 'done' || s === 'mini') n++; else if (d === E.today()) continue; else break; } return n; };
  E.avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  E.focusMins = days => { const set = new Set(days); return (S().focus || []).filter(f => set.has(f.d)).reduce((a, f) => a + f.mins, 0); };
  E.spentIn = days => { const set = new Set(days); return S().money.tx.filter(x => x.type === 'exp' && set.has(x.date)).reduce((a, x) => a + E.conv(x.amt, x.cur), 0); };

  // ================= the coach =================
  // Reads the last 7 days and returns advice, most important first.
  E.coach = () => {
    const key = 'c' + E.ver + E.today();
    if (E._co && E._co.k === key) return E._co.v;
    const out = [], t = E.today(), days = E.range(7), full = days.filter(d => d < t), T = E.targets(), em = E.ember(), M = S().money;
    const add = (sev, icon, c, title, body, a, al, attrs) => out.push({ sev, icon, c, title, body, a, al, attrs: attrs || '' });
    if (!E.started(t)) { add(50, 'sparkles', 'var(--ember)', `Day 1 is ${E.rel(S().profile.start).toLowerCase()}`, 'Use the time to set reminders, budgets and your important dates.', 'settings', 'Open settings'); }
    else if (full.length < 2) add(10, 'sparkles', 'var(--ember)', 'I\'m learning your rhythm', 'After two full days I\'ll start telling you the one thing worth fixing.');
    if (em.dimmed && E.dayScore(t).p < E.KEEP) add(100, 'flame', 'var(--ember)', 'Never miss twice: today decides', 'Yesterday slipped. A few small versions today keep your fire alive.');
    if (full.length >= 2) {
      // habits
      const rates = S().habits.filter(h => !h.off).map(h => ({ h, r: E.habitRate(h, full) })).filter(x => x.r.due >= 2);
      const weak = rates.slice().sort((a, b) => a.r.p - b.r.p)[0], strong = rates.slice().sort((a, b) => b.r.p - a.r.p)[0];
      if (weak && weak.r.p < 0.45) add(70 - weak.r.p * 30, weak.h.icon, 'var(--rose)', `"${weak.h.name}" is slipping`, `Done ${Math.round(weak.r.ok)} of ${weak.r.due} days. ${weak.h.min ? `Use the small version: ${weak.h.min.toLowerCase()}.` : 'Make it smaller or move it to a better time.'}`, 'habit-edit', 'Adjust it', `data-id="${weak.h.id}"`);
      if (strong && strong.r.p >= 0.9 && strong.r.due >= 4) add(15, 'medal', 'var(--sage)', `"${strong.h.name}" is locked in`, `${Math.round(strong.r.p * 100)}% this week. That's who you are now.`);
      const sl = S().habits.find(h => h.id === 'sleep'), slr = sl && E.habitRate(sl, full);
      const hs = full.map(d => S().health.sleep[d]).filter(Boolean);
      if (hs.length >= 3 && E.avg(hs) < 390) add(78, 'moon-star', 'var(--plum)', `You're averaging ${Math.floor(E.avg(hs) / 60)}h ${Math.round(E.avg(hs) % 60)}m of sleep`, 'Short sleep raises hunger and kills focus. Protect lights-out tonight.');
      else if (slr && slr.due >= 3 && slr.p < 0.4) add(66, 'moon-star', 'var(--plum)', 'Bedtime keeps slipping', `Lights-out held ${Math.round(slr.ok)} of ${slr.due} nights. Put the phone outside the bedroom 15 minutes before.`);
      // food
      const fd = full.map(d => E.dayFood(d)).filter(f => f.k > 0);
      if (fd.length < Math.min(3, full.length) && full.length >= 3) add(58, 'utensils', 'var(--sand)', 'Your food diary has gaps', `Logged ${fd.length} of the last ${full.length} days. Log lunch right after eating; it takes 10 seconds.`, 'food-add', 'Log food');
      else if (fd.length >= 3) {
        const ak = E.avg(fd.map(f => f.k)), ap = E.avg(fd.map(f => f.p));
        if (ak > T.kcal * 1.1) add(72, 'utensils', 'var(--bad)', `About ${E.n(ak - T.kcal)} kcal over each day`, `Average ${E.n(ak)} against a ${E.n(T.kcal)} target. Check dinner portions and drinks first.`, 'go-health', 'See food');
        else if (ap < T.p * 0.75) add(60, 'beef', 'var(--sand)', `Protein is low: ${Math.round(ap)} g of ${T.p} g`, 'Add eggs at breakfast and a palm of chicken or labneh at lunch. It keeps you full while losing fat.');
        else if (ak <= T.kcal * 1.03) add(18, 'utensils', 'var(--sage)', 'Calories on target this week', `Average ${E.n(ak)} of ${E.n(T.kcal)} kcal. This pace is about ${T.weekly} kg a week.`);
      }
      const wq = S().habits.find(h => h.id === 'water'), wa = wq && E.avg(full.filter(d => E.dueOn(wq, d)).map(d => +E.log(d, 'water') || 0));
      if (wq && !wq.off && wa < wq.target * 0.6) add(40, 'glass-water', 'var(--slate)', `Only ${E.n(wa, 1)} glasses of water a day`, 'Keep a bottle on your desk and drink one glass with every meal.');
      const sq = S().habits.find(h => h.id === 'steps'), sa = sq && E.avg(full.filter(d => E.dueOn(sq, d)).map(d => S().health.steps[d] || +E.log(d, 'steps') || 0));
      if (sq && !sq.off && sa > 0 && sa < sq.target * 0.7) add(52, 'footprints', 'var(--sage)', `${E.n(sa)} steps a day on average`, 'A 15-minute walk after work adds about 1,800 steps.');
    }
    // weight
    const W = S().weights.slice().sort((a, b) => a.d.localeCompare(b.d));
    if (W.length && E.diff(t, W[W.length - 1].d) >= 8) add(55, 'scale', 'var(--sage)', `Last weigh-in was ${E.diff(t, W[W.length - 1].d)} days ago`, 'Weigh in tomorrow morning so I can check your pace.', 'weigh', 'Log weight');
    if (W.length >= 2) { const a = W[W.length - 1], b = W.find(x => E.diff(a.d, x.d) <= 21) || W[0], wk = E.diff(a.d, b.d) / 7; if (wk >= 1) { const pace = (b.kg - a.kg) / wk; if (pace < 0.2) add(64, 'scale', 'var(--bad)', 'Weight has stalled', `${E.n(Math.abs(b.kg - a.kg), 1)} kg ${pace < 0 ? 'up' : 'down'} in ${Math.round(wk)} weeks. Tighten logging for 7 days before changing anything else.`); else add(16, 'trending-down', 'var(--sage)', `Losing ${E.n(pace, 1)} kg a week`, `${E.n(Math.max(0, a.kg - S().profile.goalKg), 1)} kg to your ${S().profile.goalKg} kg goal.`); } }
    // money
    const ym = t.slice(0, 7), tx = E.monthTx(ym).filter(x => x.type === 'exp'), spent = tx.reduce((a, x) => a + E.conv(x.amt, x.cur), 0);
    const budget = Object.values(M.budgets).reduce((a, b) => a + E.conv(b.amt, b.cur), 0), dayNo = E.parse(t).getDate(), dim = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate();
    if (budget && dayNo >= 5 && spent / dayNo * dim > budget * 1.1) add(74, 'wallet', 'var(--bad)', 'On track to overspend this month', `At this pace you'll spend ${E.money(spent / dayNo * dim)} against a ${E.money(budget)} budget.`, 'go-money', 'See money');
    for (const id in M.budgets) { const b = E.conv(M.budgets[id].amt, M.budgets[id].cur), s = tx.filter(x => x.cat === id).reduce((a, x) => a + E.conv(x.amt, x.cur), 0); if (s > b) { add(62, E.cat(id).icon, 'var(--bad)', `${E.cat(id).n} is over budget`, `${E.money(s)} spent of ${E.money(b)}.`, 'go-money', 'See money'); break; } }
    const lastTx = M.tx.map(x => x.date).sort().pop();
    if (E.started(t) && (!lastTx || E.diff(t, lastTx) >= 3)) add(48, 'receipt', 'var(--sand)', lastTx ? `No expenses logged for ${E.diff(t, lastTx)} days` : 'Start logging what you spend', 'You can\'t see where money goes unless every purchase goes in. Tap + after you pay.', 'tx-new', 'Add expense', 'data-type="exp"');
    const ff = tx.filter(x => x.sub === 'Fast food' && E.diff(t, x.date) < 7);
    if (ff.length >= 3) add(56, 'sandwich', 'var(--rose)', `${ff.length} fast-food buys this week`, `${E.money(ff.reduce((a, x) => a + E.conv(x.amt, x.cur), 0))} spent. Prep two dinners on Sunday to cut it in half.`);
    // work and learning
    const od = S().tasks.filter(k => !k.done && k.due && k.due < t).length;
    if (od >= 3) add(57, 'list-checks', 'var(--slate)', `${od} tasks are overdue`, 'Pick the one that matters, give the rest a real date, delete what you won\'t do.', 'go-tasks', 'Open tasks');
    if (E.started(t) && full.length >= 3 && E.focusMins(days) < 50) add(38, 'timer', 'var(--plum)', 'No deep work this week yet', 'One 25-minute focus session on a real project beats an hour of half-work.', 'focus-new', 'Start focus');
    const due = Object.values(S().de.srs).filter(v => v.due <= t).length;
    if (due >= 40) add(44, 'languages', 'var(--plum)', `${due} German cards are waiting`, 'Clear 20 today so the pile doesn\'t grow.', 'de-start', 'Practice');
    if (em.streak >= 7 && [7, 14, 30, 66, 100].includes(em.streak)) add(90, 'party-popper', 'var(--ember)', `${em.streak} days. Your fire is real.`, 'Most people quit in week one. You didn\'t.');
    out.sort((a, b) => b.sev - a.sev);
    if (!out.length) add(1, 'badge-check', 'var(--sage)', 'Everything is on track', 'Nothing to fix today. Keep the rhythm.');
    E._co = { k: key, v: out };
    return out;
  };
})(window.E);
