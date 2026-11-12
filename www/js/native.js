(function (E) {
  'use strict';
  const { esc, ic } = E;
  const S = () => E.S;
  const P = () => (window.Capacitor && window.Capacitor.Plugins) || {};
  E.native = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  // ================= reminders =================
  E.askNotify = async () => { const ln = P().LocalNotifications; if (!ln) return true; try { let p = await ln.checkPermissions(); if (p.display !== 'granted') p = await ln.requestPermissions(); return p.display === 'granted'; } catch (e) { return false; } };
  const at = (d, m) => { const x = E.parse(d); x.setHours(0, 0, 0, 0); return new Date(x.getTime() + m * 60000); };
  E.buildReminders = () => {
    const out = [], now = E.now(), t = E.today(), st = S().settings;
    if (!st.reminders) return out;
    const nid = k => 1000 + (E.hash(k) % 2000000000);
    const push = (k, title, body, when) => { if (when > now) out.push({ id: nid(k), title, body, at: when }); };
    for (let i = 0; i < 7; i++) {
      const d = E.add(t, i);
      if (E.started(d)) {
        const wake = E.min(E.wakeOf(d));
        push('am' + d, i === 0 && E.ember().dimmed ? 'Relight your ember today' : 'Good morning ☀️', 'Tap to see how you feel and what\'s first today.', at(d, wake + 2));
        for (const it of E.planDay(d).items) {
          if (it.kind !== 'habit' || it.id === 'wake' || it.id === 'nophone' || it.state === 'done' || it.state === 'mini') continue;
          const h = it.h; if (at(d, it.t) <= now) continue;
          push('h' + h.id + d, it.title, h.min ? `Hard day? ${h.min}` : 'Tap to tick it off.', at(d, h.id === 'sleep' ? it.t - 30 : it.t));
        }
        const sc = E.dayScore(d);
        if (!(i === 0 && sc.p >= E.KEEP)) push('ev' + d, 'Your ember needs you tonight', i === 0 ? `${sc.done + sc.mini}/${sc.due} done. A few small versions keep it lit.` : 'Check what\'s left before the day ends.', at(d, E.min(st.evening || '22:30')));
        push('jr' + d, 'Close your day', 'One win, one lesson, one thing for tomorrow.', at(d, E.min(E.sleepOf(d)) < 360 ? E.min(E.sleepOf(d)) + 1440 - 45 : E.min(E.sleepOf(d)) - 45));
      }
      for (const a of E.agenda(d)) {
        if (a.kind === 'block' || a.kind === 'sub') continue;
        const when = a.t != null ? at(d, a.t) : at(d, 9 * 60);
        const title = a.kind === 'task' ? a.title : a.title;
        push(a.kind + a.id + d + 'a', `Tomorrow: ${title}`, a.t != null ? `At ${E.time12(E.hm(a.t))}` : 'Tomorrow', new Date(when - 864e5 + (a.t == null ? 11 * 36e5 : 0)));
        push(a.kind + a.id + d + 'b', a.t != null ? `In 2 hours: ${title}` : `Today: ${title}`, a.t != null ? `At ${E.time12(E.hm(a.t))}` : 'Don\'t forget', a.t != null ? new Date(when - 2 * 36e5) : when);
      }
    }
    const fn = S().focusNow; if (fn && fn.paused == null) push('focus' + fn.end, 'Focus session finished', `${fn.mins} minutes on ${fn.label}. Open Ember to log it.`, new Date(fn.end));
    for (const s of S().money.subs) { if (E.diff(s.next, t) > 8) continue; push('s' + s.id + s.next + 'a', `${s.name} renews tomorrow`, E.amtTxt(s.amt, s.cur), at(E.add(s.next, -1), 19 * 60)); push('s' + s.id + s.next + 'b', `${s.name} renews today`, `${E.amtTxt(s.amt, s.cur)} · mark it paid in Money`, at(s.next, 10 * 60)); }
    const sal = S().money.salary;
    if (sal && sal.day) { const p = E.parse(t), d = E.nextOcc(E.ymd(new Date(p.getFullYear(), p.getMonth(), sal.day)), 'monthly', t); if (d && E.diff(d, t) <= 7) push('pay' + d, 'Payday 💰', 'Log your salary in Money.', at(d, 18 * 60)); }
    for (const c of S().courses) if (c.deadline && c.done < c.total && E.diff(c.deadline, t) <= 7) { push('c' + c.id + 'a', `Course due tomorrow: ${c.n}`, `${c.total - c.done} ${c.unit} left`, at(E.add(c.deadline, -1), 19 * 60)); }
    return out.sort((a, b) => a.at - b.at).slice(0, 220);
  };
  let busy = false, again = false;
  E.schedule = async () => {
    const ln = P().LocalNotifications; if (!ln) return;
    if (busy) { again = true; return; } busy = true;
    try {
      const pend = await ln.getPending(); const old = (pend.notifications || []).map(n => ({ id: n.id }));
      if (old.length) await ln.cancel({ notifications: old });
      const list = E.buildReminders();
      if (list.length) await ln.schedule({ notifications: list.map(n => ({ id: n.id, title: n.title, body: n.body, schedule: { at: n.at, allowWhileIdle: true }, smallIcon: 'ic_stat_ember', iconColor: '#D9905C' })) });
    } catch (e) { console.warn('reminders', e); }
    busy = false; if (again) { again = false; E.schedule(); }
  };

  // ================= widgets =================
  E.widgetData = () => {
    const t = E.today(), started = E.started(t), em = E.ember(), sc = E.dayScore(t), T = E.targets(), f = E.dayFood(t), n = E.nextUp();
    const habits = started ? E.dayHabits(t).slice(0, 8).map(h => { const v = E.log(t, h.id), st = E.hState(h, t); return { id: h.id, name: E.hName(h, t), type: h.type, count: typeof v === 'number' ? v : st === 'done' ? h.target : 0, target: h.target, step: h.step || 1, done: st === 'done' || st === 'mini' }; }) : [];
    return { date: t, started, start: S().profile.start, streak: em.streak, done: sc.done + sc.mini, total: sc.due, habits,
      cal: { target: T.kcal, eaten: f.k, protein: f.p, proteinTarget: T.p },
      next: n ? { title: n.title, time: E.time12(E.hm(n.t)), kind: n.kind === 'habit' ? 'Habit' : n.kind === 'meal' ? 'Meal' : n.kind === 'task' ? 'Task' : 'Date' } : null,
      quote: E.quoteOf(t), quoteCat: em.streak ? `${em.streak}-day fire` : 'Ember' };
  };
  let wT = null;
  E.pushWidgets = () => { const wb = P().WidgetBridge; if (!wb) return; clearTimeout(wT); wT = setTimeout(() => { try { wb.update({ data: JSON.stringify(E.widgetData()) }); } catch (e) { /* ignore */ } }, 300); };
  E.pullTicks = async () => {
    const wb = P().WidgetBridge; if (!wb) return;
    let r; try { r = await wb.pullTicks(); } catch (e) { return; }
    const ticks = (r && r.ticks) || [];
    for (const k of ticks) {
      const h = S().habits.find(x => x.id === k.id); if (!h || !k.date) continue;
      if (h.type === 'count') { const v = E.log(k.date, h.id), n = (typeof v === 'number' ? v : 0) + (k.delta || 0); E.setLog(k.date, h.id, Math.max(0, n) || null); }
      else E.setLog(k.date, h.id, k.done ? true : null);
    }
    if (ticks.length) { E.save(); E.render(); }
  };

  // ================= phone calendar (Google Calendar syncs it) =================
  const PC = () => P().PhoneCalendar;
  const RR = { weekly: 'FREQ=WEEKLY', monthly: 'FREQ=MONTHLY', yearly: 'FREQ=YEARLY' };
  const startMs = e => { const d = E.parse(e.date); if (e.time) { const m = E.min(e.time); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d.getTime(); } return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
  E.calPush = async e => { const p = PC(); if (!p || !S().cal.on) return; try { await p.upsert({ key: 'ev:' + e.id, title: e.title, note: e.note || '', start: startMs(e), allDay: !e.time, rrule: RR[e.repeat] || '' }); } catch (x) { /* ignore */ } E.pullCal(); };
  E.calRemove = async id => { const p = PC(); if (!p || !S().cal.on) return; try { await p.remove({ key: 'ev:' + id }); } catch (x) { /* ignore */ } };
  E.ui.phoneEv = [];
  E.pullCal = async () => {
    const p = PC(); if (!p || !S().cal.on) return;
    try {
      const from = E.parse(E.today()).getTime(), r = await p.list({ from, to: from + 30 * 864e5 });
      E.ui.phoneEv = (r.events || []).map(e => { const d = new Date(e.begin); return { title: e.title || '(no title)', date: e.allDay ? new Date(d.getTime() + d.getTimezoneOffset() * 6e4 + 12 * 36e5).toISOString().slice(0, 10) : E.ymd(d), time: e.allDay ? null : E.pad(d.getHours()) + ':' + E.pad(d.getMinutes()) }; });
      E.ver++; if (E.ui.tab === 'plan' || E.ui.tab === 'today') E.render();
    } catch (x) { /* ignore */ }
  };
  E.calCard = () => {
    if (!PC()) return '';
    if (!S().cal.on) return `<section class="card" style="margin-top:14px"><div class="row"><div class="ico" style="--c:var(--slate)">${ic('calendar-days')}</div><div class="grow"><div class="card-t">Connect Google Calendar</div><div class="small muted">See your calendar here; your Ember dates appear there.</div></div></div><button class="btn ghost wide" style="margin-top:12px" data-a="cal-on">Connect</button></section>`;
    const ev = E.ui.phoneEv.slice(0, 12);
    return E.secH('From your calendar') + `<div class="list">${ev.map(e => E.item({ icon: 'calendar', sm: true, c: 'var(--slate)', t: esc(e.title), s: `${E.rel(e.date)}${e.time ? ' · ' + E.time12(e.time) : ''}` })).join('') || '<p class="empty">Nothing in the next 30 days.</p>'}</div>`;
  };
  E.A['cal-on'] = async () => {
    const p = PC(); if (!p) { E.toast('This works in the phone app'); return; }
    if (S().cal.on) { E.confirm('Disconnect calendar?', 'Ember stops reading your calendar. Dates already added stay there.', 'Disconnect', () => { S().cal.on = false; E.ui.phoneEv = []; E.save(); E.render(); }); return; }
    const r = await p.access().catch(() => ({ granted: false }));
    if (!r.granted) { E.toast('Calendar permission was not given'); return; }
    S().cal.on = true; E.prepDone('cal'); E.save();
    for (const e of S().events) await E.calPush(e);
    await E.pullCal(); E.close(true); E.toast('Calendar connected'); E.render();
  };

  // ================= lifecycle =================
  E.afterSave = () => { E.pushWidgets(); E.schedule(); };
  E.onResume = () => { E.focusResume(); E.rollSubs(); E.autoMoney(E.today()); E.pullTicks(); E.healthSync(); E.pullCal(); E.render(); E.pushWidgets(); };
  const App = P().App;
  if (App && App.addListener) {
    App.addListener('resume', () => E.onResume());
    App.addListener('backButton', () => {
      if (E.$('#scan')) { E.A['scan-stop'](); return; }
      if (E.$('.scrim')) { E.close(); return; }
      if (E.$('#focus')) { E.A['focus-min'](); return; }
      if (E.ui.tab !== 'today') { E.go('today'); return; }
      if (App.exitApp) App.exitApp();
    });
  }
  let lastDay = E.today();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (E.today() !== lastDay) { lastDay = E.today(); E.ui.tday = null; E.ui.foodDay = null; } E.onResume(); } });
})(window.E);
