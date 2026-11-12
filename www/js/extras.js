(function (E) {
  'use strict';
  const { esc, ic } = E;
  const S = () => E.S;

  // ================= fasting timer =================
  E.A['fast-open'] = () => {
    const f = S().fast, run = !!f.start, h = run ? (Date.now() - f.start) / 36e5 : 0;
    E.sheet({ title: 'Fasting', body: `
      ${run ? `<div class="player"><div class="step">Fasting for</div><div class="timer">${Math.floor(h)}h ${E.pad(Math.floor(h % 1 * 60))}m</div><p>Started ${new Date(f.start).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })} · goal ${f.goal} hours</p><div style="display:flex;margin:16px 0">${E.bar(E.pct(h, f.goal))}</div></div>`
        : `<p class="hint" style="margin-top:0">Start when you finish your last meal. Water, black coffee and plain tea don't break it.</p>${E.field('Goal', E.chips('fs-g', [[12, '12 h'], [14, '14 h'], [16, '16 h'], [18, '18 h']], f.goal))}`}
      ${f.log.length ? `<div class="label" style="margin:14px 4px 8px">Recent fasts</div><div class="list">${f.log.slice(-5).reverse().map(l => E.item({ icon: 'hourglass', sm: true, c: l.h >= l.goal ? 'var(--sage)' : 'var(--muted)', t: `${E.n(l.h, 1)} hours`, s: E.rel(l.d), r: l.h >= l.goal ? '<span class="good">Goal</span>' : '' })).join('')}</div>` : ''}`,
      foot: run ? `<button class="btn ghost" data-a="fast-cancel">Cancel</button><button class="btn primary" data-a="fast-end">End fast</button>` : `<button class="btn primary" data-a="fast-start">${ic('play')} Start fast now</button>` });
  };
  E.A['fast-start'] = () => { const f = S().fast; f.goal = +E.val('fs-g') || f.goal; f.start = Date.now(); E.save(); E.close(true); E.toast(`Fast started. Goal ${f.goal} hours.`); E.render(); };
  E.A['fast-end'] = () => { const f = S().fast, h = (Date.now() - f.start) / 36e5; if (h >= 0.5) f.log.push({ d: E.today(), h: Math.round(h * 10) / 10, goal: f.goal }); f.start = null; E.save(); E.close(true); E.toast(h >= f.goal ? `${E.n(h, 1)} hours. Goal reached.` : `${E.n(h, 1)} hours logged`); E.render(); };
  E.A['fast-cancel'] = () => { S().fast.start = null; E.save(); E.close(true); E.render(); };

  // ================= shopping list =================
  const shopSheet = () => {
    const L = S().shop;
    E.sheet({ title: 'Shopping list', full: true, body: `
      <div class="row" style="gap:8px"><input id="sh-t" placeholder="Add an item…" autocomplete="off" data-enter="shop-add" style="flex:1"><button class="round" style="width:50px;height:50px" data-a="shop-add" aria-label="Add">${ic('plus')}</button></div>
      <div class="list" style="margin-top:14px">${L.filter(x => !x.done).concat(L.filter(x => x.done)).map(x => `<div class="habit ${x.done ? 'done' : ''}"><button class="check ${x.done ? 'on' : ''}" style="width:36px;height:36px" data-a="shop-tick" data-id="${x.id}">${x.done ? ic('check') : ''}</button><div class="grow"><div class="t">${esc(x.t)}</div></div></div>`).join('') || `<p class="empty">${ic('shopping-cart')}Nothing to buy.</p>`}</div>`,
      foot: `${L.some(x => x.done) ? '<button class="btn ghost" data-a="shop-clear">Clear bought</button>' : ''}${(S().food.prep || []).length ? '<button class="btn ghost" data-a="shop-prep">Add meal-prep groceries</button>' : ''}<button class="btn primary" data-a="close">Done</button>` });
    E.onClose = () => E.render();
  };
  E.A['shop-open'] = shopSheet;
  E.A['shop-add'] = () => { const t = E.val('sh-t'); if (!t) return; S().shop.push({ id: E.uid(), t, done: false }); E.save(); shopSheet(); setTimeout(() => { const i = E.$('#sh-t'); if (i) i.focus(); }, 50); };
  E.A['shop-tick'] = el => { const x = S().shop.find(z => z.id === el.dataset.id); x.done = !x.done; E.save(); E.buzz(8); shopSheet(); };
  E.A['shop-clear'] = () => { S().shop = S().shop.filter(x => !x.done); E.save(); shopSheet(); };
  E.A['shop-prep'] = () => { const groc = {}; for (const p of S().food.prep) { const r = S().food.recipes.find(x => x.id === p.id); if (r) for (const it of r.items) groc[it.id] = (groc[it.id] || 0) + it.g; } let n = 0; for (const id in groc) { const name = `${(E.FOODS[id] || {}).n || id} · ${groc[id] >= 1000 ? E.n(groc[id] / 1000, 1) + ' kg' : Math.round(groc[id]) + ' g'}`; if (!S().shop.some(x => x.t === name)) { S().shop.push({ id: E.uid(), t: name, done: false }); n++; } } E.save(); E.toast(`${n} item${n === 1 ? '' : 's'} added`); shopSheet(); };

  // ================= savings goals =================
  const goalsSheet = () => {
    const G = S().money.goals;
    E.sheet({ title: 'Savings goals', full: true, body: `${G.map(g => `<section class="card" style="margin-bottom:12px"><div class="row" style="justify-content:space-between"><div class="card-t">${esc(g.n)}</div><button class="pill" data-a="goal-edit" data-id="${g.id}">${ic('pencil')}</button></div><div class="big" style="margin:8px 0 4px">${E.amtTxt(g.saved, g.cur)}</div><div class="small muted">of ${E.amtTxt(g.target, g.cur)} · ${E.pct(g.saved, g.target)}%${g.by ? ` · by ${E.fmtDate(g.by)}` : ''}</div><div style="display:flex;margin:12px 0">${E.bar(E.pct(g.saved, g.target), 'var(--sage)')}</div>
        ${g.by && g.saved < g.target && E.diff(g.by, E.today()) > 0 ? `<div class="small muted" style="margin-bottom:10px">Save ${E.amtTxt(Math.ceil((g.target - g.saved) / Math.max(1, E.diff(g.by, E.today()) / 30)), g.cur)} a month to make it.</div>` : ''}
        <button class="btn sm wide" data-a="goal-add" data-id="${g.id}">${ic('plus')} Add money</button></section>`).join('') || `<p class="empty">${ic('piggy-bank')}Name what you're saving for and how much. Add to it whenever you put money aside.</p>`}`,
      foot: `<button class="btn primary" data-a="goal-edit" data-id="">${ic('plus')} New goal</button>` });
    E.onClose = () => E.render();
  };
  E.A['goals-open'] = goalsSheet;
  E.A['goal-edit'] = el => { const g = S().money.goals.find(x => x.id === el.dataset.id) || {}; E.sheet({ title: g.id ? 'Edit goal' : 'New goal', body: `${E.field('Saving for', `<input id="gl-n" value="${esc(g.n || '')}" placeholder="e.g. Germany fund">`)}<div class="row" style="gap:8px"><input id="gl-t" type="number" inputmode="decimal" value="${g.target || ''}" placeholder="Target" style="flex:1">${E.chips('gl-c', ['USD', 'SYP'], g.cur || 'USD')}</div><div class="spacer"></div>${E.field('Saved so far', `<input id="gl-s" type="number" inputmode="decimal" value="${g.saved || 0}">`)}${E.field('Target date (optional)', `<input id="gl-b" type="date" value="${g.by || ''}">`)}`, foot: `${g.id ? `<button class="btn danger" data-a="goal-del" data-id="${g.id}">Delete</button>` : ''}<button class="btn primary" data-a="goal-save" data-id="${g.id || ''}">Save</button>`, focus: g.id ? null : 'gl-n' }); E.onClose = () => setTimeout(goalsSheet, 0); };
  E.A['goal-save'] = el => { const n = E.val('gl-n'), target = E.num('gl-t'); if (!n || !target) { E.toast('Add a name and a target'); return; } let g = S().money.goals.find(x => x.id === el.dataset.id); if (!g) { g = { id: E.uid() }; S().money.goals.push(g); } Object.assign(g, { n, target, cur: E.val('gl-c') || 'USD', saved: E.num('gl-s'), by: E.val('gl-b') || null }); E.save(); goalsSheet(); };
  E.A['goal-del'] = el => { S().money.goals = S().money.goals.filter(g => g.id !== el.dataset.id); E.save(); goalsSheet(); };
  E.A['goal-add'] = el => { const g = S().money.goals.find(x => x.id === el.dataset.id); E.sheet({ title: `Add to ${esc(g.n)}`, body: `<input id="ga" type="number" inputmode="decimal" class="amount" placeholder="0" data-enter="goal-add-ok"><p class="hint center">${g.cur}</p>`, foot: `<button class="btn primary" data-a="goal-add-ok" data-id="${g.id}">Add</button>`, focus: 'ga' }); E.$('#ga').dataset.id = g.id; E.onClose = () => setTimeout(goalsSheet, 0); };
  E.A['goal-add-ok'] = el => { const g = S().money.goals.find(x => x.id === el.dataset.id), a = E.num('ga'); if (!(a > 0)) return; g.saved += a; E.save(); E.buzz(15); if (g.saved >= g.target) { E.sparks(); E.toast(`${g.n}: goal reached!`); } goalsSheet(); };

  // ================= breathing =================
  let brT = null;
  E.A.breathe = () => {
    const steps = [['Breathe in', 4], ['Hold', 4], ['Breathe out', 4], ['Hold', 4]], total = 64, t0 = Date.now();
    E.sheet({ title: 'Breathe', body: `<div class="player"><div class="breath" id="br-c"></div><h2 id="br-l">Breathe in</h2><p id="br-s">Follow the circle. 4 rounds, about a minute.</p></div>`, foot: '<button class="btn ghost" data-a="close">Stop</button>' });
    const paint = () => { const el = E.$('#br-l'); if (!el) { clearInterval(brT); return; } const s = (Date.now() - t0) / 1000; if (s >= total) { clearInterval(brT); el.textContent = 'Done'; E.$('#br-s').textContent = 'Notice how you feel now.'; E.$('#br-c').className = 'breath'; E.buzz(30); return; } const ph = Math.floor(s % 16 / 4); el.textContent = steps[ph][0]; E.$('#br-s').textContent = `${4 - Math.floor(s % 4)}`; E.$('#br-c').className = 'breath ' + (ph === 0 ? 'in' : ph === 1 ? 'in hold' : ph === 2 ? '' : 'hold'); };
    clearInterval(brT); brT = setInterval(paint, 200); paint(); E.onClose = () => clearInterval(brT);
  };

  // ================= milestones =================
  E.milestones = () => {
    const key = 'ms' + E.ver; if (E._ms && E._ms.k === key) return E._ms.v;
    const em = E.ember(), tr = S().train.logs.length, mob = S().mob.logs.length, fo = (S().focus || []).reduce((a, f) => a + f.mins, 0), words = Object.values(S().de.srs).filter(v => v.b >= 3).length;
    const W = S().weights.slice().sort((a, b) => a.d.localeCompare(b.d)), lost = W.length > 1 ? W[0].kg - W[W.length - 1].kg : 0, tasks = S().tasks.filter(k => k.done).length;
    const txDays = new Set(S().money.tx.map(x => x.date)).size, foodDays = Object.keys(S().food.diary).length, jr = Object.keys(S().journal).length, steps = Object.keys(S().career.done).length;
    const m = [];
    const add = (icon, t, s, ok) => m.push({ icon, t, s, ok: !!ok });
    for (const n of [1, 3, 7, 14, 30, 66, 100]) add('flame', n === 1 ? 'First fire' : `${n}-day fire`, n === 1 ? 'Keep your fire lit for one day' : `Keep it lit ${n} days in a row`, em.best >= n);
    for (const n of [1, 10, 25, 50]) add('dumbbell', n === 1 ? 'First workout' : `${n} workouts`, 'Finish guided workouts', tr >= n);
    for (const n of [5, 25]) add('person-standing', `${n} mobility sessions`, 'Look after your back', mob >= n);
    for (const n of [1, 10, 50]) add('timer', `${n} hour${n === 1 ? '' : 's'} of focus`, 'Deep work with the focus timer', fo >= n * 60);
    for (const n of [25, 100, 250]) add('languages', `${n} German words`, 'Words you know well', words >= n);
    for (const n of [1, 3, 5, 10, 15]) add('scale', `${n} kg down`, 'From your first weigh-in', lost >= n);
    for (const n of [10, 50]) add('list-checks', `${n} tasks done`, 'Finish what you start', tasks >= n);
    add('wallet', 'Money tracker', 'Log expenses on 7 different days', txDays >= 7);
    add('utensils', 'Food tracker', 'Log food on 7 different days', foodDays >= 7);
    add('feather', 'Reflective', 'Close your day 7 times', jr >= 7);
    add('rocket', 'On the road', 'Finish 5 career roadmap steps', steps >= 5);
    add('book-open', 'Reader', 'Finish a book', S().books.some(b => b.done));
    E._ms = { k: key, v: m }; return m;
  };
  E.checkMilestones = () => { const n = E.milestones().filter(x => x.ok).length, st = S().settings; if (st.msSeen == null) { st.msSeen = n; return; } if (n > st.msSeen) { const last = E.milestones().filter(x => x.ok).pop(); st.msSeen = n; setTimeout(() => { E.sparks(); E.toast(`Milestone: ${last.t}`); }, 300); } else if (n < st.msSeen) st.msSeen = n; };
  E.A['miles-open'] = () => { const m = E.milestones(); E.sheet({ title: `Milestones · ${m.filter(x => x.ok).length}/${m.length}`, full: true, body: `<div class="list">${m.map(x => E.item({ icon: x.ok ? x.icon : 'circle', c: x.ok ? 'var(--ember)' : 'var(--dim)', t: `<span style="${x.ok ? '' : 'color:var(--muted)'}">${esc(x.t)}</span>`, s: esc(x.s), r: x.ok ? ic('badge-check', 'ember') : '' })).join('')}</div>` }); };

  // ================= export money as a spreadsheet file =================
  E.A['money-csv'] = async () => {
    const rows = [['Date', 'Time', 'Type', 'Category', 'Detail', 'Note', 'Amount', 'Currency']].concat(S().money.tx.slice().sort((a, b) => a.date.localeCompare(b.date)).map(x => [x.date, x.time || '', x.type === 'inc' ? 'Income' : 'Expense', x.type === 'inc' ? (E.INCS.find(i => i.id === x.cat) || { n: x.cat }).n : E.cat(x.cat).n, x.sub || '', x.note || '', x.amt, x.cur]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'), name = `ember-money-${E.today()}.csv`, P = window.Capacitor && window.Capacitor.Plugins;
    if (P && P.Filesystem && P.Share) { try { const r = await P.Filesystem.writeFile({ path: name, data: csv, directory: 'CACHE', encoding: 'utf8' }); await P.Share.share({ title: 'Ember money', url: r.uri }); return; } catch (e) { if (String(e && e.message).toLowerCase().includes('cancel')) return; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; a.click();
  };
})(window.E);
