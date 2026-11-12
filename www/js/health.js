(function (E) {
  'use strict';
  const { esc, ic } = E;
  const S = () => E.S, F = () => E.S.food;
  const r0 = Math.round;
  const MEALS = [['breakfast', 'Breakfast', 'coffee'], ['lunch', 'Lunch', 'utensils'], ['dinner', 'Dinner', 'soup'], ['extra', 'Extras', 'cookie']];

  // ================= FOOD =================
  function foodView() {
    const d = E.ui.foodDay || E.today(), T = E.targets(), f = E.dayFood(d), left = T.kcal - f.k;
    const fsub = E.ui.sub.food || 'diary';
    if (fsub === 'prep') return prepView();
    const diary = F().diary[d] || [];
    return `<div class="row" style="justify-content:space-between;margin-bottom:12px"><button class="round" data-a="fd" data-n="-1" aria-label="Previous day">${ic('chevron-left')}</button><b class="mid" style="font-size:18px">${E.rel(d)}</b><button class="round" data-a="fd" data-n="1" ${d >= E.today() ? 'disabled' : ''} aria-label="Next day">${ic('chevron-right')}</button></div>
      <section class="card"><div class="row" style="gap:18px">${E.ring(f.k / T.kcal, { size: 124, stroke: 11, label: E.n(Math.abs(left)), sub: left >= 0 ? 'kcal left' : 'kcal over', c: left < 0 ? 'var(--bad)' : 'var(--ember)' })}
        <div class="grow"><div class="small muted">Eaten</div><div class="big">${E.n(f.k)}</div><div class="small muted">of ${E.n(T.kcal)} kcal · about ${T.weekly} kg/week</div></div></div>
        <div class="macro">${[['Protein', f.p, T.p, 'var(--ember)'], ['Carbs', f.c, T.c, 'var(--sand)'], ['Fat', f.f, T.f, 'var(--slate)']].map(([n, v, t, c]) => `<div><small>${n}</small><b>${v}</b><span class="muted small"> / ${t} g</span>${E.bar(E.pct(v, t), c)}</div>`).join('')}</div></section>
      ${MEALS.map(([m, l, icn]) => { const es = diary.map((e, i) => ({ e, i })).filter(x => x.e.meal === m), k = es.reduce((a, x) => a + E.entryM(x.e).k, 0);
        return `${E.secH(`${l} <span class="small muted" style="font-family:Inter;font-weight:600">${es.length ? E.n(k) + ' kcal' : ''}</span>`, 'Add', 'food-add', `data-m="${m}"`)}<div class="list">${es.map(({ e, i }) => { const fd = E.foodById(e.id), mm = E.entryM(e); return E.item({ a: 'food-entry', attrs: `data-i="${i}"`, t: esc(fd ? fd.n : e.n || 'Food'), s: `${e.q ? 'Quick add' : amt(e, fd)} · ${r0(mm.p)} g protein`, r: `${r0(mm.k)}<small>kcal</small>` }); }).join('') || `<button class="item" data-a="food-add" data-m="${m}"><div class="ico sm" style="--c:var(--muted)">${ic(icn)}</div><div class="grow muted">Add ${l.toLowerCase()}</div>${ic('plus', 'dim')}</button>`}</div>`; }).join('')}
      <div class="grid2" style="margin-top:18px"><button class="btn ghost" data-a="seg" data-k="food" data-v="prep">${ic('chef-hat')} Meal prep</button><button class="btn ghost" data-a="save-meal">${ic('bookmark')} Save as meal</button></div>`;
  }
  const amt = (e, f) => f && f.unit && e.u ? `${E.n(e.g / f.unit[0], 1)} ${e.g / f.unit[0] === 1 ? f.unit[1] : f.unit[2]}` : `${r0(e.g)} g`;
  E.A.fd = el => { const d = E.ui.foodDay || E.today(), n = E.add(d, +el.dataset.n); if (n <= E.today()) { E.ui.foodDay = n; E.render(); } };

  const recent = () => { const seen = new Set(), out = []; for (const d of Object.keys(F().diary).sort().reverse()) for (const e of F().diary[d]) if (!seen.has(e.id) && E.foodById(e.id)) { seen.add(e.id); out.push(e.id); if (out.length >= 10) return out; } return out; };
  const allFoods = () => { const out = Object.entries(E.foods()); for (const m of F().myFoods) out.unshift(['my:' + m.id, E.foodById('my:' + m.id)]); for (const r of F().recipes) out.unshift(['rc:' + r.id, E.foodById('rc:' + r.id)]); return out; };
  E.A['food-add'] = el => {
    const m = el.dataset.m || mealNow(); E.ui.meal = m;
    E.sheet({ title: `Add to ${MEALS.find(x => x[0] === m)[1].toLowerCase()}`, full: true, body: `
      <div class="row" style="gap:8px"><input id="fs" placeholder="Search: chicken, shawarma, rice…" autocomplete="off" style="flex:1">${E.canScan() ? `<button class="round" style="width:50px;height:50px" data-a="scan" aria-label="Scan barcode">${ic('scan-barcode')}</button>` : ''}</div>
      ${F().saved.length ? `<div class="label" style="margin:16px 4px 8px">Saved meals</div><div class="chips">${F().saved.map(s => `<button class="chip" data-a="saved-log" data-id="${s.id}">${ic('bookmark')}${esc(s.n)}</button>`).join('')}</div>` : ''}
      <div class="chips" style="margin-top:12px"><button class="chip" data-a="food-quick">${ic('zap')}Quick calories</button>${yest(m).length ? `<button class="chip" data-a="food-copy">${ic('copy')}Same as yesterday</button>` : ''}</div>
      <div id="fs-r" style="margin-top:14px"></div>`, foot: `<button class="btn ghost" data-a="myfood-new">${ic('plus')} Food not listed? Add it</button>`, focus: 'fs' });
    const inp = E.$('#fs'), box = E.$('#fs-r');
    const paint = () => {
      const q = inp.value.trim().toLowerCase();
      const list = q ? allFoods().filter(([, f]) => f && (f.n.toLowerCase().includes(q) || (f.cat || '').toLowerCase().includes(q))).slice(0, 40) : recent().map(id => [id, E.foodById(id)]);
      box.innerHTML = (q ? '' : `<div class="label" style="margin:0 4px 8px">${list.length ? 'Recent' : 'Start typing to search'}</div>`) + (list.length ? `<div class="list">${list.map(([id, f]) => E.item({ a: 'food-pick', id, t: esc(f.n), s: `${r0(f.k)} kcal · ${E.n(f.p, 1)} g protein per 100 g`, r: ic('plus', 'ember') })).join('')}</div>` : q ? `<p class="empty">No match for “${esc(q)}”. Add it as your own food below.</p>` : '');
    };
    inp.addEventListener('input', paint); paint();
  };
  const yest = m => (F().diary[E.add(E.ui.foodDay || E.today(), -1)] || []).filter(e => e.meal === m);
  E.A['food-copy'] = () => { const d = E.ui.foodDay || E.today(), m = E.ui.meal, list = yest(m); (F().diary[d] = F().diary[d] || []); list.forEach((e, j) => F().diary[d].push({ ...e, t: Date.now() + j })); E.save(); E.close(true); E.toast(`Copied ${list.length} item${list.length === 1 ? '' : 's'} from yesterday`); E.render(); };
  E.A['food-quick'] = () => E.sheet({ title: 'Quick calories', body: `<p class="hint" style="margin-top:0">For when you know the number, or just want a rough estimate.</p>${E.field('What was it?', '<input id="fq-n" placeholder="e.g. Dinner at friends">')}<div class="grid2">${E.field('Calories', '<input id="fq-k" type="number" inputmode="numeric" style="font-size:22px;text-align:center" data-enter="food-quick-ok">')}${E.field('Protein g (optional)', '<input id="fq-p" type="number" inputmode="numeric" style="font-size:22px;text-align:center">')}</div><div class="chips">${[[300, 'Light meal'], [600, 'Normal meal'], [900, 'Big meal'], [1200, 'Feast']].map(([k, l]) => `<button class="chip" data-a="fq-set" data-k="${k}">${l} · ${k}</button>`).join('')}</div>`, foot: '<button class="btn primary" data-a="food-quick-ok">Add</button>', focus: 'fq-k' });
  E.A['fq-set'] = el => { E.$('#fq-k').value = el.dataset.k; };
  E.A['food-quick-ok'] = () => { const k = E.num('fq-k'); if (!(k > 0)) { E.toast('Enter the calories'); return; } const d = E.ui.foodDay || E.today(); (F().diary[d] = F().diary[d] || []).push({ id: 'quick', q: 1, n: E.val('fq-n') || 'Quick add', k, p: E.num('fq-p'), g: 0, meal: E.ui.meal || mealNow(), t: Date.now() }); E.save(); E.close(true); E.toast(`Added ${E.n(k)} kcal`); E.render(); };
  const mealNow = () => { const h = E.now().getHours(); return h < 11 ? 'breakfast' : h < 17 ? 'lunch' : 'dinner'; };
  E.A['food-pick'] = el => {
    const id = el.dataset.id, f = E.foodById(id); if (!f) return;
    const u = f.unit;
    E.sheet({ title: esc(f.n), body: `
      <p class="muted small" style="margin-bottom:14px">${r0(f.k)} kcal · protein ${E.n(f.p, 1)} g · carbs ${E.n(f.c, 1)} g · fat ${E.n(f.f, 1)} g per 100 g</p>
      ${u ? E.field('How much?', `${E.chips('fa-u', [['u', u[2]], ['g', 'grams']], 'u', { change: 'fa-prev' })}<input id="fa-n" type="number" inputmode="decimal" value="1" style="margin-top:10px;font-size:22px;text-align:center" data-enter="food-log">`)
        : E.field('Grams', `<input type="hidden" id="fa-u" value="g"><input id="fa-n" type="number" inputmode="decimal" value="100" style="font-size:22px;text-align:center" data-enter="food-log">`)}
      <p class="hint center" id="fa-p"></p>`, foot: `<button class="btn primary" data-a="food-log" data-id="${id}">Add</button>`, focus: 'fa-n' });
    E.$('#fa-n').addEventListener('input', E.A['fa-prev']); E.A['fa-prev']();
    E.$('#fa-n').dataset.id = id;
  };
  E.A['fa-prev'] = b => {
    const id = (E.$('#fa-n') || {}).dataset ? E.$('[data-a="food-log"]').dataset.id : null, f = id && E.foodById(id); if (!f) return;
    if (b && b.dataset && b.dataset.v) { const i = E.$('#fa-n'); i.value = b.dataset.v === 'u' ? 1 : r0(f.unit ? f.unit[0] : 100); }
    const n = E.num('fa-n'), g = E.val('fa-u') === 'u' && f.unit ? n * f.unit[0] : n;
    E.$('#fa-p').textContent = `${r0(g)} g · ${r0(f.k * g / 100)} kcal · ${r0(f.p * g / 100)} g protein`;
  };
  E.A['food-log'] = () => {
    const id = E.$('[data-a="food-log"]').dataset.id, f = E.foodById(id), n = E.num('fa-n'), u = E.val('fa-u') === 'u' && f.unit, g = u ? n * f.unit[0] : n;
    if (!(g > 0)) { E.toast('Enter an amount'); return; }
    const d = E.ui.foodDay || E.today(); (F().diary[d] = F().diary[d] || []).push({ id, g, u: !!u, meal: E.ui.meal || mealNow(), t: Date.now() });
    E.save(); E.close(true); E.buzz(10); E.toast(`Added ${f.n}`); E.render();
  };
  E.A['food-entry'] = el => {
    const d = E.ui.foodDay || E.today(), i = +el.dataset.i, e = F().diary[d][i], f = E.foodById(e.id);
    E.sheet({ title: esc(f ? f.n : e.n || 'Food'), body: E.field(e.q ? 'Calories' : 'Grams', `<input id="fe-g" type="number" inputmode="decimal" value="${r0(e.q ? e.k : e.g)}" style="font-size:22px;text-align:center">`) + E.field('Meal', E.chips('fe-m', MEALS.map(m => [m[0], m[1]]), e.meal)),
      foot: `<button class="btn danger" data-a="food-del" data-i="${i}">Remove</button><button class="btn primary" data-a="food-upd" data-i="${i}">Save</button>` });
  };
  E.A['food-upd'] = el => { const d = E.ui.foodDay || E.today(), e = F().diary[d][+el.dataset.i]; if (e.q) e.k = E.num('fe-g') || e.k; else { e.g = E.num('fe-g') || e.g; e.u = false; } e.meal = E.val('fe-m') || e.meal; E.save(); E.close(true); E.render(); };
  E.A['food-del'] = el => { const d = E.ui.foodDay || E.today(), i = +el.dataset.i, e = F().diary[d].splice(i, 1)[0]; if (!F().diary[d].length) delete F().diary[d]; E.save(); E.close(true); E.render(); E.toast('Removed', () => (F().diary[d] = F().diary[d] || []).splice(i, 0, e)); };
  E.A['save-meal'] = () => { const d = E.ui.foodDay || E.today(); if (!(F().diary[d] || []).length) { E.toast('Log some food first'); return; } E.sheet({ title: 'Save as a meal', body: E.field('Name', '<input id="sm-n" placeholder="e.g. My usual breakfast" data-enter="saved-save">') + '<p class="hint">Next time, add all of it with one tap.</p>', foot: '<button class="btn primary" data-a="saved-save">Save</button>', focus: 'sm-n' }); };
  E.A['saved-save'] = () => { const d = E.ui.foodDay || E.today(); F().saved.push({ id: E.uid(), n: E.val('sm-n') || 'My meal', items: F().diary[d].map(e => ({ id: e.id, g: e.g, u: e.u })) }); E.save(); E.close(true); E.toast('Meal saved'); E.render(); };
  E.A['saved-log'] = el => { const s = F().saved.find(x => x.id === el.dataset.id), d = E.ui.foodDay || E.today(); (F().diary[d] = F().diary[d] || []); s.items.forEach((it, j) => F().diary[d].push({ ...it, meal: E.ui.meal || mealNow(), t: Date.now() + j })); E.save(); E.close(true); E.toast(`Added ${s.n}`); E.render(); };
  E.A['myfood-new'] = () => {
    const bc = E.ui.barcode;
    E.sheet({ title: 'Add your own food', body: `${bc ? `<p class="pill ember" style="margin-bottom:14px">${ic('scan-barcode')} Barcode saved with this food</p>` : ''}
      ${E.field('Name', '<input id="mf-n" placeholder="e.g. Protein bar">')}<p class="hint" style="margin-top:-6px">From the label, per 100 g:</p>
      <div class="grid2">${E.field('Calories', '<input id="mf-k" type="number" inputmode="decimal">')}${E.field('Protein (g)', '<input id="mf-p" type="number" inputmode="decimal">')}${E.field('Carbs (g)', '<input id="mf-c" type="number" inputmode="decimal">')}${E.field('Fat (g)', '<input id="mf-f" type="number" inputmode="decimal">')}</div>
      <div class="grid2">${E.field('One portion (g)', '<input id="mf-u" type="number" inputmode="decimal" placeholder="optional">')}${E.field('Portion name', '<input id="mf-un" placeholder="bar, cup…">')}</div>`,
      foot: '<button class="btn primary" data-a="myfood-save">Save food</button>', focus: 'mf-n' });
  };
  E.A['myfood-save'] = () => {
    const n = E.val('mf-n'), k = E.num('mf-k'); if (!n || !k) { E.toast('Name and calories are needed'); return; }
    const f = { id: E.uid(), n, k, p: E.num('mf-p'), c: E.num('mf-c'), f: E.num('mf-f'), unit: E.num('mf-u') || null, uname: E.val('mf-un') || 'portion', barcode: E.ui.barcode || null };
    F().myFoods.push(f); E.ui.barcode = null; E.save(); E.close(true); E.toast('Saved to your foods');
    E.A['food-pick']({ dataset: { id: 'my:' + f.id } });
  };

  // ---------- meal prep: recipes + weekly grocery list ----------
  function prepView() {
    const R = F().recipes, plan = F().prep || [];
    const groc = {};
    for (const p of plan) { const r = R.find(x => x.id === p.id); if (!r) continue; const k = (p.n || 1) / Math.max(1, r.portions); for (const it of r.items) groc[it.id] = (groc[it.id] || 0) + it.g * k * Math.max(1, r.portions); }
    return `<button class="pill" data-a="seg" data-k="food" data-v="diary">${ic('chevron-left')} Food diary</button>
      <p class="hint">Cook once, eat for days. Build a recipe with its portions, add it to this week's prep, and the grocery list writes itself.</p>
      ${E.secH('My recipes', 'New', 'recipe-new')}
      <div class="list">${R.map(r => { const t = E.recipeTotals(r), n = Math.max(1, r.portions), inPlan = plan.some(p => p.id === r.id); return `<div class="item"><button class="grow tap" style="text-align:left" data-a="recipe-edit" data-id="${r.id}"><div class="t">${esc(r.n)}</div><div class="s">${n} portions · ${r0(t.k / n)} kcal · ${r0(t.p / n)} g protein each</div></button><button class="round ${inPlan ? 'on' : ''}" data-a="prep-toggle" data-id="${r.id}" aria-label="This week">${ic(inPlan ? 'check' : 'plus')}</button></div>`; }).join('') || `<p class="empty">${ic('chef-hat')}No recipes yet. Make your first batch recipe, like chicken, rice and vegetables for 4 days.</p>`}</div>
      ${plan.length ? E.secH('Grocery list for this week') + `<div class="list">${Object.entries(groc).map(([id, g]) => E.item({ icon: 'shopping-basket', sm: true, c: 'var(--sage)', t: esc((E.FOODS[id] || {}).n || id), r: g >= 1000 ? `${E.n(g / 1000, 1)} kg` : `${r0(g)} g` })).join('')}</div><button class="btn ghost wide" style="margin-top:10px" data-a="prep-clear">Start a new week</button>` : ''}`;
  }
  let draft = null;
  const recipeSheet = () => E.sheet({ title: draft.id ? 'Edit recipe' : 'New recipe', full: true, body: `
    ${E.field('Name', `<input id="rc-n" value="${esc(draft.n)}" placeholder="e.g. Chicken & rice prep">`)}
    ${E.field('How many portions does it make?', `<input id="rc-p" type="number" inputmode="numeric" value="${draft.portions}">`)}
    <div class="label" style="margin:6px 4px 8px">Ingredients (raw weight)</div>
    <div class="list">${draft.items.map((it, i) => E.item({ t: esc((E.FOODS[it.id] || {}).n || it.id), r: `${it.g} g <button class="round" style="display:inline-grid;width:32px;height:32px;margin-left:6px;vertical-align:middle" data-a="rc-rm" data-i="${i}">${ic('x')}</button>` })).join('') || '<p class="empty" style="padding:14px">No ingredients yet.</p>'}</div>
    <div class="row" style="margin-top:10px;gap:8px"><select id="rc-f" style="flex:2">${Object.entries(E.foods()).sort((a, b) => a[1].n.localeCompare(b[1].n)).map(([k, f]) => `<option value="${k}">${esc(f.n)}</option>`).join('')}</select><input id="rc-g" type="number" inputmode="decimal" placeholder="g" style="flex:1"><button class="round" style="width:50px;height:50px" data-a="rc-add">${ic('plus')}</button></div>
    ${draft.items.length ? (() => { const t = E.recipeTotals(draft), n = Math.max(1, draft.portions); return `<p class="hint">Each portion: ${r0(t.k / n)} kcal · ${r0(t.p / n)} g protein</p>`; })() : ''}`,
    foot: `${draft.id ? `<button class="btn danger" data-a="rc-del">Delete</button>` : ''}<button class="btn primary" data-a="rc-save">Save recipe</button>` });
  const keep = () => { const n = E.$('#rc-n'); if (n) { draft.n = n.value; draft.portions = Math.max(1, E.num('rc-p') || 1); } };
  E.A['recipe-new'] = () => { draft = { n: '', portions: 4, items: [] }; recipeSheet(); };
  E.A['recipe-edit'] = el => { draft = JSON.parse(JSON.stringify(F().recipes.find(r => r.id === el.dataset.id))); recipeSheet(); };
  E.A['rc-add'] = () => { keep(); const g = E.num('rc-g'); if (g > 0) draft.items.push({ id: E.val('rc-f'), g }); recipeSheet(); };
  E.A['rc-rm'] = el => { keep(); draft.items.splice(+el.dataset.i, 1); recipeSheet(); };
  E.A['rc-save'] = () => { keep(); if (!draft.n || !draft.items.length) { E.toast('Add a name and ingredients'); return; } if (draft.id) { const i = F().recipes.findIndex(r => r.id === draft.id); F().recipes[i] = draft; } else F().recipes.push({ ...draft, id: E.uid() }); E.save(); E.close(true); E.toast('Recipe saved. Search it when you log food.'); E.render(); };
  E.A['rc-del'] = () => { F().recipes = F().recipes.filter(r => r.id !== draft.id); F().prep = (F().prep || []).filter(p => p.id !== draft.id); E.save(); E.close(true); E.render(); };
  E.A['prep-toggle'] = el => { const p = F().prep = F().prep || [], i = p.findIndex(x => x.id === el.dataset.id); if (i >= 0) p.splice(i, 1); else p.push({ id: el.dataset.id }); E.save(); E.render(); };
  E.A['prep-clear'] = () => { F().prep = []; E.save(); E.render(); };

  // ================= MOVE =================
  function moveView() {
    const tr = S().train, prog = E.PROGRAMS.home, day = prog.days[tr.next % prog.days.length], h = S().health, t = E.today();
    const wk = tr.logs.filter(l => E.diff(t, l.d) < 7).length, mk = S().mob.logs.filter(l => E.diff(t, l.d) < 7).length;
    return `${E.healthCard()}
      ${E.secH('Workout')}
      <section class="card tint"><div class="label">Next · ${esc(day.n)}</div><div class="mid" style="margin:4px 0 10px">${day.ex.length} exercises · about 35 min</div>
        <div class="small muted">${day.ex.map(([id]) => esc(E.EX[id].n)).join(' · ')}</div>
        <button class="btn primary wide" style="margin-top:16px" data-a="wo-start">${ic('play')} Start workout</button>
        <div class="small muted center" style="margin-top:10px">${wk} this week · ${tr.logs.length} total. No equipment needed.</div></section>
      ${E.secH('Mobility for your back, hips & knees')}
      <div class="list">${Object.entries(E.MOBILITY).map(([k, R]) => { const n = S().mob.logs.filter(l => l.k === k).length; return E.item({ a: 'mob-start', attrs: `data-k="${k}"`, icon: k === 'knees' ? 'footprints' : k === 'back' ? 'heart-pulse' : k === 'full' ? 'person-standing' : 'laptop', c: 'var(--sage)', t: esc(R.n), s: `${R.mins} min · ${esc(R.d)}`, r: n ? `${n}×` : '', chev: true }); }).join('')}</div>
      <p class="hint">${mk} session${mk === 1 ? '' : 's'} this week. The desk reset every workday is the best thing you can do for your back.</p>
      ${tr.logs.length ? E.secH('Recent workouts') + `<div class="list">${tr.logs.slice(-5).reverse().map(l => E.item({ icon: 'dumbbell', sm: true, t: esc(l.n), s: `${E.rel(l.d)} · ${l.mins} min`, r: `${l.ex.reduce((a, e) => a + e.sets.length, 0)}<small>sets</small>` })).join('')}</div>` : ''}`;
  }
  // workout: one exercise at a time
  const lastFor = id => { const L = S().train.logs; for (let i = L.length - 1; i >= 0; i--) { const e = L[i].ex.find(z => z.id === id); if (e) return e; } return null; };
  const target = (id, lo, hi) => { const last = lastFor(id), E2 = E.EX[id]; if (!last) return lo; const best = Math.max(...last.sets); return last.sets.every(r => r >= hi) ? hi + (E2.inc || 1) : Math.min(hi, best + 1); };
  E.A['wo-start'] = () => {
    const tr = S().train, prog = E.PROGRAMS.home, day = prog.days[tr.next % prog.days.length];
    E.ui.wo = { n: day.n, start: Date.now(), i: 0, set: 0, ex: day.ex.map(([id, s, lo, hi]) => ({ id, sets: s, lo, hi, t: target(id, lo, hi), done: [] })) };
    woSheet();
  };
  let restT = null;
  const woSheet = () => {
    const w = E.ui.wo, x = w.ex[w.i], X = E.EX[x.id], unit = X.t === 'time' ? 'seconds' : 'reps';
    const rest = w.rest && w.rest > Date.now();
    E.sheet({ title: esc(w.n), full: true, body: `<div class="player">
      <div class="step">Exercise ${w.i + 1} of ${w.ex.length} · set ${Math.min(x.done.length + 1, x.sets)} of ${x.sets}</div>
      ${rest ? `<h2>Rest</h2><div class="timer" id="rest">${Math.ceil((w.rest - Date.now()) / 1000)}</div><p>Next: ${esc(X.n)}, ${x.t} ${unit}</p>`
        : `<h2>${esc(X.n)}</h2><div class="timer">${x.t}</div><p>${unit} · ${esc(X.m)}${x.done.length ? ` · done: ${x.done.join(', ')}` : ''}</p>`}
      <div class="dots7" style="justify-content:center;margin-top:18px">${w.ex.map((e, j) => `<i class="${j < w.i ? 'kept' : j === w.i ? 'today' : ''}">${j + 1}</i>`).join('')}</div></div>`,
      foot: rest ? `<button class="btn ghost" data-a="wo-skiprest">Skip rest</button>` : `<button class="btn ghost" data-a="wo-less">Did fewer</button><button class="btn primary" data-a="wo-set">${ic('check')} Done</button>` });
    clearInterval(restT);
    if (rest) restT = setInterval(() => { const el = E.$('#rest'), s = Math.ceil((w.rest - Date.now()) / 1000); if (s <= 0) { clearInterval(restT); w.rest = 0; E.buzz(40); woSheet(); return; } if (el) el.textContent = s; }, 250);
    E.onClose = () => { clearInterval(restT); if (E.ui.wo && !E.ui.wo.finished) E.toast('Workout paused. Start again from Health.'); E.ui.wo = null; };
  };
  const logSet = reps => {
    const w = E.ui.wo, x = w.ex[w.i]; x.done.push(reps); E.buzz(15);
    if (x.done.length >= x.sets) { w.i++; }
    if (w.i >= w.ex.length) { finishWo(); return; }
    w.rest = Date.now() + (E.EX[w.ex[w.i].id].t === 'time' ? 45 : 60) * 1000; woSheet();
  };
  E.A['wo-set'] = () => logSet(E.ui.wo.ex[E.ui.wo.i].t);
  E.A['wo-less'] = () => { const x = E.ui.wo.ex[E.ui.wo.i]; E.sheet({ title: 'How many did you do?', body: `<input id="wl" type="number" inputmode="numeric" value="${Math.max(1, x.t - 2)}" style="font-size:28px;text-align:center" data-enter="wo-less-ok">`, foot: '<button class="btn primary" data-a="wo-less-ok">Save set</button>', focus: 'wl' }); E.onClose = () => setTimeout(woSheet, 0); };
  E.A['wo-less-ok'] = () => logSet(Math.max(0, E.num('wl')));
  E.A['wo-skiprest'] = () => { E.ui.wo.rest = 0; woSheet(); };
  const finishWo = () => {
    const w = E.ui.wo, tr = S().train; w.finished = true;
    tr.logs.push({ d: E.today(), n: w.n, mins: Math.max(1, Math.round((Date.now() - w.start) / 60000)), ex: w.ex.map(x => ({ id: x.id, sets: x.done })) }); tr.next++;
    if (S().habits.some(h => h.id === 'workout')) E.setLog(E.today(), 'workout', true);
    E.save(); E.ui.wo = null; E.onClose = null;
    E.sheet({ title: 'Workout done', body: `<div class="player"><div class="ember-art" style="margin:0 auto;width:100px;height:100px">${E.emberArt(3)}</div><h2>Strong work.</h2><p>Next time the app raises your targets a little where you hit every set.</p></div>`, foot: '<button class="btn primary" data-a="close">Done</button>' });
    E.render();
  };

  // mobility player
  let mobT = null;
  E.A['mob-start'] = el => { const k = el.dataset.k, R = E.MOBILITY[k], n = S().mob.logs.filter(l => l.k === k).length, f = Math.min(1.5, 1 + 0.1 * Math.floor(n / 8)); E.ui.mob = { k, i: 0, f, start: Date.now(), end: Date.now() + R.lv[0][1] * f * 1000 }; mobSheet(); };
  const mobSheet = () => {
    const m = E.ui.mob, R = E.MOBILITY[m.k], cur = R.lv[m.i], nx = R.lv[m.i + 1], dur = Math.round(cur[1] * m.f), left = m.paused ? Math.ceil(m.left / 1000) : Math.max(0, Math.ceil((m.end - Date.now()) / 1000));
    E.sheet({ title: esc(R.n), full: true, body: `<div class="player"><div class="step">${m.i + 1} of ${R.lv.length}</div>
      <div style="display:flex;justify-content:center;margin:20px 0 4px" id="mob-ring">${E.ring(1 - left / dur, { size: 190, stroke: 9, label: `<span id="mob-t">${left}</span>`, sub: 'seconds', c: 'var(--sage)' })}</div>
      <h2>${esc(cur[0])}</h2><p>${esc(cur[2])}</p>${nx ? `<p class="small" style="margin-top:14px">Next: <b>${esc(nx[0])}</b></p>` : '<p class="small" style="margin-top:14px">Last one.</p>'}</div>`,
      foot: `<button class="btn ghost" data-a="mob-pause">${m.paused ? 'Resume' : 'Pause'}</button><button class="btn primary" data-a="mob-next">Next ${ic('skip-forward')}</button>` });
    E.onClose = () => { clearInterval(mobT); E.ui.mob = null; };
    clearInterval(mobT);
    mobT = setInterval(() => { const mm = E.ui.mob; if (!mm) { clearInterval(mobT); return; } if (mm.paused) return; const s = Math.ceil((mm.end - Date.now()) / 1000); if (s <= 0) { E.A['mob-next'](); return; } const el = E.$('#mob-t'); if (el) el.textContent = s; const ring = E.$('#mob-ring circle:nth-child(2)'); if (ring) { const C = parseFloat(ring.getAttribute('stroke-dasharray')); ring.setAttribute('stroke-dashoffset', (C * s / dur).toFixed(1)); } }, 250);
  };
  E.A['mob-pause'] = () => { const m = E.ui.mob; if (m.paused) { m.end = Date.now() + m.left; m.paused = false; } else { m.left = m.end - Date.now(); m.paused = true; } mobSheet(); };
  E.A['mob-next'] = () => {
    const m = E.ui.mob; if (!m) return; const R = E.MOBILITY[m.k]; m.i++; E.buzz(25);
    if (m.i >= R.lv.length) {
      clearInterval(mobT); S().mob.logs.push({ d: E.today(), k: m.k, mins: Math.round((Date.now() - m.start) / 60000) });
      if (S().habits.some(h => h.id === 'mobility')) E.setLog(E.today(), 'mobility', true);
      E.ui.mob = null; E.onClose = null; E.save(); E.close(true); E.toast('Mobility done. Your back thanks you.'); E.render(); return;
    }
    m.end = Date.now() + R.lv[m.i][1] * m.f * 1000; m.paused = false; mobSheet();
  };

  // ================= BODY =================
  function bodyView() {
    const W = S().weights.slice().sort((a, b) => a.d.localeCompare(b.d)), now = W.length ? W[W.length - 1].kg : null, first = W[0], goal = S().profile.goalKg, T = E.targets();
    const lost = first && now ? first.kg - now : 0, total = first ? first.kg - goal : 1;
    const MS = [['waist', 'Waist'], ['chest', 'Chest'], ['hips', 'Hips'], ['arm', 'Arm'], ['thigh', 'Thigh'], ['neck', 'Neck']], M = S().measures;
    return `<section class="card tint"><div class="row" style="justify-content:space-between"><div><div class="label">Weight</div><div class="big">${now ? E.n(now, 1) : '—'} <span class="small muted" style="font-family:Inter">kg</span></div></div><button class="btn primary sm" data-a="weigh">${ic('plus')} Log</button></div>
        <div class="progress-line" style="margin:14px 0 6px">${E.bar(E.pct(lost, total))}</div><div class="small muted">${lost > 0 ? `${E.n(lost, 1)} kg down` : 'Start'} · goal ${goal} kg · ${E.n(Math.max(0, now - goal), 1)} kg to go</div>
        <div style="margin-top:14px">${E.spark(W.slice(-40).map(w => w.kg))}</div></section>
      <div class="grid3" style="margin-top:12px"><div class="kpi"><small>BMI</small><b>${T.bmi}</b></div><div class="kpi"><small>Daily kcal</small><b>${E.n(T.kcal)}</b></div><div class="kpi"><small>Protein</small><b>${T.p} g</b></div></div>
      ${E.secH('Measurements', 'Add', 'meas-add')}
      <div class="list">${MS.map(([k, l]) => { const v = M.filter(m => m.k === k); const last = v[v.length - 1], d = v.length > 1 ? last.v - v[0].v : null; return E.item({ t: l, s: last ? E.rel(last.d) : 'Not measured yet', r: last ? `${last.v} cm${d != null ? `<small class="${d <= 0 ? 'good' : 'bad'}">${d > 0 ? '+' : ''}${E.n(d, 1)}</small>` : ''}` : '—' }); }).join('')}</div>
      <p class="hint">Weigh once a week, same morning, after the bathroom. Waist at the belly button every 2 weeks: it shows fat loss best.</p>`;
  }
  E.A.weigh = () => E.sheet({ title: 'Log weight', body: `<input id="wt" type="number" inputmode="decimal" step="0.1" value="${E.weightNow()}" style="font-size:34px;text-align:center" data-enter="weigh-save"><p class="hint center">kilograms</p>`, foot: '<button class="btn primary" data-a="weigh-save">Save</button>', focus: 'wt' });
  E.A['weigh-save'] = () => { const kg = E.num('wt'); if (!(kg > 30 && kg < 300)) { E.toast('Check the number'); return; } const t = E.today(), prev = E.weightNow(); S().weights = S().weights.filter(w => w.d !== t); S().weights.push({ d: t, kg: Math.round(kg * 10) / 10 }); E.save(); E.close(true); E.toast(kg < prev ? `Down ${E.n(prev - kg, 1)} kg. Keep going.` : 'Saved'); E.render(); };
  E.A['meas-add'] = () => E.sheet({ title: 'Measurements (cm)', body: `<p class="hint" style="margin-top:0">Fill only what you measured.</p><div class="grid2">${[['waist', 'Waist'], ['chest', 'Chest'], ['hips', 'Hips'], ['arm', 'Arm'], ['thigh', 'Thigh'], ['neck', 'Neck']].map(([k, l]) => E.field(l, `<input id="ms-${k}" type="number" inputmode="decimal" step="0.5">`)).join('')}</div>`, foot: '<button class="btn primary" data-a="meas-save">Save</button>' });
  E.A['meas-save'] = () => { const t = E.today(); let n = 0; for (const k of ['waist', 'chest', 'hips', 'arm', 'thigh', 'neck']) { const v = E.num('ms-' + k); if (v > 0) { S().measures = S().measures.filter(m => !(m.k === k && m.d === t)); S().measures.push({ d: t, k, v }); n++; } } E.save(); E.close(true); if (n) E.toast('Saved'); E.render(); };

  // ================= Samsung Health (via Health Connect) =================
  const HC = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Health;
  const iso = ms => new Date(ms).toISOString();
  const hm = m => m ? `${Math.floor(m / 60)}h ${E.pad(m % 60)}m` : '—';
  E.healthCard = () => {
    const h = S().health, t = E.today();
    if (!h.on) return HC() ? `<section class="card sage"><div class="row"><div class="ico" style="--c:var(--sage)">${ic('heart-pulse')}</div><div class="grow"><div class="card-t">Connect Samsung Health</div><div class="small muted">Steps, sleep, weight and heart rate, automatically.</div></div></div><button class="btn primary wide" style="margin-top:14px" data-a="health-on">Connect</button></section>` : '';
    const days = Array.from({ length: 7 }, (_, i) => E.add(t, i - 6)), st = days.map(d => h.steps[d] || 0), mx = Math.max(8000, ...st), goal = (S().habits.find(x => x.id === 'steps') || { target: 8000 }).target;
    return `<section class="card"><div class="row" style="justify-content:space-between"><div class="label">Samsung Health</div><button class="pill" data-a="health-sync">${ic('refresh-cw')} Sync</button></div>
      <div class="grid3" style="margin:12px 0"><div><div class="small muted">Steps</div><b class="mid">${E.n(h.steps[t] || 0)}</b></div><div><div class="small muted">Sleep</div><b class="mid">${hm(h.sleep[t])}</b></div><div><div class="small muted">Resting HR</div><b class="mid">${h.rhr || '—'}</b></div></div>
      <div class="cols" style="height:80px">${st.map((v, i) => `<div><i class="${v < goal ? 'low' : ''}" style="height:${Math.max(4, v / mx * 100)}%"></i><span>${E.fmtDate(days[i], { weekday: 'narrow' })}</span></div>`).join('')}</div></section>`;
  };
  E.healthSync = async force => {
    const p = HC(), h = S().health; if (!p || !h.on) return;
    if (!force && Date.now() - h.last < 5 * 60000) return;
    const now = Date.now(), from = E.parse(E.add(E.today(), -13)).getTime();
    try { const r = await p.queryAggregated({ dataType: 'steps', startDate: iso(from), endDate: iso(now), bucket: 'day', aggregation: 'sum' }); for (const s of (r.samples || [])) h.steps[E.ymd(new Date(s.startDate))] = Math.round(s.value || 0); } catch (e) { /* no permission */ }
    try { const r = await p.readSamples({ dataType: 'sleep', startDate: iso(now - 8 * 864e5), endDate: iso(now), limit: 500 }); const by = {}; for (const s of (r.samples || [])) { const st = String(s.sleepState || '').toLowerCase(); if (st.includes('awake') || st.includes('out')) continue; const d = E.ymd(new Date(s.endDate)); by[d] = (by[d] || 0) + (+s.value || (new Date(s.endDate) - new Date(s.startDate)) / 6e4); } for (const d in by) h.sleep[d] = Math.round(by[d]); } catch (e) { /* optional */ }
    try { const r = await p.readSamples({ dataType: 'weight', startDate: iso(now - 30 * 864e5), endDate: iso(now), limit: 60 }); for (const s of (r.samples || [])) { const d = E.ymd(new Date(s.startDate)), kg = Math.round(s.value * 10) / 10; if (kg > 30 && kg < 300 && !S().weights.some(w => w.d === d)) S().weights.push({ d, kg }); } } catch (e) { /* optional */ }
    try { const r = await p.readSamples({ dataType: 'restingHeartRate', startDate: iso(now - 7 * 864e5), endDate: iso(now), limit: 20 }); const L = (r.samples || []).sort((a, b) => String(a.startDate).localeCompare(String(b.startDate))); if (L.length) h.rhr = Math.round(L[L.length - 1].value); } catch (e) { /* optional */ }
    h.last = now;
    const t = E.today(), sh = S().habits.find(x => x.id === 'steps');
    if (sh && h.steps[t] != null && E.dueOn(sh, t)) { const cur = E.log(t, 'steps'); if (typeof cur !== 'number' || cur < h.steps[t]) E.setLog(t, 'steps', h.steps[t]); }
    E.save(); E.render();
  };
  E.A['health-on'] = async () => {
    const p = HC(); if (!p) { E.toast('This works in the phone app'); return; }
    let av; try { av = await p.isAvailable(); } catch (e) { av = { available: false }; }
    if (!av.available) { E.sheet({ title: 'One step first', body: `<p class="muted">Samsung Health shares data through <b>Health Connect</b>. Open Samsung Health → <b>Settings → Health Connect</b> and allow steps, sleep, weight and heart rate. Then come back and tap Connect again.</p>`, foot: '<button class="btn primary" data-a="hc-settings">Open Health Connect</button>' }); return; }
    try { await p.requestAuthorization({ read: ['steps', 'sleep', 'weight', 'heartRate', 'restingHeartRate'], write: [] }); } catch (e) { E.toast('Permission not given'); return; }
    S().health.on = true; E.prepDone('health'); E.save(); E.toast('Connected. Syncing…'); await E.healthSync(true);
  };
  E.A['hc-settings'] = () => { const p = HC(); if (p && p.openHealthConnectSettings) p.openHealthConnectSettings().catch(() => {}); };
  E.A['health-sync'] = () => E.healthSync(true).then(() => E.toast('Synced'));

  // ================= barcode (offline, ML Kit) =================
  const BS = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner;
  E.canScan = () => !!BS();
  let live = null;
  const stopScan = async () => { document.body.classList.remove('scanning'); document.documentElement.classList.remove('scanning'); const o = E.$('#scan'); if (o) o.remove(); try { if (live) await live.remove(); } catch (e) { /* ignore */ } live = null; try { await BS().stopScan(); } catch (e) { /* ignore */ } };
  E.A['scan-stop'] = () => stopScan();
  E.A.scan = async () => {
    const p = BS(); if (!p) return;
    try { let pm = await p.checkPermissions(); if (pm.camera !== 'granted') pm = await p.requestPermissions(); if (pm.camera !== 'granted') { E.toast('Camera permission is needed'); return; } } catch (e) { E.toast('Camera not available'); return; }
    document.body.classList.add('scanning'); document.documentElement.classList.add('scanning');
    document.body.insertAdjacentHTML('beforeend', `<div id="scan"><div class="frame"><i></i></div><p><b>Point at the barcode</b></p><button class="btn" data-a="scan-stop">Cancel</button></div>`);
    live = await p.addListener('barcodeScanned', async r => {
      const code = r && r.barcode && (r.barcode.rawValue || r.barcode.displayValue); if (!code) return;
      await stopScan(); E.buzz(40);
      const f = F().myFoods.find(m => m.barcode === code);
      if (f) { E.A['food-pick']({ dataset: { id: 'my:' + f.id } }); return; }
      E.ui.barcode = code; E.A['myfood-new'](); E.toast('New product. Add its label once, it\'s remembered.');
    });
    try { await p.startScan({ formats: ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'CODE_128'] }); } catch (e) { await stopScan(); E.toast('Could not open the camera'); }
  };

  E.screens.health = () => {
    const sub = E.subOf('health', 'food');
    return E.hdr('Health', sub === 'food' ? 'What you eat, simply logged' : sub === 'move' ? 'Move a little, every day' : `Goal: ${S().profile.goalKg} kg`) + E.seg('health', [['food', 'Food'], ['move', 'Move'], ['body', 'Body']], sub) + '<div class="spacer"></div>' + (sub === 'move' ? moveView() : sub === 'body' ? bodyView() : foodView());
  };
})(window.E);
