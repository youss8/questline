(function (Q) {
  'use strict';
  const { esc, ic } = Q;
  const X = () => Q.X();
  const BOX = [0, 1, 3, 7, 16, 35]; // days until next review per Leitner box

  // ================= GERMAN =================
  const allCards = () => Q.DE_DECKS.flatMap(d => d.cards.map(c => ({ ...c, deck: d.id })));
  const dueCards = () => {
    const s = X().de.srs, t = Q.today();
    const due = allCards().filter(c => s[c.id] && s[c.id].due <= t);
    const newToday = Object.values(s).filter(v => v.first === t).length;
    const fresh = allCards().filter(c => !s[c.id]).slice(0, Math.max(0, 12 - newToday));
    return { due, fresh };
  };
  function germanView() {
    const de = X().de, s = de.srs, { due, fresh } = dueCards(), run = Q.ui.de;
    if (run) return cardView(run);
    const known = Object.values(s).filter(v => v.b >= 3).length, total = allCards().length, learning = Object.keys(s).length;
    const L = de.lessons;
    return `<section class="card" style="display:flex;gap:16px;align-items:center">${Q.ring(known / total, { size: 108, label: known, sub: `of ${total} words` })}
        <div style="flex:1"><div class="kicker">Vocabulary</div><b style="font-size:17px">${due.length + fresh.length ? `${due.length} to review · ${fresh.length} new` : 'All caught up'}</b><p class="muted small">${learning} started · words move up a box each time you know them.</p>
        <button class="btn primary" data-act="de-start" ${due.length + fresh.length ? '' : 'disabled'} style="margin-top:8px">${ic('zap')} Study now</button></div></section>
      <section class="card"><div class="card-h"><div><div class="kicker">Course</div><b>${esc(L.course)} · ${L.left} lesson${L.left === 1 ? '' : 's'} left</b></div><button class="chip" data-act="de-course">${ic('pencil')}</button></div>
        <div class="bar"><i style="width:${Q.pct(L.done, L.done + L.left)}%"></i></div>
        <div class="actions"><button class="btn ghost" data-act="de-lesson" ${L.left ? '' : 'disabled'}>${ic('check')} Finished a lesson</button></div></section>
      <div class="sec"><span>Decks</span></div>
      <section class="card">${Q.DE_DECKS.map(d => { const n = d.cards.length, k = d.cards.filter(c => s[c.id] && s[c.id].b >= 3).length; return `<div class="li"><div class="dot" style="--dc:${d.lvl === 'A1.1' ? '#a78bfa' : '#22d3ee'}">${ic('book-a')}</div><div class="li-m"><b>${esc(d.n)}</b><small>${d.lvl} · ${k}/${n} known</small><div class="bar thin" style="margin-top:6px"><i style="width:${Q.pct(k, n)}%"></i></div></div><button class="chip" data-act="de-deck" data-id="${d.id}">Browse</button></div>`; }).join('')}</section>
      <div class="sec"><span>Grammar cheat sheet</span></div>
      <section class="card">${Q.DE_GRAMMAR.map(g => `<details class="gram"><summary>${esc(g.t)}</summary><p>${g.b}</p></details>`).join('')}</section>
      <div class="sec"><span>Useful phrases for work</span></div>
      <section class="card">${Q.DE_PHRASES.map(p => Q.li({ title: esc(p[0]), sub: esc(p[1]) })).join('')}</section>`;
  }
  function cardView(run) {
    const c = run.q[run.i];
    if (!c) return '';
    return `<section class="card c"><div class="kicker">${run.i + 1} / ${run.q.length}</div>
      <div class="flash" style="margin:14px 0" data-act="de-flip"><div class="w">${esc(run.rev ? c.en : c.de)}</div>${run.show ? `<div class="t" style="font-size:20px;color:var(--cyan)">${esc(run.rev ? c.de : c.en)}</div>` : '<div class="t">Tap to reveal</div>'}</div>
      ${run.show ? `<div class="actions"><button class="btn ghost" data-act="de-ans" data-v="0">Again</button><button class="btn ghost" data-act="de-ans" data-v="1">Good</button><button class="btn primary" data-act="de-ans" data-v="2">Easy</button></div>` : `<button class="btn primary wide" data-act="de-flip">Show answer</button>`}
      <button class="chip" data-act="de-quit" style="margin-top:12px">End session</button></section>`;
  }
  Q.ACTS['de-start'] = () => { const { due, fresh } = dueCards(); const q = due.concat(fresh).slice(0, 25); q.sort(() => Math.random() - 0.5); Q.ui.de = { q, i: 0, show: false, n: 0 }; Q.render(); window.scrollTo(0, 0); };
  Q.ACTS['de-flip'] = () => { if (Q.ui.de) { Q.ui.de.show = true; Q.render(); } };
  Q.ACTS['de-ans'] = el => {
    const run = Q.ui.de, c = run.q[run.i], de = X().de, t = Q.today(), v = +el.dataset.v;
    const cur = de.srs[c.id] || { b: 0, first: t };
    const b = v === 0 ? 0 : Math.min(BOX.length - 1, cur.b + v);
    de.srs[c.id] = { ...cur, b, due: Q.addDays(t, v === 0 ? 0 : BOX[b]) };
    de.seen = (de.seen || 0) + 1; run.n++;
    if (v === 0) run.q.push(c); // see it again this session
    run.i++; run.show = false; run.rev = Math.random() < 0.3 && b >= 2;
    if (run.i >= run.q.length) { finishDe(); return; }
    Q.save(); Q.render();
  };
  const finishDe = () => {
    const b = Q.game(), n = Q.ui.de.n; Q.ui.de = null;
    const gq = Q.S.quests.find(q => q.key === 'german' && Q.activeOn(q, Q.today())); if (gq && n >= 15) Q.setLog(Q.today(), gq.id, true);
    Q.save(); Q.toast(`Session done · ${n} reviews · +${n} XP`); Q.afterChange(b, { date: Q.today() });
  };
  Q.ACTS['de-quit'] = () => { if (Q.ui.de.n) finishDe(); else { Q.ui.de = null; Q.render(); } };
  Q.ACTS['de-deck'] = el => { const d = Q.DE_DECKS.find(z => z.id === el.dataset.id), s = X().de.srs; Q.sheet(`<h3>${esc(d.n)}</h3>${d.cards.map(c => Q.li({ title: esc(c.de), sub: esc(c.en), right: s[c.id] ? `<span class="tag">box ${s[c.id].b}</span>` : '' })).join('')}`, { full: true }); };
  Q.ACTS['de-lesson'] = el => { const L = X().de.lessons, b = Q.game(); L.done++; L.left = Math.max(0, L.left - 1); Q.save(); Q.celebrate(el, '+40 XP'); if (!L.left) Q.toast(`${L.course} complete! Tap the pencil to set your next course.`); Q.afterChange(b); };
  Q.ACTS['de-course'] = () => { const L = X().de.lessons; Q.sheet(`<h3>German course</h3>${Q.field('Course / level', `<input id="dc-c" value="${esc(L.course)}">`)}${Q.field('Lessons left', `<input id="dc-l" type="number" value="${L.left}">`)}<div class="actions"><button class="btn primary wide" data-act="de-course-save">Save</button></div>`); };
  Q.ACTS['de-course-save'] = () => { const L = X().de.lessons; L.course = Q.val('dc-c').trim() || L.course; L.left = Math.max(0, +Q.val('dc-l') || 0); Q.save(); Q.closeSheet(); Q.render(); };

  // ================= CAREER =================
  function careerView() {
    const done = X().career.done;
    const tot = Q.CAREER.reduce((a, p) => a + p.steps.length, 0), n = Object.keys(done).length;
    const open = Q.ui.path;
    return `<section class="card" style="display:flex;gap:16px;align-items:center">${Q.ring(n / tot, { size: 100, label: n, sub: `of ${tot} steps` })}<div><div class="kicker">Germany-ready</div><b style="font-size:17px">Career growth</b><p class="muted small">Each step is +25 XP. Small daily progress on CV, portfolio, skills and German work life.</p></div></section>
      ${Q.CAREER.map(p => { const k = p.steps.filter((s, i) => done[p.id + i]).length, isOpen = open === p.id; return `<section class="card"><div class="li" data-act="path-open" data-id="${p.id}"><div class="dot">${ic(p.icon)}</div><div class="li-m"><b>${esc(p.n)}</b><small>${k}/${p.steps.length} done</small><div class="bar thin" style="margin-top:6px"><i style="width:${Q.pct(k, p.steps.length)}%"></i></div></div>${ic(isOpen ? 'chevron-up' : 'chevron-down', 'chev')}</div>
        ${isOpen ? p.steps.map((s, i) => Q.li({ cb: !!done[p.id + i], cbAct: 'path-step', id: p.id + i, title: esc(s), sub: done[p.id + i] ? 'Done ' + Q.niceDate(done[p.id + i]) : '' })).join('') : ''}</section>`; }).join('')}`;
  }
  Q.ACTS['path-open'] = el => { Q.ui.path = Q.ui.path === el.dataset.id ? null : el.dataset.id; Q.render(); };
  Q.ACTS['path-step'] = el => { const d = X().career.done, id = el.dataset.id, b = Q.game(); if (d[id]) delete d[id]; else { d[id] = Q.today(); Q.celebrate(el, '+25 XP'); } Q.save(); Q.afterChange(b); };

  // ================= QUOTES =================
  const allQuotes = () => Q.QUOTES.map(q => [q.c, q.t]).concat(Q.QUOTES2);
  Q.moodQuote = () => {
    const t = Q.today(), ci = Q.S.checkins[t], cat = ci && Q.MOOD_CAT[ci.mood];
    const pool = cat ? Q.QUOTES2.filter(q => q[0] === cat) : allQuotes();
    return pool[Q.hash('mq' + t) % pool.length];
  };
  function quotesView() {
    const fav = X().qfav, cat = Q.ui.qcat || 'Today', mq = Q.moodQuote();
    const cats = ['Today', 'Favorites', ...Q.QUOTE_CATS];
    const list = cat === 'Favorites' ? allQuotes().filter(q => fav.includes(q[1])) : cat === 'Today' ? [] : allQuotes().filter(q => q[0] === cat);
    const ci = Q.S.checkins[Q.today()];
    return `<div class="tabs">${cats.map(c => `<button class="${c === cat ? 'on' : ''}" data-act="qcat" data-v="${c}">${c}</button>`).join('')}</div>
      ${cat === 'Today' ? `<section class="flash"><div class="kicker">${ci ? `Picked for your ${['', 'rough', 'low', 'okay', 'good', 'great'][ci.mood]} mood` : 'Quote of the day'}</div><div class="w" style="font-size:24px;line-height:1.25;margin-top:10px">“${esc(mq[1])}”</div><div class="t">${esc(mq[0])}</div><button class="chip" data-act="qfav" data-v="${esc(mq[1])}" style="margin-top:12px">${ic('heart')} ${fav.includes(mq[1]) ? 'Saved' : 'Save'}</button></section>
        ${ci ? '' : '<p class="hint c">Do the morning check-in on Today and the quote matches your mood.</p>'}` :
        `<section class="card">${list.map(q => Q.li({ title: `“${esc(q[1])}”`, sub: esc(q[0]), right: `<button class="x-del" data-act="qfav" data-v="${esc(q[1])}">${ic(fav.includes(q[1]) ? 'heart' : 'plus')}</button>` })).join('') || '<p class="empty">Nothing saved yet.</p>'}</section>`}`;
  }
  Q.ACTS.qcat = el => { Q.ui.qcat = el.dataset.v; Q.render(); };
  Q.ACTS.qfav = el => { const f = X().qfav, v = el.dataset.v, i = f.indexOf(v); if (i >= 0) f.splice(i, 1); else f.push(v); Q.save(); Q.render(); };

  // ================= REVIEW (stats) =================
  function reviewView() {
    const g = Q.game(), t = Q.today(), x = X();
    const start = Q.addDays(t, -7 * 26 - Q.dow(t)), cells = [];
    for (let d = start; d <= t; d = Q.addDays(d, 1)) { const i = g.days[d]; let l = 0; if (i && i.total) { const r = i.doneXp / Math.max(1, i.dueXp); l = i.perfect ? 4 : r >= 0.8 ? 3 : r >= 0.5 ? 2 : r > 0 ? 1 : 0; } cells.push(`<i data-l="${l}" title="${d}"></i>`); }
    const wk = d => Q.diffDays(t, d) < 7;
    const days7 = Array.from({ length: 7 }, (_, i) => g.days[Q.addDays(t, -i)]).filter(Boolean);
    const hab = days7.reduce((a, i) => a + i.done, 0), habT = days7.reduce((a, i) => a + i.total, 0);
    const spent = x.money.tx.filter(z => z.type === 'exp' && wk(z.date)).reduce((a, z) => a + (x.money.show === 'USD' ? (z.cur === 'USD' ? z.amt : z.amt / x.money.rate) : (z.cur === 'SYP' ? z.amt : z.amt * x.money.rate)), 0);
    const W = Q.S.weights.slice().sort((a, b) => a.d.localeCompare(b.d)), wNow = W[W.length - 1], wOld = W.filter(w => Q.diffDays(t, w.d) >= 7).pop();
    const moods = days7.map((_, i) => Q.S.checkins[Q.addDays(t, -i)]).filter(Boolean);
    const avgMood = moods.length ? Math.round(moods.reduce((a, m) => a + m.mood, 0) / moods.length * 10) / 10 : null;
    const kpi = (l, v) => `<div class="kpi"><small>${l}</small><b>${v}</b></div>`;
    return `<section class="card"><div class="card-h"><div><div class="kicker">Last 6 months</div><b>Consistency map</b></div><span class="tag">best streak ${g.best}</span></div><div class="heat">${cells.join('')}</div>
        <div class="tiny muted" style="margin-top:8px;display:flex;gap:10px;align-items:center">Less <span class="heat-k"><i></i><i data-l="1"></i><i data-l="2"></i><i data-l="3"></i><i data-l="4"></i></span> More</div></section>
      <div class="sec"><span>This week</span></div>
      <div class="kpis" style="margin-bottom:8px">${kpi('Habits', `${Q.pct(hab, habT)}%`)}${kpi('Workouts', x.train.logs.filter(l => wk(l.d)).length)}${kpi('Mobility', x.mob.logs.filter(l => wk(l.d)).length)}</div>
      <div class="kpis" style="margin-bottom:8px">${kpi('Tasks done', x.tasks.filter(k => k.done && k.doneAt && wk(k.doneAt)).length)}${kpi('Spent', Q.fmMoney ? Q.fmMoney(spent) : Math.round(spent))}${kpi('Avg mood', avgMood != null ? avgMood + '/5' : '—')}</div>
      <div class="kpis" style="margin-bottom:14px">${kpi('Weight', wNow ? wNow.kg + (wOld ? ` <small class="${wNow.kg <= wOld.kg ? 'good' : 'bad'}">${wNow.kg - wOld.kg > 0 ? '+' : ''}${Math.round((wNow.kg - wOld.kg) * 10) / 10}</small>` : '') : '—')}${kpi('Food days', Object.keys(x.diary).filter(wk).length + '/7')}${kpi('Level', g.level)}</div>
      <div class="sgrid"><button class="tile" data-act="open-you" data-m="journal">${ic('notebook-pen')}<b>Journal</b><small>Wins, gratitude, reflections</small></button><button class="tile" data-act="open-you" data-m="settings">${ic('download')}<b>Backup</b><small>Export everything to a file</small></button></div>`;
  }
  Q.ACTS['open-you'] = el => { Q.ui.tab = 'you'; Q.ui.sub = el.dataset.m; Q.render(); window.scrollTo(0, 0); };

  // ================= GROW TAB =================
  Q.VIEWS.grow = () => {
    const sub = Q.tabOf('grow', 'german');
    const bar = Q.tabsBar('grow', [['german', 'German', 'languages'], ['career', 'Career', 'rocket'], ['quotes', 'Quotes', 'feather'], ['review', 'Review', 'chart-no-axes-column']], sub);
    return Q.head('Grow') + bar + (sub === 'german' ? germanView() : sub === 'career' ? careerView() : sub === 'quotes' ? quotesView() : reviewView());
  };
})(window.Q);
