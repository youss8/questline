(function (E) {
  'use strict';
  const { esc, ic } = E;
  const S = () => E.S;
  const t0 = () => E.today();

  // one tile. `a` is the action when the tile itself is tapped; buttons inside keep their own action.
  const tile = (id, cls, a, attrs, html) => `<div class="bt ${cls}" data-tile="${id}" ${a ? `data-a="${a}" role="button" tabindex="0"` : ''} ${attrs || ''}>${html}</div>`;
  const lab = (icon, text) => `<small class="bl">${ic(icon)}${text}</small>`;
  const plus = (a, attrs, icon) => `<button class="bp" data-a="${a}" ${attrs || ''} aria-label="Add">${ic(icon || 'plus')}</button>`;
  const hm = m => `${Math.floor(m / 60)}h ${E.pad(Math.round(m % 60))}m`;
  const ringCss = p => `background:conic-gradient(currentColor 0 ${Math.round(E.clamp(p, 0, 1) * 100)}%, color-mix(in srgb, currentColor 18%, transparent) 0)`;

  // every tile, in dashboard order. Each returns '' when it has nothing to show.
  const TILES = [
    ['today', 'Today', () => {
      const d = t0(), sc = E.dayScore(d), em = E.ember(), n = E.nextUp(), started = E.started(d);
      if (!started) return tile('today', 'w o', 'settings', '', `${lab('flame', 'Fresh start')}<b>Day 1 is ${E.rel(S().profile.start).toLowerCase()}</b><em>Tap to change your start day</em>`);
      const lit = sc.due && sc.p >= E.KEEP, need = Math.max(0, Math.ceil(sc.due * E.KEEP) - sc.done - sc.mini);
      return tile('today', 'w o', 'go-day', '', `${lab('flame', em.streak ? `${em.streak}-day fire` : 'Today')}<b>${sc.done + sc.mini} of ${sc.due}</b><em>${lit ? (sc.done + sc.mini >= sc.due ? 'Perfect day. Everything done.' : 'Fire is lit. Keep going.') : `${need} more to keep your fire lit`}</em>
        <div class="bring" style="${ringCss(sc.p)}"><i>${Math.round(sc.p * 100)}%</i></div>`);
    }],
    ['next', 'Next up', () => {
      const n = E.nextUp(), d = t0(); if (!E.started(d)) return '';
      if (!n) return tile('next', 'w d', 'go-day', '', `${lab('circle-check', 'Next up')}<b class="sm">Nothing left on the plan</b><em>Rest, or add something with +</em>`);
      const now = E.nowMin(), act = n.t <= now, when = act ? 'Now' : `${E.time12(E.hm(n.t))} · in ${n.t - now >= 60 ? Math.round((n.t - now) / 6) / 10 + ' h' : (n.t - now) + ' min'}`;
      let btns = '';
      if (n.kind === 'habit') btns = `${n.h.open ? `<button class="bb pri" data-a="open" data-v="${n.h.open}">${ic('play')}Start</button>` : ''}<button class="bb ${n.h.open ? '' : 'pri'}" data-a="h-tap" data-id="${n.h.id}">${ic('check')}Done</button>${n.h.min ? `<button class="bb" data-a="h-mini" data-id="${n.h.id}">Small</button>` : ''}`;
      else if (n.kind === 'task') btns = `<button class="bb pri" data-a="focus-new" data-task="${n.id}">${ic('timer')}Focus</button><button class="bb" data-a="task-done" data-id="${n.id}">${ic('check')}Done</button>`;
      else if (n.kind === 'meal') btns = `<button class="bb pri" data-a="food-add" data-m="${n.meal}">${ic('plus')}Log ${esc(n.title.toLowerCase())}</button>`;
      return tile('next', 'w d', 'go-day', '', `${lab('zap', `Next up · ${when}`)}<b class="sm">${esc(n.title)}</b>${n.kind === 'habit' && n.h.min ? `<em>Hard day? ${esc(n.h.min)}</em>` : ''}<div class="brow">${btns}</div>`);
    }],
    ['setup', 'Setup checklist', () => {
      const left = E.setupLeft(); if (!left.length) return '';
      return tile('setup', 'w k', 'setup', '', `${lab('wand-sparkles', `Finish setting up · ${E.SETUPN - left.length}/${E.SETUPN}`)}<b class="sm">${left[0][1]}</b><em>Reminders, Samsung Health, calendar, budgets, widget</em>`);
    }],
    ['counters', 'Counters (water, teeth, steps…)', () => {
      const d = t0(); if (!E.started(d)) return '';
      return E.planDay(d).any.filter(o => o.h.auto !== 'money').map(o => {
        const h = o.h, v = E.log(d, h.id), n = typeof v === 'number' ? v : 0, done = o.state === 'done' || o.state === 'mini', auto = h.auto === 'steps' && S().health.on;
        const fmt = x => x >= 1000 ? E.n(x / 1000, 1) + 'k' : x;
        return tile('c-' + h.id, `c ${done ? 'o' : 'd'}`, 'h-menu', `data-id="${h.id}"`, `${lab(h.icon, esc(h.name.split(' ').slice(0, 2).join(' ')))}<b>${h.type === 'count' ? `${fmt(n)}<span>/${fmt(h.target)}</span>` : done ? 'Done' : '—'}</b>${auto ? '' : plus(h.type === 'count' ? 'h-inc' : 'h-tap', `data-id="${h.id}"`, done ? 'check' : 'plus')}`);
      }).join('');
    }],
    ['cal', 'Calories', () => {
      const T = E.targets(), f = E.dayFood(t0()), left = T.kcal - f.k;
      return tile('cal', 'd', 'go-health', '', `${lab('utensils', left >= 0 ? 'Calories left' : 'Calories over')}<b class="${left < 0 ? 'bad' : ''}">${E.n(Math.abs(left))}</b><em>Protein ${f.p} / ${T.p} g</em><div class="bbar"><i style="width:${E.pct(f.k, T.kcal)}%"></i></div>${plus('food-add')}`);
    }],
    ['weight', 'Weight', () => {
      const W = S().weights.slice().sort((a, b) => a.d.localeCompare(b.d)), now = W.length ? W[W.length - 1] : null, goal = S().profile.goalKg;
      const old = now && W.filter(w => E.diff(now.d, w.d) >= 6).pop(), ch = old ? now.kg - old.kg : null;
      let sub = `Goal ${goal} kg`;
      if (ch != null && ch !== 0) { const wk = E.diff(now.d, old.d) / 7, pace = -ch / wk; sub = `${ch < 0 ? '▼' : '▲'} ${E.n(Math.abs(ch), 1)} kg${pace > 0.15 && now.kg > goal ? ` · ~${Math.ceil((now.kg - goal) / pace)} weeks to ${goal}` : ''}`; }
      return tile('weight', 'm', 'weigh', '', `${lab('scale', 'Weight')}<b>${now ? E.n(now.kg, 1) : '—'}<span>kg</span></b><em>${sub}</em>`);
    }],
    ['spent', 'Money', () => {
      const t = t0(), days = Array.from({ length: 7 }, (_, i) => E.add(t, i - 6)), v = days.map(d => E.spentIn([d])), mx = Math.max(1, ...v);
      const ym = t.slice(0, 7), month = E.monthTx(ym).filter(x => x.type === 'exp').reduce((a, x) => a + E.conv(x.amt, x.cur), 0), bud = Object.values(S().money.budgets).reduce((a, b) => a + E.conv(b.amt, b.cur), 0);
      return tile('spent', 'd', 'go-money', '', `${lab('wallet', 'Spent today')}<b>${E.money(v[6])}</b><div class="bbars">${v.map((x, i) => `<i class="${i === 6 ? 'h' : ''}" style="height:${Math.max(8, x / mx * 100)}%"></i>`).join('')}</div><em>${bud ? `${E.money(Math.max(0, bud - month))} left this month` : `${E.money(month)} this month`}</em>${plus('tx-new', 'data-type="exp"')}`);
    }],
    ['focus', 'Focus', () => {
      const fn = S().focusNow, td = E.focusMins([t0()]), wk = E.focusMins(E.range(7));
      if (fn) return tile('focus', 'l', 'focus-open', '', `${lab('timer', 'Focus running')}<b class="sm">${esc(fn.label)}</b><em>Tap to return</em>`);
      return tile('focus', 'l', 'focus-new', '', `${lab('timer', 'Focus today')}<b>${td >= 60 ? hm(td) : td + '<span>min</span>'}</b><em>${wk} min this week · tap to start</em>`);
    }],
    ['german', 'German', () => {
      const s = S().de.srs, t = t0(), due = Object.values(s).filter(v => v.due <= t).length, newToday = Object.values(s).filter(v => v.first === t).length, n = due + Math.max(0, 10 - newToday), c = S().de.course;
      return tile('german', 'l', n ? 'de-start' : 'go-german', '', `${lab('languages', 'German')}<b>${n}<span>cards</span></b><em>${esc(c.name)} · ${c.left} lesson${c.left === 1 ? '' : 's'} left</em>`);
    }],
    ['tasks', 'Tasks', () => {
      const t = t0(), open = S().tasks.filter(k => !k.done), top = open.filter(k => k.due && k.due <= t).sort((a, b) => (b.pri ? 1 : 0) - (a.pri ? 1 : 0) || a.due.localeCompare(b.due)).slice(0, 3);
      return tile('tasks', 'w d', 'go-tasks', '', `${lab('list-checks', `Tasks · ${open.length} open`)}${top.length ? top.map(k => `<div class="btask"><button class="bchk" data-a="task-done" data-id="${k.id}" aria-label="Done"></button><span>${k.pri ? '<i class="ember">●</i> ' : ''}${esc(k.t)}</span>${k.due < t ? '<u>late</u>' : ''}</div>`).join('') : `<em style="margin-top:8px">${open.length ? 'Nothing due today.' : 'No tasks. Add one with +.'}</em>`}${plus('new-task')}`);
    }],
    ['workout', 'Workout', () => {
      const tr = S().train, day = E.PROGRAMS.home.days[tr.next % E.PROGRAMS.home.days.length], wk = tr.logs.filter(l => E.diff(t0(), l.d) < 7).length, did = tr.logs.some(l => l.d === t0());
      return tile('workout', did ? 'o' : 's', 'wo-start', '', `${lab('dumbbell', 'Workout')}<b class="sm">${did ? 'Done today' : esc(day.n)}</b><em>${wk} this week · ${did ? 'tap for another' : 'about 35 min'}</em>`);
    }],
    ['mobility', 'Mobility', () => {
      const did = S().mob.logs.some(l => l.d === t0()), wk = S().mob.logs.filter(l => E.diff(t0(), l.d) < 7).length;
      return tile('mobility', did ? 'o' : 'm', 'mob-start', 'data-k="reset"', `${lab('person-standing', 'Mobility')}<b class="sm">${did ? 'Done today' : 'Desk reset'}</b><em>${did ? `${wk} this week` : '8 min · back, hips, neck'}</em>`);
    }],
    ['dates', 'Next date', () => {
      const t = t0(), up = S().events.map(e => ({ e, d: E.nextOcc(e.date, e.repeat, t) })).filter(o => o.d).sort((a, b) => a.d.localeCompare(b.d))[0];
      if (!up) return tile('dates', 'r', 'new-event', '', `${lab('gift', 'Dates')}<b class="sm">Add a date</b><em>Birthdays, anniversary…</em>`);
      const n = E.diff(up.d, t);
      return tile('dates', 'r', 'go-dates', '', `${lab(E.evKind(up.e.kind).icon, 'Coming up')}<b>${n === 0 ? 'Today' : n}${n ? `<span>day${n === 1 ? '' : 's'}</span>` : ''}</b><em>${esc(up.e.title)}</em>`);
    }],
    ['body', 'Sleep & steps', () => {
      const h = S().health, t = t0();
      if (!h.on) return tile('body', 'k', 'health-on', '', `${lab('heart-pulse', 'Samsung Health')}<b class="sm">Connect</b><em>Sleep, steps, heart rate</em>`);
      return tile('body', 'k', 'go-move', '', `${lab('moon-star', 'Last night')}<b>${h.sleep[t] ? hm(h.sleep[t]) : '—'}</b><em>${E.n(h.steps[t] || 0)} steps${h.rhr ? ` · ${h.rhr} bpm` : ''}</em>`);
    }],
    ['mood', 'Mood', () => {
      const m = S().mood[t0()], M = ['😞', '😕', '😐', '🙂', '😄'];
      if (m) { const last = E.range(7).map(d => S().mood[d]).filter(Boolean); return tile('mood', 'd', 'go-journal', '', `${lab('heart', 'Mood')}<b>${M[m - 1]}</b><em>Week average ${E.n(E.avg(last), 1)} / 5</em>`); }
      return tile('mood', 'w d', '', '', `${lab('heart', 'How do you feel right now?')}<div class="bmood">${M.map((e, i) => `<button data-a="mood" data-v="${i + 1}">${e}</button>`).join('')}</div>`);
    }],
    ['fast', 'Fasting timer', () => {
      const f = S().fast;
      if (f.start) { const h = (Date.now() - f.start) / 36e5; return tile('fast', h >= f.goal ? 'o' : 's', 'fast-open', '', `${lab('hourglass', 'Fasting')}<b>${Math.floor(h)}h ${E.pad(Math.floor(h % 1 * 60))}m</b><em>${h >= f.goal ? 'Goal reached' : `Goal ${f.goal} h · until ${E.time12(E.hm((new Date(f.start + f.goal * 36e5)).getHours() * 60 + (new Date(f.start + f.goal * 36e5)).getMinutes()))}`}</em><div class="bbar"><i style="width:${E.pct(h, f.goal)}%"></i></div>`); }
      return tile('fast', 's', 'fast-open', '', `${lab('hourglass', 'Fasting')}<b class="sm">Start a fast</b><em>${f.log.length ? `Last: ${E.n(f.log[f.log.length - 1].h, 1)} h` : '12, 14, 16 or 18 hours'}</em>`);
    }],
    ['shop', 'Shopping list', () => {
      const L = S().shop, open = L.filter(x => !x.done);
      return tile('shop', 'd', 'shop-open', '', `${lab('shopping-cart', 'Shopping')}<b>${open.length}<span>to buy</span></b><em>${open.length ? esc(open.slice(0, 3).map(x => x.t).join(', ')) : 'List is empty'}</em>`);
    }],
    ['goals', 'Savings goals', () => {
      const G = S().money.goals, g = G[0];
      if (!g) return tile('goals', 'm', 'goals-open', '', `${lab('piggy-bank', 'Savings')}<b class="sm">Set a goal</b><em>Germany fund, laptop, gift…</em>`);
      return tile('goals', 'm', 'goals-open', '', `${lab('piggy-bank', esc(g.n))}<b>${E.pct(g.saved, g.target)}<span>%</span></b><em>${E.amtTxt(g.saved, g.cur)} of ${E.amtTxt(g.target, g.cur)}</em><div class="bbar"><i style="width:${E.pct(g.saved, g.target)}%"></i></div>`);
    }],
    ['read', 'Reading', () => {
      const b = S().books.find(x => !x.done);
      return tile('read', 'd', b ? 'read-log' : 'go-reading', '', `${lab('book-open', 'Reading')}<b class="sm">${b ? esc(b.n) : 'Add a book'}</b><em>${b ? `Page ${b.page} of ${b.pages}` : 'Track pages as you read'}</em>${b ? `<div class="bbar"><i style="width:${E.pct(b.page, b.pages)}%"></i></div>` : ''}`);
    }],
    ['career', 'Career', () => {
      const done = S().career.done, tot = E.ROADMAPS.reduce((a, r) => a + r.steps.length, 0), n = Object.keys(done).length, c = S().courses.find(x => x.done < x.total);
      return tile('career', 'k', 'go-career', '', `${lab('rocket', 'Career')}<b>${n}<span>/${tot} steps</span></b><em>${c ? `${esc(c.n)} · ${c.done}/${c.total}` : 'DevOps · Software · Cloud'}</em>`);
    }],
    ['coach', 'Coach', () => {
      const c = E.coach()[0]; if (!c) return '';
      return tile('coach', 'w d', 'go-coach', '', `${lab('message-circle', 'Coach')}<b class="sm" style="font-size:17px">${esc(c.title)}</b><em>${esc(c.body)}</em>`);
    }],
    ['miles', 'Milestones', () => {
      const m = E.milestones(), n = m.filter(x => x.ok).length, nx = m.find(x => !x.ok);
      return tile('miles', 'o', 'miles-open', '', `${lab('trophy', 'Milestones')}<b>${n}<span>/${m.length}</span></b><em>${nx ? `Next: ${esc(nx.t)}` : 'All earned'}</em>`);
    }],
    ['breathe', 'Breathe', () => tile('breathe', 'k', 'breathe', '', `${lab('wind', 'Breathe')}<b class="sm">1 minute</b><em>Calm down before sleep or focus</em>`)],
    ['journal', 'Journal', () => {
      const t = t0(), j = S().journal[t];
      return tile('journal', 'w d', 'journal-open', `data-d="${t}"`, `${lab('feather', j ? 'Day closed' : 'Close your day')}<b class="sm" style="font-size:17px">${j ? esc(j.win || 'Saved') : 'One win, one lesson, one thing for tomorrow'}</b>`);
    }],
    ['quote', 'Quote', () => tile('quote', 'w q', '', '', `<p>“${esc(E.quoteOf(t0()))}”</p>`)]
  ];
  E.TILES = TILES;

  E.screens.today = () => {
    const t = t0(), hid = new Set(S().settings.tilesHidden || []), hr = E.now().getHours();
    const greet = hr < 5 ? 'Still up' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    E.checkMilestones();
    return `<header class="bhead"><div><small>${E.fmtDate(t, { weekday: 'long', day: 'numeric', month: 'long' })}</small><h1>${greet}, ${esc(S().profile.name)}</h1></div><button class="hdr-btn" data-a="settings" aria-label="Settings">${ic('settings')}</button></header>
      <div class="bento">${TILES.filter(x => !hid.has(x[0])).map(x => { try { return x[2](); } catch (e) { console.error('tile', x[0], e); return ''; } }).join('')}</div>
      <button class="btn ghost wide" style="margin-top:14px" data-a="tiles-edit">${ic('layout-grid')} Customise dashboard</button>`;
  };
  E.A['go-day'] = () => { E.ui.tday = null; E.go('day'); };
  E.A['go-move'] = () => E.go('health', 'move');
  E.A['tiles-edit'] = () => {
    const hid = new Set(S().settings.tilesHidden || []);
    E.sheet({ title: 'Customise dashboard', full: true, body: `<p class="hint" style="margin-top:0">Switch off what you don't use. A lighter dashboard is easier to read.</p><div class="list">${TILES.map(([id, name]) => `<button class="item" data-a="tile-toggle" data-id="${id}"><div class="grow"><div class="t">${name}</div></div><span class="sw ${hid.has(id) ? '' : 'on'}"><i></i></span></button>`).join('')}</div>`, foot: '<button class="btn primary" data-a="close">Done</button>' });
    E.onClose = () => E.render();
  };
  E.A['tile-toggle'] = el => { const st = S().settings, h = st.tilesHidden = st.tilesHidden || [], i = h.indexOf(el.dataset.id); if (i >= 0) h.splice(i, 1); else h.push(el.dataset.id); E.save(); el.querySelector('.sw').classList.toggle('on', i >= 0); E.buzz(6); };
  // tiles act as buttons for keyboard users too
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.bt[data-a]')) { e.preventDefault(); e.target.click(); } });
})(window.E);
