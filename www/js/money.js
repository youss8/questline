(function (E) {
  'use strict';
  const { esc, ic } = E;
  const S = () => E.S, M = () => E.S.money;

  const shiftMonth = (ym, n) => { const d = E.parse(ym + '-01'); d.setMonth(d.getMonth() + n); return E.ymd(d).slice(0, 7); };
  const monthName = ym => E.parse(ym + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const sumExp = list => list.filter(t => t.type === 'exp').reduce((a, t) => a + E.conv(t.amt, t.cur), 0);
  const sumInc = list => list.filter(t => t.type === 'inc').reduce((a, t) => a + E.conv(t.amt, t.cur), 0);

  E.screens.money = () => {
    const t = E.today(), ym = E.ui.ym || t.slice(0, 7), tx = E.monthTx(ym), last = E.monthTx(shiftMonth(ym, -1));
    const spent = sumExp(tx), inc = sumInc(tx), lastSpent = sumExp(last);
    const budget = Object.values(M().budgets).reduce((a, b) => a + E.conv(b.amt, b.cur), 0);
    const dim = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(), isNow = ym === t.slice(0, 7), dayNo = isNow ? E.parse(t).getDate() : dim;
    const perDay = spent / Math.max(1, dayNo), proj = isNow ? perDay * dim : spent;
    const byCat = {}; for (const x of tx) if (x.type === 'exp') byCat[x.cat] = (byCat[x.cat] || 0) + E.conv(x.amt, x.cur);
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const daily = Array.from({ length: dim }, (_, i) => { const d = `${ym}-${E.pad(i + 1)}`; return sumExp(tx.filter(x => x.date === d)); });
    const mx = Math.max(1, ...daily), biggest = tx.filter(x => x.type === 'exp').sort((a, b) => E.conv(b.amt, b.cur) - E.conv(a.amt, a.cur))[0];
    const insights = [];
    if (lastSpent > 0 && spent > 0) { const ch = (isNow ? proj : spent) / lastSpent - 1; insights.push([ch > 0 ? 'trending-up' : 'trending-down', `${isNow ? 'On track to spend' : 'You spent'} ${E.n(Math.abs(ch * 100))}% ${ch > 0 ? 'more' : 'less'} than last month`, ch > 0 ? 'var(--bad)' : 'var(--good)']); }
    if (cats[0]) insights.push(['chart-pie', `${E.cat(cats[0][0]).n} is ${E.pct(cats[0][1], spent)}% of your spending`, E.cat(cats[0][0]).c]);
    if (biggest) insights.push(['receipt', `Biggest: ${esc(biggest.note || biggest.sub || E.cat(biggest.cat).n)} · ${E.amtTxt(biggest.amt, biggest.cur)}`, 'var(--sand)']);
    const subsMonthly = M().subs.reduce((a, s) => a + E.conv(s.amt, s.cur) / (s.cycle === 'yearly' ? 12 : 1), 0);
    if (subsMonthly) insights.push(['repeat', `Subscriptions cost ${E.money(subsMonthly)} a month`, 'var(--rose)']);
    const byDay = {}; for (const x of tx.slice().sort((a, b) => b.date.localeCompare(a.date) || b.t - a.t)) (byDay[x.date] = byDay[x.date] || []).push(x);
    return `<button class="hdr-back" data-a="go-today">${ic('chevron-left')} Home</button>` + E.hdr('Money', 'Know where every coin goes', `<button class="hdr-btn" data-a="money-settings" aria-label="Money settings">${ic('sliders-horizontal')}</button>`) +
      `<div class="row" style="justify-content:space-between;margin-bottom:12px"><button class="round" data-a="ym" data-n="-1" aria-label="Previous month">${ic('chevron-left')}</button><b class="mid" style="font-size:18px">${monthName(ym)}</b><button class="round" data-a="ym" data-n="1" ${isNow ? 'disabled' : ''} aria-label="Next month">${ic('chevron-right')}</button></div>
      <section class="card tint"><div class="label">Spent</div><div class="big">${E.money(spent)}</div>
        ${budget ? `<div class="progress-line" style="margin:12px 0 6px">${E.bar(E.pct(spent, budget), spent > budget ? 'var(--bad)' : null)}</div><div class="small muted">${spent <= budget ? `${E.money(budget - spent)} left of ${E.money(budget)} budget` : `${E.money(spent - budget)} over budget`}</div>` : `<div class="small muted" style="margin-top:6px"><button class="link ember" style="font-weight:600" data-a="budgets">Set monthly budgets</button> to see what's left.</div>`}
        <div class="grid3" style="margin-top:16px"><div><div class="small muted">Income</div><b class="good">${E.money(inc)}</b></div><div><div class="small muted">Per day</div><b>${E.money(perDay)}</b></div><div><div class="small muted">${isNow ? 'By month end' : 'Saved'}</div><b class="${isNow ? '' : inc - spent >= 0 ? 'good' : 'bad'}">${isNow ? E.money(proj) : E.money(inc - spent)}</b></div></div></section>
      <div class="grid2" style="margin-top:12px"><button class="btn primary" data-a="tx-new" data-type="exp">${ic('minus')} Expense</button><button class="btn ghost" data-a="tx-new" data-type="inc">${ic('plus')} Income</button></div>
      ${M().salary && isNow && !tx.some(x => x.type === 'inc' && x.cat === 'salary') ? `<button class="card" style="display:block;width:100%;text-align:left;margin-top:12px" data-a="sal-log"><div class="row"><div class="ico" style="--c:var(--sage)">${ic('landmark')}</div><div class="grow"><div class="card-t">Got paid?</div><div class="small muted">Log salary · ${E.amtTxt(M().salary.amt, M().salary.cur)}</div></div>${ic('plus', 'ember')}</div></button>` : ''}
      ${E.secH('Where it went')}
      <div class="list">${cats.map(([id, v]) => { const c = E.cat(id), b = M().budgets[id], bv = b ? E.conv(b.amt, b.cur) : 0; return `<button class="item" data-a="cat-open" data-id="${id}"><div class="ico sm" style="--c:${c.c}">${ic(c.icon)}</div><div class="grow"><div class="row" style="justify-content:space-between"><span class="t">${c.n}</span><b>${E.money(v)}</b></div><div style="margin-top:6px">${E.bar(bv ? E.pct(v, bv) : E.pct(v, cats[0][1]), bv && v > bv ? 'var(--bad)' : c.c)}</div><div class="s">${E.pct(v, spent)}%${bv ? ` · budget ${E.money(bv)}` : ''}</div></div></button>`; }).join('') || `<p class="empty">${ic('wallet')}No spending logged ${isNow ? 'yet this month' : 'this month'}. Tap Expense after every purchase. It takes 5 seconds.</p>`}</div>
      ${spent ? `${E.secH('Day by day')}<section class="card"><div class="cols">${daily.map((v, i) => `<div><i class="${v ? '' : 'low'}" style="height:${Math.max(3, v / mx * 100)}%"></i>${(i + 1) % 5 === 0 || i === 0 ? `<span>${i + 1}</span>` : '<span>&nbsp;</span>'}</div>`).join('')}</div></section>` : ''}
      ${insights.length ? E.secH('Insights') + `<div class="list">${insights.map(([i, t, c]) => E.item({ icon: i, c, sm: true, t })).join('')}</div>` : ''}
      ${E.secH('Subscriptions', 'Add', 'sub-new')}
      <div class="list">${M().subs.slice().sort((a, b) => a.next.localeCompare(b.next)).map(s => { const n = E.diff(s.next, t); return E.item({ a: 'sub-edit', id: s.id, icon: 'repeat', sm: true, c: n <= 2 ? 'var(--rose)' : 'var(--slate)', t: esc(s.name), s: `${s.cycle === 'yearly' ? 'Yearly' : 'Monthly'} · renews ${E.rel(s.next).toLowerCase()}`, r: E.amtTxt(s.amt, s.cur) }); }).join('') || `<p class="empty">${ic('repeat')}Internet, mobile, apps, hosting, domains… You get a reminder the day before each renewal.</p>`}</div>
      ${E.secH('Transactions')}
      ${Object.keys(byDay).map(d => `<div class="label" style="margin:14px 4px 8px">${E.rel(d)} · ${E.money(sumExp(byDay[d]))}</div><div class="list">${byDay[d].map(txRow).join('')}</div>`).join('') || '<p class="empty">Nothing yet.</p>'}`;
  };
  const txRow = x => { const c = x.type === 'inc' ? (E.INCS.find(i => i.id === x.cat) || E.INCS[4]) : E.cat(x.cat); return E.item({ a: 'tx-edit', id: x.id, icon: c.icon, sm: true, c: x.type === 'inc' ? 'var(--good)' : c.c, t: esc(x.note || x.sub || c.n), s: `${x.type === 'inc' ? c.n : `${c.n}${x.sub && x.note ? ' · ' + esc(x.sub) : ''}`}${x.time ? ' · ' + E.time12(x.time) : ''}`, r: `<span class="${x.type === 'inc' ? 'good' : ''}">${x.type === 'inc' ? '+' : '−'}${E.amtTxt(x.amt, x.cur)}</span>` }); };
  E.A.ym = el => { const t = E.today().slice(0, 7), ym = shiftMonth(E.ui.ym || t, +el.dataset.n); if (ym <= t) { E.ui.ym = ym; E.render(); } };
  E.A['cat-open'] = el => {
    const ym = E.ui.ym || E.today().slice(0, 7), c = E.cat(el.dataset.id), tx = E.monthTx(ym).filter(x => x.type === 'exp' && x.cat === c.id), tot = sumExp(tx);
    const bySub = {}; for (const x of tx) bySub[x.sub || 'Other'] = (bySub[x.sub || 'Other'] || 0) + E.conv(x.amt, x.cur);
    E.sheet({ title: c.n, full: true, body: `<div class="big">${E.money(tot)}</div><p class="muted small" style="margin-bottom:14px">${monthName(ym)} · ${tx.length} payments</p>
      <div class="list">${Object.entries(bySub).sort((a, b) => b[1] - a[1]).map(([s, v]) => `<div class="item"><div class="grow"><div class="row" style="justify-content:space-between"><span class="t">${esc(s)}</span><b>${E.money(v)}</b></div><div style="margin-top:6px">${E.bar(E.pct(v, tot), c.c)}</div></div></div>`).join('')}</div>
      <div class="label" style="margin:18px 4px 8px">Payments</div><div class="list">${tx.sort((a, b) => b.date.localeCompare(a.date)).map(txRow).join('')}</div>` });
  };

  // ---------- add / edit a transaction: amount first, then one tap for the category ----------
  const txForm = (x, type) => {
    x = x || {}; type = x.type || type || 'exp';
    const cats = type === 'exp' ? E.CATS : E.INCS, cur = x.cur || M().lastCur || 'SYP', cat = x.cat || (type === 'exp' ? M().lastCat || 'food' : 'salary');
    E.sheet({ title: x.id ? 'Edit' : type === 'exp' ? 'New expense' : 'New income', full: true, body: `
      <div class="row" style="gap:8px"><input id="tx-a" type="number" inputmode="decimal" class="amount" value="${x.amt || ''}" placeholder="0" style="flex:1">${E.chips('tx-c', ['SYP', 'USD'], cur)}</div>
      ${E.field('Category', E.chips('tx-k', cats.map(c => [c.id, c.n, c.icon]), cat, { change: 'tx-cat' }))}
      <div id="tx-subs">${type === 'exp' ? subChips(cat, x.sub) : ''}</div>
      ${E.field('Note', `<input id="tx-n" value="${esc(x.note || '')}" placeholder="${type === 'exp' ? 'Where or what? e.g. Shawarma at …' : 'From who?'}">`)}
      <div class="grid2">${E.field('Date', `<input id="tx-d" type="date" value="${x.date || E.today()}">`)}${E.field('Time', `<input id="tx-h" type="time" value="${x.time || E.hm(E.nowMin())}">`)}</div>`,
      foot: `${x.id ? `<button class="btn danger" data-a="tx-del" data-id="${x.id}">Delete</button>` : '<button class="btn ghost" data-a="close">Cancel</button>'}<button class="btn primary" data-a="tx-save" data-id="${x.id || ''}" data-type="${type}">Save</button>`, focus: x.id ? null : 'tx-a' });
  };
  const subChips = (cat, cur) => { const c = E.cat(cat); return c.subs ? E.field('Type', E.chips('tx-s', c.subs, cur || '')) : '<input type="hidden" id="tx-s" value="">'; };
  E.A['tx-cat'] = b => { const box = E.$('#tx-subs'); if (box && E.$('[data-a="tx-save"]').dataset.type === 'exp') box.innerHTML = subChips(b.dataset.v); };
  E.A['tx-new'] = el => { E.close(true); txForm(null, el.dataset.type); };
  E.A['tx-edit'] = el => txForm(M().tx.find(x => x.id === el.dataset.id));
  E.A['tx-save'] = el => {
    const amt = E.num('tx-a'); if (!(amt > 0)) { E.toast('Enter the amount'); return; }
    let x = M().tx.find(z => z.id === el.dataset.id); if (!x) { x = { id: E.uid(), t: Date.now() }; M().tx.push(x); }
    Object.assign(x, { type: el.dataset.type, amt, cur: E.val('tx-c') || 'SYP', cat: E.val('tx-k'), sub: E.val('tx-s') || null, note: E.val('tx-n'), date: E.val('tx-d') || E.today(), time: E.val('tx-h') || null });
    M().lastCur = x.cur; if (x.type === 'exp') M().lastCat = x.cat;
    E.autoMoney(x.date); E.save(); E.close(true); E.buzz(10); E.toast(`${x.type === 'exp' ? 'Spent' : 'Received'} ${E.amtTxt(amt, x.cur)}`); E.render();
  };
  E.A['tx-del'] = el => { const i = M().tx.findIndex(x => x.id === el.dataset.id), x = M().tx[i]; M().tx.splice(i, 1); E.save(); E.close(true); E.render(); E.toast('Deleted', () => M().tx.splice(i, 0, x)); };
  E.A['sal-log'] = () => { const s = M().salary; M().tx.push({ id: E.uid(), t: Date.now(), type: 'inc', amt: s.amt, cur: s.cur, cat: 'salary', note: 'Monthly salary', date: E.today() }); E.save(); E.toast('Salary logged'); E.render(); };

  // ---------- subscriptions ----------
  const subForm = s => { s = s || {}; E.sheet({ title: s.id ? 'Subscription' : 'New subscription', body: `
    ${E.field('Name', `<input id="sb-n" value="${esc(s.name || '')}" placeholder="e.g. Internet, Claude, domain">`)}
    <div class="row" style="gap:8px"><input id="sb-a" type="number" inputmode="decimal" value="${s.amt || ''}" placeholder="Amount" style="flex:1">${E.chips('sb-c', ['USD', 'SYP'], s.cur || 'USD')}</div><div class="spacer"></div>
    ${E.field('Billed', E.chips('sb-y', [['monthly', 'Monthly'], ['yearly', 'Yearly']], s.cycle || 'monthly'))}
    ${E.field('Next renewal', `<input id="sb-d" type="date" value="${s.next || E.today()}">`)}`,
    foot: `${s.id ? `<button class="btn ghost" data-a="sub-paid" data-id="${s.id}">Mark paid</button><button class="btn danger" data-a="sub-del" data-id="${s.id}">Delete</button>` : ''}<button class="btn primary" data-a="sub-save" data-id="${s.id || ''}">Save</button>`, focus: s.id ? null : 'sb-n' }); };
  E.A['sub-new'] = () => { E.close(true); subForm(); };
  E.A['sub-edit'] = el => subForm(M().subs.find(s => s.id === el.dataset.id));
  E.A['sub-save'] = el => { const name = E.val('sb-n'), amt = E.num('sb-a'); if (!name || !amt) { E.toast('Add a name and amount'); return; } let s = M().subs.find(z => z.id === el.dataset.id); if (!s) { s = { id: E.uid() }; M().subs.push(s); } Object.assign(s, { name, amt, cur: E.val('sb-c'), cycle: E.val('sb-y'), next: E.val('sb-d') || E.today() }); E.save(); E.close(true); E.render(); };
  E.A['sub-del'] = el => { M().subs = M().subs.filter(s => s.id !== el.dataset.id); E.save(); E.close(true); E.render(); };
  E.A['sub-paid'] = el => { const s = M().subs.find(z => z.id === el.dataset.id); M().tx.push({ id: E.uid(), t: Date.now(), type: 'exp', amt: s.amt, cur: s.cur, cat: 'phone', sub: 'Apps & AI', note: s.name, date: E.today() }); s.next = E.nextOcc(s.next, s.cycle, E.add(s.next, 1)); E.autoMoney(E.today()); E.save(); E.close(true); E.toast(`Paid. Next: ${E.fmtDate(s.next)}`); E.render(); };
  // roll forward renewals that already passed
  E.rollSubs = () => { const t = E.today(); for (const s of M().subs) if (s.next < t) s.next = E.nextOcc(s.next, s.cycle, t); };

  // ---------- settings: rate, display currency, salary, budgets ----------
  E.A['money-settings'] = () => { E.close(true); const m = M(), s = m.salary || {}; E.prepDone('money'); E.sheet({ title: 'Money settings', body: `
    ${E.field('Show totals in', E.chips('ms-s', ['USD', 'SYP'], m.show))}
    ${E.field('Exchange rate', `<input id="ms-r" type="number" inputmode="numeric" value="${m.rate}">`, 'SYP for 1 USD. Update it when the rate moves.')}
    <div class="label" style="margin:16px 4px 8px">Monthly salary</div>
    <div class="row" style="gap:8px"><input id="ms-a" type="number" inputmode="decimal" value="${s.amt || ''}" placeholder="Amount" style="flex:1">${E.chips('ms-c', ['USD', 'SYP'], s.cur || 'USD')}</div><div class="spacer"></div>
    ${E.field('Payday (day of month)', `<input id="ms-d" type="number" inputmode="numeric" min="1" max="31" value="${s.day || ''}" placeholder="e.g. 28">`)}
    <button class="btn ghost wide" data-a="budgets">${ic('target')} Monthly budgets</button>
    <button class="btn ghost wide" style="margin-top:10px" data-a="goals-open">${ic('piggy-bank')} Savings goals</button>
    <button class="btn ghost wide" style="margin-top:10px" data-a="money-csv">${ic('download')} Export all transactions (spreadsheet)</button>`,
    foot: '<button class="btn primary" data-a="money-save">Save</button>' }); };
  E.A['money-save'] = () => { const m = M(); m.show = E.val('ms-s') || m.show; m.rate = E.num('ms-r') || m.rate; const a = E.num('ms-a'); m.salary = a > 0 ? { amt: a, cur: E.val('ms-c'), day: E.clamp(E.num('ms-d') || 1, 1, 31) } : null; E.save(); E.close(true); E.toast('Saved'); E.render(); };
  E.A.budgets = () => { E.close(true); const m = M(); E.sheet({ title: `Monthly budgets (${m.show})`, full: true, body: `<p class="hint" style="margin-top:0">Leave empty for no limit.</p><div class="list">${E.CATS.map(c => `<div class="item"><div class="ico sm" style="--c:${c.c}">${ic(c.icon)}</div><div class="grow t">${c.n}</div><input data-bud="${c.id}" type="number" inputmode="decimal" style="width:110px;text-align:right" value="${m.budgets[c.id] ? Math.round(E.conv(m.budgets[c.id].amt, m.budgets[c.id].cur)) : ''}" placeholder="—"></div>`).join('')}</div>`, foot: '<button class="btn primary" data-a="bud-save">Save budgets</button>' }); };
  E.A['bud-save'] = () => { const m = M(); m.budgets = {}; E.$$('[data-bud]').forEach(i => { const v = parseFloat(i.value); if (v > 0) m.budgets[i.dataset.bud] = { amt: v, cur: m.show }; }); E.save(); E.close(true); E.toast('Budgets saved'); E.render(); };
})(window.E);
