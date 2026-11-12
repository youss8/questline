(function (E) {
  'use strict';
  const { esc, ic } = E;
  const S = () => E.S;
  const D = () => E.ui.tday || E.today();
  const H = id => S().habits.find(h => h.id === id);

  // ---------- the flame (same shape as the app icon) ----------
  E.emberArt = (stage, dim, bare) => {
    const s = [0.4, 0.55, 0.68, 0.8, 0.9, 1][stage], o = dim ? 0.45 : 1;
    const hearth = bare ? '' : '<path d="M380 846 Q512 898 644 846" fill="none" stroke="var(--sand)" stroke-width="34" stroke-linecap="round" opacity=".8"/>';
    if (stage === 0) return `<svg viewBox="0 0 1024 1024">${hearth}<circle cx="512" cy="${bare ? 560 : 760}" r="${bare ? 90 : 34}" fill="#f5cb98" opacity=".6"/></svg>`;
    return `<svg viewBox="0 0 1024 1024"><g class="glow" transform="translate(512 ${bare ? 520 : 760}) scale(${bare ? s * 1.25 : s}) translate(-512 ${bare ? -470 : -760})" opacity="${o}">
        <path d="M512 210 C590 318 690 392 676 530 C664 650 596 726 512 726 C428 726 360 650 348 530 C340 440 392 392 426 324 C440 392 470 424 494 426 C480 350 470 282 512 210 Z" fill="${bare ? '#f0a868' : 'var(--ember)'}"/>
        <path d="M512 452 C556 512 600 548 594 612 C588 672 554 702 512 702 C470 702 438 672 436 620 C434 574 466 552 480 512 C488 548 500 562 516 562 C508 524 502 488 512 452 Z" fill="${bare ? '#fde6c6' : 'var(--ember2)'}"/>
      </g>${hearth}</svg>`;
  };

  // ---------- sky header ----------
  const phase = () => { const h = E.now().getHours(); return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 16 ? 'day' : h >= 16 && h < 19 ? 'dusk' : 'night'; };
  const orb = () => {
    const n = E.now(), m = n.getHours() * 60 + n.getMinutes(), day = m >= 330 && m < 1110;
    const p = day ? (m - 330) / 780 : ((m + 1440 - 1110) % 1440) / 660;
    return `<div class="orb ${day ? '' : 'moon'}" style="left:${66 + p * 28}%;top:${40 - Math.sin(Math.PI * p) * 26}%"></div>`;
  };
  function sky(d) {
    const t = E.today(), isToday = d === t, em = E.ember(), sc = E.dayScore(d), started = E.started(d), ph = phase();
    const hr = E.now().getHours(), greet = hr < 5 ? 'Still up' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    const need = Math.max(0, Math.ceil(sc.due * E.KEEP) - sc.done - sc.mini), lit = sc.due > 0 && sc.p >= E.KEEP;
    let line, sub;
    if (!started) { line = `Day 1 is ${E.rel(S().profile.start).toLowerCase()}`; sub = 'Your plan is ready. Look around and set things up.'; }
    else if (!isToday) { line = d < t ? `${sc.done + sc.mini} of ${sc.due} habits done` : `${sc.due} habits planned`; sub = d < t ? (lit ? 'Fire kept that day.' : 'The fire dimmed that day.') : 'Planned around your fixed schedule.'; }
    else if (lit) { line = em.streak > 1 ? `${em.streak}-day fire` : 'Your fire is lit'; sub = sc.done + sc.mini >= sc.due ? 'Every habit done. Perfect day.' : `${sc.due - sc.done - sc.mini} more would make it a perfect day.`; }
    else { line = em.streak ? `${em.streak}-day fire` : 'Light your fire'; sub = em.dimmed ? `It dimmed yesterday. ${need} habit${need === 1 ? '' : 's'} today brings it back.` : `${need} more habit${need === 1 ? '' : 's'} to keep it lit today.`; }
    const sz = 78, r = 34, C = 2 * Math.PI * r;
    const days = Array.from({ length: 7 }, (_, i) => E.add(t, i - 3));
    return `<header class="sky ${ph}">${ph === 'night' ? '<div class="stars"></div>' : ''}${orb()}
      <div class="sky-top"><div><div class="sky-date">${E.fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}</div><h1>${isToday ? `${greet}, ${esc(S().profile.name)}` : E.rel(d)}</h1></div>
        <button class="sky-btn" data-a="settings" aria-label="Settings">${ic('settings')}</button></div>
      <div class="sky-stats"><div class="sky-ring"><svg class="rg" width="${sz}" height="${sz}"><circle cx="39" cy="39" r="${r}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="6"/><circle cx="39" cy="39" r="${r}" fill="none" stroke="#f5cb98" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - E.clamp(sc.p, 0, 1))).toFixed(1)}" style="transition:stroke-dashoffset .6s ease"/></svg><div class="fl">${E.emberArt(started ? Math.max(lit ? 1 : 0, E.emberStage(em.streak)) : 0, em.dimmed && !lit, true)}</div></div>
        <div class="grow"><div class="sky-line">${line}</div><div class="sky-sub">${sub}</div></div></div>
      <div class="wk">${days.map(x => { const st = em.days[x]; return `<button class="${x === d ? 'on' : ''} ${x > t ? 'fut' : ''}" data-a="tday" data-d="${x}">${x === t ? 'Today' : E.fmtDate(x, { weekday: 'short' })}<b>${E.parse(x).getDate()}</b><i class="${st === 'kept' || st === 'rest' ? 'kept' : st === 'dim' || st === 'out' ? 'dimd' : ''}"></i></button>`; }).join('')}</div>
    </header>`;
  }
  E.A.tday = el => { E.ui.tday = el.dataset.d === E.today() ? null : el.dataset.d; E.buzz(6); E.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // ---------- cards above the timeline ----------
  function coachCard() {
    const c = E.coach()[0]; if (!c) return '';
    return `<button class="coach" style="--c:${c.c}" data-a="go-coach"><div class="ico" style="--c:${c.c}">${ic(c.icon)}</div><div class="grow"><div class="t">${esc(c.title)}</div><div class="s">${esc(c.body)}</div></div>${ic('chevron-right', 'dim')}</button>`;
  }
  function moodCard() {
    if (S().mood[E.today()] || !E.started(E.today())) return '';
    const M = [['😞', 'Rough'], ['😕', 'Low'], ['😐', 'Okay'], ['🙂', 'Good'], ['😄', 'Great']];
    return `<section class="card" style="margin-top:14px;padding:14px 16px"><div class="card-t" style="font-size:14.5px">How do you feel right now?</div><div class="mood">${M.map((m, i) => `<button data-a="mood" data-v="${i + 1}"><b>${m[0]}</b>${m[1]}</button>`).join('')}</div></section>`;
  }
  E.A.mood = el => { S().mood[E.today()] = +el.dataset.v; E.save(); E.buzz(10); E.toast(['', 'Hard days pass. Do the small versions today.', 'Go easy. Just keep the fire lit.', 'Steady. One thing at a time.', 'Good. Use the energy.', 'Great. Make it count.'][+el.dataset.v]); E.render(); };
  const SETUP = [['rules', 'See how Ember works', 'welcome', 'flame'], ['remind', 'Turn on reminders', 'set-remind', 'bell'], ['health', 'Connect Samsung Health', 'health-on', 'heart-pulse'], ['cal', 'Connect Google Calendar', 'cal-on', 'calendar-days'],
    ['dates', 'Add your important dates', 'new-event', 'gift'], ['money', 'Set salary, rate and budgets', 'money-settings', 'wallet'], ['widget', 'Add the home-screen widget', 'widget-help', 'layout-grid']];
  E.setupLeft = () => S().settings.prepHide ? [] : SETUP.filter(i => !S().settings.prep[i[0]]);
  E.SETUPN = SETUP.length;
  function setupCard() {
    const pr = S().settings.prep, left = SETUP.filter(i => !pr[i[0]]); if (!left.length || S().settings.prepHide) return '';
    return `<button class="coach" style="--c:var(--slate)" data-a="setup"><div class="ico" style="--c:var(--slate)">${ic('wand-sparkles')}</div><div class="grow"><div class="t">Finish setting up · ${SETUP.length - left.length}/${SETUP.length}</div><div class="s">Next: ${left[0][1].toLowerCase()}</div></div>${ic('chevron-right', 'dim')}</button>`;
  }
  E.A.setup = () => { const pr = S().settings.prep; E.sheet({ title: 'Set up Ember', body: `<div class="list">${SETUP.map(([k, t, a, i]) => `<button class="item" data-a="${a}"><div class="ico sm" style="--c:${pr[k] ? 'var(--sage)' : 'var(--slate)'}">${ic(pr[k] ? 'check' : i)}</div><div class="grow"><div class="t" style="${pr[k] ? 'color:var(--muted);text-decoration:line-through' : ''}">${t}</div></div>${ic('chevron-right', 'dim')}</button>`).join('')}</div>`, foot: '<button class="btn ghost" data-a="setup-hide">Hide this card</button>' }); };
  E.A['setup-hide'] = () => { S().settings.prepHide = true; E.save(); E.close(true); E.render(); };
  E.prepDone = k => { if (!S().settings.prep[k]) { S().settings.prep[k] = true; E.save(); } };
  E.A['widget-help'] = () => { E.prepDone('widget'); E.sheet({ title: 'Add the widget', body: `<div class="list">${['Go to your phone\'s home screen.', 'Touch and hold an empty space.', 'Tap Widgets, then find Ember.', 'Drag "Today" onto the screen. You can tick habits right from it.'].map((s, i) => E.item({ icon: 'circle', sm: true, t: `${i + 1}. ${s}` })).join('')}</div>`, foot: '<button class="btn primary" data-a="close">Got it</button>' }); };
  E.A.welcome = () => { E.prepDone('rules'); E.sheet({ title: 'How Ember works', body: `
    <div class="list">
      ${E.item({ icon: 'calendar-clock', c: 'var(--slate)', t: 'Your day is planned for you', s: 'Today is one timeline. Work, class and meals are fixed; workouts, study and tasks are placed in your free time.' })}
      ${E.item({ icon: 'fast-forward', c: 'var(--plum)', t: 'Miss a slot? It moves', s: 'Anything you haven\'t done slides to the next free slot. No guilt, no red marks.' })}
      ${E.item({ icon: 'flame', t: 'Keep the fire lit', s: 'Do about 6 in 10 of the day\'s habits. The small version of a habit counts.' })}
      ${E.item({ icon: 'moon', c: 'var(--sand)', t: 'Never miss twice', s: 'One missed day dims the fire. Two in a row put it out.' })}
      ${E.item({ icon: 'message-circle', c: 'var(--sage)', t: 'The coach watches your week', s: 'It reads your sleep, food, money and habits and tells you the one thing worth fixing.' })}
    </div>`, foot: '<button class="btn primary" data-a="close">Let\'s go</button>' }); E.render(); };

  // ---------- anytime strip ----------
  function anyStrip(p, d) {
    if (!p.any.length) return '';
    return `<div class="any">${p.any.map(o => {
      const h = o.h, v = E.log(d, h.id), n = typeof v === 'number' ? v : 0, done = o.state === 'done' || o.state === 'mini';
      const auto = h.auto === 'steps' && S().health.on;
      const val = h.type === 'count' ? `${n >= 1000 ? E.n(n / 1000, 1) + 'k' : n}<small> / ${h.target >= 1000 ? h.target / 1000 + 'k' : h.target}</small>` : done ? 'Done' : '<small>Not yet</small>';
      return `<div class="any-c ${done ? 'done' : ''}"><button class="n" data-a="h-menu" data-id="${h.id}">${ic(h.icon)}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(h.name.split(' ').slice(0, 2).join(' '))}</span></button><div class="v">${val}</div>
        ${auto ? '' : `<button class="pl" data-a="${h.auto === 'money' && !done ? 'tx-new' : h.type === 'count' ? 'h-inc' : 'h-tap'}" data-type="exp" data-id="${h.id}" aria-label="${done ? 'Done' : 'Add'}">${ic(done ? 'check' : 'plus')}</button>`}</div>`;
    }).join('')}</div>`;
  }

  // ---------- timeline ----------
  const areaName = id => (S().areas.find(a => a.id === id) || { name: '' }).name;
  function tlItem(i, d, cur, now) {
    const isToday = d === E.today(), done = i.state === 'done' || i.state === 'mini', active = isToday && i.t <= now && (i.e || i.t) > now;
    const cls = `tl-i k-${i.kind} ${done ? 'done' : ''} ${cur ? 'cur' : ''} ${i.late ? 'late' : ''}`;
    const tm = `<div class="tm">${E.hm(i.t)}</div><div class="nd"></div>`;
    const chk = (a, on, half) => `<button class="check ${on ? 'on' : half ? 'half' : ''}" data-a="${a}" data-id="${i.id}" aria-label="Done">${on ? ic('check') : half ? ic('minus') : ''}</button>`;
    let inner;
    if (i.kind === 'habit') {
      const h = i.h, sub = i.state === 'mini' ? 'Small version' : i.late ? 'Missed its time · still counts if you do it' : i.moved ? `<span class="moved">Moved to fit your day</span>${i.dur ? ` · ${i.dur} min` : ''}` : i.pinned ? `You set this time${i.dur ? ` · ${i.dur} min` : ''}` : i.dur ? `${i.dur} min` : '';
      if (cur) inner = `<div class="tl-c"><div class="row"><button class="grow" data-a="h-menu" data-id="${h.id}"><div class="lbl">${active ? 'Now' : `Next · ${E.time12(E.hm(i.t))}`}</div><div class="t">${esc(i.title)}</div>${h.min ? `<div class="s">Hard day? ${esc(h.min)}</div>` : ''}</button>${chk('h-tap')}</div>
          <div class="row" style="gap:8px">${h.open ? `<button class="btn primary sm grow" data-a="open" data-v="${h.open}">${ic('play')} Start</button>` : ''}${h.min ? `<button class="btn sm grow" data-a="h-mini" data-id="${h.id}">${ic('feather')} Small version</button>` : ''}${i.dur ? `<button class="btn sm" data-a="h-move" data-id="${h.id}" aria-label="Move">${ic('clock')}</button>` : ''}</div></div>`;
      else inner = `<div class="tl-c"><button class="grow" data-a="h-menu" data-id="${h.id}"><div class="t">${esc(i.title)}</div>${sub ? `<div class="s">${sub}</div>` : ''}</button>${chk('h-tap', i.state === 'done', i.state === 'mini')}</div>`;
    } else if (i.kind === 'task') {
      inner = `<div class="tl-c"><button class="grow" data-a="edit-task" data-id="${i.id}">${cur ? `<div class="lbl">${active ? 'Now' : 'Next'} · task</div>` : ''}<div class="t">${i.pri && !done ? '<span class="ember">●</span> ' : ''}${esc(i.title)}</div><div class="s">${esc(areaName(i.area))}${i.overdue ? ' · <span class="bad">overdue</span>' : ''}${i.moved ? ' · <span class="moved">fitted in</span>' : ''}</div></button>${cur ? `<button class="btn sm" data-a="focus-new" data-task="${i.id}">${ic('timer')} Focus</button>` : ''}${chk('task-done', done)}</div>`;
    } else if (i.kind === 'meal') {
      inner = `<button class="tl-c" data-a="food-add" data-m="${i.meal}">${ic(i.icon, 'k')}<div class="grow">${cur ? `<div class="lbl">${active ? 'Now' : 'Next · ' + E.time12(E.hm(i.t))}</div>` : ''}<div class="t">${esc(i.title)}</div><div class="s">${done ? '' : cur ? 'Log it right after you eat' : 'Tap to log'}</div></div>${done ? `<span class="small muted">${E.n(i.kcal)} kcal</span>` : `<span class="round" style="width:34px;height:34px">${ic('plus')}</span>`}</button>`;
    } else if (i.kind === 'block') {
      inner = `<button class="tl-c" data-a="edit-block" data-id="${i.id}">${ic(i.icon, 'k')}<div class="grow"><div class="t">${esc(i.title)}</div><div class="s">${active ? `Now · ${E.time12(E.hm(i.e))} · ${Math.round((i.e - now) / 6) / 10} h left` : `until ${E.time12(E.hm(i.e))}`}</div>${active ? `<div style="margin-top:8px;display:flex">${E.bar(E.pct(now - i.t, i.e - i.t), i.c)}</div>` : ''}</div></button>`;
    } else if (i.kind === 'event') {
      inner = `<button class="tl-c" ${i.ro ? '' : `data-a="edit-event" data-id="${i.id}"`}>${ic(i.icon, 'k')}<div class="grow"><div class="t">${esc(i.title)}</div><div class="s">${E.time12(E.hm(i.t))}</div></div></button>`;
    } else inner = `<div class="tl-c">${ic('timer', 'k')}<div class="grow"><div class="t">Focus · ${esc(i.title)}</div></div><span class="small muted">${i.mins} min</span></div>`;
    return `<div class="${cls}" style="--c:${i.c}">${tm}${inner}</div>`;
  }
  function timeline(p, d) {
    const t = E.today(), isToday = d === t, now = E.nowMin(), nx = isToday ? E.nextUp() : null;
    let html = '', lineDone = !isToday;
    const nowLine = () => { lineDone = true; const g = p.gaps.find(x => x[0] <= now + 10 && x[1] - Math.max(now, x[0]) >= 30); return `<div class="tl-now"><span>${E.hm(now)}</span></div>${g ? `<div class="tl-gap"><button data-a="focus-new">${ic('timer')} Free until ${E.time12(E.hm(g[1]))} · start a focus session</button></div>` : ''}`; };
    for (const i of p.items) {
      if (!lineDone && i.t > now) html += nowLine();
      html += tlItem(i, d, nx && nx.key === i.key, now);
    }
    if (!lineDone) html += nowLine();
    return `<div class="tl">${html}</div>`;
  }

  E.screens.day = () => {
    const d = D(), t = E.today(), isToday = d === t, p = E.planDay(d), fn = S().focusNow;
    const extra = p.allDay.concat(p.unplaced);
    const eve = isToday && (E.nowMin() >= 20 * 60);
    return sky(d) +
      (fn ? `<button class="focus-bar" data-a="focus-open"><div class="ico sm" style="--c:var(--plum)">${ic('timer')}</div><div class="grow"><div class="card-t" style="font-size:14.5px">Focus running · ${esc(fn.label)}</div><div class="small muted">Tap to return</div></div>${ic('chevron-right', 'dim')}</button>` : '') +
      (isToday ? coachCard() + setupCard() + moodCard() : '') +
      anyStrip(p, d) +
      (extra.length ? `<div class="list" style="margin-top:14px">${p.allDay.map(o => E.item({ a: o.ro ? '' : o.kind === 'event' ? 'edit-event' : 'go-money', id: o.id, icon: o.icon, c: o.c, sm: true, t: esc(o.title), s: 'All day' })).join('')}${p.unplaced.map(o => E.item({ a: o.kind === 'habit' ? 'h-menu' : 'edit-task', id: o.id, icon: 'hourglass', c: 'var(--muted)', sm: true, t: esc(o.title), s: 'No free slot left today · do the small version or move it to tomorrow' })).join('')}</div>` : '') +
      E.secH(isToday ? 'Your day' : 'The plan', isToday ? 'Add' : '', 'quick') +
      timeline(p, d) +
      (eve ? `<button class="coach" style="--c:var(--sage);margin-top:6px" data-a="journal-open" data-d="${t}"><div class="ico" style="--c:var(--sage)">${ic('feather')}</div><div class="grow"><div class="t">${S().journal[t] ? 'Day closed' : 'Close your day'}</div><div class="s">${S().journal[t] ? esc(S().journal[t].win || 'Saved') : 'One win, one lesson, one thing for tomorrow.'}</div></div>${ic('chevron-right', 'dim')}</button>` : '') +
      `<section class="card quote" style="margin-top:14px"><p>“${esc(E.quoteOf(d))}”</p></section>`;
  };

  // ---------- celebrations ----------
  E.sparks = () => { const el = document.createElement('div'); el.className = 'sparks'; el.innerHTML = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2, r = 70 + Math.random() * 70; return `<i style="--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r}px;background:${i % 3 ? 'var(--ember)' : 'var(--ember2)'}"></i>`; }).join(''); document.body.appendChild(el); setTimeout(() => el.remove(), 1000); };
  const after = before => {
    const d = D(), sc = E.dayScore(d);
    E.save(); E.render();
    if (d !== E.today() || !E.started(d)) return;
    if (before < E.KEEP && sc.p >= E.KEEP) { E.sparks(); E.buzz(40); setTimeout(() => E.toast('🔥 Your fire is lit for today'), 120); }
    else if (sc.due && sc.done + sc.mini === sc.due && before < 1) { E.sparks(); setTimeout(() => E.toast('Every habit done. Perfect day.'), 120); }
  };
  const canEdit = () => { if (D() > E.today()) { E.toast('That day hasn\'t come yet'); return false; } return true; };

  // ---------- habit actions (work on the day you are looking at) ----------
  E.A['h-tap'] = el => { const h = H(el.dataset.id), d = D(); if (!h || !canEdit()) return; const b = E.dayScore(d).p, st = E.hState(h, d); E.setLog(d, h.id, st === 'none' || st === 'part' ? (h.type === 'count' ? h.target : true) : null); E.buzz(14); after(b); };
  E.A['h-inc'] = el => { const h = H(el.dataset.id), d = D(); if (!h || !canEdit()) return; const b = E.dayScore(d).p, v = E.log(d, h.id), n = typeof v === 'number' ? v : 0; if (n >= h.target) { E.A['h-set'](el); return; } E.setLog(d, h.id, Math.min(h.target * 3, n + (h.step || 1))); E.buzz(12); after(b); };
  E.A['h-set'] = el => { const h = H(el.dataset.id), v = E.log(D(), h.id); E.sheet({ title: esc(h.name), body: E.field(`How many ${esc(h.unit || '')} ${D() === E.today() ? 'today' : 'that day'}?`, `<input id="hv" type="number" inputmode="numeric" value="${typeof v === 'number' ? v : 0}" data-enter="h-save" style="font-size:26px;text-align:center">`), foot: `<button class="btn ghost" data-a="close">Cancel</button><button class="btn primary" data-a="h-save" data-id="${h.id}">Save</button>`, focus: 'hv' }); E.$('#hv').dataset.id = h.id; };
  E.A['h-save'] = el => { const id = el.dataset.id, d = D(), b = E.dayScore(d).p; E.setLog(d, id, Math.max(0, E.num('hv')) || null); E.close(true); after(b); };
  E.A['h-menu'] = el => {
    const h = H(el.dataset.id), d = D(), st = E.hState(h, d), r = E.habitRate(h, E.range(30)), strk = E.habitStreak(h);
    const days = E.range(35), heat = days.map(x => { if (!E.dueOn(h, x)) return '<i data-l="x"></i>'; const s = E.hState(h, x); return `<i data-l="${s === 'done' ? 3 : s === 'mini' ? 2 : s === 'part' ? 1 : 0}"></i>`; }).join('');
    E.sheet({ title: esc(E.hName(h, d)), body: `
      <div class="grid3" style="margin-bottom:14px"><div class="kpi"><small>Streak</small><b>${strk}</b></div><div class="kpi"><small>30 days</small><b>${r.p == null ? '—' : Math.round(r.p * 100) + '%'}</b></div><div class="kpi"><small>Done</small><b>${Math.round(r.ok)}×</b></div></div>
      ${days.length >= 14 ? `<div class="heat" style="grid-template-rows:repeat(7,14px);grid-auto-columns:14px;justify-content:start;margin:0 4px 16px">${heat}</div>` : ''}
      <div class="list">
        ${h.open ? E.item({ a: 'open', attrs: `data-v="${h.open}"`, icon: 'play', t: 'Start now', s: 'Opens the guided screen', chev: true }) : ''}
        ${st !== 'done' ? E.item({ a: 'h-done', id: h.id, icon: 'check', t: 'Mark as done' }) : E.item({ a: 'h-clear', id: h.id, icon: 'undo-2', c: 'var(--muted)', t: 'Undo' })}
        ${h.min && st !== 'done' ? E.item({ a: 'h-mini', id: h.id, icon: 'feather', c: 'var(--sage)', t: st === 'mini' ? 'Undo small version' : 'I did the small version', s: esc(h.min) + ' · still keeps your fire lit' }) : ''}
        ${h.dur && d >= E.today() && st === 'none' ? E.item({ a: 'h-move', id: h.id, icon: 'clock', c: 'var(--slate)', t: 'Move to another time', s: 'Just for this day' }) : ''}
        ${E.item({ a: 'habit-edit', id: h.id, icon: 'pencil', c: 'var(--muted)', t: 'Edit habit', s: 'Name, days, time, goal' })}
      </div>` });
  };
  E.A['h-done'] = el => { if (!canEdit()) return; const h = H(el.dataset.id), d = D(), b = E.dayScore(d).p; E.setLog(d, h.id, h.type === 'count' ? h.target : true); E.close(true); E.buzz(14); after(b); };
  E.A['h-clear'] = el => { E.setLog(D(), el.dataset.id, null); E.close(true); E.save(); E.render(); };
  E.A['h-mini'] = el => { if (!canEdit()) return; const d = D(), b = E.dayScore(d).p, cur = E.log(d, el.dataset.id); E.setLog(d, el.dataset.id, cur === 'mini' ? null : 'mini'); E.close(true); E.buzz(14); after(b); };
  E.A['h-move'] = el => { const h = H(el.dataset.id), d = D(), it = E.planDay(d).items.find(i => i.key === 'h:' + h.id); E.sheet({ title: 'Move · ' + esc(h.name), body: E.field('New time', `<input type="time" id="mv" value="${E.hm(it ? it.t : E.nowMin() + 30)}">`, 'Only for this day. The planner keeps everything else around it.'), foot: `<button class="btn ghost" data-a="h-unmove" data-id="${h.id}">Let Ember decide</button><button class="btn primary" data-a="h-move-ok" data-id="${h.id}">Move</button>` }); };
  E.A['h-move-ok'] = el => { const v = E.val('mv'); if (!v) return; let m = E.min(v); if (m < 4 * 60) m += 1440; E.movePlan(D(), 'h:' + el.dataset.id, m); E.save(); E.close(true); E.toast(`Moved to ${E.time12(v)}`); E.render(); };
  E.A['h-unmove'] = el => { E.movePlan(D(), 'h:' + el.dataset.id, null); E.save(); E.close(true); E.render(); };
  E.A.open = el => { E.close(true); const v = el.dataset.v; if (v === 'mobility') E.go('health', 'move'); else if (v === 'workout') { E.go('health', 'move'); E.A['wo-start'](); } else if (v === 'german') { E.go('grow', 'german'); E.A['de-start'](); } else if (v === 'courses') E.go('grow', 'career'); else if (v === 'books') E.go('grow', 'reading'); else if (v === 'money') E.go('money'); };
  E.autoMoney = d => { const h = H('money'); if (h && E.dueOn(h, d) && S().money.tx.some(t => t.date === d) && E.log(d, 'money') !== true) E.setLog(d, 'money', true); };
})(window.E);
