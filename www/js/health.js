(function (Q) {
  'use strict';
  // Samsung Health → Health Connect → Questline. Everything stays on the phone.
  const { esc, ic } = Q;
  const H = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Health;
  const X = () => Q.X();
  if (!X().health) X().health = { on: false, steps: {}, sleep: {}, rhr: null, last: 0 };
  const hx = () => { const h = X().health; h.steps = h.steps || {}; h.sleep = h.sleep || {}; return h; };
  const READ = ['steps', 'sleep', 'weight', 'heartRate', 'restingHeartRate'];
  const iso = ms => new Date(ms).toISOString();

  Q.healthSync = async (force) => {
    const p = H(), h = hx(); if (!p || !h.on) return;
    if (!force && Date.now() - h.last < 5 * 60000) return;
    const now = Date.now(), from = Q.parse(Q.addDays(Q.today(), -13)).getTime(), b = Q.game();
    try {
      const st = await p.queryAggregated({ dataType: 'steps', startDate: iso(from), endDate: iso(now), bucket: 'day', aggregation: 'sum' });
      for (const s of (st.samples || [])) h.steps[Q.ymd(new Date(s.startDate))] = Math.round(s.value || 0);
    } catch (e) { /* no steps permission */ }
    try {
      const sl = await p.readSamples({ dataType: 'sleep', startDate: iso(now - 8 * 864e5), endDate: iso(now), limit: 500 });
      const by = {};
      for (const s of (sl.samples || [])) {
        const state = String(s.sleepState || '').toLowerCase();
        if (state.includes('awake') || state.includes('out')) continue;
        const d = Q.ymd(new Date(s.endDate)); by[d] = (by[d] || 0) + (+s.value || (new Date(s.endDate) - new Date(s.startDate)) / 6e4);
      }
      for (const d in by) h.sleep[d] = Math.round(by[d]);
    } catch (e) { /* no sleep permission */ }
    try {
      const w = await p.readSamples({ dataType: 'weight', startDate: iso(now - 30 * 864e5), endDate: iso(now), limit: 60 });
      for (const s of (w.samples || [])) { const d = Q.ymd(new Date(s.startDate)), kg = Math.round(s.value * 10) / 10; if (kg > 30 && kg < 300 && !Q.S.weights.some(x => x.d === d)) Q.S.weights.push({ d, kg }); }
    } catch (e) { /* no weight permission */ }
    try {
      const r = await p.readSamples({ dataType: 'restingHeartRate', startDate: iso(now - 7 * 864e5), endDate: iso(now), limit: 20 });
      const L = (r.samples || []).sort((a, z) => String(a.startDate).localeCompare(String(z.startDate)));
      if (L.length) h.rhr = Math.round(L[L.length - 1].value);
    } catch (e) { /* optional */ }
    h.last = now;
    // steps habit fills itself from the phone
    const t = Q.today(), sq = Q.S.quests.find(q => q.key === 'steps' && Q.activeOn(q, t));
    if (sq && h.steps[t] != null) { const cur = Q.getLog(t, sq.id); if (cur !== 's' && (typeof cur !== 'number' || cur < h.steps[t])) Q.setLog(t, sq.id, h.steps[t]); }
    Q.save(); Q.afterChange ? Q.afterChange(b, { date: t }) : Q.render();
  };

  Q.ACTS['health-on'] = async () => {
    const p = H(); if (!p) { Q.toast('Health Connect works in the phone app only'); return; }
    let av; try { av = await p.isAvailable(); } catch (e) { av = { available: false }; }
    if (!av.available) {
      Q.sheet(`<h3>Install Health Connect first</h3><p class="muted">Samsung Health shares data through Google's <b>Health Connect</b>. On Android 14+ it's built in. On older phones, install "Health Connect by Android" from the Play Store, then come back.</p>
        <p class="muted">In Samsung Health: <b>Settings → Health Connect</b> → allow it to share steps, sleep, weight and heart rate.</p><div class="actions"><button class="btn primary wide" data-act="health-settings">Open Health Connect</button></div>`);
      return;
    }
    try { await p.requestAuthorization({ read: READ, write: [] }); } catch (e) { Q.toast('Permission was not given'); return; }
    hx().on = true; Q.save(); Q.toast('Connected. Syncing…'); await Q.healthSync(true); Q.render();
  };
  Q.ACTS['health-settings'] = () => { const p = H(); if (p && p.openHealthConnectSettings) p.openHealthConnectSettings().catch(() => {}); };
  Q.ACTS['health-sync'] = () => Q.healthSync(true).then(() => Q.toast('Synced'));
  Q.ACTS['health-off'] = () => { hx().on = false; Q.save(); Q.render(); };

  const hm = m => m ? `${Math.floor(m / 60)}h ${Q.pad(m % 60)}m` : '—';
  Q.healthToday = () => { const h = hx(); if (!h.on) return null; const t = Q.today(); return { steps: h.steps[t], sleep: h.sleep[t] }; };
  Q.healthCard = () => {
    if (!H()) return '';
    const h = hx(), t = Q.today();
    if (!h.on) return `<section class="card" style="display:flex;gap:12px;align-items:center"><div class="dot" style="--dc:#34d399">${ic('heart-pulse')}</div><div class="li-m" style="flex:1"><b>Connect Samsung Health</b><small class="muted">Steps, sleep, weight and heart rate, automatically.</small></div><button class="btn primary" data-act="health-on">Connect</button></section>`;
    const days = Array.from({ length: 7 }, (_, i) => Q.addDays(t, i - 6));
    const steps7 = days.map(d => h.steps[d] || 0), avg = Math.round(steps7.reduce((a, b) => a + b, 0) / 7);
    const sl7 = days.map(d => h.sleep[d]).filter(Boolean), slAvg = sl7.length ? Math.round(sl7.reduce((a, b) => a + b, 0) / sl7.length) : 0;
    const mx = Math.max(8000, ...steps7);
    return `<section class="card"><div class="card-h"><div><div class="kicker">Samsung Health</div><b>Today</b></div><button class="chip" data-act="health-sync">${ic('refresh-cw')} Sync</button></div>
      <div class="kpis"><div class="kpi"><small>Steps</small><b>${(h.steps[t] || 0).toLocaleString('en-US')}</b></div><div class="kpi"><small>Sleep</small><b>${hm(h.sleep[t])}</b></div><div class="kpi"><small>Resting HR</small><b>${h.rhr || '—'}</b></div></div>
      <div class="bars7">${steps7.map((v, i) => `<div><i style="height:${Math.max(4, v / mx * 100)}%" class="${v >= 8000 ? 'hit' : ''}"></i><span>${Q.niceDate(days[i], { weekday: 'narrow' })}</span></div>`).join('')}</div>
      <p class="tiny muted">7-day average ${avg.toLocaleString('en-US')} steps · sleep ${hm(slAvg)}</p></section>`;
  };
  Q.initHealth = () => {
    Q.healthSync(true);
    const A = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (A) A.addListener('resume', () => Q.healthSync());
  };
})(window.Q);
