(function (Q) {
  'use strict';
  // Home-screen widgets. The app writes a small snapshot of today for the native widgets,
  // and the Today widget lets you tick habits without opening the app: those taps are queued
  // natively and applied here the next time the app runs or comes back to the foreground.
  const WB = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.WidgetBridge;

  const nowMin = () => { const n = Q._now ? Q._now() : new Date(); return n.getHours() * 60 + n.getMinutes(); };

  Q.widgetSnapshot = () => {
    const S = Q.S, d = Q.today(), g = Q.game(), info = g.days[d] || Q.dayInfo(d);
    const habits = (info.items || []).filter(it => !it.skip && it.q.key !== 'meals').slice(0, 8).map(it => {
      const q = it.q, v = Q.getLog(d, q.id);
      const target = Q.target(q, d);
      return { id: q.id, name: Q.qName(q, d), type: q.type === 'count' ? 'count' : 'check', count: typeof v === 'number' ? v : (v === true ? target : 0), target, done: !!it.done };
    });
    let cal = null;
    try {
      if (S.hero.onboarded) {
        const mp = Q.mealPlan(d), log = Q.mealLog(d);
        let k = 0, p = 0;
        for (const m of mp.meals) if (!m.empty && log[m.slot] === 'done') { k += m.k; p += m.p; }
        cal = { target: Math.round(mp.T.kcal), eaten: Math.round(k), protein: Math.round(p), proteinTarget: Math.round(mp.T.p) };
      }
    } catch (e) { /* nutrition not set up */ }
    let next = null;
    try {
      const plan = Q.planDay(d), now = nowMin();
      for (const it of plan.items) {
        if (it.s == null || (it.e != null ? it.e : it.s) < now) continue;
        if (it.kind === 'quest') { const v = Q.getLog(d, it.q.id); if (Q.isDone(it.q, v, d) || v === 's') continue; next = { title: Q.qName(it.q, d), time: Q.fmtTime(it.s), kind: 'Habit' }; break; }
        if (it.kind === 'meal' && !it.meal.empty && !Q.mealLog(d)[it.meal.slot]) { next = { title: it.meal.label || 'Meal', time: Q.fmtTime(it.s), kind: 'Meal' }; break; }
        if (it.kind === 'block') { next = { title: it.label, time: Q.fmtTime(it.s), kind: 'Commitment' }; break; }
      }
    } catch (e) { /* no plan yet */ }
    const qt = Q.quoteFor(d);
    return {
      date: d, level: g.level, rank: g.rank && g.rank.name || '', streak: g.cur,
      xpPct: Math.round(100 * (g.xp - g.lvlStart) / Math.max(1, g.lvlNext - g.lvlStart)),
      done: info.done || 0, total: info.total || 0,
      habits, cal, next, quote: qt ? qt.t : '', quoteCat: qt ? qt.c : ''
    };
  };

  let t = null;
  Q.pushWidgets = () => {
    const wb = WB(); if (!wb) return;
    clearTimeout(t);
    t = setTimeout(() => { try { wb.update({ data: JSON.stringify(Q.widgetSnapshot()) }); } catch (e) { console.warn('widgets', e); } }, 400);
  };

  // apply taps made on the Today widget while the app was closed
  Q.applyWidgetTicks = async () => {
    const wb = WB(); if (!wb) return;
    let r;
    try { r = await wb.pullTicks(); } catch (e) { return; }
    const ticks = (r && r.ticks) || [];
    if (!ticks.length) { Q.pushWidgets(); return; }
    const before = Q.game();
    for (const tk of ticks) {
      const q = Q.S.quests.find(x => x.id === tk.id); if (!q || !tk.date) continue;
      const v = Q.getLog(tk.date, q.id);
      if (q.type === 'count') {
        const n = (typeof v === 'number' ? v : 0) + (tk.delta || 1);
        Q.setLog(tk.date, q.id, Math.max(0, n) || null);
      } else {
        Q.setLog(tk.date, q.id, tk.done ? true : null);
      }
    }
    if (Q.afterChange) Q.afterChange(before, { date: Q.today() }); else if (Q.render) Q.render();
    Q.pushWidgets();
  };

  Q.initWidgets = () => {
    const P = window.Capacitor && window.Capacitor.Plugins;
    Q.applyWidgetTicks();
    if (P && P.App) P.App.addListener('resume', () => Q.applyWidgetTicks());
  };
})(window.Q);
