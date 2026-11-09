(function (Q) {
  'use strict';
  const { esc, ic } = Q;
  const X = () => Q.X();
  const r0 = n => Math.round(n);

  // ================= FUEL: food diary on top of the meal plan =================
  const SLOTS = [['breakfast', 'Breakfast', 'sunrise'], ['lunch', 'Lunch', 'sun'], ['dinner', 'Dinner', 'moon'], ['snack', 'Snacks', 'cookie']];
  const foodById = id => {
    if (id.startsWith('my:')) { const f = X().myFoods.find(m => 'my:' + m.id === id); return f && { n: f.n, k: f.k, p: f.p, c: f.c, f: f.f, unit: f.unit ? [f.unit, f.uname || 'portion', f.uname || 'portions'] : null, cat: 'My foods' }; }
    if (id.startsWith('rc:')) { const r = X().recipes.find(m => 'rc:' + m.id === id); if (!r) return null; const t = recipeTotals(r); return { n: r.n, k: t.k / t.g * 100, p: t.p / t.g * 100, c: t.c / t.g * 100, f: t.f / t.g * 100, unit: [t.g / (r.portions || 1), 'portion', 'portions'], cat: 'Recipes' }; }
    return Q.FOODS[id];
  };
  const recipeTotals = r => r.items.reduce((a, it) => { const f = Q.FOODS[it.id] || foodById(it.id) || { k: 0, p: 0, c: 0, f: 0 }; const m = it.g / 100; return { g: a.g + it.g, k: a.k + f.k * m, p: a.p + f.p * m, c: a.c + f.c * m, f: a.f + f.f * m }; }, { g: 0, k: 0, p: 0, c: 0, f: 0 });
  const entryMacros = e => { const f = foodById(e.id); if (!f) return { k: e.k || 0, p: e.p || 0, c: e.c || 0, f: e.f || 0 }; const m = e.g / 100; return { k: f.k * m, p: f.p * m, c: f.c * m, f: f.f * m }; };
  const dayDiary = d => X().diary[d] || [];

  Q.calDay = d => {
    let k = 0, p = 0, c = 0, f = 0, T = null;
    try {
      if (Q.S.hero.onboarded) {
        const mp = Q.mealPlan(d), log = Q.mealLog(d); T = mp.T;
        for (const m of mp.meals) if (!m.empty && log[m.slot] === 'done') { k += m.k; p += m.p; c += m.c; f += m.f; }
      }
    } catch (e) { /* no plan */ }
    for (const e of dayDiary(d)) { const m = entryMacros(e); k += m.k; p += m.p; c += m.c; f += m.f; }
    T = T || (Q.targets ? Q.targets() : { kcal: 2000, p: 140, c: 200, f: 60 });
    return { eaten: r0(k), p: r0(p), c: r0(c), f: r0(f), target: r0(T.kcal), pt: r0(T.p), ct: r0(T.c), ft: r0(T.f) };
  };
  Q.calToday = () => Q.calDay(Q.today());

  function fuelView() {
    const d = Q.ui.fuelDate || Q.today(), c = Q.calDay(d), left = c.target - c.eaten;
    const macro = (n, v, t, col) => `<div class="kpi"><small>${n}</small><b>${v}<span class="muted" style="font-size:12px"> / ${t} g</span></b><div class="bar thin" style="--c:${col}"><i style="width:${Q.pct(v, t)}%;background:${col}"></i></div></div>`;
    const diary = dayDiary(d);
    const slots = SLOTS.map(([s, l, icn]) => {
      const es = diary.filter(e => e.slot === s), sk = r0(es.reduce((a, e) => a + entryMacros(e).k, 0));
      return `<section class="card"><div class="card-h"><div style="display:flex;gap:10px;align-items:center"><div class="dot">${ic(icn)}</div><b>${l}</b></div><div style="display:flex;gap:8px;align-items:center"><span class="muted small">${sk} kcal</span><button class="plus gold" data-act="food-add" data-slot="${s}">${ic('plus')}</button></div></div>
        ${es.map(e => { const f = foodById(e.id), m = entryMacros(e); return Q.li({ title: esc(f ? f.n : e.n || 'Food'), sub: `${amountText(e, f)} · ${r0(m.p)} g protein`, right: `${r0(m.k)}<button class="x-del" data-act="food-del" data-id="${e.id + '|' + e.t}">${ic('x')}</button>` }); }).join('') || '<p class="empty" style="padding:6px">Nothing logged.</p>'}</section>`;
    }).join('');
    return `${Q.head('Fuel')}
      ${Q.tabsBar('fuel', [['diary', 'Diary', 'notebook-pen'], ['plan', 'Meal plan', 'chef-hat'], ['foods', 'My foods & recipes', 'cooking-pot']], Q.tabOf('fuel', 'diary'))}
      ${Q.tabOf('fuel', 'diary') === 'plan' ? Q.viewFuel() : Q.tabOf('fuel', 'diary') === 'foods' ? foodsView() : `
      <div class="daynav"><button data-act="fd-prev">${ic('chevron-left')}</button><b>${Q.dateLabel(d)}</b><button data-act="fd-next" ${d >= Q.today() ? 'disabled' : ''}>${ic('chevron-right')}</button></div>
      <section class="card" style="display:flex;gap:18px;align-items:center">
        ${Q.ring(c.eaten / Math.max(1, c.target), { size: 128, label: left >= 0 ? left : '+' + -left, sub: left >= 0 ? 'kcal left' : 'kcal over', over: left < 0 })}
        <div style="flex:1"><div class="muted small">Eaten</div><div class="disp big">${c.eaten}</div><div class="muted small">of ${c.target} kcal goal</div><p class="hint">Planned meals you tick in Meal plan count here too.</p></div>
      </section>
      <div class="kpis" style="margin-bottom:14px">${macro('Protein', c.p, c.pt, '#22d3ee')}${macro('Carbs', c.c, c.ct, '#a78bfa')}${macro('Fat', c.f, c.ft, '#fbbf24')}</div>
      ${slots}
      <button class="btn ghost wide" data-act="save-day-meal">${ic('book-marked')} Save today's foods as a meal</button>`}`;
  }
  const amountText = (e, f) => f && f.unit && e.u ? `${Q.frac(e.g / f.unit[0])} ${e.g / f.unit[0] === 1 ? f.unit[1] : f.unit[2]}` : `${r0(e.g)} g`;

  function foodsView() {
    const x = X();
    return `<section class="card"><div class="card-h"><b>My foods</b><button class="plus gold" data-act="myfood-new" data-manual="1">${ic('plus')}</button></div>
      ${x.myFoods.map(f => Q.li({ title: esc(f.n), sub: `${r0(f.k)} kcal · ${r0(f.p)} p / 100 g${f.unit ? ` · portion ${f.unit} g` : ''}`, right: `<button class="x-del" data-act="myfood-del" data-id="${f.id}">${ic('x')}</button>` })).join('') || '<p class="empty">Add packaged foods using the label on the pack. They stay forever.</p>'}</section>
      <section class="card"><div class="card-h"><b>Saved meals</b></div>
      ${x.saved.map(m => Q.li({ title: esc(m.n), sub: `${m.items.length} foods · ${r0(m.items.reduce((a, e) => a + entryMacros(e).k, 0))} kcal`, right: `<button class="x-del" data-act="saved-del" data-id="${m.id}">${ic('x')}</button>` })).join('') || '<p class="empty">Log a day, then tap "Save today\'s foods as a meal" for one-tap logging.</p>'}</section>
      <section class="card"><div class="card-h"><b>Recipes & batch cooking</b><button class="plus gold" data-act="recipe-new">${ic('plus')}</button></div>
      ${x.recipes.map(r => { const t = recipeTotals(r), n = r.portions || 1; return Q.li({ title: esc(r.n), sub: `${n} portions · ${r0(t.k / n)} kcal, ${r0(t.p / n)} g protein each`, right: `<button class="x-del" data-act="recipe-del" data-id="${r.id}">${ic('x')}</button>` }); }).join('') || '<p class="empty">Build a recipe once (e.g. a week of chicken & rice), set the portions, and log it as "1 portion".</p>'}</section>`;
  }

  const allFoods = () => {
    const x = X(), out = [];
    for (const id in Q.FOODS) out.push([id, Q.FOODS[id]]);
    for (const f of x.myFoods) out.push(['my:' + f.id, foodById('my:' + f.id)]);
    for (const r of x.recipes) out.push(['rc:' + r.id, foodById('rc:' + r.id)]);
    return out;
  };
  const recentFoods = () => { const seen = new Set(), out = []; const days = Object.keys(X().diary).sort().reverse(); for (const d of days) for (const e of X().diary[d]) if (!seen.has(e.id) && foodById(e.id)) { seen.add(e.id); out.push(e.id); if (out.length >= 8) return out; } return out; };

  Q.foodPicker = slot => {
    const x = X();
    Q.sheet(`<h3>Add to ${SLOTS.find(s => s[0] === slot)[1]}</h3>
      <div class="addbar"><input id="fs-q" placeholder="Search foods, dishes, recipes…" autocomplete="off">${Q.canScan && Q.canScan() ? `<button class="btn" data-act="scan-food" data-slot="${slot}" aria-label="Scan barcode">${ic('scan-barcode')}</button>` : ''}</div>
      ${x.saved.length ? `<div class="sec"><span>Saved meals</span></div><div class="pill-row">${x.saved.map(m => `<button class="chip gold" data-act="saved-log" data-id="${m.id}" data-slot="${slot}">${ic('zap')} ${esc(m.n)}</button>`).join('')}</div>` : ''}
      <div id="fs-res" style="max-height:52vh;overflow:auto;margin-top:8px"></div>
      <button class="btn ghost wide" data-act="myfood-new" data-manual="1">${ic('plus')} Food not here? Add it from the label</button>`, { full: true });
    const box = document.getElementById('fs-res'), inp = document.getElementById('fs-q');
    const paint = () => {
      const q = inp.value.trim().toLowerCase();
      let list = q ? allFoods().filter(([, f]) => f && (f.n.toLowerCase().includes(q) || (f.cat || '').toLowerCase().includes(q))).slice(0, 40) : recentFoods().map(id => [id, foodById(id)]);
      if (!q && !list.length) list = allFoods().slice(0, 25);
      box.innerHTML = (q ? '' : '<div class="sec"><span>Recent</span></div>') + list.map(([id, f]) => Q.li({ title: esc(f.n), sub: `${r0(f.k)} kcal · ${Math.round(f.p * 10) / 10} g protein / 100 g · ${esc(f.cat || '')}`, act: 'food-pick', id, attrs: `data-slot="${slot}"`, right: ic('plus') })).join('') || '<p class="empty">No match. Add it as your own food.</p>';
    };
    inp.addEventListener('input', paint); paint(); setTimeout(() => inp.focus(), 50);
  };
  Q.ACTS['food-add'] = el => Q.foodPicker(el.dataset.slot);
  Q.ACTS['food-pick'] = el => {
    const id = el.dataset.id, f = foodById(id), slot = el.dataset.slot; if (!f) return;
    const unit = f.unit;
    Q.sheet(`<h3>${esc(f.n)}</h3><p class="muted small">${r0(f.k)} kcal · P ${f.p} · C ${f.c} · F ${f.f} per 100 g</p>
      ${unit ? Q.field('Amount', `<div class="addbar"><input id="fa-n" type="number" inputmode="decimal" value="1" step="0.5"><select id="fa-u"><option value="u">${esc(unit[2])} (${r0(unit[0])} g)</option><option value="g">grams</option></select></div>`)
        : Q.field('Grams', `<input id="fa-n" type="number" inputmode="decimal" value="100"><input type="hidden" id="fa-u" value="g">`)}
      <div id="fa-prev" class="hint"></div>
      <div class="actions"><button class="btn primary wide" data-act="food-log" data-id="${id}" data-slot="${slot}">Log it</button></div>`);
    const prev = () => { const n = parseFloat(Q.val('fa-n')) || 0, u = Q.val('fa-u'), g = u === 'u' && unit ? n * unit[0] : n; document.getElementById('fa-prev').textContent = `${r0(g)} g = ${r0(f.k * g / 100)} kcal · ${r0(f.p * g / 100)} g protein`; };
    document.getElementById('fa-n').addEventListener('input', prev); const us = document.getElementById('fa-u'); if (us) us.addEventListener('change', prev); prev();
  };
  Q.ACTS['food-log'] = el => {
    const f = foodById(el.dataset.id); if (!f) return;
    const n = parseFloat(Q.val('fa-n')) || 0, u = Q.val('fa-u'), g = u === 'u' && f.unit ? n * f.unit[0] : n; if (g <= 0) return;
    const d = Q.ui.fuelDate || Q.today(), x = X(), b = Q.game();
    (x.diary[d] = x.diary[d] || []).push({ id: el.dataset.id, g, u: u === 'u', slot: el.dataset.slot, t: Date.now() });
    Q.save(); Q.closeSheet(); Q.toast(`Logged ${f.n}`); Q.afterChange(b);
  };
  Q.ACTS['food-del'] = el => { const [id, t] = el.dataset.id.split('|'), d = Q.ui.fuelDate || Q.today(), x = X(); x.diary[d] = (x.diary[d] || []).filter(e => !(e.id === id && String(e.t) === t)); if (!x.diary[d].length) delete x.diary[d]; Q.save(); Q.render(); };
  Q.ACTS['fd-prev'] = () => { Q.ui.fuelDate = Q.addDays(Q.ui.fuelDate || Q.today(), -1); Q.render(); };
  Q.ACTS['fd-next'] = () => { const d = Q.ui.fuelDate || Q.today(); if (d < Q.today()) { Q.ui.fuelDate = Q.addDays(d, 1); Q.render(); } };
  Q.foodByBarcode = code => X().myFoods.find(f => f.barcode === code);
  Q.ACTS['myfood-new'] = el => { if (el && el.dataset && el.dataset.manual) Q.ui.barcode = null; Q.sheet(`<h3>Add your own food</h3><p class="muted small">Copy the numbers from the label (per 100 g).</p>
    ${Q.ui.barcode ? `<p class="chip gold">${ic('scan-barcode')} Barcode ${esc(Q.ui.barcode)} · saved with this food</p>` : ''}
    ${Q.field('Name', '<input id="mf-n" placeholder="e.g. Protein bar, local brand">')}
    <div class="sgrid">${Q.field('kcal', '<input id="mf-k" type="number" inputmode="decimal">')}${Q.field('Protein g', '<input id="mf-p" type="number" inputmode="decimal">')}${Q.field('Carbs g', '<input id="mf-c" type="number" inputmode="decimal">')}${Q.field('Fat g', '<input id="mf-f" type="number" inputmode="decimal">')}</div>
    <div class="sgrid">${Q.field('Portion (g, optional)', '<input id="mf-u" type="number" inputmode="decimal" placeholder="e.g. 45">')}${Q.field('Portion name', '<input id="mf-un" placeholder="bar">')}</div>
    <div class="actions"><button class="btn primary wide" data-act="myfood-save">Save food</button></div>`); };
  Q.ACTS['myfood-save'] = () => {
    const n = Q.val('mf-n').trim(), k = parseFloat(Q.val('mf-k')); if (!n || !(k >= 0)) { Q.toast('Name and kcal are needed'); return; }
    X().myFoods.push({ id: Q.uid(), n, k, p: +Q.val('mf-p') || 0, c: +Q.val('mf-c') || 0, f: +Q.val('mf-f') || 0, unit: +Q.val('mf-u') || null, uname: Q.val('mf-un').trim() || 'portion', barcode: Q.ui.barcode || null }); const slot = Q.ui.scanSlot; Q.ui.barcode = null;
    Q.save(); Q.closeSheet(); Q.toast('Saved to My foods'); Q.render();
    if (slot) { Q.ui.scanSlot = null; const f = X().myFoods[X().myFoods.length - 1]; const el = document.createElement('i'); el.dataset.id = 'my:' + f.id; el.dataset.slot = slot; Q.ACTS['food-pick'](el); }
  };
  Q.ACTS['myfood-del'] = el => { const x = X(); x.myFoods = x.myFoods.filter(f => f.id !== el.dataset.id); Q.save(); Q.render(); };
  Q.ACTS['save-day-meal'] = () => {
    const d = Q.ui.fuelDate || Q.today(), es = dayDiary(d); if (!es.length) { Q.toast('Log some foods first'); return; }
    Q.sheet(`<h3>Save as a meal</h3>${Q.field('Name', '<input id="sm-n" placeholder="e.g. My usual breakfast">')}<div class="actions"><button class="btn primary wide" data-act="saved-save">Save</button></div>`);
  };
  Q.ACTS['saved-save'] = () => { const d = Q.ui.fuelDate || Q.today(), n = Q.val('sm-n').trim() || 'Saved meal'; X().saved.push({ id: Q.uid(), n, items: dayDiary(d).map(e => ({ id: e.id, g: e.g, u: e.u, slot: e.slot })) }); Q.save(); Q.closeSheet(); Q.toast('Meal saved for one-tap logging'); Q.render(); };
  Q.ACTS['saved-log'] = el => { const m = X().saved.find(s => s.id === el.dataset.id); if (!m) return; const d = Q.ui.fuelDate || Q.today(), x = X(), b = Q.game(); x.diary[d] = x.diary[d] || []; m.items.forEach((it, i) => x.diary[d].push({ ...it, slot: el.dataset.slot || it.slot, t: Date.now() + i })); Q.save(); Q.closeSheet(); Q.toast(`Logged ${m.n}`); Q.afterChange(b); };
  Q.ACTS['saved-del'] = el => { const x = X(); x.saved = x.saved.filter(s => s.id !== el.dataset.id); Q.save(); Q.render(); };
  // recipes
  let draft = null;
  const paintRecipe = () => Q.sheet(`<h3>Recipe</h3>${Q.field('Name', `<input id="rc-n" value="${esc(draft.n)}" placeholder="e.g. Meal-prep chicken & rice">`)}${Q.field('Portions it makes', `<input id="rc-p" type="number" value="${draft.portions}" min="1">`)}
      <div class="sec"><span>Ingredients (raw grams)</span></div>${draft.items.map((it, i) => Q.li({ title: esc((Q.FOODS[it.id] || {}).n || it.id), sub: `${it.g} g`, right: `<button class="x-del" data-act="rc-rm" data-i="${i}">${ic('x')}</button>` })).join('') || '<p class="empty">No ingredients yet.</p>'}
      <div class="addbar"><select id="rc-f">${Object.keys(Q.FOODS).map(k => `<option value="${k}">${esc(Q.FOODS[k].n)}</option>`).join('')}</select><input id="rc-g" type="number" placeholder="g" style="max-width:90px"><button class="btn" data-act="rc-add">${ic('plus')}</button></div>
      ${draft.items.length ? (() => { const t = recipeTotals(draft), n = Math.max(1, draft.portions); return `<p class="hint">Total ${r0(t.k)} kcal · per portion ${r0(t.k / n)} kcal, ${r0(t.p / n)} g protein</p>`; })() : ''}
      <div class="actions"><button class="btn primary wide" data-act="rc-save">Save recipe</button></div>`, { full: true });
  const keepDraft = () => { const n = document.getElementById('rc-n'); if (n) { draft.n = n.value; draft.portions = Math.max(1, +Q.val('rc-p') || 1); } };
  Q.ACTS['recipe-new'] = () => { draft = { n: '', portions: 4, items: [] }; paintRecipe(); };
  Q.ACTS['rc-add'] = () => { keepDraft(); const g = +Q.val('rc-g'); if (g > 0) draft.items.push({ id: Q.val('rc-f'), g }); paintRecipe(); };
  Q.ACTS['rc-rm'] = el => { keepDraft(); draft.items.splice(+el.dataset.i, 1); paintRecipe(); };
  Q.ACTS['rc-save'] = () => { keepDraft(); if (!draft.n.trim() || !draft.items.length) { Q.toast('Add a name and ingredients'); return; } X().recipes.push({ id: Q.uid(), ...draft }); Q.save(); Q.closeSheet(); Q.toast('Recipe saved. Search it when logging.'); Q.render(); };
  Q.ACTS['recipe-del'] = el => { const x = X(); x.recipes = x.recipes.filter(r => r.id !== el.dataset.id); Q.save(); Q.render(); };

  // ================= TRAIN =================
  const lastFor = exId => { const L = X().train.logs; for (let i = L.length - 1; i >= 0; i--) { const e = L[i].ex.find(z => z.id === exId); if (e) return e; } return null; };
  // progressive overload: hit the top of the range on every set → add weight (or a rep target)
  const suggest = (exId, sets, lo, hi) => {
    const E = Q.EX[exId], last = lastFor(exId);
    if (!last) return { w: E.w ? 0 : null, r: lo, note: 'First time: pick a weight you could do 2–3 more reps with.' };
    const all = last.sets.length && last.sets.every(s => s.r >= hi), hit = last.sets.filter(s => s.r >= lo).length;
    if (E.w) {
      const w = last.sets.reduce((a, s) => Math.max(a, s.w || 0), 0);
      if (all) return { w: Math.round((w + E.inc) * 10) / 10, r: lo, note: `All sets hit ${hi}. Add ${E.inc} kg.` };
      if (hit < Math.ceil(sets / 2)) return { w, r: lo, note: 'Missed the range last time. Same weight, own it.' };
      return { w, r: Math.min(hi, Math.max(...last.sets.map(s => s.r)) + 1), note: 'Same weight, one more rep.' };
    }
    const best = Math.max(...last.sets.map(s => s.r));
    if (all) return { w: null, r: hi + E.inc, note: 'You own this range. New target.' };
    return { w: null, r: Math.min(hi, best + 1), note: 'Beat last time by one.' };
  };
  Q.nextWorkout = () => { const tr = X().train, p = Q.PROGRAMS[tr.prog]; if (!p) return null; const day = p.days[tr.next % p.days.length]; const last = tr.logs[tr.logs.length - 1]; return last && last.d === Q.today() ? null : `${day.n} · ${day.ex.length} exercises`; };

  function trainView() {
    const tr = X().train, p = Q.PROGRAMS[tr.prog];
    if (tr.active) return sessionView();
    const day = p.days[tr.next % p.days.length];
    const wk = tr.logs.filter(l => Q.diffDays(Q.today(), l.d) < 7).length;
    const vol = tr.logs.slice(-12).map(l => l.ex.reduce((a, e) => a + e.sets.reduce((b, s) => b + (s.w || 1) * s.r, 0), 0));
    const prs = {};
    for (const l of tr.logs) for (const e of l.ex) for (const s of e.sets) { const v = Q.EX[e.id] && Q.EX[e.id].w ? s.w : s.r; if (!prs[e.id] || v > prs[e.id]) prs[e.id] = v; }
    return `<section class="card"><div class="kicker">Program</div><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b style="font-size:17px">${esc(p.name)}</b><button class="chip" data-act="prog-switch">${ic('shuffle')} Switch</button></div><p class="muted small" style="margin-top:6px">${esc(p.note)}</p></section>
      <section class="card"><div class="card-h"><div><div class="kicker">Up next</div><b>${esc(day.n)}</b></div><span class="tag">${wk} this week</span></div>
        ${day.ex.map(([id, s, lo, hi]) => { const E = Q.EX[id], sg = suggest(id, s, lo, hi); return Q.li({ icon: 'dumbbell', color: '#22d3ee', title: esc(E.n), sub: `${s} × ${lo}–${hi}${E.t === 'time' ? ' s' : ''} · ${esc(E.m)}`, right: sg.w ? sg.w + ' kg' : '' }); }).join('')}
        <button class="btn primary wide" data-act="wo-start" style="margin-top:12px">${ic('zap')} Start workout</button>
        <button class="btn ghost wide" data-act="wo-skipday">Do the next day instead</button></section>
      <section class="card"><div class="card-h"><b>Training volume</b><span class="muted small">last ${vol.length} sessions</span></div>${Q.spark(vol)}</section>
      <section class="card"><div class="card-h"><b>Personal records</b></div>${Object.keys(prs).map(id => Q.li({ icon: 'trophy', color: '#fbbf24', title: esc(Q.EX[id].n), right: Q.EX[id].w ? prs[id] + ' kg' : prs[id] + (Q.EX[id].t === 'time' ? ' s' : ' reps') })).join('') || '<p class="empty">Your best lifts appear here.</p>'}</section>
      <section class="card"><div class="card-h"><b>History</b></div>${tr.logs.slice(-8).reverse().map(l => Q.li({ title: esc(l.n), sub: `${Q.whenLabel(l.d)} · ${l.ex.length} exercises · ${l.mins || '?'} min` })).join('') || '<p class="empty">No workouts yet.</p>'}</section>`;
  }
  function sessionView() {
    const a = X().train.active;
    const rest = a.restEnd && a.restEnd > Date.now() ? Math.ceil((a.restEnd - Date.now()) / 1000) : 0;
    return `<section class="card"><div class="kicker">In progress</div><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">${esc(a.n)}</b><span class="tag">${Math.max(1, Math.round((Date.now() - a.start) / 60000))} min</span></div>
      ${rest ? `<div class="flash" style="margin-top:12px"><div class="kicker">Rest</div><div class="big-timer" id="rest-t">${rest}</div><button class="chip" data-act="rest-skip">Skip rest</button></div>` : ''}</section>
      ${a.ex.map((e, i) => { const E = Q.EX[e.id]; return `<section class="card"><div class="card-h"><div><b>${esc(E.n)}</b><small class="muted">${e.lo}–${e.hi}${E.t === 'time' ? ' s' : ' reps'} · ${esc(e.note)}</small></div></div>
        ${e.sets.map((s, j) => `<div class="li"><span class="tag">Set ${j + 1}</span>${E.w ? `<input type="number" inputmode="decimal" value="${s.w}" data-wo="w" data-i="${i}" data-j="${j}" style="width:80px"> <span class="muted small">kg</span>` : ''}<input type="number" inputmode="numeric" value="${s.r}" data-wo="r" data-i="${i}" data-j="${j}" style="width:70px"><span class="muted small">${E.t === 'time' ? 's' : 'reps'}</span><button class="cb ${s.ok ? 'on' : ''}" data-act="set-ok" data-i="${i}" data-j="${j}">${s.ok ? ic('check') : ''}</button></div>`).join('')}</section>`; }).join('')}
      <div class="actions"><button class="btn ghost" data-act="wo-cancel">Cancel</button><button class="btn primary" data-act="wo-finish">${ic('flag')} Finish</button></div>`;
  }
  Q.ACTS['prog-switch'] = () => { const tr = X().train; tr.prog = tr.prog === 'home' ? 'gym' : 'home'; tr.next = 0; Q.save(); Q.toast(Q.PROGRAMS[tr.prog].name); Q.render(); };
  Q.ACTS['wo-skipday'] = () => { X().train.next++; Q.save(); Q.render(); };
  Q.ACTS['wo-start'] = () => {
    const tr = X().train, day = Q.PROGRAMS[tr.prog].days[tr.next % Q.PROGRAMS[tr.prog].days.length];
    tr.active = { n: day.n, start: Date.now(), ex: day.ex.map(([id, s, lo, hi]) => { const sg = suggest(id, s, lo, hi); return { id, lo, hi, note: sg.note, sets: Array.from({ length: s }, () => ({ w: sg.w || 0, r: sg.r, ok: false })) }; }) };
    Q.save(); Q.render(); window.scrollTo(0, 0);
  };
  let restTick = null;
  const runRest = () => { clearInterval(restTick); restTick = setInterval(() => { const a = X().train.active, el = document.getElementById('rest-t'); if (!a || !a.restEnd) { clearInterval(restTick); return; } const s = Math.ceil((a.restEnd - Date.now()) / 1000); if (s <= 0) { a.restEnd = null; clearInterval(restTick); Q.buzz([200, 80, 200]); Q.sfx('coin'); Q.render(); return; } if (el) el.textContent = s; }, 300); };
  Q.ACTS['set-ok'] = el => { const a = X().train.active, s = a.ex[+el.dataset.i].sets[+el.dataset.j]; s.ok = !s.ok; if (s.ok) { a.restEnd = Date.now() + (Q.EX[a.ex[+el.dataset.i].id].w ? 120 : 75) * 1000; Q.celebrate(el); runRest(); } Q.save(); Q.render(); };
  Q.ACTS['rest-skip'] = () => { X().train.active.restEnd = null; Q.save(); Q.render(); };
  Q.ACTS['wo-cancel'] = () => { if (!confirm('Cancel this workout? Nothing will be saved.')) return; X().train.active = null; Q.save(); Q.render(); };
  Q.ACTS['wo-finish'] = el => {
    const tr = X().train, a = tr.active, b = Q.game();
    const ex = a.ex.map(e => ({ id: e.id, sets: e.sets.filter(s => s.ok).map(s => ({ w: +s.w || 0, r: +s.r || 0 })) })).filter(e => e.sets.length);
    if (!ex.length) { Q.toast('Tick at least one set'); return; }
    tr.logs.push({ d: Q.today(), n: a.n, ex, mins: Math.round((Date.now() - a.start) / 60000) });
    tr.active = null; tr.next++;
    const wq = Q.S.quests.find(q => q.key === 'workout' && Q.activeOn(q, Q.today())); if (wq) Q.setLog(Q.today(), wq.id, true);
    Q.save(); Q.celebrate(el, '+30 XP'); Q.toast('Workout saved. Strong work.'); Q.afterChange(b, { date: Q.today() });
  };
  document.addEventListener('change', e => { const t = e.target; if (!t.dataset || !t.dataset.wo) return; const a = X().train.active; if (!a) return; a.ex[+t.dataset.i].sets[+t.dataset.j][t.dataset.wo] = parseFloat(t.value) || 0; Q.save(); });

  // ================= MOBILITY (guided) =================
  let mobT = null;
  function mobView() {
    const m = X().mob, run = Q.ui.mob;
    if (run) {
      const R = Q.MOBILITY[run.k], cur = R.lv[run.i], nxt = R.lv[run.i + 1], left = Math.max(0, Math.ceil((run.end - Date.now()) / 1000));
      return `<section class="card c"><div class="kicker">${esc(R.n)} · ${run.i + 1}/${R.lv.length}</div>
        <div style="display:flex;justify-content:center;margin:16px 0">${Q.ring(1 - left / cur[1], { size: 200, stroke: 7, label: `<span id="mob-t">${left}</span>`, sub: 'seconds' })}</div>
        <h2 class="disp" style="font-size:24px">${esc(cur[0])}</h2><p class="muted" style="margin:8px 0 14px">${esc(cur[2])}</p>
        ${nxt ? `<p class="small muted">Next: <b>${esc(nxt[0])}</b></p>` : '<p class="small muted">Last one. Finish strong.</p>'}
        <div class="actions"><button class="btn ghost" data-act="mob-stop">Stop</button><button class="btn ghost" data-act="mob-pause">${run.paused ? 'Resume' : 'Pause'}</button><button class="btn primary" data-act="mob-next">Next ${ic('chevron-right')}</button></div></section>`;
    }
    const wk = m.logs.filter(l => Q.diffDays(Q.today(), l.d) < 7).length;
    return `<section class="card"><div class="card-h"><div><div class="kicker">This week</div><b>${wk} mobility session${wk === 1 ? '' : 's'}</b></div>${Q.ring(Math.min(1, wk / 7), { size: 56, stroke: 12, label: '' })}</div><p class="muted small">Desk-job plan: the Desk reset every workday, Full body twice a week. The holds get longer automatically as you log more sessions.</p></section>
      <div class="sgrid">${Object.entries(Q.MOBILITY).map(([k, R]) => { const n = m.logs.filter(l => l.k === k).length; return `<button class="tile" data-act="mob-start" data-k="${k}"><div class="dot">${ic(k === 'knees' ? 'footprints' : k === 'back' ? 'heart-pulse' : k === 'full' ? 'person-standing' : 'laptop')}</div><b>${esc(R.n)}</b><small>${R.mins} min · ${esc(R.d)}</small><small>${n ? `Done ${n}×` : 'New'}</small></button>`; }).join('')}</div>`;
  }
  // holds grow 10% every 8 sessions of that routine, capped at +50%
  const holdFor = (k, sec) => Math.round(sec * Math.min(1.5, 1 + 0.1 * Math.floor(X().mob.logs.filter(l => l.k === k).length / 8)));
  const mobStep = () => {
    clearInterval(mobT);
    mobT = setInterval(() => {
      const run = Q.ui.mob; if (!run) { clearInterval(mobT); return; }
      if (run.paused) return;
      const s = Math.ceil((run.end - Date.now()) / 1000), el = document.getElementById('mob-t');
      if (s <= 0) { Q.ACTS['mob-next'](); return; }
      if (el) el.textContent = s;
      if (s === 3) Q.sfx('tap');
    }, 250);
  };
  Q.ACTS['mob-start'] = el => { const k = el.dataset.k, R = Q.MOBILITY[k]; R.lv.forEach(l => { l[1] = l._b || (l._b = l[1]); }); R.lv.forEach(l => { l[1] = holdFor(k, l._b); }); Q.ui.mob = { k, i: 0, end: Date.now() + R.lv[0][1] * 1000, start: Date.now() }; Q.render(); window.scrollTo(0, 0); mobStep(); Q.buzz(30); };
  Q.ACTS['mob-pause'] = () => { const r = Q.ui.mob; if (!r) return; if (r.paused) { r.end = Date.now() + r.left; r.paused = false; } else { r.left = r.end - Date.now(); r.paused = true; } Q.render(); };
  Q.ACTS['mob-next'] = () => {
    const r = Q.ui.mob; if (!r) return; const R = Q.MOBILITY[r.k];
    r.i++; Q.buzz([60, 40, 60]); Q.sfx('coin');
    if (r.i >= R.lv.length) {
      clearInterval(mobT); const b = Q.game();
      X().mob.logs.push({ d: Q.today(), k: r.k, mins: Math.round((Date.now() - r.start) / 60000) });
      const mq = Q.S.quests.find(q => q.key === 'mobility' && Q.activeOn(q, Q.today())); if (mq) Q.setLog(Q.today(), mq.id, true);
      Q.ui.mob = null; Q.save(); Q.toast('Mobility done · +12 XP'); Q.afterChange(b, { date: Q.today() }); return;
    }
    r.end = Date.now() + R.lv[r.i][1] * 1000; r.paused = false; Q.render();
  };
  Q.ACTS['mob-stop'] = () => { clearInterval(mobT); Q.ui.mob = null; Q.render(); };

  // ================= MEASURE =================
  const MEAS = [['waist', 'Waist'], ['chest', 'Chest'], ['hips', 'Hips'], ['arm', 'Arm'], ['thigh', 'Thigh'], ['neck', 'Neck']];
  function measureView() {
    const W = Q.S.weights.slice().sort((a, b) => a.d.localeCompare(b.d)), x = X();
    const last = W[W.length - 1], first = W[0], wk = W.filter(w => Q.diffDays(Q.today(), w.d) <= 7);
    const T = Q.targets ? Q.targets() : null;
    const latestM = {}; for (const m of x.measures) latestM[m.k] = m;
    return `${Q.healthCard ? Q.healthCard() : ''}<section class="card"><div class="card-h"><div><div class="kicker">Weight</div><div class="disp huge">${last ? last.kg : '—'}<span class="muted" style="font-size:16px"> kg</span></div></div><button class="btn primary" data-act="weigh">${ic('scale')} Log</button></div>
        ${last && first && last !== first ? `<p class="small ${last.kg <= first.kg ? 'good' : 'bad'}">${last.kg <= first.kg ? '▼' : '▲'} ${Math.abs(Math.round((last.kg - first.kg) * 10) / 10)} kg since ${Q.niceDate(first.d)}</p>` : ''}
        ${Q.spark(W.slice(-30).map(w => w.kg), { h: 110 })}
        ${T ? `<div class="kpis" style="margin-top:10px"><div class="kpi"><small>BMI</small><b>${T.bmi}</b></div><div class="kpi"><small>Daily target</small><b>${T.kcal}</b></div><div class="kpi"><small>Weekly pace</small><b>${T.weekly} kg</b></div></div>` : ''}
        ${wk.length ? '' : '<p class="hint">Weigh in once a week, same morning, after the bathroom.</p>'}</section>
      <section class="card"><div class="card-h"><b>Measurements (cm)</b><button class="plus gold" data-act="meas-add">${ic('plus')}</button></div>
        ${MEAS.map(([k, l]) => { const vals = x.measures.filter(m => m.k === k).map(m => m.v), m = latestM[k]; return Q.li({ title: l, sub: m ? Q.whenLabel(m.d) : 'Not measured yet', right: m ? `${m.v}${vals.length > 1 ? ` <small class="${vals[vals.length - 1] <= vals[0] ? 'good' : 'bad'}">${vals[vals.length - 1] - vals[0] > 0 ? '+' : ''}${Math.round((vals[vals.length - 1] - vals[0]) * 10) / 10}</small>` : ''}` : '—' }); }).join('')}
        <p class="hint">Waist is the best fat-loss signal. Measure every 2 weeks at the navel.</p></section>`;
  }
  Q.ACTS.weigh = () => Q.sheet(`<h3>Log weight</h3>${Q.field('Kilograms', `<input id="wt" type="number" inputmode="decimal" step="0.1" value="${Q.latestWeight ? Q.latestWeight() : ''}">`)}<div class="actions"><button class="btn primary wide" data-act="weigh-save">Save</button></div>`);
  Q.ACTS['weigh-save'] = () => { const kg = parseFloat(Q.val('wt')); if (!(kg > 30 && kg < 300)) return; const t = Q.today(), b = Q.game(); Q.S.weights = Q.S.weights.filter(w => w.d !== t); Q.S.weights.push({ d: t, kg: Math.round(kg * 10) / 10 }); Q.save(); Q.closeSheet(); Q.toast('Weight logged'); Q.afterChange(b); };
  Q.ACTS['meas-add'] = () => Q.sheet(`<h3>Measurements</h3><p class="muted small">Fill only what you measured today.</p><div class="sgrid">${MEAS.map(([k, l]) => Q.field(l, `<input id="ms-${k}" type="number" inputmode="decimal" step="0.5">`)).join('')}</div><div class="actions"><button class="btn primary wide" data-act="meas-save">Save</button></div>`);
  Q.ACTS['meas-save'] = () => { const t = Q.today(), x = X(), b = Q.game(); let n = 0; for (const [k] of MEAS) { const v = parseFloat(Q.val('ms-' + k)); if (v > 0) { x.measures = x.measures.filter(m => !(m.k === k && m.d === t)); x.measures.push({ d: t, k, v }); n++; } } if (n) { Q.save(); Q.toast('Measurements saved'); } Q.closeSheet(); Q.afterChange(b); };

  // ================= BODY TAB =================
  Q.VIEWS.body = () => {
    const sub = Q.tabOf('body', 'fuel');
    const bar = Q.tabsBar('body', [['fuel', 'Fuel', 'utensils'], ['train', 'Train', 'dumbbell'], ['mob', 'Mobility', 'person-standing'], ['measure', 'Weight', 'scale']], sub);
    if (sub === 'fuel') return fuelView().replace('<h1 class="pt">Fuel</h1>', `${Q.head('Body')}${bar}`);
    return Q.head('Body') + bar + (sub === 'train' ? trainView() : sub === 'mob' ? mobView() : measureView());
  };
  if (X().train.active && X().train.active.restEnd) runRest();
})(window.Q);
