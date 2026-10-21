(function (Q) {
  'use strict';

  // ---------- assessment → base stats ----------
  Q.assess = a => {
    const g = new Set(a.goals || []);
    const c = n => Q.clamp(Math.round(n), 5, 60);
    return {
      str: c(10 + a.exercise * 15),
      vit: c(10 + a.water * 8 + (a.bed <= 1 ? 12 : a.bed === 2 ? 6 : 0) + (a.wake <= 2 ? 6 : 0)),
      wis: c(10 + a.read * 14 + (g.has('learn') ? 2 : 0)),
      foc: c(10 + a.focus * 13 - (a.screen >= 3 ? 6 : 0)),
      dis: c(10 + a.phoneam * 8 + (a.bed <= 1 ? 8 : 0) + (a.exercise >= 2 ? 6 : 0) + (a.stress === 2 ? 4 : 0)),
      wea: c(10 + (a.hustle === 0 ? 25 : a.hustle === 1 ? 8 : 0))
    };
  };

  // ---------- personalised tiers ----------
  // schedule-based tiers: a.bedMin / a.wakeMin are average sleep / wake minutes (sleep may be > 1440)
  function sleepTiers(a) { const b = Math.round(a.bedMin / 15) * 15; return [1, 2, 3, 4].map(i => Q.fromMin(Math.max(22.5 * 60, b - 30 * i))); }
  function wakeTiers(a) { return [0, 1, 2, 3].map(i => Q.fromMin(Math.max(6 * 60, Math.round(a.wakeMin / 15) * 15 - 30 * i))); }
  function screenTiers(a) { const cur = [1.5, 3, 5, 7, 9][a.screen]; return [1, 2, 3, 4].map(i => Math.max(1.5, cur - i)); }
  Q.scheduleHabits = () => {
    const days = Q.S.week.days; let b = 0, w = 0;
    for (let i = 0; i < 7; i++) { const wk = Q.toMin(days[i].wake); w += wk; b += Q.late(days[i].sleep, wk); }
    const bedMin = Math.round(b / 7), wakeMin = Math.round(w / 7);
    const bed = bedMin < 23 * 60 ? 0 : bedMin < 24 * 60 ? 1 : bedMin < 25 * 60 ? 2 : bedMin < 26 * 60 ? 3 : 4;
    const wake = wakeMin < 6 * 60 ? 0 : wakeMin < 7 * 60 ? 1 : wakeMin < 8 * 60 ? 2 : wakeMin < 9 * 60 ? 3 : 4;
    return { bedMin, wakeMin, bed, wake };
  };

  // ---------- program generator ----------
  Q.scoreQuests = a => {
    const g = new Set(a.goals || []), has = k => g.has(k) ? 1 : 0;
    return {
      water: 3 - a.water + has('fit') * 0.5,
      sleep: (a.bed >= 2 ? 3 : 0.6) + has('sleep') * 1.5,
      meals: 3.2 + has('fit'),
      wake: (a.wake >= 3 ? 1.6 : 0.3) + has('sleep') * 0.8,
      move: (a.exercise <= 1 ? 2.6 : 0.8) + has('fit'),
      workout: (a.exercise >= 2 ? 2.4 : 0.3) + has('fit') * 1.2,
      steps: 0.6 + has('fit') * 0.6,
      read: (a.read <= 1 ? 2.2 : 1.4) + has('learn'),
      learn: 0.4 + has('learn') * 2,
      deep: (a.focus <= 1 ? 2 : 1) + has('focus') * 1.4,
      meditate: (a.stress === 0 ? 2.2 : 0.6) + has('calm') * 1.6,
      nophoneam: (a.phoneam <= 1 ? 2.3 : 0.4) + has('phone'),
      screen: (a.screen >= 3 ? 2.8 : 0.3) + has('phone') * 1.5,
      bed: 1.1 + has('discipline'),
      cold: 0.2 + has('discipline') * 1.2,
      nojunk: 0.5 + has('fit'),
      protein: 0.3 + has('fit') * 0.9,
      hustle: (a.hustle <= 1 ? 2.2 : 0) + has('money') * 1.2,
      money: 0.3 + has('money') * 1.2,
      gratitude: (a.stress === 0 ? 1.4 : 0.5) + has('calm') * 0.5,
      sun: 0.6 + has('sleep') * 0.9,
      tidy: 0.6 + has('discipline') * 0.4,
      nosugar: 0.2 + has('fit') * 0.5
    };
  };

  Q.startLevel = (key, a, modeKey) => {
    const strong = {
      water: a.water >= 2, move: a.exercise >= 2, workout: a.exercise >= 3, steps: a.exercise >= 2,
      read: a.read >= 2, deep: a.focus >= 2, meditate: a.stress === 2, learn: a.read >= 3
    }[key];
    let l = modeKey === 'easy' ? 0 : (strong ? 1 : 0);
    l += Q.MODES[modeKey].boost;
    return l;
  };

  Q.buildQuest = (key, a, modeKey, since) => {
    const c = Q.CATALOG[key];
    let tiers = c.tiers.slice();
    if (a && key === 'sleep') tiers = sleepTiers(a);
    if (a && key === 'wake') tiers = wakeTiers(a);
    if (a && key === 'screen') tiers = screenTiers(a);
    if (key === 'water' && Q.S.nutri) { const t = Math.min(14, Math.max(6, Math.round(Q.targets().water * 4))); tiers = [Math.max(4, t - 4), Math.max(5, t - 2), t, t]; }
    if (key === 'meals') tiers = [Q.S.nutri ? Q.S.nutri.meals : 3];
    const l = Q.clamp(a ? Q.startLevel(key, a, modeKey) : 0, 0, tiers.length - 1);
    let days = [0, 1, 2, 3, 4, 5, 6];
    if (key === 'workout') days = Q.pickTrainingDays((Q.S.week.train || {}).perWeek || 3);
    return {
      id: Q.uid(), key, name: c.name, icon: c.icon, stat: c.stat, diff: c.diff, type: c.type, unit: c.unit || '',
      tiers, step: c.step || 1, mini: c.mini, days, since, lv: [{ d: since, l }], remind: ''
    };
  };

  Q.generateProgram = (a, modeKey) => {
    const s = Q.scoreQuests(a);
    const order = Object.keys(Q.CATALOG);
    const keys = order.slice().sort((x, y) => (s[y] - s[x]) || (order.indexOf(x) - order.indexOf(y)));
    return keys.slice(0, Q.MODES[modeKey].count);
  };

  // ---------- program timeline ----------
  Q.programDay = d => Q.S.program.start ? Q.diffDays(d || Q.today(), Q.S.program.start) + 1 : 0;
  Q.phaseFor = pd => Q.PHASES.find(p => pd >= p.from && pd <= p.to) || (pd > Q.PROGRAM_DAYS ? Q.PHASES[3] : Q.PHASES[0]);

  // completion over the 7 calendar days before `end` (exclusive)
  Q.questStats = (q, end, n) => {
    end = end || Q.today(); n = n || 7;
    let due = 0, done = 0;
    for (let i = 1; i <= n; i++) {
      const d = Q.addDays(end, -i);
      if (!Q.isDue(q, d)) continue;
      due++;
      const v = Q.getLog(d, q.id);
      if (Q.isDone(q, v, d)) done++; else if (v === 'm') done += 0.5;
    }
    return { due, done, rate: due ? done / due : null };
  };

  Q.lastLevelChange = q => q.lv[q.lv.length - 1].d;

  Q.suggestFor = q => {
    const t = Q.today();
    if (!Q.activeOn(q, t) || Q.maxLevel(q) < 1) return null;
    if (Q.S.dismiss[q.id] && Q.diffDays(t, Q.S.dismiss[q.id]) < 7) return null;
    if (Q.diffDays(t, Q.lastLevelChange(q)) < 5) return null;
    const st = Q.questStats(q), l = Q.levelAt(q, t);
    if (st.due < 4) return null;
    if (st.rate <= 0.4 && l > 0) return { q, type: 'down', st };
    if (st.rate >= 1 && st.due >= 5 && l < Q.maxLevel(q)) return { q, type: 'up', st };
    return null;
  };
  Q.suggestions = () => Q.S.quests.map(Q.suggestFor).filter(Boolean);

  // level change: easier applies today, harder applies from tomorrow so today's progress is never undone
  Q.changeLevel = (q, delta) => {
    const t = Q.today(), from = delta > 0 ? Q.addDays(t, 1) : t;
    const nl = Q.clamp(Q.levelAt(q, from) + delta, 0, Q.maxLevel(q));
    q.lv = q.lv.filter(e => e.d < from);
    q.lv.push({ d: from, l: nl });
    if (q.lv.length > 1 && q.lv[q.lv.length - 2].l === nl) q.lv.pop();
    delete Q.S.dismiss[q.id];
  };

  // ---------- phase ramps (run on open) ----------
  Q.checkPhase = () => {
    const P = Q.S.program; if (!P.start) return null;
    const pd = Q.programDay();
    if (pd > Q.PROGRAM_DAYS) {
      if (P.done66Shown <= P.cycles) { P.done66Shown = P.cycles + 1; Q.save(); return { type: 'complete' }; }
      return null;
    }
    const ph = Q.phaseFor(pd);
    if (ph.n <= P.phaseShown) return null;
    const ups = [], kept = [];
    if (P.phaseShown >= 1) {
      for (const q of Q.S.quests) {
        if (!Q.activeOn(q, Q.today()) || Q.maxLevel(q) < 1) continue;
        const l = Q.levelAt(q, Q.today());
        if (l >= Q.maxLevel(q)) continue;
        const st = Q.questStats(q);
        if (st.rate === null || st.rate >= 0.6) {
          const before = Q.qName(q, Q.today());
          Q.changeLevel(q, 1);
          ups.push({ q, before, after: Q.qName(q, Q.addDays(Q.today(), 1)) });
        } else kept.push(q);
      }
    }
    P.phaseShown = ph.n; Q.save();
    return P.phaseShown > 1 ? { type: 'phase', ph, ups, kept } : null;
  };

  Q.reviewDue = () => {
    const P = Q.S.program; if (!P.start) return false;
    const last = Q.S.reviews.length ? Q.S.reviews[Q.S.reviews.length - 1].d : P.start;
    return Q.diffDays(Q.today(), last) >= 7;
  };
})(window.Q);
