(function (E) {
  'use strict';
  const { esc, ic } = E;
  const S = () => E.S, DE = () => E.S.de;
  const BOX = [0, 1, 3, 7, 16, 35];

  // ================= GERMAN =================
  const cards = () => E.DE_DECKS.flatMap(d => d.cards);
  const queue = () => {
    const s = DE().srs, t = E.today(), all = cards();
    const due = all.filter(c => s[c.id] && s[c.id].due <= t);
    const newToday = Object.values(s).filter(v => v.first === t).length;
    return { due, fresh: all.filter(c => !s[c.id]).slice(0, Math.max(0, 10 - newToday)) };
  };
  function germanView() {
    const s = DE().srs, q = queue(), known = Object.values(s).filter(v => v.b >= 3).length, total = cards().length, c = DE().course;
    const n = q.due.length + q.fresh.length;
    return `<section class="card tint"><div class="row" style="gap:18px">${E.ring(known / total, { size: 100, stroke: 9, label: known, sub: `of ${total} words`, fs: 24 })}
        <div class="grow"><div class="label">Today</div><div class="mid">${n ? `${n} cards` : 'All done'}</div><div class="small muted">${n ? `${q.due.length} to review, ${q.fresh.length} new · about ${Math.max(2, Math.round(n * 0.25))} min` : 'Come back tomorrow for new words.'}</div></div></div>
        <button class="btn primary wide" style="margin-top:16px" data-a="de-start" ${n ? '' : 'disabled'}>${ic('play')} Practice now</button></section>
      ${E.secH('Your course')}
      <section class="card"><div class="row" style="justify-content:space-between"><div><div class="card-t">${esc(c.name)}</div><div class="small muted">${c.left ? `${c.left} lesson${c.left === 1 ? '' : 's'} left${c.next ? ` · then ${esc(c.next)}` : ''}` : `Finished${c.next ? `. Next: ${esc(c.next)}` : ''}`}</div></div><button class="pill" data-a="de-course">${ic('pencil')} Edit</button></div>
        ${c.left ? `<button class="btn ghost wide" style="margin-top:14px" data-a="de-lesson">${ic('check')} I finished a lesson</button>` : `<button class="btn primary wide" style="margin-top:14px" data-a="de-next">Start ${esc(c.next || 'the next course')}</button>`}</section>
      ${E.secH('Word decks')}
      <div class="list">${E.DE_DECKS.map(d => { const k = d.cards.filter(x => s[x.id] && s[x.id].b >= 3).length; return `<button class="item" data-a="de-deck" data-id="${d.id}"><div class="grow"><div class="row" style="justify-content:space-between"><span class="t">${esc(d.n)}</span><span class="small muted">${k}/${d.cards.length}</span></div><div style="margin-top:7px">${E.bar(E.pct(k, d.cards.length), 'var(--plum)')}</div><div class="s">${d.lvl}</div></div></button>`; }).join('')}</div>
      ${E.secH('Grammar in one minute')}
      <div class="list">${E.DE_GRAMMAR.map(g => `<details class="acc"><summary>${esc(g.t)}</summary><div class="body">${g.b}</div></details>`).join('')}</div>
      ${E.secH('Phrases for work')}
      <div class="list">${E.DE_PHRASES.map(p => E.item({ t: esc(p[0]), s: esc(p[1]) })).join('')}</div>`;
  }
  E.A['de-start'] = () => { const q = queue(), list = q.due.concat(q.fresh).slice(0, 25).sort(() => Math.random() - 0.5); if (!list.length) { E.toast('No cards due. Come back tomorrow.'); return; } E.ui.de = { q: list, i: 0, show: false, n: 0 }; deSheet(); };
  const deSheet = () => {
    const r = E.ui.de, c = r.q[r.i];
    E.sheet({ title: 'German', full: true, body: `<div class="player"><div class="step">${r.i + 1} of ${r.q.length}</div>
      <button class="flash" style="width:100%" data-a="de-flip"><div class="w">${esc(c.de)}</div>${r.show ? `<div class="a">${esc(c.en)}</div>` : '<div class="h">Say it out loud, then tap to check</div>'}</button>
      ${E.bar(E.pct(r.i, r.q.length), 'var(--plum)')}</div>`,
      foot: r.show ? `<button class="btn ghost" data-a="de-ans" data-v="0">Again</button><button class="btn ghost" data-a="de-ans" data-v="1">Good</button><button class="btn primary" data-a="de-ans" data-v="2">Easy</button>` : `<button class="btn primary" data-a="de-flip">Show answer</button>` });
    E.onClose = () => { if (E.ui.de && E.ui.de.n) finishDe(true); E.ui.de = null; };
  };
  E.A['de-flip'] = () => { E.ui.de.show = true; deSheet(); };
  E.A['de-ans'] = el => {
    const r = E.ui.de, c = r.q[r.i], t = E.today(), v = +el.dataset.v, cur = DE().srs[c.id] || { b: 0, first: t };
    const b = v === 0 ? 0 : Math.min(5, cur.b + v);
    DE().srs[c.id] = { ...cur, b, due: E.add(t, v === 0 ? 0 : BOX[b]) }; DE().seen++; r.n++;
    if (v === 0) r.q.push(c);
    r.i++; r.show = false; E.buzz(8);
    if (r.i >= r.q.length) { finishDe(); return; }
    E.save(); deSheet();
  };
  const finishDe = (quiet) => {
    const n = E.ui.de.n; E.ui.de = null; E.onClose = null;
    if (n >= 10 && S().habits.some(h => h.id === 'german')) E.setLog(E.today(), 'german', n >= 15 ? true : 'mini');
    E.save(); if (!quiet) { E.close(true); } E.toast(`${n} cards done. Gut gemacht!`); E.render();
  };
  E.A['de-deck'] = el => { const d = E.DE_DECKS.find(x => x.id === el.dataset.id), s = DE().srs; E.sheet({ title: esc(d.n), full: true, body: `<div class="list">${d.cards.map(c => E.item({ t: esc(c.de), s: esc(c.en), r: s[c.id] ? (s[c.id].b >= 3 ? '<span class="good">Known</span>' : '<small>Learning</small>') : '' })).join('')}</div>` }); };
  E.A['de-lesson'] = () => { const c = DE().course; c.left = Math.max(0, c.left - 1); DE().lessons.push(E.today()); E.save(); E.buzz(15); E.toast(c.left ? `${c.left} to go` : `${c.name} done! 🎉`); E.render(); };
  E.A['de-next'] = () => { const c = DE().course; c.name = c.next || 'Next course'; c.next = ''; c.left = 8; E.save(); E.A['de-course'](); };
  E.A['de-course'] = () => { const c = DE().course; E.sheet({ title: 'German course', body: `${E.field('Current course', `<input id="dc-n" value="${esc(c.name)}">`)}${E.field('Lessons left', `<input id="dc-l" type="number" inputmode="numeric" value="${c.left}">`)}${E.field('Next course', `<input id="dc-x" value="${esc(c.next || '')}" placeholder="e.g. A1.2">`)}`, foot: '<button class="btn primary" data-a="dc-save">Save</button>' }); };
  E.A['dc-save'] = () => { const c = DE().course; c.name = E.val('dc-n') || c.name; c.left = Math.max(0, E.num('dc-l')); c.next = E.val('dc-x'); E.save(); E.close(true); E.render(); };

  // ================= CAREER =================
  function careerView() {
    const done = S().career.done;
    return `<p class="hint" style="margin-top:0">Your path to a strong developer job in Germany. One step at a time, during your career-learning slot.</p>
      ${E.secH('My courses', 'Add', 'course-new')}
      <div class="list">${S().courses.map(c => { const p = c.done / Math.max(1, c.total); return `<button class="item" data-a="course-open" data-id="${c.id}">${E.ring(p, { size: 46, stroke: 5, label: Math.round(p * 100) + '%', fs: 11 })}<div class="grow"><div class="t">${esc(c.n)}</div><div class="s">${c.done}/${c.total} ${esc(c.unit)}${c.by ? ' · ' + esc(c.by) : ''}${c.deadline ? ' · due ' + E.fmtDate(c.deadline) : ''}</div></div>${ic('chevron-right', 'dim')}</button>`; }).join('') || `<p class="empty">${ic('graduation-cap')}Add a course you're taking (Udemy, YouTube, a book…) to track it lesson by lesson.</p>`}</div>
      ${E.secH('Roadmaps')}
      ${E.ROADMAPS.map(r => { const k = r.steps.filter((_, i) => done[r.id + i]).length, open = E.ui.road === r.id, nx = r.steps.findIndex((_, i) => !done[r.id + i]);
        return `<div class="list" style="margin-bottom:12px"><button class="item" data-a="road" data-id="${r.id}"><div class="ico" style="--c:${r.c}">${ic(r.icon)}</div><div class="grow"><div class="t">${esc(r.n)}</div><div class="s">${k}/${r.steps.length}${nx >= 0 && !open ? ' · next: ' + esc(r.steps[nx]) : ''}</div><div style="margin-top:7px">${E.bar(E.pct(k, r.steps.length), r.c)}</div></div>${ic(open ? 'chevron-up' : 'chevron-down', 'dim')}</button>
          ${open ? r.steps.map((s, i) => `<div class="habit ${done[r.id + i] ? 'done' : ''}"><div class="grow"><div class="t" style="font-weight:500">${esc(s)}</div>${done[r.id + i] ? `<div class="s">Done ${E.fmtDate(done[r.id + i])}</div>` : ''}</div><button class="check ${done[r.id + i] ? 'on' : ''}" style="width:38px;height:38px" data-a="road-step" data-id="${r.id + i}">${done[r.id + i] ? ic('check') : ''}</button></div>`).join('') : ''}</div>`; }).join('')}`;
  }
  E.A.road = el => { E.ui.road = E.ui.road === el.dataset.id ? null : el.dataset.id; E.render(); };
  E.A['road-step'] = el => { const d = S().career.done; if (d[el.dataset.id]) delete d[el.dataset.id]; else { d[el.dataset.id] = E.today(); E.buzz(15); E.toast('Step done. Keep climbing.'); } E.save(); E.render(); };
  const courseForm = c => { c = c || {}; E.sheet({ title: c.id ? 'Edit course' : 'New course', body: `
    ${E.field('Course', `<input id="cs-n" value="${esc(c.n || '')}" placeholder="e.g. Docker for developers">`)}
    ${E.field('Where', `<input id="cs-b" value="${esc(c.by || '')}" placeholder="Udemy, YouTube, book…">`)}
    <div class="grid2">${E.field('Total', `<input id="cs-t" type="number" inputmode="numeric" value="${c.total || 20}">`)}${E.field('Done', `<input id="cs-d" type="number" inputmode="numeric" value="${c.done || 0}">`)}</div>
    ${E.field('Counted in', E.chips('cs-u', ['lessons', 'videos', 'chapters', 'hours'], c.unit || 'lessons'))}
    ${E.field('Finish by (optional)', `<input id="cs-l" type="date" value="${c.deadline || ''}">`)}`,
    foot: `${c.id ? `<button class="btn danger" data-a="course-del" data-id="${c.id}">Delete</button>` : ''}<button class="btn primary" data-a="course-save" data-id="${c.id || ''}">Save</button>`, focus: c.id ? null : 'cs-n' }); };
  E.A['course-new'] = () => courseForm();
  E.A['course-open'] = el => {
    const c = S().courses.find(x => x.id === el.dataset.id), left = c.total - c.done, dl = c.deadline ? E.diff(c.deadline, E.today()) : null;
    E.sheet({ title: esc(c.n), body: `<div class="row" style="gap:18px">${E.ring(c.done / c.total, { size: 96, stroke: 8, label: `${c.done}/${c.total}`, fs: 18 })}<div class="grow"><div class="small muted">${esc(c.by || '')}</div><div class="card-t">${left ? `${left} ${esc(c.unit)} left` : 'Completed 🎉'}</div>${dl != null && left ? `<div class="small ${dl < 7 ? 'bad' : 'muted'}">${dl > 0 ? `${Math.ceil(left / Math.max(1, dl / 7))} per week to finish by ${E.fmtDate(c.deadline)}` : 'Deadline passed'}</div>` : ''}</div></div>`,
      foot: `<button class="btn ghost" data-a="course-edit" data-id="${c.id}">Edit</button>${left ? `<button class="btn primary" data-a="course-step" data-id="${c.id}">${ic('check')} One ${esc(c.unit.replace(/s$/, ''))} done</button>` : ''}` });
  };
  E.A['course-edit'] = el => courseForm(S().courses.find(x => x.id === el.dataset.id));
  E.A['course-save'] = el => { const n = E.val('cs-n'), total = E.num('cs-t'); if (!n || !total) { E.toast('Add a name and total'); return; } let c = S().courses.find(x => x.id === el.dataset.id); if (!c) { c = { id: E.uid(), log: [] }; S().courses.push(c); } Object.assign(c, { n, by: E.val('cs-b'), total, done: E.clamp(E.num('cs-d'), 0, total), unit: E.val('cs-u') || 'lessons', deadline: E.val('cs-l') || null }); E.save(); E.close(true); E.render(); };
  E.A['course-del'] = el => { S().courses = S().courses.filter(c => c.id !== el.dataset.id); E.save(); E.close(true); E.render(); };
  E.A['course-step'] = el => { const c = S().courses.find(x => x.id === el.dataset.id); c.done = Math.min(c.total, c.done + 1); (c.log = c.log || []).push(E.today()); if (S().habits.some(h => h.id === 'career')) E.setLog(E.today(), 'career', true); E.save(); E.buzz(15); E.close(true); E.toast(c.done >= c.total ? `${c.n} completed! 🎓` : 'Nice. Logged.'); E.render(); };

  // ================= READING =================
  function readingView() {
    const B = S().books, cur = B.filter(b => !b.done), fin = B.filter(b => b.done);
    const today = E.log(E.today(), 'read');
    return `<section class="card tint"><div class="row" style="justify-content:space-between"><div><div class="label">Today</div><div class="mid">${typeof today === 'number' ? today : 0} pages</div></div><button class="btn primary sm" data-a="read-log" ${cur.length ? '' : 'disabled'}>${ic('plus')} Log pages</button></div></section>
      ${E.secH('Reading now', 'Add book', 'book-new')}
      <div class="list">${cur.map(b => `<button class="item" data-a="book-open" data-id="${b.id}"><div class="ico" style="--c:var(--sand)">${ic('book-open')}</div><div class="grow"><div class="t">${esc(b.n)}</div><div class="s">${esc(b.by || '')}${b.by ? ' · ' : ''}page ${b.page} of ${b.pages}</div><div style="margin-top:7px">${E.bar(E.pct(b.page, b.pages), 'var(--sand)')}</div></div></button>`).join('') || `<p class="empty">${ic('book-open')}Add the book you're reading. Pages you log count toward your reading habit.</p>`}</div>
      ${fin.length ? E.secH('Finished') + `<div class="list">${fin.map(b => E.item({ icon: 'badge-check', sm: true, c: 'var(--sage)', t: esc(b.n), s: b.doneAt ? E.fmtDate(b.doneAt, { month: 'long', year: 'numeric' }) : '' })).join('')}</div>` : ''}`;
  }
  const bookForm = b => { b = b || {}; E.sheet({ title: b.id ? 'Edit book' : 'New book', body: `${E.field('Title', `<input id="bk-n" value="${esc(b.n || '')}">`)}${E.field('Author', `<input id="bk-a" value="${esc(b.by || '')}">`)}<div class="grid2">${E.field('Pages', `<input id="bk-p" type="number" inputmode="numeric" value="${b.pages || 200}">`)}${E.field('Current page', `<input id="bk-c" type="number" inputmode="numeric" value="${b.page || 0}">`)}</div>`, foot: `${b.id ? `<button class="btn danger" data-a="book-del" data-id="${b.id}">Delete</button>` : ''}<button class="btn primary" data-a="book-save" data-id="${b.id || ''}">Save</button>`, focus: b.id ? null : 'bk-n' }); };
  E.A['book-new'] = () => bookForm();
  E.A['book-open'] = el => bookForm(S().books.find(b => b.id === el.dataset.id));
  E.A['book-save'] = el => { const n = E.val('bk-n'); if (!n) { E.toast('Add the title'); return; } let b = S().books.find(x => x.id === el.dataset.id); if (!b) { b = { id: E.uid() }; S().books.push(b); } Object.assign(b, { n, by: E.val('bk-a'), pages: Math.max(1, E.num('bk-p')), page: E.num('bk-c') }); E.save(); E.close(true); E.render(); };
  E.A['book-del'] = el => { S().books = S().books.filter(b => b.id !== el.dataset.id); E.save(); E.close(true); E.render(); };
  E.A['read-log'] = () => { const cur = S().books.filter(b => !b.done); E.sheet({ title: 'Log reading', body: `${E.field('Book', E.chips('rl-b', cur.map(b => [b.id, b.n]), cur[0].id))}${E.field('Pages read now', '<input id="rl-p" type="number" inputmode="numeric" value="10" style="font-size:24px;text-align:center" data-enter="read-save">')}`, foot: '<button class="btn primary" data-a="read-save">Save</button>', focus: 'rl-p' }); };
  E.A['read-save'] = () => { const b = S().books.find(x => x.id === E.val('rl-b')), n = E.num('rl-p'); if (!b || !n) return; b.page = Math.min(b.pages, b.page + n); if (b.page >= b.pages) { b.done = true; b.doneAt = E.today(); } const t = E.today(), v = E.log(t, 'read'); E.setLog(t, 'read', (typeof v === 'number' ? v : 0) + n); E.save(); E.close(true); E.toast(b.done ? `Finished ${b.n}! 📚` : `${n} pages. Page ${b.page}.`); E.render(); };

  // ================= JOURNAL =================
  const MOODS = ['', '😞', '😕', '😐', '🙂', '😄'];
  function journalView() {
    const t = E.today(), J = S().journal, days = Object.keys(J).sort().reverse().slice(0, 20);
    const last14 = Array.from({ length: 14 }, (_, i) => E.add(t, i - 13));
    return `<button class="card sage" style="display:block;width:100%;text-align:left" data-a="journal-open" data-d="${t}"><div class="row"><div class="ico" style="--c:var(--sage)">${ic('feather')}</div><div class="grow"><div class="card-t">${J[t] ? 'Today\'s page' : 'Write today\'s page'}</div><div class="small muted">${J[t] ? esc(J[t].win || '') : 'One win, one lesson, one thing for tomorrow'}</div></div>${ic('chevron-right', 'dim')}</div></button>
      ${E.secH('Mood, last 2 weeks')}<section class="card"><div class="days" style="grid-template-columns:repeat(14,1fr);gap:3px">${last14.map(d => `<div class="center"><div style="font-size:17px;line-height:1.6">${MOODS[S().mood[d]] || '<span class="dim">·</span>'}</div><div class="tiny dim">${E.parse(d).getDate()}</div></div>`).join('')}</div></section>
      ${E.secH('Past pages')}<div class="list">${days.map(d => E.item({ a: 'journal-open', attrs: `data-d="${d}"`, t: E.rel(d), s: esc(J[d].win || J[d].lesson || ''), r: MOODS[S().mood[d]] || '' })).join('') || `<p class="empty">${ic('feather')}Your pages will collect here.</p>`}</div>
      ${S().qfav.length ? E.secH('Saved quotes') + `<div class="list">${S().qfav.map(q => E.item({ t: `“${esc(q)}”` })).join('')}</div>` : ''}`;
  }
  E.A['journal-open'] = el => {
    const d = el.dataset.d, j = S().journal[d] || {};
    E.sheet({ title: E.rel(d), full: true, body: `
      ${E.field('A win today (any size)', `<textarea id="j-w" rows="2" placeholder="I did my mobility even though I was tired…">${esc(j.win || '')}</textarea>`)}
      ${E.field('What I learned or would do differently', `<textarea id="j-l" rows="2">${esc(j.lesson || '')}</textarea>`)}
      ${E.field('Grateful for', `<textarea id="j-g" rows="2">${esc(j.grat || '')}</textarea>`)}
      ${E.field('The one thing for tomorrow', `<input id="j-t" value="${esc(j.tomorrow || '')}" placeholder="If I only do one thing tomorrow…">`)}
      <label class="row" style="margin:4px"><input type="checkbox" id="j-q" style="width:22px;height:22px;accent-color:var(--ember)" ${S().qfav.includes(E.quoteOf(d)) ? 'checked' : ''}><span class="small">Save today's quote: “${esc(E.quoteOf(d))}”</span></label>`,
      foot: `<button class="btn primary" data-a="journal-save" data-d="${d}">Save</button>` });
  };
  E.A['journal-save'] = el => {
    const d = el.dataset.d, j = { win: E.val('j-w'), lesson: E.val('j-l'), grat: E.val('j-g'), tomorrow: E.val('j-t') };
    if (Object.values(j).some(Boolean)) S().journal[d] = j; else delete S().journal[d];
    const q = E.quoteOf(d), fav = S().qfav, i = fav.indexOf(q); if (E.$('#j-q').checked && i < 0) fav.push(q); if (!E.$('#j-q').checked && i >= 0) fav.splice(i, 1);
    if (j.tomorrow && d === E.today()) S().tasks.push({ id: E.uid(), t: j.tomorrow, area: 'personal', due: E.add(d, 1), pri: true, done: false, created: d });
    E.save(); E.close(true); E.toast(j.tomorrow && d === E.today() ? 'Saved. Tomorrow\'s one thing is in your plan.' : 'Saved'); E.render();
  };

  E.screens.grow = () => {
    const sub = E.subOf('grow', 'german');
    return `<button class="hdr-back" data-a="go-hub">${ic('chevron-left')} All</button>` + E.hdr('Grow', 'German, career, reading and reflection') + E.seg('grow', [['german', 'German'], ['career', 'Career'], ['reading', 'Reading'], ['journal', 'Journal']], sub) + '<div class="spacer"></div>' +
      (sub === 'career' ? careerView() : sub === 'reading' ? readingView() : sub === 'journal' ? journalView() : germanView());
  };
})(window.E);
