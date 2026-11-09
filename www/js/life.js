(function (Q) {
  'use strict';
  const { esc, ic } = Q;
  const X = () => Q.X();
  const AREAS = [['Hope Center', 'landmark', '#38bdf8'], ['Freelance', 'laptop', '#a78bfa'], ['Scouts', 'compass', '#34d399'], ['CV & Portfolio', 'clipboard-list', '#22d3ee'], ['Work experience', 'briefcase', '#fbbf24'], ['German', 'languages', '#f472b6'], ['Personal', 'house', '#8f95ab']];
  const areaOf = n => AREAS.find(a => a[0] === n) || AREAS[AREAS.length - 1];

  // ================= TASKS =================
  function tasksView() {
    const x = X(), t = Q.today(), f = Q.ui.taskArea || 'All';
    const open = x.tasks.filter(k => !k.done && (f === 'All' || k.area === f));
    const sortK = k => (k.due || '9999') + (k.time || '99') + (3 - (k.pri || 1));
    open.sort((a, b) => sortK(a).localeCompare(sortK(b)));
    const groups = [['Overdue', open.filter(k => k.due && k.due < t)], ['Today', open.filter(k => k.due === t)], ['Next 7 days', open.filter(k => k.due && k.due > t && Q.diffDays(k.due, t) <= 7)], ['Later', open.filter(k => k.due && Q.diffDays(k.due, t) > 7)], ['No date', open.filter(k => !k.due)]];
    const done = x.tasks.filter(k => k.done && (f === 'All' || k.area === f)).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 10);
    const row = k => { const a = areaOf(k.area); return Q.li({ cb: !!k.done, cbAct: 'task-done', id: k.id, title: `${k.pri === 3 ? '🔥 ' : ''}${esc(k.t)}`, sub: `<span style="color:${a[2]}">${esc(k.area)}</span>${k.due ? ' · ' + Q.whenLabel(k.due) : ''}${k.time ? ' · ' + k.time : ''}${k.repeat && k.repeat !== 'none' ? ' · ↻ ' + k.repeat : ''}`, right: `<button class="x-del" data-act="task-edit" data-id="${k.id}">${ic('pencil')}</button>` }); };
    return `<div class="tabs" style="margin-bottom:10px">${['All', ...AREAS.map(a => a[0])].map(a => `<button class="${a === f ? 'on' : ''}" data-act="task-area" data-v="${a}">${esc(a)}</button>`).join('')}</div>
      <div class="kpis" style="margin-bottom:14px"><div class="kpi"><small>Open</small><b>${open.length}</b></div><div class="kpi"><small>Today</small><b>${groups[1][1].length + groups[0][1].length}</b></div><div class="kpi"><small>Done this week</small><b>${x.tasks.filter(k => k.done && k.doneAt && Q.diffDays(t, k.doneAt) < 7).length}</b></div></div>
      ${groups.filter(g => g[1].length).map(([n, L]) => `<div class="sec"><span>${n}</span><span>${L.length}</span></div><section class="card">${L.map(row).join('')}</section>`).join('') || '<p class="empty">No open tasks. Tap + to add your commitments.</p>'}
      ${done.length ? `<div class="sec"><span>Recently done</span></div><section class="card">${done.map(row).join('')}</section>` : ''}
      <div class="fab-space"></div><button class="fab" data-act="task-new" aria-label="New task">${ic('plus')}</button>`;
  }
  const taskSheet = k => Q.sheet(`<h3>${k ? 'Edit task' : 'New task'}</h3>
    ${Q.field('Task', `<input id="tk-t" value="${esc(k ? k.t : '')}" placeholder="e.g. Send XO Textiles homepage draft">`)}
    ${Q.field('Area', `<select id="tk-a">${Q.opts(AREAS.map(a => a[0]), k ? k.area : (Q.ui.taskArea && Q.ui.taskArea !== 'All' ? Q.ui.taskArea : 'Personal'))}</select>`)}
    <div class="sgrid">${Q.field('Due date', `<input id="tk-d" type="date" value="${k ? k.due || '' : Q.today()}">`)}${Q.field('Time (optional)', `<input id="tk-h" type="time" value="${k ? k.time || '' : ''}">`)}</div>
    <div class="sgrid">${Q.field('Priority', `<select id="tk-p">${Q.opts([[1, 'Normal'], [2, 'Important'], [3, 'Urgent']], k ? k.pri || 1 : 1)}</select>`)}${Q.field('Repeat', `<select id="tk-r">${Q.opts([['none', 'Never'], ['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']], k ? k.repeat || 'none' : 'none')}</select>`)}</div>
    ${Q.field('Notes', `<textarea id="tk-n" rows="2">${esc(k ? k.notes || '' : '')}</textarea>`)}
    <p class="hint">Reminders: 1 day before and 2 hours before (or the morning of, if no time).</p>
    <div class="actions">${k ? `<button class="btn ghost" data-act="task-del" data-id="${k.id}">Delete</button>` : ''}<button class="btn primary" data-act="task-save" data-id="${k ? k.id : ''}">Save</button></div>`);
  Q.ACTS['task-new'] = () => taskSheet(null);
  Q.ACTS['task-edit'] = el => taskSheet(X().tasks.find(k => k.id === el.dataset.id));
  Q.ACTS['task-area'] = el => { Q.ui.taskArea = el.dataset.v; Q.render(); };
  Q.ACTS['task-save'] = el => {
    const t = Q.val('tk-t').trim(); if (!t) { Q.toast('Write the task'); return; }
    const x = X(), id = el.dataset.id; let k = x.tasks.find(z => z.id === id);
    if (!k) { k = { id: Q.uid(), done: false, created: Q.today() }; x.tasks.push(k); }
    Object.assign(k, { t, area: Q.val('tk-a'), due: Q.val('tk-d') || null, time: Q.val('tk-h') || null, pri: +Q.val('tk-p') || 1, repeat: Q.val('tk-r'), notes: Q.val('tk-n') });
    Q.save(); Q.closeSheet(); Q.render();
  };
  Q.ACTS['task-del'] = el => { const x = X(); x.tasks = x.tasks.filter(k => k.id !== el.dataset.id); Q.save(); Q.closeSheet(); Q.render(); };
  Q.ACTS['task-done'] = el => {
    const x = X(), k = x.tasks.find(z => z.id === el.dataset.id); if (!k) return; const b = Q.game();
    if (!k.done && k.repeat && k.repeat !== 'none' && k.due) {
      // recurring: log a completed copy and move this one to the next date
      x.tasks.push({ ...k, id: Q.uid(), done: true, doneAt: Q.today(), repeat: 'none' });
      k.due = Q.nextOcc(k.due, k.repeat, Q.addDays(k.due, 1));
    } else { k.done = !k.done; k.doneAt = k.done ? Q.today() : null; }
    Q.save(); if (k.done || k.repeat) Q.celebrate(el, '+10 XP'); Q.afterChange(b);
  };

  // ================= DATES =================
  const KINDS = [['birthday', 'Birthday', 'cake', '#f472b6'], ['anniversary', 'Anniversary', 'heart', '#fb7185'], ['baby', 'Baby milestone', 'baby', '#fbbf24'], ['scouts', 'Scouts', 'compass', '#34d399'], ['work', 'Work / meeting', 'briefcase', '#38bdf8'], ['german', 'German class / exam', 'languages', '#a78bfa'], ['health', 'Health / doctor', 'heart-pulse', '#22d3ee'], ['bill', 'Bill / payment', 'receipt', '#fbbf24'], ['other', 'Other', 'calendar', '#8f95ab']];
  const kindOf = k => KINDS.find(z => z[0] === k) || KINDS[KINDS.length - 1];
  function datesView() {
    const x = X(), t = Q.today();
    const up = x.events.map(e => ({ e, d: Q.nextOcc(e.date, e.repeat, t) })).filter(o => o.d).sort((a, b) => a.d.localeCompare(b.d) || (a.e.time || '').localeCompare(b.e.time || ''));
    const past = x.events.filter(e => !Q.nextOcc(e.date, e.repeat, t)).slice(-5);
    // 5-week strip
    const start = Q.addDays(t, -Q.dow(t)), cells = [];
    const busy = {}; for (const o of up) busy[o.d] = (busy[o.d] || 0) + 1;
    for (const e of x.events) if (e.repeat && e.repeat !== 'none') for (let i = 0; i < 35; i++) { const d = Q.addDays(start, i); if (d >= t && Q.nextOcc(e.date, e.repeat, d) === d && !(up.find(o => o.e === e && o.d === d))) busy[d] = (busy[d] || 0) + 1; }
    for (let i = 0; i < 35; i++) { const d = Q.addDays(start, i); cells.push(`<div class="cal-c ${d === t ? 'now' : ''} ${d < t ? 'past' : ''}"><span>${Q.parse(d).getDate()}</span>${busy[d] ? `<i>${'•'.repeat(Math.min(3, busy[d]))}</i>` : ''}</div>`); }
    return `${Q.calCard ? Q.calCard() : ''}<section class="card"><div class="cal-h">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<span>${d}</span>`).join('')}</div><div class="cal">${cells.join('')}</div></section>
      <div class="sec"><span>Upcoming</span><span>${up.length}</span></div>
      <section class="card">${up.slice(0, 40).map(({ e, d }) => { const kd = kindOf(e.kind); return Q.li({ icon: kd[2], color: kd[3], title: esc(e.title), sub: `${Q.whenLabel(d)}${e.time ? ' · ' + e.time : ''}${e.repeat && e.repeat !== 'none' ? ' · ↻ ' + e.repeat : ''}`, right: `<button class="x-del" data-act="ev-edit" data-id="${e.id}">${ic('pencil')}</button>` }); }).join('') || '<p class="empty">Add birthdays, the anniversary, scout sessions, classes, appointments… everything, so nothing gets forgotten.</p>'}</section>
      ${past.length ? `<div class="sec"><span>Past</span></div><section class="card">${past.map(e => Q.li({ title: esc(e.title), sub: Q.niceDate(e.date), right: `<button class="x-del" data-act="ev-edit" data-id="${e.id}">${ic('pencil')}</button>` })).join('')}</section>` : ''}
      <div class="fab-space"></div><button class="fab" data-act="ev-new" aria-label="New date">${ic('plus')}</button>`;
  }
  const evSheet = e => Q.sheet(`<h3>${e ? 'Edit date' : 'New date'}</h3>
    ${Q.field('What', `<input id="ev-t" value="${esc(e ? e.title : '')}" placeholder="e.g. Miryam's birthday, Formation B session">`)}
    ${Q.field('Type', `<select id="ev-k">${Q.opts(KINDS.map(k => [k[0], k[1]]), e ? e.kind : 'other')}</select>`)}
    <div class="sgrid">${Q.field('Date', `<input id="ev-d" type="date" value="${e ? e.date : Q.today()}">`)}${Q.field('Time (optional)', `<input id="ev-h" type="time" value="${e ? e.time || '' : ''}">`)}</div>
    ${Q.field('Repeats', `<select id="ev-r">${Q.opts([['none', 'Once'], ['weekly', 'Every week'], ['monthly', 'Every month'], ['yearly', 'Every year']], e ? e.repeat || 'none' : 'none')}</select>`)}
    ${Q.field('Note', `<input id="ev-n" value="${esc(e ? e.note || '' : '')}" placeholder="Gift idea, place, what to bring…">`)}
    <p class="hint">You'll be reminded 1 day before and 2 hours before.</p>
    <div class="actions">${e ? `<button class="btn ghost" data-act="ev-del" data-id="${e.id}">Delete</button>` : ''}<button class="btn primary" data-act="ev-save" data-id="${e ? e.id : ''}">Save</button></div>`);
  Q.ACTS['ev-new'] = () => evSheet(null);
  Q.ACTS['ev-edit'] = el => evSheet(X().events.find(e => e.id === el.dataset.id));
  Q.ACTS['ev-save'] = el => {
    const title = Q.val('ev-t').trim(), date = Q.val('ev-d'); if (!title || !date) { Q.toast('Name and date are needed'); return; }
    const x = X(); let e = x.events.find(z => z.id === el.dataset.id);
    if (!e) { e = { id: Q.uid() }; x.events.push(e); }
    Object.assign(e, { title, date, kind: Q.val('ev-k'), time: Q.val('ev-h') || null, repeat: Q.val('ev-r'), note: Q.val('ev-n') });
    Q.save(); Q.closeSheet(); Q.render();
  };
  Q.ACTS['ev-del'] = el => { const x = X(); x.events = x.events.filter(e => e.id !== el.dataset.id); Q.save(); Q.closeSheet(); Q.render(); };

  // ================= MONEY =================
  const CATS = [['Food', 'utensils', '#fbbf24'], ['Transport', 'car', '#38bdf8'], ['Bills', 'receipt', '#fb7185'], ['Home', 'house', '#a78bfa'], ['Health', 'heart-pulse', '#22d3ee'], ['Gym & sport', 'dumbbell', '#34d399'], ['Learning', 'graduation-cap', '#c4b5fd'], ['Gifts & dates', 'gift', '#f472b6'], ['Baby', 'baby', '#fde68a'], ['Subscriptions', 'repeat', '#60a5fa'], ['Clothes', 'shopping-cart', '#fca5a5'], ['Fun', 'popcorn', '#f9a8d4'], ['Other', 'package', '#8f95ab']];
  const INCATS = ['Salary', 'Freelance', 'Gift', 'Resale', 'Other income'];
  const catOf = c => CATS.find(z => z[0] === c) || [c, 'coins', '#34d399'];
  const toShow = (amt, cur) => { const m = X().money, r = m.rate || 1; if (cur === m.show) return amt; return m.show === 'USD' ? amt / r : amt * r; };
  const fm = n => { const m = X().money; return m.show === 'USD' ? `$${(Math.round(n * 100) / 100).toLocaleString('en-US')}` : `${Math.round(n).toLocaleString('en-US')} SYP`; };
  Q.fmMoney = fm;
  function moneyView() {
    const x = X(), m = x.money, t = Q.today(), mon = Q.ui.mon || t.slice(0, 7);
    const tx = m.tx.filter(z => z.date.startsWith(mon)).sort((a, b) => b.date.localeCompare(a.date) || b.t - a.t);
    const spent = tx.filter(z => z.type === 'exp').reduce((a, z) => a + toShow(z.amt, z.cur), 0);
    const inc = tx.filter(z => z.type === 'inc').reduce((a, z) => a + toShow(z.amt, z.cur), 0);
    const byCat = {}; for (const z of tx) if (z.type === 'exp') byCat[z.cat] = (byCat[z.cat] || 0) + toShow(z.amt, z.cur);
    const budgetTot = Object.values(m.budgets).reduce((a, b) => a + toShow(b.amt, b.cur), 0);
    const dIn = Q.parse(mon + '-01'), daysIn = new Date(dIn.getFullYear(), dIn.getMonth() + 1, 0).getDate(), dayNo = mon === t.slice(0, 7) ? Q.parse(t).getDate() : daysIn;
    const ml = Q.parse(mon + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const shift = n => { const z = Q.parse(mon + '-01'); z.setMonth(z.getMonth() + n); return Q.ymd(z).slice(0, 7); };
    return `<div class="daynav"><button data-act="mon" data-v="${shift(-1)}">${ic('chevron-left')}</button><b>${ml}</b><button data-act="mon" data-v="${shift(1)}" ${mon >= t.slice(0, 7) ? 'disabled' : ''}>${ic('chevron-right')}</button></div>
      <section class="card" style="display:flex;gap:16px;align-items:center">
        ${Q.ring(budgetTot ? spent / budgetTot : 0, { size: 116, label: budgetTot ? Q.pct(spent, budgetTot) + '%' : '—', sub: budgetTot ? 'of budget' : 'no budget', over: budgetTot && spent > budgetTot })}
        <div style="flex:1"><div class="muted small">Spent</div><div class="disp big amt-neg">${fm(spent)}</div><div class="muted small">Income <b class="amt-pos">${fm(inc)}</b></div><div class="muted small">Balance <b class="${inc - spent >= 0 ? 'amt-pos' : 'amt-neg'}">${fm(inc - spent)}</b></div><div class="tiny dim">≈ ${fm(spent / Math.max(1, dayNo))} per day</div></div>
      </section>
      <div class="pill-row" style="margin-bottom:14px"><button class="chip gold" data-act="tx-new" data-type="exp">${ic('minus')} Expense</button><button class="chip" data-act="tx-new" data-type="inc">${ic('plus')} Income</button>${m.salary ? `<button class="chip" data-act="sal-log">${ic('landmark')} Log salary</button>` : ''}<button class="chip" data-act="money-set">${ic('settings')} ${m.show} · rate ${m.rate.toLocaleString('en-US')}</button></div>
      <section class="card"><div class="card-h"><b>Budgets</b><button class="chip" data-act="budget-edit">${ic('pencil')} Edit</button></div>
        ${CATS.filter(c => byCat[c[0]] || m.budgets[c[0]]).map(c => { const s = byCat[c[0]] || 0, b = m.budgets[c[0]] ? toShow(m.budgets[c[0]].amt, m.budgets[c[0]].cur) : 0; return `<div class="li"><div class="dot" style="--dc:${c[2]}">${ic(c[1])}</div><div class="li-m"><b>${c[0]}</b><div class="bar thin" style="margin-top:6px"><i style="width:${b ? Q.pct(s, b) : 100}%;background:${b && s > b ? '#fb7185' : c[2]}"></i></div></div><div class="li-r">${fm(s)}${b ? `<small class="muted" style="display:block">of ${fm(b)}</small>` : ''}</div></div>`; }).join('') || '<p class="empty">Set a monthly budget per category, then log what you spend.</p>'}</section>
      <div class="sec"><span>Transactions</span><span>${tx.length}</span></div>
      <section class="card">${tx.slice(0, 60).map(z => { const c = z.type === 'inc' ? ['', 'coins', '#34d399'] : catOf(z.cat); return Q.li({ icon: c[1], color: c[2], title: esc(z.note || z.cat), sub: `${Q.whenLabel(z.date)} · ${esc(z.cat)}`, right: `<span class="${z.type === 'inc' ? 'amt-pos' : 'amt-neg'}">${z.type === 'inc' ? '+' : '−'}${z.amt.toLocaleString('en-US')} ${z.cur}</span><button class="x-del" data-act="tx-del" data-id="${z.id}">${ic('x')}</button>` }); }).join('') || '<p class="empty">No transactions this month.</p>'}</section>
      <div class="fab-space"></div><button class="fab" data-act="tx-new" data-type="exp" aria-label="New expense">${ic('plus')}</button>`;
  }
  Q.ACTS.mon = el => { Q.ui.mon = el.dataset.v; Q.render(); };
  Q.ACTS['tx-new'] = el => {
    const type = el.dataset.type || 'exp', m = X().money;
    Q.sheet(`<h3>${type === 'inc' ? 'Income' : 'Expense'}</h3>
      <div class="addbar">${'<input id="tx-a" type="number" inputmode="decimal" placeholder="Amount" style="font-size:22px">'}<select id="tx-c" style="max-width:100px">${Q.opts(['SYP', 'USD'], m.lastCur || 'SYP')}</select></div>
      ${Q.field('Category', `<select id="tx-k">${Q.opts(type === 'inc' ? INCATS : CATS.map(c => c[0]), type === 'inc' ? 'Salary' : 'Food')}</select>`)}
      <div class="sgrid">${Q.field('Note', '<input id="tx-n" placeholder="optional">')}${Q.field('Date', `<input id="tx-d" type="date" value="${Q.today()}">`)}</div>
      <div class="actions"><button class="btn primary wide" data-act="tx-save" data-type="${type}">Save</button></div>`);
    setTimeout(() => { const a = document.getElementById('tx-a'); if (a) a.focus(); }, 60);
  };
  Q.ACTS['tx-save'] = el => {
    const amt = parseFloat(Q.val('tx-a')); if (!(amt > 0)) { Q.toast('Enter an amount'); return; }
    const m = X().money, cur = Q.val('tx-c'), b = Q.game(); m.lastCur = cur;
    m.tx.push({ id: Q.uid(), t: Date.now(), type: el.dataset.type, amt, cur, cat: Q.val('tx-k'), note: Q.val('tx-n').trim(), date: Q.val('tx-d') || Q.today() });
    const mq = Q.S.quests.find(q => q.key === 'money' && Q.activeOn(q, Q.today())); if (mq) Q.setLog(Q.today(), mq.id, true);
    Q.save(); Q.closeSheet(); Q.afterChange(b);
  };
  Q.ACTS['tx-del'] = el => { const m = X().money; m.tx = m.tx.filter(z => z.id !== el.dataset.id); Q.save(); Q.render(); };
  Q.ACTS['money-set'] = () => { const m = X().money, s = m.salary || {}; Q.sheet(`<h3>Money settings</h3>
    ${Q.field('Show totals in', `<select id="ms-s">${Q.opts(['USD', 'SYP'], m.show)}</select>`)}
    ${Q.field('Exchange rate (SYP per 1 USD)', `<input id="ms-r" type="number" value="${m.rate}">`)}
    <div class="sec"><span>Monthly salary</span></div>
    <div class="addbar"><input id="ms-a" type="number" placeholder="Amount" value="${s.amt || ''}"><select id="ms-c" style="max-width:100px">${Q.opts(['USD', 'SYP'], s.cur || 'USD')}</select></div>
    ${Q.field('Payday (day of month)', `<input id="ms-d" type="number" min="1" max="31" value="${s.day || 1}">`)}
    <div class="actions"><button class="btn primary wide" data-act="money-save">Save</button></div>`); };
  Q.ACTS['money-save'] = () => { const m = X().money; m.show = Q.val('ms-s'); m.rate = +Q.val('ms-r') || m.rate; const a = +Q.val('ms-a'); m.salary = a > 0 ? { amt: a, cur: Q.val('ms-c'), day: Q.clamp(+Q.val('ms-d') || 1, 1, 31) } : null; Q.save(); Q.closeSheet(); Q.render(); };
  Q.ACTS['sal-log'] = () => { const m = X().money, s = m.salary, b = Q.game(); m.tx.push({ id: Q.uid(), t: Date.now(), type: 'inc', amt: s.amt, cur: s.cur, cat: 'Salary', note: 'Monthly salary', date: Q.today() }); Q.save(); Q.toast('Salary logged 💰'); Q.afterChange(b); };
  Q.ACTS['budget-edit'] = () => { const m = X().money; Q.sheet(`<h3>Monthly budgets</h3><p class="muted small">In ${m.show}. Leave empty for no budget.</p>${CATS.map(c => `<div class="li"><div class="dot" style="--dc:${c[2]}">${ic(c[1])}</div><div class="li-m"><b>${c[0]}</b></div><input data-bud="${c[0]}" type="number" inputmode="decimal" style="max-width:120px" value="${m.budgets[c[0]] ? Math.round(toShow(m.budgets[c[0]].amt, m.budgets[c[0]].cur)) : ''}"></div>`).join('')}<div class="actions"><button class="btn primary wide" data-act="budget-save">Save budgets</button></div>`, { full: true }); };
  Q.ACTS['budget-save'] = () => { const m = X().money; m.budgets = {}; document.querySelectorAll('[data-bud]').forEach(i => { const v = parseFloat(i.value); if (v > 0) m.budgets[i.dataset.bud] = { amt: v, cur: m.show }; }); Q.save(); Q.closeSheet(); Q.render(); };

  // ================= SUBSCRIPTIONS =================
  function subsView() {
    const x = X(), t = Q.today();
    for (const s of x.subs) if (s.next && s.next < t && s.auto) { s.next = Q.nextOcc(s.next, s.cycle, t); }
    const list = x.subs.slice().sort((a, b) => (a.next || '').localeCompare(b.next || ''));
    const monthly = list.reduce((a, s) => a + toShow(s.amt, s.cur) / (s.cycle === 'yearly' ? 12 : 1), 0);
    return `<section class="card" style="display:flex;justify-content:space-between;align-items:center"><div><div class="kicker">Per month</div><div class="disp huge">${fm(monthly)}</div><div class="muted small">${fm(monthly * 12)} a year · ${list.length} subscriptions</div></div>${ic('repeat')}</section>
      <section class="card">${list.map(s => { const n = Q.daysUntil(s.next); return Q.li({ icon: 'repeat', color: n <= 2 ? '#fb7185' : '#60a5fa', title: esc(s.name), sub: `${s.amt} ${s.cur} / ${s.cycle === 'yearly' ? 'year' : 'month'} · renews ${Q.whenLabel(s.next).toLowerCase()}`, right: `${n <= 3 ? `<button class="chip gold" data-act="sub-paid" data-id="${s.id}">Paid</button>` : ''}<button class="x-del" data-act="sub-edit" data-id="${s.id}">${ic('pencil')}</button>` }); }).join('') || '<p class="empty">Add internet, phone, gym, apps, domains, hosting… Reminders 1 day before and on the day.</p>'}</section>
      <div class="fab-space"></div><button class="fab" data-act="sub-new" aria-label="New subscription">${ic('plus')}</button>`;
  }
  const subSheet = s => Q.sheet(`<h3>${s ? 'Edit' : 'New'} subscription</h3>
    ${Q.field('Name', `<input id="sb-n" value="${esc(s ? s.name : '')}" placeholder="e.g. Internet, Claude, domain">`)}
    <div class="addbar"><input id="sb-a" type="number" inputmode="decimal" placeholder="Amount" value="${s ? s.amt : ''}"><select id="sb-c" style="max-width:100px">${Q.opts(['USD', 'SYP'], s ? s.cur : 'USD')}</select></div>
    <div class="sgrid">${Q.field('Billing', `<select id="sb-y">${Q.opts([['monthly', 'Monthly'], ['yearly', 'Yearly']], s ? s.cycle : 'monthly')}</select>`)}${Q.field('Next renewal', `<input id="sb-d" type="date" value="${s ? s.next : Q.today()}">`)}</div>
    <div class="actions">${s ? `<button class="btn ghost" data-act="sub-del" data-id="${s.id}">Delete</button>` : ''}<button class="btn primary" data-act="sub-save" data-id="${s ? s.id : ''}">Save</button></div>`);
  Q.ACTS['sub-new'] = () => subSheet(null);
  Q.ACTS['sub-edit'] = el => subSheet(X().subs.find(s => s.id === el.dataset.id));
  Q.ACTS['sub-save'] = el => { const name = Q.val('sb-n').trim(), amt = +Q.val('sb-a'); if (!name || !(amt > 0)) { Q.toast('Name and amount are needed'); return; } const x = X(); let s = x.subs.find(z => z.id === el.dataset.id); if (!s) { s = { id: Q.uid() }; x.subs.push(s); } Object.assign(s, { name, amt, cur: Q.val('sb-c'), cycle: Q.val('sb-y'), next: Q.val('sb-d') || Q.today() }); Q.save(); Q.closeSheet(); Q.render(); };
  Q.ACTS['sub-del'] = el => { const x = X(); x.subs = x.subs.filter(s => s.id !== el.dataset.id); Q.save(); Q.closeSheet(); Q.render(); };
  Q.ACTS['sub-paid'] = el => { const x = X(), s = x.subs.find(z => z.id === el.dataset.id), b = Q.game(); if (!s) return; x.money.tx.push({ id: Q.uid(), t: Date.now(), type: 'exp', amt: s.amt, cur: s.cur, cat: 'Subscriptions', note: s.name, date: Q.today() }); s.next = Q.nextOcc(s.next, s.cycle, Q.addDays(s.next, 1)); Q.save(); Q.toast(`Logged ${s.name}. Next: ${Q.niceDate(s.next)}`); Q.afterChange(b); };

  // ================= LIFE TAB =================
  Q.VIEWS.life = () => {
    const sub = Q.tabOf('life', 'tasks');
    const bar = Q.tabsBar('life', [['tasks', 'Tasks', 'list-checks'], ['dates', 'Dates', 'calendar-check'], ['money', 'Money', 'coins'], ['subs', 'Subs', 'repeat'], ['plan', 'Day plan', 'calendar-days']], sub);
    return Q.head('Life') + bar + (sub === 'tasks' ? tasksView() : sub === 'dates' ? datesView() : sub === 'money' ? moneyView() : sub === 'subs' ? subsView() : Q.viewPlan());
  };
})(window.Q);
