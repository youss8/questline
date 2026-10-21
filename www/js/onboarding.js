(function (Q) {
  'use strict';
  const { esc, ic, fmt } = Q;
  const NQ = Q.QUESTIONS.length;
  const ST = { intro: 0, name: 1, goals: 2, q0: 3 };
  ST.sched = ST.q0 + NQ; ST.train = ST.sched + 1; ST.body = ST.train + 1; ST.goal = ST.body + 1; ST.food = ST.goal + 1;
  ST.mode = ST.food + 1; ST.analyze = ST.mode + 1; ST.results = ST.analyze + 1; ST.why = ST.results + 1; ST.pledge = ST.why + 1;
  const TOTAL = ST.pledge;
  Q.OB = ST;

  Q.onb = null;
  Q.startOnboarding = () => {
    Q.onb = { step: 0, name: '', a: { goals: [] }, mode: 'normal', picks: null, why: '' };
    Q.schedDay = 1;
    let el = Q.$('#onb');
    if (!el) { el = document.createElement('div'); el.id = 'onb'; document.body.appendChild(el); }
    document.body.classList.add('onb-on');
    Q.renderOnb();
  };

  const prog = () => `<div class="ob-prog"><i style="width:${Q.pct(Q.onb.step, TOTAL)}%"></i></div>`;
  const shell = (kicker, title, sub, inner, foot) => `<div class="ob-top">${Q.onb.step > 0 ? `<button class="ob-back" data-act="ob-back" aria-label="Back">${ic('chevron-left')}</button>` : ''}${prog()}</div>
    <div class="ob-body">${kicker ? `<div class="kicker c">${kicker}</div>` : ''}<h2 class="ob-q">${title}</h2>${sub ? `<p class="muted c ob-sub">${sub}</p>` : ''}${inner}</div>${foot ? `<div class="ob-foot">${foot}</div>` : ''}`;
  const next = (label, dis) => `<button class="btn primary wide big" data-act="ob-next" ${dis ? 'disabled' : ''}>${label || 'Continue'}</button>`;
  const seg = (id, opts, cur, cls) => `<div class="seg ${cls || ''}" data-seg="${id}">${opts.map(o => `<button type="button" data-v="${o.v}" class="${String(o.v) === String(cur) ? 'on' : ''}">${o.l}</button>`).join('')}</div>`;
  const fld = (l, inner) => `<div class="field"><label>${l}</label>${inner}</div>`;

  function stepHtml() {
    const o = Q.onb, s = o.step, S = Q.S, n = S.nutri;
    if (s === ST.intro) return `<div class="ob-intro">
        <div class="ob-mark">${Q.insignia(Q.RANKS[5], 92)}</div>
        <div class="ob-logo">QUESTLINE</div>
        <h1 class="ob-h">Build the man you said you'd become.</h1>
        <p class="muted">A personal operating system for your habits, training, nutrition and goals. Built around your real week, your commitments, and the food you actually eat.</p>
        <div class="ob-feat"><span>${ic('calendar-days')} Planned around your schedule</span><span>${ic('utensils')} Exact meals & macros</span><span>${ic('trending-up')} Adapts as you progress</span></div>
        <button class="btn primary wide big" data-act="ob-next">Begin setup</button>
        <p class="muted tiny">About 4 minutes · works fully offline</p></div>`;
    if (s === ST.name) return shell('Step 1', 'What should we call you?', '', `<input id="ob-name" class="ob-input" placeholder="Your name" maxlength="18" value="${esc(o.name)}" autocomplete="off">`, `<button class="btn primary wide big" data-act="ob-name">Continue</button>`);
    if (s === ST.goals) return shell('Step 2', 'What are you working on?', 'Pick up to three.', `<div class="opts">${Q.GOALS.map(g => `<button class="opt ${o.a.goals.includes(g.v) ? 'on' : ''}" data-act="ob-goal" data-v="${g.v}">${ic(g.icon)}<span>${esc(g.l)}</span></button>`).join('')}</div>`, next('Continue', !o.a.goals.length));
    if (s >= ST.q0 && s < ST.sched) {
      const q = Q.QUESTIONS[s - ST.q0];
      return shell(`Habits · ${s - ST.q0 + 1} of ${NQ}`, esc(q.q), '', `<div class="opts">${q.o.map((t, i) => `<button class="opt ${o.a[q.k] === i ? 'on' : ''}" data-act="ob-ans" data-k="${q.k}" data-v="${i}"><span>${esc(t)}</span></button>`).join('')}</div>`);
    }
    if (s === ST.sched) return shell('Your week', 'When are you busy?', 'Set your wake and sleep times and fixed commitments for each day: work, classes, commute, family. Your quests and meals will be planned into the free time.', `<div id="sched-ed">${Q.schedEditorHtml()}</div>`, next('Looks right'));
    if (s === ST.train) {
      const tr = S.week.train || { perWeek: 3, pref: 'evening' };
      const days = Q.pickTrainingDays(tr.perWeek);
      return shell('Training', 'How often can you train?', 'Sessions go on your most open days.', `
        <div class="fl">Sessions per week</div>${seg('perweek', [2, 3, 4, 5, 6].map(x => ({ v: x, l: String(x) })), tr.perWeek)}
        <div class="fl">Best time</div>${seg('trainpref', [{ v: 'morning', l: 'Morning' }, { v: 'evening', l: 'Evening' }, { v: 'any', l: 'Any time' }], tr.pref)}
        <div class="card soft"><div class="kicker">Suggested training days</div><div class="daychips">${Q.WEEK_ORDER.map(d => `<span class="${days.includes(d) ? 'on' : ''}">${Q.DAY_SHORT[d]}</span>`).join('')}</div></div>`, next());
    }
    if (s === ST.body) return shell('Nutrition · 1 of 3', 'Your body', 'Used to calculate calories and protein. Stays on your phone.', `
        ${seg('n-sex', [{ v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }], n.sex)}
        <div class="grid3">${fld('Age', `<input id="ob-age" type="number" inputmode="numeric" value="${n.age}">`)}${fld('Height (cm)', `<input id="ob-h" type="number" inputmode="numeric" value="${n.height}">`)}${fld('Weight (kg)', `<input id="ob-w" type="number" inputmode="decimal" step="0.1" value="${n.weight}">`)}</div>
        <div class="fl">Daily activity (outside planned training)</div>${seg('n-act', Object.entries(Q.ACTIVITY).map(([k, a]) => ({ v: k, l: a.l })), n.activity, 'stack')}`, `<button class="btn primary wide big" data-act="ob-body">Continue</button>`);
    if (s === ST.goal) {
      const T = Q.targets();
      return shell('Nutrition · 2 of 3', 'Your goal', '', `
        ${seg('n-goal', [{ v: 'lose', l: 'Lose fat' }, { v: 'maintain', l: 'Maintain' }, { v: 'gain', l: 'Build muscle' }], n.goal)}
        ${n.goal === 'lose' ? `<div class="fl">Pace</div>${seg('n-pace', Object.entries(Q.PACES).map(([k, p]) => ({ v: k, l: `${p.l}<small>${esc(p.desc)}</small>` })), n.pace, 'stack')}` : ''}
        <div class="fl">Meals per day</div>${seg('n-meals', [3, 4, 5].map(x => ({ v: x, l: `${x} meals` })), n.meals)}
        <div class="card soft tgt"><div><b class="disp big">${fmt(T.kcal)}</b><span>kcal / day</span></div><div><b class="disp big">${T.p} g</b><span>protein</span></div><div><b class="disp big">${n.goal === 'lose' ? '≈' + fmt(T.weekly) : '—'}</b><span>kg / week</span></div></div>
        <p class="hint c">Maintenance is about ${fmt(T.tdee)} kcal. Early weeks often drop faster (water), then settle.</p>`, next());
    }
    if (s === ST.food) return shell('Nutrition · 3 of 3', 'Anything you don\'t eat or can\'t get?', 'Meals are only built from foods you can actually buy and eat.', `
        <div class="chips big" id="n-ex">${Q.EXCLUDABLE.map(e => `<button type="button" class="chip-btn ${n.exclude.includes(e.v) ? 'on' : ''}" data-ex="${e.v}">${esc(e.l)}</button>`).join('')}</div>
        <p class="hint c">${['breakfast', 'lunch', 'dinner'].map(sl => `${Q.mealOptions(sl).length} ${sl}`).join(' · ')} recipes available with these choices.</p>`, next());
    if (s === ST.mode) return shell('Last step', 'How hard should it push you?', '', `<div class="opts">${Object.entries(Q.MODES).map(([k, m]) => `<button class="opt mode ${o.mode === k ? 'on' : ''}" data-act="ob-mode" data-v="${k}">${ic(m.icon)}<div><b>${m.name}</b><small>${esc(m.desc)}</small></div></button>`).join('')}</div>`, `<button class="btn primary wide big" data-act="ob-analyze">Build my program</button>`);
    if (s === ST.analyze) return `<div class="ob-analyze"><div class="scan-orb">${Q.insignia(Q.RANKS[0], 70)}</div><div class="kicker">Building your program</div><div class="scan"><i></i></div><div class="scanlog" id="scanlog"></div></div>`;
    if (s === ST.results) {
      const a = o.a, base = Q.assess(a), keys = Q.STAT_ORDER.slice().sort((x, y) => base[x] - base[y]);
      const weak = keys.slice(0, 2), power = Math.round(Q.STAT_ORDER.reduce((t, k) => t + base[k], 0) / 6);
      const all = Q.generateProgram(a, o.mode);
      if (!o.picks) o.picks = new Set(all);
      const extra = Object.keys(Q.CATALOG).filter(k => !all.includes(k));
      const row = k => { const q = Q.buildQuest(k, a, o.mode, Q.today()); return `<div class="tpl ${o.picks.has(k) ? 'on' : ''}" data-act="ob-pick" data-v="${k}"><span class="box"></span><span class="tic" style="color:${Q.STATS[q.stat].color}">${ic(q.icon)}</span><span class="tn">${esc(Q.qName(q, Q.today()))}</span><small>${q.days.length < 7 ? q.days.map(d => Q.DAY_SHORT[d]).join(' ') : 'daily'}</small></div>`; };
      const T = Q.targets();
      return shell('Your report', 'Here\'s where you start', '', `
        <section class="card report">
          <div class="rep-top">${Q.emblem({ xp: 0, lvlStart: 0, lvlNext: 100, rank: Q.rankFor(1) }, 76)}<div><div class="kicker">Starting power</div><div class="disp huge">${power}</div><div class="muted small">Recruit · Level 1</div></div></div>
          ${Q.STAT_ORDER.map(k => `<div class="rstat ${weak.includes(k) ? 'weak' : ''}"><span>${ic(Q.STATS[k].icon)} ${Q.STATS[k].name}</span><div class="bar thin" style="--c:${Q.STATS[k].color}"><i style="width:${Q.pct(base[k], 60)}%"></i></div><b>${base[k]}</b></div>`).join('')}
          <p class="weaknote">Focus areas: <b>${weak.map(k => Q.STATS[k].name).join(' and ')}</b>. Your program leans into them first.</p>
        </section>
        <section class="card soft tgt"><div><b class="disp big">${fmt(T.kcal)}</b><span>kcal</span></div><div><b class="disp big">${T.p}g</b><span>protein</span></div><div><b class="disp big">${T.water}L</b><span>water</span></div></section>
        <div class="sec"><span>Your daily quests</span><span id="ob-pc">${o.picks.size} selected</span></div>
        <p class="hint">Starts manageable, gets harder every phase. Tap to add or remove.</p>
        <div class="tpls">${all.map(row).join('')}</div>
        <details class="more-q"><summary>More quests</summary><div class="tpls">${extra.map(row).join('')}</div></details>`, next('Looks good'));
    }
    if (s === ST.why) {
      const chips = ['To be proud of who I am', 'For my family', 'To prove I can', 'For my health', 'To build the life I want'];
      return shell('Commitment', 'Why are you doing this?', 'You\'ll see this when you\'re about to skip.', `<textarea id="ob-why" class="ob-input" rows="4" maxlength="220" placeholder="Because…">${esc(o.why)}</textarea>
        <div class="chips">${chips.map(c => `<button class="chip-btn" data-act="ob-chip" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>`, `<button class="btn primary wide big" data-act="ob-why">Continue</button>`);
    }
    if (s === ST.pledge) return shell('', `${esc(o.name || 'Ready')}, do you commit?`, '', `<div class="pledge">
        <div class="pl-em">${Q.insignia(Q.RANKS[0], 90)}</div>
        <p class="pledge-text">For the next 66 days I'll show up for my quests and my meals. When I slip, I won't miss twice.</p>
        ${o.why ? `<p class="why-quote">“${esc(o.why)}”</p>` : ''}
        <button class="hold" id="hold"><span class="hold-fill"></span><span class="hold-label">${ic('lock')} Hold to commit</span></button></div>`);
    return '';
  }

  Q.renderOnb = () => {
    const el = Q.$('#onb'); if (!el || !Q.onb) return;
    el.innerHTML = `<div class="ob-wrap">${stepHtml()}</div>`;
    el.scrollTop = 0;
    if (Q.onb.step === ST.analyze) runAnalyze();
    if (Q.onb.step === ST.pledge) wireHold();
  };

  function runAnalyze() {
    const lines = ['Mapping your week', 'Finding your free time', 'Calculating calories and protein', 'Selecting recipes for your kitchen', 'Scoring your attributes', 'Forging your 66-day program'];
    let i = 0;
    const tick = () => {
      const log = Q.$('#scanlog'); if (!log || !Q.onb || Q.onb.step !== ST.analyze) return;
      if (i < lines.length) { log.insertAdjacentHTML('beforeend', `<div>${ic('check')} ${lines[i]}</div>`); Q.sfx('tap'); i++; setTimeout(tick, 380); }
      else { Q.onb.step = ST.results; Q.sfx('tick'); Q.renderOnb(); }
    };
    setTimeout(tick, 300);
  }

  function wireHold() {
    const b = Q.$('#hold'); if (!b) return;
    let t0 = 0, raf = 0, done = false;
    const DUR = 1800;
    const step = () => { const p = Math.min(1, (Date.now() - t0) / DUR); b.style.setProperty('--p', p); if (p >= 1 && !done) { done = true; finish(); return; } raf = requestAnimationFrame(step); };
    const down = e => { e.preventDefault(); if (done) return; t0 = Date.now(); b.classList.add('holding'); Q.buzz(10); raf = requestAnimationFrame(step); };
    const up = () => { if (done) return; cancelAnimationFrame(raf); b.classList.remove('holding'); b.style.setProperty('--p', 0); };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    b.addEventListener('contextmenu', e => e.preventDefault());
  }

  function finish() {
    const o = Q.onb, S = Q.S, t = Q.today();
    S.hero.name = o.name || 'Hero'; S.hero.mode = o.mode; S.hero.answers = o.a;
    S.hero.base = Q.assess(o.a); S.hero.why = o.why; S.hero.onboarded = true; S.hero.created = t;
    S.settings.threshold = Q.MODES[o.mode].threshold;
    S.weights = [{ d: t, kg: S.nutri.weight }];
    S.quests = [...o.picks].map(k => Q.buildQuest(k, o.a, o.mode, t));
    S.program = { start: t, cycles: 0, phaseShown: 1, done66Shown: 0 };
    Q.save();
    Q.sfx('pledge'); Q.buzz([30, 60, 120]); Q.confetti();
    const el = Q.$('#onb'); el.classList.add('out');
    setTimeout(() => {
      el.remove(); Q.onb = null; document.body.classList.remove('onb-on'); Q.ui.tab = 'today'; Q.render();
      const g = Q.game();
      Q.showQueue([{ cls: 'lvl', html: `<div class="ovl-kicker">Day 1 · Phase 1</div><div class="ovl-stage">${Q.emblem(g, 130, 'big')}</div><h2>Foundation</h2>
        <p>Your day is planned around your commitments. Win it by clearing enough quests to beat today's opponent.</p><p class="muted small">Tip: hold any quest for the 2-minute mini version.</p>`, btn: 'Let\'s go' }]);
    }, 600);
  }

  Q.onbAct = (a, el) => {
    const o = Q.onb; if (!o) return;
    const go = n => { o.step = n; Q.sfx('tap'); Q.renderOnb(); };
    const n = Q.S.nutri;
    switch (a) {
      case 'ob-next':
        if (o.step === ST.sched) Q.S.week.days = Q.S.week.days; // edits are saved live
        go(o.step + 1); break;
      case 'ob-back': go(o.step === ST.results ? ST.mode : Math.max(0, o.step - 1)); break;
      case 'ob-name': o.name = Q.val('ob-name').trim(); if (!o.name) { Q.toast('Enter your name'); break; } go(o.step + 1); break;
      case 'ob-goal': {
        const v = el.dataset.v, g = o.a.goals;
        if (g.includes(v)) g.splice(g.indexOf(v), 1); else if (g.length < 3) g.push(v); else { Q.toast('Up to 3'); break; }
        Q.renderOnb(); Q.sfx('tap'); break;
      }
      case 'ob-ans': o.a[el.dataset.k] = +el.dataset.v; el.classList.add('on'); Q.sfx('tick'); setTimeout(() => go(o.step + 1), 160); break;
      case 'ob-body': {
        const age = +Q.val('ob-age'), h = +Q.val('ob-h'), w = +Q.val('ob-w');
        if (!(age >= 14 && age <= 90) || !(h >= 120 && h <= 230) || !(w >= 35 && w <= 300)) { Q.toast('Check age, height and weight'); break; }
        n.age = age; n.height = h; n.weight = Math.round(w * 10) / 10; Q.save(); go(o.step + 1); break;
      }
      case 'ob-mode': o.mode = el.dataset.v; o.picks = null; Q.renderOnb(); Q.sfx('tap'); break;
      case 'ob-analyze': Object.assign(o.a, Q.scheduleHabits()); o.picks = null; go(ST.analyze); break;
      case 'ob-pick': {
        const v = el.dataset.v;
        if (o.picks.has(v)) { if (o.picks.size <= 2) { Q.toast('Keep at least 2 quests'); break; } o.picks.delete(v); } else o.picks.add(v);
        el.classList.toggle('on'); Q.sfx('tap');
        const pc = Q.$('#ob-pc'); if (pc) pc.textContent = `${o.picks.size} selected`;
        break;
      }
      case 'ob-chip': Q.$('#ob-why').value = el.dataset.v; break;
      case 'ob-why': o.why = Q.val('ob-why').trim(); go(ST.pledge); break;
      default: break;
    }
  };
})(window.Q);
