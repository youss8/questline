(function (E) {
  'use strict';
  const { esc, ic } = E;
  const S = () => E.S;
  const greet = () => { const h = E.now().getHours(); return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  // ---------- ember art: a soft flame whose size follows the streak ----------
  E.emberArt = (stage, dim) => {
    const s = [0.4, 0.55, 0.68, 0.8, 0.9, 1][stage], o = dim ? 0.45 : 1;
    const hearth = '<path d="M380 846 Q512 898 644 846" fill="none" stroke="var(--sand)" stroke-width="34" stroke-linecap="round" opacity=".8"/>';
    if (stage === 0) return `<svg viewBox="0 0 1024 1024">${hearth}<circle cx="512" cy="760" r="34" fill="var(--ember)" opacity=".55"/></svg>`;
    return `<svg viewBox="0 0 1024 1024"><defs><radialGradient id="eg" cx="50%" cy="58%" r="42%"><stop offset="0" stop-color="var(--ember2)" stop-opacity=".5"/><stop offset="1" stop-color="var(--ember)" stop-opacity="0"/></radialGradient></defs>
      <circle class="glow" cx="512" cy="560" r="${300 + stage * 40}" fill="url(#eg)" opacity="${o}"/>${hearth}
      <g transform="translate(512 760) scale(${s}) translate(-512 -760)" opacity="${o}">
        <path d="M512 210 C590 318 690 392 676 530 C664 650 596 726 512 726 C428 726 360 650 348 530 C340 440 392 392 426 324 C440 392 470 424 494 426 C480 350 470 282 512 210 Z" fill="var(--ember)"/>
        <path d="M512 452 C556 512 600 548 594 612 C588 672 554 702 512 702 C470 702 438 672 436 620 C434 574 466 552 480 512 C488 548 500 562 516 562 C508 524 502 488 512 452 Z" fill="var(--ember2)"/>
      </g></svg>`;
  };

  function emberCard() {
    const em = E.ember(), t = E.today(), sc = E.dayScore(t), stage = E.emberStage(em.streak), need = Math.max(0, Math.ceil(sc.due * E.KEEP) - sc.done - sc.mini);
    const lit = sc.due && sc.p >= E.KEEP;
    let line = lit ? `Kept for today. ${sc.done + sc.mini < sc.due ? 'Everything extra makes it stronger.' : 'Perfect day.'}` : `${need} more habit${need === 1 ? '' : 's'} to keep it lit today.`;
    if (!lit && em.dimmed) line = `It dimmed yesterday. ${need} more today and it comes back.`;
    if (!lit && em.out && em.streak === 0) line = `Light it again today: ${need} habit${need === 1 ? '' : 's'}.`;
    const days = Array.from({ length: 7 }, (_, i) => E.add(t, i - 6));
    return `<section class="card tint ember-card">
      <div class="ember-art">${E.emberArt(stage, em.dimmed && !lit)}</div>
      <div class="grow"><div class="mid">${em.streak ? `${em.streak}-day fire` : 'Your ember'}</div>
        <div class="small muted">${line}</div>
        <div class="dots7">${days.map(d => { const st = d < S().profile.start ? '' : em.days[d]; return `<i class="${st === 'kept' || st === 'rest' ? 'kept' : st === 'dim' ? 'dim' : ''} ${d === t ? 'today' : ''}">${E.fmtDate(d, { weekday: 'narrow' })}</i>`; }).join('')}</div></div>
    </section>`;
  }

  function moodCard() {
    const t = E.today(); if (S().mood[t]) return '';
    const M = [['😞', 'Rough'], ['😕', 'Low'], ['😐', 'Okay'], ['🙂', 'Good'], ['😄', 'Great']];
    return `<section class="card"><div class="card-t">How do you feel this morning?</div><div class="mood">${M.map((m, i) => `<button data-a="mood" data-v="${i + 1}"><b>${m[0]}</b>${m[1]}</button>`).join('')}</div></section>`;
  }
  E.A.mood = el => { S().mood[E.today()] = +el.dataset.v; E.save(); E.buzz(10); E.toast(['', 'Hard mornings pass. Small version today.', 'Go easy. Just keep the ember lit.', 'Steady. One habit at a time.', 'Nice. Use the energy.', 'Great. Make it count.'][+el.dataset.v]); E.render(); };

  function nextCard() {
    const n = E.nextUp(); if (!n) return '';
    const now = E.nowMin(), started = n.t <= now && (n.e == null || n.e > now);
    if (n.kind === 'habit') {
      const h = n.h;
      return `<section class="card next"><div class="ico" style="--c:var(--ember)">${ic(h.icon)}</div><div class="grow"><div class="when">${started ? 'Now' : E.time12(E.hm(n.t))}</div><div class="card-t">${esc(E.hName(h, E.today()))}</div>${h.min ? `<div class="small muted">Hard day? ${esc(h.min)}</div>` : ''}</div>
        ${h.open ? `<button class="btn primary sm" data-a="open" data-v="${h.open}">Start</button>` : h.type === 'check' ? `<button class="btn primary sm" data-a="h-tap" data-id="${h.id}">Done</button>` : ''}</section>`;
    }
    return `<section class="card next"><div class="ico" style="--c:${n.c}">${ic(n.icon)}</div><div class="grow"><div class="when">${started ? 'Now · until ' + E.time12(E.hm(n.e)) : E.time12(E.hm(n.t))}</div><div class="card-t">${esc(n.title)}</div></div></section>`;
  }

  // ---------- habit row ----------
  E.habitRow = (h, d) => {
    const st = E.hState(h, d), v = E.log(d, h.id), t = E.hTime(h, d);
    const sub = st === 'mini' ? 'Small version · counts' : h.auto === 'steps' && S().health.on ? 'From Samsung Health' : h.auto === 'money' ? 'Ticks itself when you log an expense' : t != null ? E.time12(E.hm(t)) : 'Through the day';
    let ctrl;
    if (h.type === 'count') {
      const n = typeof v === 'number' ? v : 0;
      ctrl = `<div class="count"><button class="n" data-a="h-set" data-id="${h.id}">${E.n(n)}<small>/${E.n(h.target)}</small></button><button class="round ${st === 'done' ? 'on' : ''}" data-a="h-inc" data-id="${h.id}" aria-label="Add">${ic(st === 'done' ? 'check' : 'plus')}</button></div>`;
    } else ctrl = `<button class="check ${st === 'done' ? 'on' : st === 'mini' ? 'half' : ''}" data-a="h-tap" data-id="${h.id}" aria-label="Done">${st === 'done' ? ic('check') : st === 'mini' ? ic('minus') : ''}</button>`;
    return `<div class="habit ${st === 'done' || st === 'mini' ? 'done' : ''}"><button class="grow tap" style="text-align:left" data-a="h-menu" data-id="${h.id}"><div class="t">${esc(E.hName(h, d))}</div><div class="s">${sub}</div></button>${ctrl}</div>`;
  };

  function prepCard() {
    const p = S().profile, n = E.diff(p.start, E.today()), pr = S().settings.prep;
    const items = [
      ['rules', 'Read how Ember works (1 min)', 'welcome'], ['remind', 'Turn on reminders', 'set-remind'], ['health', 'Connect Samsung Health', 'health-on'],
      ['cal', 'Connect Google Calendar', 'cal-on'], ['dates', 'Add important dates (birthdays, anniversary…)', 'new-event'],
      ['money', 'Set your salary, rate and budgets', 'money-settings'], ['groceries', 'Plan meals and buy groceries', 'go-food'], ['widget', 'Add the Ember widget to your home screen', 'widget-help']
    ];
    const done = items.filter(i => pr[i[0]]).length;
    return `<section class="card tint"><div class="row"><div class="ember-art" style="width:64px;height:64px">${E.emberArt(0)}</div><div class="grow">
        <div class="label">Fresh start</div><div class="mid">${n === 1 ? 'Tomorrow' : n === 0 ? 'Today' : E.fmtDate(p.start, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div class="small muted">${n > 1 ? `In ${n} days. ` : ''}Get ready now so Day 1 is easy.</div></div></div>
      <div class="progress-line" style="margin-top:14px">${E.bar(E.pct(done, items.length))}<span class="small muted">${done}/${items.length}</span></div></section>
      <div class="list" style="margin-top:12px">${items.map(([k, t, a]) => `<div class="habit ${pr[k] ? 'done' : ''}"><button class="grow tap" style="text-align:left" data-a="${a}"><div class="t">${t}</div></button><button class="check ${pr[k] ? 'on' : ''}" data-a="prep" data-k="${k}">${pr[k] ? ic('check') : ''}</button></div>`).join('')}</div>`;
  }
  E.A.prep = el => { const p = S().settings.prep; p[el.dataset.k] = !p[el.dataset.k]; E.save(); E.buzz(10); E.render(); };
  E.prepDone = k => { S().settings.prep[k] = true; E.save(); };
  E.A['go-food'] = () => { E.prepDone('groceries'); E.go('health', 'food'); E.ui.sub.food = 'prep'; E.render(); };
  E.A['widget-help'] = () => { E.prepDone('widget'); E.sheet({ title: 'Add the widget', body: `<ol class="muted" style="padding-left:20px;line-height:1.8"><li>Go to your home screen.</li><li>Touch and hold an empty space.</li><li>Tap <b>Widgets</b>, then find <b>Ember</b>.</li><li>Drag <b>Today</b> onto the screen. Tick habits right from there.</li></ol>`, foot: '<button class="btn primary" data-a="close">Got it</button>' }); };

  E.A.welcome = () => { E.prepDone('rules'); S().settings.welcomed = true; E.save(); E.sheet({ title: 'How Ember works', body: `
    <p class="muted">You tend a small fire every day. That's it.</p>
    <div class="list" style="margin-top:14px">
      ${E.item({ icon: 'flame', t: 'Keep it lit', s: 'Do about 6 in 10 of today\'s habits. The small version of a habit counts.' })}
      ${E.item({ icon: 'moon', c: 'var(--sand)', t: 'Never miss twice', s: 'Miss one day and your fire dims. Miss two in a row and it goes out. So after a bad day, the next day matters most.' })}
      ${E.item({ icon: 'feather', c: 'var(--sage)', t: 'Hard day? Go small', s: 'Tap a habit\'s name for its small version: 10 flashcards, one glass of water, 2 minutes of stretching.' })}
      ${E.item({ icon: 'sun-moon', c: 'var(--slate)', t: 'Look twice a day', s: 'Morning: check how you feel and what\'s next. Night: close the day with one win and one thing for tomorrow.' })}
    </div><p class="hint" style="margin-top:14px">Your fire grows: a spark at 1 day, a small flame at a week, a strong fire at 30, a bonfire at 66.</p>`, foot: '<button class="btn primary" data-a="close">Let\'s go</button>' }); E.render(); };

  function closeDayCard() {
    const t = E.today(), h = E.now().getHours(); if (h < 20 && h > 4) return '';
    const j = S().journal[t];
    return `<button class="card sage" style="display:block;width:100%;text-align:left" data-a="journal-open" data-d="${t}"><div class="row"><div class="ico" style="--c:var(--sage)">${ic('feather')}</div><div class="grow"><div class="card-t">${j ? 'Day closed' : 'Close your day'}</div><div class="small muted">${j ? esc(j.win || 'Saved') : 'One win, one lesson, one thing for tomorrow. 1 minute.'}</div></div>${ic('chevron-right', 'dim')}</div></button>`;
  }

  E.screens.today = () => {
    const t = E.today(), started = E.started(t);
    const hs = E.dayHabits(started ? t : S().profile.start);
    const ag = E.agenda(t).filter(a => !a.meal);
    const head = E.hdr(`${greet()}, ${esc(S().profile.name)}`, E.fmtDate(t, { weekday: 'long', day: 'numeric', month: 'long' }), `<button class="hdr-btn" data-a="settings" aria-label="Settings">${ic('settings')}</button>`);
    if (!started) {
      return head + prepCard() +
        E.secH('Your habits from Day 1') + `<div class="list">${hs.map(h => E.item({ icon: h.icon, sm: true, t: esc(E.hName(h, S().profile.start)), s: esc(h.min ? 'Small version: ' + h.min : '') })).join('')}</div>` +
        (ag.length ? E.secH('Today') + `<div class="list agenda">${ag.map(agendaRow).join('')}</div>` : '') +
        `<section class="card quote" style="margin-top:22px"><p>“${esc(E.quoteOf(t))}”</p></section>`;
    }
    const sc = E.dayScore(t);
    return head + emberCard() + moodCard() + nextCard() +
      E.secH(`Habits <span class="small muted" style="font-family:Inter;font-weight:600">${sc.done + sc.mini}/${sc.due}</span>`, 'Edit', 'habits-edit') +
      `<div class="list">${hs.map(h => E.habitRow(h, t)).join('') || '<p class="empty">No habits today. Rest.</p>'}</div>` +
      (ag.length ? E.secH('Today', 'Plan', 'go-plan') + `<div class="list agenda">${ag.map(agendaRow).join('')}</div>` : '') +
      `<div class="spacer"></div>${closeDayCard()}<section class="card quote" style="margin-top:12px"><p>“${esc(E.quoteOf(t))}”</p></section>`;
  };
  E.A['go-plan'] = () => E.go('plan', 'agenda');
  const agendaRow = a => {
    const now = E.nowMin(), cur = a.t != null && a.t <= now && (a.e || a.t + 30) > now;
    return `<button class="item" data-a="ag-open" data-kind="${a.kind}" data-id="${esc(a.id)}"><div class="time ${cur ? 'now' : ''}">${a.t != null ? E.hm(a.t) : '—'}</div><div class="ico sm" style="--c:${a.c}">${ic(a.icon)}</div><div class="grow"><div class="t">${esc(a.title)}</div>${a.e ? `<div class="s">until ${E.time12(E.hm(a.e))}</div>` : ''}</div></button>`;
  };
  E.agendaRow = agendaRow;

  // ---------- habit actions ----------
  const H = id => S().habits.find(h => h.id === id);
  const fx = () => { E.buzz(14); };
  const afterHabit = (before) => {
    const t = E.today(), sc = E.dayScore(t);
    E.save(); E.render();
    if (before < E.KEEP && sc.p >= E.KEEP && E.started(t)) setTimeout(() => E.toast('🔥 Your ember is lit for today'), 150);
    else if (sc.due && sc.done === sc.due && before < 1) setTimeout(() => E.toast('Every habit done. Perfect day.'), 150);
  };
  E.A['h-tap'] = el => {
    const h = H(el.dataset.id), d = E.today(); if (!h) return;
    const before = E.dayScore(d).p, st = E.hState(h, d);
    if (h.type === 'count') { E.setLog(d, h.id, st === 'done' ? null : h.target); }
    else E.setLog(d, h.id, st === 'none' ? true : null);
    fx(); afterHabit(before);
  };
  E.A['h-inc'] = el => {
    const h = H(el.dataset.id), d = E.today(); if (!h) return;
    const before = E.dayScore(d).p, v = E.log(d, h.id), n = typeof v === 'number' ? v : 0;
    if (n >= h.target) { E.A['h-set'](el); return; }
    E.setLog(d, h.id, n + (h.step || 1)); fx(); afterHabit(before);
  };
  E.A['h-set'] = el => {
    const h = H(el.dataset.id), d = E.today(), v = E.log(d, h.id);
    E.sheet({ title: h.name, body: E.field(`How many ${h.unit} today?`, `<input id="hv" type="number" inputmode="numeric" value="${typeof v === 'number' ? v : 0}" data-enter="h-save">`), foot: `<button class="btn ghost" data-a="close">Cancel</button><button class="btn primary" data-a="h-save" data-id="${h.id}">Save</button>`, focus: 'hv', onOpen: el2 => { el2.querySelector('[data-a="h-save"]').dataset.id = h.id; } });
    const i = document.getElementById('hv'); if (i) i.dataset.id = h.id;
  };
  E.A['h-save'] = el => { const id = el.dataset.id || (document.getElementById('hv') || {}).dataset.id, d = E.today(), before = E.dayScore(d).p; E.setLog(d, id, Math.max(0, E.num('hv')) || null); E.close(true); afterHabit(before); };
  E.A['h-menu'] = el => {
    const h = H(el.dataset.id), d = E.today(), st = E.hState(h, d);
    E.sheet({ title: esc(E.hName(h, d)), body: `
      ${h.why ? `<p class="muted" style="margin-bottom:14px">${esc(h.why)}</p>` : ''}
      <div class="list">
        ${h.open ? E.item({ a: 'open', attrs: `data-v="${h.open}"`, icon: 'play', t: 'Start now', s: 'Opens the guided screen', chev: true }) : ''}
        ${st !== 'done' ? E.item({ a: 'h-done', id: h.id, icon: 'check', t: 'Mark as done' }) : E.item({ a: 'h-clear', id: h.id, icon: 'rotate-ccw', c: 'var(--muted)', t: 'Undo' })}
        ${h.min && st !== 'done' ? E.item({ a: 'h-mini', id: h.id, icon: 'feather', c: 'var(--sage)', t: st === 'mini' ? 'Undo small version' : 'I did the small version', s: esc(h.min) + ' · still keeps your ember lit' }) : ''}
        ${E.item({ a: 'habit-edit', id: h.id, icon: 'pencil', c: 'var(--muted)', t: 'Edit habit', s: 'Name, days, time, goal' })}
      </div>` });
  };
  E.A['h-done'] = el => { const h = H(el.dataset.id), d = E.today(), b = E.dayScore(d).p; E.setLog(d, h.id, h.type === 'count' ? h.target : true); E.close(true); fx(); afterHabit(b); };
  E.A['h-clear'] = el => { E.setLog(E.today(), el.dataset.id, null); E.close(true); E.save(); E.render(); };
  E.A['h-mini'] = el => { const d = E.today(), b = E.dayScore(d).p, cur = E.log(d, el.dataset.id); E.setLog(d, el.dataset.id, cur === 'mini' ? null : 'mini'); E.close(true); fx(); afterHabit(b); };
  E.A.open = el => { E.close(true); const v = el.dataset.v; if (v === 'mobility') E.go('health', 'move'); else if (v === 'workout') { E.go('health', 'move'); E.A['wo-start'](); } else if (v === 'german') E.go('grow', 'german'); else if (v === 'courses') E.go('grow', 'career'); else if (v === 'books') E.go('grow', 'reading'); else if (v === 'money') E.go('money'); };
  // auto habits: logging money ticks the money habit; steps fill from health
  E.autoMoney = d => { const h = H('money'); if (h && E.dueOn(h, d) && S().money.tx.some(t => t.date === d)) { if (E.log(d, 'money') !== true) E.setLog(d, 'money', true); } };
})(window.E);
