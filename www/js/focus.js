(function (E) {
  'use strict';
  const { esc, ic } = E;
  const S = () => E.S;
  const KINDS = () => S().areas.filter(a => a.id !== 'personal').map(a => [a.id, a.name]).concat([['german', 'German'], ['career', 'Career learning'], ['read', 'Reading'], ['other', 'Something else']]);
  E.focusName = id => (KINDS().find(k => k[0] === id) || [0, 'Focus'])[1];
  let tick = null;

  E.A['focus-new'] = el => {
    E.close(true);
    if (S().focusNow) { E.A['focus-open'](); return; }
    const task = el && el.dataset && el.dataset.task ? S().tasks.find(k => k.id === el.dataset.task) : null;
    const area = task ? task.area : S().settings.lastFocus || 'career';
    E.sheet({ title: 'Focus session', body: `
      <p class="hint" style="margin-top:0">One thing, no phone, until the timer ends. The time is logged to that project.</p>
      ${E.field('What are you working on?', E.chips('fc-a', KINDS(), KINDS().some(k => k[0] === area) ? area : 'other'))}
      ${E.field('On what exactly? (optional)', `<input id="fc-l" value="${esc(task ? task.t : '')}" placeholder="e.g. Homepage hero section">`)}
      ${E.field('How long?', E.chips('fc-m', [[15, '15 min'], [25, '25 min'], [45, '45 min'], [60, '1 hour'], [90, '1.5 hours']], S().settings.lastFocusMin || 25))}`,
      foot: `<button class="btn primary" data-a="focus-start" data-task="${task ? task.id : ''}">${ic('play')} Start</button>` });
  };
  E.A['focus-start'] = el => {
    const mins = +E.val('fc-m') || 25, area = E.val('fc-a') || 'other', label = E.val('fc-l') || E.focusName(area);
    S().focusNow = { area, label, mins, start: Date.now(), end: Date.now() + mins * 60000, task: el.dataset.task || null };
    S().settings.lastFocus = area; S().settings.lastFocusMin = mins;
    E.save(); E.close(true); E.buzz(20); E.A['focus-open'](); E.render();
  };
  const left = () => { const f = S().focusNow; return f ? (f.paused != null ? f.paused : Math.max(0, f.end - Date.now())) : 0; };
  const fmt = ms => { const s = Math.ceil(ms / 1000); return `${E.pad(Math.floor(s / 60))}:${E.pad(s % 60)}`; };
  E.A['focus-open'] = () => {
    const f = S().focusNow; if (!f) return;
    const old = E.$('#focus'); if (old) old.remove();
    const sz = 250, r = 116, C = 2 * Math.PI * r;
    document.body.classList.add('focus-on');
    document.body.insertAdjacentHTML('beforeend', `<div id="focus">
      <div style="width:100%;display:flex;justify-content:space-between;align-items:center"><button class="hdr-btn" data-a="focus-min" aria-label="Back to app">${ic('chevron-down')}</button><span class="label">${esc(E.focusName(f.area))}</span><span style="width:44px"></span></div>
      <div><div class="ring" style="width:${sz}px;height:${sz}px;margin:0 auto"><svg width="${sz}" height="${sz}"><circle cx="125" cy="125" r="${r}" fill="none" stroke="var(--card2)" stroke-width="10"/><circle id="fc-ring" cx="125" cy="125" r="${r}" fill="none" stroke="var(--plum)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="0"/></svg><div class="v"><div class="ft" id="fc-t">${fmt(left())}</div><small>${f.paused != null ? 'paused' : 'stay with it'}</small></div></div>
        <h2 class="mid" style="margin-top:26px">${esc(f.label)}</h2><p class="muted small" style="margin-top:6px">Phone face down. One thing only.</p></div>
      <div style="width:100%;max-width:420px"><div class="grid2"><button class="btn" data-a="focus-pause">${f.paused != null ? ic('play') + ' Resume' : ic('pause') + ' Pause'}</button><button class="btn primary" data-a="focus-done">${ic('check')} Finish</button></div>
        <button class="btn ghost wide sm" style="margin-top:10px;border:0;color:var(--muted)" data-a="focus-cancel">Stop without saving</button></div></div>`);
    const paint = () => { const ff = S().focusNow, t = E.$('#fc-t'), ring = E.$('#fc-ring'); if (!ff || !t) { clearInterval(tick); return; } const l = left(); t.textContent = fmt(l); ring.setAttribute('stroke-dashoffset', (C * (1 - l / (ff.mins * 60000))).toFixed(1)); if (l <= 0 && ff.paused == null) finish(true); };
    clearInterval(tick); tick = setInterval(paint, 500); paint();
  };
  const hide = () => { clearInterval(tick); const o = E.$('#focus'); if (o) o.remove(); document.body.classList.remove('focus-on'); };
  E.A['focus-min'] = () => { hide(); E.render(); };
  E.A['focus-pause'] = () => { const f = S().focusNow; if (f.paused != null) { f.end = Date.now() + f.paused; delete f.paused; } else f.paused = Math.max(0, f.end - Date.now()); E.save(); E.A['focus-open'](); };
  E.A['focus-cancel'] = () => { S().focusNow = null; E.save(); hide(); E.toast('Session stopped'); E.render(); };
  E.A['focus-done'] = () => finish(false);
  const finish = auto => {
    const f = S().focusNow; if (!f) return;
    const mins = Math.round((f.mins * 60000 - left()) / 60000);
    S().focusNow = null; hide();
    if (mins < 1) { E.save(); E.toast('Too short to log'); E.render(); return; }
    (S().focus = S().focus || []).push({ d: E.today(), t: Math.max(0, E.nowMin() - mins), mins, area: f.area, label: f.label });
    const link = { german: 'german', career: 'career' }[f.area];
    if (link && S().habits.some(h => h.id === link && E.dueOn(h, E.today())) && E.hState(S().habits.find(h => h.id === link), E.today()) !== 'done') E.setLog(E.today(), link, mins >= 15 ? true : 'mini');
    E.save(); E.buzz(60); if (auto) E.sparks();
    const task = f.task && S().tasks.find(k => k.id === f.task && !k.done);
    if (task) E.sheet({ title: `${mins} minutes of focus`, body: `<p class="muted">Did you finish “${esc(task.t)}”?</p>`, foot: `<button class="btn ghost" data-a="close">Not yet</button><button class="btn primary" data-a="task-done" data-id="${task.id}" data-close="1">${ic('check')} Yes, done</button>` });
    else E.toast(`${mins} min of focus logged`);
    E.render();
  };
  // if a session ended while the app was closed, log it on return
  E.focusResume = () => { const f = S().focusNow; if (!f) return; if (f.paused == null && f.end <= Date.now()) finish(true); };
})(window.E);
