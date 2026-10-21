(function (Q) {
  'use strict';

  Q.defaultNutri = () => ({
    sex: 'male', age: 25, height: 175, weight: 80, activity: 'light', goal: 'lose', pace: 'standard',
    meals: 3, exclude: [], days: {}, swaps: {}, off: {}
  });

  Q.ACTIVITY = {
    sedentary: { l: 'Desk job, little walking', f: 1.2 },
    light: { l: 'Desk job + some walking / training 1–3×', f: 1.375 },
    moderate: { l: 'On your feet often or training 3–5×', f: 1.55 },
    high: { l: 'Physical job or hard training 6×+', f: 1.725 }
  };
  Q.PACES = {
    gentle: { l: 'Gentle', d: 0.15, desc: 'Easier to stick to' },
    standard: { l: 'Standard', d: 0.20, desc: 'The sweet spot for most people' },
    aggressive: { l: 'Aggressive', d: 0.25, desc: 'Faster, harder. Keep protein high' }
  };

  Q.latestWeight = () => {
    const w = Q.S.weights.slice().sort((a, b) => a.d.localeCompare(b.d)).pop();
    return w ? w.kg : Q.S.nutri.weight;
  };

  // ---------- targets ----------
  Q.targets = () => {
    const n = Q.S.nutri, kg = Q.latestWeight(), h = n.height, a = n.age;
    const bmr = Math.round(10 * kg + 6.25 * h - 5 * a + (n.sex === 'female' ? -161 : 5));
    const tdee = Math.round(bmr * (Q.ACTIVITY[n.activity] || Q.ACTIVITY.light).f);
    let kcal = tdee;
    if (n.goal === 'lose') kcal = tdee * (1 - (Q.PACES[n.pace] || Q.PACES.standard).d);
    if (n.goal === 'gain') kcal = tdee * 1.1;
    const floor = n.sex === 'female' ? 1300 : 1600;
    kcal = Math.round(Math.max(kcal, floor) / 10) * 10;
    // protein from a reference weight so it stays sensible at higher body fat (BMI cap 27)
    const ref = Math.min(kg, 27 * (h / 100) * (h / 100));
    const pPerKg = n.goal === 'lose' ? 2.0 : n.goal === 'gain' ? 1.8 : 1.6;
    const p = Math.round(ref * pPerKg);
    const f = Math.round(Math.max(ref * 0.8, kcal * 0.25 / 9));
    const c = Math.max(50, Math.round((kcal - p * 4 - f * 9) / 4));
    const water = Math.round(Math.min(4, Math.max(2, kg * 0.035)) * 10) / 10;
    const deficit = tdee - kcal;
    const weekly = Math.round(deficit * 7 / 7700 * 100) / 100;
    const bmi = Math.round(kg / ((h / 100) * (h / 100)) * 10) / 10;
    return { bmr, tdee, kcal, p, c, f, water, deficit, weekly, kg, bmi };
  };

  // ---------- meal slots ----------
  const SPLITS = { 3: [['breakfast', 0.30], ['lunch', 0.37], ['dinner', 0.33]], 4: [['breakfast', 0.25], ['lunch', 0.32], ['snack', 0.13], ['dinner', 0.30]], 5: [['breakfast', 0.22], ['snack2', 0.10], ['lunch', 0.30], ['snack', 0.10], ['dinner', 0.28]] };
  Q.mealSlots = () => {
    if (!Q.S.nutri || !Q.S.hero.onboarded) return [];
    return (SPLITS[Q.S.nutri.meals] || SPLITS[3]).map(([slot, share]) => ({ slot, share, label: slot === 'snack2' ? 'Morning snack' : slot === 'snack' ? 'Snack' : slot[0].toUpperCase() + slot.slice(1) }));
  };

  const allowed = t => {
    const ex = new Set(Q.S.nutri.exclude || []);
    return t.items.every(it => !(Q.FOODS[it.f].tags || []).some(tag => ex.has(tag)));
  };
  Q.mealOptions = slot => Q.MEALS.filter(t => t.slot === (slot === 'snack2' ? 'snack' : slot) && allowed(t));

  // ---------- portion solver ----------
  const macro = (f, g) => { const F = Q.FOODS[f]; return { k: F.k * g / 100, p: F.p * g / 100, c: F.c * g / 100, f: F.f * g / 100 }; };
  function totals(items) {
    const t = { k: 0, p: 0, c: 0, f: 0 };
    for (const it of items) { const m = macro(it.f, it.g); t.k += m.k; t.p += m.p; t.c += m.c; t.f += m.f; }
    return t;
  }
  function roundItem(it) {
    const F = Q.FOODS[it.f];
    if (F.free) return it;
    if (F.unit) {
      const step = ['egg', 'banana', 'apple', 'orange'].includes(it.f) || F.unit[1] === 'white' ? 1 : F.unit[1] === 'loaf' ? 0.25 : F.unit[1] === 'olive' ? 1 : 0.5;
      const n = Math.max(step, Math.round(it.g / F.unit[0] / step) * step);
      return { ...it, g: n * F.unit[0], units: n };
    }
    const step = it.g >= 100 ? 10 : 5;
    return { ...it, g: Math.max(step, Math.round(it.g / step) * step) };
  }
  const CAP = { egg: 200, eggwhite: 231, halloumi: 80, stringcheese: 60, labneh: 60, mince: 180, steak: 230, chicken: 250, thigh: 260, tuna: 200, yogurt: 300, milk: 400, bread: 180, rice: 350, pasta: 320, potato: 450, sweetpotato: 400, oil: 15, olives: 40, walnuts: 25, almonds: 25, pb: 25, dates: 48, banana: 240, honey: 14, foul: 300, lentils: 300, oats: 100, apple: 360, orange: 300 };
  const capOf = it => CAP[it.f] || 400;
  Q.solveMeal = (tpl, target) => {
    let items = tpl.items.map(i => ({ ...i }));
    const fit = (role, need, key, lo, hi) => {
      const group = items.filter(i => i.role === role && !Q.FOODS[i.f].free);
      if (!group.length) return;
      const others = totals(items.filter(i => !group.includes(i)));
      let per = totals(group)[key];
      if (per <= 0) {
        // zero-portion filler (e.g. egg whites): size it directly
        const i = group[0], dens = Q.FOODS[i.f][key === 'k' ? 'k' : key] / 100;
        if (dens > 0) i.g = Math.min(capOf(i), Math.max(0, (need - others[key]) / dens));
        return;
      }
      const factor = Q.clamp((need - others[key]) / per, lo, hi);
      group.forEach(i => { i.g = Math.min(capOf(i), Math.max(0, i.g * factor)); });
    };
    for (let k = 0; k < 5; k++) {
      fit('P', target.p, 'p', 0.5, 3);
      fit('P2', target.p, 'p', 0, 4);
      // fat sources fill whatever fat the protein foods didn't bring
      fit('F', target.f, 'f', 0.5, 2.5);
      // carbs absorb the remaining calories
      fit('C', target.k, 'k', 0.3, 3);
    }
    items = items.filter(i => Q.FOODS[i.f].free || i.g >= 3 || i.role !== 'P2').map(roundItem);
    const t = totals(items);
    return { tpl, items, k: Math.round(t.k), p: Math.round(t.p), c: Math.round(t.c), f: Math.round(t.f) };
  };

  Q.amountLabel = it => {
    const F = Q.FOODS[it.f];
    if (F.free) return '';
    if (F.unit && it.units != null) { const n = it.units; const w = n <= 1 ? F.unit[1] : F.unit[2]; return `${Q.frac(n)} ${w} · ${Math.round(it.g)} g`; }
    return `${Math.round(it.g)} g`;
  };

  Q.frac = n => { const w = Math.floor(n), r = Math.round((n - w) * 4); const fr = ['', '¼', '½', '¾'][r] || ''; return (w ? String(w) : (fr ? '' : '0')) + fr; };

  // ---------- daily plan (deterministic rotation, no repeats within a week) ----------
  function permFor(seed, n) {
    const r = Q.rng(seed), a = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  Q.mealPlan = d => {
    const key = 'mp:' + d + ':' + Q._ver;
    Q._mpc = Q._mpc || {};
    if (Q._mpc[key]) return Q._mpc[key];
    const T = Q.targets(), slots = Q.mealSlots();
    const dayNo = Q.diffDays(d, '2024-01-01'), week = Math.floor(dayNo / 7), di = ((dayNo % 7) + 7) % 7;
    // solve meals in order; each later meal absorbs what earlier ones over- or under-shot
    const left = { k: T.kcal, p: T.p, c: T.c, f: T.f };
    let shareLeft = 1;
    const pw = s => s.startsWith('snack') ? 0.5 : 1;
    let pwLeft = slots.reduce((t, s) => t + pw(s.slot), 0);
    const usedMain = new Set();
    const meals = slots.map((s, si) => {
      const opts = Q.mealOptions(s.slot);
      if (!opts.length) { shareLeft -= s.share; pwLeft -= pw(s.slot); return { slot: s.slot, label: s.label, empty: true }; }
      const swap = ((Q.S.nutri.swaps[d] || {})[s.slot]);
      let tpl = swap && opts.find(o => o.id === swap);
      if (!tpl) {
        // cycle through every option before repeating; reshuffle each cycle
        const n = opts.length, N = dayNo + si * 3, blk = Math.floor(N / n);
        const p = permFor(Q.hash(s.slot + ':' + blk), n);
        const offs = [0]; for (let k = Math.floor(n / 2); k < n + Math.floor(n / 2); k++) if (k % n) offs.push(k % n);
        for (const k of offs) {
          const c = opts[p[(N + k) % n]];
          if (!usedMain.has((c.items.find(i => i.role === 'P') || {}).f)) { tpl = c; break; }
        }
        tpl = tpl || opts[p[N % n]];
      }
      usedMain.add((tpl.items.find(i => i.role === 'P') || {}).f);
      const fr = s.share / shareLeft, fp = pw(s.slot) / pwLeft;
      const target = { k: left.k * fr, p: left.p * fp, c: left.c * fr, f: left.f * fr };
      const m = Q.solveMeal(tpl, target);
      left.k -= m.k; left.p -= m.p; left.c -= m.c; left.f -= m.f; shareLeft -= s.share; pwLeft -= pw(s.slot);
      return { slot: s.slot, label: s.label, ...m };
    });
    const tot = meals.reduce((t, m) => m.empty ? t : { k: t.k + m.k, p: t.p + m.p, c: t.c + m.c, f: t.f + m.f }, { k: 0, p: 0, c: 0, f: 0 });
    const res = { d, meals, tot, T };
    Q._mpc[key] = res;
    return res;
  };

  Q.swapMeal = (d, slot) => {
    const opts = Q.mealOptions(slot); if (opts.length < 2) return;
    const cur = Q.mealPlan(d).meals.find(m => m.slot === slot);
    const i = opts.findIndex(o => o.id === cur.tpl.id);
    const sw = Q.S.nutri.swaps[d] || (Q.S.nutri.swaps[d] = {});
    sw[slot] = opts[(i + 1) % opts.length].id;
  };

  // meal log: S.nutri.days[d][slot] = 'done' | 'off'
  Q.mealLog = d => Q.S.nutri.days[d] || {};
  Q.mealsDone = d => Object.values(Q.mealLog(d)).filter(v => v === 'done').length;

  Q.groceryList = (from, n) => {
    const agg = {};
    for (let i = 0; i < n; i++) {
      const d = Q.addDays(from, i);
      for (const m of Q.mealPlan(d).meals) if (!m.empty) for (const it of m.items) {
        const F = Q.FOODS[it.f]; if (F.free) continue;
        agg[it.f] = (agg[it.f] || 0) + it.g;
      }
    }
    const byCat = {};
    for (const [f, g] of Object.entries(agg)) {
      const F = Q.FOODS[f];
      let amt = g >= 1000 ? `${Math.round(g / 100) / 10} kg` : `${Math.round(g / 10) * 10} g`;
      if (F.unit && ['egg', 'banana', 'apple', 'orange', 'bread', 'dates'].includes(f)) amt = `${Math.ceil(g / F.unit[0])} ${F.unit[2]} (${amt})`;
      if (f === 'oil') amt = `${Math.round(g)} g (~${Math.round(g / 13.5)} tbsp)`;
      (byCat[F.cat] = byCat[F.cat] || []).push({ f, n: F.n, amt, g });
    }
    Object.values(byCat).forEach(l => l.sort((a, b) => b.g - a.g));
    return byCat;
  };

  // ---------- guide ----------
  Q.GUIDE = [
    { id: 'basics', icon: 'scale', t: 'How fat loss actually works', b: [
      'Your body weight changes with energy balance: eat less energy than you burn and you lose weight, eat more and you gain. Food quality matters for health, hunger and muscle, but the deficit is what moves the scale.',
      'Your plan sets a daily calorie target from your weight, height, age and activity, then subtracts a deficit based on the pace you chose. Roughly 7,700 kcal of deficit is about 1 kg of fat.',
      'Expect the scale to bounce. Water, salt, carbs and digestion move it 1–2 kg day to day. Weigh in the morning after the bathroom, and judge the weekly average, not single days.',
      'If your weekly average hasn\'t moved for 2–3 weeks while you hit the plan, the app\'s targets update automatically as you log your weight. You can also switch pace in Settings.'] },
    { id: 'protein', icon: 'beef', t: 'Protein: the non-negotiable', b: [
      'Protein protects muscle while you lose fat, keeps you full longest, and costs your body the most energy to digest.',
      'Your target is set around 1.6–2.0 g per kg of a healthy reference weight. Spread it across your meals; every meal in the plan is built around a protein source.',
      'Best local sources: chicken breast and thighs, eggs and egg whites, lean beef, yogurt (laban), labneh, halloumi and string cheese (the cheeses are higher in fat, so portions are smaller).',
      'If you miss protein at one meal, add eggs, yogurt or extra chicken at the next.'] },
    { id: 'plate', icon: 'utensils', t: 'The plate method (when you can\'t weigh)', b: [
      'Half the plate vegetables or salad. A quarter protein about the size of your palm (one palm for most meals, two at dinner if you\'re hungry). A quarter carbs about the size of a cupped hand: rice, potato, bread or pasta.',
      'Add one thumb of fat: olive oil, olives, nuts or cheese. Oil is the easiest place for hidden calories: 1 tablespoon is about 120 kcal. Measure it.',
      'Eating out or at a family meal: fill up on salad and grilled meat first, take a small portion of rice or bread, skip fried sides and sugary drinks.'] },
    { id: 'weigh', icon: 'scale', t: 'Weighing and portions', b: [
      'Weights in the plan are raw for meat and vegetables, and cooked for rice and pasta. Raw chicken loses about 25% of its weight when cooked.',
      'A cheap kitchen scale is the best tool you can buy for this. Weigh for two weeks and you\'ll learn to eyeball portions.',
      'Batch cook: grill 1 kg of chicken and cook a pot of rice on your free day, then portion into boxes. The Plan tab shows which days have time for prep.'] },
    { id: 'water', icon: 'glass-water', t: 'Hydration', b: [
      'Aim for your water target daily (shown on the Fuel tab). Thirst often feels like hunger.',
      'Start the day with a large glass before anything else. Keep a bottle at your desk and in the car.',
      'Tea and coffee count toward fluids. Sugary drinks don\'t belong in the plan; sweeten with stevia instead if you need it.'] },
    { id: 'timing', icon: 'clock', t: 'Meal timing and training', b: [
      'Total intake matters more than timing. Pick meal times that fit your day and keep them consistent; the planner places meals around your work and commitments.',
      'On training days, try to eat a meal with protein and carbs 1–3 hours before, and get a protein meal within a few hours after.',
      'Late dinner is fine if it fits your calories. Leave about 2 hours before sleep so it doesn\'t hurt sleep quality.'] },
    { id: 'cravings', icon: 'candy-off', t: 'Cravings, chips and sweets', b: [
      'Cravings peak and fade within 10–20 minutes. Drink water, walk, or brush your teeth and the urge usually passes.',
      'Don\'t keep trigger foods (chips, seeds, sweets) at home or in the car. If it isn\'t there, you won\'t eat it at 11 pm.',
      'Swaps: dates and a few almonds for sweets; popcorn or veg sticks with yogurt dip for chips; tea with stevia for sweet coffees.',
      'Planned off-plan meals are allowed. Log them in the Fuel tab and get back on plan at the next meal. One meal never ruins progress; the next three decide it.'] },
    { id: 'sleep', icon: 'moon', t: 'Sleep and appetite', b: [
      'Short sleep raises hunger hormones and cravings, especially for sugar and fat, and makes training feel harder.',
      'Consistent sleep and wake times matter as much as total hours. Your sleep quests move your lights-out earlier step by step.',
      'Caffeine has a long half-life; keep it before mid-afternoon if sleep is a struggle.'] },
    { id: 'steps', icon: 'footprints', t: 'Steps and NEAT', b: [
      'Everyday movement (walking, stairs, standing) burns more calories over a week than most workouts. If you drive a lot, steps are your biggest lever.',
      'Easy wins: park further away, walk during calls, a 10-minute walk after meals (which also helps blood sugar).',
      'Training builds and keeps muscle; steps and diet drive the fat loss. Do both.'] },
    { id: 'budget', icon: 'shopping-cart', t: 'Shopping and budget', b: [
      'Build every basket around cheap protein (eggs, chicken thighs, yogurt), cheap carbs (rice, potatoes, bread) and seasonal vegetables.',
      'Use the weekly grocery list in the Fuel tab. It\'s calculated from your exact plan, so you buy only what you\'ll eat.',
      'Buy meat in bulk, portion and freeze it in meal-sized bags.'] },
    { id: 'supp', icon: 'pill', t: 'Supplements (optional)', b: [
      'None are required. Food first.',
      'The best-supported options for most people are creatine monohydrate (3–5 g/day) for training, and vitamin D if you rarely get sun or are deficient. A protein powder is only a convenience.',
      'Check with a doctor before starting anything if you have a medical condition or take medication.'] },
    { id: 'safety', icon: 'info', t: 'When to slow down', b: [
      'Feeling dizzy, constantly exhausted, losing hair, or obsessing about food are signs the deficit is too aggressive. Switch to a gentler pace in Settings.',
      'This guide is general information, not medical advice. If you have a health condition, speak to a doctor or dietitian before a big change in diet.'] }
  ];
})(window.Q);
