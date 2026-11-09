(function (E) {
  'use strict';
  const { esc, ic } = E;
  const S = () => E.S;

  // ---------- quick add: the + in the middle of the bar ----------
  E.A.quick = () => {
    const tiles = [['tx-new', 'Expense', 'wallet', 'var(--ember)', 'data-type="exp"'], ['food-add', 'Food', 'utensils', 'var(--sand)', ''], ['new-task', 'Task', 'list-checks', 'var(--slate)', ''],
      ['new-event', 'Important date', 'calendar-check', 'var(--rose)', ''], ['weigh', 'Weight', 'scale', 'var(--sage)', ''], ['water-add', 'Glass of water', 'glass-water', 'var(--slate)', ''],
      ['tx-new', 'Income', 'coins', 'var(--good)', 'data-type="inc"'], ['new-note', 'Note', 'notebook-pen', 'var(--plum)', '']];
    E.sheet({ title: 'Add', body: `<div class="grid2">${tiles.map(([a, t, i, c, x]) => `<button class="card tap" style="margin:0;text-align:left;padding:16px" data-a="${a}" ${x}><div class="ico" style="--c:${c};margin-bottom:12px">${ic(i)}</div><div class="card-t">${t}</div></button>`).join('')}</div>` });
  };
  E.A['water-add'] = () => { E.close(true); const t = E.today(), v = E.log(t, 'water'); E.setLog(t, 'water', (typeof v === 'number' ? v : 0) + 1); E.save(); E.buzz(10); E.toast(`Water: ${(typeof v === 'number' ? v : 0) + 1} glasses`); E.render(); };

  // ---------- habits ----------
  E.A['habits-edit'] = () => {
    E.sheet({ title: 'Your habits', full: true, body: `<p class="hint" style="margin-top:0">Fewer habits done every day beat many done sometimes. Switch off what doesn't fit right now.</p>
      <div class="list">${S().habits.map(h => `<div class="habit ${h.off ? 'done' : ''}"><div class="ico sm" style="--c:${h.off ? 'var(--dim)' : 'var(--ember)'}">${ic(h.icon)}</div><button class="grow tap" style="text-align:left" data-a="habit-edit" data-id="${h.id}"><div class="t" style="text-decoration:none">${esc(h.name)}</div><div class="s">${daysTxt(h.days)}${h.off ? ' · off' : ''}</div></button>${ic('chevron-right', 'dim')}</div>`).join('')}</div>`,
      foot: `<button class="btn primary" data-a="habit-edit" data-id="">${ic('plus')} New habit</button>` });
  };
  const DAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']];
  const daysTxt = ds => ds.length === 7 ? 'Every day' : ds.length === 5 && !ds.includes(0) && !ds.includes(6) ? 'Weekdays' : DAYS.filter(d => ds.includes(d[0])).map(d => d[1]).join(', ');
  const ICONS = ['sparkles', 'book-open', 'dumbbell', 'person-standing', 'glass-water', 'brush', 'languages', 'rocket', 'heart', 'church', 'moon-star', 'sunrise', 'phone-off', 'feather', 'receipt', 'salad', 'footprints', 'brain', 'pen-line', 'music'];
  E.A['habit-edit'] = el => {
    const h = S().habits.find(x => x.id === el.dataset.id) || { type: 'check', target: 1, days: [0, 1, 2, 3, 4, 5, 6], icon: 'sparkles' };
    const fixedTime = h.time === 'wake' || h.time === 'wake+5' || h.time === 'sleep';
    E.sheet({ title: h.id ? 'Edit habit' : 'New habit', full: true, body: `
      ${E.field('Name', `<input id="hb-n" value="${esc(h.name || '')}" placeholder="e.g. Pray, stretch, journal">`)}
      ${E.field('Icon', E.chips('hb-i', ICONS.filter(E.hasIcon).map(i => [i, '', i]), h.icon))}
      ${E.field('Type', E.chips('hb-t', [['check', 'Done / not done'], ['count', 'A number']], h.type, { change: 'hb-type' }))}
      <div id="hb-cnt" style="${h.type === 'count' ? '' : 'display:none'}"><div class="grid2">${E.field('Daily goal', `<input id="hb-g" type="number" inputmode="numeric" value="${h.target || 1}">`)}${E.field('Unit', `<input id="hb-u" value="${esc(h.unit || '')}" placeholder="glasses, pages…">`)}</div></div>
      ${E.field('Days', E.chips('hb-d', DAYS, h.days.join(','), { multi: true }))}
      ${fixedTime ? `<p class="hint">Time follows your ${h.time === 'sleep' ? 'bedtime' : 'wake-up time'} in Settings.</p>` : E.field('Time (for order and reminder)', `<input id="hb-h" type="time" value="${h.time && h.time !== 'all' ? h.time : ''}">`, 'Leave empty for "through the day".')}
      ${E.field('Small version (for hard days)', `<input id="hb-m" value="${esc(h.min || '')}" placeholder="The 2-minute version">`)}`,
      foot: `${h.id ? `<button class="btn ghost" data-a="habit-off" data-id="${h.id}">${h.off ? 'Turn on' : 'Turn off'}</button>` : ''}<button class="btn primary" data-a="habit-save" data-id="${h.id || ''}">Save</button>` });
  };
  E.A['hb-type'] = b => { E.$('#hb-cnt').style.display = b.dataset.v === 'count' ? '' : 'none'; };
  E.A['habit-save'] = el => {
    const name = E.val('hb-n'), days = E.val('hb-d').split(',').filter(x => x !== '').map(Number); if (!name || !days.length) { E.toast('Add a name and at least one day'); return; }
    let h = S().habits.find(x => x.id === el.dataset.id); if (!h) { h = { id: E.uid(), since: E.today() }; S().habits.push(h); }
    const type = E.val('hb-t') || 'check';
    Object.assign(h, { name, icon: E.val('hb-i') || 'sparkles', type, target: type === 'count' ? Math.max(1, E.num('hb-g')) : 1, unit: E.val('hb-u') || h.unit || '', days, min: E.val('hb-m') });
    if (type === 'count' && !h.step) h.step = 1;
    const ht = E.$('#hb-h'); if (ht) h.time = ht.value || 'all';
    E.save(); E.close(true); E.toast('Saved'); E.render();
  };
  E.A['habit-off'] = el => { const h = S().habits.find(x => x.id === el.dataset.id); h.off = !h.off; E.save(); E.close(true); E.toast(h.off ? `${h.name} is off` : `${h.name} is back on`); E.render(); };

  // ---------- settings ----------
  E.A.settings = () => {
    const p = S().profile, st = S().settings;
    E.sheet({ title: 'Settings', full: true, body: `
      <div class="label" style="margin:0 4px 8px">Fresh start</div>
      <section class="card"><div class="card-t">Day 1: ${E.fmtDate(p.start, { weekday: 'long', day: 'numeric', month: 'long' })}</div><div class="small muted" style="margin:4px 0 12px">Pick any day. Habits before it don't count.</div>
        <div class="chips" style="margin-bottom:10px">${[[0, 'Today'], [1, 'Tomorrow'], [2, 'Day after'], [7, 'In a week']].map(([n, l]) => `<button class="chip ${p.start === E.add(E.today(), n) ? 'on' : ''}" data-a="start-set" data-d="${E.add(E.today(), n)}">${l}</button>`).join('')}</div>
        <div class="row" style="gap:8px"><input type="date" id="st-d" value="${p.start}" style="flex:1"><button class="btn primary sm" data-a="start-pick">Set</button></div></section>
      <div class="label" style="margin:22px 4px 8px">Your day</div>
      <div class="grid2">${E.field('Wake, Mon–Fri', `<input type="time" id="w-wd" value="${p.wake.wd}">`)}${E.field('Wake, weekend', `<input type="time" id="w-we" value="${p.wake.we}">`)}${E.field('Sleep, work nights', `<input type="time" id="s-wd" value="${p.sleep.wd}">`)}${E.field('Sleep, Fri & Sat', `<input type="time" id="s-we" value="${p.sleep.we}">`)}</div>
      <div class="grid2">${E.field('Name', `<input id="p-n" value="${esc(p.name)}">`)}${E.field('Goal weight (kg)', `<input id="p-g" type="number" inputmode="decimal" value="${p.goalKg}">`)}</div>
      <button class="btn ghost wide" data-a="profile-save">Save my day</button>
      <div class="label" style="margin:22px 4px 8px">Reminders</div>
      <div class="list">${E.item({ a: 'set-remind', icon: st.reminders ? 'bell' : 'bell-off', c: st.reminders ? 'var(--ember)' : 'var(--dim)', t: st.reminders ? 'Reminders are on' : 'Turn on reminders', s: 'Habits at their time, dates and tasks 1 day and 2 hours before, payday, evening check-in', r: st.reminders ? '<span class="good">On</span>' : '' })}</div>
      <div class="label" style="margin:22px 4px 8px">Look</div>
      ${E.chips('th', [['system', 'Match phone'], ['dark', 'Dark'], ['light', 'Light']], st.theme, { change: 'theme' })}
      <div class="label" style="margin:22px 4px 8px">Connections</div>
      <div class="list">
        ${E.item({ a: 'health-on', icon: 'heart-pulse', c: 'var(--sage)', t: 'Samsung Health', s: S().health.on ? 'Connected' : 'Steps, sleep, weight, heart rate', r: S().health.on ? '<span class="good">On</span>' : '' })}
        ${E.item({ a: 'cal-on', icon: 'calendar-days', c: 'var(--slate)', t: 'Google Calendar', s: S().cal.on ? 'Connected through your phone calendar' : 'Your dates in your calendar, your events here', r: S().cal.on ? '<span class="good">On</span>' : '' })}
      </div>
      <div class="label" style="margin:22px 4px 8px">More</div>
      <div class="list">
        ${E.item({ a: 'habits-edit', icon: 'list-checks', t: 'Habits', chev: true })}
        ${E.item({ a: 'go-week', icon: 'calendar-clock', t: 'Weekly schedule & meal times', chev: true })}
        ${E.item({ a: 'money-settings', icon: 'wallet', t: 'Money: rate, salary, budgets', chev: true })}
        ${E.item({ a: 'welcome', icon: 'flame', t: 'How Ember works', chev: true })}
        ${E.item({ a: 'backup', icon: 'download', t: 'Back up everything', s: 'Save a file you can restore later' })}
        ${E.item({ a: 'restore', icon: 'upload', t: 'Restore from a backup' })}
      </div>
      <button class="btn danger wide" style="margin-top:22px" data-a="reset">Erase everything</button>
      <p class="hint center" style="margin-top:14px">Ember · works fully offline · your data stays on this phone</p>` });
  };
  E.A['go-week'] = () => { E.close(true); E.go('plan', 'week'); };
  E.A.theme = b => { S().settings.theme = b.dataset.v; E.save(); E.applyTheme(); };
  E.applyTheme = () => { const t = S().settings.theme, dark = t === 'dark' || (t === 'system' && !matchMedia('(prefers-color-scheme: light)').matches); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; const m = E.$('meta[name=theme-color]'); if (m) m.content = dark ? '#13120f' : '#f3eee4'; try { const SB = window.Capacitor && window.Capacitor.Plugins.StatusBar; if (SB) SB.setStyle({ style: dark ? 'DARK' : 'LIGHT' }); } catch (e) { /* optional */ } };
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => E.applyTheme());
  E.A['profile-save'] = () => {
    const p = S().profile; p.wake = { wd: E.val('w-wd') || p.wake.wd, we: E.val('w-we') || p.wake.we }; p.sleep = { wd: E.val('s-wd') || p.sleep.wd, we: E.val('s-we') || p.sleep.we };
    p.name = E.val('p-n') || p.name; p.goalKg = E.num('p-g') || p.goalKg; E.save(); E.toast('Saved'); E.render();
  };
  const setStart = d => {
    if (!d) return; const t = E.today();
    if (d < t) { E.toast('Pick today or a later day'); return; }
    E.S.profile.start = d; E.save(); E.close(true); E.toast(d === t ? 'Day 1 is today. Let\'s go.' : `Day 1: ${E.fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}`); E.render(); E.A.settings();
  };
  E.A['start-set'] = el => setStart(el.dataset.d);
  E.A['start-pick'] = () => setStart(E.val('st-d'));
  E.A['set-remind'] = async () => {
    const st = S().settings;
    if (st.reminders) { st.reminders = false; E.save(); E.toast('Reminders off'); E.close(true); E.render(); if (E.schedule) E.schedule(); return; }
    const ok = E.askNotify ? await E.askNotify() : true;
    if (!ok) { E.toast('Allow notifications for Ember in phone settings'); return; }
    st.reminders = true; E.prepDone('remind'); E.save(); E.close(true); E.toast('Reminders on'); E.render(); if (E.schedule) E.schedule();
  };
  E.A.reset = () => E.confirm('Erase everything?', 'All your habits, food, money and notes on this phone will be deleted. Back up first if you might want them.', 'Erase', () => { localStorage.removeItem(E.KEY); E.S = E.seed(); E.save(); E.render(true); E.toast('Fresh start'); }, true);
  E.A.backup = async () => {
    const json = JSON.stringify(E.S), name = `ember-backup-${E.today()}.json`, P = window.Capacitor && window.Capacitor.Plugins;
    if (P && P.Filesystem && P.Share) { try { const r = await P.Filesystem.writeFile({ path: name, data: json, directory: 'CACHE', encoding: 'utf8' }); await P.Share.share({ title: 'Ember backup', url: r.uri }); return; } catch (e) { if (String(e && e.message).toLowerCase().includes('cancel')) return; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; a.click();
  };
  E.A.restore = () => E.$('#file').click();
  document.addEventListener('change', async e => {
    if (e.target.id !== 'file' || !e.target.files[0]) return;
    try { const d = JSON.parse(await e.target.files[0].text()); if (!d || !d.habits || !d.profile) throw 0; E.confirm('Restore this backup?', 'It replaces everything currently in Ember.', 'Restore', () => { E.replace(d); E.close(true); E.toast('Restored'); }); }
    catch (err) { E.toast('That file is not an Ember backup'); }
    e.target.value = '';
  });
})(window.E);
