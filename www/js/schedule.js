(function (Q) {
  'use strict';
  // Weekly schedule model + day planner. Times are minutes from midnight; anything after midnight
  // (e.g. sleeping at 00:30) is stored as 24h+ (1470) relative to that day's wake time.

  Q.defaultWeek = () => {
    const d = {};
    for (let i = 0; i < 7; i++) {
      const weekend = i === 0 || i === 6;
      d[i] = { wake: weekend ? '10:00' : '07:30', sleep: weekend ? '01:00' : '23:30', blocks: weekend ? [] : [{ id: Q.uid(), label: 'Work', type: 'work', start: '09:00', end: '17:00' }] };
    }
    return { days: d, train: { perWeek: 3, pref: 'evening' } };
  };

  const late = (t, ref) => { let m = Q.toMin(t); if (m < ref) m += 1440; return m; };
  Q.late = late;

  // free intervals [a,b] inside [from,to] after removing busy intervals
  function subtract(from, to, busy) {
    let free = [[from, to]];
    for (const [s, e] of busy) {
      const next = [];
      for (const [a, b] of free) {
        if (e <= a || s >= b) { next.push([a, b]); continue; }
        if (s > a) next.push([a, s]);
        if (e < b) next.push([e, b]);
      }
      free = next;
    }
    return free.filter(([a, b]) => b - a >= 5);
  }
  Q._subtract = subtract;

  Q.dayFrame = dow => {
    const day = Q.S.week.days[dow];
    const wake = Q.toMin(day.wake);
    let sleep = late(day.sleep, wake);
    if (sleep - wake < 6 * 60) sleep = wake + 16 * 60;
    const blocks = (day.blocks || []).map(b => {
      let s = late(b.start, wake), e = late(b.end, wake);
      if (e <= s) e = s + 30;
      return { ...b, s, e };
    }).sort((a, b) => a.s - b.s);
    return { wake, sleep, blocks };
  };

  Q.freeMinutes = dow => {
    const f = Q.dayFrame(dow);
    return subtract(f.wake, f.sleep, f.blocks.map(b => [b.s, b.e])).reduce((t, [a, b]) => t + b - a, 0);
  };

  // pick training days: the days with the most free time, avoiding back-to-back where possible
  Q.pickTrainingDays = n => {
    const order = [0, 1, 2, 3, 4, 5, 6].map(d => ({ d, f: Q.freeMinutes(d) })).sort((a, b) => b.f - a.f);
    const out = [];
    for (const o of order) {
      if (out.length >= n) break;
      const adj = out.some(x => Math.abs(x - o.d) === 1 || Math.abs(x - o.d) === 6);
      if (!adj || n >= 4) out.push(o.d);
    }
    for (const o of order) { if (out.length >= n) break; if (!out.includes(o.d)) out.push(o.d); }
    return out.sort();
  };

  Q.questDur = (q, d) => {
    const c = Q.CATALOG[q.key] || {}, v = Q.tierVal(q, d);
    const dur = q.dur != null ? q.dur : c.dur;
    if (dur === 'n') return Math.max(5, Number(v) || 15);
    if (dur === 'n2') return Math.max(5, Math.round((Number(v) || 10) * 2));
    if (typeof dur === 'number') return dur;
    return 0;
  };
  Q.questWhen = q => q.when || (Q.CATALOG[q.key] || {}).when || 'anytime';

  // ---------- the planner ----------
  const cache = {};
  Q.planDay = d => {
    const key = d + ':' + Q._ver;
    if (cache[key]) return cache[key];
    if (Object.keys(cache).length > 600) for (const k in cache) delete cache[k];
    const S = Q.S, dow = Q.dow(d), f = Q.dayFrame(dow);
    let start = f.wake, end = f.sleep;
    const qs = S.quests.filter(q => Q.scheduledOn(q, d));
    const wakeQ = qs.find(q => q.key === 'wake'), sleepQ = qs.find(q => q.key === 'sleep');
    if (wakeQ) start = Math.min(start, Q.toMin(Q.tierVal(wakeQ, d)));
    if (sleepQ) end = Math.min(end, late(Q.tierVal(sleepQ, d), start));
    // 10-minute buffer after each commitment so nothing starts the second work ends
    const busy = f.blocks.map(b => [b.s, b.e + 10]);
    const items = f.blocks.map(b => ({ kind: 'block', s: b.s, e: b.e, label: b.label, type: b.type }));
    const occ = busy.slice();
    const freeNow = () => subtract(start, end, occ);
    const take = (s, e) => { occ.push([s, e]); occ.sort((a, b) => a[0] - b[0]); };
    const findSlot = (dur, lo, hi, near) => {
      const fr = freeNow().map(([a, b]) => [Math.max(a, lo), Math.min(b, hi)]).filter(([a, b]) => b - a >= dur);
      if (!fr.length) return null;
      if (near == null) return fr[0][0];
      let best = null, bd = 1e9;
      for (const [a, b] of fr) { const s = Q.clamp(near - dur / 2, a, b - dur); const dd = Math.abs(s + dur / 2 - near); if (dd < bd) { bd = dd; best = s; } }
      return Math.round(best / 5) * 5;
    };

    // anchors
    if (wakeQ) items.push({ kind: 'quest', q: wakeQ, s: start, e: start, anchor: true });
    let cursor = start + (wakeQ ? 0 : 0);
    const wakeList = qs.filter(q => Q.questWhen(q) === 'wake' && q !== wakeQ);
    for (const q of wakeList) {
      const dur = Math.max(Q.questDur(q, d), q.key === 'nophoneam' ? 0 : 3);
      items.push({ kind: 'quest', q, s: cursor, e: cursor + dur, anchor: true });
      if (dur) { take(cursor, cursor + dur); cursor += dur; }
    }
    if (sleepQ) items.push({ kind: 'quest', q: sleepQ, s: end, e: end, anchor: true });

    // meals
    const meals = Q.mealSlots ? Q.mealSlots() : [];
    const mealTargets = { breakfast: [start + 20, start, Math.min(start + 180, 12 * 60)], lunch: [13.5 * 60, 12 * 60, 15.5 * 60], dinner: [Math.min(19.5 * 60, end - 150), 17.5 * 60, end - 60], snack: [16.5 * 60, 15 * 60, end - 120], snack2: [11 * 60, start + 120, 12.5 * 60] };
    for (const m of meals) {
      const [near, lo, hi] = mealTargets[m.slot] || mealTargets.snack;
      let dur = m.slot.startsWith('snack') ? 10 : 25, s = findSlot(dur, lo, hi, near), atWork = false;
      if (s == null && !m.slot.startsWith('snack')) { dur = 15; s = findSlot(dur, lo, hi, near); }
      if (s == null) {
        // inside a block (e.g. lunch at the office)
        s = Math.round(Q.clamp(near, lo, hi) / 5) * 5; atWork = f.blocks.some(b => s >= b.s && s < b.e);
      } else take(s, s + dur);
      items.push({ kind: 'meal', meal: m, s, e: s + dur, atWork });
    }

    // bedtime routine quests (stacked backwards from lights out)
    let bedCursor = end;
    for (const q of qs.filter(x => Q.questWhen(x) === 'bed' && x !== sleepQ)) {
      const dur = Math.max(5, Q.questDur(q, d));
      const s = findSlot(dur, end - 120, bedCursor, bedCursor - dur);
      if (s != null) { take(s, s + dur); items.push({ kind: 'quest', q, s, e: s + dur }); bedCursor = s; }
      else items.push({ kind: 'quest', q, s: null, e: null, flex: true });
    }

    // timed quests: workout first, then longest first
    // nothing timed in the last 30 minutes before lights out; no training in the last 90
    const lateCut = end - 30;
    const windows = { morning: [start, 12 * 60], afternoon: [12 * 60, 17 * 60], evening: [17 * 60, lateCut], anytime: [start, lateCut] };
    const train = S.week.train || { pref: 'evening' };
    const timed = qs.filter(q => ['morning', 'afternoon', 'evening', 'anytime', 'workout'].includes(Q.questWhen(q)) && Q.questDur(q, d) > 0)
      .sort((a, b) => (Q.questWhen(b) === 'workout') - (Q.questWhen(a) === 'workout') || Q.questDur(b, d) - Q.questDur(a, d));
    for (const q of timed) {
      const dur = Q.questDur(q, d);
      let w = Q.questWhen(q);
      if (w === 'workout') w = train.pref === 'morning' ? 'morning' : train.pref === 'any' ? 'anytime' : 'evening';
      let [lo, hi] = windows[w];
      const cap = Q.questWhen(q) === 'workout' ? end - 90 : lateCut;
      hi = Math.min(hi, cap);
      let s = findSlot(dur, lo, hi);
      if (s == null) s = findSlot(dur, start, cap);
      if (s == null) { items.push({ kind: 'quest', q, s: null, e: null, flex: true }); continue; }
      take(s, s + dur); items.push({ kind: 'quest', q, s, e: s + dur });
    }
    const allday = qs.filter(q => Q.questWhen(q) === 'allday');
    items.sort((a, b) => (a.s == null) - (b.s == null) || a.s - b.s || (a.kind === 'block') - (b.kind === 'block'));
    const free = freeNow().reduce((t, [a, b]) => t + b - a, 0);
    const flex = items.filter(i => i.flex).map(i => i.q.id);
    const res = { d, start, end, items, allday, free, flex, load: free < 60 ? 'heavy' : free < 150 ? 'busy' : 'open' };
    cache[key] = res;
    return res;
  };

  Q.fmtTime = m => m == null ? '' : Q.fromMin(m);
})(window.Q);
