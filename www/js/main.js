(function (Q) {
  'use strict';
  const { $ } = Q;
  const hq = id => Q.S.quests.find(q => q.id === id);
  const money = n => Q.money(n, Q.S.settings.currency);

  Q.checkAch = () => {
    const g = Q.game();
    const fresh = g.ach.filter(id => !Q.S.hero.seen.includes(id));
    if (!fresh.length) return;
    Q.S.hero.seen.push(...fresh); Q.save();
    const a = Q.ACH.find(x => x.id === fresh[0]);
    Q.banner(fresh.length === 1 ? a.name : `${a.name} +${fresh.length - 1} more`, a.icon);
    Q.sfx('ach');
  };

  Q.afterChange = function (before, opts) {
    opts = opts || {};
    const g = Q.game(), q = [];
    Q.render();
    if (opts.date) {
      const a = g.days[opts.date], b = before.days[opts.date];
      const dmg = (a ? a.doneXp : 0) - (b ? b.doneXp : 0);
      const opp = $('#opp .opp');
      if (dmg > 0 && opp && !(b && b.defeated)) { Q.shake(opp, 'hit'); Q.floatText(opp, `−${dmg}`, 'dmg'); Q.sfx('hit'); }
      if (a && a.defeated && !(b && b.defeated)) q.push(Q.bossOverlay(a, g));
    }
    if (g.weekBosses > before.weekBosses) q.push(Q.weekBossOverlay(g));
    if (g.level > before.level) q.push(Q.levelOverlay(g, g.rank.i > before.rank.i));
    if (q.length) Q.showQueue(q);
    Q.checkAch();
  };

  // meals quest mirrors the Fuel tab
  Q.syncMeals = d => {
    const q = Q.S.quests.find(x => x.key === 'meals' && Q.activeOn(x, d));
    if (q) Q.setLog(d, q.id, Q.mealsDone(d) || null);
  };
  Q.retrain = () => {
    const q = Q.S.quests.find(x => x.key === 'workout' && !x.until);
    if (q) q.days = Q.pickTrainingDays((Q.S.week.train || {}).perWeek || 3);
  };

  // ---------- focus timer ----------
  let tick = null;
  function paintTimer() {
    const t = Q.S.timer, el = document.getElementById('tcount'); if (!t || !el) return;
    const total = t.mins * 60000, left = Math.max(0, t.end - Date.now()), s = Math.ceil(left / 1000);
    el.textContent = `${Q.pad(Math.floor(s / 60))}:${Q.pad(s % 60)}`;
    const ring = document.getElementById('tring');
    if (ring) { const C = 2 * Math.PI * 54; ring.style.strokeDashoffset = (C * (1 - (total - left) / total)).toFixed(1); }
  }
  function startTick() { clearInterval(tick); tick = setInterval(() => { const t = Q.S.timer; if (!t) { clearInterval(tick); return; } if (Date.now() >= t.end) finishTimer(); else paintTimer(); }, 500); }
  function finishTimer() {
    clearInterval(tick); if (!Q.S.timer) return;
    const b = Q.game(), d = Q.today();
    Q.S.timer = null; Q.S.focus[d] = (Q.S.focus[d] || 0) + 1;
    Q.save(); Q.cancelFocusNote(); Q.buzz([200, 100, 200]); Q.sfx('coin'); Q.toast('Focus session complete · +15 XP'); Q.afterChange(b);
  }
  Q.checkTimer = () => { const t = Q.S.timer; if (!t) return; if (Date.now() >= t.end) finishTimer(); else startTick(); };

  // ---------- breathing ----------
  let bTimer = null;
  function startBreath() {
    Q.ui.breathing = true; Q.render();
    const phases = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];
    let i = 0;
    const step = () => {
      const el = $('#breath'), lab = $('#blabel');
      if (!el || !Q.ui.breathing) { stopBreath(); return; }
      if (i >= 16) {
        stopBreath();
        const b = Q.game(), d = Q.today(), first = !Q.S.breath[d];
        Q.S.breath[d] = 1; Q.save(); Q.sfx('coin'); Q.toast(first ? 'Composed · +5 XP' : 'One more calm minute.'); Q.afterChange(b);
        return;
      }
      const p = i % 4; el.dataset.p = p; lab.textContent = `${phases[p]} · ${Math.floor(i / 4) + 1}/4`;
      if (p === 0 || p === 2) Q.sfx('breathe', p === 0);
      i++; bTimer = setTimeout(step, 4000);
    };
    setTimeout(step, 50);
  }
  function stopBreath() { clearTimeout(bTimer); const was = Q.ui.breathing; Q.ui.breathing = false; if (was && Q.ui.tab === 'you' && Q.ui.sub === 'breathe') Q.render(); }
  Q.afterRender = () => { if (Q.ui.tab === 'you' && Q.ui.sub === 'focus' && Q.S.timer) paintTimer(); };

  function moveQuest(id, dir) {
    const d = Q.ui.date, act = Q.editList(d);
    const i = act.findIndex(q => q.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= act.length) return;
    const a = Q.S.quests.indexOf(act[i]), b = Q.S.quests.indexOf(act[j]);
    [Q.S.quests[a], Q.S.quests[b]] = [Q.S.quests[b], Q.S.quests[a]];
    Q.save(); Q.render();
  }
  const hasLogs = qid => Object.keys(Q.S.logs).some(d => qid in Q.S.logs[d]);
  const stepsFrom = (text, old) => text.split('\n').map(x => x.trim()).filter(Boolean).map(t => ({ t, done: !!((old || []).find(o => o.t === t) || {}).done }));
  const scrollTop = () => window.scrollTo(0, 0);
  function completeFx(el, q) { Q.floatText(el, `+${Q.DIFF[q.diff].xp} XP`); Q.burstAt(el.querySelector('.chk') || el, { n: 14 }); Q.sfx('tick'); Q.buzz(15); Q.comboHit(); }
  const schedRefresh = () => { Q.save(); Q.refreshSched(); };
  const goTab = t => { Q.ui.tab = t; Q.ui.edit = false; Q.render(); scrollTop(); };

  function act(a, el) {
    const id = el.dataset.id, d = Q.ui.date, today = Q.today();
    if (a.startsWith('ob-')) { Q.onbAct(a, el); return; }
    switch (a) {
      case 'tab': goTab(el.dataset.tab); break;
      case 'plan-journey': Q.ui.plantab = 'journey'; goTab('plan'); break;
      case 'sub': Q.ui.sub = el.dataset.m || null; stopBreath(); Q.render(); scrollTop(); break;

      // ----- today -----
      case 'prev-day': Q.ui.date = Q.addDays(d, -1); Q.render(); break;
      case 'next-day': if (d < today) { Q.ui.date = Q.addDays(d, 1); Q.render(); } break;
      case 'go-today': Q.ui.date = today; Q.render(); break;
      case 'hide-quote': Q.S.ui.quoteHidden = today; Q.save(); Q.render(); break;
      case 'toggle': {
        const q = hq(id); if (!q) break;
        const b = Q.game(), was = Q.getLog(d, id) === true;
        Q.setLog(d, id, was ? null : true);
        if (!was) completeFx(el, q); else Q.sfx('undo');
        Q.afterChange(b, { date: d }); break;
      }
      case 'inc': {
        const q = hq(id); if (!q) break;
        const b = Q.game(), v = Q.getLog(d, id), cur = typeof v === 'number' ? v : 0;
        const nv = Math.round((cur + (q.step || 1)) * 100) / 100;
        Q.setLog(d, id, nv);
        if (Q.isDone(q, nv, d) && !Q.isDone(q, cur, d)) completeFx(el.closest('.row'), q); else { Q.sfx('tap'); Q.buzz(6); Q.floatText(el, `+${q.step || 1}`, 'small'); }
        Q.afterChange(b, { date: d }); break;
      }
      case 'adj': Q.adjSheet(id); break;
      case 'adj-step': { const i = $('#adj-v'); i.value = Math.max(0, Math.round(((parseFloat(i.value) || 0) + Number(el.dataset.n)) * 100) / 100); Q.sfx('tap'); break; }
      case 'adj-save': {
        const q = hq(id); if (!q) break;
        const b = Q.game(), v = parseFloat(Q.val('adj-v')), was = Q.isDone(q, Q.getLog(d, id), d);
        Q.setLog(d, id, v > 0 ? v : null); Q.closeSheet();
        if (!was && Q.isDone(q, v, d)) { Q.sfx('tick'); Q.comboHit(); }
        Q.afterChange(b, { date: d }); break;
      }
      case 'quest-menu': Q.questMenu(id); break;
      case 'mini': {
        const q = hq(id); if (!q) break;
        const b = Q.game(), was = Q.getLog(d, id) === 'm';
        Q.setLog(d, id, was ? null : 'm'); Q.closeSheet();
        if (!was) { Q.toast(`Mini version logged · +${Math.round(Q.DIFF[q.diff].xp / 2)} XP. Showing up counts.`); Q.sfx('tick'); }
        Q.afterChange(b, { date: d }); break;
      }
      case 'skip-ask': Q.skipCard(id); break;
      case 'skip-yes': { const b = Q.game(); Q.setLog(d, id, 's'); Q.closeSheet(); Q.sfx('undo'); Q.afterChange(b, { date: d }); break; }
      case 'unskip': { const b = Q.game(); Q.setLog(d, id, null); Q.afterChange(b, { date: d }); break; }
      case 'remind': Q.remindSheet(id); break;
      case 'remind-save': { const q = hq(id); if (!q) break; q.remind = Q.val('rm-t') || ''; Q.save(); Q.closeSheet(); Q.render(); Q.toast(`Reminder fixed at ${q.remind}`); break; }
      case 'remind-off': { const q = hq(id); if (q) { q.remind = ''; Q.save(); } Q.closeSheet(); Q.render(); Q.toast('Reminder follows your day plan'); break; }
      case 'bonus': {
        const b = Q.game(), was = !!Q.S.bonus[today];
        if (was) delete Q.S.bonus[today]; else Q.S.bonus[today] = true;
        Q.save();
        if (!was) { Q.floatText(el, '+25 XP'); Q.burstAt(el, { n: 20 }); Q.sfx('coin'); Q.comboHit(); } else Q.sfx('undo');
        Q.afterChange(b); break;
      }
      case 'ci': {
        Q.ui.ci = Q.ui.ci || {}; Q.ui.ci[el.dataset.k] = +el.dataset.v; Q.sfx('tap');
        if (Q.ui.ci.mood && Q.ui.ci.energy) {
          const b = Q.game(), c = Q.ui.ci;
          Q.S.checkins[today] = { mood: c.mood, energy: c.energy }; Q.ui.ci = null; Q.save();
          Q.toast(c.energy <= 2 ? 'Low energy noted: today\'s opponent is 15% weaker. Minis count.' : c.mood <= 2 ? 'Rough day. Small wins today. +5 XP' : 'Checked in · +5 XP');
          Q.sfx('coin'); Q.afterChange(b, { date: today });
        } else Q.render();
        break;
      }
      case 'chest': Q.openChest(el.dataset.d); break;
      case 'sugg-yes': {
        const q = hq(id); if (!q) break;
        const b = Q.game(), dir = +el.dataset.dir;
        Q.changeLevel(q, dir); Q.save();
        Q.toast(dir > 0 ? `Levelled up: ${Q.qName(q, Q.addDays(today, 1))} from tomorrow` : `Eased to ${Q.qName(q, today)}. Build back up from here.`);
        Q.sfx(dir > 0 ? 'level' : 'tap'); Q.afterChange(b); break;
      }
      case 'sugg-no': Q.S.dismiss[id] = today; Q.save(); Q.render(); break;
      case 'review': Q.reviewSheet(); break;
      case 'review-save': {
        const b = Q.game();
        Q.$$('[data-rv]').forEach(cb => { if (cb.checked) { const q = hq(cb.dataset.rv); if (q) Q.changeLevel(q, +cb.dataset.dir); } else Q.S.dismiss[cb.dataset.rv] = today; });
        Q.S.reviews.push({ d: today, note: Q.val('rv-note').trim() });
        Q.save(); Q.closeSheet(); Q.sfx('coin'); Q.toast('Review complete · +50 XP'); Q.afterChange(b); break;
      }
      case 'edit-mode': Q.ui.edit = !Q.ui.edit; Q.render(); break;
      case 'add-quest': Q.questSheet(); break;
      case 'edit-quest': Q.questSheet(id); break;
      case 'quest-up': moveQuest(id, -1); break;
      case 'quest-down': moveQuest(id, 1); break;
      case 'quest-save': {
        const qid = Q.val('q-id'), name = Q.val('q-name').trim();
        if (!name) { Q.toast('Give your quest a name'); Q.sfx('error'); break; }
        const days = Q.$$('#q-days button.on').map(x => +x.dataset.d);
        if (!days.length) { Q.toast('Pick at least one day'); break; }
        const common = { name, icon: Q.val('q-icon') || 'star', stat: Q.segVal('q-stat') || 'dis', diff: +Q.segVal('q-diff') || 2, days, mini: Q.val('q-mini').trim() };
        if (qid) {
          const q = hq(qid); Object.assign(q, common);
          const lb = $('#q-lv button.on');
          if (lb) { const nl = +lb.dataset.l, cl = Q.levelAt(q, today); if (nl !== cl) Q.changeLevel(q, nl - cl); }
          Q.save(); Q.closeSheet(); Q.render(); Q.toast('Quest updated'); break;
        }
        const type = Q.segVal('q-type') || 'check', target = parseFloat(Q.val('q-target'));
        if (type === 'count' && !(target > 0)) { Q.toast('Set a target above 0'); break; }
        const when = Q.segVal('q-when') || 'anytime', dur = Math.max(0, parseInt(Q.val('q-dur'), 10) || 0);
        const gd = Q.game().days[today], later = !!(gd && gd.defeated), since = later ? Q.addDays(today, 1) : today;
        Q.S.quests.push({ id: Q.uid(), key: null, ...common, type, unit: type === 'count' ? Q.val('q-unit').trim() : '', tiers: [type === 'count' ? target : 0], step: 1, when, dur: when === 'allday' ? 0 : dur, since, lv: [{ d: since, l: 0 }], remind: '' });
        Q.save(); Q.closeSheet(); Q.render();
        Q.toast(later ? 'Added. It starts tomorrow so today\'s win stays safe.' : 'Quest added and scheduled'); break;
      }
      case 'quest-del': {
        const qid = Q.val('q-id');
        Q.confirm('Remove this quest?', 'Past progress stays in your history. It stops showing up from today.', 'Remove', () => {
          const q = hq(qid); if (!q) return;
          if (hasLogs(qid)) q.until = Q.addDays(today, -1); else Q.S.quests.splice(Q.S.quests.indexOf(q), 1);
          Q.save(); Q.render();
        }, true);
        break;
      }

      // ----- plan / schedule -----
      case 'day-open': Q.daySheet(el.dataset.d); break;
      case 'sched-edit': Q.schedDay = Q.dow(Q.today()); Q.schedSheet(); break;
      case 'sched-day': Q.schedDay = +el.dataset.v; Q.refreshSched(); Q.sfx('tap'); break;
      case 'blk-add': {
        const t = el.dataset.t, day = Q.S.week.days[Q.schedDay], bt = Q.BLOCK_TYPES[t];
        const preset = { work: ['09:00', '17:00'], study: ['18:00', '20:00'], commute: ['08:15', '09:00'], family: ['20:00', '21:30'], faith: ['12:00', '13:00'], other: ['18:00', '19:00'] }[t];
        day.blocks.push({ id: Q.uid(), label: bt.name.split(' /')[0], type: t, start: preset[0], end: preset[1] });
        schedRefresh(); Q.sfx('tap'); break;
      }
      case 'blk-del': { const day = Q.S.week.days[Q.schedDay]; day.blocks = day.blocks.filter(b => b.id !== el.dataset.bid); schedRefresh(); break; }
      case 'sched-copy': {
        const src = Q.S.week.days[Q.schedDay], v = el.dataset.v;
        const targets = v === 'weekdays' ? [1, 2, 3, 4, 5] : v === 'weekend' ? [6, 0] : [0, 1, 2, 3, 4, 5, 6];
        targets.forEach(i => { if (i !== Q.schedDay) Q.S.week.days[i] = { wake: src.wake, sleep: src.sleep, blocks: src.blocks.map(b => ({ ...b, id: Q.uid() })) }; });
        schedRefresh(); Q.toast(`Copied to ${v === 'weekdays' ? 'Mon–Fri' : v === 'weekend' ? 'the weekend' : 'every day'}`); break;
      }
      case 'sched-done': { Q.retrain(); Q.save(); Q.closeSheet(); Q.render(); Q.toast('Schedule saved. Your days are re-planned.'); break; }

      // ----- fuel -----
      case 'goto-fuel': Q.ui.fuelDate = d; goTab('fuel'); break;
      case 'meal-open': Q.ui.fuelDate = el.dataset.d; Q.ui.mealOpen = el.dataset.d + el.dataset.slot; goTab('fuel'); break;
      case 'meal-toggle': Q.ui.mealOpen = Q.ui.mealOpen === el.dataset.k ? null : el.dataset.k; Q.sfx('tap'); Q.render(); break;
      case 'fuel-prev': Q.ui.fuelDate = Q.addDays(Q.ui.fuelDate, -1); Q.ui.mealOpen = null; Q.render(); break;
      case 'fuel-next': Q.ui.fuelDate = Q.addDays(Q.ui.fuelDate, 1); Q.ui.mealOpen = null; Q.render(); break;
      case 'fuel-today': Q.ui.fuelDate = today; Q.render(); break;
      case 'meal-done': case 'meal-off': {
        const md = el.dataset.d, slot = el.dataset.slot, log = Q.S.nutri.days[md] || (Q.S.nutri.days[md] = {});
        const val = a === 'meal-done' ? 'done' : 'off', b = Q.game();
        if (log[slot] === val) delete log[slot]; else log[slot] = val;
        const now = log[slot];
        if (!Object.keys(log).length) delete Q.S.nutri.days[md];
        Q.syncMeals(md); Q.save();
        if (now === 'done') { Q.sfx('tick'); Q.burstAt(el, { n: 12 }); }
        Q.ui.mealOpen = null; Q.afterChange(b, { date: md }); break;
      }
      case 'meal-swap': { Q.swapMeal(el.dataset.d, el.dataset.slot); Q.save(); Q.sfx('tap'); Q.render(); break; }
      case 'grocery': Q.grocerySheet(); break;
      case 'fuel-tomorrow': Q.ui.fuelDate = Q.addDays(today, 1); goTab('fuel'); break;
      case 'guide': Q.guideSheet(id); break;
      case 'nutri-edit': Q.nutriSheet(); break;
      case 'nutri-save': {
        const n = Q.S.nutri, age = +Q.val('n-age'), h = +Q.val('n-h'), w = +Q.val('n-w');
        if (age >= 14 && age <= 90) n.age = age; if (h >= 120 && h <= 230) n.height = h;
        if (w >= 35 && w <= 300 && Math.abs(w - Q.latestWeight()) > 0.05) { Q.S.weights = Q.S.weights.filter(x => x.d !== today); Q.S.weights.push({ d: today, kg: Math.round(w * 10) / 10 }); }
        const mq = Q.S.quests.find(q => q.key === 'meals'); if (mq) mq.tiers = [n.meals];
        Q.save(); Q.closeSheet(); Q.render(); Q.toast(`Targets: ${Q.fmt(Q.targets().kcal)} kcal · ${Q.targets().p} g protein`); break;
      }
      case 'weight': Q.weightSheet(); break;
      case 'weight-save': {
        const kg = parseFloat(Q.val('w-kg')), wd = Q.val('w-d') || today;
        if (!(kg > 30 && kg < 300)) { Q.toast('Enter a weight in kg'); break; }
        const b = Q.game();
        Q.S.weights = Q.S.weights.filter(w => w.d !== wd); Q.S.weights.push({ d: wd, kg: Math.round(kg * 10) / 10 });
        Q.save(); Q.closeSheet(); Q.toast(`Logged. Targets now ${Q.fmt(Q.targets().kcal)} kcal.`); Q.afterChange(b); break;
      }

      // ----- profile -----
      case 'why-edit': Q.whySheet(); break;
      case 'why-save': Q.S.hero.why = Q.val('why-t').trim(); Q.save(); Q.closeSheet(); Q.render(); break;
      case 'hero-edit': Q.heroSheet(); break;
      case 'hero-save': Q.S.hero.name = Q.val('he-name').trim() || 'Hero'; Q.save(); Q.closeSheet(); Q.render(); break;
      case 'ach': { const x = Q.ACH.find(y => y.id === id); if (x) Q.toast(`${x.name}: ${x.desc}`); break; }

      // ----- side quests -----
      case 'side-open': Q.sideSheet(id); break;
      case 'side-add': Q.sideEditSheet(); break;
      case 'side-tpl': {
        const t = Q.SIDE_TEMPLATES[+el.dataset.i]; if (!t) break;
        Q.S.side.push({ id: Q.uid(), name: t.name, icon: t.icon, stat: t.stat, diff: t.diff, due: '', notes: '', steps: [], done: false, created: today });
        Q.save(); Q.render(); Q.sfx('tick'); Q.toast(`Accepted: ${t.name}`); break;
      }
      case 'side-edit': Q.sideEditSheet(id); break;
      case 'side-save': {
        const sid = Q.val('s-id'), name = Q.val('s-name').trim();
        if (!name) { Q.toast('Give your quest a name'); break; }
        const old = sid ? Q.S.side.find(x => x.id === sid) : null;
        const data = { name, icon: Q.val('s-icon') || 'scroll', stat: Q.segVal('s-stat') || 'dis', diff: +Q.segVal('s-diff') || 2, due: Q.val('s-due'), notes: Q.val('s-notes').trim(), steps: stepsFrom(Q.val('s-steps'), old && old.steps) };
        if (old) Object.assign(old, data); else Q.S.side.push({ id: Q.uid(), done: false, created: today, ...data });
        Q.save(); Q.closeSheet(); Q.render(); Q.toast(sid ? 'Updated' : 'Side quest created'); break;
      }
      case 'side-del': { const sid = Q.val('s-id'); Q.confirm('Delete this side quest?', 'This also removes the XP it gave you.', 'Delete', () => { const b = Q.game(); Q.S.side = Q.S.side.filter(x => x.id !== sid); Q.save(); Q.afterChange(b); }, true); break; }
      case 'side-done': { const s = Q.S.side.find(x => x.id === id); if (!s) break; const b = Q.game(); s.done = true; s.doneOn = today; Q.save(); Q.closeSheet(); Q.sfx('defeat'); Q.confetti(); Q.toast(`Side quest complete · +${Q.DIFF[s.diff].side} XP`); Q.afterChange(b); break; }
      case 'side-undo': { const s = Q.S.side.find(x => x.id === id); if (!s) break; const b = Q.game(); s.done = false; s.doneOn = null; Q.save(); Q.closeSheet(); Q.afterChange(b); break; }
      case 'step': { const s = Q.S.side.find(x => x.id === id); if (!s) break; const st = s.steps[+el.dataset.i]; if (st) st.done = !st.done; Q.save(); Q.sfx('tap'); Q.render(); Q.sideSheet(id); break; }

      // ----- hustles -----
      case 'hustle-new': Q.hustleEditSheet(); break;
      case 'hustle-idea': {
        const t = Q.HUSTLE_IDEAS[+el.dataset.i]; if (!t) break;
        if (!t.tasks.length) { Q.hustleEditSheet(); break; }
        const h = { id: Q.uid(), name: t.name, icon: t.icon, goal: 0, entries: [], tasks: t.tasks.map(x => ({ id: Q.uid(), t: x, done: false })), created: today };
        const b = Q.game(); Q.S.hustles.push(h); Q.save(); Q.afterChange(b); Q.hustleEditSheet(h.id); break;
      }
      case 'hustle-open': Q.hustleSheet(id); break;
      case 'hustle-edit': Q.hustleEditSheet(id); break;
      case 'hustle-save': {
        const hid = Q.val('h-id'), name = Q.val('h-name').trim();
        if (!name) { Q.toast('Give your hustle a name'); break; }
        const data = { name, icon: Q.val('h-icon') || 'rocket', goal: Math.max(0, parseFloat(Q.val('h-goal')) || 0) };
        const b = Q.game();
        if (hid) Object.assign(Q.S.hustles.find(x => x.id === hid), data); else Q.S.hustles.push({ id: Q.uid(), entries: [], tasks: [], created: today, ...data });
        Q.save(); Q.closeSheet(); Q.afterChange(b); Q.toast(hid ? 'Updated' : 'Hustle started'); break;
      }
      case 'hustle-del': { const hid = Q.val('h-id'); Q.confirm('Delete this hustle?', 'Its income log and steps go too, with the XP they gave.', 'Delete', () => { const b = Q.game(); Q.S.hustles = Q.S.hustles.filter(x => x.id !== hid); Q.save(); Q.afterChange(b); }, true); break; }
      case 'income-add': Q.incomeSheet(id); break;
      case 'income-save': {
        const h = Q.S.hustles.find(x => x.id === id); if (!h) break;
        const amt = parseFloat(Q.val('i-amt')); if (!(amt > 0)) { Q.toast('Enter an amount above 0'); break; }
        const b = Q.game(); h.entries.push({ id: Q.uid(), d: Q.val('i-date') || today, amount: amt, note: Q.val('i-note').trim() });
        Q.save(); Q.closeSheet(); Q.sfx('coin'); Q.toast(`${money(amt)} logged · +20 XP`); Q.afterChange(b); break;
      }
      case 'income-del': { const h = Q.S.hustles.find(x => x.id === id); if (!h) break; const b = Q.game(); h.entries = h.entries.filter(e => e.id !== el.dataset.e); Q.save(); Q.afterChange(b); Q.hustleSheet(id); break; }
      case 'htask': { const h = Q.S.hustles.find(x => x.id === id); if (!h) break; const t = h.tasks[+el.dataset.i]; if (!t) break; const b = Q.game(); t.done = !t.done; Q.save(); if (t.done) Q.sfx('tick'); Q.afterChange(b); Q.hustleSheet(id); break; }
      case 'htask-del': { const h = Q.S.hustles.find(x => x.id === id); if (!h) break; const b = Q.game(); h.tasks.splice(+el.dataset.i, 1); Q.save(); Q.afterChange(b); Q.hustleSheet(id); break; }
      case 'htask-add': { const h = Q.S.hustles.find(x => x.id === id); if (!h) break; const t = Q.val('ht-new').trim(); if (!t) break; h.tasks.push({ id: Q.uid(), t, done: false }); Q.save(); Q.render(); Q.hustleSheet(id); break; }

      // ----- tools -----
      case 'focus-start': { const mins = Q.ui.focusMins, end = Date.now() + mins * 60000; Q.S.timer = { end, mins }; Q.save(); Q.scheduleFocusNote(end); startTick(); Q.sfx('tick'); Q.render(); break; }
      case 'focus-cancel': Q.confirm('End this session?', 'You won\'t earn Focus XP for it.', 'End session', () => { Q.S.timer = null; clearInterval(tick); Q.save(); Q.cancelFocusNote(); Q.render(); }, true); break;
      case 'breath-start': startBreath(); break;
      case 'breath-stop': stopBreath(); break;
      case 'journal-save': { const text = Q.val('jtext').trim(), b = Q.game(); if (text) Q.S.journal[today] = text; else delete Q.S.journal[today]; Q.save(); Q.toast(text.length >= 10 ? 'Saved · +10 XP' : 'Saved'); Q.afterChange(b); break; }
      case 'buy': {
        const r = Q.S.rewards.find(x => x.id === id), g = Q.game(); if (!r) break;
        if (g.coins < r.cost) { Q.toast('Not enough coins yet'); Q.sfx('error'); break; }
        Q.S.purchases.push({ id: Q.uid(), rid: r.id, name: r.name, icon: r.icon, cost: r.cost, d: today });
        Q.save(); Q.sfx('coin'); Q.burstAt(el); Q.toast(`${r.name}. You earned it.`); Q.afterChange(g); break;
      }
      case 'reward-add': Q.rewardSheet(); break;
      case 'reward-edit': Q.rewardSheet(id); break;
      case 'reward-save': {
        const rid = Q.val('r-id'), name = Q.val('r-name').trim(), cost = Math.round(parseFloat(Q.val('r-cost')));
        if (!name) { Q.toast('Name your reward'); break; } if (!(cost > 0)) { Q.toast('Cost must be above 0'); break; }
        const data = { name, icon: Q.val('r-icon') || 'gift', cost };
        if (rid) Object.assign(Q.S.rewards.find(x => x.id === rid), data); else Q.S.rewards.push({ id: Q.uid(), ...data });
        Q.save(); Q.closeSheet(); Q.render(); break;
      }
      case 'reward-del': { const rid = Q.val('r-id'); Q.S.rewards = Q.S.rewards.filter(x => x.id !== rid); Q.save(); Q.closeSheet(); Q.render(); break; }

      case 'new-cycle': { const P = Q.S.program; P.cycles++; P.start = today; P.phaseShown = 1; Q.save(); Q.closeOverlay(); Q.render(); Q.toast(`Cycle ${P.cycles + 1} begins. Quests keep their levels.`); break; }
      case 'start-tomorrow':
        Q.confirm('Start tomorrow?', 'Day 1 moves to tomorrow. Anything logged today is cleared.', 'Start tomorrow', () => {
          const S = Q.S, tm = Q.addDays(today, 1);
          S.program.start = tm; S.program.phaseShown = 1; S.hero.created = tm;
          S.quests.forEach(q => { if (q.since <= tm) { q.since = tm; q.lv = [{ d: tm, l: q.lv[q.lv.length - 1].l }]; } });
          delete S.logs[today]; delete S.checkins[today]; delete S.bonus[today]; delete S.chests[today]; delete S.nutri.days[today];
          Q.save(); Q.render(); Q.toast('Your program starts tomorrow. Rest up.');
        });
        break;
      case 'export': Q.exportBackup().then(ok => { if (ok) Q.toast('Backup ready'); }); break;
      case 'import': $('#importFile').click(); break;
      case 'reset':
        Q.confirm('Reset everything?', 'Wipes all progress on this phone and restarts setup. Export a backup first if you might want it.', 'Wipe it all', () => {
          try { localStorage.removeItem(Q.KEY); } catch (e) { /* ignore */ }
          Q.S = Q.freshState(); Q.save(); Q.ui.date = Q.today(); Q.ui.tab = 'today'; Q.ui.sub = null; Q.render(); Q.startOnboarding();
        }, true);
        break;
      case 'confirm-yes': { const cb = Q._confirmCb; Q._confirmCb = null; Q.closeSheet(); if (cb) cb(); break; }
      case 'sheet-close': Q.closeSheet(); break;
      case 'ovl-close': Q.closeOverlay(); break;
      default: break;
    }
  }

  // ---------- input wiring ----------
  let suppress = false, holdT = null, holdStart = null;
  document.addEventListener('pointerdown', e => {
    const r = e.target.closest('[data-hold]');
    if (!r || !r.dataset.hold || e.target.closest('.plus,.btn')) return;
    holdStart = { x: e.clientX, y: e.clientY };
    clearTimeout(holdT); r.classList.add('pressing');
    holdT = setTimeout(() => { suppress = true; r.classList.remove('pressing'); Q.buzz(20); Q.sfx('tap'); Q.questMenu(r.dataset.hold); }, 480);
  });
  const cancelHold = () => { clearTimeout(holdT); Q.$$('.pressing').forEach(x => x.classList.remove('pressing')); };
  document.addEventListener('pointerup', cancelHold);
  document.addEventListener('pointercancel', cancelHold);
  document.addEventListener('pointermove', e => { if (holdStart && (Math.abs(e.clientX - holdStart.x) > 10 || Math.abs(e.clientY - holdStart.y) > 10)) cancelHold(); });
  document.addEventListener('contextmenu', e => { if (e.target.closest('[data-hold]')) e.preventDefault(); });

  const NSEG = { 'n-sex': ['sex', String], 'n-act': ['activity', String], 'n-goal': ['goal', String], 'n-pace': ['pace', String], 'n-meals': ['meals', Number] };
  document.addEventListener('click', e => {
    if (suppress) { suppress = false; e.preventDefault(); return; }
    const nav = e.target.closest('#nav button');
    if (nav) { if (nav.dataset.tab === 'you') { Q.ui.sub = null; stopBreath(); } Q.sfx('tap'); goTab(nav.dataset.tab); return; }
    const ip = e.target.closest('.iconpick button');
    if (ip) { const box = ip.parentElement; box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === ip)); document.getElementById(box.dataset.pick).value = ip.dataset.icon; Q.sfx('tap'); return; }
    const ex = e.target.closest('[data-ex]');
    if (ex) {
      const v = ex.dataset.ex, L = Q.S.nutri.exclude;
      if (L.includes(v)) L.splice(L.indexOf(v), 1); else L.push(v);
      ex.classList.toggle('on'); Q.save(); Q.sfx('tap');
      if (Q.onb && Q.onb.step === Q.OB.food) Q.renderOnb();
      return;
    }
    const sb = e.target.closest('.seg button');
    if (sb) {
      const segEl = sb.closest('.seg'), sid = segEl.dataset.seg, v = sb.dataset.v;
      segEl.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === sb));
      Q.sfx('tap');
      if (sid === 'sidetab') { Q.ui.sideTab = v; Q.render(); }
      else if (sid === 'qtab') { Q.ui.qtab = v; Q.render(); }
      else if (sid === 'plantab') { Q.ui.plantab = v; Q.render(); }
      else if (sid === 'mins') { Q.ui.focusMins = +v; Q.render(); }
      else if (sid === 'q-type') { $('#q-count').classList.toggle('hide', v !== 'count'); }
      else if (sid === 'perweek' || sid === 'trainpref') {
        const tr = Q.S.week.train = Q.S.week.train || { perWeek: 3, pref: 'evening' };
        if (sid === 'perweek') tr.perWeek = +v; else tr.pref = v;
        Q.retrain(); Q.save();
        if (Q.onb) Q.renderOnb(); else Q.render();
      }
      else if (sid === 'ob-start' && Q.onb) { Q.onb.start = v; }
      else if (NSEG[sid]) { const [k, cast] = NSEG[sid]; Q.S.nutri[k] = cast(v); Q.save(); if (Q.onb) Q.renderOnb(); }
      else if (sid === 'mode') { Q.S.hero.mode = v; Q.S.settings.threshold = Q.mode().threshold; Q.save(); Q.toast(`${Q.mode().name} mode`); Q.render(); }
      return;
    }
    const lv = e.target.closest('#q-lv button');
    if (lv) { lv.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === lv)); Q.sfx('tap'); return; }
    const db = e.target.closest('.days button');
    if (db) { db.classList.toggle('on'); return; }
    const el = e.target.closest('[data-act]');
    if (el && !el.disabled && el.dataset.act) act(el.dataset.act, el);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'ht-new') { const b = document.querySelector('[data-act="htask-add"]'); if (b) act('htask-add', b); }
    if (e.key === 'Enter' && e.target.id === 'ob-name') { e.preventDefault(); Q.onbAct('ob-name', e.target); }
  });
  document.addEventListener('input', e => { if (e.target.id === 'thr') { const o = $('#thv'); if (o) o.textContent = e.target.value + '%'; } });

  document.addEventListener('change', async e => {
    const t = e.target, s = Q.S.settings;
    if (t.id === 'importFile') { importFile(t); return; }
    if (t.dataset.sched) { const day = Q.S.week.days[Q.schedDay]; if (t.value) day[t.dataset.sched] = t.value; schedRefresh(); return; }
    if (t.dataset.blk) {
      const row = t.closest('[data-bid]'), day = Q.S.week.days[Q.schedDay], b = day.blocks.find(x => x.id === row.dataset.bid);
      if (b) {
        const k = t.dataset.blk;
        if (k === 'label') b.label = t.value.trim() || b.label;
        else if (k === 'type') { const names = Object.values(Q.BLOCK_TYPES).map(x => x.name.split(' /')[0]); if (names.includes(b.label)) b.label = Q.BLOCK_TYPES[t.value].name.split(' /')[0]; b.type = t.value; }
        else if (t.value) b[k] = t.value;
      }
      schedRefresh(); return;
    }
    const k = t.dataset && t.dataset.set;
    if (!k) return;
    if (k === 'threshold') { const b = Q.game(); s.threshold = Q.clamp(+t.value || 80, 50, 100); Q.save(); Q.afterChange(b); }
    else if (k === 'offday') { const fd = Q.ui.fuelDate, b = Q.game(); if (t.checked) Q.S.nutri.off[fd] = true; else delete Q.S.nutri.off[fd]; Q.save(); Q.toast(t.checked ? 'Off-plan day logged. Back on plan tomorrow.' : 'Back on plan'); Q.afterChange(b, { date: fd }); }
    else if (['sound', 'haptics', 'bedRemind', 'autoRemind', 'mealRemind'].includes(k)) { s[k] = t.checked; Q.save(); }
    else if (k === 'currency') { s.currency = t.value.trim() || '$'; Q.save(); }
    else if (k === 'remindersOn') {
      if (t.checked) { const ok = await Q.ensureNotifPermission(); if (!ok) { s.remindersOn = false; Q.toast(Q.isNative() ? 'Notification permission was denied' : 'Reminders work in the Android app'); Q.render(); return; } }
      s.remindersOn = t.checked; Q.save(); Q.toast(t.checked ? 'Smart reminders on' : 'Reminders off');
    }
    else if (k === 'evening') { if (t.value) { s.evening = t.value; Q.save(); } }
  });

  function importFile(input) {
    const f = input.files && input.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      input.value = '';
      let d = null; try { d = JSON.parse(String(r.result)); } catch (e) { /* below */ }
      if (!Q.validBackup(d)) { Q.toast('That file is not a Questline backup'); return; }
      Q.confirm('Import this backup?', 'It replaces everything on this phone.', 'Replace', () => {
        Q.replaceState(d); Q.ui.date = Q.today();
        const o = $('#onb'); if (o && Q.S.hero.onboarded) { o.remove(); Q.onb = null; document.body.classList.remove('onb-on'); }
        Q.render(); Q.toast('Backup restored'); Q.checkTimer();
      });
    };
    r.readAsText(f);
  }

  function onOpen() {
    if (!Q.S.hero.onboarded) return;
    const r = Q.checkPhase();
    if (r && r.type === 'phase') Q.showQueue([Q.phaseOverlay(r)]);
    if (r && r.type === 'complete') Q.showQueue([Q.completeOverlay()]);
    Q.render(); Q.checkAch();
  }
  let lastToday = Q.today();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const t = Q.today();
    if (t !== lastToday) { if (Q.ui.date === lastToday) Q.ui.date = t; if (Q.ui.fuelDate === lastToday) Q.ui.fuelDate = t; lastToday = t; onOpen(); }
    Q.checkTimer();
  });

  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (App && App.addListener) {
    App.addListener('backButton', () => {
      if (document.querySelector('.ovl')) { Q.closeOverlay(); return; }
      if (document.querySelector('.scrim')) { Q.closeSheet(); return; }
      if (Q.onb) { if (Q.onb.step > 0) Q.onbAct('ob-back', document.body); return; }
      if (Q.ui.tab === 'you' && Q.ui.sub) { Q.ui.sub = null; stopBreath(); Q.render(); return; }
      if (Q.ui.tab !== 'today') { goTab('today'); return; }
      if (App.exitApp) App.exitApp();
    });
  }
  document.addEventListener('pointerdown', () => Q.sfx && Q.sfx('noop'), { once: true });

  Q.render();
  if (!Q.S.hero.onboarded) Q.startOnboarding(); else onOpen();
  Q.checkTimer();
  if (Q.S.settings.remindersOn) Q.rescheduleNotifications();
  if ('serviceWorker' in navigator && !Q.isNative() && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { /* optional */ });
  window.__Q = Q;
})(window.Q);
