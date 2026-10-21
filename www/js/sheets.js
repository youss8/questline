(function (Q) {
  'use strict';
  const { esc, fmt, ic } = Q;
  const money = n => Q.money(n, Q.S.settings.currency);
  const sum = arr => arr.reduce((a, x) => a + (+x.amount || 0), 0);
  const field = (label, inner) => `<div class="field"><label>${label}</label>${inner}</div>`;
  const seg = (id, opts, cur, cls) => `<div class="seg ${cls || ''}" data-seg="${id}">${opts.map(o => `<button type="button" data-v="${o.v}" class="${String(o.v) === String(cur) ? 'on' : ''}">${o.l}</button>`).join('')}</div>`;
  const statSeg = (id, cur) => seg(id, Q.STAT_ORDER.map(k => ({ v: k, l: `${ic(Q.STATS[k].icon)} ${Q.STATS[k].name}` })), cur, 'grid3');
  const diffSeg = (id, cur, side) => seg(id, [1, 2, 3].map(n => ({ v: n, l: `${Q.DIFF[n].name}<small>+${side ? Q.DIFF[n].side : Q.DIFF[n].xp} XP</small>` })), cur);
  Q.segVal = id => { const b = document.querySelector(`[data-seg="${id}"] button.on`); return b ? b.dataset.v : null; };
  const iconPick = (id, cur) => `<input type="hidden" id="${id}" value="${esc(cur)}"><div class="iconpick" data-pick="${id}">${Q.ICON_CHOICES.map(n => `<button type="button" data-icon="${n}" class="${n === cur ? 'on' : ''}">${ic(n)}</button>`).join('')}</div>`;
  const tierLabel = (q, i) => String(q.name).replace('{n}', () => { const v = q.tiers[i]; return typeof v === 'number' ? fmt(v) : v; });

  // ---------- quest menu ----------
  Q.questMenu = id => {
    const q = Q.S.quests.find(x => x.id === id); if (!q) return;
    const d = Q.ui.date, v = Q.getLog(d, id), done = Q.isDone(q, v, d), m = Q.mode();
    const skipsToday = Object.values(Q.S.logs[d] || {}).filter(x => x === 's').length, canSkip = m.skips > skipsToday;
    Q.sheet(`<div class="shead"><div class="ico" style="--sc:${Q.STATS[q.stat].color}">${ic(q.icon)}</div><div><h3>${esc(Q.qName(q, d))}</h3><div class="sub"><span>${Q.STATS[q.stat].name}</span><span>${Q.DIFF[q.diff].name}</span><span>+${Q.DIFF[q.diff].xp} XP</span></div></div></div>
      <div class="menu">
        ${!done ? `<button class="mi" data-act="mini" data-id="${id}">${ic('circle-dashed')}<div><b>${v === 'm' ? 'Undo mini version' : 'Do the mini version'}</b><small>${esc(q.mini || 'The 2-minute version')} · half XP</small></div></button>` : ''}
        ${v !== 's' && !done ? `<button class="mi" data-act="skip-ask" data-id="${id}" ${canSkip ? '' : 'disabled'}>${ic('ban')}<div><b>Skip today</b><small>${canSkip ? `${m.skips - skipsToday} skip(s) left today · no XP` : m.skips ? 'No skips left today' : 'Hardcore: no skips'}</small></div></button>` : ''}
        ${Q.maxLevel(q) > 0 ? `<button class="mi" data-act="edit-quest" data-id="${id}">${ic('trending-up')}<div><b>Change level</b><small>Now level ${Q.levelAt(q, d) + 1} of ${Q.maxLevel(q) + 1}</small></div></button>` : ''}
        <button class="mi" data-act="remind" data-id="${id}">${ic('alarm-clock')}<div><b>Reminder time</b><small>${q.remind ? `Fixed at ${esc(q.remind)}` : 'Follows your day plan'}</small></div></button>
        <button class="mi" data-act="edit-quest" data-id="${id}">${ic('pencil')}<div><b>Edit quest</b><small>Name, days, difficulty</small></div></button>
      </div>`);
  };
  Q.skipCard = id => {
    const q = Q.S.quests.find(x => x.id === id); if (!q) return;
    const why = Q.S.hero.why;
    Q.sheet(`<div class="whycard"><div class="kicker">Before you skip</div>
      <p class="why-quote">“${esc(why || 'Future you is watching.')}”</p>${why ? '<p class="muted small">You wrote this on day one.</p>' : ''}
      <p>Could you do the mini version instead? <b>${esc(q.mini || 'Just 2 minutes')}</b></p></div>
      <div class="actions"><button class="btn ghost" data-act="skip-yes" data-id="${id}">Skip anyway</button><button class="btn primary" data-act="mini" data-id="${id}">Do the mini</button></div>`);
  };
  Q.remindSheet = id => {
    const q = Q.S.quests.find(x => x.id === id); if (!q) return;
    Q.sheet(`<h3>Reminder time</h3><p class="muted">By default you're reminded at the time the planner gives this quest each day. Set a fixed time to override it.</p>
      ${field('Fixed time', `<input id="rm-t" type="time" value="${esc(q.remind || '18:00')}">`)}
      <div class="actions"><button class="btn ghost" data-act="remind-off" data-id="${id}">Follow the plan</button><button class="btn primary" data-act="remind-save" data-id="${id}">Save fixed time</button></div>`);
  };

  // ---------- quest editor ----------
  Q.questSheet = id => {
    const q = id ? Q.S.quests.find(x => x.id === id) : { name: '', icon: 'star', stat: 'dis', diff: 2, type: 'check', unit: '', tiers: [8], days: [0, 1, 2, 3, 4, 5, 6], when: 'anytime', dur: 20 };
    if (!q) return;
    const L = id ? Q.levelAt(q, Q.today()) : 0, multi = id && Q.maxLevel(q) > 0;
    const when = Q.questWhen(q);
    Q.sheet(`<h3>${id ? 'Edit quest' : 'New daily quest'}</h3><input type="hidden" id="q-id" value="${id || ''}">
      ${field('Name', `<input id="q-name" value="${esc(q.name)}" placeholder="e.g. Practice a language, Pray on time" maxlength="60">`)}
      ${String(q.name).includes('{n}') ? '<p class="hint">{n} becomes the target of the current level.</p>' : ''}
      <label class="fl">Icon</label>${iconPick('q-icon', q.icon)}
      ${multi ? `<label class="fl">Level</label><div class="levels" id="q-lv">${q.tiers.map((_, i) => `<button type="button" data-l="${i}" class="${i === L ? 'on' : ''}"><b>${i + 1}</b><small>${esc(tierLabel(q, i))}</small></button>`).join('')}</div><p class="hint">Easier applies now, harder from tomorrow.</p>` : ''}
      <label class="fl">Attribute</label>${statSeg('q-stat', q.stat)}
      <label class="fl">Difficulty</label>${diffSeg('q-diff', q.diff)}
      ${id ? '' : `<label class="fl">Completion</label>${seg('q-type', [{ v: 'check', l: 'Check off' }, { v: 'count', l: 'Counter' }], q.type)}
        <div id="q-count" class="grid2 ${q.type === 'count' ? '' : 'hide'}">${field('Daily target', `<input id="q-target" type="number" inputmode="decimal" min="1" step="any" value="${q.tiers[0] || 8}">`)}${field('Unit', `<input id="q-unit" value="" placeholder="pages, reps…" maxlength="14">`)}</div>
        <label class="fl">When</label>${seg('q-when', [{ v: 'morning', l: 'Morning' }, { v: 'afternoon', l: 'Afternoon' }, { v: 'evening', l: 'Evening' }, { v: 'anytime', l: 'Any' }, { v: 'allday', l: 'All day' }], when, 'wrap')}
        ${field('Time needed (minutes)', `<input id="q-dur" type="number" inputmode="numeric" min="0" step="5" value="${q.dur || 20}">`)}`}
      ${field('Mini version', `<input id="q-mini" value="${esc(q.mini || '')}" maxlength="70" placeholder="The 2-minute version">`)}
      <label class="fl">Repeat on</label>
      <div class="days" id="q-days">${Q.WEEK_ORDER.map(i => `<button type="button" data-d="${i}" class="${(q.days || []).includes(i) ? 'on' : ''}">${Q.DAY_SHORT[i][0]}</button>`).join('')}</div>
      <div class="actions">${id ? '<button class="btn danger" data-act="quest-del">Remove</button>' : '<button class="btn ghost" data-act="sheet-close">Cancel</button>'}<button class="btn primary" data-act="quest-save">Save</button></div>`);
  };
  Q.adjSheet = id => {
    const q = Q.S.quests.find(x => x.id === id); if (!q) return;
    const d = Q.ui.date, v = Q.getLog(d, id), cur = typeof v === 'number' ? v : 0, step = q.step || 1;
    Q.sheet(`<h3>${esc(Q.qName(q, d))}</h3><p class="muted">Target ${fmt(Q.target(q, d))} ${esc(q.unit || '')}</p>
      <div class="stepper"><button data-act="adj-step" data-n="${-step}" aria-label="Minus">${ic('minus')}</button><input id="adj-v" type="number" inputmode="decimal" step="any" value="${cur}"><button data-act="adj-step" data-n="${step}" aria-label="Plus">${ic('plus')}</button></div>
      <div class="actions"><button class="btn ghost" data-act="quest-menu" data-id="${id}">More options</button><button class="btn primary" data-act="adj-save" data-id="${id}">Save</button></div>`);
  };

  // ---------- schedule editor ----------
  Q.schedDay = 1;
  Q.schedEditorHtml = () => {
    const W = Q.S.week, dow = Q.schedDay, day = W.days[dow];
    const blocks = (day.blocks || []).slice().sort((x, y) => Q.toMin(x.start) - Q.toMin(y.start));
    return `<div class="daytabs">${Q.WEEK_ORDER.map(i => `<button data-act="sched-day" data-v="${i}" class="${i === dow ? 'on' : ''}">${Q.DAY_SHORT[i]}<small>${Q.durLabel(Q.freeMinutes(i))}</small></button>`).join('')}</div>
      <div class="grid2">${field('Wake up', `<input type="time" data-sched="wake" value="${esc(day.wake)}">`)}${field('Sleep', `<input type="time" data-sched="sleep" value="${esc(day.sleep)}">`)}</div>
      <div class="sec"><span>${Q.DAY_NAMES[dow]} commitments</span><span>${Q.durLabel(Q.freeMinutes(dow))} free</span></div>
      ${blocks.map(b => `<div class="blkrow" data-bid="${b.id}">
        <div class="blk-top"><select data-blk="type" aria-label="Type">${Object.entries(Q.BLOCK_TYPES).map(([k, t]) => `<option value="${k}" ${b.type === k ? 'selected' : ''}>${t.name}</option>`).join('')}</select>
        <input data-blk="label" value="${esc(b.label)}" maxlength="30" aria-label="Label"><button class="iconbtn sm" data-act="blk-del" data-bid="${b.id}" aria-label="Delete">${ic('trash-2')}</button></div>
        <div class="grid2"><label class="tlab">From<input type="time" data-blk="start" value="${esc(b.start)}"></label><label class="tlab">To<input type="time" data-blk="end" value="${esc(b.end)}"></label></div></div>`).join('') || '<p class="empty sm">No commitments. A free day.</p>'}
      <div class="fl">Add a commitment</div>
      <div class="quickadd">${Object.entries(Q.BLOCK_TYPES).map(([k, t]) => `<button class="chip-btn" data-act="blk-add" data-t="${k}">${ic(t.icon)} ${t.name}</button>`).join('')}</div>
      <div class="fl">Copy ${Q.DAY_NAMES[dow]} to</div>
      <div class="quickadd"><button class="chip-btn" data-act="sched-copy" data-v="weekdays">Mon – Fri</button><button class="chip-btn" data-act="sched-copy" data-v="weekend">Sat & Sun</button><button class="chip-btn" data-act="sched-copy" data-v="all">Every day</button></div>`;
  };
  Q.schedSheet = () => {
    Q.sheet(`<h3>Weekly schedule</h3><p class="muted small">Your fixed commitments, day by day. Quests and meals are planned into the time left over.</p>
      <div id="sched-ed">${Q.schedEditorHtml()}</div>
      <button class="btn primary wide big" data-act="sched-done">Save & re-plan</button>`, { full: true });
  };
  Q.refreshSched = () => {
    const el = document.getElementById('sched-ed');
    if (el) { const sc = el.closest('.sheet, #onb'); const y = sc ? sc.scrollTop : 0; el.innerHTML = Q.schedEditorHtml(); if (sc) sc.scrollTop = y; }
  };

  Q.daySheet = d => {
    const plan = Q.planDay(d);
    const rows = plan.items.map(it => {
      if (it.kind === 'block') return `<div class="dl"><time>${Q.fmtTime(it.s)}</time><span class="dl-b">${ic((Q.BLOCK_TYPES[it.type] || Q.BLOCK_TYPES.other).icon)} ${esc(it.label)} <small>until ${Q.fmtTime(it.e)}</small></span></div>`;
      if (it.kind === 'meal') { const mp = Q.mealPlan(d).meals.find(m => m.slot === it.meal.slot); return mp && !mp.empty ? `<div class="dl"><time>${Q.fmtTime(it.s)}</time><span class="dl-m">${ic('utensils')} ${esc(mp.label)} · ${esc(mp.tpl.name)}</span></div>` : ''; }
      if (it.s == null) return '';
      return `<div class="dl"><time>${Q.fmtTime(it.s)}</time><span class="dl-q">${ic(it.q.icon)} ${esc(Q.qName(it.q, d))}</span></div>`;
    }).join('');
    const flex = plan.items.filter(x => x.kind === 'quest' && x.s == null);
    Q.sheet(`<div class="kicker">${Q.niceDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}</div><h3>Day plan</h3>
      <p class="muted small">${Q.fmtTime(plan.start)} – ${Q.fmtTime(plan.end)} · ${Q.durLabel(plan.free)} unplanned</p>
      <div class="daylist">${rows}</div>
      ${plan.allday.length ? `<div class="sec"><span>All day</span></div><p class="small">${plan.allday.map(q => esc(Q.qName(q, d))).join(' · ')}</p>` : ''}
      ${flex.length ? `<div class="sec"><span>Optional (no free slot)</span></div><p class="small muted">${flex.map(x => esc(Q.qName(x.q, d))).join(' · ')}</p>` : ''}
      <button class="btn ghost wide" data-act="sched-edit">${ic('pencil')} Edit schedule</button>`, { full: true });
  };

  // ---------- nutrition ----------
  Q.nutriSheet = () => {
    const n = Q.S.nutri, T = Q.targets();
    Q.sheet(`<h3>Nutrition profile</h3><p class="muted small">Targets recalculate instantly. Weight updates automatically when you log it.</p>
      ${seg('n-sex', [{ v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }], n.sex)}
      <div class="grid3">${field('Age', `<input id="n-age" type="number" inputmode="numeric" value="${n.age}">`)}${field('Height (cm)', `<input id="n-h" type="number" inputmode="numeric" value="${n.height}">`)}${field('Weight (kg)', `<input id="n-w" type="number" inputmode="decimal" step="0.1" value="${Q.latestWeight()}">`)}</div>
      <label class="fl">Activity</label>${seg('n-act', Object.entries(Q.ACTIVITY).map(([k, a]) => ({ v: k, l: `${a.l}` })), n.activity, 'stack')}
      <label class="fl">Goal</label>${seg('n-goal', [{ v: 'lose', l: 'Lose fat' }, { v: 'maintain', l: 'Maintain' }, { v: 'gain', l: 'Build muscle' }], n.goal)}
      <label class="fl">Fat-loss pace</label>${seg('n-pace', Object.entries(Q.PACES).map(([k, p]) => ({ v: k, l: `${p.l}<small>−${Math.round(p.d * 100)}%</small>` })), n.pace)}
      <label class="fl">Meals per day</label>${seg('n-meals', [3, 4, 5].map(x => ({ v: x, l: String(x) })), n.meals)}
      <label class="fl">Foods you don't eat or can't get</label>
      <div class="chips" id="n-ex">${Q.EXCLUDABLE.map(e => `<button type="button" class="chip-btn ${n.exclude.includes(e.v) ? 'on' : ''}" data-ex="${e.v}">${esc(e.l)}</button>`).join('')}</div>
      <p class="hint">Now: ${fmt(T.kcal)} kcal · ${T.p} g protein · BMR ${fmt(T.bmr)} · maintenance ${fmt(T.tdee)}</p>
      <button class="btn primary wide big" data-act="nutri-save">Save</button>`, { full: true });
  };
  Q.grocerySheet = () => {
    const from = Q.today(), list = Q.groceryList(from, 7);
    const order = ['Meat', 'Dairy & eggs', 'Grains & bread', 'Vegetables', 'Fruit', 'Legumes', 'Pantry'];
    Q.sheet(`<div class="kicker">${Q.niceDate(from)} – ${Q.niceDate(Q.addDays(from, 6))}</div><h3>Grocery list</h3><p class="muted small">Exact totals from your next 7 days of meals. Meat and veg raw; rice and pasta cooked weight (roughly ⅓ of that dry).</p>
      ${order.filter(c => list[c]).map(c => `<div class="sec"><span>${c}</span></div><div class="glist">${list[c].map(i => `<label class="gi"><input type="checkbox"><span>${esc(i.n)}</span><b>${esc(i.amt)}</b></label>`).join('')}</div>`).join('')}`, { full: true });
  };
  Q.guideSheet = id => {
    const g = Q.GUIDE.find(x => x.id === id); if (!g) return;
    const i = Q.GUIDE.indexOf(g), nx = Q.GUIDE[i + 1];
    Q.sheet(`<div class="gd-h">${ic(g.icon)}<div><div class="kicker">Guide · ${i + 1}/${Q.GUIDE.length}</div><h3>${esc(g.t)}</h3></div></div>
      <div class="article">${g.b.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      ${nx ? `<button class="btn ghost wide" data-act="guide" data-id="${nx.id}">Next: ${esc(nx.t)} ${ic('chevron-right')}</button>` : ''}`, { full: true });
  };
  Q.weightSheet = () => {
    Q.sheet(`<h3>Log weight</h3>
      <div class="grid2">${field('Weight (kg)', `<input id="w-kg" type="number" inputmode="decimal" step="0.1" min="20" max="400" value="${Q.latestWeight()}">`)}${field('Date', `<input id="w-d" type="date" value="${Q.today()}" max="${Q.today()}">`)}</div>
      <p class="hint">Morning, after the bathroom, before food. Watch the weekly trend, not single days.</p>
      <div class="actions"><button class="btn ghost" data-act="sheet-close">Cancel</button><button class="btn primary" data-act="weight-save">Save</button></div>`);
  };
  Q.whySheet = () => Q.sheet(`<h3>Your why</h3><p class="muted">Shown when you're about to skip a quest.</p><textarea id="why-t" rows="4" maxlength="220">${esc(Q.S.hero.why || '')}</textarea>
    <div class="actions"><button class="btn ghost" data-act="sheet-close">Cancel</button><button class="btn primary" data-act="why-save">Save</button></div>`);
  Q.heroSheet = () => Q.sheet(`<h3>Your name</h3>${field('Name', `<input id="he-name" value="${esc(Q.S.hero.name)}" maxlength="18">`)}
    <div class="actions"><button class="btn ghost" data-act="sheet-close">Cancel</button><button class="btn primary" data-act="hero-save">Save</button></div>`);

  // ---------- reward drop ----------
  Q.openChest = d => {
    const g = Q.game(), loot = g.dailyLoot.find(l => l.date === d); if (!loot) return;
    Q.overlay({
      cls: 'drop', noBtn: true,
      html: `<div class="ovl-kicker">Reward drop</div>
        <div class="flip" id="flip"><div class="flip-in">
          <div class="face front">${ic('lock')}<span>Tap to reveal</span></div>
          <div class="face back r-${loot.rarity}"><div class="art-big">${ic(loot.icon)}</div></div>
        </div></div>
        <div id="creveal" class="creveal"></div>`,
      after: el => {
        let opened = false;
        el.querySelector('#flip').addEventListener('click', () => {
          if (opened) return; opened = true;
          el.querySelector('#flip').classList.add('open');
          Q.sfx('chest'); Q.buzz([15, 30, 50]);
          setTimeout(() => {
            Q.burstAt(el.querySelector('.flip'), { n: loot.rarity === 'legendary' ? 50 : 28, speed: 5, colors: loot.rarity === 'epic' ? ['#c4b1ff', '#9b8afb', '#fff'] : loot.rarity === 'rare' ? ['#9fd0f5', '#5aa9e6', '#fff'] : loot.rarity === 'common' ? ['#c9ced8', '#8d94a3'] : undefined });
            el.querySelector('#creveal').innerHTML = `<div class="rarity r-${loot.rarity}">${loot.rarity}</div><h2>${esc(loot.name)}</h2><button class="btn primary wide big" data-act="ovl-close">Collect</button>`;
          }, 380);
          Q.S.chests[d] = true; Q.save();
          if (Q.ui.tab === 'today' || Q.ui.tab === 'you') Q.render();
          setTimeout(() => Q.checkAch(), 500);
        });
      }
    });
  };

  // ---------- phase / program overlays ----------
  Q.phaseOverlay = r => ({
    cls: 'lvl', sfx: 'level', confetti: true,
    html: `<div class="ovl-kicker">Phase ${r.ph.n} begins</div><h2 class="ovl-title">${esc(r.ph.name)}</h2><p>${esc(r.ph.desc)}</p>
      ${r.ups.length ? `<div class="ups">${r.ups.map(u => `<div class="up">${ic(u.q.icon)}<div><s>${esc(u.before)}</s><b>${esc(u.after)}</b></div></div>`).join('')}</div><p class="muted small">New targets start tomorrow.</p>` : ''}
      ${r.kept.length ? `<p class="muted small">Unchanged (under 60% last week): ${r.kept.map(q => esc(Q.qName(q, Q.today()))).join(', ')}</p>` : ''}`
  });
  Q.completeOverlay = () => {
    const g = Q.game();
    return {
      cls: 'lvl rankup', sfx: 'level', confetti: true, btn: 'Start the next 66 days',
      html: `<div class="ovl-kicker">66 days complete</div><div class="ovl-stage">${Q.emblem(g, 140, 'big')}</div><h2>You did it</h2>
        <p>${g.defeated} days won · best streak ${g.best} · level ${g.level}</p><p class="muted small">Quests keep their levels. A new cycle starts today.</p>`,
      after: el => { el.querySelector('[data-act="ovl-close"]').dataset.act = 'new-cycle'; }
    };
  };

  // ---------- weekly review ----------
  Q.reviewSheet = () => {
    const g = Q.game(), t = Q.today(), S = Q.S;
    let due = 0, done = 0, kills = 0, xp = 0;
    for (let i = 1; i <= 7; i++) { const inf = g.days[Q.addDays(t, -i)]; if (!inf) continue; if (inf.total) { due += inf.total; done += inf.done; if (inf.defeated) kills++; } xp += inf.doneXp + inf.bonus; }
    const rated = S.quests.filter(q => Q.activeOn(q, t)).map(q => ({ q, st: Q.questStats(q) })).filter(x => x.st.due > 0).sort((a, b) => b.st.rate - a.st.rate);
    const best = rated[0], worst = rated[rated.length - 1], sug = Q.suggestions();
    const ci = Object.keys(S.checkins).filter(d => Q.diffDays(t, d) >= 1 && Q.diffDays(t, d) <= 7).map(d => S.checkins[d]);
    const avgE = ci.length ? Math.round(ci.reduce((a, c) => a + c.energy, 0) / ci.length * 10) / 10 : null;
    let mealDays = 0; for (let i = 1; i <= 7; i++) if (Q.mealsDone(Q.addDays(t, -i)) >= S.nutri.meals) mealDays++;
    const ws = S.weights.filter(w => Q.diffDays(t, w.d) <= 14).sort((a, b) => a.d.localeCompare(b.d));
    const wd = ws.length >= 2 ? Math.round((ws[ws.length - 1].kg - ws[0].kg) * 10) / 10 : null;
    Q.sheet(`<div class="kicker">Weekly review</div><h3>Your last 7 days</h3>
      <div class="stats3"><div><b>${due ? Q.pct(done, due) : 0}%</b><span>Quests done</span></div><div><b>${kills}/7</b><span>Days won</span></div><div><b>${mealDays}/7</b><span>Meal plan hit</span></div></div>
      <div class="rv">
        ${best ? `<p>${ic('trophy')} <b>Strongest:</b> ${esc(Q.qName(best.q, t))} · ${Math.round(best.st.rate * 100)}%</p>` : ''}
        ${worst && worst !== best ? `<p>${ic('mountain')} <b>Hardest:</b> ${esc(Q.qName(worst.q, t))} · ${Math.round(worst.st.rate * 100)}%</p>` : ''}
        ${avgE != null ? `<p>${ic('gauge')} <b>Average energy:</b> ${avgE}/5${avgE < 3 ? ' · prioritise sleep and water next week.' : ''}</p>` : ''}
        ${wd != null ? `<p>${ic('scale')} <b>Weight, 2 weeks:</b> ${wd > 0 ? '+' : ''}${wd} kg</p>` : ''}
        <p>${ic('sparkles')} <b>Quest XP:</b> +${xp}</p>
      </div>
      ${sug.length ? `<div class="sec"><span>Suggested changes</span></div>${sug.map(s => `<label class="rv-s"><input type="checkbox" data-rv="${s.q.id}" data-dir="${s.type === 'up' ? 1 : -1}" checked><span>${s.type === 'up' ? 'Level up' : 'Ease'} <b>${esc(Q.qName(s.q, t))}</b> → ${esc(tierLabel(s.q, Q.levelAt(s.q, t) + (s.type === 'up' ? 1 : -1)))}</span></label>`).join('')}` : '<p class="muted small">No changes needed. Your quests fit you.</p>'}
      ${field('One thing you\'ll do differently next week', '<textarea id="rv-note" rows="2" maxlength="200" placeholder="e.g. Charge the phone outside the bedroom"></textarea>')}
      <button class="btn primary wide big" data-act="review-save">Claim +50 XP</button>`, { full: true });
  };

  // ---------- side quests / hustles / rewards ----------
  Q.sideSheet = id => {
    const s = Q.S.side.find(x => x.id === id); if (!s) return;
    const st = Q.STATS[s.stat], df = Q.DIFF[s.diff];
    Q.sheet(`<div class="shead"><div class="ico" style="--sc:${st.color}">${ic(s.icon)}</div><div><h3>${esc(s.name)}</h3><div class="sub"><span>${st.name}</span><span>${df.name}</span><span>+${df.side} XP</span></div></div></div>
      ${s.due ? `<p class="small muted">Due ${Q.niceDate(s.due, { weekday: 'long', day: 'numeric', month: 'long' })}</p>` : ''}${s.notes ? `<p class="notes">${esc(s.notes)}</p>` : ''}
      ${s.steps.length ? `<div class="steps">${s.steps.map((x, i) => `<div class="step ${x.done ? 'done' : ''}" data-act="step" data-id="${id}" data-i="${i}"><span class="box"></span><span class="st">${esc(x.t)}</span></div>`).join('')}</div>` : ''}
      <div class="actions"><button class="btn ghost" data-act="side-edit" data-id="${id}">Edit</button>${s.done ? `<button class="btn ghost" data-act="side-undo" data-id="${id}">Mark not done</button>` : `<button class="btn primary" data-act="side-done" data-id="${id}">Complete</button>`}</div>`);
  };
  Q.sideEditSheet = id => {
    const s = id ? Q.S.side.find(x => x.id === id) : { name: '', icon: 'scroll', stat: 'dis', diff: 2, due: '', notes: '', steps: [] };
    if (!s) return;
    Q.sheet(`<h3>${id ? 'Edit side quest' : 'New side quest'}</h3><input type="hidden" id="s-id" value="${id || ''}">
      ${field('Name', `<input id="s-name" value="${esc(s.name)}" placeholder="e.g. Run a 5k" maxlength="60">`)}
      <label class="fl">Icon</label>${iconPick('s-icon', s.icon)}
      <label class="fl">Attribute</label>${statSeg('s-stat', s.stat)}<label class="fl">Difficulty</label>${diffSeg('s-diff', s.diff, true)}
      ${field('Due date (optional)', `<input id="s-due" type="date" value="${esc(s.due || '')}">`)}
      ${field('Steps (one per line)', `<textarea id="s-steps" rows="3" placeholder="Buy shoes&#10;Plan the route">${esc(s.steps.map(x => x.t).join('\n'))}</textarea>`)}
      ${field('Notes', `<textarea id="s-notes" rows="2">${esc(s.notes || '')}</textarea>`)}
      <div class="actions">${id ? '<button class="btn danger" data-act="side-del">Delete</button>' : '<button class="btn ghost" data-act="sheet-close">Cancel</button>'}<button class="btn primary" data-act="side-save">Save</button></div>`);
  };
  Q.hustleSheet = id => {
    const h = Q.S.hustles.find(x => x.id === id); if (!h) return;
    const earned = sum(h.entries), goal = h.goal || 0, p = goal ? Q.pct(earned, goal) : 0;
    const entries = h.entries.slice().sort((a, b) => (b.d || '').localeCompare(a.d || '')).slice(0, 8);
    Q.sheet(`<div class="shead"><div class="ico" style="--sc:#d6bb63">${ic(h.icon)}</div><div><h3>${esc(h.name)}</h3><div class="sub"><span>${goal ? `${p}% of ${money(goal)}` : 'No goal set'}</span></div></div></div>
      <div class="bigmoney disp">${money(earned)}</div>${goal ? `<div class="bar" style="--c:#d6bb63"><i style="width:${p}%"></i></div>` : ''}
      <div class="sec"><span>Steps · +15 XP each</span><span>${h.tasks.filter(x => x.done).length}/${h.tasks.length}</span></div>
      <div class="steps">${h.tasks.map((x, i) => `<div class="step ${x.done ? 'done' : ''}" data-act="htask" data-id="${id}" data-i="${i}"><span class="box"></span><span class="st">${esc(x.t)}</span><button class="mini" data-act="htask-del" data-id="${id}" data-i="${i}" aria-label="Remove">${ic('x')}</button></div>`).join('') || '<p class="empty sm">Break it into small moves.</p>'}</div>
      <div class="addrow"><input id="ht-new" placeholder="Add a step…" maxlength="80"><button class="btn primary" data-act="htask-add" data-id="${id}">Add</button></div>
      ${entries.length ? `<div class="sec"><span>Recent income</span></div><section class="card flat">${entries.map(e => `<div class="hist"><span>${money(e.amount)}${e.note ? ' · ' + esc(e.note) : ''}</span><small>${Q.niceDate(e.d, { day: 'numeric', month: 'short' })} <button class="mini" data-act="income-del" data-id="${id}" data-e="${e.id}" aria-label="Delete">${ic('x')}</button></small></div>`).join('')}</section>` : ''}
      <div class="actions"><button class="btn ghost" data-act="hustle-edit" data-id="${id}">Edit</button><button class="btn primary" data-act="income-add" data-id="${id}">${ic('plus')} Log income</button></div>`);
  };
  Q.hustleEditSheet = id => {
    const h = id ? Q.S.hustles.find(x => x.id === id) : { name: '', icon: 'rocket', goal: '' };
    if (!h) return;
    Q.sheet(`<h3>${id ? 'Edit hustle' : 'Start a hustle'}</h3><input type="hidden" id="h-id" value="${id || ''}">
      ${field('Name', `<input id="h-name" value="${esc(h.name)}" placeholder="e.g. Freelance projects" maxlength="60">`)}<label class="fl">Icon</label>${iconPick('h-icon', h.icon)}
      ${field(`Income goal (${esc(Q.S.settings.currency)})`, `<input id="h-goal" type="number" inputmode="decimal" min="0" step="any" value="${h.goal || ''}" placeholder="+200 XP when you hit it">`)}
      <div class="actions">${id ? '<button class="btn danger" data-act="hustle-del">Delete</button>' : '<button class="btn ghost" data-act="sheet-close">Cancel</button>'}<button class="btn primary" data-act="hustle-save">Save</button></div>`);
  };
  Q.incomeSheet = id => {
    const h = Q.S.hustles.find(x => x.id === id); if (!h) return;
    Q.sheet(`<h3>Log income · ${esc(h.name)}</h3>
      ${field(`Amount (${esc(Q.S.settings.currency)})`, '<input id="i-amt" type="number" inputmode="decimal" min="0" step="any" placeholder="0">')}
      ${field('Note', '<input id="i-note" maxlength="60" placeholder="Client, product, gig…">')}${field('Date', `<input id="i-date" type="date" value="${Q.today()}" max="${Q.today()}">`)}
      <div class="actions"><button class="btn ghost" data-act="sheet-close">Cancel</button><button class="btn primary" data-act="income-save" data-id="${id}">Save · +20 XP</button></div>`);
  };
  Q.rewardSheet = id => {
    const r = id ? Q.S.rewards.find(x => x.id === id) : { name: '', icon: 'gift', cost: 100 };
    if (!r) return;
    Q.sheet(`<h3>${id ? 'Edit reward' : 'New reward'}</h3><input type="hidden" id="r-id" value="${id || ''}">
      ${field('Name', `<input id="r-name" value="${esc(r.name)}" placeholder="e.g. New sneakers" maxlength="60">`)}<label class="fl">Icon</label>${iconPick('r-icon', r.icon)}
      ${field('Cost in coins', `<input id="r-cost" type="number" inputmode="numeric" min="1" step="1" value="${r.cost}">`)}
      <div class="actions">${id ? '<button class="btn danger" data-act="reward-del">Delete</button>' : '<button class="btn ghost" data-act="sheet-close">Cancel</button>'}<button class="btn primary" data-act="reward-save">Save</button></div>`);
  };
})(window.Q);
