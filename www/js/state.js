(function (Q) {
  'use strict';
  // Starting values for the setup screens (all editable during onboarding and in Settings).
  Q.presetWeek = () => {
    const days = {};
    for (let i = 0; i < 7; i++) {
      const weekend = i === 0 || i === 6;
      days[i] = { wake: weekend ? '09:00' : '07:30', sleep: weekend ? '00:30' : '23:30', blocks: weekend ? [] : [{ id: Q.uid(), label: 'Work', type: 'work', start: '09:00', end: '17:00' }] };
    }
    return { days, train: { perWeek: 3, pref: 'evening' } };
  };
  Q.presetNutri = () => ({
    sex: 'male', age: 25, height: 175, weight: 80, activity: 'light', goal: 'lose', pace: 'standard', meals: 3,
    exclude: [], days: {}, swaps: {}, off: {}
  });
  const KEY = 'questline.v3';
  Q.KEY = KEY;

  const fresh = () => ({
    v: 3,
    hero: { name: 'Hero', cls: 'warrior', created: Q.today(), onboarded: false, why: '', mode: 'normal', answers: null, base: null, seen: [] },
    program: { start: null, cycles: 0, phaseShown: 0, done66Shown: 0 },
    week: Q.presetWeek(), nutri: Q.presetNutri(),
    settings: {
      currency: '$', threshold: 80, sound: true, haptics: true,
      remindersOn: false, autoRemind: true, mealRemind: true, morning: '08:00', evening: '21:00', bedtime: '23:30', bedRemind: true
    },
    quests: [], logs: {}, checkins: {}, bonus: {}, breath: {}, weights: [], chests: {},
    side: [], hustles: [], focus: {}, journal: {}, reviews: [],
    rewards: Q.DEFAULT_REWARDS.map(r => ({ ...r, id: Q.uid() })),
    purchases: [], timer: null, dismiss: {}, ui: { quoteHidden: '' }
  });
  Q.freshState = fresh;

  const valid = d => d && typeof d === 'object' && d.v === 3 && Array.isArray(d.quests) && d.logs && d.hero && d.settings;
  Q.validBackup = valid;

  Q.normalize = d => {
    const f = fresh();
    for (const k of Object.keys(f)) if (d[k] == null) d[k] = f[k];
    d.hero = { ...f.hero, ...d.hero };
    d.program = { ...f.program, ...d.program };
    d.settings = { ...f.settings, ...d.settings };
    d.ui = { ...f.ui, ...d.ui };
    d.nutri = { ...f.nutri, ...d.nutri };
    if (!d.week || !d.week.days) d.week = f.week;
    if (!Array.isArray(d.hero.seen)) d.hero.seen = [];
    d.hustles.forEach(h => { h.entries = h.entries || []; h.tasks = h.tasks || []; });
    d.side.forEach(s => { s.steps = s.steps || []; });
    d.quests.forEach(q => { if (!Array.isArray(q.lv) || !q.lv.length) q.lv = [{ d: q.since, l: 0 }]; if (!q.days) q.days = [0, 1, 2, 3, 4, 5, 6]; });
    return d;
  };

  Q.load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        let d = null;
        try { d = JSON.parse(raw); } catch (e) { localStorage.setItem(KEY + '.corrupt', raw); }
        if (valid(d)) return Q.normalize(d);
      }
    } catch (e) { console.warn('load failed', e); }
    return fresh();
  };

  Q.S = Q.load();
  Q._ver = 0;
  let notifTimer = null;
  Q.save = () => {
    Q._ver++;
    try { localStorage.setItem(KEY, JSON.stringify(Q.S)); }
    catch (e) { if (Q.toast) Q.toast('Could not save. Export a backup soon!'); }
    // reminders depend on progress (e.g. evening warning only if the monster is alive), so refresh them after changes
    clearTimeout(notifTimer);
    notifTimer = setTimeout(() => { if (Q.rescheduleNotifications) Q.rescheduleNotifications(); }, 1500);
  };
  Q.replaceState = d => { Q.S = Q.normalize(d); Q.save(); };

  // ---- logs: true = done, number = counter, 'm' = mini version, 's' = skipped ----
  Q.getLog = (d, id) => (Q.S.logs[d] || {})[id];
  Q.setLog = (d, id, v) => {
    const l = Q.S.logs[d] || (Q.S.logs[d] = {});
    if (v == null || v === false || v === 0) delete l[id]; else l[id] = v;
    if (!Object.keys(l).length) delete Q.S.logs[d];
    Q.save();
  };

  // ---- quest helpers ----
  Q.levelAt = (q, d) => { let l = 0; for (const e of q.lv) if (e.d <= d) l = e.l; return l; };
  Q.maxLevel = q => (q.tiers || [0]).length - 1;
  Q.tierVal = (q, d) => { const t = q.tiers || [0]; return t[Math.min(Q.levelAt(q, d), t.length - 1)]; };
  Q.target = (q, d) => q.type === 'count' ? Number(Q.tierVal(q, d)) || 1 : 1;
  Q.qName = (q, d) => String(q.name).replace('{n}', () => { const v = Q.tierVal(q, d); return typeof v === 'number' ? Q.fmt(v) : v; });
  Q.activeOn = (q, d) => d >= q.since && (!q.until || d <= q.until);
  Q.scheduledOn = (q, d) => Q.activeOn(q, d) && q.days.includes(Q.dow(d));
  Q.isDue = (q, d) => Q.scheduledOn(q, d) && Q.getLog(d, q.id) !== 's' && !(q.key === 'meals' && Q.S.nutri && Q.S.nutri.off[d]);
  Q.isDone = (q, v, d) => q.type === 'count' ? (typeof v === 'number' && v >= Q.target(q, d)) : v === true;
  Q.editList = d => Q.S.quests.filter(q => Q.activeOn(q, d) || (q.since > d && !q.until));
  Q.mode = () => Q.MODES[Q.S.hero.mode] || Q.MODES.normal;
})(window.Q);
