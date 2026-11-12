(function (E) {
  'use strict';
  const { esc, ic } = E;
  const S = () => E.S;
  const kpi = (l, v, em, cls) => `<div class="kpi"><small>${l}</small><b>${v}</b>${em ? `<em class="${cls || 'muted'}">${em}</em>` : ''}</div>`;
  const hbar = (name, p, c, right, attrs) => `<${attrs ? 'button' : 'div'} class="hbar" ${attrs || ''}><span class="nm">${esc(name)}</span>${E.bar(E.clamp(p * 100, 0, 100), c)}<span class="pc">${right}</span></${attrs ? 'button' : 'div'}>`;
  const hm = m => m ? `${Math.floor(m / 60)}h ${E.pad(Math.round(m % 60))}m` : '—';

  function coachView() {
    const list = E.coach();
    return `<p class="hint" style="margin-top:0">Read from your last 7 days. The most important thing is first.</p>` +
      list.map((c, i) => `<section class="card" style="${i === 0 ? `background:linear-gradient(150deg, color-mix(in srgb, ${c.c} 14%, var(--card)), var(--card) 70%)` : ''}"><div class="row" style="align-items:flex-start"><div class="ico" style="--c:${c.c}">${ic(c.icon)}</div><div class="grow"><div class="card-t">${esc(c.title)}</div><div class="small muted" style="margin-top:4px;line-height:1.45">${esc(c.body)}</div>
        ${c.a ? `<button class="btn sm" style="margin-top:12px" data-a="${c.a}" ${c.attrs}>${esc(c.al)} ${ic('chevron-right')}</button>` : ''}</div></div></section>`).join('');
  }

  function report(n) {
    const t = E.today(), days = E.range(n), prev = (() => { const out = []; for (let i = 2 * n - 1; i >= n; i--) { const d = E.add(t, -i); if (d >= S().profile.start) out.push(d); } return out; })();
    const em = E.ember(), set = new Set(days);
    if (!days.length) return `<p class="empty">${ic('chart-column')}Reports start on Day 1.</p>`;
    const scores = days.map(d => E.dayScore(d)), cons = E.avg(scores.filter(s => s.due).map(s => s.p)), kept = days.filter(d => em.days[d] === 'kept').length;
    const pc = prev.length ? E.avg(prev.map(d => E.dayScore(d)).filter(s => s.due).map(s => s.p)) : null;
    // habits
    const hr = S().habits.filter(h => !h.off).map(h => ({ h, r: E.habitRate(h, days) })).filter(x => x.r.due).sort((a, b) => b.r.p - a.r.p);
    // body
    const W = S().weights.slice().sort((a, b) => a.d.localeCompare(b.d)), wIn = W.filter(w => set.has(w.d)), wBefore = W.filter(w => w.d < days[0]).pop() || wIn[0], wNow = W[W.length - 1];
    const wCh = wNow && wBefore ? wNow.kg - wBefore.kg : null;
    const fd = days.map(d => E.dayFood(d)).filter(f => f.k > 0), T = E.targets();
    const steps = days.map(d => S().health.steps[d] || +E.log(d, 'steps') || 0).filter(Boolean), sleep = days.map(d => S().health.sleep[d]).filter(Boolean);
    const wo = S().train.logs.filter(l => set.has(l.d)).length, mob = S().mob.logs.filter(l => set.has(l.d)).length;
    // money
    const tx = S().money.tx.filter(x => x.type === 'exp' && set.has(x.date)), spent = E.spentIn(days), pSpent = prev.length ? E.spentIn(prev) : null;
    const byCat = {}; for (const x of tx) byCat[x.cat] = (byCat[x.cat] || 0) + E.conv(x.amt, x.cur);
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const inc = S().money.tx.filter(x => x.type === 'inc' && set.has(x.date)).reduce((a, x) => a + E.conv(x.amt, x.cur), 0);
    // mind
    const fo = (S().focus || []).filter(f => set.has(f.d)), fTot = fo.reduce((a, f) => a + f.mins, 0), byA = {}; for (const f of fo) byA[f.area] = (byA[f.area] || 0) + f.mins;
    const pages = days.reduce((a, d) => a + (+E.log(d, 'read') || 0), 0), known = Object.values(S().de.srs).filter(v => v.b >= 3).length;
    const lessons = S().de.lessons.filter(d => set.has(d)).length, moods = days.map(d => S().mood[d]).filter(Boolean), jr = days.filter(d => S().journal[d]).length;
    const tasksDone = S().tasks.filter(k => k.done && k.doneAt && set.has(k.doneAt)).length;
    const cells = n > 7 ? (() => { const first = E.add(days[0], -((E.dow(days[0]) + 6) % 7)); let s = ''; for (let d = first; d <= t; d = E.add(d, 1)) { if (d < days[0]) { s += '<i data-l="x"></i>'; continue; } const sc = E.dayScore(d); s += `<i data-l="${!sc.due ? 0 : sc.p >= 0.9 ? 3 : sc.p >= E.KEEP ? 2 : sc.p > 0 ? 1 : 0}"></i>`; } return s; })() : '';
    const daily = days.map(d => E.dayScore(d).p);
    return `<div class="grid3">${kpi('Consistency', Math.round(cons * 100) + '%', pc != null ? `${cons >= pc ? '▲' : '▼'} ${Math.abs(Math.round((cons - pc) * 100))} pts` : '', pc != null ? (cons >= pc ? 'good' : 'bad') : '')}${kpi('Fire kept', `${kept}/${days.length}`, 'days')}${kpi('Best streak', em.best, 'days')}</div>
      <section class="card" style="margin-top:12px"><div class="label" style="margin-bottom:10px">Each day</div>${days.length <= 14 ? `<div class="cols" style="height:90px">${daily.map((p, i) => `<div><i class="${p >= E.KEEP ? '' : 'low'}" style="height:${Math.max(4, p * 100)}%"></i><span>${days.length <= 7 ? E.fmtDate(days[i], { weekday: 'narrow' }) : E.parse(days[i]).getDate()}</span></div>`).join('')}</div>` : `<div class="heat">${cells}</div>`}</section>
      ${E.secH('Habits')}<section class="card" style="padding:10px 16px">${hr.map(x => hbar(x.h.name, x.r.p, x.r.p >= 0.8 ? 'var(--sage)' : x.r.p >= 0.5 ? 'var(--ember)' : 'var(--rose)', Math.round(x.r.p * 100) + '%', `data-a="h-menu" data-id="${x.h.id}"`)).join('') || '<p class="empty">No habits were due.</p>'}</section>
      ${E.secH('Body')}<div class="grid3">${kpi('Weight', wNow ? E.n(wNow.kg, 1) : '—', wCh != null && wCh !== 0 ? `${wCh < 0 ? '▼' : '▲'} ${E.n(Math.abs(wCh), 1)} kg` : 'kg', wCh < 0 ? 'good' : wCh > 0 ? 'bad' : '')}${kpi('Avg kcal', fd.length ? E.n(E.avg(fd.map(f => f.k))) : '—', `of ${E.n(T.kcal)}`)}${kpi('Protein', fd.length ? Math.round(E.avg(fd.map(f => f.p))) + ' g' : '—', `of ${T.p} g`)}</div>
      <div class="grid3" style="margin-top:10px">${kpi('Workouts', wo, `${mob} mobility`)}${kpi('Avg steps', steps.length ? E.n(E.avg(steps)) : '—', 'a day')}${kpi('Avg sleep', hm(E.avg(sleep)), sleep.length ? 'a night' : 'connect health')}</div>
      ${W.length >= 2 ? `<section class="card" style="margin-top:12px"><div class="label" style="margin-bottom:8px">Weight</div>${E.spark(W.slice(-40).map(w => w.kg))}</section>` : ''}
      ${E.secH('Money')}<div class="grid3">${kpi('Spent', E.money(spent), pSpent ? `${spent <= pSpent ? '▼' : '▲'} ${Math.round(Math.abs(spent / pSpent - 1) * 100)}%` : '', spent <= pSpent ? 'good' : 'bad')}${kpi('Per day', E.money(spent / days.length))}${kpi('Income', E.money(inc))}</div>
      ${cats.length ? `<section class="card" style="margin-top:12px;padding:10px 16px">${cats.map(([id, v]) => hbar(E.cat(id).n, v / cats[0][1], E.cat(id).c, E.money(v)).replace('class="pc"', 'class="pc" style="width:auto;min-width:64px"')).join('')}</section>` : ''}
      ${E.secH('Mind & work')}<div class="grid3">${kpi('Focus', fTot >= 60 ? `${E.n(fTot / 60, 1)} h` : `${fTot} min`, `${fo.length} sessions`)}${kpi('Tasks done', tasksDone)}${kpi('German', known, 'words known')}</div>
      <div class="grid3" style="margin-top:10px">${kpi('Lessons', lessons, 'finished')}${kpi('Pages read', pages)}${kpi('Mood', moods.length ? E.n(E.avg(moods), 1) + '/5' : '—', `${jr} journal pages`)}</div>
      ${Object.keys(byA).length ? `<section class="card" style="margin-top:12px;padding:10px 16px">${Object.entries(byA).sort((a, b) => b[1] - a[1]).map(([a, m]) => hbar(E.focusName(a), m / Math.max(...Object.values(byA)), 'var(--plum)', `${m}m`)).join('')}</section>` : ''}`;
  }

  E.screens.insights = () => {
    const sub = E.subOf('insights', 'coach');
    return E.hdr('Insights', 'Your coach and your numbers') + E.seg('insights', [['coach', 'Coach'], ['week', 'Week'], ['month', 'Month'], ['all', '90 days']], sub) + '<div class="spacer"></div>' +
      (sub === 'coach' ? coachView() : report(sub === 'week' ? 7 : sub === 'month' ? 30 : 90));
  };

  // ================= hub: everything in one place =================
  E.screens.hub = () => {
    const t = E.today(), open = S().tasks.filter(k => !k.done).length, q = Object.values(S().de.srs).filter(v => v.due <= t).length, T = E.targets(), f = E.dayFood(t);
    const up = S().events.map(e => E.nextOcc(e.date, e.repeat, t)).filter(Boolean).sort()[0];
    const tile = (a, icon, cls, title, sub, attrs) => `<div class="bt c ${cls}" data-a="${a}" role="button" tabindex="0" ${attrs || ''}><small class="bl">${ic(icon)}${title}</small><em style="margin-top:auto">${sub}</em></div>`;
    const sec = n => `<div class="sec" style="grid-column:span 2;margin:14px 4px 0"><h2>${n}</h2></div>`;
    return E.hdr('Everything', 'All of your life, one tap away', `<button class="hdr-btn" data-a="settings" aria-label="Settings">${ic('settings')}</button>`) +
      `<div class="bento">
        ${sec('Body')}
        ${tile('go-health', 'utensils', 'd', 'Food diary', `${E.n(Math.max(0, T.kcal - f.k))} kcal left`)}
        ${tile('go-move', 'dumbbell', 's', 'Workout & mobility', `${S().train.logs.length} workouts done`)}
        ${tile('go-body', 'scale', 'm', 'Weight & body', `${E.n(E.weightNow(), 1)} kg · goal ${S().profile.goalKg}`)}
        ${tile('fast-open', 'hourglass', 'd', 'Fasting timer', S().fast.start ? 'Running' : 'Not fasting')}
        ${sec('Money')}
        ${tile('go-money', 'wallet', 'o', 'Money', 'Spending, budgets, subscriptions')}
        ${tile('goals-open', 'piggy-bank', 'm', 'Savings goals', S().money.goals.length ? `${S().money.goals.length} goal${S().money.goals.length === 1 ? '' : 's'}` : 'Set a goal')}
        ${tile('shop-open', 'shopping-cart', 'd', 'Shopping list', `${S().shop.filter(x => !x.done).length} to buy`)}
        ${tile('go-prep', 'chef-hat', 'd', 'Meal prep', 'Recipes and groceries')}
        ${sec('Plan')}
        ${tile('go-tasks', 'list-checks', 'd', 'Tasks', open ? `${open} open` : 'Nothing open')}
        ${tile('go-dates', 'gift', 'r', 'Dates & notes', up ? `Next: ${E.rel(up).toLowerCase()}` : 'Birthdays, notes')}
        ${tile('go-week', 'calendar-clock', 'k', 'Weekly schedule', 'Work, class, meal times')}
        ${tile('habits-edit', 'flame', 'o', 'Habits', `${S().habits.filter(h => !h.off).length} active`)}
        ${sec('Grow')}
        ${tile('focus-new', 'timer', 'l', 'Focus timer', `${E.focusMins(E.range(7))} min this week`)}
        ${tile('go-german', 'languages', 'l', 'German', q ? `${q} cards due` : `${S().de.course.name} · ${S().de.course.left} lessons left`)}
        ${tile('go-career', 'rocket', 'k', 'Career', 'Roadmaps and courses')}
        ${tile('go-reading', 'book-open', 'd', 'Reading', S().books.filter(b => !b.done).length ? `${S().books.filter(b => !b.done).length} in progress` : 'Add a book')}
        ${tile('go-journal', 'feather', 'd', 'Journal', S().journal[t] ? 'Today is written' : 'Close your day')}
        ${tile('breathe', 'wind', 'k', 'Breathe', '1 minute of calm')}
        ${tile('miles-open', 'trophy', 'o', 'Milestones', `${E.milestones().filter(x => x.ok).length} earned`)}
        ${tile('settings', 'settings', 'd', 'Settings', 'Start day, reminders, look')}
      </div>`;
  };
  const go = (tab, sub) => () => { E.close(true); E.go(tab, sub); };
  Object.assign(E.A, { 'go-hub': go('hub'), 'go-coach': go('insights', 'coach'), 'go-reports': go('insights', 'week'), 'go-tasks': go('plan', 'tasks'), 'go-dates': go('plan', 'important'), 'go-week': go('plan', 'week'),
    'go-german': go('grow', 'german'), 'go-career': go('grow', 'career'), 'go-reading': go('grow', 'reading'), 'go-journal': go('grow', 'journal'), 'go-health': go('health', 'food'), 'go-body': go('health', 'body'), 'go-prep': () => { E.close(true); E.ui.sub.food = 'prep'; E.go('health', 'food'); }, 'go-money': go('money'), 'go-today': go('today') });
})(window.E);
