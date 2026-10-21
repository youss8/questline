(function (Q) {
  'use strict';
  const { esc, fmt, pct, ic } = Q;
  Q.ui = { tab: 'today', date: Q.today(), edit: false, plantab: 'week', qtab: 'side', sideTab: 'active', sub: null, focusMins: 25, mealOpen: null, fuelDate: Q.today() };
  const money = n => Q.money(n, Q.S.settings.currency);
  const sum = arr => arr.reduce((a, x) => a + (+x.amount || 0), 0);
  const bar = (p, c, cls) => `<div class="bar ${cls || ''}" style="--c:${c || 'var(--gold)'}"><i style="width:${p}%"></i></div>`;
  const statC = k => Q.STATS[k].color;
  const T = m => Q.fmtTime(m);
  const durLabel = m => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}` : `${m}m`;
  Q.durLabel = durLabel;

  Q.dateLabel = d => {
    const t = Q.today();
    if (d === t) return 'Today';
    if (d === Q.addDays(t, -1)) return 'Yesterday';
    if (d === Q.addDays(t, 1)) return 'Tomorrow';
    return Q.niceDate(d);
  };
  const greet = () => { const h = Q._now().getHours(); return h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  // ---------- shared ----------
  function topbar(g) {
    return `<header class="top">
      <div><div class="kicker">${Q.niceDate(Q.today(), { weekday: 'long', day: 'numeric', month: 'long' })}</div><h1>${greet()}, ${esc(Q.S.hero.name)}</h1></div>
      <button class="top-em" data-act="tab" data-tab="you" aria-label="Profile">${Q.emblem(g, 54)}</button>
    </header>
    <div class="statrow">
      <div class="lvl"><div class="lvl-h"><span class="disp">Level ${g.level}</span><span class="muted">${g.rank.name}</span></div>${bar(pct(g.xp - g.lvlStart, g.lvlNext - g.lvlStart), 'linear-gradient(90deg,#b8893f,#f0d394)', 'xp')}<div class="tiny muted">${g.xp - g.lvlStart} / ${g.lvlNext - g.lvlStart} XP</div></div>
      <div class="pill ${g.cur ? 'hot' : ''}" title="Streak">${ic('flame')}<b>${g.cur}</b></div>
      <div class="pill" title="Streak shields">${ic('shield-check')}<b>${g.shields}</b></div>
      <div class="pill" title="Coins">${ic('coins')}<b>${g.coins}</b></div>
    </div>`;
  }

  function programStrip() {
    const pd = Q.programDay(), ph = Q.phaseFor(pd), done = pd > Q.PROGRAM_DAYS;
    return `<button class="pstrip" data-act="plan-journey">
      <div><span class="disp">Day ${Math.min(pd, Q.PROGRAM_DAYS)}</span><span class="muted"> / ${Q.PROGRAM_DAYS}</span></div>
      <div class="ps-mid">${bar(pct(Math.min(pd, 66), 66), 'var(--gold)', 'thin')}</div>
      <div class="muted small">${done ? 'Complete' : `Phase ${ph.n} · ${ph.name}`}</div>${ic('chevron-right', 'chev')}
    </button>`;
  }

  function checkinCard(d) {
    if (Q.S.checkins[d]) return '';
    const c = Q.ui.ci || {};
    const moods = [['frown', 'Rough'], ['meh', 'Low'], ['minus', 'Okay'], ['smile', 'Good'], ['laugh', 'Great']];
    return `<section class="card ci">
      <div class="card-h"><div><div class="kicker">Daily check-in</div><b>How are you today?</b></div><span class="tag">+5 XP</span></div>
      <div class="ci-lab">Mood</div><div class="seg5">${moods.map((m, i) => `<button class="${c.mood === i + 1 ? 'on' : ''}" data-act="ci" data-k="mood" data-v="${i + 1}">${m[1]}</button>`).join('')}</div>
      <div class="ci-lab">Energy</div><div class="seg5">${[1, 2, 3, 4, 5].map(i => `<button class="${c.energy === i ? 'on' : ''}" data-act="ci" data-k="energy" data-v="${i}"><span class="en">${'▮'.repeat(i)}<i>${'▮'.repeat(5 - i)}</i></span></button>`).join('')}</div>
    </section>`;
  }

  function opponentCard(info, g) {
    const d = info.date;
    if (!info.total) return `<section class="card opp-card rest"><div class="oc-l">${Q.oppIcon({ icon: 'sofa' }, 'calm', 100)}</div><div class="oc-r"><div class="kicker">Rest day</div><h3>No opponent today</h3><p class="muted small">Recover. Quests you do anyway still earn XP.</p></div></section>`;
    const m = Q.monsterFor(d), left = Math.max(0, info.hp - info.doneXp), p = pct(left, info.hp);
    const opened = Q.S.chests[d];
    return `<section class="card opp-card ${info.defeated ? 'won' : ''}" id="opp">
      <div class="oc-l">${Q.oppIcon(m, info.defeated ? 'defeated' : '', p)}</div>
      <div class="oc-r">
        <div class="kicker">${info.defeated ? 'Defeated' : 'Today\'s opponent'}</div>
        <h3>${esc(m.name)}</h3>
        <p class="muted small">${info.defeated ? 'Day won. Keep stacking quests for XP.' : esc(m.line)}</p>
        <div class="res"><span>Resistance</span><b>${left}<small>/${info.hp}</small></b></div>
        ${bar(p, info.defeated ? 'var(--green)' : 'linear-gradient(90deg,#e5654f,#f08a5d)', 'hp')}
        <div class="tiny muted">${info.done}/${info.total} quests${info.minis ? ` · ${info.minis} mini` : ''}${info.flexN ? ` · ${info.flexN} optional` : ''}${info.low ? ' · low-energy: 15% weaker' : ''}</div>
      </div>
      ${info.defeated && !opened ? `<button class="drop-btn" data-act="chest" data-d="${d}">${ic('gift')}<span>Reward drop</span></button>` : ''}
    </section>`;
  }

  function gauntletStrip(g) {
    const w = g.week;
    return `<section class="gaunt ${w.defeated ? 'won' : ''}">
      <div class="g-ic">${ic(w.boss.icon)}</div>
      <div class="g-mid"><div class="small"><span class="muted">Weekly gauntlet ·</span> ${esc(w.boss.name)}</div>
        <div class="pips-row">${Array.from({ length: w.need }, (_, i) => `<i class="${i < w.kills ? 'on' : ''}"></i>`).join('')}</div></div>
      <div class="small ${w.defeated ? 'good' : 'muted'}">${w.defeated ? 'Cleared' : `${w.kills}/${w.need}`}</div>
    </section>`;
  }

  function suggestionCard() {
    const s = Q.suggestions()[0]; if (!s) return '';
    const q = s.q, t = Q.today(), now = Q.qName(q, t);
    const nextL = Q.levelAt(q, t) + (s.type === 'up' ? 1 : -1);
    const next = String(q.name).replace('{n}', () => { const v = q.tiers[nextL]; return typeof v === 'number' ? fmt(v) : v; });
    const up = s.type === 'up';
    return `<section class="card sugg ${up ? 'up' : 'down'}"><div class="sg-ic">${ic(up ? 'trending-up' : 'trending-down')}</div><div class="sg-t">
      <b>${up ? 'Ready for the next level?' : 'Ease it for now?'}</b>
      <p>${up ? `You hit <b>${esc(now)}</b> ${fmt(s.st.done)}/${s.st.due} times this week. Next: <b>${esc(next)}</b>, from tomorrow.` : `<b>${esc(now)}</b> landed ${fmt(s.st.done)}/${s.st.due} times. A smaller step still builds the habit: <b>${esc(next)}</b>.`}</p>
      <div class="actions sm"><button class="btn ghost" data-act="sugg-no" data-id="${q.id}">${up ? 'Not yet' : 'Keep it'}</button><button class="btn primary" data-act="sugg-yes" data-id="${q.id}" data-dir="${up ? 1 : -1}">${up ? 'Level up' : 'Make easier'}</button></div></div></section>`;
  }

  // ---------- quest row ----------
  Q.questRow = (it, d, opts) => {
    opts = opts || {};
    const q = it.q, v = it.v, df = Q.DIFF[q.diff], st = Q.STATS[q.stat];
    const name = Q.qName(q, d), L = Q.levelAt(q, d), maxL = Q.maxLevel(q);
    const pips = maxL > 0 ? `<span class="lvpips">${q.tiers.map((_, i) => `<i class="${i <= L ? 'on' : ''}"></i>`).join('')}</span>` : '';
    const dur = Q.questDur(q, d);
    let sub = `<span style="color:${st.color}">${st.short}</span><span>+${df.xp} XP</span>${dur ? `<span>${durLabel(dur)}</span>` : ''}${pips}`;
    let right, barH = '';
    if (q.type === 'count' && !it.skip) {
      const cur = typeof v === 'number' ? v : 0, tg = Q.target(q, d);
      sub = `<span>${fmt(cur)} / ${fmt(tg)} ${esc(q.unit || '')}</span><span>+${df.xp} XP</span>${pips}`;
      barH = bar(pct(cur, tg), it.done ? 'var(--green)' : st.color, 'thin');
      right = it.done ? `<div class="chk">${ic('check')}</div>` : (q.key === 'meals' ? `<div class="chk ghost">${ic('chevron-right')}</div>` : `<button class="plus" data-act="inc" data-id="${q.id}" aria-label="Add">+${q.step > 1 ? fmt(q.step) : 1}</button>`);
    } else right = `<div class="chk">${it.mini ? '<span class="half">½</span>' : ic('check')}</div>`;
    if (it.skip) { sub = `<span>${it.off ? 'Off-plan day' : 'Skipped today'}</span>`; right = it.off ? '' : `<button class="btn ghost xs" data-act="unskip" data-id="${q.id}">Undo</button>`; }
    if (opts.edit) {
      sub = q.since > d ? `<span>Starts ${Q.dateLabel(q.since).toLowerCase()}</span>` : `<span>${q.days.length === 7 ? 'Every day' : q.days.map(x => Q.DAY_SHORT[x]).join(' ')}</span>`;
      right = `<div class="ordr"><button data-act="quest-up" data-id="${q.id}" ${opts.i === 0 ? 'disabled' : ''} aria-label="Move up">${ic('chevron-up')}</button><button data-act="quest-down" data-id="${q.id}" ${opts.i === opts.n - 1 ? 'disabled' : ''} aria-label="Move down">${ic('chevron-down')}</button></div>`;
    }
    const act = opts.edit ? 'edit-quest' : it.skip ? '' : q.key === 'meals' ? 'goto-fuel' : (q.type === 'count' ? 'adj' : 'toggle');
    const cls = opts.edit ? '' : `${it.done ? 'done' : ''} ${it.mini ? 'is-mini' : ''} ${it.skip ? 'skip' : ''} ${it.flex ? 'flex' : ''}`;
    return `<div class="row quest ${cls}" data-act="${act}" data-id="${q.id}" data-hold="${opts.edit ? '' : q.id}">
      ${opts.time != null ? `<div class="tm">${opts.time}</div>` : ''}
      <div class="ico" style="--sc:${st.color}">${ic(q.icon)}</div>
      <div class="meta"><div class="name">${esc(name)}</div><div class="sub">${sub}</div>${barH}</div>${right}</div>`;
  };

  function mealRow(item, d) {
    const mp = Q.mealPlan(d).meals.find(m => m.slot === item.meal.slot);
    if (!mp || mp.empty) return '';
    const st = Q.mealLog(d)[mp.slot];
    return `<div class="row meal ${st === 'done' ? 'done' : st === 'off' ? 'skip' : ''}" data-act="meal-open" data-slot="${mp.slot}" data-d="${d}">
      <div class="tm">${T(item.s)}</div>
      <div class="ico" style="--sc:#d6bb63">${ic(mp.tpl.icon)}</div>
      <div class="meta"><div class="name">${esc(mp.label)} · ${esc(mp.tpl.name)}</div><div class="sub"><span>${mp.k} kcal</span><span>${mp.p} g protein</span>${item.atWork ? '<span>at work</span>' : ''}</div></div>
      <div class="chk">${st === 'off' ? ic('x') : ic('check')}</div></div>`;
  }

  function blockRow(it) {
    const bt = Q.BLOCK_TYPES[it.type] || Q.BLOCK_TYPES.other;
    return `<div class="row blk"><div class="tm">${T(it.s)}</div><div class="ico" style="--sc:${bt.color}">${ic(bt.icon)}</div><div class="meta"><div class="name">${esc(it.label)}</div><div class="sub"><span>${T(it.s)} – ${T(it.e)}</span><span>${durLabel(it.e - it.s)}</span></div></div></div>`;
  }

  function bonusRow(d) {
    if (d !== Q.today()) return '';
    const b = Q.bonusFor(d), done = !!Q.S.bonus[d];
    return `<div class="row quest bonus ${done ? 'done' : ''}" data-act="bonus"><div class="ico" style="--sc:#d4af6a">${ic('dice-5')}</div>
      <div class="meta"><div class="name">${esc(b.name)}</div><div class="sub"><span>Bonus · today only</span><span>+25 XP</span></div></div><div class="chk">${ic('check')}</div></div>`;
  }

  function viewToday() {
    const S = Q.S, g = Q.game(), d = Q.ui.date, t = Q.today(), edit = Q.ui.edit;
    if (S.program.start && S.program.start > t && d === t && !edit) {
      const n = Q.diffDays(S.program.start, t);
      return `${topbar(g)}<section class="card note gold">${ic('hourglass')}<div><b>Day 1 starts ${n === 1 ? 'tomorrow' : 'in ' + n + ' days'}</b><p>Your quests, meals and opponent unlock on ${Q.niceDate(S.program.start, { weekday: 'long', day: 'numeric', month: 'long' })}. Tonight: check your plan, buy groceries, sleep on time.</p></div></section>
        <div class="tools2"><button class="tile" data-act="tab" data-tab="plan">${ic('calendar-days')}<b>See your week</b><span>Commitments & free time</span></button><button class="tile" data-act="grocery">${ic('shopping-cart')}<b>Grocery list</b><span>For your first 7 days</span></button></div>
        <button class="btn ghost wide" data-act="fuel-tomorrow">${ic('utensils')} Preview tomorrow's meals</button>`;
    }
    const info = g.days[d] || Q.dayInfo(d), plan = Q.planDay(d);
    const byId = {}; info.items.forEach(it => { byId[it.q.id] = it; });
    const qt = Q.quoteFor(d);
    let body = '';
    if (edit) {
      const all = Q.editList(d);
      body = `<div class="sec"><span>Edit quests</span><span>${all.length}</span></div>` + (all.map((q, i) => Q.questRow({ q, v: Q.getLog(d, q.id) }, d, { edit: true, i, n: all.length })).join('') || '<p class="empty">No quests yet.</p>');
    } else {
      const rows = [];
      for (const it of plan.items) {
        if (it.kind === 'block') rows.push(blockRow(it));
        else if (it.kind === 'meal') rows.push(mealRow(it, d));
        else if (it.kind === 'quest' && it.s != null && byId[it.q.id]) rows.push(Q.questRow(byId[it.q.id], d, { time: T(it.s) }));
      }
      const flex = plan.items.filter(it => it.kind === 'quest' && it.s == null && byId[it.q.id]).map(it => Q.questRow(byId[it.q.id], d, { time: '' }));
      const allday = plan.allday.filter(q => byId[q.id]).map(q => Q.questRow(byId[q.id], d, { time: '' }));
      const loadTxt = plan.load === 'heavy' ? 'Packed day' : plan.load === 'busy' ? 'Busy day' : 'Open day';
      body = `<div class="sec"><span>${d === t ? 'Today\'s plan' : 'Plan'}</span><span class="load ${plan.load}">${loadTxt} · ${durLabel(plan.free)} free</span></div>
        <div class="timeline">${rows.join('') || '<p class="empty">Nothing scheduled.</p>'}</div>
        ${allday.length ? `<div class="sec"><span>All day</span></div>${allday.join('')}` : ''}
        ${flex.length ? `<div class="sec"><span>If you find time</span><span class="muted">optional today</span></div><p class="hint">No free slot fits these today, so they don't count against you. Doing them still earns XP.</p>${flex.join('')}` : ''}
        ${bonusRow(d)}
        <p class="hint c">Hold any quest for the mini version, skip, reminder or edit.</p>`;
    }
    return `${topbar(g)}
      ${programStrip()}
      ${d === t && !edit ? checkinCard(d) : ''}
      ${info.comeback && d === t && !info.defeated ? `<section class="card note warm">${ic('refresh-cw')}<div><b>Comeback day</b><p>You slipped yesterday. Never miss twice: win today for +40 XP and a fresh streak.</p></div></section>` : ''}
      ${d === t && !edit && Q.reviewDue() ? `<button class="card note gold cta" data-act="review">${ic('scroll-text')}<div><b>Weekly review is ready</b><p>Look back, tune your quests, claim +50 XP.</p></div>${ic('chevron-right', 'chev')}</button>` : ''}
      ${d === t && !edit ? suggestionCard() : ''}
      ${edit ? '' : opponentCard(info, g)}
      ${edit || d !== t ? '' : gauntletStrip(g)}
      ${d === t && !edit && S.ui.quoteHidden !== d ? `<section class="quote"><button class="x" data-act="hide-quote" aria-label="Dismiss">${ic('x')}</button><div class="kicker">${esc(qt.c)}</div><p>${esc(qt.t)}</p></section>` : ''}
      ${info.penalty ? `<div class="note-line bad">${ic('skull')} Hardcore: this day cost ${info.penalty} XP.</div>` : ''}
      ${info.shielded ? `<div class="note-line">${ic('shield-check')} A shield protected your streak on this day.</div>` : ''}
      <div class="datenav"><button class="iconbtn" data-act="prev-day" aria-label="Previous day">${ic('chevron-left')}</button><button class="dlabel" data-act="go-today">${Q.dateLabel(d)}</button><button class="iconbtn" data-act="next-day" aria-label="Next day" ${d >= t ? 'disabled' : ''}>${ic('chevron-right')}</button></div>
      ${body}
      <div class="actions"><button class="btn ghost" data-act="edit-mode">${edit ? 'Done' : `${ic('pencil')} Edit quests`}</button><button class="btn primary" data-act="add-quest">${ic('plus')} New quest</button></div>`;
  }

  // ---------- PLAN ----------
  function weekView() {
    const S = Q.S, t = Q.today(), wk = S.week, train = wk.train || {};
    const wq = S.quests.find(q => q.key === 'workout' && Q.activeOn(q, t));
    const rows = Q.WEEK_ORDER.map(dow => {
      const f = Q.dayFrame(dow), free = Q.freeMinutes(dow);
      const date = Q.addDays(t, (dow - Q.dow(t) + 7) % 7);
      const plan = Q.planDay(date);
      const span = 24 * 60, s0 = 5 * 60;
      const pos = m => Q.clamp((m - s0) / span * 100, 0, 100);
      const segs = f.blocks.map(b => `<i class="seg" style="left:${pos(b.s)}%;width:${pos(b.e) - pos(b.s)}%;--c:${(Q.BLOCK_TYPES[b.type] || Q.BLOCK_TYPES.other).color}"></i>`).join('');
      const ticks = plan.items.filter(x => x.kind === 'quest' && x.s != null).map(x => `<i class="tick" style="left:${pos(x.s)}%"></i>`).join('') + plan.items.filter(x => x.kind === 'meal').map(x => `<i class="tick meal" style="left:${pos(x.s)}%"></i>`).join('');
      const isTrain = wq && wq.days.includes(dow);
      return `<button class="wday ${dow === Q.dow(t) ? 'today' : ''}" data-act="day-open" data-d="${date}">
        <div class="wd-n"><b>${Q.DAY_SHORT[dow]}</b><small>${Q.fromMin(f.wake)}–${Q.fromMin(f.sleep)}</small></div>
        <div class="wd-strip"><i class="awake" style="left:${pos(f.wake)}%;width:${pos(f.sleep) - pos(f.wake)}%"></i>${segs}${ticks}</div>
        <div class="wd-r">${isTrain ? `<span class="tbadge">${ic('dumbbell')}</span>` : ''}<small>${durLabel(free)}</small></div></button>`;
    }).join('');
    return `<section class="card">
        <div class="card-h"><div><div class="kicker">Your week</div><b>Commitments & free time</b></div><button class="btn ghost xs" data-act="sched-edit">${ic('pencil')} Edit</button></div>
        <div class="wk-axis"><span>05:00</span><span>11:00</span><span>17:00</span><span>23:00</span><span>05:00</span></div>
        ${rows}
        <div class="legend"><span><i style="background:#5aa9e6"></i>Work</span><span><i style="background:#9b8afb"></i>Study</span><span><i class="lg-tick"></i>Quest</span><span><i class="lg-tick meal"></i>Meal</span></div>
      </section>
      <section class="card">
        <div class="card-h"><div><div class="kicker">Training</div><b>${train.perWeek || 3} sessions a week · ${train.pref === 'morning' ? 'mornings' : train.pref === 'any' ? 'any time' : 'evenings'}</b></div></div>
        <div class="fl">Sessions per week</div>
        <div class="seg" data-seg="perweek">${[2, 3, 4, 5, 6].map(n => `<button data-v="${n}" class="${(train.perWeek || 3) === n ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="fl">Preferred time</div>
        <div class="seg" data-seg="trainpref">${[['morning', 'Morning'], ['evening', 'Evening'], ['any', 'Any']].map(([v, l]) => `<button data-v="${v}" class="${(train.pref || 'evening') === v ? 'on' : ''}">${l}</button>`).join('')}</div>
        <p class="hint">${wq ? `Training days are picked from your most open days: <b>${wq.days.map(x => Q.DAY_NAMES[x]).join(', ')}</b>.` : 'Add a training quest to schedule sessions.'}</p>
      </section>
      <p class="hint c">Every quest and meal is placed into your free time. Days without room move quests to "optional" so a packed day never costs you a streak.</p>`;
  }

  function journeyView() {
    const S = Q.S, g = Q.game(), P = S.program, t = Q.today();
    const pd = Q.programDay(), ph = Q.phaseFor(pd);
    const cells = [];
    for (let i = 0; i < Q.PROGRAM_DAYS; i++) {
      const d = Q.addDays(P.start, i), info = g.days[d];
      let c = 'fut';
      if (d < t || (d === t && info && info.defeated)) {
        if (!info || !info.total) c = 'rest'; else if (info.perfect) c = 'perf'; else if (info.defeated) c = 'win'; else if (info.shielded) c = 'shield'; else c = d === t ? 'fut' : 'miss';
      }
      cells.push(`<i class="${c} ${d === t ? 'now' : ''}" title="Day ${i + 1}"></i>`);
    }
    let due7 = 0, done7 = 0, kills7 = 0;
    for (let i = 1; i <= 7; i++) { const inf = g.days[Q.addDays(t, -i)]; if (inf && inf.total) { due7 += inf.total; done7 += inf.done; if (inf.defeated) kills7++; } }
    const qrows = S.quests.filter(q => Q.activeOn(q, t)).map(q => {
      const st = Q.questStats(q), L = Q.levelAt(q, t), maxL = Q.maxLevel(q);
      const next = L < maxL ? String(q.name).replace('{n}', () => { const v = q.tiers[L + 1]; return typeof v === 'number' ? fmt(v) : v; }) : null;
      return `<div class="qlv" data-act="edit-quest" data-id="${q.id}"><div class="ico sm" style="--sc:${statC(q.stat)}">${ic(q.icon)}</div>
        <div class="meta"><div class="name">${esc(Q.qName(q, t))}</div><div class="sub"><span>${maxL > 0 ? `Level ${L + 1}/${maxL + 1}` : 'Single level'}</span>${next ? `<span>next: ${esc(next)}</span>` : maxL > 0 ? '<span>max</span>' : ''}</div>${bar(st.rate == null ? 0 : Math.round(st.rate * 100), statC(q.stat), 'thin')}</div>
        <span class="pct">${st.rate == null ? '–' : Math.round(st.rate * 100) + '%'}</span></div>`;
    }).join('');
    const lastR = S.reviews.length ? S.reviews[S.reviews.length - 1].d : P.start;
    const P100 = pct(Math.min(pd, 66), 66), C = 2 * Math.PI * 42;
    return `<section class="card jhead">
        <div class="jh-top"><div><div class="kicker">${P.cycles ? `Cycle ${P.cycles + 1} · ` : ''}Day ${Math.min(pd, 66)} of 66</div><h2>Phase ${ph.n}: ${ph.name}</h2><p class="muted small">${esc(ph.desc)}</p></div>
          <div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="rg-t"/><circle cx="50" cy="50" r="42" class="rg-p" stroke-dasharray="${(C * P100 / 100).toFixed(1)} ${C.toFixed(1)}"/></svg><span class="disp">${P100}%</span></div></div>
        <div class="phases">${Q.PHASES.map(p => `<div class="ph ${p.n < ph.n ? 'past' : p.n === ph.n ? 'cur' : ''}" style="flex:${p.to - p.from + 1}"><i></i><small>${p.name}</small></div>`).join('')}</div>
      </section>
      <section class="card"><div class="cal">${cells.join('')}</div>
        <div class="legend"><span><i class="perf"></i>Flawless</span><span><i class="win"></i>Won</span><span><i class="shield"></i>Shielded</span><span><i class="miss"></i>Missed</span><span><i class="rest"></i>Rest</span></div></section>
      ${Q.reviewDue() ? `<button class="card note gold cta" data-act="review">${ic('scroll-text')}<div><b>Weekly review is ready</b><p>Claim +50 XP and tune your quests.</p></div>${ic('chevron-right', 'chev')}</button>` : `<p class="hint c">Next weekly review in ${Math.max(1, 7 - Q.diffDays(t, lastR))} day(s).</p>`}
      <div class="stats3"><div><b>${due7 ? pct(done7, due7) : 0}%</b><span>Last 7 days</span></div><div><b>${kills7}/7</b><span>Days won</span></div><div><b>${g.weekBosses}</b><span>Gauntlets</span></div></div>
      <div class="sec"><span>Quest levels</span><span>7-day rate</span></div>${qrows || '<p class="empty">No active quests.</p>'}`;
  }

  function viewPlan() {
    const t = Q.ui.plantab;
    return `<h1 class="pt">Plan</h1>
      <div class="seg big" data-seg="plantab"><button data-v="week" class="${t === 'week' ? 'on' : ''}">Week</button><button data-v="journey" class="${t === 'journey' ? 'on' : ''}">66-day journey</button></div>
      ${t === 'week' ? weekView() : journeyView()}`;
  }

  // ---------- FUEL ----------
  function weightBlock() {
    const w = Q.S.weights.slice().sort((a, b) => a.d.localeCompare(b.d)).slice(-30);
    let chart = '<p class="muted small">Log your weight each morning (or a few times a week) and your calorie targets update automatically.</p>';
    if (w.length >= 2) {
      const ys = w.map(x => x.kg), lo = Math.min(...ys) - 0.5, hi = Math.max(...ys) + 0.5, W = 320, H = 120;
      const px = i => 12 + i * (W - 24) / (w.length - 1), py = y => H - 14 - (y - lo) / (hi - lo) * (H - 28);
      const pts = w.map((x, i) => `${px(i).toFixed(1)},${py(x.kg).toFixed(1)}`).join(' ');
      const delta = Math.round((ys[ys.length - 1] - ys[0]) * 10) / 10;
      chart = `<svg viewBox="0 0 ${W} ${H}" class="wchart" role="img" aria-label="Weight trend"><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(212,175,106,.35)"/><stop offset="1" stop-color="rgba(212,175,106,0)"/></linearGradient></defs>
        <polygon points="${px(0)},${H} ${pts} ${px(w.length - 1)},${H}" fill="url(#wg)"/><polyline points="${pts}" fill="none" stroke="#d4af6a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${w.map((x, i) => `<circle cx="${px(i)}" cy="${py(x.kg)}" r="3" fill="#0b0c0f" stroke="#f0d394" stroke-width="1.5"/>`).join('')}</svg>
        <div class="wmeta"><span>${fmt(ys[0])} → <b>${fmt(ys[ys.length - 1])} kg</b></span><span class="${delta <= 0 ? 'good' : 'bad'}">${delta > 0 ? '+' : ''}${fmt(delta)} kg</span></div>`;
    } else if (w.length === 1) chart = `<p><b class="disp big">${fmt(w[0].kg)} kg</b> <span class="muted small">on ${Q.niceDate(w[0].d)}</span></p>`;
    return `<section class="card"><div class="card-h"><div><div class="kicker">Body weight</div><b>Trend</b></div><button class="btn ghost xs" data-act="weight">${ic('plus')} Log</button></div>${chart}</section>`;
  }

  function viewFuel() {
    const S = Q.S, d = Q.ui.fuelDate, t = Q.today(), T0 = Q.targets(), mp = Q.mealPlan(d), log = Q.mealLog(d), plan = Q.planDay(d);
    const eaten = mp.meals.filter(m => !m.empty && log[m.slot] === 'done').reduce((a, m) => ({ k: a.k + m.k, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }), { k: 0, p: 0, c: 0, f: 0 });
    const off = !!S.nutri.off[d];
    const C = 2 * Math.PI * 44, kp = Math.min(1, eaten.k / T0.kcal);
    const times = {}; plan.items.filter(x => x.kind === 'meal').forEach(x => { times[x.meal.slot] = x; });
    const meals = mp.meals.map(m => {
      if (m.empty) return `<section class="card meal-card"><b>${esc(m.label)}</b><p class="muted small">No meals match your food exclusions for this slot. Edit exclusions in your nutrition profile.</p></section>`;
      const st = log[m.slot], open = Q.ui.mealOpen === d + m.slot, tm = times[m.slot];
      return `<section class="card meal-card ${st || ''} ${open ? 'open' : ''}">
        <button class="mc-h" data-act="meal-toggle" data-k="${d + m.slot}">
          <div class="mc-time">${tm ? T(tm.s) : ''}<small>${esc(m.label)}</small></div>
          <div class="ico" style="--sc:#d6bb63">${ic(m.tpl.icon)}</div>
          <div class="meta"><div class="name">${esc(m.tpl.name)}</div><div class="sub"><span>${m.k} kcal</span><span>P ${m.p}</span><span>C ${m.c}</span><span>F ${m.f}</span>${tm && tm.atWork ? '<span>at work</span>' : ''}</div></div>
          <div class="chk">${st === 'done' ? ic('check') : st === 'off' ? ic('x') : ic('chevron-down')}</div>
        </button>
        ${open ? `<div class="mc-body">
          <table class="ingr">${m.items.filter(i => !Q.FOODS[i.f].free).map(i => `<tr><td>${esc(Q.FOODS[i.f].n)}</td><td>${esc(Q.amountLabel(i))}</td></tr>`).join('')}<tr class="free"><td colspan="2">+ garlic, lemon, herbs and spices as you like (no calories to count)</td></tr></table>
          <div class="kicker">Method · ${m.tpl.mins} min</div><ol class="steps-ol">${m.tpl.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
          <div class="actions sm">
            <button class="btn ghost" data-act="meal-swap" data-slot="${m.slot}" data-d="${d}">${ic('shuffle')} Swap</button>
            <button class="btn ghost" data-act="meal-off" data-slot="${m.slot}" data-d="${d}">${st === 'off' ? 'Undo' : 'Off-plan'}</button>
            <button class="btn primary" data-act="meal-done" data-slot="${m.slot}" data-d="${d}">${st === 'done' ? 'Undo' : `${ic('check')} Eaten`}</button>
          </div></div>` : ''}
      </section>`;
    }).join('');
    return `<h1 class="pt">Fuel</h1>
      <div class="datenav"><button class="iconbtn" data-act="fuel-prev" aria-label="Previous day">${ic('chevron-left')}</button><button class="dlabel" data-act="fuel-today">${Q.dateLabel(d)}</button><button class="iconbtn" data-act="fuel-next" aria-label="Next day">${ic('chevron-right')}</button></div>
      <section class="card targets">
        <div class="tg-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="rg-t"/><circle cx="50" cy="50" r="44" class="rg-p" stroke-dasharray="${(C * kp).toFixed(1)} ${C.toFixed(1)}"/></svg>
          <div class="tg-c"><b class="disp">${fmt(T0.kcal - eaten.k)}</b><small>kcal left</small></div></div>
        <div class="tg-r">
          <div class="mac"><span>Protein</span><b>${eaten.p}<small>/${T0.p} g</small></b></div>${bar(pct(eaten.p, T0.p), '#e8765f', 'thin')}
          <div class="mac"><span>Carbs</span><b>${eaten.c}<small>/${T0.c} g</small></b></div>${bar(pct(eaten.c, T0.c), '#5aa9e6', 'thin')}
          <div class="mac"><span>Fat</span><b>${eaten.f}<small>/${T0.f} g</small></b></div>${bar(pct(eaten.f, T0.f), '#d6bb63', 'thin')}
        </div>
        <div class="tg-foot"><span>${ic('target')} ${fmt(T0.kcal)} kcal/day</span><span>${ic('trending-down')} ${S.nutri.goal === 'lose' ? `≈${fmt(T0.weekly)} kg/week` : S.nutri.goal === 'gain' ? 'Lean gain' : 'Maintain'}</span><span>${ic('glass-water')} ${T0.water} L water</span></div>
      </section>
      <div class="switchrow card slim"><div><b>Off-plan day</b><p class="hint">Birthday, wedding, travel. Logs the day without breaking your meal quest.</p></div><label class="sw"><input type="checkbox" data-set="offday" ${off ? 'checked' : ''}><i></i></label></div>
      <div class="sec"><span>Meals</span><span>${Q.mealsDone(d)}/${mp.meals.filter(m => !m.empty).length} eaten · plan ${mp.tot.k} kcal · ${mp.tot.p} g protein</span></div>
      ${meals}
      <div class="tools2">
        <button class="tile" data-act="grocery">${ic('shopping-cart')}<b>Grocery list</b><span>Next 7 days, exact amounts</span></button>
        <button class="tile" data-act="nutri-edit">${ic('sliders-horizontal')}<b>Nutrition profile</b><span>${fmt(T0.kg)} kg · ${S.nutri.meals} meals · ${S.nutri.exclude.length} exclusions</span></button>
      </div>
      ${weightBlock()}
      <div class="sec"><span>Nutrition guide</span><span>${Q.GUIDE.length} chapters</span></div>
      <div class="guide">${Q.GUIDE.map(x => `<button class="gd" data-act="guide" data-id="${x.id}">${ic(x.icon)}<span>${esc(x.t)}</span>${ic('chevron-right', 'chev')}</button>`).join('')}</div>`;
  }

  // ---------- QUESTS ----------
  function dueTag(due) {
    if (!due) return '';
    const n = Q.diffDays(due, Q.today());
    if (n < 0) return `<span class="tag bad">Overdue ${-n}d</span>`;
    if (n === 0) return '<span class="tag warn">Today</span>';
    if (n === 1) return '<span class="tag">Tomorrow</span>';
    return `<span class="tag">${Q.niceDate(due, { day: 'numeric', month: 'short' })}</span>`;
  }
  function sideRow(s) {
    const st = Q.STATS[s.stat], df = Q.DIFF[s.diff];
    const steps = s.steps.length ? `<span>${s.steps.filter(x => x.done).length}/${s.steps.length} steps</span>` : '';
    return `<div class="row ${s.done ? 'done' : ''}" data-act="side-open" data-id="${s.id}"><div class="ico" style="--sc:${st.color}">${ic(s.icon)}</div>
      <div class="meta"><div class="name">${esc(s.name)}</div><div class="sub"><span style="color:${st.color}">${st.short}</span><span>${df.name}</span><span>+${df.side} XP</span>${steps}</div></div>
      ${s.done ? `<div class="chk">${ic('check')}</div>` : dueTag(s.due)}</div>`;
  }
  function sideView() {
    const S = Q.S, tab = Q.ui.sideTab;
    const open = S.side.filter(s => !s.done).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
    const done = S.side.filter(s => s.done).sort((a, b) => (b.doneOn || '').localeCompare(a.doneOn || ''));
    const have = new Set(open.map(s => s.name));
    const ideas = Q.SIDE_TEMPLATES.filter(x => !have.has(x.name));
    return `<p class="muted pt-sub">Optional missions with big XP. No streak pressure.</p>
      <div class="seg" data-seg="sidetab"><button data-v="active" class="${tab === 'active' ? 'on' : ''}">Active · ${open.length}</button><button data-v="done" class="${tab === 'done' ? 'on' : ''}">Completed · ${done.length}</button></div>
      ${(tab === 'active' ? open : done).map(sideRow).join('') || `<p class="empty">${tab === 'active' ? 'No active side quests. Accept one from the board below.' : 'Nothing completed yet.'}</p>`}
      <div class="actions"><button class="btn primary wide" data-act="side-add">${ic('plus')} Create side quest</button></div>
      <div class="sec"><span>Quest board</span><span>tap to accept</span></div>
      <div class="ideas">${ideas.map(x => `<button class="idea" data-act="side-tpl" data-i="${Q.SIDE_TEMPLATES.indexOf(x)}">${ic(x.icon)}<span>${esc(x.name)}</span><small>+${Q.DIFF[x.diff].side}</small></button>`).join('')}</div>`;
  }
  function hustleView() {
    const S = Q.S, mk = Q.today().slice(0, 7);
    let all = 0, month = 0;
    S.hustles.forEach(h => { all += sum(h.entries); month += sum(h.entries.filter(e => (e.d || '').startsWith(mk))); });
    const have = new Set(S.hustles.map(h => h.name));
    return `<p class="muted pt-sub">Income projects run like quests. Every entry and step powers your Wealth stat.</p>
      <div class="stats3"><div><b>${money(month)}</b><span>This month</span></div><div><b>${money(all)}</b><span>All time</span></div><div><b>${S.hustles.length}</b><span>Hustles</span></div></div>
      ${S.hustles.map(h => { const e = sum(h.entries), gl = h.goal || 0, td = h.tasks.filter(x => x.done).length; return `<div class="card hcard" data-act="hustle-open" data-id="${h.id}"><div class="hrow"><div class="ico" style="--sc:#d6bb63">${ic(h.icon)}</div><div class="meta"><div class="name">${esc(h.name)}</div><div class="sub">${h.tasks.length ? `<span>${td}/${h.tasks.length} steps</span>` : ''}<span>${money(e)}${gl ? ` of ${money(gl)}` : ''}</span></div></div><button class="plus gold" data-act="income-add" data-id="${h.id}">${ic('plus')}</button></div>${gl ? bar(pct(e, gl), '#d6bb63', 'thin') : ''}</div>`; }).join('') || '<p class="empty">No hustles yet. Start one and give it a goal.</p>'}
      <div class="actions"><button class="btn primary wide" data-act="hustle-new">${ic('plus')} Start a hustle</button></div>
      <div class="sec"><span>Ideas</span><span>tap to start</span></div>
      <div class="ideas">${Q.HUSTLE_IDEAS.map((h, i) => have.has(h.name) ? '' : `<button class="idea" data-act="hustle-idea" data-i="${i}">${ic(h.icon)}<span>${esc(h.name)}</span>${h.tasks.length ? `<small>${h.tasks.length} steps</small>` : ''}</button>`).join('')}</div>`;
  }
  function viewQuests() {
    const t = Q.ui.qtab;
    return `<h1 class="pt">Quests</h1>
      <div class="seg big" data-seg="qtab"><button data-v="side" class="${t === 'side' ? 'on' : ''}">Side quests</button><button data-v="hustle" class="${t === 'hustle' ? 'on' : ''}">Side hustles</button></div>
      ${t === 'side' ? sideView() : hustleView()}`;
  }

  // ---------- YOU ----------
  function radar(g) {
    const keys = Q.STAT_ORDER, max = Math.max(60, ...keys.map(k => g.score[k])) * 1.1;
    const cx = 150, cy = 150, R = 96;
    const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / keys.length; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    const ring = f => `<polygon class="rg" points="${keys.map((_, i) => pt(i, R * f).map(n => n.toFixed(1)).join(',')).join(' ')}"/>`;
    const axes = keys.map((_, i) => { const [x, y] = pt(i, R); return `<line class="ax" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join('');
    const poly = keys.map((k, i) => pt(i, R * g.score[k] / max).map(n => n.toFixed(1)).join(',')).join(' ');
    const dots = keys.map((k, i) => { const [x, y] = pt(i, R * g.score[k] / max); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${statC(k)}"/>`; }).join('');
    const labels = keys.map((k, i) => { const [x, y] = pt(i, R + 26); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="rl" text-anchor="middle" dominant-baseline="middle"><tspan class="rl-n">${Q.STATS[k].short}</tspan> ${g.score[k]}</text>`; }).join('');
    return `<svg class="radar" viewBox="0 0 300 300" role="img" aria-label="Attribute radar"><defs><radialGradient id="rgd"><stop offset="0" stop-color="rgba(240,211,148,.45)"/><stop offset="1" stop-color="rgba(212,175,106,.12)"/></radialGradient></defs>${[.25, .5, .75, 1].map(ring).join('')}${axes}<polygon class="rp" points="${poly}" fill="url(#rgd)"/>${dots}${labels}</svg>`;
  }
  function viewYou() {
    const sub = Q.ui.sub;
    if (sub === 'focus') return viewFocus();
    if (sub === 'breathe') return viewBreathe();
    if (sub === 'journal') return viewJournal();
    if (sub === 'shop') return viewShop();
    if (sub === 'settings') return viewSettings();
    if (sub === 'help') return viewHelp();
    const S = Q.S, g = Q.game(), t = Q.today();
    const stats = Q.STAT_ORDER.map(k => { const s = Q.STATS[k], lvl = g.statLvl[k], b = 10 * (lvl - 1) * (lvl - 1), n = 10 * lvl * lvl; return `<div class="stat"><span class="si" style="color:${s.color}">${ic(s.icon)}</span><div class="sm"><div class="sn"><span>${s.name}</span><b>${g.score[k]}</b></div>${bar(pct(g.statXp[k] - b, n - b), s.color, 'thin')}</div></div>`; }).join('');
    const unlocked = Q.ACH.filter(a => S.hero.seen.includes(a.id) || g.ach.includes(a.id));
    const ach = Q.ACH.map(a => { const on = unlocked.includes(a); return `<button class="ach ${on ? 'on' : ''}" data-act="ach" data-id="${a.id}"><span>${ic(on ? a.icon : 'lock')}</span><small>${esc(a.name)}</small></button>`; }).join('');
    const inv = {};
    g.loot.forEach(l => { if (l.date.startsWith('w') || S.chests[l.date]) { inv[l.name] = inv[l.name] || { ...l, n: 0 }; inv[l.name].n++; } });
    const items = Object.values(inv).sort((a, b) => Q.RARITY_ORDER.indexOf(a.rarity) - Q.RARITY_ORDER.indexOf(b.rarity));
    const unopened = g.dailyLoot.filter(l => !S.chests[l.date]);
    const next = Q.RANKS[g.rank.i + 1];
    const tile = (k, icn, title, s2) => `<button class="tile" data-act="sub" data-m="${k}">${ic(icn)}<b>${title}</b><span>${s2}</span></button>`;
    return `<section class="profile">
        <div class="pf-stage"><div class="halo" style="--rc:${g.rank.color}"></div>${Q.emblem(g, 132, 'big')}</div>
        <h1>${esc(S.hero.name)}</h1>
        <div class="pf-rank" style="color:${g.rank.color}">${g.rank.name} · Rank ${g.rank.r}</div>
        <div class="pf-nums"><div><b class="disp">${g.level}</b><span>Level</span></div><div><b class="disp">${g.power}</b><span>Power</span></div><div><b class="disp">${fmt(g.xp)}</b><span>Total XP</span></div></div>
        ${bar(pct(g.xp - g.lvlStart, g.lvlNext - g.lvlStart), 'linear-gradient(90deg,#b8893f,#f0d394)', 'xp wide')}
        <p class="muted small">${g.lvlNext - g.xp} XP to level ${g.level + 1}${next ? ` · ${next.name} at level ${next.from}` : ''}</p>
      </section>
      <div class="stats3"><div><b>${g.cur}</b><span>Streak</span></div><div><b>${g.best}</b><span>Best streak</span></div><div><b>${g.defeated}</b><span>Days won</span></div></div>
      <div class="tiles">
        ${tile('focus', 'timer', 'Focus timer', '+15 XP a session')}
        ${tile('breathe', 'wind', 'Breathe', S.breath[t] ? 'Done today' : '+5 XP · 1 min')}
        ${tile('journal', 'notebook-pen', 'Journal', S.journal[t] ? 'Written today' : '+10 XP')}
        ${tile('shop', 'gift', 'Reward shop', `${g.coins} coins`)}
      </div>
      <section class="card"><div class="card-h"><div><div class="kicker">Attributes</div><b>Power ${g.power}</b></div></div>${radar(g)}<div class="statlist">${stats}</div></section>
      <div class="sec"><span>Achievements</span><span>${unlocked.length}/${Q.ACH.length}</span></div>
      <div class="achgrid">${ach}</div>
      <div class="sec"><span>Artifacts</span><span>${items.reduce((a, i) => a + i.n, 0)} collected</span></div>
      ${unopened.length ? `<button class="card note gold cta" data-act="chest" data-d="${unopened[0].date}">${ic('gift')}<div><b>${unopened.length} reward drop${unopened.length > 1 ? 's' : ''} waiting</b><p>Tap to open the oldest.</p></div>${ic('chevron-right', 'chev')}</button>` : ''}
      <div class="lootgrid">${items.map(i => `<div class="art r-${i.rarity}" title="${esc(i.name)}"><span>${ic(i.icon)}</span>${i.n > 1 ? `<em>×${i.n}</em>` : ''}<small>${esc(i.name)}</small></div>`).join('') || '<p class="empty">Win days and open reward drops to collect artifacts.</p>'}</div>
      <section class="card why"><div class="kicker">Your why</div><p>${esc(S.hero.why || 'Write down why you started.')}</p><button class="btn ghost xs" data-act="why-edit">${ic('pencil')} Edit</button></section>
      <div class="list">
        <button class="li" data-act="sub" data-m="settings">${ic('settings')}<span>Settings</span>${ic('chevron-right', 'chev')}</button>
        <button class="li" data-act="sched-edit">${ic('calendar-days')}<span>Weekly schedule</span>${ic('chevron-right', 'chev')}</button>
        <button class="li" data-act="nutri-edit">${ic('utensils')}<span>Nutrition profile</span>${ic('chevron-right', 'chev')}</button>
        <button class="li" data-act="hero-edit">${ic('user-round')}<span>Edit name</span>${ic('chevron-right', 'chev')}</button>
        <button class="li" data-act="sub" data-m="help">${ic('info')}<span>How it works</span>${ic('chevron-right', 'chev')}</button>
      </div>`;
  }
  const backBtn = () => `<button class="backbtn" data-act="sub" data-m="">${ic('chevron-left')} Profile</button>`;
  function viewFocus() {
    const S = Q.S, t = S.timer, g = Q.game(), today = Q.today(), C = 2 * Math.PI * 54;
    const body = t
      ? `<div class="timer"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="tr-bg"/><circle id="tring" cx="60" cy="60" r="54" class="tr" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${C.toFixed(1)}"/></svg><div id="tcount" class="tcount disp">--:--</div></div>
        <p class="muted c">One task. Phone face down. The timer keeps running if the screen turns off.</p><button class="btn ghost wide" data-act="focus-cancel">End session early</button>`
      : `<div class="timer idle"><div class="tcount"><span class="disp">${Q.ui.focusMins}</span><small>min</small></div></div>
        <div class="seg" data-seg="mins">${[15, 25, 45, 60, 90].map(m => `<button data-v="${m}" class="${Q.ui.focusMins === m ? 'on' : ''}">${m}</button>`).join('')}</div>
        <button class="btn primary wide big" data-act="focus-start">Start focus session</button>`;
    return `${backBtn()}<h1 class="pt">Focus</h1>${body}<div class="stats3"><div><b>${S.focus[today] || 0}</b><span>Today</span></div><div><b>${g.ctx.focus}</b><span>All time</span></div><div><b>${g.ctx.focus * 15}</b><span>XP earned</span></div></div>`;
  }
  function viewBreathe() {
    const done = Q.S.breath[Q.today()];
    return `${backBtn()}<h1 class="pt">Breathe</h1><p class="muted pt-sub">Box breathing: in 4, hold 4, out 4, hold 4. Four rounds, about a minute. Calms the nervous system before work, training or sleep.</p>
      <div class="breath" id="breath"><div class="b-orb"></div><div class="blabel disp" id="blabel">${Q.ui.breathing ? '' : 'Ready'}</div></div>
      ${Q.ui.breathing ? '<button class="btn ghost wide" data-act="breath-stop">Stop</button>' : `<button class="btn primary wide big" data-act="breath-start">${done ? 'Breathe again' : 'Start · +5 XP'}</button>`}`;
  }
  function viewJournal() {
    const S = Q.S, t = Q.today();
    const prompts = ['What was today\'s win?', 'What drained you today, and what will you change?', 'What will you do better tomorrow?', 'What are you grateful for today?'];
    const pr = prompts[Q.hash(t) % prompts.length];
    const past = Object.keys(S.journal).filter(k => k !== t && (S.journal[k] || '').trim()).sort().reverse().slice(0, 20);
    return `${backBtn()}<h1 class="pt">Journal</h1><p class="muted pt-sub">${esc(pr)} · 10+ characters for +10 XP.</p>
      <textarea id="jtext" rows="7" placeholder="${esc(pr)}">${esc(S.journal[t] || '')}</textarea>
      <button class="btn primary wide" data-act="journal-save">Save entry</button>
      ${past.length ? '<div class="sec"><span>Past entries</span></div>' : ''}${past.map(k => `<section class="card jentry"><div class="kicker">${Q.niceDate(k, { weekday: 'long', day: 'numeric', month: 'long' })}</div><p>${esc(S.journal[k])}</p></section>`).join('')}`;
  }
  function viewShop() {
    const S = Q.S, g = Q.game();
    const rows = S.rewards.map(r => `<div class="row"><div class="ico" style="--sc:#d4af6a">${ic(r.icon)}</div><div class="meta"><div class="name">${esc(r.name)}</div><div class="sub"><span>${r.cost} coins</span></div></div>
      <button class="btn primary xs" data-act="buy" data-id="${r.id}" ${g.coins < r.cost ? 'disabled' : ''}>Redeem</button><button class="iconbtn sm" data-act="reward-edit" data-id="${r.id}" aria-label="Edit">${ic('pencil')}</button></div>`).join('') || '<p class="empty">Add something you actually want.</p>';
    const hist = S.purchases.slice(-8).reverse().map(p => `<div class="hist"><span>${esc(p.name)}</span><small>${Q.niceDate(p.d, { day: 'numeric', month: 'short' })} · ${p.cost}</small></div>`).join('');
    return `${backBtn()}<h1 class="pt">Reward shop</h1><section class="card coinbox">${ic('coins')}<div><b class="disp">${g.coins}</b><span>coins · you earn 1 per 4 XP</span></div></section>${rows}
      <div class="actions"><button class="btn primary wide" data-act="reward-add">${ic('plus')} Add a reward</button></div>${hist ? `<div class="sec"><span>Recently redeemed</span></div><section class="card">${hist}</section>` : ''}`;
  }
  function viewSettings() {
    const s = Q.S.settings, mk = Q.S.hero.mode;
    return `${backBtn()}<h1 class="pt">Settings</h1>
      <section class="card"><b>Difficulty</b><div class="seg" data-seg="mode">${Object.entries(Q.MODES).map(([k, m]) => `<button data-v="${k}" class="${mk === k ? 'on' : ''}">${m.name}</button>`).join('')}</div><p class="hint">${esc(Q.MODES[mk].desc)}</p>
        <div class="field"><label>Opponent threshold <b id="thv">${s.threshold}%</b></label><input type="range" min="50" max="100" step="5" value="${s.threshold}" data-set="threshold" id="thr"><p class="hint">Share of the day's quest XP needed to win the day.</p></div></section>
      <section class="card">
        <div class="switchrow"><div><b>Smart reminders</b><p class="hint">${Q.isNative() ? 'Built from your day plan. Fully offline.' : 'Reminders fire in the Android app, not in a browser.'}</p></div><label class="sw"><input type="checkbox" data-set="remindersOn" ${s.remindersOn ? 'checked' : ''}><i></i></label></div>
        <div class="switchrow"><div><b>Quest reminders</b><p class="hint">At each quest's scheduled time; skipped once done.</p></div><label class="sw"><input type="checkbox" data-set="autoRemind" ${s.autoRemind ? 'checked' : ''}><i></i></label></div>
        <div class="switchrow"><div><b>Meal reminders</b><p class="hint">What to eat and how much, at meal time.</p></div><label class="sw"><input type="checkbox" data-set="mealRemind" ${s.mealRemind ? 'checked' : ''}><i></i></label></div>
        <div class="switchrow"><div><b>Lights-out countdown</b><p class="hint">30 minutes before your planned sleep.</p></div><label class="sw"><input type="checkbox" data-set="bedRemind" ${s.bedRemind ? 'checked' : ''}><i></i></label></div>
        <div class="field"><label>Evening check (only if the day isn't won)</label><input type="time" data-set="evening" value="${esc(s.evening)}"></div></section>
      <section class="card">
        <div class="switchrow"><div><b>Sound effects</b></div><label class="sw"><input type="checkbox" data-set="sound" ${s.sound ? 'checked' : ''}><i></i></label></div>
        <div class="switchrow"><div><b>Haptics</b></div><label class="sw"><input type="checkbox" data-set="haptics" ${s.haptics ? 'checked' : ''}><i></i></label></div>
        <div class="field"><label>Currency symbol</label><input data-set="currency" maxlength="4" value="${esc(s.currency)}"></div></section>
      ${Q.S.program.start && Q.S.program.start <= Q.today() ? `<section class="card"><b>Start date</b><p class="hint">Day 1 is ${Q.niceDate(Q.S.program.start)}.</p><button class="btn ghost wide" data-act="start-tomorrow">${ic('calendar')} Restart from tomorrow</button></section>` : ''}
      <section class="card"><b>Backup</b><p class="hint">Everything lives on this phone. Export now and then, and before switching phones.</p><div class="actions"><button class="btn ghost" data-act="export">${ic('download')} Export</button><button class="btn ghost" data-act="import">${ic('upload')} Import</button></div></section>
      <section class="card danger-card"><b>Start over</b><p class="hint">Retake the setup and build a new program. Wipes all progress on this phone.</p><button class="btn danger wide" data-act="reset">Reset everything</button></section>
      <p class="muted c small">Questline · fully offline · your data never leaves this phone</p>`;
  }
  function viewHelp() {
    const m = Q.mode();
    const p = (icn, t, b) => `<div class="hp-row">${ic(icn)}<div><b>${t}</b><p>${b}</p></div></div>`;
    return `${backBtn()}<h1 class="pt">How it works</h1><section class="card help">
      ${p('calendar-days', 'Your plan', 'Quests and meals are scheduled into the free time between your commitments. Change your week in Plan → Edit and everything re-plans.')}
      ${p('swords', 'Daily opponent', `Its resistance is ${m.threshold}% of the day's quest XP. Finish enough quests and you win the day, extend your streak and get a reward drop.`)}
      ${p('hourglass', 'Packed days', 'Quests with no free slot become optional for that day. They never count against you, and still earn XP if you fit them in.')}
      ${p('circle-dashed', 'Mini versions', 'Hold a quest and do its 2-minute version for half XP. Showing up beats perfection.')}
      ${p('shield-check', 'Shields', `Every 7 wins in a row earns a shield (max ${m.shields}). A shield saves your streak on a missed day.`)}
      ${p('refresh-cw', 'Comebacks', 'After a miss, win the next day for +40 XP. Never miss twice.')}
      ${p('battery-low', 'Low energy', 'Check in with energy 1–2 and today\'s opponent is 15% weaker.')}
      ${p('trending-up', 'Adaptive quests', 'Each new phase levels up quests you hit 60%+ of the time. During the week the app offers to raise a quest you crush, or ease one that keeps beating you.')}
      ${p('castle', 'Weekly gauntlet', `Win ${m.weekKills} days in a program week for +100 XP and an epic artifact.`)}
      ${p('utensils', 'Fuel', 'Calorie and protein targets come from your body stats and goal, and update as you log weight. Each day has an exact meal plan; ticking meals completes your meal quest.')}
      ${p('coins', 'XP & coins', 'Quests 10/20/30 · streak bonus up to +50 · flawless +25% · bonus quest +25 · side quests 30/60/100 · income +20 · focus +15 · journal +10 · breathe +5 · check-in +5. 1 coin per 4 XP.')}
      ${p('award', 'Ranks', Q.RANKS.map(r => `${r.name} (lv ${r.from})`).join(' · '))}
    </section>`;
  }

  Q.render = function () {
    const v = Q.$('#view'), t = Q.ui.tab;
    v.innerHTML = t === 'today' ? viewToday() : t === 'plan' ? viewPlan() : t === 'fuel' ? viewFuel() : t === 'quests' ? viewQuests() : viewYou();
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    if (Q.afterRender) Q.afterRender();
  };
})(window.Q);
